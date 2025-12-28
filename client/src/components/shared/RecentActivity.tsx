import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { getFromApi } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock } from 'lucide-react';

// Define activity type
interface LockActivity {
  id: number;
  walletAddress: string;
  type: 'lock' | 'unlock';
  amount: number;
  timestamp: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<LockActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get initials for avatar
  const getInitials = (address: string) => {
    return address.slice(0, 2).toUpperCase();
  };
  
  // Get color based on activity type
  const getAvatarColor = (type: 'lock' | 'unlock') => {
    return type === 'lock' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-green-500 text-white';
  };

  // For future implementation - this will fetch real data from the API
  const fetchRealLockActivities = async () => {
    try {
      setIsLoading(true);
      const response = await getFromApi('/api/locks/recent');
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        throw new Error('Failed to fetch lock activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recent activities',
        variant: 'destructive'
      });
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] overflow-auto">
        {isLoading ? (
          // Loading state
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </>
        ) : (
          // Empty state - no demo data
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-6 w-6 mx-auto mb-2 opacity-30" />
            <p>No recent locking activity to display</p>
            <p className="text-xs mt-1">Activity will appear here when tokens are locked or unlocked</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 