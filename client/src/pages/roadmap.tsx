import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import AnimatedLockBot from "@/components/mascot/AnimatedLockBot";
import { Check, Clock, Lock, Rocket, ChevronRight, Zap, Layers, ShieldCheck, LineChart, ArrowRight, Coins, Code, Globe, Twitter, Dice5 } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Custom CSS styles
const styles = {
  textGradient: "bg-clip-text text-transparent bg-gradient-to-r from-[#9945FF] to-[#9945FF]",
  cardHover: "transition-all duration-300 hover:border-[#9945FF]/50 hover:shadow-lg",
  phaseMarker: "absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 border-[#121A2F] flex items-center justify-center z-20",
  timelineLine: "absolute top-0 left-0 right-0 h-1 rounded-full",
  hideScrollbar: "overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
};

// Token distribution data
const tokenData = {
  totalSupply: "1,000,000,000",
  symbol: "LOCKED",
  feeDistribution: "85%",
  topHolders: 100,
  initialPrice: "$0.005",
};

// Roadmap phase data
const roadmapPhases = [
  {
    id: "phase1",
    title: "Genesis Phase",
    timeline: "Q3-Q4 2024",
    status: "in-progress",
    description: "Platform launch and token distribution",
    achievements: [
      { text: "Launch of LOCKED ROOM platform", completed: true },
      { text: "LOCKED token issuance (1B supply)", completed: true },
      { text: "Basic locking mechanism implementation", completed: true },
      { text: "Initial security audits", completed: true },
      { text: "Token holder fee distribution system", completed: false },
      { text: "Community building initiatives", completed: false },
    ],
    keyFeature: {
      title: "Automated Fee Distribution",
      description: "85% of platform fees automatically distributed to top 100 LOCKED token holders, creating a sustainable revenue model for long-term holders.",
      icon: <Coins className="h-8 w-8 text-[#9945FF]" />,
    }
  },
  {
    id: "phase2",
    title: "Expansion Phase",
    timeline: "Q1-Q2 2025",
    status: "upcoming",
    description: "Enhanced functionality and ecosystem integration",
    achievements: [
      { text: "Provably fair dice game with 5% profit distribution to top holders", completed: false },
      { text: "Advanced locking strategies with flexible conditions", completed: false },
      { text: "Multi-signature lock controls", completed: false },
      { text: "DEX integration for seamless token swaps", completed: false },
      { text: "Mobile app beta launch", completed: false },
      { text: "Partnership with major Solana projects", completed: false },
    ],
    keyFeature: {
      title: "Gaming & Yield Enhancement",
      description: "Lock tokens for longer periods to earn boosted yields and enjoy platform games like our provably fair dice game where 5% of all betting profits are automatically distributed to top 100 token holders.",
      icon: <Dice5 className="h-8 w-8 text-[#9945FF]" />,
    }
  },
  {
    id: "phase3",
    title: "Innovation Phase",
    timeline: "Q3-Q4 2025",
    status: "upcoming",
    description: "Cutting-edge Solana features integration",
    achievements: [
      { text: "Conditional escrow with oracle integration", completed: false },
      { text: "Cross-currency automatic conversions", completed: false },
      { text: "Governance system for LOCKED holders", completed: false },
      { text: "Advanced Solana Hooks implementations", completed: false },
      { text: "Decentralized identity solutions", completed: false },
      { text: "AI-powered market analysis tools", completed: false },
    ],
    keyFeature: {
      title: "Decentralized Governance",
      description: "LOCKED holders vote on platform upgrades, fee structures, and future development priorities through a transparent on-chain voting system.",
      icon: <ShieldCheck className="h-8 w-8 text-[#9945FF]" />,
    }
  },
  {
    id: "phase4",
    title: "Enterprise Phase",
    timeline: "Q1-Q2 2026",
    status: "upcoming",
    description: "Scaling for institutional adoption",
    achievements: [
      { text: "Institutional-grade security enhancements", completed: false },
      { text: "High-volume transaction infrastructure", completed: false },
      { text: "Enterprise API solutions", completed: false },
      { text: "White-label locking solutions", completed: false },
      { text: "Compliance framework for global markets", completed: false },
      { text: "Bridging to additional blockchain networks", completed: false },
    ],
    keyFeature: {
      title: "Cross-Chain Interoperability",
      description: "Lock assets across multiple blockchains while maintaining the benefits of the Solana ecosystem, expanding the utility of LOCKED token.",
      icon: <Globe className="h-8 w-8 text-[#9945FF]" />,
    }
  },
  {
    id: "phase5",
    title: "Ecosystem Phase",
    timeline: "Q3 2026 & Beyond",
    status: "upcoming",
    description: "Complete financial ecosystem built on Solana",
    achievements: [
      { text: "Decentralized lending protocols", completed: false },
      { text: "Synthetic asset creation tools", completed: false },
      { text: "Advanced derivatives and futures mechanisms", completed: false },
      { text: "Seamless fiat on/off ramping", completed: false },
      { text: "Expanded DeFi integrations", completed: false },
      { text: "Cross-border payment solutions", completed: false },
    ],
    keyFeature: {
      title: "Comprehensive DeFi Platform",
      description: "Transform the platform into a complete DeFi ecosystem where LOCKED token serves as the governance and utility token across all services.",
      icon: <Layers className="h-8 w-8 text-[#9945FF]" />,
    }
  },
];

