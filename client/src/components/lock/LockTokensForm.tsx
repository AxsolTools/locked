import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../../hooks/use-toast";
import { useSolanaWallet, TokenBalance } from "../../contexts/SolanaWalletContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Lock, HelpCircle, Clock, BarChart3, Shield, Wallet, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { format, addMonths, addYears, differenceInSeconds } from "date-fns";
import bs58 from 'bs58';

const lockTokenSchema = z.object({
  tokenMint: z.string().min(1, "Please select a token"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Must be a positive number"
  ),
  durationValue: z.string().min(1, "Duration is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Must be a positive number"
  ),
  durationUnit: z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"]),
  releaseCondition: z.enum(["time-based", "vesting", "conditional"]),
});

type LockTokenFormValues = z.infer<typeof lockTokenSchema>;

// Convert duration to seconds based on unit
const convertToSeconds = (value: number, unit: string): number => {
  switch (unit) {
    case "seconds": return value;
    case "minutes": return value * 60;
    case "hours": return value * 60 * 60;
    case "days": return value * 24 * 60 * 60;
    case "weeks": return value * 7 * 24 * 60 * 60;
    case "months": return value * 30 * 24 * 60 * 60; // Approximate
    case "years": return value * 365 * 24 * 60 * 60; // Approximate
    default: return value;
  }
};

// Format duration for display
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''}`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) !== 1 ? 's' : ''}`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} week${Math.floor(seconds / 604800) !== 1 ? 's' : ''}`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} month${Math.floor(seconds / 2592000) !== 1 ? 's' : ''}`;
  return `${Math.floor(seconds / 31536000)} year${Math.floor(seconds / 31536000) !== 1 ? 's' : ''}`;
};

// API call to create vesting schedule (duration in seconds)
const createVestingSchedule = async (
  walletAddress: string,
  amount: number,
  durationSeconds: number,
  signedMessage: string,
  signature: string,
  releaseCondition: string
) => {
  const response = await fetch('/api/vesting/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      amount,
      durationSeconds,
      signedMessage,
      signature,
      releaseCondition
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create vesting schedule');
  }
  
  return data;
};

// API call to get user's game balance
const fetchGameBalance = async (walletAddress: string): Promise<number> => {
  const response = await fetch(`/api/balance/${walletAddress}`);
  const data = await response.json();
  
  if (data.success) {
    return parseFloat(data.balance);
  }
  
  return 0;
};

