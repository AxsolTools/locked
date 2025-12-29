/**
 * Vesting Routes - Streamflow Integration
 * 
 * This module handles all token vesting operations using Streamflow's on-chain program.
 * Tokens are locked in Streamflow's program-controlled accounts, not custodial wallets.
 * 
 * Important: All vesting contract interactions are handled server-side
 * to keep implementation details hidden from browser inspect elements.
 */

import { Router, Request, Response } from 'express';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { getConnection } from '../utils/solanaClient';
import { getHouseWallet } from '../utils/solanaWallet';
import { getTokenBalance, invalidateCache } from '../utils/balanceService';
import { 
  StreamClient, 
  getBN, 
  ICreateStreamData,
  ICluster,
  Stream
} from '@streamflow/stream';

const router = Router();

// Initialize Streamflow client
let streamflowClient: StreamClient | null = null;

const getStreamflowClient = async (): Promise<StreamClient> => {
  if (!streamflowClient) {
    const connection = await getConnection();
    const cluster: ICluster = process.env.SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet' : 'devnet';
    
    streamflowClient = new StreamClient(
      cluster,
      undefined, // We'll pass the wallet per-transaction
      {
        commitment: 'confirmed',
      }
    );
  }
  return streamflowClient;
};

/**
 * GET /api/vesting/schedules/:walletAddress
 * Get all vesting schedules for a wallet
 */
router.get('/schedules/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const client = await getStreamflowClient();
    const connection = await getConnection();
    
    // Get all streams for this wallet (as recipient)
    const streams = await client.get({
      wallet: new PublicKey(walletAddress),
    });

    const schedules = Object.entries(streams).map(([streamId, stream]: [string, any]) => {
      const now = Date.now() / 1000; // Streamflow uses seconds
      const startTime = stream.start * 1000; // Convert to milliseconds
      const endTime = stream.end * 1000;
      const totalAmount = stream.depositedAmount / Math.pow(10, stream.tokenDecimals);
      const withdrawnAmount = stream.withdrawnAmount / Math.pow(10, stream.tokenDecimals);
      
      // Calculate vested amount
      let vestedAmount = 0;
      if (now >= stream.end) {
        vestedAmount = totalAmount;
      } else if (now > stream.start) {
        const elapsed = now - stream.start;
        const duration = stream.end - stream.start;
        vestedAmount = (totalAmount * elapsed) / duration;
      }
      
      const claimableAmount = Math.max(0, vestedAmount - withdrawnAmount);

      return {
        id: streamId,
        owner: stream.recipient,
        amount: totalAmount,
        startTime,
        endTime,
        claimedAmount: withdrawnAmount,
        vestedAmount,
        claimableAmount,
        status: stream.canceledAt ? 'cancelled' : (withdrawnAmount >= totalAmount ? 'completed' : 'active'),
        createdAt: new Date(startTime).toISOString(),
      };
    });

    res.json({
      success: true,
      schedules
    });
  } catch (error: any) {
    console.error('[VESTING] Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch vesting schedules' });
  }
});

/**
 * POST /api/vesting/create
 * Create a new vesting schedule using Streamflow
 * 
 * Duration is specified in SECONDS for maximum flexibility
 */
