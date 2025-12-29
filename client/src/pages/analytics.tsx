import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { format, subDays, subMonths } from "date-fns";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectWalletPrompt from "@/components/wallet/ConnectWalletPrompt";

const COLORS = ["hsl(267, 74%, 57%)", "hsl(174, 71%, 48%)", "hsl(24, 100%, 59%)", "hsl(262, 83%, 58%)"];

const Analytics = () => {
  const { publicKey, isConnected } = useSolanaWallet();
  const [timeRange, setTimeRange] = useState("month");
  
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: publicKey ? [`/api/user/profile?walletAddress=${publicKey}`] : ['/api/user/profile'],
    enabled: isConnected,
  });
  
  interface StatsData {
    stats: {
      totalLockedTokens: string;
      activeLockers: number;
      avgLockDuration: number;
    }
  }
  
  const { data: statsData, isLoading: isStatsLoading } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
  });

  // Fetch user's vesting schedules
  const { data: vestingData } = useQuery<{ success: boolean; schedules: any[] }>({
    queryKey: [`/api/vesting/schedules/${publicKey}`],
    enabled: isConnected && !!publicKey,
    refetchInterval: 30000,
  });

  const { data: tokenConfig } = useQuery<{ decimals: number; symbol: string }>({
    queryKey: ['/api/token/config'],
  });

  // Calculate user stats from vesting schedules
  const userSchedules = vestingData?.schedules || [];
  const totalLocked = userSchedules.reduce((sum, s) => sum + (s.amount - s.claimedAmount), 0);
  const activeLocks = userSchedules.filter(s => {
    const endTime = s.startTime + s.duration;
    return Date.now() < endTime * 1000 && s.claimedAmount < s.amount;
  }).length;
  const avgDuration = userSchedules.length > 0
    ? userSchedules.reduce((sum, s) => sum + s.duration, 0) / userSchedules.length
    : 0;

  const formatAmount = (amount: number) => {
    const decimals = tokenConfig?.decimals || 6;
    return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };
  
  // If not authenticated, show a simplified view with connection prompt
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Page Header */}
        <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-outfit font-bold">
                Token <span className="text-primary">Analytics</span>
              </h1>
              <p className="text-muted-foreground">
                Track your locked token performance and platform statistics
              </p>
            </div>
          </div>
        </section>
        
        {/* Platform Stats Available for All */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Locked Value</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {statsData?.stats?.totalLockedTokens ? parseFloat(statsData.stats.totalLockedTokens).toLocaleString() : 0} LOCKED
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Locks</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-secondary">
                  {statsData?.stats?.activeLockers || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Lock Duration</CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-accent">
                  {statsData?.stats?.avgLockDuration 
                    ? Math.round(statsData.stats.avgLockDuration / 30 * 10) / 10 
                    : 0} Months
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Connect Wallet Prompt */}
        <div className="mt-8">
          <ConnectWalletPrompt
            title="Access Your Analytics Dashboard"
            description="Connect your wallet to see detailed analytics about your locked tokens, performance charts, and personalized insights."
            showMascot={true}
          />
        </div>
      </div>
    );
  }
  
  // If authenticated, show the full analytics dashboard
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold">
              Token <span className="text-primary">Analytics</span>
            </h1>
            <p className="text-muted-foreground">
              Track your locked token performance and platform statistics
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant={timeRange === "week" ? "default" : "outline"}
              onClick={() => setTimeRange("week")}
              className={timeRange === "week" ? "bg-primary" : ""}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "default" : "outline"}
              onClick={() => setTimeRange("month")}
              className={timeRange === "month" ? "bg-primary" : ""}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === "year" ? "default" : "outline"}
              onClick={() => setTimeRange("year")}
              className={timeRange === "year" ? "bg-primary" : ""}
            >
              Year
            </Button>
          </div>
        </div>
      </section>
      
      {/* Charts Section */}
      <Tabs defaultValue="locked">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="locked">Locked Value</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="locked" className="space-y-4">
          <Card className="bg-card comic-border shadow-lg">
            <CardHeader>
              <CardTitle>Locked Value Over Time</CardTitle>
              <CardDescription>
                Track the value of your locked tokens over {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                  Connect your wallet and lock tokens to see analytics data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <Card className="bg-card comic-border shadow-lg">
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>
                Your locked token portfolio distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Connect your wallet and lock tokens to see distribution data
                  </p>
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  <p className="text-lg font-medium">No tokens locked yet</p>
                  <p className="text-muted-foreground">
                    Token distribution will be displayed here when you lock tokens
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/lock-tokens"}
                    className="w-fit"
                  >
                    Lock Tokens Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Locked Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatAmount(totalLocked)} {tokenConfig?.symbol || 'TOKENS'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userSchedules.length > 0 ? 'Total locked tokens' : 'Lock tokens to see real-time analytics'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Locks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {activeLocks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeLocks > 0 ? 'Currently locked' : 'No active locks yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Lock Duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {avgDuration > 0 ? Math.round(avgDuration / 86400 * 10) / 10 : 0} Days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userSchedules.length > 0 ? 'Average across all locks' : 'No lock history yet'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
