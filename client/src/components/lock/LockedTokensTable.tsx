import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface VestingSchedule {
  id: string;
  owner: string;
  amount: number;
  startTime: number;
  duration: number;
  claimedAmount: number;
  vestedAmount: number;
  claimableAmount: number;
  txHash?: string;
}

export default function LockedTokensTable() {
  const { publicKey, isConnected } = useSolanaWallet();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; schedules: VestingSchedule[] }>({
    queryKey: [`/api/vesting/schedules/${publicKey}`],
    enabled: isConnected && !!publicKey,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: config } = useQuery<{ decimals: number; symbol: string }>({
    queryKey: ['/api/token/config'],
  });

  const claimMutation = useMutation({
    mutationFn: async (vestingId: string) => {
      const response = await fetch('/api/vesting/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vestingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim tokens');
      }

      return response.json();
    },
    onSuccess: (data, vestingId) => {
      toast.success('Tokens claimed successfully!', {
        description: data.txHash ? (
          <a 
            href={`https://solscan.io/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-1"
          >
            View on Solscan <ExternalLink className="h-3 w-3" />
          </a>
        ) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vesting/schedules/${publicKey}`] });
      setClaimingId(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to claim tokens', {
        description: error.message,
      });
      setClaimingId(null);
    },
  });

  const handleClaim = async (vestingId: string) => {
    setClaimingId(vestingId);
    claimMutation.mutate(vestingId);
  };

  const formatAmount = (amount: number) => {
    const decimals = config?.decimals || 6;
    return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
      maximumFractionDigits: decimals,
    });
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (!isConnected) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Your Locked Tokens</CardTitle>
          <CardDescription>
            Tokens you've locked on Solana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Connect your wallet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Connect your wallet to view your locked tokens
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Your Locked Tokens</CardTitle>
          <CardDescription>
            Tokens you've locked on Solana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const schedules = data?.schedules || [];

  if (schedules.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Your Locked Tokens</CardTitle>
          <CardDescription>
            Tokens you've locked on Solana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No tokens locked yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              When you lock tokens, they will appear here. Head to the Lock Tokens page to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">Your Locked Tokens</CardTitle>
        <CardDescription>
          {schedules.length} active lock{schedules.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Locked Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimable</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => {
                const endTime = schedule.startTime + schedule.duration;
                const isVested = Date.now() >= endTime * 1000;
                const isFullyClaimed = schedule.claimedAmount >= schedule.amount;
                const canClaim = schedule.claimableAmount > 0 && isVested;

                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {formatAmount(schedule.amount)} {config?.symbol || 'TOKENS'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(schedule.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isVested ? (
                        <span className="text-green-600 dark:text-green-400">Unlocked</span>
                      ) : (
                        formatDistanceToNow(new Date(endTime * 1000), { addSuffix: true })
                      )}
                    </TableCell>
                    <TableCell>
                      {isFullyClaimed ? (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Claimed
                        </Badge>
                      ) : isVested ? (
                        <Badge variant="default" className="bg-green-600">
                          Ready to Claim
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Locked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatAmount(schedule.claimableAmount)} {config?.symbol || 'TOKENS'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canClaim ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(schedule.id)}
                          disabled={claimingId === schedule.id}
                        >
                          {claimingId === schedule.id ? 'Claiming...' : 'Claim'}
                        </Button>
                      ) : schedule.txHash ? (
                        <a
                          href={`https://solscan.io/tx/${schedule.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
