/**
 * Wallet storage utilities for managing wallet data using localStorage
 * This provides a central place for all wallet storage operations
 */

export interface WalletUser {
  id: number;
  walletAddress: string;
  username?: string;
  isAdmin?: boolean;
  createdAt: string;
  lastLogin: string;
  seed?: string; // Note: In production, never store seeds in localStorage!
}

const WALLET_STORAGE_KEY = 'xrp-locker-wallet-data';

/**
 * Save wallet user data to localStorage
 */
export function saveWalletToStorage(walletUser: WalletUser): void {
  try {
    console.log('Saving wallet to storage:', walletUser.walletAddress);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletUser));
  } catch (error) {
    console.error('Error saving wallet to storage:', error);
  }
}

/**
 * Get wallet user data from localStorage
 */
export function getWalletFromStorage(): WalletUser | null {
  try {
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) {
      console.log('No wallet data found in storage');
      return null;
    }
    
    const walletUser = JSON.parse(data) as WalletUser;
    console.log('Retrieved wallet from storage:', walletUser.walletAddress);
    return walletUser;
  } catch (error) {
    console.error('Error retrieving wallet from storage:', error);
    return null;
  }
}

/**
 * Check if user has a wallet stored
 */
export function hasWallet(): boolean {
  return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
}

/**
 * Remove wallet data from localStorage
 */
export function clearWalletStorage(): void {
  console.log('Clearing wallet storage');
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

/**
 * Get the current wallet address, if available
 */
export function getCurrentWalletAddress(): string | null {
  const wallet = getWalletFromStorage();
  return wallet ? wallet.walletAddress : null;
}

/**
 * Check if current user is an admin
 */
export function isCurrentUserAdmin(): boolean {
  const wallet = getWalletFromStorage();
  return wallet?.isAdmin === true;
}

/**
 * Update specific wallet properties in localStorage
 */
export function updateWalletInStorage(updates: Partial<WalletUser>): WalletUser | null {
  try {
    const wallet = getWalletFromStorage();
    if (wallet) {
      const updatedWallet = { ...wallet, ...updates };
      saveWalletToStorage(updatedWallet);
      return updatedWallet;
    }
    return null;
  } catch (error) {
    console.error("Error updating wallet in storage:", error);
    return null;
  }
} 