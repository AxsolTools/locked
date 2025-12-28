/**
 * Solana Wallet Import Component
 * 
 * Allows importing an existing Solana wallet using a private key
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useSolanaWallet } from '../../contexts/SolanaWalletContext';
import { AlertTriangle, Loader } from 'lucide-react';

interface WalletImportProps {
  onComplete?: () => void;
}

export function WalletImport({ onComplete }: WalletImportProps) {
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { importWallet } = useSolanaWallet();

  // Helper function to truncate addresses for display
  const truncateAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  const handlePrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrivateKey(e.target.value);
    setError(""); // Clear error when input changes
  };

  const handleImport = async () => {
    if (!privateKey.trim()) {
      setError("Please enter your private key");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const success = importWallet(privateKey.trim());
      
      if (success) {
        toast({
          title: "Wallet Imported",
          description: "Your wallet has been successfully imported",
        });
        
        // Call completion callback or redirect
        if (onComplete) {
          onComplete();
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError("Invalid private key format. Please check and try again.");
      }
    } catch (err) {
      console.error("Wallet import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800/90 rounded-xl shadow-md p-6 border border-purple-500/30">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Import Solana Wallet</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="privateKey" className="block text-sm font-medium text-gray-300">
            Enter your private key (Base58 format)
          </label>
          <Input
            id="privateKey"
            type="password"
            placeholder="Your Base58 encoded private key..."
            value={privateKey}
            onChange={handlePrivateKeyChange}
            disabled={isLoading}
            className="w-full bg-gray-900/50 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">
            Your private key is stored locally in your browser and never sent to any server.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleImport} 
          disabled={isLoading || !privateKey.trim()} 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            "Import Wallet"
          )}
        </Button>
        
        <div className="mt-4 p-3 bg-amber-900/30 rounded-lg border border-amber-500/30">
          <p className="text-xs text-amber-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Never share your private key with anyone. LOCKED will never ask for your private key 
              outside of this import process.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default WalletImport;
