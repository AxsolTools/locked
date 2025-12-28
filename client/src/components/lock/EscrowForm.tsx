import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../../hooks/use-toast";
import { useEscrow } from "../../hooks/useEscrow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Calendar, HelpCircle, Clock, Lock, Unlock, Ban, Wallet } from "lucide-react";
import { format, addMonths, addDays, addYears } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccountBalances } from "@/lib/xrplUtils";
import { getWalletFromStorage, WalletUser } from "@/lib/walletStorage";

// Define the form schema using zod
const escrowFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Must be a positive number"
  ),
  destinationAddress: z.string().min(1, "Destination address is required"),
  finishAfter: z.date().min(new Date(), "Release date must be in the future"),
  cancelAfter: z.date().min(new Date(), "Cancel date must be in the future").optional(),
  condition: z.string().optional(),
  fulfillment: z.string().optional(),
});

type EscrowFormValues = z.infer<typeof escrowFormSchema>;

// Escrow form component
const EscrowForm = () => {
  // Replace useWallet with direct state management
  const [wallet, setWallet] = useState<WalletUser | null>(null);
  const [balance, setBalance] = useState<string>("0");
  
  const { toast } = useToast();
  const { createEscrow, isCreatingEscrow } = useEscrow();
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("create");
  
  // Load wallet data from localStorage on component mount
  useEffect(() => {
    const storedWallet = getWalletFromStorage();
    setWallet(storedWallet);
    
    // Fetch balance if wallet exists
    if (storedWallet?.walletAddress) {
      const fetchBalance = async () => {
        try {
          const balances = await getAccountBalances(storedWallet.walletAddress);
          const xrpBalance = balances.find(b => b.currency === 'XRP');
          if (xrpBalance) {
            setBalance(xrpBalance.value);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      
      fetchBalance();
    }
  }, []);
  
  // Initialize the form
  const form = useForm<EscrowFormValues>({
    resolver: zodResolver(escrowFormSchema),
    defaultValues: {
      amount: "",
      destinationAddress: "",
      finishAfter: addDays(new Date(), 7), // Default: 7 days in the future
      cancelAfter: addDays(new Date(), 30), // Default: 30 days in the future
      condition: "",
      fulfillment: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: EscrowFormValues) => {
    try {
      console.log("Escrow form values:", values);
      
      if (!wallet || !wallet.walletAddress) {
        toast({
          title: "Wallet Required",
          description: "Please connect a wallet to create an escrow.",
          variant: "default",
        });
        return;
      }
      
      // Validate amount against available balance
      const amountInXrp = parseFloat(values.amount);
      const balanceValue = parseFloat(balance);
      
      if (isNaN(amountInXrp) || amountInXrp <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid XRP amount greater than 0.",
          variant: "destructive",
        });
        return;
      }
      
      // XRP Ledger requires a minimum of 20 XRP reserve for escrows
      if (amountInXrp < 20) {
        toast({
          title: "Minimum Amount Required",
          description: "The minimum amount for an escrow is 20 XRP.",
          variant: "destructive",
        });
        return;
      }
      
      if (amountInXrp > balanceValue) {
        toast({
          title: "Insufficient Balance",
          description: `You don't have enough XRP. Your balance: ${balance} XRP`,
          variant: "destructive",
        });
        return;
      }
      
      // Display loading toast
      toast({
        title: "Creating Escrow",
        description: "Preparing escrow transaction...",
      });
      
      // Call the hook to create the escrow
      await createEscrow({
        destinationAddress: values.destinationAddress,
        amount: values.amount,
        finishAfter: values.finishAfter,
        cancelAfter: values.cancelAfter,
        condition: values.condition || undefined
      });
      
      // Reset form on success
      form.reset({
        amount: "",
        destinationAddress: "",
        finishAfter: addDays(new Date(), 7),
        cancelAfter: addDays(new Date(), 30),
        condition: "",
        fulfillment: "",
      });
      setSelectedDuration(null);
      
      // Show success toast
      toast({
        title: "Escrow Created Successfully!",
        description: `${values.amount} XRP has been locked in escrow until ${format(values.finishAfter, 'PPP')}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error creating escrow:", error);
      
      // Provide more detailed error messages based on common XRPL errors
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common XRPL error codes
        if (errorMessage.includes("tecNO_DST_INSUF_XRP")) {
          errorMessage = "The destination account does not exist or doesn't meet the XRP reserve requirement.";
        } else if (errorMessage.includes("terINSUF_FEE_B")) {
          errorMessage = "The account sending the transaction doesn't have enough XRP to pay the transaction fee.";
        } else if (errorMessage.includes("tefPAST_SEQ")) {
          errorMessage = "The sequence number is too high. Please try reconnecting your wallet.";
        } else if (errorMessage.includes("tecUNFUNDED_PAYMENT")) {
          errorMessage = "Insufficient funds to create the escrow.";
        }
      }
      
      toast({
        title: "Failed to Create Escrow",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Handle duration selection
  const handleDurationSelect = (duration: string) => {
    let finishAfter: Date;
    let cancelAfter: Date;
    
    switch (duration) {
      case "1week":
        finishAfter = addDays(new Date(), 7);
        cancelAfter = addDays(new Date(), 30);
        break;
      case "1month":
        finishAfter = addMonths(new Date(), 1);
        cancelAfter = addMonths(new Date(), 2);
        break;
      case "3months":
        finishAfter = addMonths(new Date(), 3);
        cancelAfter = addMonths(new Date(), 4);
        break;
      case "6months":
        finishAfter = addMonths(new Date(), 6);
        cancelAfter = addMonths(new Date(), 7);
        break;
      default:
        finishAfter = addDays(new Date(), 7);
        cancelAfter = addDays(new Date(), 30);
    }
    
    form.setValue("finishAfter", finishAfter);
    form.setValue("cancelAfter", cancelAfter);
    setSelectedDuration(duration);
  };
  
  return (
    <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-outfit font-bold">XRP Escrow</h2>
        <div className="relative group">
          <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
          <div className="tooltip absolute z-10 right-0 w-64 bg-muted p-3 rounded-lg shadow-lg text-sm text-muted-foreground">
            Escrow allows you to lock XRP for a specified time period or until a cryptographic condition is met.
          </div>
        </div>
      </div>
      
      {/* Show wallet status */}
      {wallet ? (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <div className="flex items-start gap-2">
            <Wallet className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Wallet Connected</p>
              <p className="text-sm">Address: {wallet.walletAddress}</p>
              <p className="text-sm">
                Balance: {parseFloat(balance) > 0 ? balance : '(Fetching...)' } XRP
              </p>
              <p className="text-xs mt-1">
                Note: Creating an escrow has a transaction cost of 12 drops (0.000012 XRP).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <div className="flex items-start gap-2">
            <Wallet className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Wallet Not Connected</p>
              <p className="text-sm">You need to connect a wallet to use escrow.</p>
              <p className="text-xs mt-1">Click "Connect Wallet" in the top right to proceed.</p>
            </div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create" className="flex items-center gap-1">
            <Lock className="h-4 w-4 mr-1" />
            Create Escrow
          </TabsTrigger>
          <TabsTrigger value="finish" className="flex items-center gap-1">
            <Unlock className="h-4 w-4 mr-1" />
            Finish Escrow
          </TabsTrigger>
          <TabsTrigger value="cancel" className="flex items-center gap-1">
            <Ban className="h-4 w-4 mr-1" />
            Cancel Escrow
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="destinationAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Destination Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="r..."
                          className="w-full bg-background text-foreground border border-primary/20 rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Amount (XRP)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="0.00"
                            className="w-full bg-background text-foreground border border-primary/20 rounded-lg pr-16"
                            {...field}
                          />
                        </FormControl>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <span className="text-muted-foreground">XRP</span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormLabel className="text-muted-foreground block mb-2">Lock Duration</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    type="button"
                    variant={selectedDuration === "1week" ? "default" : "outline"}
                    className={selectedDuration === "1week" ? "bg-primary" : "bg-background border-primary/20"}
                    onClick={() => handleDurationSelect("1week")}
                  >
                    1 Week
                  </Button>
                  <Button
                    type="button"
                    variant={selectedDuration === "1month" ? "default" : "outline"}
                    className={selectedDuration === "1month" ? "bg-primary" : "bg-background border-primary/20"}
                    onClick={() => handleDurationSelect("1month")}
                  >
                    1 Month
                  </Button>
                  <Button
                    type="button"
                    variant={selectedDuration === "3months" ? "default" : "outline"}
                    className={selectedDuration === "3months" ? "bg-primary" : "bg-background border-primary/20"}
                    onClick={() => handleDurationSelect("3months")}
                  >
                    3 Months
                  </Button>
                  <Button
                    type="button"
                    variant={selectedDuration === "6months" ? "default" : "outline"}
                    className={selectedDuration === "6months" ? "bg-primary" : "bg-background border-primary/20"}
                    onClick={() => handleDurationSelect("6months")}
                  >
                    6 Months
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="finishAfter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Release Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="w-full bg-background text-foreground border border-primary/20 rounded-lg"
                          value={format(field.value, "yyyy-MM-dd")}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                              field.onChange(date);
                              setSelectedDuration(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cancelAfter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Cancel Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="w-full bg-background text-foreground border border-primary/20 rounded-lg"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const date = value ? new Date(value) : undefined;
                            if (date && !isNaN(date.getTime())) {
                              field.onChange(date);
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 transition-colors w-full" 
                  disabled={isCreatingEscrow || !wallet}
                >
                  {isCreatingEscrow ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                      Creating Escrow...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Create Escrow
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="finish">
          <div className="p-4 bg-secondary/10 rounded-lg text-center">
            <Unlock className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <h3 className="text-lg font-semibold mb-2">Finish an Escrow</h3>
            <p className="text-muted-foreground mb-4">
              Enter the details of an escrow that has reached its release time to claim the escrowed XRP.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>To finish an escrow, you'll need:</p>
              <ul className="list-disc pl-6 text-left mt-2 space-y-1">
                <li>The address of the account that created the escrow (Owner)</li>
                <li>The sequence number of the EscrowCreate transaction</li>
                <li>If it's a conditional escrow, the fulfillment code</li>
              </ul>
            </div>
            <Button className="mt-4" onClick={() => setActiveTab("create")}>
              Switch to Create Escrow
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="cancel">
          <div className="p-4 bg-destructive/10 rounded-lg text-center">
            <Ban className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Cancel an Escrow</h3>
            <p className="text-muted-foreground mb-4">
              Cancel an escrow that has passed its cancellation date to return the escrowed XRP to the sender.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>To cancel an escrow, you'll need:</p>
              <ul className="list-disc pl-6 text-left mt-2 space-y-1">
                <li>The address of the account that created the escrow (Owner)</li>
                <li>The sequence number of the EscrowCreate transaction</li>
                <li>The escrow must have passed its CancelAfter time</li>
              </ul>
            </div>
            <Button className="mt-4" onClick={() => setActiveTab("create")}>
              Switch to Create Escrow
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 bg-muted rounded-lg p-4">
        <h3 className="font-medium text-sm mb-2">About XRPL Escrow</h3>
        <p className="text-xs text-muted-foreground">
          XRP Ledger's Escrow feature allows you to send conditional XRP payments that execute automatically when conditions are met. 
          When you create an escrow, the XRP is locked and can only be released when the finish time has passed or when a cryptographic condition is fulfilled.
        </p>
      </div>
    </section>
  );
};

export default EscrowForm; 