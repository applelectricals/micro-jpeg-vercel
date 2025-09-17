import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Coins } from "lucide-react";

interface UpgradePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsUsed: number;
  onUpgrade: (planId: string) => void;
}

export function UpgradePromptDialog({ 
  open, 
  onOpenChange, 
  creditsUsed,
  onUpgrade 
}: UpgradePromptDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'payperuse',
      name: 'Pay Per Use',
      description: 'Only pay for what you compress',
      price: '$0.025',
      period: 'per credit',
      credits: null,
      features: [
        'Pay only for actual usage',
        'No monthly commitment',
        'Up to 25MB per file',
        'Advanced quality controls',
        'All output formats',
        'No ads',
      ],
      popular: false,
      buttonText: 'Start Pay-Per-Use',
      highlight: 'Perfect for occasional use',
    },
    {
      id: 'starter',
      name: 'Starter Pack',
      description: 'Best value for regular users',
      price: '$9.99',
      period: 'one-time',
      credits: 500,
      additionalCreditPrice: '$0.018',
      features: [
        '500 credits included',
        'Additional credits: $0.018 each',
        'Up to 25MB per file',
        'Advanced quality controls',
        'All output formats',
        'Batch ZIP downloads',
        'Email support',
      ],
      popular: true,
      buttonText: 'Get Starter Pack',
      highlight: 'Most popular choice',
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      description: 'For professional workflows',
      price: '$49.99',
      period: 'one-time',
      credits: 3000,
      additionalCreditPrice: '$0.016',
      features: [
        '3,000 credits included',
        'Additional credits: $0.016 each',
        'Up to 50MB per file',
        'Advanced quality controls',
        'All output formats',
        'Batch processing',
        'Priority support',
      ],
      popular: false,
      buttonText: 'Get Pro Pack',
      highlight: 'Best for professionals',
    },
  ];

  const handleUpgrade = (planId: string) => {
    onUpgrade(planId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="w-6 h-6 text-yellow-500" />
            Free Credits Exhausted
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            You've used {creditsUsed} credits and reached your free limit. Choose a plan to continue processing images with enhanced features and better pricing.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.popular ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
              data-testid={`plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-white font-semibold px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {plan.highlight}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {plan.id === 'payperuse' && (
                    <Zap className="w-5 h-5 text-blue-500" />
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {plan.period}
                    </span>
                  </div>
                  {plan.credits && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {plan.credits} credits included
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade(plan.id);
                  }}
                  data-testid={`upgrade-${plan.id}`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              How Credits Work
            </h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Credits = File Size (MB) × Operations. For example: 1 file × 5MB × 2 operations (compress + convert) = 10 credits.
            Smaller files let you process more images with the same credits!
          </p>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="upgrade-dialog-close"
          >
            Maybe Later
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure payment powered by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}