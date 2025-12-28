import { motion } from "framer-motion";
import LockTokensForm from "@/components/lock/LockTokensForm";
import { RecentActivity } from "@/components/shared/RecentActivity";
import LockBot from "@/components/mascot/LockBot";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Lock, Calendar } from "lucide-react";

const LockTokens = () => {
  const { isConnected } = useSolanaWallet();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold">
              Lock Your <span className="text-primary">Tokens</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Secure your LOCKED tokens with advanced vesting mechanisms on Solana. Set custom schedules and time-based releases.
            </p>
          </div>
          
          <motion.div 
            className="mt-4 md:mt-0 md:w-1/4 hidden md:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LockBot 
              size="sm"
              message="Lock your tokens with time-based vesting schedules. Your assets stay secure until the unlock conditions are met!" 
            />
          </motion.div>
        </div>
      </section>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Lock Form */}
        <div className="lg:col-span-2">
          <LockTokensForm />
        </div>
        
        {/* Recent Activity */}
        <RecentActivity />
      </div>
      
      {/* Information Section */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <h2 className="text-xl font-outfit font-bold mb-4">
          Token Locking on Solana
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-3 text-secondary">Vesting Schedules</h3>
            <p className="text-muted-foreground mb-4">
              LOCKED ROOM uses secure vesting contracts on Solana to create time-locked token releases. 
              When you lock tokens, they are held in a secure program until the unlock conditions are met.
            </p>
            <p className="text-muted-foreground">
              Your tokens remain on Solana but cannot be transferred until the vesting schedule completes. 
              This provides maximum security with the speed and low cost of Solana.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3 text-accent">Time-Based Locks</h3>
            <p className="text-muted-foreground mb-4">
              Set specific unlock dates for your tokens. Once locked, the tokens are removed from 
              your available balance until the lock period expires.
            </p>
            <p className="text-muted-foreground">
              Time-based locks are perfect for long-term holding strategies, team token vesting, 
              and demonstrating commitment to token holders.
            </p>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="bg-card rounded-xl p-6 shadow-xl comic-border">
        <h2 className="text-xl font-outfit font-bold mb-6">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Can I unlock my tokens early?</h3>
            <p className="text-sm text-muted-foreground">
              No, once tokens are locked in a vesting schedule, they cannot be unlocked until the specified time has passed. This is enforced by the Solana program.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">What happens if I lose access to my wallet?</h3>
            <p className="text-sm text-muted-foreground">
              Your tokens remain locked on Solana. You'll need to recover access to your wallet to claim them when the lock period ends.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Which tokens can I lock?</h3>
            <p className="text-sm text-muted-foreground">
              Currently, you can lock LOCKED tokens. Support for other SPL tokens may be added in the future.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Is there a minimum locking period?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, the minimum locking period is 1 day. There is no maximum limit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LockTokens;
