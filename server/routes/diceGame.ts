/**
 * Dice Game Routes - Solana Version
 * 
 * This module implements a provably fair dice game using balance-based betting.
 * Users deposit LOCKED tokens to their game balance, then bet against that balance.
 * 
 * Key fairness features:
 * 1. Server seed is generated and hashed before the bet
 * 2. Client seed is provided by the player
 * 3. Combined seeds determine the roll result
 * 4. Original server seed is revealed after roll for verification
 * 
 * Game mechanics:
 * - Players predict if a random number (0-999999.99) will be over/under their target
 * - Win chance is directly related to the target number
 * - Payouts are inversely proportional to win probability (minus house edge)
 */

import express from 'express';
import crypto from 'crypto';
import { storage } from '../storage';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { getBalance, addToBalance, deductFromBalance } from './balance';

const router = express.Router();

// Logger
const logger = {
  debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args),
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args)
};

// Token configuration from environment
const TOKEN_SYMBOL = process.env.LOCKED_TOKEN_SYMBOL || 'LOCKED';

// Define interfaces
interface Bet {
  id: string;
  walletAddress: string;
  amount: string;
  target: number;
  isOver: boolean;
  multiplier: number;
  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  date: string;
  rolled: boolean;
  result?: number;
  resultHash?: string;
  won?: boolean;
  profit?: string;
  verified?: boolean;
}

// Setup data directory and file path for persisting bets
const DATA_DIR = path.join(process.cwd(), 'data');
const BETS_FILE_PATH = path.join(DATA_DIR, 'dice_bets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize bets map - load from file if exists
let bets: Map<string, Bet> = new Map();

// Load bets from file on startup
function loadBetsFromFile() {
  try {
    if (fs.existsSync(BETS_FILE_PATH)) {
      const fileData = fs.readFileSync(BETS_FILE_PATH, 'utf8');
      const parsedData = JSON.parse(fileData);
      
      bets = new Map();
      parsedData.forEach((bet: Bet) => {
        if (bet && bet.id) {
          bets.set(bet.id, bet);
        }
      });
      
      console.log(`Loaded ${bets.size} bets from storage`);
    } else {
      console.log('No saved bets file found, starting fresh');
      bets = new Map();
    }
  } catch (error) {
    console.error('Error loading bets from file:', error);
    bets = new Map();
  }
}

// Save bets to file
function saveBetsToFile() {
  try {
    const betsArray = Array.from(bets.values());
    fs.writeFileSync(BETS_FILE_PATH, JSON.stringify(betsArray, null, 2));
  } catch (error) {
    console.error('Error saving bets to file:', error);
  }
}

// Load bets on module initialization
loadBetsFromFile();

// WebSocket server for live bets
let wss: WebSocketServer | null = null;
const connectedClients: Set<WebSocket> = new Set();

/**
 * Initialize WebSocket server for live bets
 */
export const initializeWebSocket = (server: http.Server) => {
  wss = new WebSocketServer({ 
    server,
    path: '/api/dice/live'
  });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to dice game live feed');
    connectedClients.add(ws);
    
    ws.send(JSON.stringify({ 
      type: 'info', 
      message: 'Connected to LOCKED Dice Game live feed'
    }));
    
    // Send recent bets to newly connected client
    try {
      const recentBets = Array.from(bets.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);
      
      const historicalBets = recentBets.map(bet => ({
        id: bet.id,
        address: bet.walletAddress,
        amount: bet.amount,
        target: bet.target,
        rollType: bet.isOver ? 'over' : 'under',
        timestamp: bet.date,
        result: bet.result,
        won: bet.won,
        profit: bet.profit,
        tokenSymbol: TOKEN_SYMBOL
      }));
      
      if (historicalBets.length > 0) {
        ws.send(JSON.stringify({
          type: 'historical_bets',
          bets: historicalBets
        }));
      }
    } catch (error) {
      console.error('Error sending historical bets:', error);
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    });
    
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    ws.on('close', () => {
      console.log('Client disconnected from dice game live feed');
      connectedClients.delete(ws);
      clearInterval(pingInterval);
    });
    
    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
      clearInterval(pingInterval);
    });
  });
  
  console.log('WebSocket server initialized for dice game live feed');
};

/**
 * Broadcast message to all connected clients
 */
