import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Crown, Zap, ArrowRight } from "lucide-react";
import backgroundImg from "@assets/pexels-public-domain-pictures-40984_1754826447786.jpg";

export default function SubscriptionSuccess() {
  const [planType, setPlanType] = useState<'test-premium' | 'premium' | 'enterprise'>('test-premium');
  const [amount, setAmount] = useState<string>('1');

  useEffect(() => {
    // Get plan type and amount from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const planAmount = urlParams.get('amount');
    
    if (plan === 'test-premium' || plan === 'premium' || plan === 'enterprise') {
      setPlanType(plan);
    }
    if (planAmount) {
      setAmount(planAmount);
    }
  }, []);

  const planDetails = {
    'test-premium': {
      name: 'Test Premium',
      price: '$1.00',
      icon: Zap,
      color: 'blue',
      description: '24-hour premium trial with 50MB file limit and all premium features'
    },
    'premium': {
      name: 'Premium',
      price: '$29.00',
      icon: Crown,
      color: 'green',
      description: 'Monthly premium plan with 50MB file limit and advanced features'
    },
    'enterprise': {
      name: 'Enterprise',
      price: '$99.00',
      icon: Zap,
      color: 'purple',
      description: 'Monthly enterprise plan with 200MB file limit and priority support'
    }
  };

  const plan = planDetails[planType];
  const Icon = plan.icon;

  return (
    <div className="min-h-screen">
      {/* Background with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      >
        <div className="absolute inset-0 bg-white/50 dark:bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          
          {/* Header */}
          <div className="mb-12">
            
            <div className="mb-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Micro JPEG Premium!
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">
                Your subscription has been activated successfully
              </p>
            </div>
          </div>

          {/* Plan Details Card */}
          <Card className={`mb-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-${plan.color}-200 dark:border-${plan.color}-800 shadow-xl`}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 bg-${plan.color}-100 dark:bg-${plan.color}-900 rounded-full flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 text-${plan.color}-600 dark:text-${plan.color}-400`} />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name} Plan Activated
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className={`bg-${plan.color}-50 dark:bg-${plan.color}-950 rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold text-${plan.color}-600 dark:text-${plan.color}-400 mb-1`}>
                  {plan.price}
                </div>
                <div className={`text-sm text-${plan.color}-700 dark:text-${plan.color}-300`}>
                  {planType === 'test-premium' ? '24-hour trial' : 'monthly subscription'}
                </div>
              </div>

              {/* What's Next */}
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What's next?
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle className={`w-4 h-4 text-${plan.color}-600 flex-shrink-0`} />
                    <span>Start uploading images up to {planType === 'test-premium' ? '50MB for 24 hours' : 
                     planType === 'premium' ? '50MB' : '200MB'}</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle className={`w-4 h-4 text-${plan.color}-600 flex-shrink-0`} />
                    <span>Unlimited image compression</span>
                  </div>
                  {planType === 'enterprise' && (
                    <div className="flex items-center gap-3 justify-center">
                      <CheckCircle className={`w-4 h-4 text-${plan.color}-600 flex-shrink-0`} />
                      <span>Format conversion to WebP, PNG, JPEG</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 justify-center">
                    <CheckCircle className={`w-4 h-4 text-${plan.color}-600 flex-shrink-0`} />
                    <span>Priority processing and support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/'}
              className={`bg-${plan.color}-600 hover:bg-${plan.color}-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl group`}
            >
              Start Compressing Images
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-black/30"
              >
                View Dashboard
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Need Help Getting Started?
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We've sent a confirmation email with your subscription details. If you have any questions, our support team is here to help.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:support@microjpeg.com', '_blank')}
              className="bg-white/20 dark:bg-black/20 backdrop-blur-sm"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}