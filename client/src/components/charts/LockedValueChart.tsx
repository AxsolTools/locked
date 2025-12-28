import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export default function LockedValueChart() {
  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Locked Value History</CardTitle>
        <CardDescription>
          Historical data will appear here once you start locking tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No data to display yet</p>
          <p className="text-xs mt-1">Start locking tokens to see your history</p>
        </div>
      </CardContent>
    </Card>
  );
}
