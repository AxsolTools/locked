import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";
import { format } from "date-fns";
import {
  Users,
  Lock,
  BarChart3,
  Settings,
  Shield,
  DollarSign,
  Search,
  Unlock,
  AlertCircle,
  Eye,
  UserPlus,
  X,
  Loader2,
  Dice1,
  Wallet,
  RefreshCw
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface User {
  id: number;
  walletAddress: string;
  username?: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface LockedToken {
  id: number;
  userId: number;
  tokenType: string;
  amount: string;
  lockDate: string;
  unlockDate: string;
  status: string;
  releaseCondition: string;
}

interface PlatformStats {
  id: number;
  totalLockedTokens: string;
  activeLockers: number;
  avgLockDuration: number;
  tokensReleased: string;
  totalFeeCollected: string;
  updatedAt: string;
}

interface DiceGameConfig {
  enabled: boolean;
  houseWalletAddress: string;
  maxBetAmount: string;
  minBetAmount: string;
  houseEdge: number;
  bankrollAmount: string;
  payoutEnabled: boolean;
  decimalPlaces: number;
  maxProfit: string;
  hotWalletThreshold: string;
  lastUpdated: string;
}

interface SystemConfig {
  id: number;
  feeWalletAddress: string;
  feeAmount: string;
  minLockDuration: number;
  maxLockDuration: number;
  hookVersion: string;
  hookNamespace: string;
  adminEmail?: string;
  maintenanceMode: boolean;
  lastUpdated: string;
  updatedBy?: number;
  additionalSettings?: Record<string, any>;
  diceGameConfig: DiceGameConfig;
}

const Admin = () => {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [userSearch, setUserSearch] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<SystemConfig>>({
    feeWalletAddress: "",
    feeAmount: "25",
    minLockDuration: 1,
    maxLockDuration: 3650,
    hookVersion: "token_lock_v1",
    hookNamespace: "xrpl_token_locker",
    adminEmail: "",
    maintenanceMode: false
  });
  
  // Add dice game config form state
  const [diceConfigForm, setDiceConfigForm] = useState<Partial<DiceGameConfig>>({
    enabled: true,
    houseWalletAddress: "",
    maxBetAmount: "10000",
    minBetAmount: "1",
    houseEdge: 1.5,
    bankrollAmount: "100000",
    payoutEnabled: true,
    decimalPlaces: 2,
    maxProfit: "5000",
    hotWalletThreshold: "10000"
  });
  
  // CRITICAL SECURITY CHECK: Only allow the specific admin wallet to access this page
  const ADMIN_WALLET_ADDRESS = "rURSqvhDp8iLNtHupUNi6BEicUkGRZ7ihJ";
  // Hardcode this for development to match our wallet address in the wallet context
  const isAdmin = wallet && wallet.walletAddress === ADMIN_WALLET_ADDRESS;
  
  // Use queries with safer defaults to prevent hooks order issues
  // These queries will run regardless of admin status, but we'll only show data if admin
  
  // Fetch users
  const { data: usersData, isLoading: isUsersLoading } = useQuery<{ users: User[] }>({
    queryKey: ['/api/admin/users'],
    retry: 2,
    enabled: !!isAdmin, // Convert to boolean
    queryFn: async () => {
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      const url = `/api/admin/users?walletAddress=${encodeURIComponent(walletAddress)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access");
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // Fetch locked tokens
  const { data: tokensData, isLoading: isTokensLoading } = useQuery<{ lockedTokens: LockedToken[] }>({
    queryKey: ['/api/tokens/locked'],
    retry: 2,
    enabled: !!isAdmin, // Convert to boolean
    queryFn: async () => {
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      const url = `/api/tokens/locked?walletAddress=${encodeURIComponent(walletAddress)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access");
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // Fetch platform stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery<{ stats: PlatformStats }>({
    queryKey: ['/api/stats'],
    retry: 2,
    enabled: !!isAdmin, // Convert to boolean
    queryFn: async () => {
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      const url = `/api/stats?walletAddress=${encodeURIComponent(walletAddress)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // Fetch system configuration
  const { data: configData, isLoading: isConfigLoading } = useQuery<{ config: SystemConfig }>({
    queryKey: ['/api/admin/config'],
    retry: 2,
    enabled: !!isAdmin, // Convert to boolean
    queryFn: async () => {
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      const url = `/api/admin/config?walletAddress=${encodeURIComponent(walletAddress)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized access");
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // Emergency unlock mutation - removed wallet requirement
  const unlockMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      // Use admin wallet address
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      
      const response = await fetch(`/api/tokens/unlock/${tokenId}?walletAddress=${encodeURIComponent(walletAddress)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server returned error: ${response.status}` }));
        throw new Error(errorData.error || errorData.message || `Server returned error: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Unlock",
        description: "Token has been successfully unlocked",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tokens/locked'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Unlock Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: Partial<SystemConfig>) => {
      // Use admin wallet address
      const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
      
      // This is the correct endpoint path directly from the server code
      const response = await fetch(`/api/admin/config?walletAddress=${encodeURIComponent(walletAddress)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server returned error: ${response.status}` }));
        throw new Error(errorData.error || errorData.message || `Server returned error: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Add dice game config update mutation
  const updateDiceConfigMutation = useMutation({
    mutationFn: async (formData: Partial<DiceGameConfig>) => {
      try {
        // Clean up the data - ensure it doesn't have any undefined or invalid values
        const cleanData: Record<string, any> = Object.entries(formData).reduce((acc, [key, value]) => {
          // Skip undefined values to prevent issues
          if (value === undefined) return acc;
          
          // Convert numeric values appropriately
          if (key === 'houseEdge' || key === 'decimalPlaces') {
            acc[key] = Number(value);
          } else if (key === 'enabled' || key === 'payoutEnabled') {
            acc[key] = Boolean(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        // Add wallet address for authorization
        cleanData.updatedBy = wallet?.walletAddress;
        
        console.log("Submitting clean dice config data:", cleanData);
        
        // Include the wallet address in the URL only
        const walletAddress = wallet?.walletAddress || ADMIN_WALLET_ADDRESS;
        const url = `/api/admin/dice-config?walletAddress=${encodeURIComponent(walletAddress)}`;
        
        // Do NOT include x-wallet-address header since it's causing CORS issues
        const apiResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(cleanData)
        });
        
        // Check for non-200 response
        if (!apiResponse.ok) {
          // Clone the response before reading it to avoid "body stream already read" error
          const errorMessage = `Server returned error: ${apiResponse.status}`;
          
          // Only try to read the response body once
          try {
            const errorData = await apiResponse.json();
            throw new Error(errorData.error || errorData.message || errorMessage);
          } catch (parseError) {
            // If JSON parsing fails, we just throw the original error message
            throw new Error(errorMessage);
          }
        }
        
        // Parse successful response
        const responseData = await apiResponse.json();
        return responseData;
      } catch (error) {
        console.error("Failed to update dice game config:", error);
        throw error;
      }
    },
    onSuccess: (responseData) => {
      console.log("Dice game configuration updated successfully:", responseData);
      
      toast({
        title: "Configuration Updated",
        description: "Dice game configuration has been updated successfully",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
    },
    onError: (error) => {
      console.error("Error updating dice game config:", error);
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update useEffect to set the dice game config form values
  useEffect(() => {
    if (configData && configData.config) {
      const { 
        feeWalletAddress, 
        feeAmount,
        minLockDuration,
        maxLockDuration,
        hookVersion,
        hookNamespace,
        adminEmail,
        maintenanceMode,
        diceGameConfig
      } = configData.config;
      
      setConfigForm({
        feeWalletAddress,
        feeAmount,
        minLockDuration,
        maxLockDuration,
        hookVersion,
        hookNamespace,
        adminEmail: adminEmail || "",
        maintenanceMode
      });
      
      if (diceGameConfig) {
        setDiceConfigForm({
          enabled: diceGameConfig.enabled,
          houseWalletAddress: diceGameConfig.houseWalletAddress,
          maxBetAmount: diceGameConfig.maxBetAmount,
          minBetAmount: diceGameConfig.minBetAmount,
          houseEdge: diceGameConfig.houseEdge,
          bankrollAmount: diceGameConfig.bankrollAmount,
          payoutEnabled: diceGameConfig.payoutEnabled,
          decimalPlaces: diceGameConfig.decimalPlaces,
          maxProfit: diceGameConfig.maxProfit,
          hotWalletThreshold: diceGameConfig.hotWalletThreshold
        });
      }
    }
  }, [configData]);
  
  // Add handle dice config form change
  const handleDiceConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Convert values to appropriate types based on field
    let processedValue;
    if (type === "checkbox") {
      processedValue = checked;
    } else if (name === "houseEdge" || name === "decimalPlaces") {
      // For numeric fields, preserve as number
      processedValue = value === "" ? "" : Number(value);
    } else {
      processedValue = value;
    }
    
    setDiceConfigForm(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Add handle dice config submit
  const handleDiceConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the required fields
    if (!diceConfigForm.houseWalletAddress) {
      toast({
        title: "Validation Error",
        description: "House wallet address is required",
        variant: "destructive",
      });
      return;
    }
    
    // Make a copy to ensure we're not mutating the form state directly
    const configData = {
      ...diceConfigForm,
      // Convert string values to appropriate types
      enabled: Boolean(diceConfigForm.enabled),
      payoutEnabled: Boolean(diceConfigForm.payoutEnabled),
      houseEdge: Number(diceConfigForm.houseEdge),
      decimalPlaces: Number(diceConfigForm.decimalPlaces),
      minBetAmount: String(diceConfigForm.minBetAmount),
      maxBetAmount: String(diceConfigForm.maxBetAmount),
      maxProfit: String(diceConfigForm.maxProfit),
      bankrollAmount: String(diceConfigForm.bankrollAmount),
      hotWalletThreshold: String(diceConfigForm.hotWalletThreshold),
    };
    
    console.log("Submitting dice game config:", configData);
    updateDiceConfigMutation.mutate(configData);
  };
  
  // Filter users by search - with type safety
  const filteredUsers = usersData && usersData.users 
    ? usersData.users.filter((user: User) => 
        user.walletAddress.toLowerCase().includes(userSearch.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
      ) 
    : [];
  
  // Filter tokens by search - with type safety
  const filteredTokens = tokensData && tokensData.lockedTokens
    ? tokensData.lockedTokens.filter((token: LockedToken) => 
        token.tokenType.toLowerCase().includes(tokenSearch.toLowerCase()) ||
        token.amount.includes(tokenSearch) ||
        token.status.toLowerCase().includes(tokenSearch.toLowerCase())
      ) 
    : [];
  
  // Add the following state variables at the beginning of the component
  const [walletServiceStatus, setWalletServiceStatus] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [isWalletServiceInitializing, setIsWalletServiceInitializing] = useState(false);
  const [houseWalletAddress, setHouseWalletAddress] = useState("");
  const [houseWalletSeed, setHouseWalletSeed] = useState("");
  const [isRegisteringWallet, setIsRegisteringWallet] = useState(false);
  const [isCheckingBalances, setIsCheckingBalances] = useState(false);
  const [walletBalances, setWalletBalances] = useState<Array<{ role: string; address: string; xrpBalance: string }>>([]);

  // Add these functions after the existing mutation functions
  // Initialize wallet service
  const initializeWalletService = async () => {
    if (!masterPassword) return;
    
    setIsWalletServiceInitializing(true);
    try {
      const response = await fetch('/api/admin/wallet/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ masterPassword }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Wallet service initialized",
          description: "The wallet service has been successfully initialized.",
        });
        setWalletServiceStatus(true);
      } else {
        toast({
          variant: "destructive",
          title: "Initialization failed",
          description: data.error || "Failed to initialize wallet service.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Initialization failed",
        description: error.message || "An error occurred during initialization.",
      });
    } finally {
      setIsWalletServiceInitializing(false);
    }
  };

  // Register house wallet
  const registerHouseWallet = async () => {
    if (!houseWalletAddress || !houseWalletSeed) return;
    
    setIsRegisteringWallet(true);
    try {
      const response = await fetch('/api/admin/wallet/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(wallet?.walletAddress ? { 'x-wallet-address': wallet.walletAddress } : {})
        },
        body: JSON.stringify({
          role: 'house',
          address: houseWalletAddress,
          seed: houseWalletSeed,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Wallet registered",
          description: "The house wallet has been successfully registered.",
        });
        
        // Update the dice game config with the new house wallet address
        const updatedConfig = {
          ...diceConfigForm,
          houseWalletAddress
        };
        
        updateDiceConfigMutation.mutate(updatedConfig);
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || "Failed to register wallet.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
      });
    } finally {
      setIsRegisteringWallet(false);
    }
  };

  // Check wallet balances
  const checkWalletBalances = async () => {
    setIsCheckingBalances(true);
    try {
      const response = await fetch('/api/admin/wallet/balances');
      const data = await response.json();
      
      if (response.ok) {
        const formattedBalances = Object.entries(data).map(([address, details]: [string, any]) => ({
          role: details.role,
          address,
          xrpBalance: details.balances?.find((b: any) => b.currency === 'XRP')?.value || '0',
        }));
        
        setWalletBalances(formattedBalances);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to fetch balances",
          description: data.error || "Could not retrieve wallet balances.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error checking balances",
        description: error.message || "An error occurred while checking balances.",
      });
    } finally {
      setIsCheckingBalances(false);
    }
  };
  
  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Only administrators can access this section. If you believe this is an error, please contact support.
            </p>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // The rest of the component for admin access
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold">
              Admin <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Manage users, locked tokens, and platform settings
            </p>
          </div>
          
          <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="mt-4 md:mt-0">
                <Shield className="mr-2 h-5 w-5" />
                Emergency Controls
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Emergency Controls</DialogTitle>
                <DialogDescription>
                  These controls allow you to override normal platform behavior in case of emergencies.
                  Use with caution.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Button variant="destructive" className="w-full">
                  <X className="mr-2 h-5 w-5" />
                  Pause All Operations
                </Button>
                <Button variant="destructive" className="w-full">
                  <Unlock className="mr-2 h-5 w-5" />
                  Emergency Unlock All Tokens
                </Button>
                <Button variant="destructive" className="w-full">
                  <Shield className="mr-2 h-5 w-5" />
                  Reset Hook Configurations
                </Button>
              </div>
              <div className="mt-4 text-muted-foreground text-sm">
                <p>All emergency actions are logged and require additional verification.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Locked Value</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {statsData?.stats?.totalLockedTokens 
                  ? parseFloat(statsData.stats.totalLockedTokens).toLocaleString()
                  : 0} XRP
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-secondary">
                {usersData?.users.length || 0}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Fees Collected</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-accent">
                {statsData?.stats?.totalFeeCollected
                  ? parseFloat(statsData.stats.totalFeeCollected).toLocaleString()
                  : 0} XRP
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Locks</CardDescription>
          </CardHeader>
          <CardContent>
            {isTokensLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-500">
                {tokensData?.lockedTokens.filter(t => t.status === "locked").length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            <span>Locked Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="dice-game" className="flex items-center">
            <Dice1 className="mr-2 h-4 w-4" />
            <span>Dice Game</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Wallet Management</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <Button variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button className="bg-primary">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.id}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                          </TableCell>
                          <TableCell>{user.username || 'N/A'}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge className="bg-primary">Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy HH:mm") : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary">
                                {user.isAdmin ? (
                                  <Shield className="h-4 w-4" />
                                ) : (
                                  <UserPlus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No users found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Locked Tokens Tab */}
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <CardTitle>Locked Tokens Management</CardTitle>
                  <CardDescription>
                    Monitor and manage all locked tokens on the platform
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <Input
                    placeholder="Search tokens..."
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <Button variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isTokensLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token ID</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Token Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Lock Date</TableHead>
                        <TableHead>Unlock Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">{token.id}</TableCell>
                          <TableCell>{token.userId}</TableCell>
                          <TableCell>{token.tokenType}</TableCell>
                          <TableCell className="font-medium">{parseFloat(token.amount).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(token.lockDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(token.unlockDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge className={token.status === "locked" ? "bg-primary" : "bg-green-500"}>
                              {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {token.status === "locked" && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                                  onClick={() => unlockMutation.mutate(token.id)}
                                  disabled={unlockMutation.isPending}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredTokens.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No tokens found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>
                Comprehensive data on platform usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Fee Collection</h3>
                  <div className="h-64 bg-muted rounded-lg p-4 flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">User Growth</h3>
                  <div className="h-64 bg-muted rounded-lg p-4 flex items-center justify-center">
                    <Users className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Lock Duration Distribution</h3>
                  <div className="h-64 bg-muted rounded-lg p-4 flex items-center justify-center">
                    <Lock className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Token Type Distribution</h3>
                  <div className="h-64 bg-muted rounded-lg p-4 flex items-center justify-center">
                    <DollarSign className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-center text-muted-foreground">
                  Analytics data is refreshed every 15 minutes. Last update: {
                    statsData?.stats?.updatedAt 
                      ? format(new Date(statsData.stats.updatedAt), "MMM d, yyyy HH:mm:ss")
                      : 'Unknown'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Configure platform parameters and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConfigLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Fee Wallet Address</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text" 
                          value={configForm.feeWalletAddress || ""} 
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            feeWalletAddress: e.target.value
                          })}
                          placeholder="rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        XRPL address where fees will be sent
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Fee Amount</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="number" 
                          value={configForm.feeAmount || "25"} 
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            feeAmount: e.target.value
                          })}
                        />
                        <span>XRP</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fee charged for each token locking operation
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Minimum Lock Duration</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="number" 
                          value={configForm.minLockDuration || 1}
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            minLockDuration: parseInt(e.target.value) || 1
                          })}
                        />
                        <span>Days</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Minimum required lock duration
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Maximum Lock Duration</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="number" 
                          value={configForm.maxLockDuration || 365}
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            maxLockDuration: parseInt(e.target.value) || 365
                          })}
                        />
                        <span>Days</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Maximum allowed lock duration
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Hook Version</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text" 
                          value={configForm.hookVersion || "token_lock_v1"}
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            hookVersion: e.target.value
                          })}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hook version used for token locking
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Hook Namespace</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text" 
                          value={configForm.hookNamespace || "xrpl_token_locker"}
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            hookNamespace: e.target.value
                          })}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hook namespace on XRPL
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Admin Notifications</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="email" 
                          value={configForm.adminEmail || ""}
                          onChange={(e) => setConfigForm({
                            ...configForm,
                            adminEmail: e.target.value
                          })}
                          placeholder="admin@example.com" 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Email for emergency notifications
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Maintenance Mode</h3>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={configForm.maintenanceMode || false}
                          onCheckedChange={(checked: boolean) => setConfigForm({
                            ...configForm,
                            maintenanceMode: checked
                          })}
                        />
                        <span>{configForm.maintenanceMode ? "Enabled" : "Disabled"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When enabled, only admins can access the platform
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (configData?.config) {
                          setConfigForm({...configData.config});
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary"
                      disabled={updateConfigMutation.isPending}
                      onClick={() => updateConfigMutation.mutate(configForm)}
                    >
                      {updateConfigMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Settings"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dice Game Tab */}
        <TabsContent value="dice-game">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dice1 className="mr-2 h-5 w-5" />
                Dice Game Configuration
              </CardTitle>
              <CardDescription>
                Configure the dice game settings including house wallet, bet limits, and payout settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <form onSubmit={handleDiceConfigSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Enable Dice Game:</div>
                      <Switch 
                        name="enabled"
                        checked={diceConfigForm.enabled}
                        onCheckedChange={(checked) => 
                          setDiceConfigForm(prev => ({ ...prev, enabled: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Enable Payouts:</div>
                      <Switch 
                        name="payoutEnabled"
                        checked={diceConfigForm.payoutEnabled}
                        onCheckedChange={(checked) => 
                          setDiceConfigForm(prev => ({ ...prev, payoutEnabled: checked }))
                        }
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">House Wallet Address:</label>
                        <Input 
                          type="text"
                          name="houseWalletAddress"
                          value={diceConfigForm.houseWalletAddress}
                          onChange={handleDiceConfigChange}
                          placeholder="r..."
                        />
                        <p className="text-xs text-muted-foreground">
                          XRP Ledger address that holds the tokens for bets
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">House Edge (%):</label>
                        <Input 
                          type="number"
                          name="houseEdge"
                          value={diceConfigForm.houseEdge}
                          onChange={handleDiceConfigChange}
                          step="0.1"
                          min="0"
                          max="10"
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage advantage for the house (e.g., 1.5 means 1.5%)
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Minimum Bet Amount:</label>
                        <Input 
                          type="text"
                          name="minBetAmount"
                          value={diceConfigForm.minBetAmount}
                          onChange={handleDiceConfigChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Maximum Bet Amount:</label>
                        <Input 
                          type="text"
                          name="maxBetAmount"
                          value={diceConfigForm.maxBetAmount}
                          onChange={handleDiceConfigChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Maximum Profit per Bet:</label>
                        <Input 
                          type="text"
                          name="maxProfit"
                          value={diceConfigForm.maxProfit}
                          onChange={handleDiceConfigChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum amount a player can win in a single bet
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Decimal Places:</label>
                        <Input 
                          type="number"
                          name="decimalPlaces"
                          value={diceConfigForm.decimalPlaces}
                          onChange={handleDiceConfigChange}
                          min="0"
                          max="8"
                          onKeyDown={(e) => {
                            if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                              e.preventDefault();
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of decimal places for bet amounts and payouts
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bankroll Amount:</label>
                        <Input 
                          type="text"
                          name="bankrollAmount"
                          value={diceConfigForm.bankrollAmount}
                          onChange={handleDiceConfigChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Total amount available for payouts
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hot Wallet Threshold:</label>
                        <Input 
                          type="text"
                          name="hotWalletThreshold"
                          value={diceConfigForm.hotWalletThreshold}
                          onChange={handleDiceConfigChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum amount to keep in the hot wallet
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={updateDiceConfigMutation.isPending}
                  >
                    {updateDiceConfigMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Dice Game Configuration"}
                  </Button>
                  
                  {configData?.config?.diceGameConfig?.lastUpdated && (
                    <p className="text-xs text-center text-muted-foreground">
                      Last updated: {format(new Date(configData.config.diceGameConfig.lastUpdated), 'PPpp')}
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Wallet Management Tab */}
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Wallet className="inline-block mr-2 h-5 w-5" />
                Wallet Service Management
              </CardTitle>
              <CardDescription>
                Register and manage wallets for automated payouts and collections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Wallet Service Status:</div>
                  <Badge variant={walletServiceStatus ? "success" : "destructive"}>
                    {walletServiceStatus ? "Running" : "Not Running"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="grid gap-2">
                  <Label htmlFor="masterPassword">Master Password:</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="masterPassword"
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Enter master password to unlock wallet service"
                    />
                    <Button
                      variant="secondary"
                      onClick={initializeWalletService}
                      disabled={!masterPassword || isWalletServiceInitializing}
                    >
                      {isWalletServiceInitializing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        "Initialize"
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4">
                  <h3 className="font-semibold">Register House Wallet</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="houseWalletAddress">House Wallet Address:</Label>
                      <Input
                        id="houseWalletAddress"
                        value={houseWalletAddress}
                        onChange={(e) => setHouseWalletAddress(e.target.value)}
                        placeholder="rXXX..."
                        disabled={!walletServiceStatus}
                      />
                    </div>
                    <div>
                      <Label htmlFor="houseWalletSeed">House Wallet Seed:</Label>
                      <Input
                        id="houseWalletSeed"
                        type="password"
                        value={houseWalletSeed}
                        onChange={(e) => setHouseWalletSeed(e.target.value)}
                        placeholder="Enter wallet seed/family seed"
                        disabled={!walletServiceStatus}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={registerHouseWallet}
                    disabled={
                      !walletServiceStatus ||
                      !houseWalletAddress ||
                      !houseWalletSeed ||
                      isRegisteringWallet
                    }
                  >
                    {isRegisteringWallet ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register House Wallet"
                    )}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid gap-4">
                  <h3 className="font-semibold">Wallet Balances</h3>
                  <Button
                    variant="outline"
                    onClick={checkWalletBalances}
                    disabled={!walletServiceStatus || isCheckingBalances}
                  >
                    {isCheckingBalances ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Balances
                      </>
                    )}
                  </Button>
                  
                  {walletBalances.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>XRP Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {walletBalances.map((balance, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{balance.role}</TableCell>
                            <TableCell>{balance.address}</TableCell>
                            <TableCell>{balance.xrpBalance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No wallet balances available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
