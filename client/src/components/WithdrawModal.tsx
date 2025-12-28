import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { useToast } from '../hooks/use-toast';
import { useTokenConfig } from '../hooks/useTokenConfig';
import axios from 'axios';
import { Loader, AlertTriangle, CheckCircle, ExternalLink, Wallet } from 'lucide-react';
import { getExplorerUrl } from '../lib/solanaUtils';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess?: () => void;
}

/**
 * WithdrawModal Component
 * 
 * Handles withdrawals from user's wallet to a specified destination.
 * Always requires a destination address - no defaults.
 */
const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'success' | 'error'>('input');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { publicKey, isRegisteredWithBackend } = useSolanaWallet();
  const { toast } = useToast();
  const { token } = useTokenConfig();

  const resetModal = () => {
    setAmount('');
    setDestinationAddress('');
    setStep('input');
    setTxSignature(null);
    setErrorMessage('');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const validateSolanaAddress = (address: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  const handleProceedToConfirm = () => {
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw this amount",
        variant: "destructive",
      });
      return;
    }

    if (!validateSolanaAddress(destinationAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana wallet address",
        variant: "destructive",
      });
      return;
    }

    // Same address check
    if (destinationAddress === publicKey) {
      toast({
        title: "Same Address",
        description: "Destination cannot be your own wallet",
        variant: "destructive",
      });
      return;
    }

    setStep('confirm');
  };

  const handleWithdraw = async () => {
    if (!publicKey || !isRegisteredWithBackend) {
      toast({
        title: "Wallet Not Ready",
        description: "Please reconnect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const response = await axios.post('/api/balance/withdraw', {
        walletAddress: publicKey,
        amount: parseFloat(amount),
        destinationAddress
      });

      if (response.data.success) {
        setTxSignature(response.data.signature);
        setStep('success');
        
        toast({
          title: "Withdrawal Successful",
          description: `Sent ${amount} ${token.symbol} to ${destinationAddress.slice(0, 8)}...`,
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.data.error || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to process withdrawal');
      setStep('error');
      
      toast({
        title: "Withdrawal Failed",
        description: error.response?.data?.error || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw {token.symbol}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && "Send tokens from your wallet to any destination address."}
            {step === 'confirm' && "Please review and confirm your withdrawal."}
            {step === 'success' && "Your withdrawal has been completed successfully!"}
            {step === 'error' && "There was an error processing your withdrawal."}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-background/50 border-border"
                />
                <Button 
                  variant="outline" 
                  onClick={handleMaxAmount}
                  className="shrink-0"
                >
                  MAX
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {balance.toFixed(4)} {token.symbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Address</Label>
              <Input
                id="destination"
                type="text"
                placeholder="Enter Solana wallet address"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value.trim())}
                className="bg-background/50 border-border font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter the Solana wallet address where you want to receive the tokens
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-500">
                  <strong>Important:</strong> Double-check the destination address. 
                  Cryptocurrency transactions cannot be reversed.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{parseFloat(amount).toFixed(4)} {token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-mono text-sm">{publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-mono text-sm">{destinationAddress.slice(0, 8)}...{destinationAddress.slice(-8)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-500">
                  This action is irreversible. Please make sure all details are correct before confirming.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-foreground">Withdrawal Complete!</p>
              <p className="text-muted-foreground text-center">
                {parseFloat(amount).toFixed(4)} {token.symbol} sent successfully
              </p>
            </div>

            {txSignature && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(getExplorerUrl(txSignature), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Transaction
              </Button>
            )}
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center py-4">
              <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-lg font-medium text-foreground">Withdrawal Failed</p>
              <p className="text-muted-foreground text-center text-sm">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToConfirm}
                disabled={!amount || !destinationAddress}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')} disabled={isProcessing}>
                Back
              </Button>
              <Button 
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </>
          )}

          {(step === 'success' || step === 'error') && (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;

