import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TierInfo {
  currentTier: string;
  tierDisplayName: string;
  isPremium: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionEndDate?: string;
  tierLimits: {
    dailyCompressions: number;
    dailyConversions: number;
    maxFileSize: string;
    supportedFormats: string[];
  };
  availableTiers: string[];
}

export default function DevTierSwitcher() {
  const [switchingTier, setSwitchingTier] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if in development mode
  const isDev = import.meta.env.MODE === 'development';

  // Get current tier info
  const { data: tierInfo, isLoading, refetch } = useQuery<TierInfo>({
    queryKey: ['/api/dev/user-tier-info'],
    enabled: isDev,
  });

  // Switch tier mutation
  const switchTierMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest('POST', '/api/dev/set-user-tier', { tier });
      return response.json();
    },
    onMutate: (tier) => {
      setSwitchingTier(tier);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Tier Updated",
        description: `Successfully switched to ${variables.toUpperCase()} tier`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dev/user-tier-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/compression-limits'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch tier",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSwitchingTier(null);
    },
  });

  if (!isDev) {
    return null; // Don't show in production
  }

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Development Tier Switcher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading tier information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Development Tier Switcher</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">User not authenticated or tier info unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔧 Development Tier Switcher</span>
          <Badge variant="secondary">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Current Tier:</p>
            <Badge variant={tierInfo.isPremium ? "default" : "secondary"} className="mt-1">
              {tierInfo.tierDisplayName}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              Status: {tierInfo.subscriptionStatus} | Plan: {tierInfo.subscriptionPlan}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Current Limits:</p>
            <div className="text-sm space-y-1">
              <p>Daily Compressions: {tierInfo.tierLimits.dailyCompressions === -1 ? "Unlimited" : tierInfo.tierLimits.dailyCompressions}</p>
              <p>Daily Conversions: {tierInfo.tierLimits.dailyConversions === -1 ? "Unlimited" : tierInfo.tierLimits.dailyConversions}</p>
              <p>Max File Size: {tierInfo.tierLimits.maxFileSize}</p>
              <p>Formats: {tierInfo.tierLimits.supportedFormats ? tierInfo.tierLimits.supportedFormats.join(", ") : "Not specified"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Switch to Tier:</p>
            <div className="flex flex-wrap gap-2">
              {tierInfo.availableTiers.map((tier) => {
                const isCurrentTier = tier === tierInfo.currentTier;
                const isSwitching = switchingTier === tier;
                
                return (
                  <Button
                    key={tier}
                    variant={isCurrentTier ? "default" : "outline"}
                    size="sm"
                    disabled={isCurrentTier || isSwitching || switchTierMutation.isPending}
                    onClick={() => switchTierMutation.mutate(tier)}
                    data-testid={`button-switch-${tier}`}
                  >
                    {isSwitching ? "Switching..." : tier.charAt(0).toUpperCase() + tier.slice(1)}
                    {isCurrentTier && " (Current)"}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
            <strong>Master User Credentials:</strong><br />
            Email: master@microjpeg.com<br />
            Password: MasterTest123!<br />
            This component only appears in development mode for testing different subscription tiers.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}