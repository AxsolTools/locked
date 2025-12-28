import { useQuery } from "@tanstack/react-query";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import StatsBar from "@/components/shared/StatsBar";
import ActivityFeed from "@/components/shared/ActivityFeed";
import LockedTokensTable from "@/components/lock/LockedTokensTable";
import LockedValueChart from "@/components/charts/LockedValueChart";
import ConnectWalletPrompt from "@/components/wallet/ConnectWalletPrompt";
import { Link } from "wouter";

const Dashboard = () => {
  const { publicKey, isConnected, formatAddress } = useSolanaWallet();

  interface UserData {
    user: {
      username: string;
      walletAddress: string;
      isAdmin: boolean;
    }
  }
  
  const { data: userData } = useQuery<UserData>({
    queryKey: publicKey ? [`/api/user/profile?walletAddress=${publicKey}`] : ['/api/user/profile'],
    enabled: isConnected,
  });

  // If not authenticated, show connect wallet prompt
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
        <ConnectWalletPrompt 
          title="Access Your Dashboard" 
          description="Connect your wallet to view your locked tokens, activity, and analytics."
        />
        
        {/* Preview cards accessible for all users */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">What You Can Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
              <div className="h-12 w-12 mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-outfit font-bold mb-2">Lock New Tokens</h3>
              <p className="text-muted-foreground">
                Lock your tokens for future use with custom timeframes and conditions
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
              <div className="h-12 w-12 mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-outfit font-bold mb-2">Transaction History</h3>
              <p className="text-muted-foreground">
                View your complete history of lock and unlock operations
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
              <div className="h-12 w-12 mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-outfit font-bold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Get insights into your locking patterns and asset performance
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If authenticated, show the dashboard
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Welcome Banner */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold mb-2">
              Welcome, {userData?.user?.username || 'XRP Hero'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your locked tokens and track your portfolio in real-time
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Your Wallet</p>
              <p className="font-medium truncate max-w-[150px]">
                {publicKey ? formatAddress(publicKey) : ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Dashboard Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Locked Tokens Table */}
        <div className="lg:col-span-2">
          <LockedTokensTable />
        </div>
        
        {/* Activity Feed */}
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Analytics Section */}
      <section className="mt-8">
        <h3 className="text-xl font-outfit font-medium mb-4">Locked Value Overview</h3>
        <LockedValueChart />
      </section>

      {/* Quick Access Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/lock-tokens">
          <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
            <div className="h-12 w-12 mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-outfit font-bold mb-2">Lock New Tokens</h3>
            <p className="text-muted-foreground">
              Lock your tokens for future use with custom timeframes and conditions
            </p>
          </div>
        </Link>
        
        <Link href="/history">
          <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
            <div className="h-12 w-12 mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-outfit font-bold mb-2">Transaction History</h3>
            <p className="text-muted-foreground">
              View your complete history of lock and unlock operations
            </p>
          </div>
        </Link>
        
        <Link href="/analytics">
          <div className="bg-card rounded-xl p-6 shadow-xl comic-border hover:bg-card/80 transition-colors cursor-pointer">
            <div className="h-12 w-12 mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-outfit font-bold mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">
              Get insights into your locking patterns and asset performance
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Dashboard;
