import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ChevronDown, LogOut, ExternalLink, Import, RefreshCw } from 'lucide-react';
import { WalletImport } from './WalletImport';
import { getWalletFromStorage, clearWalletStorage, WalletUser } from '@/lib/walletStorage';
import { getAccountBalances } from '@/lib/xrplUtils';

const WalletConnect = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Use direct state management instead of context
  const [wallet, setWallet] = useState<WalletUser | null>(null);
  const [balance, setBalance] = useState<string>('0.0');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load wallet from storage on component mount
  useEffect(() => {
    const storedWallet = getWalletFromStorage();
    if (storedWallet) {
      setWallet(storedWallet);
      fetchBalance(storedWallet.walletAddress);
    }
  }, []);
  
  // Fetch wallet balance
  const fetchBalance = async (address: string) => {
    try {
      setIsRefreshing(true);
      const balances = await getAccountBalances(address);
      const xrpBalance = balances.find(b => b.currency === 'XRP');
      if (xrpBalance) {
        setBalance(xrpBalance.value);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle refreshing the balance
  const handleRefreshBalance = () => {
    if (wallet?.walletAddress) {
      fetchBalance(wallet.walletAddress);
      toast({
        title: 'Refreshing Balance',
        description: 'Getting the latest balance from the XRP Ledger...',
      });
    }
  };
  
  // Handle wallet disconnection
  const handleDisconnect = () => {
    // Remove wallet from storage
    clearWalletStorage();
    
    // Clear local state
    setWallet(null);
    setBalance('0.0');
    setIsRefreshing(false);
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected'
    });
    
    // Force a page reload to reset all app state
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <>
      {!wallet ? (
        <>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(true)}
            className="bg-white bg-opacity-10 hover:bg-opacity-20"
          >
            <Wallet className="mr-2 h-4 w-4 wallet-icon" />
            Connect Wallet
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect wallet</DialogTitle>
                <DialogDescription>
                  Connect your XRP Ledger wallet to use the XRPLOCKER ROOM
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="import">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="import" className="flex items-center gap-1">
                    <Import className="h-4 w-4 mr-1" />
                    Import Wallet
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="import" className="py-4">
                  <WalletImport 
                    onComplete={() => {
                      setIsDialogOpen(false);
                      toast({
                        title: "Wallet Connected",
                        description: "Your wallet has been successfully connected"
                      });
                      // Refresh page to apply wallet changes
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="hidden md:block bg-muted p-2 rounded-md text-xs">
            <div className="flex items-center gap-2">
              <Wallet className="h-3 w-3 text-primary" />
              <span className="font-medium">{formatAddress(wallet.walletAddress)}</span>
              {balance !== '0.0' && (
                <span className="font-semibold text-emerald-600">
                  {balance} XRP
                </span>
              )}
              {balance === '0.0' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 p-0 text-amber-500 text-[10px]"
                  onClick={handleRefreshBalance}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Balance
                </Button>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="md:hidden">{formatAddress(wallet.walletAddress)}</span>
                  {balance !== '0.0' && (
                    <span className="text-sm font-medium text-green-600 md:hidden">
                      {balance} XRP
                    </span>
                  )}
                  {balance === '0.0' && (
                    <span className="text-xs text-amber-500 md:hidden">
                      (Loading...)
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2" disabled>
                {wallet.walletAddress}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleRefreshBalance} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Balance
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <a 
                  href={`https://bithomp.com/explorer/${wallet.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Bithomp
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <a 
                  href={`https://xrpscan.com/account/${wallet.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on XRPSCAN
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive focus:text-destructive" 
                onClick={handleDisconnect}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
};

export default WalletConnect;