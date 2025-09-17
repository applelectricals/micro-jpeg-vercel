import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Crown, Mail, Calendar, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UsageStats {
  operations: {
    used: number;
    limit: number;
    remaining: number;
    planId: string;
    planName: string;
    isAnonymous: boolean;
  };
}

interface EnhancedUsageIndicatorProps {
  onUpgradeClick?: () => void;
  onSignupClick?: () => void;
  compact?: boolean;
  planId?: string;
}

export function EnhancedUsageIndicator({ 
  onUpgradeClick, 
  onSignupClick, 
  compact = false,
  planId 
}: EnhancedUsageIndicatorProps) {
  const { isAuthenticated } = useAuth();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const { data: usageStats, isLoading } = useQuery<UsageStats>({
    queryKey: planId ? ["/api/usage-stats", planId] : ["/api/usage-stats"],
    retry: false,
    refetchInterval: 5000,
  });

  const operations = usageStats?.operations;
  const used = operations?.used || 0;
  const limit = operations?.limit || 500;
  const remaining = operations?.remaining || (limit - used);
  const percentage = (used / limit) * 100;
  const planName = operations?.planName || "Anonymous";
  const isAnonymous = operations?.isAnonymous ?? true;

  // Determine usage status and messaging
  const getUsageStatus = () => {
    if (used >= limit) {
      return {
        status: 'limit-reached',
        color: 'destructive',
        icon: AlertTriangle,
        title: '🔒 Monthly limit reached',
        message: `You've used all ${limit} free operations this month.`,
        urgency: 'high'
      };
    } else if (used >= limit * 0.9) { // 450+ operations (90%)
      return {
        status: 'approaching-limit',
        color: 'destructive',
        icon: AlertTriangle,
        title: `⚠️ You have ${remaining} operations left this month`,
        message: isAnonymous ? "Sign up free to get 500 more operations" : "Upgrade to Pro for unlimited processing",
        urgency: 'medium'
      };
    } else if (used >= limit * 0.5) { // 250+ operations (50%)
      return {
        status: 'continued-usage',
        color: 'secondary',
        icon: CheckCircle,
        title: `📊 ${used}/${limit} operations used`,
        message: `Loving the service? Pro plan = 10,000 operations`,
        urgency: 'low'
      };
    } else {
      return {
        status: 'initial-use',
        color: 'default',
        icon: CheckCircle,
        title: `Operation ${used}/${limit} this month - No signup needed!`,
        message: null,
        urgency: 'none'
      };
    }
  };

  const usageStatus = getUsageStatus();

  // Auto-show upgrade prompt when approaching limit
  useEffect(() => {
    if (usageStatus.urgency === 'medium' || usageStatus.urgency === 'high') {
      setShowUpgradePrompt(true);
    }
  }, [usageStatus.urgency]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // Compact version for header/inline use
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={usageStatus.color as any}>
          {used}/{limit}
        </Badge>
        {usageStatus.urgency !== 'none' && (
          <span className="text-gray-600">{usageStatus.message}</span>
        )}
      </div>
    );
  }

  // Full version with upgrade prompts
  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {usageStatus.title}
            </CardTitle>
            <Badge variant={usageStatus.color as any} className="ml-2">
              {planName}
            </Badge>
          </div>
          {usageStatus.message && (
            <CardDescription>
              {usageStatus.message}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{used} used</span>
              <span>{remaining} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompts based on Purchase Sequence */}
      {usageStatus.status === 'limit-reached' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">{usageStatus.title}</p>
              <p>{usageStatus.message}</p>
              
              <div className="flex flex-col gap-2 pt-2">
                {isAnonymous && (
                  <Button 
                    onClick={onSignupClick}
                    variant="outline"
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Create Free Account - Get 500 more operations
                  </Button>
                )}
                
                <Button 
                  onClick={onUpgradeClick}
                  className="justify-start"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro - $29 - 10,000 operations/month
                </Button>
                
                <Button 
                  variant="ghost"
                  className="justify-start text-gray-600"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Reset Next Month - Operations reset on [date]
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {usageStatus.status === 'approaching-limit' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">{usageStatus.title}</p>
              <p>{usageStatus.message}</p>
              
              <div className="flex gap-2 pt-2">
                {isAnonymous ? (
                  <Button 
                    onClick={onSignupClick}
                    variant="outline"
                    size="sm"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Sign up free
                  </Button>
                ) : null}
                
                <Button 
                  onClick={onUpgradeClick}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {usageStatus.status === 'continued-usage' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">{usageStatus.title}</p>
              <p className="text-xs text-blue-700">{usageStatus.message}</p>
            </div>
            <Button 
              onClick={onUpgradeClick}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Crown className="w-4 h-4 mr-1" />
              Pro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}