// Upcoming features
const upcomingFeatures = [
  {
    id: "feature1",
    title: "Advanced Path Payments",
    description: "Enable complex cross-currency transactions with optimal pathing using Solana's PathFinding algorithm, allowing users to lock one asset and release another.",
    icon: <ArrowRight className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q1 2025",
  },
  {
    id: "feature7",
    title: "Provably Fair Dice Game",
    description: "Play the provably fair dice game using LOCKED tokens. Bet on roll outcomes with adjustable risk levels and verify the fairness of each roll with our transparent algorithm. 5% of all betting profits are automatically distributed to top 100 token holders.",
    icon: <Dice5 className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q1 2025",
  },
  {
    id: "feature2",
    title: "NFT Locking Mechanism",
    description: "Secure Solana NFTs in time-locked contracts, enabling timed releases, loyalty programs, and staking rewards based on NFT rarity.",
    icon: <Layers className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q2 2025",
  },
  {
    id: "feature3",
    title: "AMM Integration",
    description: "Connect with Solana's Automated Market Maker functionality to provide liquidity while tokens are locked, generating additional yield.",
    icon: <LineChart className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q2 2025",
  },
  {
    id: "feature4",
    title: "Oracle-Powered Conditional Locks",
    description: "Create sophisticated locking conditions based on real-world data from Solana oracle networks, such as price thresholds or external events.",
    icon: <Zap className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q3 2025",
  },
  {
    id: "feature5",
    title: "Community Governance Portal",
    description: "LOCKED holders can propose and vote on platform upgrades, fee structures, and feature prioritization through an intuitive governance interface.",
    icon: <ShieldCheck className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q4 2025",
  },
  {
    id: "feature6",
    title: "Advanced Solana Hooks Templates",
    description: "Library of customizable smart contract templates allowing users to deploy complex locking strategies with minimal technical knowledge.",
    icon: <Code className="h-6 w-6 text-[#9945FF]" />,
    timeline: "Q1 2026",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const RoadmapPage = () => {
  const [activeView, setActiveView] = useState("timeline");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1a2544] py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-2 bg-[#9945FF] text-white">Platform Roadmap</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-cyan-400">LOCKED</span> <span className="text-cyan-400">ROOM</span> Vision
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Our ambitious plan to revolutionize asset locking on the Solana blockchain with cutting-edge features
            and sustainable tokenomics through the LOCKED token.
          </p>

          {/* Token info */}
          <motion.div 
            className="bg-[#121A2F] border border-[#293659]/50 rounded-xl p-6 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-[#9945FF]">LOCKED Token</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-[#1a2544] rounded-lg">
                <p className="text-gray-400 text-sm">Total Supply</p>
                <p className="text-xl font-bold text-white">{tokenData.totalSupply}</p>
              </div>
              <div className="p-3 bg-[#1a2544] rounded-lg">
                <p className="text-gray-400 text-sm">Token Symbol</p>
                <p className="text-xl font-bold text-white">{tokenData.symbol}</p>
              </div>
              <div className="p-3 bg-[#1a2544] rounded-lg">
                <p className="text-gray-400 text-sm">Fee Distribution</p>
                <p className="text-xl font-bold text-white">{tokenData.feeDistribution}</p>
              </div>
              <div className="p-3 bg-[#1a2544] rounded-lg md:col-span-2">
                <p className="text-gray-400 text-sm">Distribution System</p>
                <p className="text-base font-medium text-white">
                  {tokenData.feeDistribution} of all fees distributed to top {tokenData.topHolders} holders automatically
                </p>
              </div>
              <div className="p-3 bg-[#1a2544] rounded-lg">
                <p className="text-gray-400 text-sm">Initial Price</p>
                <p className="text-xl font-bold text-white">{tokenData.initialPrice}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* View selection */}
        <Tabs 
          defaultValue="timeline" 
          value={activeView} 
          onValueChange={setActiveView}
          className="mb-8"
        >
          <div className="flex justify-center mb-8">
            <TabsList className="bg-[#121A2F]/80 border border-[#293659]/50">
              <TabsTrigger value="timeline" className="data-[state=active]:bg-[#9945FF]">
                <Clock className="h-4 w-4 mr-2" /> Timeline View
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-[#9945FF]">
                <Zap className="h-4 w-4 mr-2" /> Upcoming Features
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Timeline view */}
          <TabsContent value="timeline">
            <div className="relative py-12">
              {/* Timeline background */}
              <div className="absolute inset-0 bg-[#0a0f1f]/30 rounded-3xl backdrop-blur-sm"></div>
              
              {/* Enhanced horizontal timeline line with glowing effect */}
              <div className="absolute top-12 left-8 right-8 h-1 bg-gradient-to-r from-[#9945FF] via-[#9945FF] to-[#9945FF] rounded-full shadow-[0_0_15px_rgba(255,107,44,0.5)] z-10"></div>
              
              {/* Phases */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex flex-col"
              >
                {/* Phase markers - horizontal row of milestones */}
                <div className={`flex justify-between px-8 mb-8 relative mt-12 pb-4 ${styles.hideScrollbar}`}>
                  {roadmapPhases.map((phase, index) => (
                    <motion.div 
                      key={`marker-${phase.id}`}
                      whileHover={{ scale: 1.2, boxShadow: "0 0 15px rgba(255,107,44,0.8)" }}
                      animate={{ 
                        boxShadow: ["0 0 5px rgba(255,107,44,0.3)", "0 0 15px rgba(255,107,44,0.7)", "0 0 5px rgba(255,107,44,0.3)"] 
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-[#9945FF] border-4 border-[#121A2F] flex items-center justify-center z-20 flex-shrink-0 mx-4 md:mx-0"
                    >
                      {phase.status === "completed" ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : phase.status === "in-progress" ? (
                        <Rocket className="h-4 w-4 text-white" />
                      ) : (
                        <Clock className="h-4 w-4 text-white" />
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Timeline labels */}
                <div className={`flex justify-between px-6 mb-10 pb-4 ${styles.hideScrollbar}`}>
                  {roadmapPhases.map((phase, index) => (
                    <motion.div 
                      key={`label-${phase.id}`}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-[140px] text-center flex-shrink-0 mx-2 md:mx-0"
                    >
                      <Badge className={
                        phase.status === "completed" ? "bg-green-600" : 
                        phase.status === "in-progress" ? "bg-[#9945FF]" : 
                        "bg-[#293659]"
                      }>
                        <motion.span
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {phase.timeline}
                        </motion.span>
                      </Badge>
                      <h4 className="text-md font-semibold mt-2">
                        <span className={styles.textGradient}>{phase.title}</span>
                      </h4>
                    </motion.div>
                  ))}
                </div>
                
                {/* Phase cards - grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                  {roadmapPhases.slice(0, 3).map((phase, index) => (
                    <motion.div 
                      key={phase.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="h-full"
                    >
                      <Card className="bg-[#121A2F]/80 backdrop-blur-sm border border-[#293659]/80 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(123,63,228,0.2)] h-full">
                        <CardHeader className="pb-2 relative">
                          {/* Background gradient accent */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9945FF] to-transparent"></div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="border-[#293659]/50">
                              {phase.status === "completed" ? "Completed" : 
                               phase.status === "in-progress" ? 
                               <motion.span
                                 animate={{ opacity: [0.7, 1, 0.7] }}
                                 transition={{ duration: 1.5, repeat: Infinity }}
                               >
                                 In Progress
                               </motion.span> : "Upcoming"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl text-white mt-2">
                            <span className={styles.textGradient}>{phase.title}</span>
                          </CardTitle>
                          <CardDescription>{phase.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {phase.achievements.slice(0, 3).map((achievement, i) => (
                                <motion.div 
                                  key={i} 
                                  className="flex items-center gap-2"
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                >
                                  {achievement.completed ? (
                                    <motion.div 
                                      className="h-5 w-5 rounded-full bg-green-600/20 flex items-center justify-center"
                                      whileHover={{ scale: 1.2 }}
                                    >
                                      <Check className="h-3 w-3 text-green-500" />
                                    </motion.div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-[#293659]/20 flex items-center justify-center">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                  <span className={`text-sm ${achievement.completed ? 'text-white' : 'text-gray-400'}`}>
                                    {achievement.text}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                            
                            <div className="pt-4 border-t border-[#293659]/50">
                              <div className="flex gap-4">
                                <motion.div
                                  whileHover={{ rotate: 5, scale: 1.1 }}
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  {phase.keyFeature.icon}
                                </motion.div>
                                <div>
                                  <h4 className="text-lg font-semibold text-[#9945FF] mb-1">
                                    {phase.keyFeature.title}
                                  </h4>
                                  <p className="text-sm text-gray-300">
                                    {phase.keyFeature.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Additional phases row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 mt-6">
                  {roadmapPhases.slice(3, 5).map((phase, index) => (
                    <motion.div 
                      key={phase.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="h-full"
                    >
                      <Card className="bg-[#121A2F]/80 backdrop-blur-sm border border-[#293659]/80 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(123,63,228,0.2)] h-full">
                        <CardHeader className="pb-2 relative">
                          {/* Background gradient accent */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9945FF] to-transparent"></div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="border-[#293659]/50">
                              {phase.status === "completed" ? "Completed" : 
                               phase.status === "in-progress" ? 
                               <motion.span
                                 animate={{ opacity: [0.7, 1, 0.7] }}
                                 transition={{ duration: 1.5, repeat: Infinity }}
                               >
                                 In Progress
                               </motion.span> : "Upcoming"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl text-white mt-2">
                            <span className={styles.textGradient}>{phase.title}</span>
                          </CardTitle>
                          <CardDescription>{phase.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {phase.achievements.slice(0, 3).map((achievement, i) => (
                                <motion.div 
                                  key={i} 
                                  className="flex items-center gap-2"
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                >
                                  {achievement.completed ? (
                                    <motion.div 
                                      className="h-5 w-5 rounded-full bg-green-600/20 flex items-center justify-center"
                                      whileHover={{ scale: 1.2 }}
                                    >
                                      <Check className="h-3 w-3 text-green-500" />
                                    </motion.div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-[#293659]/20 flex items-center justify-center">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                  <span className={`text-sm ${achievement.completed ? 'text-white' : 'text-gray-400'}`}>
                                    {achievement.text}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                            
                            <div className="pt-4 border-t border-[#293659]/50">
                              <div className="flex gap-4">
                                <motion.div
                                  whileHover={{ rotate: 5, scale: 1.1 }}
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  {phase.keyFeature.icon}
                                </motion.div>
                                <div>
                                  <h4 className="text-lg font-semibold text-[#9945FF] mb-1">
                                    {phase.keyFeature.title}
                                  </h4>
                                  <p className="text-sm text-gray-300">
                                    {phase.keyFeature.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Features view */}
          <TabsContent value="features">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {upcomingFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  variants={itemVariants}
                >
                  <Card className="bg-[#121A2F] border border-[#293659]/50 h-full flex flex-col hover:border-[#9945FF]/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex gap-4">
                        <div className="bg-[#1a2544] rounded-lg p-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-[#9945FF]" />
                          <span className="text-sm text-gray-300">{feature.timeline}</span>
                        </div>
                        <Badge variant="outline" className="bg-[#121A2F] text-[#9945FF] border-[#293659]">
                          New Feature
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[#1a2544]">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                      </div>
                      <p className="text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Feature demo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 bg-[#121A2F]/80 border border-[#293659]/50 rounded-xl p-6 md:p-8"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">Dynamic Fee Distribution System</h3>
                  <p className="text-gray-300 mb-6">
                    The LOCKED token implements a revolutionary fee distribution model where 85% of all platform fees are automatically
                    distributed to the top 100 token holders proportional to their holdings.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#9945FF]/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#9945FF]" />
                      </div>
                      <span className="text-gray-300">Automatic distribution on each transaction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#9945FF]/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#9945FF]" />
                      </div>
                      <span className="text-gray-300">No staking required - just hold the token</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#9945FF]/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#9945FF]" />
                      </div>
                      <span className="text-gray-300">Transparent distribution through Solana's decentralized ledger</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative h-[300px] flex items-center justify-center">
                  {/* Animation for fee distribution demo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[280px] h-[280px] mx-auto">
                      <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-dashed border-[#293659]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="absolute inset-4 rounded-full border-4 border-dashed border-[#9945FF]/30"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-12 rounded-full bg-[#121A2F] border-2 border-[#9945FF] flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[#9945FF] text-5xl font-bold">85%</div>
                          <div className="text-gray-300 text-sm">Fee Distribution</div>
                        </div>
                      </div>
                      
                      {/* Animated tokens */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-6 h-6 rounded-full bg-[#9945FF] flex items-center justify-center"
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
                          <Coins className="h-3 w-3 text-[#121A2F]" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to be part of the future?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join us on this exciting journey as we revolutionize asset locking on the Solana blockchain and
            build the most comprehensive platform for token security.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-[#9945FF] hover:bg-[#E05E22] text-black font-bold">
              <a href="#" target="_blank" rel="noopener noreferrer">
                Buy LOCKED <Coins className="h-4 w-4 ml-1" />
              </a>
            </Button>
            <Button asChild className="bg-[#9945FF] hover:bg-[#E05E22]">
              <Link href="/dashboard">
                Launch App <Rocket className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#293659]">
              <a href="https://x.com/SolanaockerRoom" target="_blank" rel="noopener noreferrer">
                Follow Updates <Twitter className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Animated mascot */}
      <div className="fixed bottom-4 right-4 z-10 opacity-75 hover:opacity-100 transition-opacity">
        <AnimatedLockBot size="sm" message="Check out our exciting roadmap! I can help explain any feature." />
      </div>
    </div>
  );
};

export default RoadmapPage; 