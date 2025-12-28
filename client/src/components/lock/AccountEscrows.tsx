import React, { useEffect, useState } from "react";
import { useEscrow } from "../../hooks/useEscrow";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";
import { getWalletFromStorage, WalletUser } from "@/lib/walletStorage";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Clock, 
  Ban, 
  Unlock,
  ChevronDown,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { AccountEscrow } from "../../lib/escrowUtils";

// Helper function to format XRP amount
const formatXrp = (drops: string): string => {
  const xrpValue = parseFloat(drops) / 1000000;
  return xrpValue.toFixed(2);
};

// Helper to convert Ripple time to regular date
const rippleTimeToDate = (rippleTime: number | null | undefined): Date => {
  if (rippleTime === null || rippleTime === undefined) {
    return new Date(); // Return current date as fallback
  }
  // Ripple time is seconds since January 1, 2000 UTC
  // UNIX time is seconds since January 1, 1970 UTC
  // The difference is 946684800 seconds
  const unixTime = rippleTime + 946684800;
  return new Date(unixTime * 1000);
};

// Helper function to determine escrow status
const getEscrowStatus = (escrow: AccountEscrow): { status: string; color: string } => {
  const now = Math.floor(Date.now() / 1000) - 946684800; // Current Ripple time
  
  if (escrow.finishAfter && escrow.finishAfter <= now) {
    return { status: "Ready to Finish", color: "bg-green-500" };
  } else if (escrow.cancelAfter && escrow.cancelAfter <= now) {
    return { status: "Cancelable", color: "bg-yellow-500" };
  } else if (escrow.condition) {
    return { status: "Conditional", color: "bg-blue-500" };
  } else {
    return { status: "Locked", color: "bg-gray-500" };
  }
};

