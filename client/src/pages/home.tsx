import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, BarChart3, LockIcon, Wallet as WalletIcon, Coins, Rocket, ChevronRight, Dice1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedLockBot from "@/components/mascot/AnimatedLockBot";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Badge } from "@/components/ui/badge";

const Home = () => {
  const [, setLocation] = useLocation();
  const { isConnected } = useSolanaWallet();
  const walletConnected = isConnected;

  return (
    <div className="w-full bg-[#0f172a]">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="container mx-auto px-6 z-10 relative max-w-6xl">
          <div className="grid grid-cols-12 gap-6">
            {/* Content Area - Left Side */}
            <div className="col-span-12 lg:col-span-9">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                Lock Your <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">LOCKED</span> Tokens 
                <br />
                on <span className="text-[#14F195]">Solana</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-12 max-w-2xl">
                Secure your SPL tokens with our advanced locking mechanism
                on Solana. Set custom timeframes, vesting schedules,
                or play the provably fair dice game.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-16">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 rounded-lg"
                  onClick={() => {
                    setLocation("/lock-tokens");
                  }}
                >
                  Start Locking Now
                </Button>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10,
                    delay: 0.2
                  }}
                >
                  <Button 
                    asChild
                    size="lg" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold px-8 rounded-lg relative overflow-hidden group"
                  >
                    <Link href="/dice-game">
                      <span className="relative z-10 flex items-center">
                        🎲 DICE GAME
                        <Dice1 className="h-5 w-5 ml-2 group-hover:rotate-[360deg] transition-transform duration-500" />
                      </span>
                    </Link>
                  </Button>
                </motion.div>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-purple-500/30 hover:bg-purple-500/10 rounded-lg"
                  onClick={() => {
                    setLocation("/roadmap");
                  }}
                >
                  View Roadmap
                </Button>
              </div>
              
              <div className="flex items-center flex-wrap gap-8">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#14F195]" />
                  <span className="text-gray-300">100% Secure</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-[#14F195]" />
                  <span className="text-gray-300">Lightning Fast</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <LockIcon className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-300">Provably Fair</span>
                </div>
              </div>
            </div>
            
            {/* Robot Area - Right Side */}
            <div className="hidden lg:flex col-span-3 items-start justify-start mt-4">
              <div className="w-[220px] h-[220px]">
                <AnimatedLockBot size="md" withSpeechBubble={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">
            Supercharge Your <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">LOCKED</span> Assets
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-8 shadow-lg border border-purple-500/30">
              <div className="h-12 w-12 mb-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Custom Lock Periods</h3>
              <p className="text-gray-400">
                Lock your tokens for any time period from one day to multiple years. Complete flexibility for your investment strategy.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-8 shadow-lg border border-pink-500/30">
              <div className="h-12 w-12 mb-6 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Secure & Trustless</h3>
              <p className="text-gray-400">
                Your wallet keys stay on your device. We never have access to your private keys - true self-custody.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-8 shadow-lg border border-purple-500/30">
              <div className="h-12 w-12 mb-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Dice1 className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Provably Fair Games</h3>
              <p className="text-gray-400">
                Play our dice game with cryptographically provable fairness. Verify every roll with transparent server and client seeds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section id="token" className="py-20 bg-gray-900/50 border-y border-purple-500/20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <Badge className="mb-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">SPL Token</Badge>
              <h2 className="text-4xl font-bold mb-6 text-white">
                The <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">LOCKED</span> Token
              </h2>
              <p className="text-gray-300 mb-6">
                Our native utility token on Solana with powerful tokenomics designed to reward 
                holders and enable the LOCKED ecosystem.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400 mb-1">Network</p>
                  <p className="text-2xl font-bold text-[#14F195]">Solana</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-sm text-gray-400 mb-1">Token Type</p>
                  <p className="text-2xl font-bold text-white">SPL</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 col-span-2 border border-purple-500/20">
                  <p className="text-sm text-gray-400 mb-1">Use Cases</p>
                  <p className="font-medium text-white">Dice Game betting, Token Locking, Governance</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Link href="/dice-game">
                    Play Dice Game <Dice1 className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-purple-500/30 hover:bg-purple-500/10" asChild>
                  <Link href="/roadmap">
                    Roadmap <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="md:w-1/2 relative">
              {/* Animated token visualization */}
              <div className="relative h-[360px] w-full flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/20 w-[280px] h-[280px] mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[220px] h-[220px] rounded-full border-4 border-dashed border-pink-500/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[160px] h-[160px] rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <div className="text-center">
                    <LockIcon className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-2xl font-bold">LOCKED</div>
                  </div>
                </div>
                
                {/* Animated tokens */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-10 h-10 rounded-full bg-gray-800 border border-pink-500 flex items-center justify-center shadow-lg"
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                      x: [0, (140 * Math.cos(i * Math.PI / 4))],
                      y: [0, (140 * Math.sin(i * Math.PI / 4))],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <Coins className="h-5 w-5 text-[#14F195]" />
                  </motion.div>
                ))}
                
                {/* Solana badge */}
                <motion.div 
                  className="absolute bottom-0 left-[50%] translate-x-[-50%] bg-gray-800 border border-purple-500/30 rounded-lg p-3 shadow-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#14F195]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#14F195] text-lg">◎</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white font-medium">Powered by Solana</span>
                      <p className="text-xs text-gray-400">Fast & Low Cost</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dice Game Promo Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 md:p-12 border border-purple-500/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  🎲 Provably Fair Dice Game
                </h2>
                <p className="text-gray-300 mb-6">
                  Try your luck with our provably fair dice game! Deposit LOCKED tokens, 
                  place bets, and verify every roll with cryptographic proof. 
                  Low house edge, instant payouts.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    asChild
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Link href="/dice-game">
                      Play Now <Dice1 className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    size="lg" 
                    variant="outline"
                    className="border-purple-500/30 hover:bg-purple-500/10"
                  >
                    <Link href="/verify">
                      Learn About Fairness <Shield className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <motion.div
                  animate={{ 
                    rotateY: [0, 360],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl"
                >
                  🎲
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-20 border-t border-purple-500/20">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Generate a wallet, deposit some LOCKED tokens, and start playing or locking your assets on Solana.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 rounded-lg"
              onClick={() => setLocation("/dashboard")}
            >
              Go to Dashboard
            </Button>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                asChild
                size="lg" 
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 rounded-lg relative overflow-hidden group"
              >
                <Link href="/dice-game">
                  <span className="relative z-10 flex items-center">
                    TRY DICE GAME
                    <Dice1 className="h-5 w-5 ml-2 group-hover:rotate-[360deg] transition-transform duration-500" />
                  </span>
                </Link>
              </Button>
            </motion.div>
            
            <Button 
              asChild
              size="lg" 
              variant="outline" 
              className="border-purple-500/30 hover:bg-purple-500/10 rounded-lg"
            >
              <Link href="/roadmap">
                View Full Roadmap <Rocket className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
