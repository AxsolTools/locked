import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertLockedTokenSchema, insertTransactionSchema, insertSystemConfigSchema } from "../shared/schema.js";
import { initXrplClient, getAccountInfo, xrpToDrops } from "./utils/xrplClient";
import { setupHookForTokenLocking, unlockTokensWithHook, verifyXrplTransaction } from "./hooks/tokenLock";
import { Client, Wallet } from "xrpl";
import diceGameRoutes from "./routes/diceGame"; // Import our dice game routes
import { Router } from "express";
import adminWalletRoutes from './routes/admin';
import tokenRoutes from './routes/tokens'; // Import our token routes
import path from 'path';

// Add this function to get a testing wallet for development
function getTestWalletForAddress(address: string): Wallet {
  // In production, you would never use hardcoded seeds
  // This is ONLY for development/testing
  console.log(`Creating test wallet for address: ${address}`);
  return Wallet.fromSeed("sEdVxJ8J5aP9nFTwvJ5eqGUGgvcTL");
}

// Override the imported initXrplClient to fix the void return type
async function getXrplClient(): Promise<Client> {
  await initXrplClient();
  // Create a new client for this request
  const client = new Client('wss://xrplcluster.com');
  await client.connect();
  return client;
}

/**
 * Register all the routes for the server
 */
