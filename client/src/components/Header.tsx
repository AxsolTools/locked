import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Lock, Home, History, BarChart3, ShieldCheck, LayoutDashboard, Timer, Rocket, Dice1 } from "lucide-react";
import WalletStatus from "./wallet/WalletStatus";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useIsMobile } from "../hooks/use-mobile";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { publicKey, isConnected } = useSolanaWallet();
  const isMobile = useIsMobile();
  const isAuthenticated = isConnected;

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close menu when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('header')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href} 
        className={`${isActive ? 'text-secondary' : 'text-foreground hover:text-secondary'} transition-colors font-medium flex items-center gap-2 py-2`}>
        {icon}
        {children}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121A2F] py-3 px-4 md:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <Link href="/" className="text-xl md:text-2xl font-outfit font-bold text-foreground whitespace-nowrap">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">LOCKED</span>
          </Link>
          <Link 
            href="/dice-game" 
            className="hidden md:flex ml-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 transition-colors px-2 py-1 rounded-md items-center"
          >
            <span className="mr-1">🎲</span>
            <span>Dice Game</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink href="/roadmap" icon={<Rocket className="h-4 w-4" />}>Roadmap</NavLink>
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
          <NavLink href="/lock-tokens" icon={<Lock className="h-4 w-4" />}>Lock Tokens</NavLink>
          <NavLink href="/escrow" icon={<Timer className="h-4 w-4" />}>Escrow</NavLink>
          <NavLink href="/history" icon={<History className="h-4 w-4" />}>History</NavLink>
          <NavLink href="/analytics" icon={<BarChart3 className="h-4 w-4" />}>Analytics</NavLink>
          <NavLink href="/dice-game" icon={<Dice1 className="h-4 w-4" />}>Dice Game</NavLink>
          {isAuthenticated && publicKey === process.env.ADMIN_WALLET_ADDRESS && 
            <NavLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />}>Admin</NavLink>
          }
        </nav>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <WalletStatus />
          
          <button 
            className="md:hidden text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu - slide down with animation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 absolute left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border shadow-lg transform transition-all duration-200 ease-in-out animate-in slide-in-from-top">
          <div className="px-4 py-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-4">
              <NavLink href="/" icon={<Home className="h-4 w-4" />}>Home</NavLink>
              <NavLink href="/roadmap" icon={<Rocket className="h-4 w-4" />}>Roadmap</NavLink>
              <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
              <NavLink href="/lock-tokens" icon={<Lock className="h-4 w-4" />}>Lock Tokens</NavLink>
              <NavLink href="/escrow" icon={<Timer className="h-4 w-4" />}>Escrow</NavLink>
              <NavLink href="/history" icon={<History className="h-4 w-4" />}>History</NavLink>
              <NavLink href="/analytics" icon={<BarChart3 className="h-4 w-4" />}>Analytics</NavLink>
              <NavLink href="/dice-game" icon={<Dice1 className="h-4 w-4" />}>Dice Game</NavLink>
              {isAuthenticated && publicKey === process.env.ADMIN_WALLET_ADDRESS && 
                <NavLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />}>Admin</NavLink>
              }
              {!isAuthenticated && (
                <div className="py-4 text-muted-foreground text-sm">
                  Connect your wallet to access full functionality
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
