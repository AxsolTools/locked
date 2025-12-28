import { Clock, Shield, BarChart3 } from "lucide-react";

const FeatureHighlights = () => {
  return (
    <section className="py-8">
      <h2 className="text-2xl md:text-3xl font-outfit font-bold text-center mb-10">
        Supercharge Your <span className="text-primary">Solana</span> Assets
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-xl comic-border">
          <div className="h-12 w-12 mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-outfit font-bold mb-2">Custom Lock Periods</h3>
          <p className="text-muted-foreground">
            Lock your tokens for any time period from one day to multiple years. Complete flexibility for your investment strategy.
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-xl comic-border">
          <div className="h-12 w-12 mb-4 bg-secondary/20 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-secondary" />
          </div>
          <h3 className="text-xl font-outfit font-bold mb-2">Hook-Powered Security</h3>
          <p className="text-muted-foreground">
            Our platform uses Solana smart contracts for unbreakable security. Your assets are protected by the same technology that powers Solana.
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-xl comic-border">
          <div className="h-12 w-12 mb-4 bg-accent/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-xl font-outfit font-bold mb-2">Advanced Analytics</h3>
          <p className="text-muted-foreground">
            Track the performance of your locked tokens with real-time data visualization and comprehensive analytics dashboard.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
