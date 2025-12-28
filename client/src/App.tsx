import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SolanaWalletProvider, useSolanaWallet } from "./contexts/SolanaWalletContext";
import { SolanaWalletGenerator } from "./components/wallet/SolanaWalletGenerator";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import LockTokens from "./pages/lock-tokens";
import History from "./pages/history";
import Analytics from "./pages/analytics";
import Admin from "./pages/admin";
import LockBotPage from "./pages/lock-bot";
import Roadmap from "./pages/roadmap";
import NotFound from "./pages/not-found";
import PrivacyPolicy from "./pages/privacy";
import TermsOfService from "./pages/terms";
import DiceGamePage from "./pages/dice-game";
import VerifyPage from "./pages/verify";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <AppContent />
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}

// Main app content - shows wallet generator if not connected
function AppContent() {
  const { isConnected, hasSeenPrivateKey, isLoading } = useSolanaWallet();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Show wallet generator if not connected or hasn't saved key
  if (!isConnected || !hasSeenPrivateKey) {
    return <SolanaWalletGenerator />;
  }

  // Show main app
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-foreground overflow-x-hidden">
      <Header />
      <main className="flex-grow w-full mx-auto">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

// Separate component for routes
function AppRoutes() {
  const { isConnected, publicKey } = useSolanaWallet();
  
  // Debug output
  console.log("Wallet connected:", isConnected);
  console.log("Public key:", publicKey);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/lock-tokens" component={LockTokens} />
      <Route path="/history" component={History} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={Admin} />
      <Route path="/lock-bot" component={LockBotPage} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/dice-game" component={DiceGamePage} />
      <Route path="/verify" component={VerifyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
