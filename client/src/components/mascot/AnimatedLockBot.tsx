import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface AnimatedLockBotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  withSpeechBubble?: boolean;
}

const AnimatedLockBot = ({ 
  message = "Hey there! Welcome to LOCKED ROOM! I'm here to help you lock your tokens securely on Solana. Just connect your wallet to get started!",
  size = 'md',
  withSpeechBubble = true
}: AnimatedLockBotProps) => {
  const [, setLocation] = useLocation();
  const sizeClasses = {
    sm: 'w-40 h-40',
    md: 'w-64 h-64',
    lg: 'w-80 h-80'
  };

  const handleBotClick = () => {
    setLocation("/lock-bot");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {withSpeechBubble && (
        <div 
          className="relative mb-6 bg-zinc-900 p-4 rounded-xl shadow-lg border border-zinc-800 cursor-pointer"
          onClick={handleBotClick}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xs">LR</span>
            </div>
            <p className="font-medium text-sm text-white">Hey there!</p>
          </div>
          <p className="text-xs text-gray-400">{message}</p>
          
          {/* Speech bubble pointer */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-zinc-900 border-r-[8px] border-r-transparent"></div>
        </div>
      )}
      
      <motion.div 
        className={`${sizeClasses[size]} cursor-pointer`}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          y: {
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }
        }}
        onClick={handleBotClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Robot head - cyan */}
          <rect x="50" y="20" width="100" height="90" rx="12" fill="#22D3EE" />
          <rect x="55" y="25" width="90" height="80" rx="8" fill="#06B6D4" />
          
          {/* Robot eyes - emerald */}
          <circle cx="80" cy="55" r="13" fill="#10B981" />
          <circle cx="120" cy="55" r="13" fill="#10B981" />
          <circle cx="80" cy="55" r="6" fill="#FFFFFF" />
          <circle cx="120" cy="55" r="6" fill="#FFFFFF" />
          
          {/* Robot mouth - cyan */}
          <rect x="70" y="80" width="60" height="10" rx="5" fill="#22D3EE" />
          
          {/* Robot body */}
          <rect x="70" y="110" width="60" height="60" rx="8" fill="#06B6D4" />
          
          {/* Robot lock icon in center of body */}
          <rect x="85" y="120" width="30" height="30" rx="5" fill="#10B981" />
          <path d="M95 125V120C95 115 105 115 105 120V125" stroke="#06B6D4" strokeWidth="4" />
          
          {/* Robot arms */}
          <rect x="30" y="125" width="40" height="8" rx="4" fill="#22D3EE" />
          <rect x="130" y="125" width="40" height="8" rx="4" fill="#22D3EE" />
          
          {/* Robot antennas */}
          <rect x="75" y="5" width="4" height="15" fill="#22D3EE" />
          <circle cx="77" cy="2" r="5" fill="#22D3EE" />
          <rect x="120" y="5" width="4" height="15" fill="#22D3EE" />
          <circle cx="122" cy="2" r="5" fill="#22D3EE" />
        </svg>
      </motion.div>
    </div>
  );
};

export default AnimatedLockBot; 