import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<{ id: string; email: string } | null>({ on401: "returnNull" }),
    retry: false,
    refetchInterval: false, // Don't auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useSubscription() {
  const { data: subscriptionInfo, isLoading } = useQuery({
    queryKey: ["/api/subscription-info"],
    queryFn: getQueryFn<{ isPremium?: boolean; subscriptionStatus?: string } | null>({ on401: "returnNull" }),
    retry: false,
  });

  // Type assertion for subscription info
  const typedSubscriptionInfo = subscriptionInfo as { isPremium?: boolean; subscriptionStatus?: string } | null;

  return {
    subscriptionInfo,
    isLoading,
    isPremium: typedSubscriptionInfo?.isPremium || false,
    subscriptionStatus: typedSubscriptionInfo?.subscriptionStatus || 'inactive',
  };
}