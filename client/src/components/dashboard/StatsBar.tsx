import { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, Wallet } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

// Stats card component
const StatCard = ({ icon, title, value, description }: { 
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
}) => (
  <div className="bg-card p-4 rounded-lg shadow-sm border border-muted">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-primary/10 rounded-full text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-medium">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  </div>
);

// StatsBar component to show platform stats and wallet balance
const StatsBar = () => {
  const { userGameBalance, publicKey, isConnected, formatAddress } = useSolanaWallet();
  const [stats, setStats] = useState({
    totalLockedTokens: '0',
    activeLockers: 0,
    avgLockDuration: 0,
    tokensReleased: '0',
    totalFeeCollected: '0'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/stats');
        
        // Check if response is ok
        if (response.ok) {
          const data = await response.json();
          
          setStats({
            totalLockedTokens: data.totalLockedTokens || '0',
            activeLockers: data.activeLockers || 0,
            avgLockDuration: data.avgLockDuration || 0,
            tokensReleased: data.tokensReleased || '0',
            totalFeeCollected: data.totalFeeCollected || '0'
          });
        } else {
          console.error('Failed to fetch stats:', response.status, response.statusText);
          // Keep default values if response is not ok
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Format numbers for display
  const formatNumber = (value: string | number) => {
    try {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0';
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
      return '0';
    }
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Wallet className="h-4 w-4" />}
        title="Your Game Balance"
        value={`${userGameBalance > 0 ? formatNumber(userGameBalance) : 'Loading...'}`}
        description={isConnected && publicKey ? formatAddress(publicKey) : 'Connect wallet'}
      />
      <StatCard
        icon={<DollarSign className="h-4 w-4" />}
        title="Total Locked Value"
        value={isLoading ? 'Loading...' : `${formatNumber(stats.totalLockedTokens)}`}
      />
      <StatCard
        icon={<Users className="h-4 w-4" />}
        title="Active Lockers"
        value={isLoading ? 'Loading...' : formatNumber(stats.activeLockers)}
      />
      <StatCard
        icon={<Calendar className="h-4 w-4" />}
        title="Avg. Lock Duration"
        value={isLoading ? 'Loading...' : `${formatNumber(stats.avgLockDuration)} days`}
      />
    </div>
  );
};

export default StatsBar; 
