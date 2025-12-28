import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function LockedTokensTable() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">Your Locked Tokens</CardTitle>
        <CardDescription>
          Tokens you've locked on the XRP Ledger
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Info className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tokens locked yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            When you lock tokens, they will appear here. Head to the Lock Tokens page to get started.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
