import { useState, useEffect, useCallback } from 'react';
import { getWalletFromStorage, saveWalletToStorage, clearWalletStorage, WalletUser } from '@/lib/walletStorage';
import { getAccountBalances } from '@/lib/xrplUtils';

interface GlobalWalletReturn {
  wallet: WalletUser | null;
  balance: string;
  isConnected: boolean;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

/**
 * A global hook to manage wallet state throughout the application
 * This replaces the previous useWallet context with a localStorage-based approach
 */
export function useGlobalWallet(): GlobalWalletReturn {
  const [wallet, setWallet] = useState<WalletUser | null>(null);
  const [balance, setBalance] = useState<string>('0.0');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load wallet from storage on mount
  useEffect(() => {
    const storedWallet = getWalletFromStorage();
    if (storedWallet) {
      setWallet(storedWallet);
      fetchBalance(storedWallet.walletAddress);
    }
  }, []);

  // Fetch wallet balance
  const fetchBalance = async (address: string) => {
    try {
      setIsRefreshing(true);
      const balances = await getAccountBalances(address);
      const xrpBalance = balances.find(b => b.currency === 'XRP');
      if (xrpBalance) {
        setBalance(xrpBalance.value);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle refreshing the balance
  const refreshBalance = useCallback(async () => {
    if (wallet?.walletAddress) {
      await fetchBalance(wallet.walletAddress);
    }
  }, [wallet?.walletAddress]);

  // Logout/disconnect wallet
  const disconnectWallet = () => {
    setWallet(null);
    setBalance('0.0');
    clearWalletStorage();
  };

  return {
    wallet,
    balance,
    isConnected: !!wallet,
    disconnectWallet,
    refreshBalance
  };
}

// Export a type-only interface for WalletUser to be used elsewhere
export type { WalletUser }; 