/**
 * Vesting Routes - Server-side token vesting
 * 
 * This module handles all token vesting operations on the server side.
 * The actual vesting implementation is abstracted from the frontend.
 * 
 * Important: All vesting contract interactions are handled server-side
 * to keep implementation details hidden from browser inspect elements.
 */

import { Router, Request, Response } from 'express';
import { PublicKey, Transaction, SystemProgram, Keypair, Connection } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { storage } from '../storage';
import { getConnection, executeWithFailover } from '../utils/solanaClient';
import { getHouseWallet, isWalletServiceReady } from '../utils/solanaWallet';
import { getTokenBalance, invalidateCache } from '../utils/balanceService';
import { transferFromUser } from '../utils/transactionService';

const router = Router();

// Vesting schedule interface
interface VestingSchedule {
  id: string;
  owner: string;
  amount: number;
  startTime: number;
  endTime: number;
  claimedAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

// In-memory vesting schedules (persisted to storage)
let vestingSchedules: Map<string, VestingSchedule> = new Map();

/**
 * Load vesting schedules from storage on startup
 */
export const loadVestingSchedules = async (): Promise<void> => {
  try {
    // For now, we'll use a simple in-memory store
    // In production, this would be persisted to the database
    console.log('[VESTING] Vesting service initialized');
  } catch (error) {
    console.error('[VESTING] Error loading vesting schedules:', error);
  }
};

/**
 * Generate a unique vesting schedule ID
 */
const generateVestingId = (): string => {
  return `vest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Calculate vested amount based on schedule
 */
const calculateVestedAmount = (schedule: VestingSchedule): number => {
  const now = Date.now();
  
  if (now < schedule.startTime) {
    return 0;
  }
  
  if (now >= schedule.endTime) {
    return schedule.amount;
  }
  
  const totalDuration = schedule.endTime - schedule.startTime;
  const elapsed = now - schedule.startTime;
  const vestedRatio = elapsed / totalDuration;
  
  return Math.floor(schedule.amount * vestedRatio * 100) / 100;
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
    const userSchedules: VestingSchedule[] = [];
    
    vestingSchedules.forEach((schedule) => {
      if (schedule.owner === walletAddress) {
        // Calculate current vested amount
        const vestedAmount = calculateVestedAmount(schedule);
        const claimableAmount = vestedAmount - schedule.claimedAmount;
        
        userSchedules.push({
          ...schedule,
          vestedAmount,
          claimableAmount
        } as any);
      }
    });

    res.json({
      success: true,
      schedules: userSchedules
    });
  } catch (error: any) {
    console.error('[VESTING] Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch vesting schedules' });
  }
});

/**
 * POST /api/vesting/create
 * Create a new vesting schedule
 * 
 * Duration is specified in SECONDS for maximum flexibility
 * Examples:
 *   - 60 seconds = 1 minute
 *   - 3600 seconds = 1 hour
 *   - 86400 seconds = 1 day
 *   - 2592000 seconds = 30 days
 */
router.post('/create', async (req: Request, res: Response) => {
  const { 
    walletAddress, 
    amount, 
    durationSeconds, 
    signedMessage, 
    signature,
    releaseCondition 
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

    // Validate duration in seconds (minimum 1 second, maximum ~10 years)
    const seconds = parseInt(durationSeconds);
    const maxSeconds = 10 * 365 * 24 * 60 * 60; // ~10 years in seconds
    if (isNaN(seconds) || seconds < 1 || seconds > maxSeconds) {
      return res.status(400).json({ 
        error: `Duration must be between 1 second and ${maxSeconds} seconds (~10 years)` 
      });
    }

    // Get the token mint from environment
    const tokenMint = process.env.LOCKED_TOKEN_MINT;
    if (!tokenMint) {
      return res.status(500).json({ error: 'Token mint not configured' });
    }

    // Check user's ON-CHAIN token balance (not internal game balance)
    invalidateCache(walletAddress); // Ensure fresh balance
    const tokenBalance = await getTokenBalance(walletAddress, tokenMint);
    
    console.log('[VESTING] User balance check:', walletAddress, 'has', tokenBalance.balance, 'needs', lockAmount);
    
    if (tokenBalance.balance < lockAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: lockAmount,
        available: tokenBalance.balance
      });
    }

    // Transfer tokens from user to house wallet (lock them)
    const transferResult = await transferFromUser(walletAddress, lockAmount, tokenMint);
    
    if (!transferResult.success) {
      console.error('[VESTING] Token transfer failed:', transferResult.error);
      return res.status(500).json({ 
        error: 'Failed to lock tokens: ' + (transferResult.error || 'Transfer failed'),
        details: transferResult.error
      });
    }
    
    console.log('[VESTING] Tokens transferred to house wallet, tx:', transferResult.signature);

    // Create vesting schedule
    const now = Date.now();
    const vestingSchedule: VestingSchedule = {
      id: generateVestingId(),
      owner: walletAddress,
      amount: lockAmount,
      startTime: now,
      endTime: now + (seconds * 1000), // Convert seconds to milliseconds
      claimedAmount: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    vestingSchedules.set(vestingSchedule.id, vestingSchedule);

    // Log the vesting creation
    console.log('[VESTING] Created vesting schedule:', vestingSchedule.id, 'for', walletAddress, 'duration:', seconds, 'seconds');

    res.json({
      success: true,
      vestingId: vestingSchedule.id,
      signature: transferResult.signature,
      txSignature: transferResult.signature,
      message: 'Vesting schedule created successfully',
      schedule: {
        id: vestingSchedule.id,
        amount: vestingSchedule.amount,
        startTime: vestingSchedule.startTime,
        endTime: vestingSchedule.endTime,
        durationSeconds: seconds,
        releaseDate: new Date(vestingSchedule.endTime).toISOString()
      },
      newBalance
    });
  } catch (error: any) {
    console.error('[VESTING] Error creating vesting schedule:', error);
    res.status(500).json({ error: 'Failed to create vesting schedule' });
  }
});

/**
 * POST /api/vesting/claim
 * Claim vested tokens
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

    // Find the vesting schedule
    const schedule = vestingSchedules.get(vestingId);
    if (!schedule) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    // Verify ownership
    if (schedule.owner !== walletAddress) {
      return res.status(403).json({ error: 'You do not own this vesting schedule' });
    }

    // Check if already completed
    if (schedule.status === 'completed') {
      return res.status(400).json({ error: 'Vesting schedule already completed' });
    }

    // Calculate claimable amount
    const vestedAmount = calculateVestedAmount(schedule);
    const claimableAmount = vestedAmount - schedule.claimedAmount;

    if (claimableAmount <= 0) {
      return res.status(400).json({ 
        error: 'No tokens available to claim',
        nextUnlockTime: schedule.endTime
      });
    }

    // Update user's balance
    const currentBalance = await storage.getBalance(walletAddress);
    const newBalance = currentBalance + claimableAmount;
    await storage.setBalance(walletAddress, newBalance);

    // Update vesting schedule
    schedule.claimedAmount += claimableAmount;
    
    // Mark as completed if fully vested
    if (schedule.claimedAmount >= schedule.amount) {
      schedule.status = 'completed';
    }

    vestingSchedules.set(vestingId, schedule);

    console.log('[VESTING] Claimed', claimableAmount, 'tokens from', vestingId, 'for', walletAddress);

    res.json({
      success: true,
      claimedAmount,
      totalClaimed: schedule.claimedAmount,
      remainingVested: schedule.amount - schedule.claimedAmount,
      newBalance,
      status: schedule.status
    });
  } catch (error: any) {
    console.error('[VESTING] Error claiming vested tokens:', error);
    res.status(500).json({ error: 'Failed to claim vested tokens' });
  }
});

/**
 * GET /api/vesting/schedule/:vestingId
 * Get a specific vesting schedule
 */
router.get('/schedule/:vestingId', async (req: Request, res: Response) => {
  const { vestingId } = req.params;

  try {
    const schedule = vestingSchedules.get(vestingId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    const vestedAmount = calculateVestedAmount(schedule);
    const claimableAmount = vestedAmount - schedule.claimedAmount;

    res.json({
      success: true,
      schedule: {
        ...schedule,
        vestedAmount,
        claimableAmount,
        progress: (vestedAmount / schedule.amount) * 100
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
    let totalLocked = 0;
    let totalVested = 0;
    let activeSchedules = 0;
    let completedSchedules = 0;

    vestingSchedules.forEach((schedule) => {
      totalLocked += schedule.amount;
      totalVested += calculateVestedAmount(schedule);
      
      if (schedule.status === 'active') {
        activeSchedules++;
      } else if (schedule.status === 'completed') {
        completedSchedules++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalLocked,
        totalVested,
        activeSchedules,
        completedSchedules,
        totalSchedules: vestingSchedules.size
      }
    });
  } catch (error: any) {
    console.error('[VESTING] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch vesting statistics' });
  }
});

export default router;

