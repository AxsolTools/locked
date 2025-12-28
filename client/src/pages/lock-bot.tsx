import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import AnimatedLockBot from "../components/mascot/AnimatedLockBot";
import { Link } from "wouter";
import { Textarea } from "../components/ui/textarea";
import { Send, Info, RefreshCw, ThumbsUp, Dice1 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";

// Knowledge database for LockBot
const LOCKBOT_KNOWLEDGE = {
  general: {
    about: "LOCKED ROOM is a secure platform built on the Solana blockchain (Solana) that allows you to lock your LOCKED and other Solana tokens for a specific period using Solana Hooks technology. It provides a trustless environment where your tokens are secured by the Solana's decentralized infrastructure.",
    purpose: "The primary purpose is to help users lock their tokens for specified time periods, which can be useful for long-term holding strategies, preventing impulsive selling during market volatility, or participating in tokenomics that reward long-term holders.",
    security: "Your tokens are secured directly by Solana Hooks - smart contract-like functionality on the Solana blockchain. This means no centralized party holds your tokens; the lock is enforced by the Solana's decentralized consensus mechanism.",
    team: "The LOCKED ROOM was created by a dedicated team of Solana enthusiasts and developers who believe in the future of the Solana blockchain ecosystem. The team continues to add new features and improve the platform based on community feedback.",
    vision: "Our vision is to become the premier platform for secure token locking on the Solana blockchain, enabling users to manage their long-term investments with confidence and supporting projects that incentivize holding through our technological infrastructure.",
    community: "We have a vibrant community of users who share strategies, discuss Solana developments, and help each other navigate the platform. Join our Discord or Telegram groups to connect with fellow Solana enthusiasts!",
  },
  
  features: {
    tokenLocking: "Lock your LOCKED and other Solana tokens for a specified period. Once locked, tokens cannot be moved or sold until the lock period expires.",
    multipleCurrencies: "Support for native LOCKED and other tokens on the Solana blockchain. The platform can display both standard currency codes and hex-encoded token identifiers.",
    dashboard: "Track all your locked tokens, monitor upcoming unlocks, and view your transaction history in one place.",
    escrow: "Create time-based escrows for your LOCKED tokens with specific unlock dates.",
    analytics: "View platform statistics including total locked value, active lockers, and average lock duration.",
    admin: "Admin panel for platform managers with user management, token oversight, and emergency controls (accessible only to admin wallet).",
    diceGame: "Play our provably fair dice game where you predict if a random number will be higher or lower than your chosen target. Win LOCKED based on your prediction and betting amount!",
    userRanking: "A competitive ranking system that shows the most committed token lockers with statistics on lock duration and amounts.",
    notifications: "Get timely alerts when your locks are about to expire or when significant platform events occur.",
    multiWalletSupport: "Connect multiple wallets to manage different portfolios or strategies separately within the same account.",
    referralProgram: "Invite friends to use LOCKED ROOM and earn rewards when they lock tokens or play our dice game.",
    mobileAccess: "Access all platform features through our mobile-responsive design, ensuring you can manage your tokens on the go.",
  },
  
  games: {
    dice: "Our dice game is a provably fair gambling game where you predict if a random number between 0 and 100 will be over or under your chosen target. The lower your win probability, the higher your potential payout! The game uses cryptographic techniques to ensure verifiable fairness.",
    diceGameplay: "To play the dice game: 1) Set your target number between 1-99, 2) Choose 'Over' or 'Under', 3) Enter your bet amount, 4) Click 'Roll Dice', 5) The result number determines if you win or lose based on your prediction.",
    diceWinning: "In the dice game, your win chance is directly related to your target. For 'Over' bets, your win chance is (100-target)%. For 'Under' bets, it's target%. The multiplier is calculated as (100/win chance) minus the house edge.",
    diceProvableFair: "Our dice game uses a provably fair system combining a server seed (hashed and provided before your bet) and your client seed. After each roll, you can verify the fairness by checking that the result was determined by both seeds combined.",
    diceLeaderboard: "The dice game features a leaderboard showing the most successful players. You can see total profit, win rate, and number of bets for each player. Compete to reach the top positions!",
    diceLiveFeed: "Watch live bets from all players in real-time with our WebSocket-powered live feed. See wins, losses, and strategies of other players as they happen!",
    diceMultiplier: "The multiplier in our dice game determines your potential winnings. It's calculated as (100/win chance) - house edge. For example, a 50% chance of winning would give you approximately a 1.98x multiplier with a 1% house edge.",
    diceStrategies: "Some players use strategies like the Martingale (doubling bets after a loss) or the Reverse Martingale (doubling after wins). While no strategy guarantees profits, many find them fun to experiment with.",
    diceRisks: "Remember that gambling always carries risk! Only bet what you can afford to lose and consider the dice game as entertainment rather than an investment strategy.",
    tournaments: "We occasionally host special dice game tournaments with prize pools and unique rules. Keep an eye on our announcements for upcoming events!",
    futureGames: "We're developing additional games to add to our platform, including a Coin Flip game and an LOCKED price prediction market. Stay tuned for these exciting additions!",
  },
  
  technical: {
    hooks: "Solana Hooks are custom logic that execute during transactions on the Solana blockchain. The platform uses these to enforce token locking rules directly on the blockchain.",
    walletConnection: "Connect securely using Phantom (formerly Solflare) or other Solana blockchain wallets for transaction signing.",
    tokens: "The platform supports LOCKED (the native token) and all issued currencies on the Solana. Token balances are fetched using both WebSocket and REST API connections to ensure reliability.",
    security: "Admin functionality is protected by strict wallet address verification. Only the specific admin wallet (rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ) can access administrative features.",
    transactions: "All transactions are recorded on-chain and verified before updating the platform's status. This ensures transparency and auditability.",
    diceGameTech: "The dice game uses SHA-256 cryptographic hashing to ensure fairness. The server generates a random seed, hashes it, and sends only the hash before your bet. Your client seed is combined with the server seed to determine the roll result. After the roll, the server reveals its original seed so you can verify the result independently.",
    architecture: "Our platform uses a modern React frontend with TypeScript for type safety, connected to a Node.js backend that interfaces directly with the Solana blockchain through ripple-lib and WebSocket APIs.",
    dataStorage: "User data is stored securely with encryption at rest and in transit. We minimize the storage of sensitive information, relying instead on the blockchain for most critical data.",
    apiIntegration: "We provide developers with API endpoints to integrate LOCKED ROOM functionality into their own applications, subject to rate limits and authentication.",
    networkRequirements: "The platform operates on the live Solana blockchain mainnet, requiring a stable internet connection and a compatible wallet for transaction signing.",
    smartContractComparison: "While not traditional smart contracts like on Ethereum, Solana Hooks provide similar functionality with faster transaction times and lower fees, making them ideal for token locking operations.",
    clientSideVerification: "Our platform allows users to independently verify all operations through client-side cryptographic validation, ensuring you don't have to trust our servers for critical operations.",
  },
  
  howTo: {
    connectWallet: "Click the 'Connect Wallet' button in the top-right corner and choose your preferred Solana wallet. The application supports Phantom (formerly Solflare) and other Solana-compatible wallets.",
    lockTokens: "Navigate to the 'Lock Tokens' page, select the token type, enter the amount you want to lock, set the unlock date, and submit the transaction for signing through your connected wallet.",
    viewLockedTokens: "Visit the 'Dashboard' to see all your currently locked tokens, their unlock dates, and their status.",
    unlockTokens: "Tokens can only be unlocked after the specified unlock date. On your dashboard, locate the eligible token and click 'Unlock' to initiate the unlocking process.",
    trackActivity: "The 'History' page shows all your past transactions, including locks and unlocks. The 'Activity Feed' displays recent platform activities.",
    playDiceGame: "To play the dice game: 1) Navigate to the 'Dice Game' page, 2) Connect your wallet if not already connected, 3) Select your target number using the slider, 4) Choose 'Over' or 'Under', 5) Enter your bet amount, 6) Click 'Roll' and wait for the result!",
    verifyDiceRoll: "After each dice roll, you can verify the fairness by clicking the 'Verify' button. This shows you the original server seed, how it was hashed, and the math used to calculate the result, proving that neither you nor the platform could have manipulated the outcome.",
    manageDifferentTokens: "When locking multiple token types, use the filter options on your dashboard to focus on specific currencies. Each token type can have its own locking strategy.",
    extendLock: "If you wish to extend a lock period, you'll need to wait for the current lock to expire, unlock the tokens, and create a new lock with a later expiry date.",
    recoverAccount: "If you lose access to your wallet, recovery depends on your wallet provider's recovery options. We cannot recover your funds as they're secured by the Solana's decentralized infrastructure.",
    readLeaderboard: "The dice game leaderboard shows the most successful players ranked by profit. You can see their win rate, total bets placed, and total profit/loss.",
    checkLiveBets: "The 'Live Bets' section of the dice game page shows a real-time feed of all bets being placed by players. Watch this feed to see betting strategies in action!",
    optimizeBettingStrategy: "Analyze the patterns in the live feed and leaderboard to inform your betting strategy. Notice which target numbers and bet sizes tend to be successful over time.",
    useReferralLinks: "Share your unique referral link with friends to earn rewards when they join and use the platform. Find your referral link in your profile settings.",
    provideFeedback: "We value community input! Use the feedback form accessible from the main menu to submit suggestions, report issues, or share your experience.",
  },
  
  tokenomics: {
    Locker: "The LOCKED token is the native utility token of our platform, used for governance, fee discounts, and premium features.",
    distribution: "LOCKED tokens were distributed through a fair launch mechanism, with no pre-mine or team allocation to ensure community ownership from day one.",
    utility: "Holding LOCKED tokens provides benefits such as reduced platform fees, voting rights on future features, and access to exclusive tournaments and events.",
    staking: "You can stake your LOCKED tokens to earn a share of platform revenues, including a percentage of house earnings from the dice game.",
    governance: "LOCKED token holders can propose and vote on platform updates, fee structures, and new feature implementation through our decentralized governance system.",
    supply: "The total supply of LOCKED tokens is capped at 100 million, with a portion allocated to rewards, development, and ecosystem growth.",
    burning: "A percentage of fees collected from the platform are used to buy back and burn LOCKED tokens, creating deflationary pressure over time.",
    liquidity: "LOCKED tokens are available on decentralized exchanges on the Solana blockchain, ensuring easy access and trading for users.",
  },
  
  faq: {
    minLockPeriod: "The minimum lock period is 24 hours, while the maximum is 10 years. Choose the timeframe that best suits your holding strategy.",
    fees: "Platform fees are minimal, typically 0.1% for locking operations and a 1% house edge for the dice game. LOCKED token holders receive discounted fees.",
    security: "Your tokens never leave the Solana blockchain during locking. The lock is enforced by Solana Hooks, ensuring your tokens remain secure on the blockchain.",
    accountDelete: "Deleting your account will not affect your locked tokens. They will remain locked until their unlock date, at which point you can reclaim them through your wallet.",
    multipleWallets: "Yes, you can connect multiple wallets to your account and manage locks for each separately.",
    supportedTokens: "We support LOCKED and all issued currencies on the Solana blockchain. If you can hold it in your LOCKED wallet, you can likely lock it on our platform.",
    taxImplications: "Locking tokens doesn't typically trigger a taxable event, but please consult with a tax professional for advice specific to your jurisdiction.",
    teamContact: "You can contact our team through the feedback form in the app, our Discord server, or via email at support@lockedroom.com.",
    downtimeProcedure: "In the rare event of platform downtime, your tokens remain secure on the blockchain. Locks and unlocks are governed by on-chain logic that operates independently of our platform's availability.",
    privacyPolicy: "We collect minimal personal information and do not sell user data. Your privacy is important to us - see our full privacy policy for details.",
    mobileApp: "While we don't currently have a dedicated mobile app, our website is fully responsive and works well on mobile browsers.",
    lostSeedRecovery: "If you lose your wallet seed phrase, we cannot recover it for you. Always store your seed phrase securely offline and never share it with anyone.",
  },
  
  marketInsights: {
    lockedOutlook: "LOCKED continues to establish itself as a major token with strong utility for token locking and broader DeFi applications on Solana.",
    tokenizationTrends: "The Solana blockchain is seeing increased adoption for tokenization of traditional assets, creating new opportunities for locking strategies.",
    regulatoryLandscape: "Regulatory clarity for LOCKED is improving globally, potentially opening the door to institutional adoption and increased utility.",
    investmentStrategies: "Token locking can be a powerful strategy during market volatility, helping you maintain your position and avoid emotional selling decisions.",
    platformGrowth: "LOCKED ROOM has seen consistent growth in total locked value, indicating strong community confidence in both our platform and the LOCKED ecosystem.",
    futureIntegrations: "We're exploring integrations with DeFi protocols to expand the utility of locked tokens, potentially allowing them to generate yield while remaining secured.",
  },
  
  casual: {
    greetings: [
      "Hey there! Ready to lock some tokens or roll the dice?",
      "Hello, LOCKED enthusiast! How can I assist you today?",
      "Welcome to LOCKED ROOM! What can I help you with?",
      "Hi there! Looking to secure your LOCKED tokens or try your luck at the dice game?",
      "Greetings! How's your LOCKED journey going today?",
      "Hello! Ready to explore the world of token locking?",
      "Hey! What brings you to the LOCKED ROOM today?",
      "Welcome back! What would you like to know about our platform?",
      "Hello there! Interested in learning more about our provably fair dice game?",
      "Hi! Looking for ways to secure your digital assets on the Solana blockchain?"
    ],
    farewell: [
      "Thanks for chatting! Feel free to ask if you have more questions.",
      "Happy to help! Come back anytime for more information.",
      "Glad I could assist! Enjoy your journey in the LOCKED ecosystem.",
      "Hope that helps! Don't hesitate to reach out with more questions.",
      "Wishing you success with your token locking strategy!",
      "May your dice rolls be lucky and your locks secure!",
      "Until next time, keep those tokens safe!",
      "Looking forward to our next conversation. Good luck!",
      "Remember, locked tokens are happy tokens! See you soon.",
      "Feel free to drop by anytime for more insights or just to chat!"
    ],
    jokes: [
      "Why don't scientists trust atoms? Because they make up everything... just like how our provably fair system makes sure no one's making things up in our dice game!",
      "Why was the blockchain investor always calm? Because they were HODLing their emotions too!",
      "What do you call a cryptocurrency enthusiast who never sells? A natural at using LOCKED ROOM!",
      "Why did the LOCKED token go to therapy? It had trust issues, but our locking system fixed that!",
      "How many blockchain developers does it take to change a lightbulb? None, they just create a decentralized consensus mechanism to decide if it's really dark.",
      "Why do cryptocurrency users make terrible magicians? They reveal all their private keys!",
      "What's a blockchain's favorite music? Block and roll!",
      "Why was the token holder so fit? From all that proof-of-stake!",
      "What did the LOCKED say to the wallet? 'Let's lock this relationship down!'",
      "Why don't cryptocurrencies ever get stressed? They're always taking secure hash functions!"
    ],
    funFacts: [
      "The Solana blockchain can process up to 1,500 transactions per second, making it one of the fastest blockchain networks.",
      "The Solana uses a unique consensus algorithm that's more energy-efficient than traditional proof-of-work systems.",
      "Our dice game has seen over 1 million rolls since launch, with the luckiest player winning 20 consecutive bets!",
      "The longest token lock ever created on our platform was for 10 years - now that's commitment!",
      "The Solana blockchain was launched in 2012, making it one of the earliest blockchain technologies still actively developed.",
      "The first version of LOCKED ROOM was built during a weekend hackathon by our founders!",
      "If you laid all the LOCKED tokens end to end, they would stretch to the moon and back several times (metaphorically speaking, of course!).",
      "Our platform's code has undergone six security audits to ensure your tokens remain safe.",
      "The random number generator in our dice game uses quantum-resistant cryptographic algorithms.",
      "The collective value of all tokens currently locked in our platform could buy a small island (though we recommend keeping them locked instead!)."
    ],
    motivation: [
      "Patience is key in crypto! Your locked tokens are working toward your long-term goals.",
      "The best time to lock tokens was yesterday. The second best time is today!",
      "Diamond hands aren't just born - they're forged through strategic token locking!",
      "Every great journey begins with a single step. Every great investment strategy begins with a single lock!",
      "The market may go up and down, but your locked tokens stay right where you put them.",
      "Success in crypto isn't about timing the market, it's about time in the market. Lock those tokens!",
      "Discipline separates the successful from the wishful thinkers. Lock your tokens, stick to your plan!",
      "Your future self will thank you for the locks you set today.",
      "Remember: it's not about getting rich quick, it's about building wealth consistently.",
      "The most valuable investment you can make is in patience. Let your locked tokens be a reminder of that!"
    ],
    tips: [
      "Try combining different lock durations to create a staggered unlocking schedule for your portfolio.",
      "When playing the dice game, consider starting with smaller bets to get a feel for the game mechanics.",
      "Set calendar reminders for your upcoming token unlocks so you never miss them!",
      "For optimal security, consider using a hardware wallet when connecting to our platform.",
      "Check the leaderboard regularly to see which dice game strategies are working best currently.",
      "Consider locking a portion of your profits from the dice game to secure your winnings.",
      "Use our analytics page to see trends in locking behavior across the platform.",
      "Diversify your locked tokens across different projects on the Solana blockchain.",
      "Share your lock achievements on social media to inspire others in the community!",
      "Keep an eye on our notification panel for important updates and new features."
    ]
  }
};

// Message types
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Welcome message
const WELCOME_MESSAGE = "Hey there, LOCKED hero! 👋 I'm Lock Bot, your AI assistant for LOCKED ROOM. I can answer questions about token locking, Solana Hooks, our dice game, platform features, and much more! Try asking me about our provably fair dice game, token staking rewards, or just ask for a fun LOCKED fact. What would you like to know today?";

// Function to generate responses based on user queries
function generateResponse(query: string, walletAddress: string | null = null): string {
  const q = query.toLowerCase();
  
  // Welcome message for first-time users
  if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q.includes('hey') || q.includes('greetings')) {
    // Select a random greeting from our casual greetings array
    const randomGreeting = LOCKBOT_KNOWLEDGE.casual.greetings[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.greetings.length)];
    return randomGreeting;
  }
  
  // Goodbye messages
  if (q.includes('bye') || q.includes('goodbye') || q.includes('see you') || q.includes('farewell') || q.includes('thanks')) {
    const randomFarewell = LOCKBOT_KNOWLEDGE.casual.farewell[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.farewell.length)];
    return randomFarewell;
  }
  
  // Jokes
  if (q.includes('joke') || q.includes('funny') || q.includes('laugh') || q.includes('humor')) {
    const randomJoke = LOCKBOT_KNOWLEDGE.casual.jokes[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.jokes.length)];
    return randomJoke;
  }
  
  // Fun facts
  if (q.includes('fact') || q.includes('trivia') || q.includes('interesting') || q.includes('did you know')) {
    const randomFact = LOCKBOT_KNOWLEDGE.casual.funFacts[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.funFacts.length)];
    return `Did you know? ${randomFact}`;
  }
  
  // Motivation
  if (q.includes('motivate') || q.includes('inspire') || q.includes('encourage') || q.includes('motivation')) {
    const randomMotivation = LOCKBOT_KNOWLEDGE.casual.motivation[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.motivation.length)];
    return `💪 ${randomMotivation}`;
  }
  
  // Tips
  if (q.includes('tip') || q.includes('advice') || q.includes('suggest') || q.includes('recommendation')) {
    const randomTip = LOCKBOT_KNOWLEDGE.casual.tips[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.tips.length)];
    return `💡 Tip: ${randomTip}`;
  }
  
  // About the platform
  if (q.includes('what is') && (q.includes('locked room') || q.includes('locked'))) {
    return LOCKBOT_KNOWLEDGE.general.about;
  }
  
  if (q.includes('purpose') || (q.includes('why') && q.includes('use'))) {
    return LOCKBOT_KNOWLEDGE.general.purpose;
  }
  
  // Team information
  if (q.includes('team') || q.includes('who made') || q.includes('developers') || q.includes('creators')) {
    return LOCKBOT_KNOWLEDGE.general.team;
  }
  
  // Vision and future
  if (q.includes('vision') || q.includes('future') || q.includes('roadmap') || q.includes('plan')) {
    return LOCKBOT_KNOWLEDGE.general.vision;
  }
  
  // Community
  if (q.includes('community') || q.includes('discord') || q.includes('telegram') || q.includes('social')) {
    return LOCKBOT_KNOWLEDGE.general.community;
  }
  
  // Security related
  if (q.includes('secure') || q.includes('security') || q.includes('safe')) {
    return LOCKBOT_KNOWLEDGE.general.security;
  }
  
  // Wallet connection
  if (q.includes('connect') && q.includes('wallet')) {
    const walletInfo = walletAddress ? 
      `Your wallet (${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}) is already connected!` :
      "You don't have a wallet connected yet.";
    
    return `${walletInfo} ${LOCKBOT_KNOWLEDGE.howTo.connectWallet}`;
  }
  
  // Locking tokens
  if ((q.includes('how') && q.includes('lock')) || q.includes('lock token')) {
    return LOCKBOT_KNOWLEDGE.howTo.lockTokens;
  }
  
  // Unlocking tokens
  if ((q.includes('how') && q.includes('unlock')) || q.includes('unlock token')) {
    return LOCKBOT_KNOWLEDGE.howTo.unlockTokens;
  }
  
  // Extend lock period
  if (q.includes('extend') && q.includes('lock')) {
    return LOCKBOT_KNOWLEDGE.howTo.extendLock;
  }
  
  // Recover account
  if (q.includes('recover') || (q.includes('lost') && q.includes('access'))) {
    return LOCKBOT_KNOWLEDGE.howTo.recoverAccount;
  }
  
  // Token support
  if (q.includes('token') && (q.includes('support') || q.includes('available'))) {
    return LOCKBOT_KNOWLEDGE.technical.tokens;
  }
  
  // Solana Hooks explanation
  if (q.includes('hooks') || q.includes('hook')) {
    return LOCKBOT_KNOWLEDGE.technical.hooks;
  }
  
  // Architecture
  if (q.includes('architecture') || q.includes('tech stack') || q.includes('backend') || q.includes('frontend')) {
    return LOCKBOT_KNOWLEDGE.technical.architecture;
  }
  
  // Data storage
  if (q.includes('data') || q.includes('storage') || q.includes('database') || q.includes('privacy')) {
    return LOCKBOT_KNOWLEDGE.technical.dataStorage;
  }
  
  // API integration
  if (q.includes('api') || q.includes('integrate') || q.includes('integration') || q.includes('developer')) {
    return LOCKBOT_KNOWLEDGE.technical.apiIntegration;
  }
  
  // Dice game
  if (q.includes('dice') || (q.includes('game') && !q.includes('future'))) {
    return LOCKBOT_KNOWLEDGE.games.dice;
  }
  
  // How to play dice game
  if ((q.includes('how') && q.includes('play') && (q.includes('dice') || q.includes('game')))) {
    return LOCKBOT_KNOWLEDGE.howTo.playDiceGame;
  }
  
  // Live feed for dice game
  if ((q.includes('live') || q.includes('feed')) && (q.includes('dice') || q.includes('bet') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceLiveFeed;
  }
  
  // Game multiplier
  if ((q.includes('multiplier') || q.includes('odds') || q.includes('payout')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceMultiplier;
  }
  
  // Game strategies
  if ((q.includes('strategy') || q.includes('tactic')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceStrategies;
  }
  
  // Game risks
  if ((q.includes('risk') || q.includes('danger') || q.includes('lose')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceRisks;
  }
  
  // Tournaments
  if (q.includes('tournament') || q.includes('competition') || q.includes('contest')) {
    return LOCKBOT_KNOWLEDGE.games.tournaments;
  }
  
  // Future games
  if ((q.includes('future') && q.includes('game')) || q.includes('upcoming') || q.includes('new game')) {
    return LOCKBOT_KNOWLEDGE.games.futureGames;
  }
  
  // Dice game provably fair
  if ((q.includes('fair') || q.includes('provable') || q.includes('verify')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceProvableFair;
  }
  
  // Dice game winning mechanics
  if ((q.includes('win') || q.includes('chance') || q.includes('probability')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceWinning;
  }
  
  // Dice game technical details
  if ((q.includes('how') && q.includes('work') && (q.includes('dice') || q.includes('game'))) || 
      (q.includes('technical') && (q.includes('dice') || q.includes('game')))) {
    return LOCKBOT_KNOWLEDGE.technical.diceGameTech;
  }
  
  // Dice game leaderboard
  if ((q.includes('leaderboard') || q.includes('ranking') || q.includes('top players')) && (q.includes('dice') || q.includes('game'))) {
    return LOCKBOT_KNOWLEDGE.games.diceLeaderboard;
  }
  
  // How to read leaderboard
  if ((q.includes('how') && q.includes('read') && q.includes('leaderboard'))) {
    return LOCKBOT_KNOWLEDGE.howTo.readLeaderboard;
  }
  
  // How to check live bets
  if ((q.includes('how') && q.includes('check') && q.includes('live')) || (q.includes('see') && q.includes('bets'))) {
    return LOCKBOT_KNOWLEDGE.howTo.checkLiveBets;
  }
  
  // Optimizing betting strategy
  if ((q.includes('optimize') || q.includes('improve') || q.includes('better')) && (q.includes('bet') || q.includes('strategy'))) {
    return LOCKBOT_KNOWLEDGE.howTo.optimizeBettingStrategy;
  }
  
  // Tokenomics - LOCKED Locker token
  if (q.includes('locked token') || q.includes('native token') || q.includes('platform token')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.Locker;
  }
  
  // Token distribution
  if (q.includes('distribution') || q.includes('tokenomics') || q.includes('allocation')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.distribution;
  }
  
  // Token utility
  if (q.includes('utility') || (q.includes('use') && q.includes('token'))) {
    return LOCKBOT_KNOWLEDGE.tokenomics.utility;
  }
  
  // Token staking
  if (q.includes('staking') || q.includes('stake') || q.includes('reward')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.staking;
  }
  
  // Token governance
  if (q.includes('governance') || q.includes('vote') || q.includes('proposal')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.governance;
  }
  
  // Token supply
  if (q.includes('supply') || q.includes('cap') || q.includes('max supply')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.supply;
  }
  
  // Token burning
  if (q.includes('burn') || q.includes('burning') || q.includes('deflationary')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.burning;
  }
  
  // Token liquidity
  if (q.includes('liquidity') || q.includes('exchange') || q.includes('buy') || q.includes('trade')) {
    return LOCKBOT_KNOWLEDGE.tokenomics.liquidity;
  }
  
  // FAQ - Minimum lock period
  if (q.includes('minimum') && q.includes('lock')) {
    return LOCKBOT_KNOWLEDGE.faq.minLockPeriod;
  }
  
  // FAQ - Fees
  if (q.includes('fee') || q.includes('cost') || q.includes('charge')) {
    return LOCKBOT_KNOWLEDGE.faq.fees;
  }
  
  // FAQ - Multiple wallets
  if (q.includes('multiple') && q.includes('wallet')) {
    return LOCKBOT_KNOWLEDGE.faq.multipleWallets;
  }
  
  // FAQ - Supported tokens
  if (q.includes('which') && q.includes('token') || (q.includes('supported') && q.includes('currency'))) {
    return LOCKBOT_KNOWLEDGE.faq.supportedTokens;
  }
  
  // FAQ - Tax implications
  if (q.includes('tax') || q.includes('taxes') || q.includes('taxation')) {
    return LOCKBOT_KNOWLEDGE.faq.taxImplications;
  }
  
  // FAQ - Team contact
  if (q.includes('contact') || q.includes('email') || q.includes('support')) {
    return LOCKBOT_KNOWLEDGE.faq.teamContact;
  }
  
  // FAQ - Mobile app
  if (q.includes('mobile') || q.includes('app') || q.includes('android') || q.includes('ios')) {
    return LOCKBOT_KNOWLEDGE.faq.mobileApp;
  }
  
  // Market insights - LOCKED outlook
  if (q.includes('locked') && (q.includes('outlook') || q.includes('future') || q.includes('price'))) {
    return LOCKBOT_KNOWLEDGE.marketInsights.lockedOutlook;
  }
  
  // Market insights - Tokenization trends
  if (q.includes('tokenization') || q.includes('trend') || q.includes('adoption')) {
    return LOCKBOT_KNOWLEDGE.marketInsights.tokenizationTrends;
  }
  
  // Market insights - Regulatory landscape
  if (q.includes('regulatory') || q.includes('regulation') || q.includes('compliance') || q.includes('legal')) {
    return LOCKBOT_KNOWLEDGE.marketInsights.regulatoryLandscape;
  }
  
  // Features overview
  if (q.includes('feature') || q.includes('what can you do') || q.includes('capability')) {
    const features = Object.entries(LOCKBOT_KNOWLEDGE.features)
      .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join('\n\n');
    
    return `Here are the key features of LOCKED ROOM:\n\n${features}`;
  }
  
  // Admin access
  if (q.includes('admin') || q.includes('administrator')) {
    return `The admin panel is restricted to the designated admin wallet address (rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ). ${LOCKBOT_KNOWLEDGE.technical.security}`;
  }
  
  // Current year/date info
  if (q.includes('what year') || q.includes('current year') || q.includes('date') || q.includes('today')) {
    const now = new Date();
    return `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. I'm fully updated with the latest Solana features as of 2024/2025.`;
  }
  
  // Dashboard
  if (q.includes('dashboard')) {
    return LOCKBOT_KNOWLEDGE.howTo.viewLockedTokens;
  }
  
  // Escrow
  if (q.includes('escrow')) {
    return LOCKBOT_KNOWLEDGE.features.escrow;
  }
  
  // Analytics
  if (q.includes('analytics') || q.includes('statistics') || q.includes('stats')) {
    return LOCKBOT_KNOWLEDGE.features.analytics;
  }
  
  // Referral program
  if (q.includes('referral') || q.includes('invite') || q.includes('share')) {
    return LOCKBOT_KNOWLEDGE.features.referralProgram + "\n\n" + LOCKBOT_KNOWLEDGE.howTo.useReferralLinks;
  }
  
  // Help/command list
  if (q.includes('help') || q.includes('command') || q.includes('what can I ask')) {
    return `You can ask me about:
    
• General information about LOCKED ROOM
• Our team, vision, and community
• How to connect your wallet
• How to lock and unlock tokens
• Security features of the platform
• Technical details about Solana Hooks
• Platform features and capabilities
• How to navigate the dashboard
• Token support on the platform
• The dice game and how to play it
• Provable fairness in the dice game
• Game mechanics and winning strategies
• Tokenomics and the LOCKED token
• Frequent questions about the platform
• Market insights and future trends
• For fun, try asking for a joke or fun fact!

Just type your question, and I'll provide the information you need!`;
  }
  
  // Random response if nothing specific is matched
  if (q.trim() === '' || q.length < 3) {
    const randomGreeting = LOCKBOT_KNOWLEDGE.casual.greetings[Math.floor(Math.random() * LOCKBOT_KNOWLEDGE.casual.greetings.length)];
    return randomGreeting + " Type 'help' to see what I can help you with!";
  }
  
  // Default response for unknown queries
  return `I don't have specific information about that topic yet. You can ask me about LOCKED ROOM features, token locking, the dice game, or many other topics. Type "help" to see what I can answer!

Would you like to know about our dice game features, token locking capabilities, or technical security instead?`;
}

const LockBotPage = () => {
  const { toast } = useToast();
  const { publicKey } = useSolanaWallet();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsProcessing(true);
    
    // Simulate processing time (like a real AI assistant)
    setTimeout(() => {
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: generateResponse(userInput, publicKey),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsProcessing(false);
    }, 1000);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const clearConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: WELCOME_MESSAGE,
        timestamp: new Date()
      }
    ]);
    toast({
      title: "Conversation cleared",
      description: "Started a new conversation with Lock Bot"
    });
  };
  
  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-[#0f172a] to-[#1a2544] py-6">
      <div className="max-w-3xl mx-auto w-full px-4 flex flex-col flex-grow">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-[#9945FF]">Lock Bot</span> AI Assistant
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Your intelligent guide to LOCKED ROOM. Ask me anything about token locking, features, or how to use the application!
          </p>
          
          <div className="mt-3 flex justify-center space-x-2">
            <Badge variant="outline" className="bg-[#121A2F] text-[#9945FF] border-[#293659]">
              <Info className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="outline" className="bg-[#121A2F] text-[#20D6C7] border-[#293659]">
              Solana Expert
            </Badge>
            <Badge variant="outline" className="bg-[#121A2F] text-[#9945FF] border-[#293659]">
              2024/2025 Updated
            </Badge>
            <Badge variant="outline" className="bg-[#121A2F] text-amber-400 border-[#293659]">
              <Dice1 className="w-3 h-3 mr-1" />
              Dice Game Pro
            </Badge>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col h-[calc(100vh-300px)] min-h-[400px]">
          {/* Chat messages container */}
          <div className="flex-grow bg-[#121A2F]/70 rounded-t-xl p-4 overflow-y-auto space-y-4 border border-[#293659]/50">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">XL</span>
                  </div>
                )}
                
                <div 
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-[#9945FF]/20 text-white' 
                      : 'bg-[#293659] text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">You</span>
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">XL</span>
                </div>
                <div className="bg-[#293659] text-white max-w-[85%] rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full bg-white/10" />
                    <Skeleton className="h-3 w-3 rounded-full bg-white/20" />
                    <Skeleton className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="bg-[#121A2F] rounded-b-xl border-t-0 border border-[#293659]/50 p-4">
            <div className="flex gap-2">
              <Textarea 
                placeholder="Ask Lock Bot about LOCKED ROOM..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] bg-[#1a2544] border-[#293659]"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSendMessage} 
                  className="bg-[#9945FF] hover:bg-[#E05E22]"
                  disabled={!userInput.trim() || isProcessing}
                >
                  <Send className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={clearConversation}
                  className="border-[#293659] text-gray-400 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button asChild variant="outline" className="border-[#293659] text-gray-400 hover:text-white">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <div className="fixed bottom-4 right-4">
            <Button
              variant="outline"
              className="rounded-full h-12 w-12 bg-[#293659] border-[#293659] hover:bg-[#364575]"
              onClick={() => toast({
                title: "Feedback received",
                description: "Thanks for your feedback about Lock Bot!",
              })}
            >
              <ThumbsUp className="h-5 w-5 text-[#20D6C7]" />
            </Button>
          </div>
        </div>
        
        <div className="w-[220px] md:w-[240px] hidden md:block fixed bottom-4 left-4 z-0 opacity-25 pointer-events-none">
          <AnimatedLockBot size="lg" withSpeechBubble={false} />
        </div>
      </div>
    </div>
  );
};

export default LockBotPage; 