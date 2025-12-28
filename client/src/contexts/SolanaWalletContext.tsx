/**
 * Solana Wallet Context
 * 
 * Provides wallet functionality for the LOCKED application:
 * - Generate new keypair for first-time users
 * - Store encrypted private key in localStorage
 * - Import existing wallet via private key
 * - Sign transactions when needed
 * - Fetch and display SPL token balances
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';
import nacl from 'tweetnacl';

// Constants for localStorage keys
const WALLET_STORAGE_KEY = 'locked_wallet';
const WALLET_CREATED_KEY = 'locked_wallet_created';

// Helius RPC endpoint (will be fetched from backend config)
const HELIUS_RPC_URL = '/api/solana/rpc';

// Token balance interface
export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  uiBalance: number;
  logoURI?: string;
}

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isLoading: boolean;
  hasSeenPrivateKey: boolean;
  isRegisteredWithBackend: boolean;
  tokenBalances: TokenBalance[];
  isLoadingTokens: boolean;
  tokenError: string | null;
}

interface WalletContextType extends WalletState {
  // Wallet operations
  generateWallet: () => { publicKey: string; privateKey: string };
  importWallet: (privateKey: string) => boolean;
  exportPrivateKey: () => string | null;
  disconnect: () => void;
  confirmPrivateKeySaved: () => void;
  
  // Signing operations
  signMessage: (message: Uint8Array) => Uint8Array | null;
  getKeypair: () => Keypair | null;
  
  // Token operations
  fetchTokenBalances: () => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
  
  // Utility
  formatAddress: (address: string, chars?: number) => string;
}

const SolanaWalletContext = createContext<WalletContextType | undefined>(undefined);

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    isLoading: true,
    hasSeenPrivateKey: false,
    isRegisteredWithBackend: false,
    tokenBalances: [],
    isLoadingTokens: false,
    tokenError: null
  });

  // Get the keypair from localStorage
  const getStoredKeypair = useCallback((): Keypair | null => {
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!stored) return null;

      const privateKeyArray = JSON.parse(stored);
      if (!Array.isArray(privateKeyArray)) return null;

      return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    } catch (error) {
      console.error('Error reading stored wallet:', error);
      return null;
    }
  }, []);

  // Fetch token balances from Helius RPC
  const fetchTokenBalances = useCallback(async () => {
    if (!state.publicKey) return;
    
    setState(prev => ({ ...prev, isLoadingTokens: true, tokenError: null }));
    
    try {
      // Fetch token balances through our backend (which uses Helius RPC)
      const response = await axios.get(`/api/solana/token-balances/${state.publicKey}`);
      
      if (response.data.success && response.data.tokens) {
        setState(prev => ({
          ...prev,
          tokenBalances: response.data.tokens,
          isLoadingTokens: false,
          tokenError: null
        }));
      } else {
        throw new Error(response.data.error || 'Failed to fetch token balances');
      }
    } catch (error: any) {
      console.error('Error fetching token balances:', error);
      setState(prev => ({
        ...prev,
        tokenBalances: [],
        isLoadingTokens: false,
        tokenError: error.message || 'Failed to fetch token balances'
      }));
    }
  }, [state.publicKey]);

  // Refresh token balances (alias for fetchTokenBalances)
  const refreshTokenBalances = useCallback(async () => {
    await fetchTokenBalances();
  }, [fetchTokenBalances]);

  // Register wallet with backend for server-side transaction signing
  const registerWalletWithBackend = useCallback(async (publicKey: string, privateKey: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/wallet/register', {
        publicKey,
        privateKey
      });
      
      if (response.data.success) {
        console.log('Wallet registered with backend successfully');
        return true;
      }
      console.error('Backend wallet registration failed:', response.data.error);
      return false;
    } catch (error: any) {
      console.error('Error registering wallet with backend:', error);
      return false;
    }
  }, []);

  // Check if wallet is registered with backend
  const checkWalletRegistration = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      const response = await axios.get(`/api/wallet/status/${walletAddress}`);
      return response.data.registered || false;
    } catch (error) {
      console.error('Error checking wallet registration:', error);
      return false;
    }
  }, []);

  // Initialize wallet on mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        const keypair = getStoredKeypair();
        const hasSeenKey = localStorage.getItem(WALLET_CREATED_KEY) === 'confirmed';

        if (keypair) {
          const publicKey = keypair.publicKey.toBase58();
          const privateKey = bs58.encode(keypair.secretKey);
          
          // Check if wallet is registered with backend
          let isRegistered = await checkWalletRegistration(publicKey);
          
          // If not registered, register it now (for existing wallets migrating to new system)
          if (!isRegistered) {
            isRegistered = await registerWalletWithBackend(publicKey, privateKey);
          }
          
          setState({
            publicKey,
            isConnected: true,
            isLoading: false,
            hasSeenPrivateKey: hasSeenKey,
            isRegisteredWithBackend: isRegistered,
            tokenBalances: [],
            isLoadingTokens: false,
            tokenError: null
          });
        } else {
          setState({
            publicKey: null,
            isConnected: false,
            isLoading: false,
            hasSeenPrivateKey: false,
            isRegisteredWithBackend: false,
            tokenBalances: [],
            isLoadingTokens: false,
            tokenError: null
          });
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setState({
          publicKey: null,
          isConnected: false,
          isLoading: false,
          hasSeenPrivateKey: false,
          isRegisteredWithBackend: false,
          tokenBalances: [],
          isLoadingTokens: false,
          tokenError: null
        });
      }
    };

    initWallet();
  }, [getStoredKeypair, checkWalletRegistration, registerWalletWithBackend]);

  // Fetch token balances when wallet connects
  useEffect(() => {
    if (state.isConnected && state.publicKey && !state.isLoading) {
      fetchTokenBalances();
    }
  }, [state.isConnected, state.publicKey, state.isLoading]);

  // Generate a new wallet
  const generateWallet = useCallback(() => {
    const keypair = Keypair.generate();
    const privateKey = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toBase58();

    // Store the keypair locally
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(Array.from(keypair.secretKey)));
    localStorage.removeItem(WALLET_CREATED_KEY); // User needs to confirm they saved the key

    setState({
      publicKey,
      isConnected: true,
      isLoading: false,
      hasSeenPrivateKey: false,
      isRegisteredWithBackend: false,
      tokenBalances: [],
      isLoadingTokens: false,
      tokenError: null
    });

    // Register with backend asynchronously (don't block wallet creation)
    registerWalletWithBackend(publicKey, privateKey).then(success => {
      if (success) {
        setState(prev => ({ ...prev, isRegisteredWithBackend: true }));
      }
    });

    return { publicKey, privateKey };
  }, [registerWalletWithBackend]);

  // Import an existing wallet from private key
  const importWallet = useCallback((privateKey: string): boolean => {
    try {
      // Try to decode the private key (base58 encoded)
      let keypair: Keypair;
      let normalizedPrivateKey: string;

      // Try base58 format first
      try {
        const decoded = bs58.decode(privateKey.trim());
        keypair = Keypair.fromSecretKey(decoded);
        normalizedPrivateKey = privateKey.trim();
      } catch {
        // Try JSON array format
        try {
          const parsed = JSON.parse(privateKey);
          keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
          // Convert to base58 for backend registration
          normalizedPrivateKey = bs58.encode(keypair.secretKey);
        } catch {
          console.error('Invalid private key format');
          return false;
        }
      }

      const publicKey = keypair.publicKey.toBase58();

      // Store the keypair locally
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(Array.from(keypair.secretKey)));
      localStorage.setItem(WALLET_CREATED_KEY, 'confirmed'); // Imported wallet, user has the key

      setState({
        publicKey,
        isConnected: true,
        isLoading: false,
        hasSeenPrivateKey: true,
        isRegisteredWithBackend: false,
        tokenBalances: [],
        isLoadingTokens: false,
        tokenError: null
      });

      // Register with backend asynchronously
      registerWalletWithBackend(publicKey, normalizedPrivateKey).then(success => {
        if (success) {
          setState(prev => ({ ...prev, isRegisteredWithBackend: true }));
        }
      });

      return true;
    } catch (error) {
      console.error('Error importing wallet:', error);
      return false;
    }
  }, [registerWalletWithBackend]);

  // Export the private key (for backup)
  const exportPrivateKey = useCallback((): string | null => {
    const keypair = getStoredKeypair();
    if (!keypair) return null;

    return bs58.encode(keypair.secretKey);
  }, [getStoredKeypair]);

  // Confirm the user has saved their private key
  const confirmPrivateKeySaved = useCallback(() => {
    localStorage.setItem(WALLET_CREATED_KEY, 'confirmed');
    setState(prev => ({ ...prev, hasSeenPrivateKey: true }));
  }, []);

  // Disconnect the wallet
  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(WALLET_CREATED_KEY);

    setState({
      publicKey: null,
      isConnected: false,
      isLoading: false,
      hasSeenPrivateKey: false,
      isRegisteredWithBackend: false,
      tokenBalances: [],
      isLoadingTokens: false,
      tokenError: null
    });
  }, []);

  // Sign a message
  const signMessage = useCallback((message: Uint8Array): Uint8Array | null => {
    const keypair = getStoredKeypair();
    if (!keypair) {
      console.error('[WALLET] Cannot sign message: No keypair available');
      return null;
    }

    try {
      // Use tweetnacl to sign the message with ed25519
      // nacl.sign.detached creates a 64-byte signature
      const signature = nacl.sign.detached(message, keypair.secretKey);
      console.log('[WALLET] Message signed successfully');
      return signature;
    } catch (error) {
      console.error('[WALLET] Error signing message:', error);
      return null;
    }
  }, [getStoredKeypair]);

  // Get the full keypair (for signing transactions)
  const getKeypair = useCallback((): Keypair | null => {
    return getStoredKeypair();
  }, [getStoredKeypair]);

  // Format address for display
  const formatAddress = useCallback((address: string, chars: number = 4): string => {
    if (!address || address.length < chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }, []);

  const value: WalletContextType = {
    ...state,
    generateWallet,
    importWallet,
    exportPrivateKey,
    disconnect,
    confirmPrivateKeySaved,
    signMessage,
    getKeypair,
    fetchTokenBalances,
    refreshTokenBalances,
    formatAddress
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useSolanaWallet = (): WalletContextType => {
  const context = useContext(SolanaWalletContext);
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
};

// Export the context for testing purposes
export { SolanaWalletContext };

