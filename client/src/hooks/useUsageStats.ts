import { useQuery } from "@tanstack/react-query";
import { getCurrentPageIdentifier } from "@/lib/pageIdentifier";

export interface UsageStats {
  pageIdentifier: string;
  operations: {
    daily: { used: number; limit: number };
    hourly: { used: number; limit: number };
    monthly: { used: number; limit: number };
  };
}

/**
 * Canonical hook for usage stats - single source of truth
 * Uses consistent query key: ['/api/usage-stats', pageId]
 */
export function useUsageStats(pageIdentifier?: string) {
  const currentPageId = pageIdentifier || getCurrentPageIdentifier();
  
  console.log('🔧 useUsageStats Debug:', {
    pageIdentifier: currentPageId,
    queryKey: ['/api/usage-stats', currentPageId]
  });
  
  return useQuery<UsageStats>({
    queryKey: ['/api/usage-stats', currentPageId],
    enabled: true,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 0, // Allow immediate refetch
  });
}