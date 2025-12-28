import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import DefaultLayout from '../layouts/default';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { useToast } from '../hooks/use-toast';
import { useTokenConfig } from '../hooks/useTokenConfig';
import DiceGame from '../components/DiceGame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Dice1 as Dice, Sparkles, Trophy, Coins, Medal, Shield, Check, Info } from 'lucide-react';
import Lottie from 'lottie-react';
import diceAnimation from '../assets/dice-animation.json';
import coinAnimation from '../assets/coin-animation.json';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

interface LeaderboardEntry {
  address: string;
  profit: string;
  winRate: string;
  totalBets: number;
}

interface LiveBet {
  id: string;
  address: string;
  amount: string;
  target: number;
  rollType: 'over' | 'under';
  result?: number;
  won?: boolean;
  profit?: string;
  timestamp: string;
  tokenSymbol?: string;
}

const DiceGamePage: React.FC = () => {
  const { publicKey, isConnected } = useSolanaWallet();
  const { toast } = useToast();
  const { token } = useTokenConfig();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Format wallet address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Format timestamp for live feed
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Play sound effect for new bets
  const playNewBetSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(err => console.error('Error playing sound:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Show notification for new bet
  const showBetNotification = (bet: LiveBet) => {
    if (!notificationsEnabled) return;
    toast({
      title: "New Bet Placed",
      description: `${formatAddress(bet.address)} bet ${bet.amount} ${token.symbol}`,
      duration: 3000,
    });
  };
  
  // Show notification for bet result
  const showResultNotification = (betId: string, result: number, won: boolean, profit: string) => {
    if (!notificationsEnabled) return;
    const bet = liveBets.find(b => b.id === betId);
    if (!bet) return;
    
    toast({
      title: won ? "Bet Won! 🎉" : "Bet Lost",
      description: `${formatAddress(bet.address)} ${won ? 'won' : 'lost'} ${profit}`,
      variant: won ? "default" : "destructive",
      duration: 4000,
    });
  };

  // WebSocket connection for live bets
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connectWebSocket = () => {
      if (ws) ws.close();
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/dice/live`);
      
      ws.addEventListener('open', () => {
        console.log('Connected to dice game live feed');
        setWsConnected(true);
        reconnectAttempts = 0;
        
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      });
      
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'bet') {
            setLiveBets(prevBets => [data.bet, ...prevBets].slice(0, 100));
            playNewBetSound();
            showBetNotification(data.bet);
          } else if (data.type === 'result') {
            setLiveBets(prevBets => 
              prevBets.map(bet => 
                bet.id === data.betId 
                  ? { ...bet, result: data.result, won: data.won, profit: data.profit } 
                  : bet
              )
            );
            showResultNotification(data.betId, data.result, data.won, data.profit);
          } else if (data.type === 'historical_bets') {
            if (data.bets && Array.isArray(data.bets) && data.bets.length > 0) {
              const sortedBets = [...data.bets].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              setLiveBets(sortedBets);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      ws.addEventListener('close', () => {
        console.log('Disconnected from dice game live feed');
        setWsConnected(false);
        if (pingInterval) clearInterval(pingInterval);
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, reconnectDelay);
        }
      });
      
      ws.addEventListener('error', () => setWsConnected(false));
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) ws.close();
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const response = await fetch('/api/dice/leaderboard');
        if (response.ok) {
          const data = await response.json();
          if (data && data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 120000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { when: 'beforeChildren', staggerChildren: 0.3, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: 'easeInOut' }
  };

  return (
    <DefaultLayout>
      <Helmet>
        <title>{token.symbol} Dice Game | Provably Fair Dice Game on Solana</title>
        <meta name="description" content={`Play the ${token.symbol} Dice Game - a provably fair dice game built on Solana where you can win ${token.symbol} tokens.`} />
      </Helmet>

      <motion.div className="container mx-auto py-8" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Hero section */}
        <motion.div className="mb-12 text-center relative overflow-hidden" variants={itemVariants}>
          <div className="absolute -top-10 -left-10 w-40 h-40 opacity-20">
            <Lottie animationData={diceAnimation} />
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-20">
            <Lottie animationData={coinAnimation} />
          </div>
          
          <motion.h1 
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            {token.symbol} Dice Game
          </motion.h1>
          <motion.p className="text-xl text-gray-400 mb-8" variants={itemVariants}>
            Provably fair dice game built on Solana
          </motion.p>
          
          <motion.div className="flex flex-wrap justify-center gap-8 mt-10" variants={itemVariants}>
            <motion.div className="flex items-center gap-2 text-purple-500" animate={floatingAnimation}>
              <Dice className="h-5 w-5" />
              <span>Provably Fair</span>
            </motion.div>
            <motion.div className="flex items-center gap-2 text-pink-500" animate={floatingAnimation}>
              <Sparkles className="h-5 w-5" />
              <span>Instant Results</span>
            </motion.div>
            <motion.div className="flex items-center gap-2 text-purple-500" animate={floatingAnimation}>
              <Trophy className="h-5 w-5" />
              <span>Leaderboard</span>
            </motion.div>
            <motion.div className="flex items-center gap-2 text-pink-500" animate={floatingAnimation}>
              <Coins className="h-5 w-5" />
              <span>Win {token.symbol}</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main game area */}
        <motion.div variants={itemVariants} className="relative">
          <motion.div 
            className="absolute -top-20 -left-10 text-purple-500/10 text-9xl z-0 pointer-events-none"
            animate={{ rotate: [0, 360], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
          >
            ⚄
          </motion.div>
          <motion.div 
            className="absolute -bottom-10 -right-10 text-pink-600/10 text-9xl z-0 pointer-events-none"
            animate={{ rotate: [360, 0], scale: [1.1, 0.9, 1.1] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
          >
            ⚂
          </motion.div>
          
          <div className="relative z-10">
            <DiceGame />
          </div>
        </motion.div>
        
        {/* Live Bets Feed */}
        <motion.div className="mt-20" variants={itemVariants}>
          <motion.h2 
            className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="inline-block mr-2 mb-1" /> Live Bets
            {wsConnected ? (
              <span className="ml-2 inline-flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            ) : (
              <span className="ml-2 inline-flex h-3 w-3 relative">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </motion.h2>
          
          <Card className="overflow-hidden bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900/50">
                    <TableHead className="w-[60px] text-purple-500">Time</TableHead>
                    <TableHead className="text-purple-500">Player</TableHead>
                    <TableHead className="text-purple-500">Bet Amount</TableHead>
                    <TableHead className="text-purple-500">Target</TableHead>
                    <TableHead className="text-purple-500">Result</TableHead>
                    <TableHead className="text-purple-500 text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveBets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {wsConnected ? 'Waiting for live bets...' : 'Connecting to live feed...'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveBets.map((bet, index) => (
                      <motion.tr
                        key={bet.id}
                        initial={{ opacity: 0, backgroundColor: index === 0 ? 'rgba(168, 85, 247, 0.2)' : '' }}
                        animate={{ 
                          opacity: 1, 
                          backgroundColor: bet.result !== undefined 
                            ? (bet.won ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)') 
                            : ''
                        }}
                        transition={{ duration: 0.8 }}
                        className={`${index === 0 ? 'border-l-2 border-purple-500' : ''}`}
                      >
                        <TableCell className="font-medium">
                          {formatTimestamp(bet.timestamp)}
                          {index === 0 && <span className="ml-2 text-xs text-purple-500">NEW</span>}
                        </TableCell>
                        <TableCell>
                          {formatAddress(bet.address)}
                          {bet.address === publicKey && (
                            <span className="ml-2 text-xs bg-purple-500 text-white px-1 py-0.5 rounded-sm">YOU</span>
                          )}
                        </TableCell>
                        <TableCell>{bet.amount} {bet.tokenSymbol || token.symbol}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700">
                            {bet.rollType === 'over' ? '>' : '<'} {bet.target.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {bet.result !== undefined ? (
                            <span className="font-semibold">{bet.result.toLocaleString()}</span>
                          ) : (
                            <div className="h-4 w-12 bg-gray-700/30 rounded animate-pulse"></div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {bet.profit ? (
                            <span className={parseFloat(bet.profit) >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {parseFloat(bet.profit) >= 0 ? '+' : ''}{bet.profit}
                            </span>
                          ) : (
                            <div className="h-4 w-16 ml-auto bg-gray-700/30 rounded animate-pulse"></div>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Leaderboard Section */}
        <motion.div className="mt-12" variants={itemVariants}>
          <motion.h2 
            className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Trophy className="inline-block mr-2 mb-1" /> Leaderboard
          </motion.h2>
          
          <Card className="overflow-hidden bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-900/50">
                    <TableHead className="w-[60px] text-purple-500">Rank</TableHead>
                    <TableHead className="text-purple-500">Player</TableHead>
                    <TableHead className="text-purple-500">Profit</TableHead>
                    <TableHead className="text-purple-500">Win Rate</TableHead>
                    <TableHead className="text-purple-500 text-right">Total Bets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeaderboard ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell><div className="h-4 w-8 bg-gray-700/30 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-gray-700/30 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-gray-700/30 rounded animate-pulse"></div></TableCell>
                        <TableCell className="text-right"><div className="h-4 w-10 ml-auto bg-gray-700/30 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <TableRow 
                        key={index} 
                        className={`${index < 3 ? 'bg-purple-500/5' : ''} ${entry.address === publicKey ? 'bg-purple-500/10' : ''}`}
                      >
                        <TableCell className="font-medium">
                          {index === 0 && <Medal className="inline text-yellow-500" size={20} />}
                          {index === 1 && <Medal className="inline text-gray-400" size={18} />}
                          {index === 2 && <Medal className="inline text-amber-700" size={16} />}
                          {index > 2 && `#${index + 1}`}
                        </TableCell>
                        <TableCell>
                          {formatAddress(entry.address)}
                          {entry.address === publicKey && (
                            <span className="ml-2 text-xs bg-purple-500 text-white px-1 py-0.5 rounded-sm">YOU</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`${parseFloat(entry.profit) > 0 ? 'text-green-500' : parseFloat(entry.profit) < 0 ? 'text-red-500' : 'text-gray-400'} font-semibold`}>
                            {parseFloat(entry.profit) > 0 ? '+' : ''}{parseFloat(entry.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-700 h-2 w-20 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${parseFloat(entry.winRate.replace('%', ''))}%` }}></div>
                            </div>
                            <span>{entry.winRate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{entry.totalBets.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No data available. Be the first to play!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Provably Fair Explanation */}
        <motion.div className="mt-20" variants={itemVariants}>
          <motion.h2 
            className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Shield className="inline-block mr-2 mb-1" /> Provably Fair System
          </motion.h2>
          
          <Card className="overflow-hidden bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-white">How Our Provably Fair System Works</CardTitle>
              <CardDescription className="text-gray-400">
                Our dice game uses a cryptographic algorithm to ensure fair and verifiable results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div className="p-4 border border-gray-700 rounded-lg" whileHover={{ scale: 1.02 }}>
                  <h3 className="text-lg font-semibold text-purple-500 mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Client Seed
                  </h3>
                  <p className="text-sm text-gray-400">
                    You provide a random seed value or generate one automatically. You can change this seed at any time.
                  </p>
                </motion.div>
                <motion.div className="p-4 border border-gray-700 rounded-lg" whileHover={{ scale: 1.02 }}>
                  <h3 className="text-lg font-semibold text-purple-500 mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Server Seed
                  </h3>
                  <p className="text-sm text-gray-400">
                    The server generates a random seed. Only the hash of this seed is shared before the bet to prevent manipulation.
                  </p>
                </motion.div>
                <motion.div className="p-4 border border-gray-700 rounded-lg" whileHover={{ scale: 1.02 }}>
                  <h3 className="text-lg font-semibold text-purple-500 mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Result Generation
                  </h3>
                  <p className="text-sm text-gray-400">
                    Both seeds are combined and hashed to generate a provably random number between 0-999,999.
                  </p>
                </motion.div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Verification Process</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                  <li>Before rolling, you can see the hash of the server seed.</li>
                  <li>After the roll, you can verify the result by checking that the revealed server seed matches the initial hash.</li>
                  <li>You can use the verification tool to confirm that the roll result was generated correctly.</li>
                </ol>
                
                <div className="mt-6 bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="flex items-center text-purple-500 mb-2">
                    <Check className="mr-2 h-4 w-4" /> Why This Matters
                  </h4>
                  <p className="text-sm text-gray-400">
                    This system ensures that neither the player nor the house can predict or manipulate the outcome of any roll. 
                    The result is cryptographically guaranteed to be random and fair, providing complete transparency.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DefaultLayout>
  );
};

export default DiceGamePage;
