import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Clock, Coins } from 'lucide-react';

interface UsageIndicatorProps {
  showDetailed?: boolean;
  className?: string;
  planId?: string;
}

export function UsageIndicator({ showDetailed = false, className = '', planId }: UsageIndicatorProps) {
  // Fetch usage stats from API with planId
  const { data: usageStats } = useQuery({
    queryKey: planId ? ["/api/usage-stats", planId] : ["/api/usage-stats"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Use operations-based data structure from server
  const operations = usageStats?.operations || {};
  const used = operations?.used || 0;
  const limit = operations?.limit || 500;
  const remaining = operations?.remaining || (limit - used);
  const percentage = Math.round((used / limit) * 100);

  if (!showDetailed) {
    // Compact view for header/toolbar
    return (
      <div className={`flex items-center gap-3 text-sm ${className}`} data-testid="usage-indicator-compact">
        <div className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span>{remaining}/{limit} operations</span>
        </div>
      </div>
    );
  }

  // Detailed view for dashboard/main areas
  return (
    <div className={`space-y-4 p-4 border rounded-lg bg-card ${className}`} data-testid="usage-indicator-detailed">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{operations?.planName || 'Free Plan'}</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Coins className="w-3 h-3" />
          {operations?.planName || 'Free'}
        </Badge>
      </div>

      {/* Credits Usage */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            Operations Used
          </span>
          <span>{used}/{limit}</span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2"
          data-testid="operations-progress"
        />
        <p className="text-xs text-muted-foreground">
          {remaining > 0 
            ? `${remaining} operations remaining this month`
            : "Monthly limit reached. Upgrade for more operations."
          }
        </p>
      </div>

      {/* Upgrade hint */}
      {remaining <= 10 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Running low on operations?
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Upgrade to Pro for 10,000 operations/month at $29!
          </p>
        </div>
      )}
    </div>
  );
}