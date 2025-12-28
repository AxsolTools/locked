/**
 * Transaction Processing Service
 * 
 * Handles rapid token transfers for the dice game:
 * - Transfer from user to house (on loss)
 * - Transfer from house to user (on win)
 * - Retry logic for failed transactions
 * - Transaction confirmation tracking
 */

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TokenAccountNotFoundError,
  getMint
} from '@solana/spl-token';
import { storage } from '../storage';
import { decryptPrivateKey } from '../fileStorage';
import { getHouseWallet } from './solanaWallet';
import { invalidateCache, invalidateTokenCache } from './balanceService';
import bs58 from 'bs58';

// Transaction configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CONFIRMATION_TIMEOUT_MS = 30000;
const PRIORITY_FEE_MICROLAMPORTS = 50000; // Priority fee for faster confirmation

interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
  attempts: number;
}

type ParsedTokenAccountInfo = {
  pubkey: PublicKey;
  rawAmount: bigint;
  decimals: number;
};

/**
 * Get RPC connection with confirmed commitment
 */
function getConnection(): Connection {
  const heliusApiKey = process.env.HELIUS_API_KEY;
  const rpcUrl = process.env.HELIUS_RPC_URL || 
    (heliusApiKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}` : null) ||
    process.env.SOLANA_RPC_URLS?.split(',')[0] ||
    'https://api.mainnet-beta.solana.com';
  
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: CONFIRMATION_TIMEOUT_MS
  });
}

/**
 * Get configured token mint
 */
function getTokenMint(): PublicKey | null {
  const mint = process.env.LOCKED_TOKEN_MINT;
  if (!mint) return null;
  return new PublicKey(mint);
}

/**
 * Get token decimals
 */
function getTokenDecimals(): number {
  return parseInt(process.env.TOKEN_DECIMALS || '9', 10);
}

/**
 * Find the best source token account for a given owner+mint.
 * IMPORTANT: Do not assume the source is the ATA; wallets may hold funds in non-ATA accounts.
 */
async function findSourceTokenAccount(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  requiredRawAmount: bigint,
  fallbackDecimals: number
): Promise<{ source: PublicKey; decimals: number } | null> {
  const resp = await connection.getParsedTokenAccountsByOwner(owner, { mint });

  const candidates: ParsedTokenAccountInfo[] = [];
  for (const item of resp.value) {
    const parsed = (item.account.data as any)?.parsed;
    const tokenAmount = parsed?.info?.tokenAmount;
    if (!tokenAmount?.amount) continue;

    const rawAmount = BigInt(tokenAmount.amount);
    const decimals = typeof tokenAmount.decimals === 'number' ? tokenAmount.decimals : fallbackDecimals;

    candidates.push({
      pubkey: item.pubkey,
      rawAmount,
      decimals
    });
  }

  if (candidates.length === 0) return null;

  // Prefer an account that can cover the amount. If multiple, choose the largest (reduces chance of dust/close issues).
  const sufficient = candidates
    .filter(c => c.rawAmount >= requiredRawAmount)
    .sort((a, b) => (a.rawAmount > b.rawAmount ? -1 : a.rawAmount < b.rawAmount ? 1 : 0));

  if (sufficient.length > 0) {
    return { source: sufficient[0].pubkey, decimals: sufficient[0].decimals };
  }

  // No single account covers it (rare, but possible). We don't implement multi-account aggregation transfers here.
  // Caller should fail with a clear error.
  return null;
}

/**
 * Get user's keypair from stored encrypted private key
 */
async function getUserKeypair(walletAddress: string): Promise<Keypair | null> {
  try {
    const storedWallet = await storage.getUserWallet(walletAddress);
    if (!storedWallet) {
      console.error(`No stored wallet found for ${walletAddress}`);
      return null;
    }
    
    const privateKey = decryptPrivateKey(storedWallet.encryptedPrivateKey);
    
    // Try to decode as base58 first
    try {
      const decoded = bs58.decode(privateKey);
      return Keypair.fromSecretKey(decoded);
    } catch {
      // Try as JSON array
      try {
        const parsed = JSON.parse(privateKey);
        return Keypair.fromSecretKey(Uint8Array.from(parsed));
      } catch {
        console.error('Failed to decode stored private key');
        return null;
      }
    }
  } catch (error) {
    console.error(`Error getting user keypair for ${walletAddress}:`, error);
    return null;
  }
}

/**
 * Detect if a token uses Token-2022 or standard SPL Token program
 */
async function getTokenProgramId(connection: Connection, mint: PublicKey): Promise<PublicKey> {
  try {
    const mintInfo = await connection.getAccountInfo(mint);
    if (mintInfo && mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      console.log(`[TX] Token ${mint.toBase58()} uses Token-2022 program`);
      return TOKEN_2022_PROGRAM_ID;
    }
  } catch (error) {
    console.log(`[TX] Error detecting token program, defaulting to SPL Token:`, error);
  }
  return TOKEN_PROGRAM_ID;
}

/**
 * Ensure token account exists, create if not
 */
async function ensureTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction?: TransactionInstruction }> {
  // Detect which token program this mint uses
  const tokenProgramId = await getTokenProgramId(connection, mint);
  
  // Get ATA with correct program
  const tokenAccount = await getAssociatedTokenAddress(
    mint, 
    owner, 
    false, // allowOwnerOffCurve
    tokenProgramId
  );
  
  try {
    await getAccount(connection, tokenAccount, 'confirmed', tokenProgramId);
    return { address: tokenAccount };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      // Token account doesn't exist, create instruction with correct program
      const instruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        tokenAccount,
        owner,
        mint,
        tokenProgramId
      );
      return { address: tokenAccount, instruction };
    }
    throw error;
  }
}

/**
 * Build transfer transaction with priority fee
 */
async function buildTransferTransaction(
  connection: Connection,
  fromKeypair: Keypair,
  toAddress: PublicKey,
  amount: number,
  tokenMint: PublicKey,
  decimals: number
): Promise<Transaction> {
  const transaction = new Transaction();
  
  // Add priority fee for faster confirmation
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: PRIORITY_FEE_MICROLAMPORTS
    })
  );
  
  // Ensure destination token account exists
  const { address: destTokenAccount, instruction: createAccountInstr } = 
    await ensureTokenAccount(connection, fromKeypair, tokenMint, toAddress);
  
  if (createAccountInstr) {
    transaction.add(createAccountInstr);
  }
  
  // Convert amount to raw units
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

  // Pick a valid source token account (not necessarily the ATA)
  const sourceInfo = await findSourceTokenAccount(
    connection,
    fromKeypair.publicKey,
    tokenMint,
    rawAmount,
    decimals
  );

  if (!sourceInfo) {
    throw new Error(
      `No token account with sufficient balance found for owner=${fromKeypair.publicKey.toBase58()} mint=${tokenMint.toBase58()}`
    );
  }

  const sourceTokenAccount = sourceInfo.source;
  
  // Detect token program for transfer instruction
  const tokenProgramId = await getTokenProgramId(connection, tokenMint);
  
  // Add transfer instruction with correct program
  transaction.add(
    createTransferInstruction(
      sourceTokenAccount,
      destTokenAccount,
      fromKeypair.publicKey,
      rawAmount,
      [], // multiSigners
      tokenProgramId
    )
  );
  
  return transaction;
}

/**
 * Send and confirm transaction with retry logic
 */
async function sendWithRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  maxRetries: number = MAX_RETRIES
): Promise<TransferResult> {
  let lastError: Error | null = null;
  let attempts = 0;
  
  for (let i = 0; i < maxRetries; i++) {
    attempts++;
    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signers[0].publicKey;
      
      // Sign and send
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers,
        {
          commitment: 'confirmed',
          maxRetries: 2
        }
      );
      
      return {
        success: true,
        signature,
        attempts
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Transaction attempt ${attempts} failed:`, error.message);
      
      // Check if error is retryable
      const isRetryable = 
        error.message?.includes('blockhash') ||
        error.message?.includes('timeout') ||
        error.message?.includes('rate limit');
      
      if (!isRetryable || i === maxRetries - 1) {
        break;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Transaction failed after retries',
    attempts
  };
}

