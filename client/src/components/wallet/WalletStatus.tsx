/**
 * Wallet Status Component - Solana Version
 * 
 * Displays connected wallet information:
 * - Wallet address (shortened)
 * - Dropdown menu with options to view on explorer, copy address, and disconnect
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ChevronDown, LogOut, ExternalLink, Copy, Check, Key } from 'lucide-react';
import { useSolanaWallet } from '../../contexts/SolanaWalletContext';

const WalletStatus = () => {
  const { toast } = useToast();
  const { publicKey, isConnected, disconnect, exportPrivateKey, formatAddress } = useSolanaWallet();
  const [copied, setCopied] = useState(false);
  const [showingKey, setShowingKey] = useState(false);
  
  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!publicKey) return;
    
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // Show private key with warning
  const handleShowPrivateKey = () => {
    const key = exportPrivateKey();
    if (!key) return;
    
    // Use prompt for simplicity - in production, use a modal
    const confirmed = window.confirm(
      '⚠️ WARNING: Your private key gives full access to your wallet.\n\n' +
      'Never share it with anyone!\n\n' +
      'Click OK to copy your private key to clipboard.'
    );
    
    if (confirmed) {
      navigator.clipboard.writeText(key);
      toast({
        title: 'Private Key Copied',
        description: 'Your private key has been copied. Store it safely!',
        variant: 'destructive',
      });
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to disconnect?\n\n' +
      'Make sure you have saved your private key before disconnecting!\n\n' +
      'You will need your private key to access this wallet again.'
    );
    
    if (confirmed) {
      disconnect();
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
      // Reload to reset app state
      setTimeout(() => window.location.reload(), 500);
    }
  };
  
  // Open Solana Explorer
  const openExplorer = () => {
    if (!publicKey) return;
    window.open(
      `https://explorer.solana.com/address/${publicKey}?cluster=mainnet-beta`,
      '_blank'
    );
  };
  
  // Open Solscan
  const openSolscan = () => {
    if (!publicKey) return;
    window.open(
      `https://solscan.io/account/${publicKey}`,
      '_blank'
    );
  };
  
  if (!isConnected || !publicKey) {
    return null; // Don't show anything if not connected
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Desktop display */}
      <div className="hidden md:block bg-purple-500/10 p-2 rounded-md text-xs">
        <div className="flex items-center gap-2">
          <Wallet className="h-3 w-3 text-purple-500" />
          <span className="font-medium text-gray-300">{formatAddress(publicKey, 4)}</span>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 border-purple-500/30 hover:bg-purple-500/10">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-500" />
              <span className="md:hidden text-sm">{formatAddress(publicKey, 4)}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
          <DropdownMenuLabel className="text-gray-300">My Wallet</DropdownMenuLabel>
          <DropdownMenuItem 
            className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-white"
            onClick={handleCopyAddress}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="font-mono text-xs">{formatAddress(publicKey, 6)}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem onClick={openExplorer} className="flex items-center gap-2 cursor-pointer">
            <ExternalLink className="h-4 w-4" />
            View on Solana Explorer
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={openSolscan} className="flex items-center gap-2 cursor-pointer">
            <ExternalLink className="h-4 w-4" />
            View on Solscan
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            onClick={handleShowPrivateKey}
            className="flex items-center gap-2 cursor-pointer text-amber-500 hover:text-amber-400"
          >
            <Key className="h-4 w-4" />
            Export Private Key
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            className="flex items-center gap-2 text-red-500 hover:text-red-400 cursor-pointer" 
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default WalletStatus;