const LockTokensForm = () => {
  const { publicKey, isConnected, signMessage, formatAddress, tokenBalances, isLoadingTokens, refreshTokenBalances } = useSolanaWallet();
  const { toast } = useToast();
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);

  const form = useForm<LockTokenFormValues>({
    resolver: zodResolver(lockTokenSchema),
    defaultValues: {
      tokenMint: "",
      amount: "",
      durationValue: "30",
      durationUnit: "days",
      releaseCondition: "time-based",
    },
  });

  // Update selected token when tokenMint changes
  const watchedMint = form.watch("tokenMint");
  useEffect(() => {
    const token = tokenBalances.find(t => t.mint === watchedMint);
    setSelectedToken(token || null);
  }, [watchedMint, tokenBalances]);

  const onSubmit = async (values: LockTokenFormValues) => {
    if (!publicKey || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please generate or import a wallet to lock tokens",
        variant: "destructive",
      });
      return;
    }

    if (!selectedToken) {
      toast({
        title: "No Token Selected",
        description: "Please select a token to lock",
        variant: "destructive",
      });
      return;
    }

    const lockAmount = parseFloat(values.amount);
    
    // Check balance
    if (lockAmount > selectedToken.uiBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${selectedToken.uiBalance.toFixed(selectedToken.decimals > 6 ? 6 : selectedToken.decimals)} ${selectedToken.symbol} available.`,
        variant: "destructive",
      });
      return;
    }

    setIsLocking(true);

    try {
      // Calculate duration in seconds
      const durationValue = parseFloat(values.durationValue);
      const durationSeconds = convertToSeconds(durationValue, values.durationUnit);
      
      if (durationSeconds < 1) {
        throw new Error('Lock duration must be at least 1 second');
      }

      // Create message to sign
      const timestamp = Date.now();
      const message = `Lock ${lockAmount} ${selectedToken.symbol} tokens for ${durationSeconds} seconds. Timestamp: ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const signatureBytes = signMessage(messageBytes);
      
      if (!signatureBytes) {
        throw new Error('Failed to sign message. Please try again.');
      }

      const signature = bs58.encode(signatureBytes);

      // Call the vesting API
      const result = await createVestingSchedule(
        publicKey,
        lockAmount,
        durationSeconds,
        message,
        signature,
        values.releaseCondition
      );

      // Calculate unlock time for toast message
      const unlockDate = new Date(Date.now() + durationSeconds * 1000);

      // Reset form
      form.reset({
        tokenMint: "",
        amount: "",
        durationValue: "30",
        durationUnit: "days",
        releaseCondition: "time-based",
      });
      setSelectedDuration(null);
      setSelectedToken(null);

      // Refresh token balances
      refreshTokenBalances();

      toast({
        title: "Tokens Locked Successfully",
        description: `You've locked ${lockAmount} ${selectedToken.symbol} for ${formatDuration(durationSeconds)}. Unlocks: ${format(unlockDate, 'PPP pp')}`,
      });

    } catch (error: any) {
      console.error('Error locking tokens:', error);
      toast({
        title: "Failed to Lock Tokens",
        description: error.message || "An error occurred while locking tokens",
        variant: "destructive",
      });
    } finally {
      setIsLocking(false);
    }
  };

  const handleDurationSelect = (duration: string) => {
    switch (duration) {
      case "1min":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "minutes");
        break;
      case "1hour":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "hours");
        break;
      case "1day":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "days");
        break;
      case "1week":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "weeks");
        break;
      case "1month":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "months");
        break;
      case "1year":
        form.setValue("durationValue", "1");
        form.setValue("durationUnit", "years");
        break;
      default:
        form.setValue("durationValue", "30");
        form.setValue("durationUnit", "days");
    }
    setSelectedDuration(duration);
  };

  return (
    <section className="bg-card rounded-xl p-6 shadow-xl border border-cyan-500/20">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-outfit font-bold">Lock Your SPL Tokens</h2>
        <div className="relative group">
          <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
          <div className="absolute z-10 right-0 w-64 bg-zinc-900 p-3 rounded-lg shadow-lg text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
            Lock any SPL token from your wallet for a specified time period. Tokens will be released automatically after the lock period ends.
          </div>
        </div>
      </div>

      {/* Wallet Status */}
      {isConnected && publicKey ? (
        <div className="mb-6 bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-4 text-white">
          <div className="flex items-start gap-2">
            <Wallet className="h-5 w-5 mt-0.5 text-cyan-400" />
            <div className="flex-grow">
              <p className="font-medium text-cyan-300">Wallet Connected</p>
              <p className="text-sm text-gray-300">Address: {formatAddress(publicKey)}</p>
              <p className="text-sm text-gray-300">
                {isLoadingTokens ? 'Loading tokens...' : `${tokenBalances.length} token${tokenBalances.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refreshTokenBalances()}
              disabled={isLoadingTokens}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 text-white">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 text-zinc-400" />
            <div>
              <p className="font-medium text-zinc-300">Wallet Not Connected</p>
              <p className="text-sm text-gray-400">Generate or import a wallet to lock tokens.</p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Token Selection */}
          <FormField
            control={form.control}
            name="tokenMint"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Select Token</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-900 text-white border border-zinc-700">
                      <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select a token to lock"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-900 border border-zinc-700 max-h-[300px]">
                    {tokenBalances.length === 0 && !isLoadingTokens ? (
                      <SelectItem value="none" disabled>No tokens found in wallet</SelectItem>
                    ) : (
                      tokenBalances.map((token) => (
                        <SelectItem key={token.mint} value={token.mint}>
                          <div className="flex items-center gap-2">
                            {token.logoURI && (
                              <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
                            )}
                            <span>{token.symbol}</span>
                            <span className="text-gray-400 text-xs">
                              ({token.uiBalance.toFixed(token.decimals > 6 ? 6 : 2)})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount Field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Amount to Lock</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-lg pr-20"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <span className="text-cyan-400 font-medium">{selectedToken?.symbol || 'TOKEN'}</span>
                  </div>
                </div>
                {selectedToken && (
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-400">
                      Available: {selectedToken.uiBalance.toFixed(selectedToken.decimals > 6 ? 6 : 2)} {selectedToken.symbol}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="text-cyan-400 text-xs p-0 h-auto"
                      onClick={() => field.onChange(selectedToken.uiBalance.toString())}
                    >
                      MAX
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quick Duration Selection */}
          <div>
            <FormLabel className="text-gray-300 block mb-2">Quick Select</FormLabel>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { key: "1min", label: "1 Min" },
                { key: "1hour", label: "1 Hour" },
                { key: "1day", label: "1 Day" },
                { key: "1week", label: "1 Week" },
                { key: "1month", label: "1 Month" },
                { key: "1year", label: "1 Year" },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  variant={selectedDuration === key ? "default" : "outline"}
                  className={
                    selectedDuration === key
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                      : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-gray-300 text-xs"
                  }
                  onClick={() => handleDurationSelect(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="durationValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Duration</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="30"
                      className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-lg"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setSelectedDuration(null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="durationUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Unit</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDuration(null);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900 text-white border border-zinc-700">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border border-zinc-700">
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Duration Preview */}
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
            <p className="text-sm text-gray-400">
              Lock duration: <span className="text-cyan-400 font-medium">
                {formatDuration(convertToSeconds(
                  parseFloat(form.watch("durationValue") || "0"), 
                  form.watch("durationUnit")
                ))}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unlocks: {format(
                new Date(Date.now() + convertToSeconds(
                  parseFloat(form.watch("durationValue") || "0"), 
                  form.watch("durationUnit")
                ) * 1000), 
                'PPP pp'
              )}
            </p>
          </div>

          {/* Release Condition */}
          <FormField
            control={form.control}
            name="releaseCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Lock Type</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className={`bg-zinc-900 hover:bg-zinc-800 border-zinc-700 p-3 h-full text-sm flex flex-col items-center justify-center ${
                      field.value === "time-based" ? "border-cyan-500 border-2" : ""
                    }`}
                    onClick={() => field.onChange("time-based")}
                  >
                    <Clock className="h-5 w-5 mb-1 text-cyan-400" />
                    <span className="text-gray-300">Time-Based</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`bg-zinc-900 hover:bg-zinc-800 border-zinc-700 p-3 h-full text-sm flex flex-col items-center justify-center ${
                      field.value === "vesting" ? "border-emerald-500 border-2" : ""
                    }`}
                    onClick={() => field.onChange("vesting")}
                  >
                    <BarChart3 className="h-5 w-5 mb-1 text-emerald-400" />
                    <span className="text-gray-300">Linear Vesting</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`bg-zinc-900 hover:bg-zinc-800 border-zinc-700 p-3 h-full text-sm flex flex-col items-center justify-center ${
                      field.value === "conditional" ? "border-teal-500 border-2" : ""
                    }`}
                    onClick={() => field.onChange("conditional")}
                  >
                    <Shield className="h-5 w-5 mb-1 text-teal-400" />
                    <span className="text-gray-300">Cliff Vesting</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {field.value === "time-based" && "Tokens unlock all at once on the release date."}
                  {field.value === "vesting" && "Tokens unlock gradually over time."}
                  {field.value === "conditional" && "Tokens remain locked until the cliff date, then unlock all at once."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="pt-4 border-t border-zinc-700">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-bold py-3"
              disabled={isLocking || !isConnected || !selectedToken}
            >
              {isLocking ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
                  Locking Tokens...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Lock {selectedToken?.symbol || 'Tokens'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default LockTokensForm;
