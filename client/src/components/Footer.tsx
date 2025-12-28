import { Link } from "wouter";
import { Lock, Twitter, Github, MessageSquare, FileText, Shield, Gauge, Mail } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

const Footer = () => {
  const isMobile = useIsMobile();

  const FooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-outfit font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );

  const FooterLink = ({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) => {
    const linkClass = "text-muted-foreground hover:text-secondary transition-colors text-sm flex items-center gap-2 py-1";
    
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ) : (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  };

  return (
    <footer className="bg-[#121A2F] border-t border-[#293659]/50 py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          <div className="space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-8 w-8 bg-[#9945FF] rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-outfit font-bold text-foreground">
                <span className="text-[#9945FF]">LOCKED</span> <span className="text-[#14F195]">ROOM</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Secure token locking platform powered by Solana. Lock your assets with confidence using our industry-leading security protocols.
            </p>
            <div className="flex items-center space-x-4 pt-4">
              <a href="https://x.com/LockedRoom" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-secondary transition-colors p-2 rounded-full hover:bg-primary/10">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors p-2 rounded-full hover:bg-primary/10">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
          
          <FooterSection title="Platform">
            <ul className="space-y-2">
              <li><FooterLink href="/"><FileText className="h-4 w-4" /> How It Works</FooterLink></li>
              <li><FooterLink href="/lock-tokens"><Lock className="h-4 w-4" /> Features</FooterLink></li>
              <li><FooterLink href="/"><Shield className="h-4 w-4" /> Security</FooterLink></li>
              <li><FooterLink href="/"><Gauge className="h-4 w-4" /> Performance</FooterLink></li>
            </ul>
          </FooterSection>
          
          <FooterSection title="Resources">
            <ul className="space-y-2">
              <li><FooterLink href="#" external><FileText className="h-4 w-4" /> Documentation</FooterLink></li>
              <li><FooterLink href="#" external><Shield className="h-4 w-4" /> API</FooterLink></li>
              <li><FooterLink href="#" external><Gauge className="h-4 w-4" /> Status</FooterLink></li>
              <li><FooterLink href="#" external><FileText className="h-4 w-4" /> Blog</FooterLink></li>
            </ul>
          </FooterSection>
          
          <FooterSection title="Contact">
            <ul className="space-y-2">
              <li><FooterLink href="https://x.com/LockedRoom" external><Mail className="h-4 w-4" /> Support</FooterLink></li>
              <li><FooterLink href="https://x.com/LockedRoom" external><Twitter className="h-4 w-4" /> Twitter</FooterLink></li>
              <li><FooterLink href="#" external><Github className="h-4 w-4" /> GitHub</FooterLink></li>
            </ul>
          </FooterSection>
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
