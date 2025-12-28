import { useState, useMemo, useEffect } from 'react';
import { useXrplTokens, type XrplToken } from '@/hooks/useXrplTokens';
import { useWallet } from '@/contexts/WalletContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Info, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface AvailableTokensListProps {
  onSelectToken: (token: XrplToken) => void;
  selectedCurrency?: string;
}

// Default tokens shown when wallet is not connected
const DEFAULT_TOKENS: XrplToken[] = [];

export default function AvailableTokensList({ onSelectToken, selectedCurrency }: AvailableTokensListProps) {
  const { wallet } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [trustLevel, setTrustLevel] = useState<number[]>([1, 2, 3]);
  const { toast } = useToast();
  const [isManuallyRetrying, setIsManuallyRetrying] = useState(false);
  
  // When wallet is not connected, we'll use default tokens
  const walletConnected = !!wallet;
  
  // Use our custom XRPL tokens hook (only when wallet is connected)
  const { tokens: walletTokens, isLoading, error, refresh, connectionMethod } = useXrplTokens();
  
  // Automatically retry on error
  useEffect(() => {
    if (walletConnected && error && !isLoading && !isManuallyRetrying) {
      // Add a small delay before retrying
      const retryTimer = setTimeout(() => {
        console.log('Auto-retrying token fetch after error');
        refresh();
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [walletConnected, error, isLoading, refresh, isManuallyRetrying]);
  
  // Handle manual refresh
  const handleManualRefresh = () => {
    if (!walletConnected) return;
    
    setIsManuallyRetrying(true);
    refresh();
    
    toast({
      title: 'Refreshing Tokens',
      description: 'Trying to fetch your tokens from the XRP Ledger...',
    });
    
    // Reset retry flag after some time
    setTimeout(() => {
      setIsManuallyRetrying(false);
    }, 10000);
  };
  
  // Use either wallet tokens or default tokens
  const availableTokens = walletConnected ? walletTokens : DEFAULT_TOKENS;
  
  // Function to format numbers
  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else {
      return num.toFixed(2);
    }
  };
  
  // Function to get trust level label and color
  const getTrustLevelInfo = (level: number) => {
    switch(level) {
      case 3:
        return { label: 'Verified', color: 'bg-green-500 text-white' };
      case 2:
        return { label: 'Trusted', color: 'bg-blue-500 text-white' };
      case 1:
        return { label: 'Unverified', color: 'bg-yellow-500 text-white' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500 text-white' };
    }
  };
  
  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!availableTokens || availableTokens.length === 0) return DEFAULT_TOKENS;
    
    return availableTokens.filter(token => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      const currency = token.currency.toLowerCase();
      const name = (token.name || '').toLowerCase();
      
      return currency.includes(searchLower) || name.includes(searchLower);
    });
  }, [availableTokens, searchQuery]);
  
  // If there's a selected currency, make sure it's at the top of the list
  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort((a, b) => {
      if (a.currency === selectedCurrency) return -1;
      if (b.currency === selectedCurrency) return 1;
      return 0;
    });
  }, [filteredTokens, selectedCurrency]);
  
  // Show loading state only when wallet is connected and data is loading
  if (walletConnected && isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-40 mt-1" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }
  
  // Show error state only when wallet is connected and error occurs
  if (walletConnected && error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 p-4 rounded-lg">
          <p className="text-destructive font-medium">Error loading tokens</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <div className="mt-3 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isManuallyRetrying}
              className="text-xs"
            >
              {isManuallyRetrying ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry Connection
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              Connection: {connectionMethod || 'failed'}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground p-2 border border-dashed rounded">
          <p>If connection issues persist:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Check your internet connection</li>
            <li>Try using a different browser (Chrome or Firefox recommended)</li>
            <li>Ensure your wallet address is correct and funded</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={trustLevel.includes(3) ? "default" : "outline"}
            onClick={() => {
              if (trustLevel.includes(3)) {
                setTrustLevel(trustLevel.filter(t => t !== 3));
              } else {
                setTrustLevel([...trustLevel, 3]);
              }
            }}
            className="text-xs"
          >
            Verified
          </Button>
          <Button
            size="sm"
            variant={trustLevel.includes(2) ? "default" : "outline"}
            onClick={() => {
              if (trustLevel.includes(2)) {
                setTrustLevel(trustLevel.filter(t => t !== 2));
              } else {
                setTrustLevel([...trustLevel, 2]);
              }
            }}
            className="text-xs"
          >
            Trusted
          </Button>
          <Button
            size="sm"
            variant={trustLevel.includes(1) ? "default" : "outline"}
            onClick={() => {
              if (trustLevel.includes(1)) {
                setTrustLevel(trustLevel.filter(t => t !== 1));
              } else {
                setTrustLevel([...trustLevel, 1]);
              }
            }}
            className="text-xs"
          >
            Unverified
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-60">
        <div className="space-y-2">
          {sortedTokens.map((token) => {
            const isSelected = selectedCurrency === token.currency;
            const trustInfo = getTrustLevelInfo(token.trustLevel || 3);
            
            // Format currency display - show readable name or first few chars of hex
            const displayCurrency = token.name || token.currency;
            const shortCurrencyCode = token.currency.length > 8 
              ? `${token.currency.substring(0, 4)}...${token.currency.substring(token.currency.length - 4)}`
              : token.currency;
            
            return (
              <div 
                key={`${token.currency}:${token.issuer || ''}`}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onClick={() => onSelectToken(token)}
              >
                <div className="flex items-center gap-3">
                  {token.logo ? (
                    <img 
                      src={token.logo} 
                      alt={displayCurrency} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {token.name && token.name.length > 0
                          ? token.name.substring(0, 2)
                          : shortCurrencyCode.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{displayCurrency}</span>
                      <Badge className={`text-xs ${trustInfo.color}`}>
                        {trustInfo.label}
                      </Badge>
                      
                      {token.currency.length > 8 && (
                        <span className="text-xs text-muted-foreground">
                          ({shortCurrencyCode})
                        </span>
                      )}
                      
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-3 w-3" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{displayCurrency}</h4>
                              {token.currency !== 'XRP' && token.issuer && (
                                <a 
                                  href={`https://xrpscan.com/token/${token.currency}.${token.issuer}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center text-blue-500"
                                >
                                  View on XRPScan <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                            
                            {token.currency.length > 8 && (
                              <div className="bg-muted/50 p-2 rounded text-xs">
                                <p className="font-medium">Currency Code:</p>
                                <p className="font-mono overflow-hidden text-ellipsis text-muted-foreground">{token.currency}</p>
                              </div>
                            )}
                            
                            <p className="text-sm text-muted-foreground">
                              {token.description || `Token on the XRPL`}
                            </p>
                            
                            {token.issuer && (
                              <div className="bg-muted p-2 rounded text-xs">
                                <p className="font-medium">Issuer:</p>
                                <p className="overflow-hidden text-ellipsis">{token.issuer}</p>
                              </div>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Balance: {formatNumber(token.balance || '0')} {displayCurrency}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Button 
                    variant={isSelected ? "default" : "outline"} 
                    size="sm" 
                    className="py-0 h-7"
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            );
          })}
          
          {sortedTokens.length === 0 && (
            <div className="text-center p-8 rounded-lg border border-dashed border-muted-foreground/50">
              {walletConnected ? (
                <>
                  <p className="font-medium">Connection Troubleshooter</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your wallet is connected (address: {wallet.walletAddress.substring(0, 6)}...{wallet.walletAddress.substring(wallet.walletAddress.length - 4)}), 
                    but we couldn't retrieve your tokens.
                  </p>
                  <div className="bg-amber-50 text-amber-800 p-2 rounded-md mt-3 text-xs">
                    <p className="font-medium">Connection Diagnostics:</p>
                    <p className="mt-1">Wallet ID: {wallet.id}</p>
                    <p>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : navigator.userAgent.includes('Firefox') ? 'Firefox ✅' : navigator.userAgent.includes('Edge') ? 'Edge ⚠️' : navigator.userAgent.includes('Safari') ? 'Safari ⚠️' : 'Other ⚠️'}</p>
                    <p>WebSocket: {error ? "Failed ❌" : isLoading ? "Trying... ⏳" : "Not connected ❌"}</p>
                    <p>REST API: {error ? "Failed ❌" : isLoading ? "Trying... ⏳" : "Not tried yet ⏳"}</p>
                    {error && <p className="text-red-500 mt-1">Error: {error.message}</p>}
                    
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleManualRefresh}
                        disabled={isLoading || isManuallyRetrying}
                        className="text-xs w-full"
                      >
                        {isLoading || isManuallyRetrying ? (
                          <>
                            <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Attempting Connection...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Retry Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 text-blue-800 p-3 rounded-md text-xs">
                    <p className="font-medium">Test Connection Methods:</p>
                    <ol className="text-left list-decimal list-inside mt-2 space-y-2">
                      <li>
                        Test REST API directly: 
                        <Button 
                          onClick={() => {
                            // For Windows users, provide a PowerShell-compatible command
                            const apiUrl = `https://api.xrpscan.com/api/v1/account/${wallet.walletAddress}`;
                            
                            // Create a temporary textarea to copy the command
                            const textarea = document.createElement('textarea');
                            textarea.value = `Invoke-RestMethod -Uri "${apiUrl}" | ConvertTo-Json -Depth 2`;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            
                            window.open(apiUrl, '_blank');
                            
                            // Notify user that command was copied
                            toast({
                              title: "PowerShell Command Copied",
                              description: "Command copied! Open PowerShell and paste to test the API directly.",
                              duration: 5000,
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="ml-2 h-6 py-0 text-xs"
                        >
                          Test XRPScan API
                        </Button>
                      </li>
                      <li>
                        View Account on Explorer: 
                        <Button 
                          onClick={() => {
                            window.open(`https://xrpscan.com/account/${wallet.walletAddress}`, '_blank');
                          }}
                          variant="outline" 
                          size="sm"
                          className="ml-2 h-6 py-0 text-xs"
                        >
                          Open XRPScan
                        </Button>
                      </li>
                      <li>
                        Test WebSocket Availability:
                        <Button
                          onClick={() => {
                            const testSocket = new WebSocket('wss://s1.ripple.com');
                            testSocket.onopen = () => {
                              toast({
                                title: "WebSocket Success",
                                description: "Your browser/network supports WebSocket connections!",
                                duration: 5000,
                              });
                              testSocket.close();
                            };
                            testSocket.onerror = () => {
                              toast({
                                title: "WebSocket Failed",
                                description: "Your browser/network is blocking WebSocket connections.",
                                variant: 'destructive',
                                duration: 5000,
                              });
                            };
                          }}
                          variant="outline"
                          size="sm"
                          className="ml-2 h-6 py-0 text-xs"
                        >
                          Test WebSocket
                        </Button>
                      </li>
                    </ol>
                  </div>
                  
                  <p className="text-xs mt-4 font-medium">Connection Troubleshooting:</p>
                  <ol className="text-xs text-left list-decimal list-inside mt-1 space-y-1">
                    <li>If the XRPScan website shows your account, it exists and should work</li>
                    <li>Connection issues are usually caused by:</li>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Corporate firewall or network security blocking WebSockets</li>
                      <li>Browser security settings or extensions (adblockers, etc.)</li>
                      <li>Browser incompatibility with XRPL WebSockets</li>
                    </ul>
                    <li className="mt-2">Try these solutions:</li>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Use Chrome or Firefox for best compatibility</li> 
                      <li>Temporarily disable browser extensions</li>
                      <li>Try a different network connection</li>
                      <li>Reset wallet connection (disconnect/reconnect)</li>
                    </ul>
                  </ol>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button 
                      onClick={() => window.location.reload()}
                      size="sm"
                    >
                      Refresh Page
                    </Button>
                    <Button 
                      onClick={() => {
                        // Force tokens refresh
                        refresh();
                        setSearchQuery('');
                        // Wait a bit and then refresh
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Reset Connection
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">Connect your wallet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your XRPL wallet to see your tokens
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}