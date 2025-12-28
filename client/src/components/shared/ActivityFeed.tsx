import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] overflow-auto">
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardList className="h-6 w-6 mx-auto mb-2 opacity-30" />
          <p>No activity to display</p>
          <p className="text-xs mt-1">Your recent transactions will appear here</p>
        </div>
      </CardContent>
    </Card>
  );
}
