import { Link } from "wouter";
import { Lock, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#121A2F] border-t border-[#293659]/50 py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[#9945FF] rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-outfit font-bold text-foreground">
              <span className="text-[#9945FF]">LOCKED</span> <span className="text-[#14F195]">ROOM</span>
            </h1>
          </div>
          
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-md">
            Secure token locking platform powered by Solana. Lock your assets with confidence using our industry-leading security protocols.
          </p>
          
          <div className="flex items-center space-x-6">
            <a 
              href="https://x.com/LockedRoom" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-secondary transition-colors p-2 rounded-full hover:bg-primary/10 flex items-center gap-2"
            >
              <Twitter className="h-5 w-5" />
              <span className="text-sm">Twitter</span>
            </a>
            <a 
              href="https://x.com/LockedRoom" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-secondary transition-colors p-2 rounded-full hover:bg-primary/10 flex items-center gap-2"
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm">Support</span>
            </a>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-muted flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs sm:text-sm text-center md:text-left">
            © 2025 LOCKED ROOM. All rights reserved. Solana is a trademark of Solana Foundation.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-muted-foreground hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-secondary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