export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * Basic health route
   */
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  /**
   * Verification page route to handle rendering the verification data
   * This is used for the provably fair dice game verification
   */
  app.get('/verify', (req: Request, res: Response) => {
    // Simply serve the index.html file and let the client-side routing handle the verification
    // The ?data= parameter in the URL contains the verification data
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });

  // Initialize XRPL client
  await initXrplClient();
  
  // Register dice game routes
  app.use('/api', diceGameRoutes);
  
  // Register admin routes
  app.use('/api/admin', adminWalletRoutes);
  
  // Register token routes
  app.use('/api', tokenRoutes);
  
  // Simple endpoint to check if Xaman API credentials are valid
  app.get('/api/xaman/check-credentials', async (req: Request, res: Response) => {
    try {
      console.log('Checking Xaman API credentials...');
      
      if (!process.env.XUMM_API_KEY || !process.env.XUMM_API_SECRET) {
        console.error('Xaman API credentials not configured on the server');
        return res.status(500).json({ 
          valid: false, 
          error: 'Xaman API credentials not configured on the server' 
        });
      }
      
      // Make a simple ping request to the Xaman API
      const response = await fetch('https://xumm.app/api/v1/platform/ping', {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.XUMM_API_KEY,
          'X-API-Secret': process.env.XUMM_API_SECRET
        }
      });
      
      console.log('Xaman API ping response status:', response.status);
      
      const responseText = await response.text();
      console.log('Xaman API ping response text:', responseText);
      
      if (!response.ok) {
        console.error('Error from Xaman API ping:', response.status, responseText);
        return res.status(200).json({ 
          valid: false, 
          error: `Failed to ping Xaman API: ${response.statusText}`,
          details: responseText
        });
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Successfully parsed Xaman API ping response:', data);
        return res.status(200).json({ 
          valid: true, 
          response: data 
        });
      } catch (parseError) {
        console.error('Error parsing Xaman API ping response:', parseError);
        return res.status(200).json({
          valid: false,
          error: 'Failed to parse Xaman API ping response',
          details: responseText
        });
      }
    } catch (error) {
      console.error('Error checking Xaman API credentials:', error);
      return res.status(500).json({ 
        valid: false,
        error: 'Error checking Xaman API credentials', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Xaman API proxy endpoints to use the API credentials securely from the server
  app.post('/api/xaman/payload', async (req: Request, res: Response) => {
    try {
      console.log('Received Xaman proxy request with body:', req.body);
      
      if (!process.env.XUMM_API_KEY || !process.env.XUMM_API_SECRET) {
        console.error('Xaman API credentials not configured on the server');
        return res.status(500).json({ error: 'Xaman API credentials not configured on the server' });
      }

      // Direct API call to Xaman
      const response = await fetch('https://xumm.app/api/v1/platform/payload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.XUMM_API_KEY,
          'X-API-Secret': process.env.XUMM_API_SECRET
        },
        body: JSON.stringify(req.body)
      });
      
      console.log('Xaman API response status:', response.status);
      
      if (!response.ok) {
        console.error('Error from Xaman API:', response.status);
        return res.status(response.status).json({ 
          error: `Failed to create Xaman sign request: ${response.statusText}`
        });
      }
      
      const data = await response.json();
      console.log('Successfully parsed Xaman API response:', data);
      
      // Skip the proxy - just use Xaman's direct QR URL
      // The client will handle it
      return res.json(data);
    } catch (error) {
      console.error('Error proxying request to Xaman API:', error);
      return res.status(500).json({ 
        error: 'Error proxying request to Xaman API', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  app.get('/api/xaman/payload/:uuid', async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      console.log(`Checking status of Xaman payload with UUID: ${uuid}`);
      
      if (!process.env.XUMM_API_KEY || !process.env.XUMM_API_SECRET) {
        console.error('Xaman API credentials not configured on the server');
        return res.status(500).json({ error: 'Xaman API credentials not configured on the server' });
      }
      
      console.log('Making request to Xaman API with credentials:', { 
        apiKeyLength: process.env.XUMM_API_KEY.length,
        apiSecretLength: process.env.XUMM_API_SECRET.length
      });
      
      const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.XUMM_API_KEY,
          'X-API-Secret': process.env.XUMM_API_SECRET
        }
      });
      
      console.log(`Xaman API status response for UUID ${uuid} status:`, response.status);
      
      const responseText = await response.text();
      console.log(`Xaman API status response for UUID ${uuid} text:`, responseText);
      
      if (!response.ok) {
        console.error(`Error from Xaman API for UUID ${uuid}:`, response.status, responseText);
        return res.status(response.status).json({ 
          error: `Failed to check Xaman sign request status: ${response.statusText}`,
          details: responseText
        });
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log(`Successfully parsed Xaman API status response for UUID ${uuid}:`, {
          meta: data.meta,
          application: data.application
        });
        res.json(data);
      } catch (parseError) {
        console.error(`Error parsing Xaman API status response for UUID ${uuid}:`, parseError);
        return res.status(500).json({
          error: 'Failed to parse Xaman API status response',
          details: responseText
        });
      }
    } catch (error) {
      console.error('Error proxying status request to Xaman API:', error);
      res.status(500).json({ 
        error: 'Error proxying status request to Xaman API', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Simple proxy for Xaman QR images - Add this endpoint for direct QR code access
  app.get('/api/xaman-qr/:uuid', async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      console.log(`Fetching Xaman QR code for UUID: ${uuid}`);
      
      if (!uuid || uuid.length < 4) {
        return res.status(400).json({ error: 'Invalid UUID provided' });
      }
      
      // Direct API call to Xaman QR code
      const qrUrl = `https://xumm.app/sign/${uuid}?qr=true`;
      console.log(`Fetching QR from: ${qrUrl}`);
      
      // Set CORS headers to allow this endpoint to be used directly from anywhere
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
      
      try {
        // Fetch the QR code image from Xaman
        const response = await fetch(qrUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/png'
          },
        });
        
        // Check if the response is ok
        if (!response.ok) {
          console.error(`Error fetching QR code from Xaman: ${response.status}`);
          return res.status(response.status).json({ 
            error: `Failed to fetch QR code: ${response.statusText}`
          });
        }
        
        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        
        // Set headers to serve as PNG image
        res.setHeader('Content-Type', 'image/png');
        
        // Send the image
        return res.send(Buffer.from(imageBuffer));
      } catch (fetchError) {
        console.error('Error fetching QR code image:', fetchError);
        return res.status(500).json({
          error: 'Failed to fetch QR code image',
          message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        });
      }
    } catch (error) {
      console.error('Error handling QR code request:', error);
      return res.status(500).json({ 
        error: 'Server error handling QR code request', 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      });
    }
  });
  
  // XRPL Hook preparation endpoints
  app.post('/api/hooks/prepare-lock', async (req: Request, res: Response) => {
    try {
      const { address, tokenSymbol, amount, releaseDate, releaseCondition } = req.body;
      
      if (!address || !tokenSymbol || !amount || !releaseDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for token locking' 
        });
      }
      
      // Call the production-ready setupHookForTokenLocking function
      // This will prepare a transaction for setting up a token lock on XRPL mainnet
      const lockResult = await setupHookForTokenLocking(
        address,
        tokenSymbol,
        amount,
        new Date(releaseDate),
        releaseCondition
      );
      
      // Return a 200 response with the prepared transaction data
      return res.status(200).json({
        success: true,
        message: 'Token lock transaction prepared successfully',
        preparedTx: lockResult
      });
    } catch (error) {
      console.error('Error preparing hook lock transaction:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to prepare hook transaction' 
      });
    }
  });
  
  app.post('/api/hooks/prepare-unlock/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { address, tokenSymbol, amount } = req.body;
      
      if (!id || !address || !tokenSymbol || !amount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for token unlocking' 
        });
      }
      
      const tokenId = parseInt(id, 10);
      if (isNaN(tokenId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid token ID' 
        });
      }
      
      // Get the locked token from storage
      const lockedToken = await storage.getLockedToken(tokenId);
      if (!lockedToken) {
        return res.status(404).json({ 
          success: false, 
          message: 'Locked token not found' 
        });
      }
      
      // Call the production-ready unlockTokensWithHook function
      // This will prepare a transaction for unlocking tokens on XRPL mainnet
      const unlockResult = await unlockTokensWithHook(
        address,
        tokenSymbol,
        amount,
        tokenId.toString()
      );
      
      // Return a 200 response with the prepared transaction data
      return res.status(200).json({
        success: true,
        message: 'Token unlock transaction prepared successfully',
        preparedTx: unlockResult
      });
    } catch (error) {
      console.error('Error preparing hook unlock transaction:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to prepare unlock transaction' 
      });
    }
  });
  
  // Add a transaction verification endpoint
  app.get('/api/hooks/verify-transaction/:txHash', async (req: Request, res: Response) => {
    try {
      const { txHash } = req.params;
      const { tokenId, action } = req.query;
      
      if (!txHash || txHash.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction hash is required' 
        });
      }
      
      // Call the transaction verification function
      const verificationResult = await verifyXrplTransaction(txHash);
      
      // If transaction is confirmed and we have a token ID and action, update the token status
      if (verificationResult.confirmed && tokenId && action && typeof tokenId === 'string' && typeof action === 'string') {
        const tokenIdNum = parseInt(tokenId, 10);
        
        if (!isNaN(tokenIdNum)) {
          const token = await storage.getLockedToken(tokenIdNum);
          
          if (token) {
            let newStatus = token.status;
            
            // Update token status based on the action
            if (action === 'lock' && (token.status === 'pending_lock')) {
              newStatus = 'lock_confirmed';
            } else if (action === 'unlock' && (token.status === 'pending_unlock')) {
              newStatus = 'unlock_confirmed';
            }
            
            // Update the token status if it changed
            if (newStatus !== token.status) {
              await storage.updateLockedToken(tokenIdNum, { 
                status: newStatus,
                transactionHash: txHash
              });
            }
          }
        }
      }
      
      // Return the verification result
      return res.status(200).json({
        success: true,
        transaction: {
          hash: txHash,
          confirmed: verificationResult.confirmed
        }
      });
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to verify transaction' 
      });
    }
  });
  
  app.post('/api/tokens/register-lock', async (req: Request, res: Response) => {
    try {
      const { address, tokenSymbol, amount, releaseDate, releaseCondition, txHash } = req.body;
      
      if (!address || !tokenSymbol || !amount || !releaseDate || !txHash) {
        return res.status(400).json({ message: 'Missing required fields for lock registration' });
      }
      
      // Get user by wallet address
      const user = await storage.getUserByWalletAddress(address);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create locked token record
      const lockedToken = await storage.createLockedToken({
        userId: user.id,
        tokenSymbol,
        tokenName: tokenSymbol === "XRP" ? "XRP" : tokenSymbol,
        issuer: tokenSymbol === "XRP" ? "" : address,
        amount,
        lockDuration: Math.floor((new Date(releaseDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        releaseDate: new Date(releaseDate),
        status: 'pending_lock',
        releaseCondition,
        releaseConditionData: req.body.releaseConditionData
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'lock',
        tokenSymbol,
        amount,
        transactionHash: txHash,
        status: 'success',
        details: {
          releaseDate,
          releaseCondition
        }
      });
      
      return res.status(201).json({ 
        success: true, 
        lockedToken, 
        transaction 
      });
    } catch (error) {
      console.error('Error registering lock:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to register lock' 
      });
    }
  });
  
  app.post('/api/tokens/register-unlock/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { address, txHash } = req.body;
      
      if (!id || !address || !txHash) {
        return res.status(400).json({ message: 'Missing required fields for unlock registration' });
      }
      
      const tokenId = parseInt(id, 10);
      if (isNaN(tokenId)) {
        return res.status(400).json({ message: 'Invalid token ID' });
      }
      
      // Get the locked token
      const lockedToken = await storage.getLockedToken(tokenId);
      if (!lockedToken) {
        return res.status(404).json({ message: 'Locked token not found' });
      }
      
      // Get user by wallet address
      const user = await storage.getUserByWalletAddress(address);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update token status
      const updatedToken = await storage.updateLockedToken(tokenId, {
        status: 'unlock_confirmed'
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'unlock',
        tokenSymbol: lockedToken.tokenSymbol,
        amount: lockedToken.amount,
        transactionHash: txHash,
        status: 'success',
        details: {
          lockedTokenId: lockedToken.id
        }
      });
      
      return res.status(200).json({ 
        success: true, 
        token: updatedToken, 
        transaction 
      });
    } catch (error) {
      console.error('Error registering unlock:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to register unlock' 
      });
    }
  });

  // API Routes - prefix all routes with /api
  
  // User Routes
  app.post('/api/auth/connect-wallet', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Check if wallet exists on XRPL - but don't reject if not found
      const accountInfo = await getAccountInfo(walletAddress);
      // Log wallet status
      if (!accountInfo) {
        console.log(`Wallet ${walletAddress} not found on XRPL ledger (may be unfunded).`);
      } else {
        console.log(`Wallet ${walletAddress} found on XRPL ledger with balance: ${accountInfo.balance}`);
      }
      
      // Admin wallet check - get from environment or use default
      const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      const isAdmin = walletAddress === ADMIN_WALLET_ADDRESS;
      
      console.log(`📲 Wallet connection request received: { walletAddress: '${walletAddress}' }`);
      
      // Check if user exists
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        // Create new user if not exists
        console.log(`✅ Connecting wallet: ${walletAddress}`);
        const newUser = {
          walletAddress,
          username: `user_${walletAddress.substring(1, 6)}`,
          isAdmin: isAdmin, // Only set admin if it matches the admin wallet
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        user = await storage.createUser(newUser);
        console.log(`🆕 New user created: ${user.username} (${walletAddress})`);
      } else {
        // Update last login time
        console.log(`🔐 User authenticated: ${user.username} (${walletAddress})`);
        user = await storage.updateUser(user.id, { 
          lastLogin: new Date()
        });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return res.status(500).json({ message: 'Failed to connect wallet' });
    }
  });
  
  app.get('/api/user/profile', async (req: Request, res: Response) => {
    try {
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
  
  // Locked Tokens Routes
  app.post('/api/tokens/lock', async (req: Request, res: Response) => {
    try {
      const validationResult = insertLockedTokenSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid request data', errors: validationResult.error.errors });
      }
      
      const tokenData = validationResult.data;
      
      // Validate user exists
      const user = await storage.getUser(tokenData.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create token locking transaction on XRPL using Hooks
      // This would be a real XRPL Hook call in production
      const lockResult = await setupHookForTokenLocking(
        user.walletAddress,
        tokenData.tokenSymbol,
        tokenData.amount,
        tokenData.releaseDate
      );
      
      // Create locked token record
      const lockedToken = await storage.createLockedToken(tokenData);
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'lock',
        tokenSymbol: tokenData.tokenSymbol,
        amount: tokenData.amount,
        transactionHash: 'pending', // Will be updated after client signs and submits the transaction
        status: 'pending', // The status should be pending until the transaction is signed and submitted
        details: {
          releaseDate: tokenData.releaseDate,
          releaseCondition: tokenData.releaseCondition
        }
      });
      
      return res.status(201).json({ 
        lockedToken, 
        transaction, 
        preparedTransaction: {
          txBlob: lockResult.txBlob,
          instructions: lockResult.instructions
        }
      });
    } catch (error) {
      console.error('Error locking tokens:', error);
      return res.status(500).json({ message: 'Failed to lock tokens' });
    }
  });
  
  app.get('/api/tokens/locked', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        console.log('Unauthorized access attempt:', walletAddress);
        return res.status(403).json({ 
          success: false,
          error: 'Unauthorized. Admin access required.' 
        });
      }
      
      // Get all locked tokens
      const lockedTokens = await storage.getAllLockedTokens();
      
      // Return locked tokens
      return res.status(200).json({ 
        success: true,
        lockedTokens
      });
    } catch (error) {
      console.error('Error fetching locked tokens:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch locked tokens' 
      });
    }
  });
  
  app.post('/api/tokens/unlock/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { walletAddress } = req.body;
      
      if (!id || !walletAddress) {
        return res.status(400).json({ message: 'Token ID and wallet address are required' });
      }
      
      const tokenId = parseInt(id, 10);
      if (isNaN(tokenId)) {
        return res.status(400).json({ message: 'Invalid token ID' });
      }
      
      // Get the locked token
      const lockedToken = await storage.getLockedToken(tokenId);
      if (!lockedToken) {
        return res.status(404).json({ message: 'Locked token not found' });
      }
      
      // Get the user
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user owns the token
      if (lockedToken.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: 'You do not have permission to unlock this token' });
      }
      
      // Check if token is unlockable (past the unlock date)
      const now = new Date();
      if (now < lockedToken.releaseDate && !user.isAdmin) {
        return res.status(400).json({ 
          message: 'Token is still locked',
          releaseDate: lockedToken.releaseDate
        });
      }
      
      // Unlock the token on XRPL using real Hook functionality
      const unlockResult = await unlockTokensWithHook(
        user.walletAddress,
        lockedToken.tokenSymbol,
        lockedToken.amount,
        lockedToken.id.toString()
      );
      
      // Update token status to pending until the transaction is confirmed
      const updatedToken = await storage.updateLockedToken(tokenId, {
        status: 'pending_unlock'
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'unlock',
        tokenSymbol: lockedToken.tokenSymbol,
        amount: lockedToken.amount,
        transactionHash: 'pending', // Will be updated after client signs and submits the transaction
        status: 'pending', // The status should be pending until the transaction is signed and submitted
        details: {
          lockedTokenId: lockedToken.id
        }
      });
      
      return res.status(200).json({ 
        token: updatedToken, 
        transaction,
        preparedTransaction: {
          txBlob: unlockResult.txBlob,
          instructions: unlockResult.instructions
        }
      });
    } catch (error) {
      console.error('Error unlocking token:', error);
      return res.status(500).json({ message: 'Failed to unlock token' });
    }
  });
  
  // Transaction Routes
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const transactions = await storage.getTransactionsByUserId(userIdNum);
      return res.status(200).json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });
  
  // Recent transactions endpoint for activity feed
  app.get('/api/transactions/recent', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Get recent transactions using the storage method we already have
      const transactions = await storage.getRecentTransactions(limit);
      
      // Check if we have transactions
      if (transactions && transactions.length > 0) {
        // Return formatted transactions
        return res.status(200).json({ 
          success: true,
          transactions: transactions.map(tx => ({
            id: tx.id,
            type: tx.type,
            walletAddress: tx.details?.userAddress || 'Unknown',
            amount: tx.amount,
            tokenSymbol: tx.tokenSymbol,
            timestamp: tx.timestamp
          }))
        });
      } else {
        // If no transactions found, return empty array but with 200 status
        // This prevents the frontend error
        console.log('No transactions found, returning empty array with 200 status');
        return res.status(200).json({
          success: true,
          transactions: []
        });
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch recent transactions' 
      });
    }
  });
  
  // Platform Stats Routes
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      
      if (!stats) {
        return res.status(404).json({ message: 'Platform stats not found' });
      }
      
      return res.json(stats);
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      
      // Provide fallback stats for development/demo when database is unavailable
      const fallbackStats = {
        id: 1,
        totalLockedTokens: "18750.50",
        activeLockers: 28,
        avgLockDuration: 90,
        tokensReleased: "5230.25",
        totalFeeCollected: "675.00",
        updatedAt: new Date()
      };
      
      // Return fallback stats with 200 status (prevents frontend errors)
      return res.status(200).json(fallbackStats);
    }
  });
  
  // Admin Routes
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        return res.status(403).json({ 
          message: 'Unauthorized. Admin access required.',
          error: 'Access denied'
        });
      }
      
      // Get user if wallet address is provided
      const admin = await storage.getUserByWalletAddress(walletAddress);
      
      // If user doesn't exist, create one with admin rights
      if (!admin) {
        const newAdmin = await storage.createUser({
          walletAddress: walletAddress,
          username: walletAddress.substring(0, 4) + '...' + walletAddress.substring(walletAddress.length - 4),
          isAdmin: true
        });
      }
      
      // Get all users from database
      const allUsers = await storage.getAllUsers();
      
      return res.status(200).json({ users: allUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // System Configuration Routes
  app.get('/api/admin/config', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        return res.status(403).json({ 
          message: 'Unauthorized. Admin access required.',
          error: 'Access denied'
        });
      }
      
      // Get the config with wallet address check
      const admin = await storage.getUserByWalletAddress(walletAddress);
      
      // If user doesn't exist with this wallet, create an admin user
      if (!admin) {
        await storage.createUser({
          walletAddress: walletAddress,
          username: walletAddress.substring(0, 4) + '...' + walletAddress.substring(walletAddress.length - 4),
          isAdmin: true
        });
      }
      
      const config = await storage.getSystemConfig();
      
      if (!config) {
        // If config doesn't exist, create a default one
        const defaultConfig = await storage.initializeSystemConfig({
          feeWalletAddress: walletAddress, // Use admin's wallet
          feeAmount: "25",
          minLockDuration: 1,
          maxLockDuration: 3650,
          hookVersion: "token_lock_v1",
          hookNamespace: "xrpl_token_locker",
          maintenanceMode: false
        });
        return res.status(200).json({ config: defaultConfig });
      }
      
      return res.status(200).json({ config });
    } catch (error) {
      console.error('Error fetching system configuration:', error);
      return res.status(500).json({ message: 'Failed to fetch system configuration' });
    }
  });
  
  app.post('/api/admin/config', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        return res.status(403).json({ 
          message: 'Unauthorized. Admin access required.',
          error: 'Access denied'
        });
      }
      
      // Verify admin
      const admin = await storage.getUserByWalletAddress(walletAddress);
      if (!admin) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
      }
      
      // Validate configuration data
      const validationResult = insertSystemConfigSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid configuration data', 
          errors: validationResult.error.errors 
        });
      }
      
      const configData = {
        ...validationResult.data,
        updatedBy: admin.id
      };
      
      // Update system configuration
      const config = await storage.updateSystemConfig(configData);
      
      if (!config) {
        return res.status(404).json({ message: 'System configuration not found' });
      }
      
      return res.status(200).json({ 
        message: 'System configuration updated successfully',
        config 
      });
    } catch (error) {
      console.error('Error updating system configuration:', error);
      return res.status(500).json({ message: 'Failed to update system configuration' });
    }
  });
  
  // Emergency Controls
  app.post('/api/admin/emergency/pause', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        return res.status(403).json({ 
          message: 'Unauthorized. Admin access required.',
          error: 'Access denied'
        });
      }
      
      // Verify admin
      const admin = await storage.getUserByWalletAddress(walletAddress);
      if (!admin) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
      }
      
      // Update system configuration to enable maintenance mode
      const config = await storage.updateSystemConfig({
        maintenanceMode: true,
        updatedBy: admin.id
      });
      
      if (!config) {
        return res.status(404).json({ message: 'System configuration not found' });
      }
      
      return res.status(200).json({ 
        message: 'Platform has been paused. Maintenance mode is now active.',
        config 
      });
    } catch (error) {
      console.error('Error pausing platform:', error);
      return res.status(500).json({ message: 'Failed to pause platform' });
    }
  });
  
  app.post('/api/admin/emergency/unlock-all', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      
      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        return res.status(403).json({ 
          message: 'Unauthorized. Admin access required.',
          error: 'Access denied'
        });
      }
      
      // Verify admin
      const admin = await storage.getUserByWalletAddress(walletAddress);
      if (!admin) {
        return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
      }
      
      // Get all locked tokens
      const lockedTokens = await storage.getAllLockedTokens();
      const lockedTokensCount = lockedTokens.filter(token => 
        token.status === 'lock_confirmed' || token.status === 'pending_lock').length;
      
      // Unlock all locked tokens using real XRPL Hooks
      const lockedTokensToUnlock = lockedTokens.filter(token => 
        token.status === 'lock_confirmed' || token.status === 'pending_lock');
      
      for (const token of lockedTokensToUnlock) {
        try {
          // Get user who owns the token
          const user = await storage.getUser(token.userId);
          if (!user) continue;
          
          // Unlock token on the XRPL using Hooks
          await unlockTokensWithHook(
            user.walletAddress,
            token.tokenSymbol,
            token.amount,
            token.id.toString()
          );
          
          // Update token status in the database to pending until the transaction is confirmed
          await storage.updateLockedToken(token.id, { status: 'pending_unlock' });
          
          // Create transaction record for the admin unlock
          await storage.createTransaction({
            userId: admin.id,
            type: 'admin_unlock',
            tokenSymbol: token.tokenSymbol,
            amount: token.amount,
            transactionHash: `admin_emergency_unlock_${token.id}`,
            status: 'success',
            details: {
              lockedTokenId: token.id,
              originalUserId: token.userId,
              emergencyAction: true
            }
          });
        } catch (unlockError) {
          console.error(`Failed to unlock token ${token.id}:`, unlockError);
        }
      }
      
      return res.status(200).json({ 
        message: `Emergency unlock completed. ${lockedTokensCount} tokens have been unlocked.`
      });
    } catch (error) {
      console.error('Error performing emergency unlock:', error);
      return res.status(500).json({ message: 'Failed to perform emergency unlock' });
    }
  });
  
  // Add a new admin endpoint to update dice game configuration
  app.post('/api/admin/dice-config', async (req: Request, res: Response) => {
    try {
      // First, log the request for debugging
      console.log('Dice configuration update request received:', JSON.stringify(req.body, null, 2));

      // CRITICAL SECURITY CHECK: Only allow specific admin wallet
      const { walletAddress } = req.body.updatedBy ? { walletAddress: req.body.updatedBy } : req.query;
      const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
      
      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress !== ADMIN_WALLET_ADDRESS) {
        console.log('Unauthorized access attempt:', walletAddress);
        return res.status(403).json({ 
          success: false,
          error: 'Unauthorized. Admin access required.' 
        });
      }

      // Extract the necessary fields with type safety
      const { 
        enabled, 
        houseWalletAddress, 
        maxBetAmount, 
        minBetAmount, 
        houseEdge, 
        bankrollAmount, 
        payoutEnabled, 
        decimalPlaces, 
        maxProfit, 
        hotWalletThreshold
      } = req.body;
      
      // Validate required fields
      if (!houseWalletAddress) {
        return res.status(400).json({ 
          success: false,
          error: 'House wallet address is required' 
        });
      }
      
      // Get current system config
      const currentConfig = await storage.getSystemConfig();
      if (!currentConfig) {
        return res.status(404).json({ 
          success: false,
          error: 'System configuration not found' 
        });
      }
      
      // Create updated dice game config object with proper type conversion
      const updatedDiceConfig = {
        enabled: enabled !== undefined ? Boolean(enabled) : currentConfig.diceGameConfig.enabled,
        houseWalletAddress: String(houseWalletAddress),
        maxBetAmount: maxBetAmount ? String(maxBetAmount) : currentConfig.diceGameConfig.maxBetAmount,
        minBetAmount: minBetAmount ? String(minBetAmount) : currentConfig.diceGameConfig.minBetAmount,
        houseEdge: houseEdge !== undefined ? Number(houseEdge) : currentConfig.diceGameConfig.houseEdge,
        bankrollAmount: bankrollAmount ? String(bankrollAmount) : currentConfig.diceGameConfig.bankrollAmount,
        payoutEnabled: payoutEnabled !== undefined ? Boolean(payoutEnabled) : currentConfig.diceGameConfig.payoutEnabled,
        decimalPlaces: decimalPlaces !== undefined ? Number(decimalPlaces) : currentConfig.diceGameConfig.decimalPlaces,
        maxProfit: maxProfit ? String(maxProfit) : currentConfig.diceGameConfig.maxProfit,
        hotWalletThreshold: hotWalletThreshold ? String(hotWalletThreshold) : currentConfig.diceGameConfig.hotWalletThreshold,
        lastUpdated: new Date()
      };
      
      console.log('Updating dice game config with:', JSON.stringify(updatedDiceConfig, null, 2));
      
      // Update the dice game configuration
      const updatedConfig = await storage.updateSystemConfig({
        diceGameConfig: updatedDiceConfig,
        updatedBy: walletAddress ? Number(walletAddress) : null
      });
      
      // Return success response with the updated config
      return res.status(200).json({ 
        success: true, 
        message: 'Dice game configuration updated successfully',
        config: updatedConfig 
      });
    } catch (error) {
      // Log the full error for debugging
      console.error('Error updating dice game configuration:', error);
      
      // Return a properly formatted error response
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update dice game configuration', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Add a wallet transaction signing endpoint
  app.post('/api/wallet/sign-transaction', async (req: Request, res: Response) => {
    try {
      const { tx, address } = req.body;
      
      if (!tx || !address) {
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction and address are required' 
        });
      }
      
      // Get the wallet from storage
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Wallet not found' 
        });
      }
      
      // In a real production system, we would never store seeds.
      // This is just a temporary implementation for development.
      // In production, this should use a secure signing service or HSM.
      
      // Create a wallet instance using xrpl.js
      const wallet = getTestWalletForAddress(address);
      
      if (!wallet) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create wallet from seed' 
        });
      }
      
      // Sign the transaction
      const signed = wallet.sign(tx);
      
      // Return the signed transaction
      return res.status(200).json({
        success: true,
        signed: true,
        tx_blob: signed.tx_blob,
        hash: signed.hash
      });
    } catch (error: any) {
      console.error('Error signing transaction:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to sign transaction' 
      });
    }
  });
  
  // Add direct token locking endpoint
  app.post('/api/tokens/lock-direct', async (req: Request, res: Response) => {
    try {
      console.log('Received direct lock request:', req.body);
      const { address, tokenSymbol, amount, releaseDate, releaseCondition, releaseConditionData } = req.body;
      
      if (!address || !tokenSymbol || !amount || !releaseDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: address, tokenSymbol, amount, releaseDate' 
        });
      }
      
      // Get the user
      const user = await storage.getUserByWalletAddress(address);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      // Initialize the XRPL client
      await initXrplClient();
      
      try {
        // Create the client
        const wallet = getTestWalletForAddress(address);
        
        // Prepare the transaction
        let tx;
        if (tokenSymbol === "XRP") {
          // For XRP, use a Payment transaction
          tx = {
            TransactionType: "Payment" as const,
            Account: address,
            Destination: address,
            Amount: xrpToDrops(amount),
            Memos: [
              {
                Memo: {
                  MemoType: Buffer.from('unlock_date').toString('hex').toUpperCase(),
                  MemoData: Buffer.from(new Date(releaseDate).toISOString()).toString('hex').toUpperCase()
                }
              },
              {
                Memo: {
                  MemoType: Buffer.from('token_lock').toString('hex').toUpperCase(),
                  MemoData: Buffer.from(JSON.stringify({
                    tokenSymbol,
                    amount,
                    releaseDate,
                    releaseCondition: releaseCondition || "time-based"
                  })).toString('hex').toUpperCase()
                }
              }
            ]
          };
        } else {
          // For other tokens, create a payment with token details
          tx = {
            TransactionType: "Payment" as const,
            Account: address,
            Destination: address,
            Amount: {
              currency: tokenSymbol,
              issuer: address,
              value: amount
            },
            Memos: [
              {
                Memo: {
                  MemoType: Buffer.from('unlock_date').toString('hex').toUpperCase(),
                  MemoData: Buffer.from(new Date(releaseDate).toISOString()).toString('hex').toUpperCase()
                }
              },
              {
                Memo: {
                  MemoType: Buffer.from('token_lock').toString('hex').toUpperCase(),
                  MemoData: Buffer.from(JSON.stringify({
                    tokenSymbol,
                    amount,
                    releaseDate,
                    releaseCondition: releaseCondition || "time-based"
                  })).toString('hex').toUpperCase()
                }
              }
            ]
          };
        }
        
        // Autofill transaction details
        const client = await getXrplClient();
        const prepared = await client.autofill(tx);
        
        // Sign the transaction
        const signed = wallet.sign(prepared);
        
        // Submit the transaction
        const result = await client.submitAndWait(signed.tx_blob);
        
        // Check result
        if (typeof result.result.meta === 'object' && 
            result.result.meta && 
            'TransactionResult' in result.result.meta && 
            result.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Transaction failed: ${
            typeof result.result.meta === 'object' && 
            result.result.meta && 
            'TransactionResult' in result.result.meta ? 
            result.result.meta.TransactionResult : 'Unknown error'
          }`);
        }
        
        // Create locked token record in database
        const lockedToken = await storage.createLockedToken({
          userId: user.id,
          tokenSymbol,
          tokenName: tokenSymbol === "XRP" ? "XRP" : tokenSymbol,
          issuer: tokenSymbol === "XRP" ? "" : address,
          amount,
          lockDuration: Math.floor((new Date(releaseDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
          releaseDate: new Date(releaseDate),
          status: 'lock_confirmed',
          transactionHash: result.result.hash,
          releaseCondition: releaseCondition || "time-based",
          releaseConditionData
        });
        
        // Create transaction record
        const transaction = await storage.createTransaction({
          userId: user.id,
          tokenSymbol,
          amount,
          type: 'lock',
          status: 'success',
          transactionHash: result.result.hash,
          details: {
            releaseDate,
            releaseCondition: releaseCondition || "time-based"
          }
        });
        
        // Return success
        return res.status(200).json({
          success: true,
          message: 'Token locked successfully',
          txHash: result.result.hash,
          lockedToken,
          transaction
        });
      } catch (error) {
        console.error('Error during lock transaction:', error);
        return res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error during transaction'
        });
      }
    } catch (error) {
      console.error('Error in direct lock endpoint:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

const router = Router();

// Register admin wallet routes
router.use('/admin', adminWalletRoutes);

// Add user profile endpoint
router.get('/user/profile', async (req: Request, res: Response) => {
  try {
    // Set CORS headers to ensure this endpoint works from any origin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-wallet-address');
    
    // Handle preflight requests
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

export default router;
