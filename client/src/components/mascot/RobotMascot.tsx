import React from "react";

interface RobotMascotProps {
  size?: 'sm' | 'md' | 'lg';
}

const RobotMascot: React.FC<RobotMascotProps> = ({ 
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`${sizeClasses[size]}`}>
      <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Robot head */}
        <rect x="50" y="20" width="100" height="90" rx="12" fill="#FF6B2C" />
        <rect x="55" y="25" width="90" height="80" rx="8" fill="#E05E22" />
        
        {/* Robot eyes */}
        <circle cx="80" cy="55" r="13" fill="#20D6C7" />
        <circle cx="120" cy="55" r="13" fill="#20D6C7" />
        <circle cx="80" cy="55" r="6" fill="#FFFFFF" />
        <circle cx="120" cy="55" r="6" fill="#FFFFFF" />
        
        {/* Robot mouth */}
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
    </div>
  );
};

export default RobotMascot; 