/**
 * Transfer tokens from user to house wallet (when user loses bet)
 */
export async function transferFromUser(
  userWalletAddress: string,
  amount: number,
  tokenMint?: string
): Promise<TransferResult> {
  try {
    const connection = getConnection();
    const mint = tokenMint ? new PublicKey(tokenMint) : getTokenMint();
    const decimals = getTokenDecimals();
    
    if (!mint) {
      return { success: false, error: 'Token mint not configured', attempts: 0 };
    }
    
    // Get user's keypair
    const userKeypair = await getUserKeypair(userWalletAddress);
    if (!userKeypair) {
      return { success: false, error: 'User wallet not registered', attempts: 0 };
    }
    
    // Get house wallet address
    const houseKeypair = getHouseWallet();
    if (!houseKeypair) {
      return { success: false, error: 'House wallet not initialized', attempts: 0 };
    }
    
    // Build transaction
    const transaction = await buildTransferTransaction(
      connection,
      userKeypair,
      houseKeypair.publicKey,
      amount,
      mint,
      decimals
    );
    
    // Send with retry
    const result = await sendWithRetry(connection, transaction, [userKeypair]);
    
    // Invalidate caches
    if (result.success) {
      invalidateTokenCache(userWalletAddress, mint.toBase58());
      invalidateTokenCache(houseKeypair.publicKey.toBase58(), mint.toBase58());
      
      // Update wallet last used
      await storage.updateWalletLastUsed(userWalletAddress);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error in transferFromUser:', error);
    return { success: false, error: error.message, attempts: 0 };
  }
}

/**
 * Transfer tokens from house to user wallet (when user wins bet)
 */
export async function transferToUser(
  userWalletAddress: string,
  amount: number,
  tokenMint?: string
): Promise<TransferResult> {
  try {
    const connection = getConnection();
    const mint = tokenMint ? new PublicKey(tokenMint) : getTokenMint();
    const decimals = getTokenDecimals();
    
    if (!mint) {
      return { success: false, error: 'Token mint not configured', attempts: 0 };
    }
    
    // Get house keypair
    const houseKeypair = getHouseWallet();
    if (!houseKeypair) {
      return { success: false, error: 'House wallet not initialized', attempts: 0 };
    }
    
    const userPubkey = new PublicKey(userWalletAddress);
    
    // Build transaction
    const transaction = await buildTransferTransaction(
      connection,
      houseKeypair,
      userPubkey,
      amount,
      mint,
      decimals
    );
    
    // Send with retry
    const result = await sendWithRetry(connection, transaction, [houseKeypair]);
    
    // Invalidate caches
    if (result.success) {
      invalidateTokenCache(userWalletAddress, mint.toBase58());
      invalidateTokenCache(houseKeypair.publicKey.toBase58(), mint.toBase58());
    }
    
    return result;
  } catch (error: any) {
    console.error('Error in transferToUser:', error);
    return { success: false, error: error.message, attempts: 0 };
  }
}

/**
 * Transfer tokens to any destination address (for withdrawals)
 */
export async function transferToDestination(
  fromWalletAddress: string,
  destinationAddress: string,
  amount: number,
  tokenMint?: string
): Promise<TransferResult> {
  try {
    const connection = getConnection();
    const mint = tokenMint ? new PublicKey(tokenMint) : getTokenMint();
    const decimals = getTokenDecimals();
    
    if (!mint) {
      return { success: false, error: 'Token mint not configured', attempts: 0 };
    }
    
    // Validate destination address
    let destPubkey: PublicKey;
    try {
      destPubkey = new PublicKey(destinationAddress);
    } catch {
      return { success: false, error: 'Invalid destination address', attempts: 0 };
    }
    
    // Get user's keypair
    const userKeypair = await getUserKeypair(fromWalletAddress);
    if (!userKeypair) {
      return { success: false, error: 'User wallet not registered', attempts: 0 };
    }
    
    // Build transaction
    const transaction = await buildTransferTransaction(
      connection,
      userKeypair,
      destPubkey,
      amount,
      mint,
      decimals
    );
    
    // Send with retry
    const result = await sendWithRetry(connection, transaction, [userKeypair]);
    
    // Invalidate caches
    if (result.success) {
      invalidateTokenCache(fromWalletAddress, mint.toBase58());
      invalidateTokenCache(destinationAddress, mint.toBase58());
      
      // Update wallet last used
      await storage.updateWalletLastUsed(fromWalletAddress);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error in transferToDestination:', error);
    return { success: false, error: error.message, attempts: 0 };
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string): Promise<{
  confirmed: boolean;
  slot?: number;
  error?: string;
}> {
  try {
    const connection = getConnection();
    const status = await connection.getSignatureStatus(signature);
    
    if (!status.value) {
      return { confirmed: false };
    }
    
    if (status.value.err) {
      return { 
        confirmed: false, 
        error: JSON.stringify(status.value.err) 
      };
    }
    
    const confirmed = status.value.confirmationStatus === 'confirmed' ||
                      status.value.confirmationStatus === 'finalized';
    
    return { 
      confirmed, 
      slot: status.value.slot 
    };
  } catch (error: any) {
    console.error('Error getting transaction status:', error);
    return { confirmed: false, error: error.message };
  }
}

/**
 * Get house wallet balance
 * Uses the same approach as balanceService - sum all token accounts for the mint
 */
export async function getHouseBalance(tokenMint?: string): Promise<number> {
  try {
    const houseKeypair = getHouseWallet();
    if (!houseKeypair) {
      console.log('[TX] House wallet not initialized for balance check');
      return 0;
    }
    
    const connection = getConnection();
    const mint = tokenMint ? new PublicKey(tokenMint) : getTokenMint();
    
    if (!mint) {
      console.log('[TX] Token mint not configured for house balance check');
      return 0;
    }
    
    // Use getParsedTokenAccountsByOwner to find ALL token accounts for this mint
    // This handles both standard SPL Token and Token-2022 accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      houseKeypair.publicKey,
      { mint }
    );
    
    let rawSum = 0n;
    let decimalsOnChain: number | null = null;
    
    for (const acc of tokenAccounts.value) {
      const parsed = (acc.account.data as any)?.parsed;
      const tokenAmount = parsed?.info?.tokenAmount;
      if (!tokenAmount?.amount) continue;
      rawSum += BigInt(tokenAmount.amount);
      if (typeof tokenAmount.decimals === 'number') {
        decimalsOnChain = tokenAmount.decimals;
      }
    }
    
    const finalDecimals = decimalsOnChain ?? getTokenDecimals();
    const balance = Number(rawSum.toString()) / Math.pow(10, finalDecimals);
    
    console.log(`[TX] House balance: ${balance} (${tokenAccounts.value.length} accounts, raw=${rawSum.toString()})`);
    
    return balance;
  } catch (error) {
    console.error('Error getting house balance:', error);
    return 0;
  }
}

/**
 * Check if house has sufficient balance for a payout
 */
export async function householdHasSufficientBalance(amount: number): Promise<boolean> {
  const balance = await getHouseBalance();
  return balance >= amount;
}

