import { motion } from "framer-motion";

interface LockBotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  withSpeechBubble?: boolean;
}

const LockBot = ({ 
  message = "Hey there, XRP hero! Need to lock your tokens for the future? I'm Lock-Bot, your guide to the XRPLOCKER ROOM! Let me help you secure your assets with style.", 
  size = 'md',
  withSpeechBubble = true
}: LockBotProps) => {
  const sizeClasses = {
    sm: 'w-40 h-40',
    md: 'w-64 h-64',
    lg: 'w-80 h-80'
  };

  return (
    <div className="relative z-10 w-full md:max-w-xs mx-auto">
      {withSpeechBubble && (
        <motion.div 
          className="bubble p-6 bg-card border border-primary/20 shadow-md text-foreground"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">XL</span>
            </div>
            <p className="font-medium">Hey there, XRP hero!</p>
          </div>
          <p className="text-sm">{message}</p>
        </motion.div>
      )}
      
      <motion.div 
        className={`${sizeClasses[size]} mx-auto mt-4`}
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          y: {
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Robot head - dark orange */}
          <rect x="50" y="20" width="100" height="90" rx="12" fill="#FF6B2C" />
          <rect x="55" y="25" width="90" height="80" rx="8" fill="#E05E22" />
          
          {/* Robot eyes - teal */}
          <circle cx="80" cy="55" r="13" fill="#20D6C7" />
          <circle cx="120" cy="55" r="13" fill="#20D6C7" />
          <circle cx="80" cy="55" r="6" fill="#FFFFFF" />
          <circle cx="120" cy="55" r="6" fill="#FFFFFF" />
          
          {/* Robot mouth - orange */}
          <rect x="70" y="80" width="60" height="10" rx="5" fill="#FF6B2C" />
          
          {/* Robot body */}
          <rect x="70" y="110" width="60" height="60" rx="8" fill="#E05E22" />
          
          {/* Robot lock icon in center of body */}
          <rect x="85" y="120" width="30" height="30" rx="5" fill="#20D6C7" />
          <path d="M95 125V120C95 115 105 115 105 120V125" stroke="#E05E22" strokeWidth="4" />
          
          {/* Robot arms */}
          <rect x="30" y="125" width="40" height="8" rx="4" fill="#FF6B2C" />
          <rect x="130" y="125" width="40" height="8" rx="4" fill="#FF6B2C" />
          
          {/* Robot antennas */}
          <rect x="75" y="5" width="4" height="15" fill="#FF6B2C" />
          <circle cx="77" cy="2" r="5" fill="#FF6B2C" />
          <rect x="120" y="5" width="4" height="15" fill="#FF6B2C" />
          <circle cx="122" cy="2" r="5" fill="#FF6B2C" />
        </svg>
      </motion.div>
    </div>
  );
};

export default LockBot;
