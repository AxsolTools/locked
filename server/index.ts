import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './routes';
import diceGameRoutes, { initializeWebSocket, cleanupBets } from './routes/diceGame';
import balanceRoutes, { loadBalances } from './routes/balance';
import vestingRoutes, { loadVestingSchedules } from './routes/vesting';
import adminRoutes from './routes/admin';
import { initializeSolanaClient } from './utils/solanaClient';
import { initializeHouseWallet, isWalletServiceReady } from './utils/solanaWallet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './vite';
import http from 'http';
import { storage } from './storage';
// @ts-ignore
import rateLimit from 'express-rate-limit';
import { initializeDiceGameConfig, repairDiceGameConfig } from './initDiceGame';

// ES Module compatibility - get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create rate limiter for dice game
const diceGameLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute'
});

// Rate limiter for balance operations
const balanceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for balance operations
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many balance requests, please try again after a minute'
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-wallet-address']
}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-wallet-address');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// Authentication API route - connect wallet
app.post('/api/auth/connect-wallet', (req, res) => {
  console.log('📲 Wallet connection request received:', req.body);
  
  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    console.log('❌ Missing wallet address in request');
    return res.status(400).json({ 
      success: false,
      message: 'Wallet address is required' 
    });
  }

  // Validate Solana address format
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Solana wallet address format'
    });
  }

  console.log(`✅ Connecting wallet: ${walletAddress}`);
  
  const user = {
    id: 1,
    walletAddress,
    username: `user_${walletAddress.slice(0, 6)}`,
    isAdmin: false,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  
  console.log(`🔐 User authenticated: ${user.username} (${user.walletAddress})`);
  
  return res.status(200).json(user);
});

// Stats API route
app.get('/api/stats', (req, res) => {
  res.json({
    totalLockedTokens: "12500.00",
    activeLockers: 15,
    avgLockDuration: 90,
    tokensReleased: "4000.00",
    totalFeeCollected: "350.00",
    updatedAt: new Date().toISOString()
  });
});

// Recent transactions API route
app.get('/api/transactions/recent', (req, res) => {
  const tokenSymbol = process.env.LOCKED_TOKEN_SYMBOL || 'LOCKED';
  res.json({
    success: true,
    transactions: [
      {
        id: 1,
        type: 'deposit',
        walletAddress: 'DemoWallet111111111111111111111111111111111',
        amount: '500',
        tokenType: tokenSymbol,
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Token configuration API - returns token info from environment
app.get('/api/token/config', (req, res) => {
  res.json({
    success: true,
    token: {
      symbol: process.env.LOCKED_TOKEN_SYMBOL || 'LOCKED',
      mint: process.env.LOCKED_TOKEN_MINT || null,
      decimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
      name: process.env.LOCKED_TOKEN_NAME || 'LOCKED Token'
    }
  });
});

// API Routes
app.use('/api', routes);
console.log('API routes registered from routes.ts');

// Balance routes
app.use('/api/balance', balanceLimiter, balanceRoutes);
console.log('Balance routes registered');

// Dice game routes
app.use('/api/dice', diceGameLimiter, diceGameRoutes);
console.log('Dice game routes registered');

// Vesting routes (token locking)
app.use('/api/vesting', vestingRoutes);
console.log('Vesting routes registered');

// Admin routes
app.use('/api/admin', adminRoutes);
console.log('Admin routes registered');

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server for dice game live feed
initializeWebSocket(server);

// Initialize Solana client and services
const initializeSolana = async () => {
  try {
    console.log('🔗 Initializing Solana client...');
    await initializeSolanaClient();
    console.log('✅ Solana client initialized');

    // Initialize house wallet if configured
    if (process.env.HOUSE_WALLET_SECRET) {
      try {
        const houseWallet = initializeHouseWallet();
        console.log(`✅ House wallet initialized: ${houseWallet.publicKey.toBase58()}`);
      } catch (error) {
        console.error('⚠️ Failed to initialize house wallet:', error);
        console.error('Payouts will be disabled until house wallet is configured');
      }
    } else {
      console.warn('⚠️ HOUSE_WALLET_SECRET not set. Payouts will be disabled.');
    }

    // Load user balances from storage
    await loadBalances();
    console.log('✅ User balances loaded');

    // Load vesting schedules
    await loadVestingSchedules();
    console.log('✅ Vesting schedules loaded');
  } catch (error) {
    console.error('❌ Error initializing Solana:', error);
  }
};

// Start the server
server.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);

  // Initialize Solana
  initializeSolana();

  // Initialize dice game configuration
  initializeDiceGameConfig()
    .then(() => {
      log('✅ Dice game configuration initialized');
      return repairDiceGameConfig();
    })
    .then(() => {
      log('✅ Dice game configuration verified');
    })
    .catch(err => {
      log('❌ Error initializing dice game configuration:', err);
    });

  // Initial cleanup
  cleanupBets();
});

// API status endpoint
app.get('/api-status', (req, res) => {
  const solanaReady = isWalletServiceReady();
  res.json({ 
    status: 'API is running',
    solana: solanaReady ? 'connected' : 'not configured',
    chain: 'solana-mainnet'
  });
});

// Debug endpoint for routes
app.get('/api/debug/routes', (req, res) => {
  interface RouteInfo {
    path: string;
    methods: string;
  }
  
  const registeredRoutes: RouteInfo[] = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      registeredRoutes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ')
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const path = handler.route.path;
          registeredRoutes.push({
            path: middleware.regexp.toString().includes('/api') 
              ? `/api${path}` 
              : path,
            methods: Object.keys(handler.route.methods).join(', ')
          });
        }
      });
    }
  });
  
  res.json({ 
    routes: registeredRoutes,
    routeCount: registeredRoutes.length
  });
});

// User profile endpoint
app.get('/api/user/profile', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-wallet-address');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    const { walletAddress } = req.query;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ message: 'Valid wallet address is required' });
    }
    
    const user = await storage.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Serve static files in production, redirect to Vite dev server in development
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the built client
  const staticPath = path.join(__dirname, 'public');
  app.use(express.static(staticPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Development: redirect to Vite dev server
  app.use('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      const redirectUrl = `http://localhost:5173${req.originalUrl}`;
      log(`Redirecting to: ${redirectUrl}`);
      return res.redirect(302, redirectUrl);
    }
    
    res.status(404).json({ error: 'API endpoint not found' });
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  cleanupBets();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  cleanupBets();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export { app };
export default server;
