import React from 'react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const AdminControls: React.FC = () => {
  const handleResetRegistrations = async () => {
    if (window.confirm("Are you sure you want to reset ALL wallet registrations? Users will need to reconnect.")) {
      try {
        const response = await axios.post('/api/dice/admin/reset-registrations');
        if (response.data.success) {
          toast({
            title: "Registrations Reset",
            description: response.data.message,
          });
        }
      } catch (error) {
        console.error("Error resetting registrations:", error);
        toast({
          title: "Error",
          description: "Failed to reset wallet registrations",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Controls</h2>
      
      {/* Wallet Registration Management */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Registration Management</CardTitle>
          <CardDescription>
            Control user wallet registrations for automatic payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Reset all wallet registrations to force users to reconnect their wallets and re-register with seeds.
                This is useful if users have been able to bypass seed registration.
              </p>
              <Button
                variant="destructive"
                onClick={handleResetRegistrations}
              >
                Reset All Wallet Registrations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls; 
