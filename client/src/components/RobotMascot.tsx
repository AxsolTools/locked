import React from 'react';

interface RobotMascotProps {
  size?: 'sm' | 'md' | 'lg';
  withSpeechBubble?: boolean;
  speechText?: string;
  className?: string;
}

const RobotMascot: React.FC<RobotMascotProps> = ({ 
  size = 'md', 
  withSpeechBubble = false,
  speechText = "Securely lock your XRP tokens with our advanced Hook technology!",
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`relative ${className}`}>
      {withSpeechBubble && (
        <div className="speech-bubble bg-card border border-primary/20 rounded-xl p-4 mb-4 shadow-md relative">
          <p className="text-sm text-foreground">{speechText}</p>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-r border-b border-primary/20"></div>
        </div>
      )}
      
      <div className={`robot-container ${sizeClasses[size]} relative mx-auto`}>
        <div className="robot-head w-full h-2/3 bg-primary rounded-xl relative flex flex-col items-center justify-center overflow-hidden">
          {/* Robot eyes */}
          <div className="eyes flex justify-center space-x-4 mb-2">
            <div className="eye w-1/4 h-1/4 rounded-full bg-cyan-300 border-2 border-cyan-400 flex items-center justify-center">
              <div className="pupil w-1/2 h-1/2 rounded-full bg-cyan-500"></div>
            </div>
            <div className="eye w-1/4 h-1/4 rounded-full bg-cyan-300 border-2 border-cyan-400 flex items-center justify-center">
              <div className="pupil w-1/2 h-1/2 rounded-full bg-cyan-500"></div>
            </div>
          </div>
          
          {/* Robot mouth */}
          <div className="mouth w-1/2 h-2 bg-orange-400 rounded-full"></div>
          
          {/* Antennas */}
          <div className="antenna-left absolute -top-3 left-1/4 w-1 h-5 bg-orange-400"></div>
          <div className="antenna-left-ball absolute -top-4 left-1/4 w-3 h-3 rounded-full bg-orange-400"></div>
          
          <div className="antenna-right absolute -top-3 right-1/4 w-1 h-5 bg-orange-400"></div>
          <div className="antenna-right-ball absolute -top-4 right-1/4 w-3 h-3 rounded-full bg-orange-400"></div>
        </div>
        
        {/* Robot body */}
        <div className="robot-body w-3/5 h-1/3 bg-purple-900 mx-auto -mt-1 rounded-lg relative shadow-md flex items-center justify-center">
          <div className="lock-icon w-1/2 h-1/2 bg-primary/80 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3/4 w-3/4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>
        
        {/* Arms */}
        <div className="left-arm absolute left-0 top-1/2 w-1/5 h-1 bg-purple-700"></div>
        <div className="right-arm absolute right-0 top-1/2 w-1/5 h-1 bg-purple-700"></div>
      </div>
    </div>
  );
};

export default RobotMascot;