router.post('/create', async (req: Request, res: Response) => {
  const { 
    walletAddress, 
    amount, 
    durationSeconds, 
    signedMessage, 
    signature
  } = req.body;

  // Validate required fields
  if (!walletAddress || !amount || !durationSeconds || !signedMessage || !signature) {
    return res.status(400).json({ 
      error: 'Missing required fields: walletAddress, amount, durationSeconds, signedMessage, signature' 
    });
  }

  try {
    // Verify signature
    const messageBytes = new TextEncoder().encode(signedMessage);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    if (!nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Validate amount
    const lockAmount = parseFloat(amount);
    if (isNaN(lockAmount) || lockAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate duration in seconds
    const seconds = parseInt(durationSeconds);
    const maxSeconds = 10 * 365 * 24 * 60 * 60; // ~10 years in seconds
    if (isNaN(seconds) || seconds < 1 || seconds > maxSeconds) {
      return res.status(400).json({ 
        error: `Duration must be between 1 second and ${maxSeconds} seconds (~10 years)` 
      });
    }

    // Get the token mint from environment
    const tokenMint = process.env.LOCKED_TOKEN_MINT;
    const tokenDecimals = parseInt(process.env.TOKEN_DECIMALS || '6');
    if (!tokenMint) {
      return res.status(500).json({ error: 'Token mint not configured' });
    }

    // Check user's ON-CHAIN token balance
    invalidateCache(walletAddress);
    const tokenBalance = await getTokenBalance(walletAddress, tokenMint);
    
    console.log('[VESTING] User balance check:', walletAddress, 'has', tokenBalance.balance, 'needs', lockAmount);
    
    if (tokenBalance.balance < lockAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: lockAmount,
        available: tokenBalance.balance
      });
    }

    // Get user's keypair from storage (they registered it earlier)
    const { getStoredWallet } = await import('../utils/walletService');
    const userKeypair = await getStoredWallet(walletAddress);
    
    if (!userKeypair) {
      return res.status(400).json({ 
        error: 'Wallet not registered. Please reconnect your wallet.' 
      });
    }

    // Initialize Streamflow client
    const client = await getStreamflowClient();
    const connection = await getConnection();
    
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const endTime = now + seconds;

    // Create stream data
    const createStreamParams: ICreateStreamData = {
      recipient: new PublicKey(walletAddress), // User is the recipient
      tokenId: new PublicKey(tokenMint),
      start: now,
      amount: getBN(lockAmount, tokenDecimals), // Convert to base units
      period: 1, // Continuous vesting (1 second intervals)
      cliff: 0, // No cliff
      cliffAmount: getBN(0, tokenDecimals),
      amountPerPeriod: getBN(lockAmount / seconds, tokenDecimals), // Linear vesting
      name: `Lock ${lockAmount}`,
      canTopup: false,
      cancelableBySender: false, // Cannot be cancelled
      cancelableByRecipient: false,
      transferableBySender: false,
      transferableByRecipient: false,
      automaticWithdrawal: false,
      withdrawalFrequency: 0,
      partner: undefined,
    };

    console.log('[VESTING] Creating Streamflow stream for', walletAddress, 'amount:', lockAmount, 'duration:', seconds, 'seconds');

    // Create the stream (this locks the tokens on-chain)
    const { ixs, tx, metadata } = await client.create(
      createStreamParams,
      {
        sender: userKeypair, // User signs and pays
      }
    );

    console.log('[VESTING] Stream created successfully, ID:', metadata.id);
    console.log('[VESTING] Transaction signature:', tx);

    // Invalidate cache
    invalidateCache(walletAddress);
    const updatedBalance = await getTokenBalance(walletAddress, tokenMint);

    res.json({
      success: true,
      vestingId: metadata.id,
      signature: tx,
      txSignature: tx,
      message: 'Tokens locked successfully',
      schedule: {
        id: metadata.id,
        amount: lockAmount,
        startTime: now * 1000,
        endTime: endTime * 1000,
        durationSeconds: seconds,
        releaseDate: new Date(endTime * 1000).toISOString()
      },
      newBalance: updatedBalance.balance
    });
  } catch (error: any) {
    console.error('[VESTING] Error creating vesting schedule:', error);
    res.status(500).json({ 
      error: 'Failed to create vesting schedule',
      details: error.message 
    });
  }
});

/**
 * POST /api/vesting/claim
 * Claim vested tokens from Streamflow
 */
