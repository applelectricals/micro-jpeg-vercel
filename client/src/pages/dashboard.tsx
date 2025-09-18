import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  X,
  Settings,
  Download,
  BarChart3,
  Zap
} from "lucide-react";

interface SubscriptionInfo {
  isPremium: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface UsageStats {
  compressions: number;
  limit: number;
  isPremium: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Fetch subscription information
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription-info"],
    retry: false,
  });

  // Fetch usage statistics
  const { data: usageStats, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ["/api/compression-limits"],
    retry: false,
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cancel-subscription");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-info"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubscription = () => {
    setCancellingSubscription(true);
    cancelSubscriptionMutation.mutate();
    setCancellingSubscription(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Past Due</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Subscription Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your subscription and view usage statistics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {subscriptionInfo?.isPremium ? (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                Premium
              </Badge>
            ) : (
              <Badge variant="secondary">Free Plan</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Plan Type</span>
                    {subscriptionInfo?.isPremium ? (
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">Premium</span>
                      </div>
                    ) : (
                      <span className="font-semibold">Free</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Status</span>
                    {getStatusBadge(subscriptionInfo?.subscriptionStatus)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Monthly Cost</span>
                    <span className="font-semibold">
                      {subscriptionInfo?.isPremium ? "$9.99" : "$0.00"}
                    </span>
                  </div>
                </div>
                <div>
                  {subscriptionInfo?.isPremium && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">Next Billing Date</span>
                        <span>{formatDate(subscriptionInfo.currentPeriodEnd)}</span>
                      </div>
                      {subscriptionInfo.cancelAtPeriodEnd && (
                        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            Your subscription will end on {formatDate(subscriptionInfo.currentPeriodEnd)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {usageStats?.compressions || 0}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Compressions
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {usageStats?.isPremium ? "No limit" : "10MB"}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    File Size Limit
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {usageStats?.isPremium ? "Premium" : "Free"}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan Type
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {usageStats?.isPremium 
                      ? "Premium: Unlimited compressions with no file size restrictions" 
                      : "Free: Unlimited compressions with 10MB file size limit"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Plan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Free Plan Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    Free Plan
                    <Badge variant="secondary">$0/month</Badge>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">5 compressions per day</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Basic quality settings</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">JPEG output format</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Batch processing</span>
                    </div>
                  </div>
                </div>

                {/* Premium Plan Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Premium Plan
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      $9.99/month
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Unlimited compressions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Advanced quality controls</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Multiple output formats</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Batch processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manage Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {!subscriptionInfo?.isPremium ? (
                  <Button 
                    onClick={() => setLocation("/subscribe")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                ) : (
                  <>
                    {!subscriptionInfo.cancelAtPeriodEnd && (
                      <Button 
                        onClick={handleCancelSubscription}
                        variant="outline"
                        disabled={cancellingSubscription}
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {cancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    )}
                    <Button 
                      onClick={() => setLocation("/")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Start Compressing
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}