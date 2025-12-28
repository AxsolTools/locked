import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Clock, Unlock, DollarSign } from "lucide-react";

export default function StatsBar() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">TOKENS LOCKED</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ACTIVE LOCKERS</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">AVG LOCK TIME</p>
              <p className="text-2xl font-bold">-- <span className="text-sm font-medium text-muted-foreground">days</span></p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">TOKENS RELEASED</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Unlock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