router.post('/claim', async (req: Request, res: Response) => {
  const { walletAddress, vestingId, signedMessage, signature } = req.body;

  if (!walletAddress || !vestingId || !signedMessage || !signature) {
    return res.status(400).json({ 
      error: 'Missing required fields: walletAddress, vestingId, signedMessage, signature' 
    });
  }

  try {
    // Verify signature
    const messageBytes = new TextEncoder().encode(signedMessage);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    if (!nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Get user's keypair from storage
    const { getStoredWallet } = await import('../utils/walletService');
    const userKeypair = await getStoredWallet(walletAddress);
    
    if (!userKeypair) {
      return res.status(400).json({ 
        error: 'Wallet not registered. Please reconnect your wallet.' 
      });
    }

    // Initialize Streamflow client
    const client = await getStreamflowClient();
    
    // Get stream details
    const stream = await client.getOne({ id: vestingId });
    
    if (!stream) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    // Verify ownership
    if (stream.recipient !== walletAddress) {
      return res.status(403).json({ error: 'You do not own this vesting schedule' });
    }

    const tokenDecimals = stream.tokenDecimals || 6;
    const now = Date.now() / 1000;
    
    // Calculate claimable amount
    let vestedAmount = 0;
    if (now >= stream.end) {
      vestedAmount = stream.depositedAmount;
    } else if (now > stream.start) {
      const elapsed = now - stream.start;
      const duration = stream.end - stream.start;
      vestedAmount = Math.floor((stream.depositedAmount * elapsed) / duration);
    }
    
    const claimableAmount = vestedAmount - stream.withdrawnAmount;

    if (claimableAmount <= 0) {
      return res.status(400).json({ 
        error: 'No tokens available to claim',
        nextUnlockTime: stream.end * 1000
      });
    }

    console.log('[VESTING] Withdrawing', claimableAmount / Math.pow(10, tokenDecimals), 'tokens from stream', vestingId);

    // Withdraw from stream
    const { ixs, tx } = await client.withdraw(
      {
        id: vestingId,
        amount: getBN(claimableAmount / Math.pow(10, tokenDecimals), tokenDecimals),
      },
      {
        invoker: userKeypair, // User signs the withdrawal
      }
    );

    console.log('[VESTING] Withdrawal successful, tx:', tx);

    // Invalidate balance cache
    const tokenMint = process.env.LOCKED_TOKEN_MINT;
    if (tokenMint) {
      invalidateCache(walletAddress);
    }

    const claimedAmountUI = claimableAmount / Math.pow(10, tokenDecimals);
    const totalWithdrawnUI = (stream.withdrawnAmount + claimableAmount) / Math.pow(10, tokenDecimals);
    const totalAmountUI = stream.depositedAmount / Math.pow(10, tokenDecimals);

    res.json({
      success: true,
      claimedAmount: claimedAmountUI,
      totalClaimed: totalWithdrawnUI,
      remainingVested: totalAmountUI - totalWithdrawnUI,
      txSignature: tx,
      status: totalWithdrawnUI >= totalAmountUI ? 'completed' : 'active'
    });
  } catch (error: any) {
    console.error('[VESTING] Error claiming vested tokens:', error);
    res.status(500).json({ 
      error: 'Failed to claim vested tokens',
      details: error.message 
    });
  }
});

/**
 * GET /api/vesting/schedule/:vestingId
 * Get a specific vesting schedule
 */
router.get('/schedule/:vestingId', async (req: Request, res: Response) => {
  const { vestingId } = req.params;

  try {
    const client = await getStreamflowClient();
    const stream = await client.getOne({ id: vestingId });
    
    if (!stream) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    const tokenDecimals = stream.tokenDecimals || 6;
    const now = Date.now() / 1000;
    const totalAmount = stream.depositedAmount / Math.pow(10, tokenDecimals);
    const withdrawnAmount = stream.withdrawnAmount / Math.pow(10, tokenDecimals);
    
    // Calculate vested amount
    let vestedAmount = 0;
    if (now >= stream.end) {
      vestedAmount = totalAmount;
    } else if (now > stream.start) {
      const elapsed = now - stream.start;
      const duration = stream.end - stream.start;
      vestedAmount = (totalAmount * elapsed) / duration;
    }
    
    const claimableAmount = Math.max(0, vestedAmount - withdrawnAmount);

    res.json({
      success: true,
      schedule: {
        id: vestingId,
        owner: stream.recipient,
        amount: totalAmount,
        startTime: stream.start * 1000,
        endTime: stream.end * 1000,
        claimedAmount: withdrawnAmount,
        vestedAmount,
        claimableAmount,
        progress: (vestedAmount / totalAmount) * 100,
        status: stream.canceledAt ? 'cancelled' : (withdrawnAmount >= totalAmount ? 'completed' : 'active'),
        createdAt: new Date(stream.start * 1000).toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[VESTING] Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch vesting schedule' });
  }
});

/**
 * GET /api/vesting/stats
 * Get overall vesting statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Note: Streamflow doesn't have a global stats endpoint
    // We'd need to aggregate across all known users
    // For now, return basic stats
    res.json({
      success: true,
      stats: {
        totalLocked: 0,
        totalVested: 0,
        activeSchedules: 0,
        completedSchedules: 0,
        totalSchedules: 0
      }
    });
  } catch (error: any) {
    console.error('[VESTING] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch vesting statistics' });
  }
});

// No need for loadVestingSchedules - Streamflow stores everything on-chain
export const loadVestingSchedules = async (): Promise<void> => {
  console.log('[VESTING] Using Streamflow on-chain vesting - no local storage needed');
};

export default router;
