import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet as WalletIcon } from 'lucide-react';
import RobotMascot from '@/components/RobotMascot';
import WalletConnect from './WalletConnect';

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
  showMascot?: boolean;
}

const ConnectWalletPrompt = ({
  title = "Connect Your Wallet",
  description = "You need to connect your Solana wallet to access this feature.",
  showMascot = true
}: ConnectWalletPromptProps) => {
  const { isConnected } = useSolanaWallet();

  // If already connected, don't show the prompt
  if (isConnected) {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto my-8 comic-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <WalletIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showMascot && (
          <div className="mb-6 flex justify-center">
            <RobotMascot 
              size="md" 
              withSpeechBubble 
              speechText="Connect your wallet to unlock all features!" 
            />
          </div>
        )}
        <div className="text-sm text-muted-foreground mb-4">
          <p>Connecting your wallet will allow you to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>View your locked tokens</li>
            <li>Lock new tokens</li>
            <li>Unlock tokens when time conditions are met</li>
            <li>Track your transactions</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <WalletConnect />
      </CardFooter>
    </Card>
  );
};

export default ConnectWalletPrompt;