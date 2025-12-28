/**
 * Solana Wallet Generator Component
 * 
 * Displays when a user doesn't have a wallet and needs to:
 * 1. Generate a new wallet
 * 2. Or import an existing one
 * 
 * IMPORTANT: Shows the private key ONCE and requires confirmation before proceeding
 */

import React, { useState, useCallback } from 'react';
import { useSolanaWallet } from '../../contexts/SolanaWalletContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Copy, Check, AlertTriangle, Key, Shield, Wallet } from 'lucide-react';

interface SolanaWalletGeneratorProps {
  onComplete?: () => void;
}

export const SolanaWalletGenerator: React.FC<SolanaWalletGeneratorProps> = ({ onComplete }) => {
  const { generateWallet, importWallet, confirmPrivateKeySaved, isConnected, hasSeenPrivateKey } = useSolanaWallet();
  
  const [generatedKeys, setGeneratedKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [importKey, setImportKey] = useState('');
  const [importError, setImportError] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Generate new wallet
  const handleGenerateWallet = useCallback(() => {
    const keys = generateWallet();
    setGeneratedKeys(keys);
    setShowPrivateKey(true);
  }, [generateWallet]);

  // Copy private key to clipboard
  const handleCopyPrivateKey = useCallback(async () => {
    if (!generatedKeys) return;

    try {
      await navigator.clipboard.writeText(generatedKeys.privateKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [generatedKeys]);

  // Confirm saved and proceed
  const handleConfirmSaved = useCallback(() => {
    if (!hasSavedKey) return;
    
    confirmPrivateKeySaved();
    if (onComplete) onComplete();
  }, [hasSavedKey, confirmPrivateKeySaved, onComplete]);

  // Import existing wallet
  const handleImportWallet = useCallback(() => {
    setImportError('');
    
    if (!importKey.trim()) {
      setImportError('Please enter a private key');
      return;
    }

    const success = importWallet(importKey.trim());
    
    if (success) {
      if (onComplete) onComplete();
    } else {
      setImportError('Invalid private key format. Please check and try again.');
    }
  }, [importKey, importWallet, onComplete]);

  // If wallet is connected and user has seen the key, don't show this component
  if (isConnected && hasSeenPrivateKey) {
    return null;
  }

  // If we just generated a wallet, show the private key confirmation screen
  if (generatedKeys && showPrivateKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-zinc-900/90 border-zinc-800 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl text-white">Save Your Private Key!</CardTitle>
            <CardDescription className="text-gray-400">
              This is the ONLY time your private key will be shown. Save it securely now.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Security Warning</AlertTitle>
              <AlertDescription>
                If you lose this private key, you will lose access to your wallet and all funds. 
                There is NO way to recover it. Save it somewhere safe NOW.
              </AlertDescription>
            </Alert>

            {/* Public Key Display */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Your Wallet Address (Public Key)</label>
              <div className="bg-zinc-950 rounded-lg p-3 font-mono text-sm text-cyan-400 break-all border border-zinc-800">
                {generatedKeys.publicKey}
              </div>
            </div>

            {/* Private Key Display */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Your Private Key (Keep Secret!)</label>
              <div className="relative">
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-sm text-amber-400 break-all border border-zinc-800">
                  {generatedKeys.privateKey}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1"
                  onClick={handleCopyPrivateKey}
                >
                  {hasCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-3 bg-cyan-950/30 rounded-lg p-4 border border-cyan-500/30">
              <Checkbox
                id="saved-key"
                checked={hasSavedKey}
                onCheckedChange={(checked) => setHasSavedKey(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="saved-key"
                className="text-sm text-gray-300 cursor-pointer leading-relaxed"
              >
                I have saved my private key in a secure location and understand that 
                I am solely responsible for keeping it safe. I will NEVER share it with anyone.
              </label>
            </div>

            {/* Proceed Button */}
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black"
              size="lg"
              disabled={!hasSavedKey}
              onClick={handleConfirmSaved}
            >
              <Shield className="mr-2 h-5 w-5" />
              I've Saved My Key - Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initial screen: Generate or Import
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-zinc-900/90 border-zinc-800 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-cyan-400" />
          </div>
          <CardTitle className="text-2xl text-white">Welcome to LOCKED</CardTitle>
          <CardDescription className="text-gray-400">
            Create a new wallet or import an existing one to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create">Create New Wallet</TabsTrigger>
              <TabsTrigger value="import">Import Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="text-center text-gray-400 text-sm mb-4">
                Generate a brand new Solana wallet. You'll receive a private key 
                that you must save securely.
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black"
                size="lg"
                onClick={handleGenerateWallet}
              >
                <Key className="mr-2 h-5 w-5" />
                Generate New Wallet
              </Button>
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4">
              <div className="text-center text-gray-400 text-sm mb-4">
                Import an existing Solana wallet using your private key
              </div>
              
              <Input
                type="password"
                placeholder="Enter your private key (base58)"
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                className="bg-zinc-950 border-zinc-700"
              />
              
              {importError && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black"
                size="lg"
                onClick={handleImportWallet}
              >
                Import Wallet
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolanaWalletGenerator;

