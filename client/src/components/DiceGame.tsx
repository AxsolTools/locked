import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { motion } from 'framer-motion';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { useToast } from '../hooks/use-toast';
import { useTokenConfig } from '../hooks/useTokenConfig';
import axios from 'axios';
import { Loader, Wallet, ArrowDown, ArrowUp, RefreshCw, ExternalLink } from 'lucide-react';
import { formatAddress, getExplorerUrl } from '../lib/solanaUtils';

/**
 * Game configuration from server
 */
interface GameConfig {
  enabled: boolean;
  minBetAmount: string;
  maxBetAmount: string;
  decimalPlaces: number;
  payoutEnabled: boolean;
  houseEdge: number;
}

/**
 * Game result
 */
interface GameResult {
  roll: number;
  won: boolean;
  profit: string;
  multiplier: string;
  betId?: string;
  verification?: {
    clientSeed: string;
    serverSeed: string;
    serverSeedHash: string;
  };
}

/**
 * DiceGame Component - Solana/LOCKED version
 * 
 * Balance-based betting using deposited LOCKED tokens.
 */
const DiceGame: React.FC = () => {
  // Game state
  const [betAmount, setBetAmount] = useState<number>(10);
  const [prediction, setPrediction] = useState<number>(500000);
  const [rollType, setRollType] = useState<'under' | 'over'>('over');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  // Provable fairness state
  const [clientSeed, setClientSeed] = useState<string>('');
  
  // Balance state
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  
  // Deposit/Withdraw state
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [houseWalletAddress, setHouseWalletAddress] = useState<string>('');
  
  // Configuration
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  
  // Wallet and token context
  const { publicKey, isConnected } = useSolanaWallet();
  const { toast } = useToast();
  const { token } = useTokenConfig();

  /**
   * Fetch game configuration
   */
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/dice/config');
        setGameConfig(response.data);
        if (response.data.minBetAmount) {
          setBetAmount(parseFloat(response.data.minBetAmount));
        }
      } catch (error) {
        console.error('Error fetching config:', error);
        // Use defaults
        setGameConfig({
          enabled: true,
          minBetAmount: "1",
          maxBetAmount: "10000",
          decimalPlaces: 2,
          payoutEnabled: true,
          houseEdge: 1.5
        });
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  /**
   * Fetch balance and house wallet address
   */
  useEffect(() => {
    const fetchBalanceAndHouseAddress = async () => {
      if (!publicKey) return;
      
      setIsLoadingBalance(true);
      try {
        // Fetch balance
        const balanceRes = await axios.get(`/api/balance/${publicKey}`);
        setBalance(balanceRes.data.balance || 0);
        
        // Fetch house wallet address
        const houseRes = await axios.get('/api/balance/house/address');
        setHouseWalletAddress(houseRes.data.houseWalletAddress || '');
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalanceAndHouseAddress();
  }, [publicKey]);

  /**
   * Generate client seed on mount
   */
  useEffect(() => {
    generateClientSeed();
  }, []);

  /**
   * Generate a new client seed
   */
  const generateClientSeed = () => {
    const seed = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    setClientSeed(seed);
  };

  /**
   * Calculate multiplier
   */
  const calculateMultiplier = () => {
    if (!gameConfig) return "0.00";
    
    const rawMultiplier = rollType === 'under' 
      ? (999999 / prediction) 
      : (999999 / (999999 - prediction));
    
    const houseEdgeFactor = (100 - gameConfig.houseEdge) / 100;
    return (rawMultiplier * houseEdgeFactor).toFixed(2);
  };

  /**
   * Calculate potential profit
   */
  const calculateProfit = () => {
    if (!gameConfig) return "0.00";
    
    const profit = (betAmount * parseFloat(calculateMultiplier()) - betAmount).toFixed(
      gameConfig.decimalPlaces || 2
    );
    
    return profit;
  };

  /**
   * Calculate win chance
   */
  const calculateWinChance = () => {
    return rollType === 'under' 
      ? ((prediction / 999999) * 100).toFixed(2)
      : (((999999 - prediction) / 999999) * 100).toFixed(2);
  };

  /**
   * Refresh balance
   */
  const refreshBalance = async () => {
    if (!publicKey) return;
    
    try {
      const response = await axios.get(`/api/balance/${publicKey}`);
      setBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  /**
   * Handle deposit verification
   * User sends tokens to house wallet, then submits signature for verification
   */
  const handleVerifyDeposit = async () => {
    if (!publicKey || !depositAmount) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    // Prompt user for transaction signature
    const signature = window.prompt(
      `Enter the transaction signature after sending ${token.symbol} tokens to the house wallet:`
    );

    if (!signature) return;

    setIsDepositing(true);
    try {
      const response = await axios.post('/api/balance/deposit', {
        walletAddress: publicKey,
        signature,
        amount
      });

      if (response.data.success) {
        setBalance(response.data.newBalance);
        setDepositAmount('');
        toast({
          title: "Deposit Successful",
          description: `Deposited ${response.data.amount} ${token.symbol} tokens`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.response?.data?.error || "Failed to verify deposit",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  /**
   * Handle withdrawal
   */
  const handleWithdraw = async () => {
    if (!publicKey || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await axios.post('/api/balance/withdraw', {
        walletAddress: publicKey,
        amount
      });

      if (response.data.success) {
        setBalance(response.data.newBalance);
        setWithdrawAmount('');
        toast({
          title: "Withdrawal Successful",
          description: `Withdrew ${amount} ${token.symbol} tokens`,
          action: response.data.signature ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getExplorerUrl(response.data.signature), '_blank')}
            >
              View TX
            </Button>
          ) : undefined,
        });
      }
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.response?.data?.error || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Handle roll
   */
  const handleRoll = async () => {
    if (isRolling || !publicKey) return;
    
    // Validate bet amount
    if (!gameConfig) return;
    
    const minBet = parseFloat(gameConfig.minBetAmount);
    const maxBet = parseFloat(gameConfig.maxBetAmount);
    
    if (betAmount < minBet || betAmount > maxBet) {
      toast({
        title: "Invalid Bet",
        description: `Bet must be between ${minBet} and ${maxBet} ${token.symbol}`,
        variant: "destructive",
      });
      return;
    }

    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `Deposit more ${token.symbol} tokens to place this bet`,
        variant: "destructive",
      });
      return;
    }
    
    setIsRolling(true);
    setGameResult(null);
    
    try {
      // Place bet
      const betResponse = await axios.post('/api/dice/bet', {
        walletAddress: publicKey,
        betAmount: betAmount.toString(),
        target: prediction,
        isOver: rollType === 'over',
        clientSeed
      });

      if (!betResponse.data.success) {
        throw new Error(betResponse.data.error || 'Failed to place bet');
      }

      const betId = betResponse.data.betId;
      setBalance(betResponse.data.newBalance);

      // Roll
      const rollResponse = await axios.post('/api/dice/roll', {
        betId,
        walletAddress: publicKey,
        clientSeed
      });

      if (!rollResponse.data.success) {
        throw new Error(rollResponse.data.error || 'Failed to roll');
      }

      const result: GameResult = {
        roll: rollResponse.data.result,
        won: rollResponse.data.won,
        profit: rollResponse.data.profit,
        multiplier: calculateMultiplier(),
        betId: rollResponse.data.betId,
        verification: {
          clientSeed: rollResponse.data.clientSeed,
          serverSeed: rollResponse.data.serverSeed,
          serverSeedHash: rollResponse.data.serverSeedHash
        }
      };

      setGameResult(result);
      setBalance(rollResponse.data.newBalance);
      
      // Generate new client seed
      generateClientSeed();

      // Show result toast
      if (result.won) {
        toast({
          title: "🎉 You Won!",
          description: `+${result.profit} ${token.symbol}`,
        });
      }
    } catch (error: any) {
      console.error('Roll error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to complete bet",
        variant: "destructive",
      });
      // Refresh balance in case it changed
      refreshBalance();
    } finally {
      setIsRolling(false);
    }
  };

  /**
   * Verify roll
   */
  const verifyRoll = () => {
    if (gameResult?.verification) {
      const verificationUrl = `/verify?data=${encodeURIComponent(JSON.stringify(gameResult.verification))}`;
      window.open(verificationUrl, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-zinc-900/80 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Wallet className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-lg text-gray-400">Please connect your wallet to play</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingConfig) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-zinc-900/80 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader className="h-10 w-10 animate-spin text-cyan-400 mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </CardContent>
      </Card>
    );
  }

  if (gameConfig && !gameConfig.enabled) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-zinc-900/80 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <p className="text-xl text-red-500 mb-2">Game Disabled</p>
          <p className="text-gray-400 text-center">
            The dice game is currently disabled. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="w-full max-w-3xl mx-auto bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-400" />
              Game Balance
            </span>
            <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={isLoadingBalance}>
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-white">{balance.toFixed(2)}</p>
              <p className="text-sm text-gray-400">{token.symbol} Tokens</p>
            </div>
            <div className="text-sm text-gray-400">
              Wallet: {formatAddress(publicKey || '', 4)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposit */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Deposit</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800"
                />
                <Button 
                  onClick={handleVerifyDeposit} 
                  disabled={isDepositing || !depositAmount}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isDepositing ? <Loader className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>
              {houseWalletAddress && (
                <p className="text-xs text-gray-500">
                  Send to: {formatAddress(houseWalletAddress, 6)}
                </p>
              )}
            </div>
            
            {/* Withdraw */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Withdraw</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-zinc-950/50 border-zinc-800"
                />
                <Button 
                  onClick={handleWithdraw} 
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) > balance}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {isWithdrawing ? <Loader className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Card */}
      <Card className="w-full max-w-3xl mx-auto bg-zinc-900/80 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            {token.symbol} Dice Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Bet Amount</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min={gameConfig ? parseFloat(gameConfig.minBetAmount) : 1}
                  max={Math.min(
                    gameConfig ? parseFloat(gameConfig.maxBetAmount) : 10000,
                    balance
                  )}
                  className="w-full bg-zinc-950/50 border-zinc-800"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Min: {gameConfig?.minBetAmount}</span>
                  <span>Max: {Math.min(parseFloat(gameConfig?.maxBetAmount || '10000'), balance).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Target: {prediction.toLocaleString()}
                </label>
                <Slider
                  value={[prediction]}
                  onValueChange={(value) => setPrediction(value[0])}
                  min={1}
                  max={999998}
                  step={1000}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Roll Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={rollType === 'under' ? 'default' : 'outline'}
                    onClick={() => setRollType('under')}
                    className={rollType === 'under' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  >
                    Roll Under
                  </Button>
                  <Button
                    variant={rollType === 'over' ? 'default' : 'outline'}
                    onClick={() => setRollType('over')}
                    className={rollType === 'over' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    Roll Over
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-gray-400">Win Chance</p>
                  <p className="text-lg font-bold text-white">{calculateWinChance()}%</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-gray-400">Multiplier</p>
                  <p className="text-lg font-bold text-white">{calculateMultiplier()}x</p>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800">
                <p className="text-xs text-gray-400">Potential Profit</p>
                <p className="text-lg font-bold text-emerald-400">+{calculateProfit()} {token.symbol}</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Client Seed</label>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-zinc-950/50 p-2 rounded overflow-hidden text-ellipsis text-gray-400 border border-zinc-800">
                    {clientSeed}
                  </code>
                  <Button variant="ghost" size="sm" onClick={generateClientSeed}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Result Area */}
            <div className="space-y-6">
              <Button
                onClick={handleRoll}
                disabled={isRolling || !gameConfig?.enabled || balance < betAmount}
                className="w-full h-16 text-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
              >
                {isRolling ? 'Rolling...' : 'Roll Dice'}
              </Button>
              
              {balance < betAmount && (
                <p className="text-center text-amber-500 text-sm">
                  Insufficient balance. Please deposit more {token.symbol} tokens.
                </p>
              )}
              
              {gameResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-4"
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Roll Result</div>
                    <div className="text-5xl font-bold my-2 text-white">
                      {gameResult.roll.toLocaleString()}
                    </div>
                    <div className={`text-lg font-semibold ${gameResult.won ? 'text-green-500' : 'text-red-500'}`}>
                      {gameResult.won ? '🎉 YOU WON!' : '😔 YOU LOST'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Target:</div>
                    <div className="text-right font-medium text-white">
                      {rollType === 'under' ? `< ${prediction.toLocaleString()}` : `> ${prediction.toLocaleString()}`}
                    </div>
                    
                    <div className="text-gray-400">Profit:</div>
                    <div className={`text-right font-medium ${parseFloat(gameResult.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(gameResult.profit) >= 0 ? `+${gameResult.profit}` : gameResult.profit} {token.symbol}
                    </div>
                  </div>
                  
                  {gameResult.verification && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={verifyRoll}
                      className="w-full text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Verify This Roll
                    </Button>
                  )}
                </motion.div>
              )}
              
              {!gameResult && !isRolling && (
                <div className="text-center text-gray-500 italic py-10">
                  Results will appear here after you roll.
                </div>
              )}
              
              {isRolling && (
                <div className="flex flex-col items-center justify-center py-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="text-6xl mb-4"
                  >
                    🎲
                  </motion.div>
                  <p className="text-gray-400">Rolling...</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGame;