const broadcastToClients = (data: any) => {
  if (!connectedClients.size) return;
  
  const message = JSON.stringify(data);
  
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Cryptographic functions for provably fair system
const generateServerSeed = () => crypto.randomBytes(32).toString('hex');
const generateBetId = () => crypto.randomBytes(16).toString('hex');

/**
 * Convert hash to a number between 0-999999.99
 */
const hexToNumber = (hash: string) => {
  const first8Chars = hash.slice(0, 8);
  const decimal = parseInt(first8Chars, 16);
  return decimal % 100000000 / 100;
};

/**
 * Calculate profit based on bet amount and multiplier
 */
const calculateProfit = (betAmount: number, multiplier: number) => {
  return betAmount * multiplier;
};

/**
 * Apply house edge to multiplier calculation
 */
const applyHouseEdge = (winChance: number, houseEdge: number) => {
  const fairMultiplier = 100 / winChance;
  return fairMultiplier * (1 - houseEdge / 100);
};

/**
 * GET /api/dice/config
 * Get dice game configuration
 */
router.get('/config', async (req, res) => {
  try {
    const defaultConfig = {
      enabled: process.env.DICE_ENABLED !== 'false',
      minBetAmount: process.env.MIN_BET_AMOUNT || "1",
      maxBetAmount: process.env.MAX_BET_AMOUNT || "10000",
      decimalPlaces: 2,
      payoutEnabled: true,
      houseEdge: parseFloat(process.env.HOUSE_EDGE || "1.5")
    };
    
    try {
      const systemConfig = await storage.getSystemConfig();
      
      if (!systemConfig || !systemConfig.diceGameConfig) {
        return res.json(defaultConfig);
      }
      
      return res.json({
        enabled: systemConfig.diceGameConfig.enabled,
        minBetAmount: systemConfig.diceGameConfig.minBetAmount,
        maxBetAmount: systemConfig.diceGameConfig.maxBetAmount,
        decimalPlaces: systemConfig.diceGameConfig.decimalPlaces,
        payoutEnabled: systemConfig.diceGameConfig.payoutEnabled,
        houseEdge: systemConfig.diceGameConfig.houseEdge
      });
    } catch (configError) {
      logger.error('Error retrieving system configuration:', configError);
      return res.json(defaultConfig);
    }
  } catch (error) {
    logger.error('Error getting dice game configuration:', error);
    return res.status(500).json({ error: 'Failed to get dice game configuration' });
  }
});

/**
 * POST /api/dice/bet
 * Place a new bet using balance system
 */
router.post('/bet', async (req, res) => {
  try {
    const { walletAddress, betAmount, target, isOver, clientSeed } = req.body;

    // Validate inputs
    if (!walletAddress || !betAmount || !clientSeed || target === undefined || isOver === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Get configuration
    const systemConfig = await storage.getSystemConfig();
    const config = systemConfig?.diceGameConfig || {
      enabled: true,
      minBetAmount: process.env.MIN_BET_AMOUNT || "1",
      maxBetAmount: process.env.MAX_BET_AMOUNT || "10000",
      houseEdge: parseFloat(process.env.HOUSE_EDGE || "1.5"),
      maxProfit: process.env.MAX_PROFIT || "5000"
    };

    if (!config.enabled) {
      return res.status(403).json({ error: 'Dice game is currently disabled' });
    }

    // Validate bet amount
    const minBet = parseFloat(config.minBetAmount);
    const maxBet = parseFloat(config.maxBetAmount);
    const betAmountNum = parseFloat(betAmount);

    if (isNaN(betAmountNum) || betAmountNum < minBet || betAmountNum > maxBet) {
      return res.status(400).json({ 
        error: `Bet amount must be between ${minBet} and ${maxBet} ${TOKEN_SYMBOL}` 
      });
    }

    // Check user balance
    const userBalance = getBalance(walletAddress);
    if (userBalance < betAmountNum) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: userBalance,
        required: betAmountNum
      });
    }

    // Validate target range
    if (target < 0 || target > 999999.99) {
      return res.status(400).json({ error: 'Target must be between 0 and 999999.99' });
    }

    // Calculate win chance and multiplier
    const winChance = isOver ? (999999.99 - target) / 999999.99 * 100 : target / 999999.99 * 100;
    const houseEdge = config.houseEdge || 1.5;
    const multiplier = applyHouseEdge(winChance, houseEdge);

    // Generate bet ID and server seed
    const betId = generateBetId();
    const serverSeed = generateServerSeed();
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

    // Deduct bet amount from balance immediately
    const deducted = await deductFromBalance(walletAddress, betAmountNum);
    if (!deducted) {
      return res.status(400).json({ error: 'Failed to deduct balance' });
    }

    // Record the bet
    const bet: Bet = {
      id: betId,
      walletAddress,
      amount: betAmount,
      target,
      isOver,
      multiplier,
      clientSeed,
      serverSeed,
      serverSeedHash,
      date: new Date().toISOString(),
      rolled: false
    };

    bets.set(betId, bet);
    saveBetsToFile();

    // Broadcast bet to live feed
    broadcastToClients({
      type: 'bet',
      bet: {
        id: betId,
        address: walletAddress,
        amount: betAmount,
        target,
        rollType: isOver ? 'over' : 'under',
        timestamp: bet.date,
        tokenSymbol: TOKEN_SYMBOL
      }
    });

    res.json({
      success: true,
      betId,
      serverSeedHash,
      winChance,
      multiplier,
      newBalance: getBalance(walletAddress)
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/dice/roll
 * Process the dice roll and determine result
 */
router.post('/roll', async (req, res) => {
  try {
    const { betId, walletAddress, clientSeed } = req.body;

    if (!betId || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the bet
    const bet = bets.get(betId);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Verify bet belongs to user
    if (bet.walletAddress !== walletAddress) {
      return res.status(403).json({ error: 'Unauthorized access to bet' });
    }

    // Check if already rolled
    if (bet.rolled) {
      return res.status(400).json({ error: 'Bet has already been rolled' });
    }

    // Verify client seed
    if (bet.clientSeed !== clientSeed) {
      return res.status(400).json({ error: 'Client seed does not match' });
    }

    // Get config for max profit
    const systemConfig = await storage.getSystemConfig();
    const maxProfit = parseFloat(systemConfig?.diceGameConfig?.maxProfit || process.env.MAX_PROFIT || "5000");

    // Calculate result
    const combinedSeed = clientSeed + bet.serverSeed;
    const resultHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    const resultNumber = hexToNumber(resultHash);

    // Determine win/loss
    let won = false;
    if (bet.isOver) {
      won = resultNumber > bet.target;
    } else {
      won = resultNumber < bet.target;
    }

    // Calculate profit
    let profit = 0;
    if (won) {
      const rawProfit = calculateProfit(parseFloat(bet.amount), bet.multiplier) - parseFloat(bet.amount);
      profit = Math.min(rawProfit, maxProfit);
      
      // Add winnings to balance (original bet was already deducted)
      const totalReturn = parseFloat(bet.amount) + profit;
      await addToBalance(walletAddress, totalReturn);
    }
    // If lost, bet amount was already deducted when bet was placed

    // Update bet with results
    bet.rolled = true;
    bet.result = resultNumber;
    bet.won = won;
    bet.profit = won ? profit.toString() : `-${bet.amount}`;
    bet.resultHash = resultHash;
    bets.set(betId, bet);
    saveBetsToFile();

    // Broadcast result to live feed
    broadcastToClients({
      type: 'result',
      betId,
      result: resultNumber,
      won,
      profit: bet.profit
    });

    // Return results
    res.json({
      success: true,
      betId,
      clientSeed: bet.clientSeed,
      serverSeed: bet.serverSeed,
      serverSeedHash: bet.serverSeedHash,
      result: resultNumber,
      target: bet.target,
      isOver: bet.isOver,
      won,
      profit: bet.profit,
      newBalance: getBalance(walletAddress),
      tokenSymbol: TOKEN_SYMBOL
    });
  } catch (error) {
    console.error('Error processing roll:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dice/verify/:betId
 * Verify a previous roll
 */
router.get('/verify/:betId', (req, res) => {
  try {
    const { betId } = req.params;
    
    if (!betId) {
      return res.status(400).json({ error: 'Missing bet ID' });
    }
    
    const bet = bets.get(betId);
    if (!bet || !bet.rolled) {
      return res.status(404).json({ error: 'Completed bet not found' });
    }
    
    // Verify server seed hash
    const serverSeedHash = crypto.createHash('sha256').update(bet.serverSeed).digest('hex');
    const hashVerified = serverSeedHash === bet.serverSeedHash;
    
    // Re-calculate result
    const combinedSeed = bet.clientSeed + bet.serverSeed;
    const resultHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    const resultNumber = hexToNumber(resultHash);
    const resultVerified = resultNumber === bet.result;
    
    // Verify win condition
    const winCondition = bet.isOver ? (resultNumber > bet.target) : (resultNumber < bet.target);
    const winVerified = winCondition === bet.won;
    
    bet.verified = true;
    bets.set(betId, bet);
    saveBetsToFile();
    
    res.json({
      success: true,
      betId,
      verified: hashVerified && resultVerified && winVerified,
      hashVerified,
      resultVerified,
      winVerified,
      clientSeed: bet.clientSeed,
      serverSeed: bet.serverSeed,
      serverSeedHash: bet.serverSeedHash,
      calculatedHash: serverSeedHash,
      result: bet.result,
      recalculatedResult: resultNumber,
      target: bet.target,
      isOver: bet.isOver,
      won: bet.won,
      recalculatedWin: winCondition
    });
  } catch (error) {
    console.error('Error verifying roll:', error);
    res.status(500).json({ error: 'Failed to verify roll' });
  }
});

/**
 * GET /api/dice/leaderboard
 * Get dice game leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = calculateLeaderboardFromBets();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * Calculate leaderboard from bets
 */
function calculateLeaderboardFromBets() {
  const playerStats = new Map();
  
  for (const bet of bets.values()) {
    if (!bet.rolled) continue;
    
    const walletAddress = bet.walletAddress;
    
    if (!playerStats.has(walletAddress)) {
      playerStats.set(walletAddress, {
        address: walletAddress,
        profit: 0,
        wins: 0,
        totalBets: 0
      });
    }
    
    const stats = playerStats.get(walletAddress);
    stats.totalBets++;
    
    if (bet.won) {
      stats.wins++;
      const profitValue = parseFloat(bet.profit || '0');
      if (!isNaN(profitValue)) {
        stats.profit += profitValue;
      }
    } else {
      const amountValue = parseFloat(bet.amount);
      if (!isNaN(amountValue)) {
        stats.profit -= amountValue;
      }
    }
  }
  
  const result = Array.from(playerStats.values()).map(player => {
    const winRate = player.totalBets > 0 
      ? `${((player.wins / player.totalBets) * 100).toFixed(1)}%` 
      : '0%';
      
    return {
      address: player.address,
      profit: player.profit.toFixed(2),
      winRate,
      totalBets: player.totalBets
    };
  });
  
  result.sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit));
  
  return result.slice(0, 10);
}

/**
 * GET /api/dice/verify-roll
 * Verify a roll with explicit parameters
 */
router.get('/verify-roll', (req, res) => {
  try {
    const { clientSeed, serverSeed, target, isOver } = req.query;
    
    if (!clientSeed || !serverSeed || target === undefined || isOver === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed.toString()).digest('hex');
    const combinedSeed = clientSeed.toString() + serverSeed.toString();
    const resultHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    const resultNumber = hexToNumber(resultHash);
    
    const targetNum = parseFloat(target.toString());
    const isOverBool = isOver.toString() === 'true';
    const winCondition = isOverBool ? (resultNumber > targetNum) : (resultNumber < targetNum);
    
    res.json({
      verified: true,
      clientSeed: clientSeed.toString(),
      serverSeed: serverSeed.toString(),
      serverSeedHash,
      result: resultNumber,
      target: targetNum,
      isOver: isOverBool,
      won: winCondition
    });
  } catch (error) {
    console.error('Error verifying roll:', error);
    res.status(500).json({ error: 'Failed to verify roll' });
  }
});

/**
 * GET /api/dice/history/:walletAddress
 * Get bet history for a wallet
 */
router.get('/history/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const userBets = Array.from(bets.values())
      .filter(bet => bet.walletAddress === walletAddress)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map(bet => ({
        id: bet.id,
        amount: bet.amount,
        target: bet.target,
        isOver: bet.isOver,
        result: bet.result,
        won: bet.won,
        profit: bet.profit,
        date: bet.date,
        verified: bet.verified
      }));
    
    res.json({
      success: true,
      walletAddress,
      bets: userBets
    });
  } catch (error) {
    console.error('Error getting bet history:', error);
    res.status(500).json({ error: 'Failed to get bet history' });
  }
});

// Cleanup function
export const cleanupBets = () => {
  saveBetsToFile();
};

export default router;