const AccountEscrows = () => {
  const [wallet, setWallet] = useState<WalletUser | null>(null);
  
  // Load wallet from storage on component mount
  useEffect(() => {
    const storedWallet = getWalletFromStorage();
    setWallet(storedWallet);
  }, []);
  
  const { 
    escrows, 
    isLoadingEscrows, 
    loadAccountEscrows, 
    finishEscrow, 
    cancelEscrow,
    isFinishingEscrow,
    isCancelingEscrow
  } = useEscrow();
  const { toast } = useToast();

  // Load escrows when wallet is connected
  useEffect(() => {
    if (wallet?.walletAddress) {
      loadAccountEscrows(wallet.walletAddress);
    }
  }, [wallet?.walletAddress, loadAccountEscrows]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (wallet?.walletAddress) {
      loadAccountEscrows(wallet.walletAddress);
      toast({
        title: "Refreshing Escrows",
        description: "Getting the latest escrow data from the XRP Ledger...",
      });
    } else {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to view your escrows.",
        variant: "destructive",
      });
    }
  };

  // Handle finish escrow
  const handleFinishEscrow = async (escrow: AccountEscrow, index: number) => {
    if (!wallet?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to finish an escrow.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Finishing Escrow",
        description: "Preparing transaction...",
      });

      await finishEscrow({
        owner: escrow.owner,
        escrowSequence: escrow.sequence,
        fulfillment: escrow.condition ? "" : undefined, // You would need UI to input fulfillment for conditional escrows
      });

      toast({
        title: "Escrow Finished",
        description: `${formatXrp(escrow.amount)} XRP has been released from escrow.`,
      });
    } catch (error) {
      console.error("Error finishing escrow:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Failed to Finish Escrow",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle cancel escrow
  const handleCancelEscrow = async (escrow: AccountEscrow, index: number) => {
    if (!wallet?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to cancel an escrow.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Canceling Escrow",
        description: "Preparing transaction...",
      });

      await cancelEscrow({
        owner: escrow.owner,
        escrowSequence: escrow.sequence,
      });

      toast({
        title: "Escrow Canceled",
        description: `${formatXrp(escrow.amount)} XRP has been returned from escrow.`,
      });
    } catch (error) {
      console.error("Error canceling escrow:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Failed to Cancel Escrow",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // View escrow on XRPL Explorer
  const viewOnExplorer = (address: string, sequence: number) => {
    // Open the XRPL Explorer for the specific account - use mainnet
    window.open(`https://xrpl.org/accounts/${address}`, "_blank");
  };

  // Helper to check if escrow can be finished
  const canFinishEscrow = (escrow: AccountEscrow): boolean => {
    const now = Math.floor(Date.now() / 1000) - 946684800; // Current Ripple time
    return escrow.finishAfter !== undefined && 
           escrow.finishAfter !== null && 
           escrow.finishAfter <= now;
  };

  // Helper to check if escrow can be canceled
  const canCancelEscrow = (escrow: AccountEscrow): boolean => {
    const now = Math.floor(Date.now() / 1000) - 946684800; // Current Ripple time
    return escrow.cancelAfter !== undefined && 
           escrow.cancelAfter !== null && 
           escrow.cancelAfter <= now;
  };

  return (
    <Card className="w-full shadow-md comic-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">My Escrows</CardTitle>
          <CardDescription>
            View and manage your active XRP escrows
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingEscrows}>
          {isLoadingEscrows ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      
      <CardContent>
        {!wallet?.walletAddress ? (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Connect a wallet to view your escrows</p>
          </div>
        ) : isLoadingEscrows ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full"></div>
          </div>
        ) : escrows.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No escrows found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>List of your active escrows on the XRP Ledger</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Amount (XRP)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrows.map((escrow, index) => {
                  const { status, color } = getEscrowStatus(escrow);
                  return (
                    <TableRow key={`${escrow.owner}-${escrow.sequence}`}>
                      <TableCell className="font-mono text-xs">
                        {escrow.destination.substring(0, 6)}...{escrow.destination.substring(escrow.destination.length - 6)}
                      </TableCell>
                      <TableCell>{formatXrp(escrow.amount)}</TableCell>
                      <TableCell>
                        <Badge className={color}>{status}</Badge>
                      </TableCell>
                      <TableCell>{escrow.sequence}</TableCell>
                      <TableCell className="space-x-1">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value={`escrow-${index}`} className="border-none">
                            <AccordionTrigger className="py-1">
                              <span className="sr-only">Details</span>
                              <ChevronDown className="h-4 w-4" />
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="text-sm space-y-2 p-2 bg-muted/30 rounded-md">
                                {escrow.finishAfter && (
                                  <div>
                                    <span className="font-medium">Release Date:</span>{" "}
                                    {format(rippleTimeToDate(escrow.finishAfter), "PPpp")}
                                  </div>
                                )}
                                {escrow.cancelAfter && (
                                  <div>
                                    <span className="font-medium">Cancel Date:</span>{" "}
                                    {format(rippleTimeToDate(escrow.cancelAfter), "PPpp")}
                                  </div>
                                )}
                                {escrow.condition && (
                                  <div>
                                    <span className="font-medium">Condition:</span>{" "}
                                    <span className="font-mono text-xs break-all">{escrow.condition}</span>
                                  </div>
                                )}
                                <div className="flex space-x-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    disabled={!canFinishEscrow(escrow) || isFinishingEscrow}
                                    onClick={() => handleFinishEscrow(escrow, index)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Unlock className="h-3 w-3" />
                                    <span>Finish</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    disabled={!canCancelEscrow(escrow) || isCancelingEscrow}
                                    onClick={() => handleCancelEscrow(escrow, index)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Ban className="h-3 w-3" />
                                    <span>Cancel</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => viewOnExplorer(escrow.owner, escrow.sequence)}
                                    className="flex items-center space-x-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View</span>
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          {escrows.length} escrow{escrows.length !== 1 ? 's' : ''} found
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccountEscrows; 