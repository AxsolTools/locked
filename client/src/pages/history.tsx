import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { format } from "date-fns";
import { Lock, Unlock, Clock, Eye, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ConnectWalletPrompt from "@/components/wallet/ConnectWalletPrompt";

interface Transaction {
  id: number;
  userId: number;
  type: string;
  tokenType: string;
  amount: string;
  transactionHash?: string;
  timestamp: string;
  status: string;
  details?: {
    unlockDate?: string;
    releaseCondition?: string;
    lockedTokenId?: number;
  };
}

const History = () => {
  const { wallet } = useWallet();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: wallet ? [`/api/transactions?userId=${wallet.id}`] : ['/api/transactions'],
    enabled: !!wallet,
  });

  // Filter transactions based on type and search query
  const filteredTransactions = data?.transactions.filter((tx) => {
    const matchesFilter = filter === "all" || tx.type === filter;
    const matchesSearch = !searchQuery || 
      tx.tokenType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.includes(searchQuery) ||
      (tx.transactionHash && tx.transactionHash.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "lock":
        return <Lock className="h-5 w-5 text-primary" />;
      case "unlock":
        return <Unlock className="h-5 w-5 text-secondary" />;
      default:
        return <Clock className="h-5 w-5 text-accent" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Success</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold">
              Transaction <span className="text-primary">History</span>
            </h1>
            <p className="text-muted-foreground">
              View and track all your lock and unlock operations on the XRPL
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export History</span>
            </Button>
          </div>
        </div>
      </section>

      {wallet ? (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="bg-card">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>Filter by Type</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="lock">Lock Operations</SelectItem>
                    <SelectItem value="unlock">Unlock Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-64">
                <Input
                  placeholder="Search by token, amount, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {isLoading ? (
            <div className="bg-card rounded-xl p-6 shadow-xl comic-border">
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
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 shadow-xl comic-border overflow-hidden">
              {filteredTransactions && filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction Hash</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{tx.tokenType}</TableCell>
                          <TableCell className="font-medium">{parseFloat(tx.amount).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(tx.timestamp), "MMM d, yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs truncate max-w-[120px]">{tx.transactionHash || 'N/A'}</span>
                              {tx.transactionHash && (
                                <a href={`https://xrpscan.com/tx/${tx.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                  <Eye className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-outfit font-medium mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {searchQuery || filter !== "all" 
                      ? "No transactions match your current filters. Try adjusting your search criteria."
                      : "You don't have any transactions yet. Start by locking some tokens!"}
                  </p>
                  {(searchQuery || filter !== "all") && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-card rounded-xl p-6 shadow-xl comic-border">
          <ConnectWalletPrompt
            title="View Your Transaction History"
            description="Connect your wallet to see your locking and unlocking transactions on the XRP Ledger."
            showMascot={true}
          />
        </div>
      )}
    </div>
  );
};

export default History;
