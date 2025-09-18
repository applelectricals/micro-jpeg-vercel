import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import UniversalUsageTracker from '@/lib/UniversalUsageTracker';

export interface UsageStats {
  userType: string;
  operations: {
    daily: { used: number; limit: number; remaining: number };
    hourly: { used: number; limit: number; remaining: number };
    monthly: { used: number; limit: number; remaining: number };
    allowed: boolean;
    dailyRemaining: number;
    monthlyRemaining: number;
  };
}

export function useUsageStats() {
  const queryKey = ['/api/universal-usage'];
  
  return useQuery<UsageStats>({
    queryKey,
    queryFn: async () => {
      // Get usage stats from UniversalUsageTracker
      const stats = UniversalUsageTracker.getUsageStats();
      const userType = stats.userType;
      
      // For authenticated users, fetch from server
      if (userType !== 'free') {
        try {
          const response = await fetch('/api/usage');
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error('Failed to fetch server usage:', error);
        }
      }
      
      // For free users, return local stats
      return {
        userType: stats.userType,
        operations: {
          daily: {
            used: stats.usage.raw.today + stats.usage.regular.today,
            limit: Math.max(stats.usage.raw.dailyLimit, stats.usage.regular.dailyLimit),
            remaining: Math.max(0, Math.max(stats.usage.raw.dailyLimit, stats.usage.regular.dailyLimit) - (stats.usage.raw.today + stats.usage.regular.today))
          },
          hourly: {
            used: 0, // TODO: Implement hourly tracking
            limit: stats.limits.hourly.total,
            remaining: stats.limits.hourly.total
          },
          monthly: {
            used: stats.usage.raw.month + stats.usage.regular.month,
            limit: Math.max(stats.usage.raw.monthlyLimit, stats.usage.regular.monthlyLimit),
            remaining: Math.max(0, Math.max(stats.usage.raw.monthlyLimit, stats.usage.regular.monthlyLimit) - (stats.usage.raw.month + stats.usage.regular.month))
          },
          allowed: (stats.usage.raw.today + stats.usage.regular.today) < Math.max(stats.usage.raw.dailyLimit, stats.usage.regular.dailyLimit),
          dailyRemaining: Math.max(0, Math.max(stats.usage.raw.dailyLimit, stats.usage.regular.dailyLimit) - (stats.usage.raw.today + stats.usage.regular.today)),
          monthlyRemaining: Math.max(0, Math.max(stats.usage.raw.monthlyLimit, stats.usage.regular.monthlyLimit) - (stats.usage.raw.month + stats.usage.regular.month))
        }
      };
    },
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always treat data as stale for immediate refetch
    gcTime: 0, // Don't cache results to force fresh data (React Query v5)
  });
}