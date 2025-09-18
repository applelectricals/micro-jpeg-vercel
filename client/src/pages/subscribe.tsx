import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Building2, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import OptimizedPayPalButton from '@/components/OptimizedPayPalButton';
import { applySEOConfig } from '@/utils/seoOptimizer';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface PlanDetails {
  id: string;
  name: string;
  price: string;
  operations: string;
  features: string[];
  icon: any;
}

const plans: Record<string, PlanDetails> = {
  'test-premium': {
    id: 'test-premium',
    name: 'Test Premium',
    price: '$1',
    operations: '300 operations (24-hour access)',
    features: [
      '50MB max file size',
      'All Premium features',
      'Advanced quality controls',
      'No ads',
      'Priority support',
      '3 concurrent uploads',
      'Perfect for testing Premium'
    ],
    icon: Zap
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: '$29',
    operations: '10,000 operations/month',
    features: [
      '50MB max file size',
      'Email support',
      'Higher processing priority',
      '100 operations/hour',
      '3 concurrent uploads',
      'Overage: $0.005/operation'
    ],
    icon: Zap
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: '$99',
    operations: '50,000 operations/month',
    features: [
      '200MB max file size',
      'Priority support',
      'SLA guarantee',
      'No rate limits',
      '5 concurrent uploads',
      'Custom integrations'
    ],
    icon: Building2
  }
};

export default function Subscribe() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [loading, setLoading] = useState(false);

  // Apply SEO optimization and performance monitoring
  useEffect(() => {
    applySEOConfig('subscribe');
    performanceMonitor.reportPageLoad('subscribe');
  }, []);
  const [error, setError] = useState<string | null>(null);
  
  // Account creation fields for new users
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  useEffect(() => {
    // Get plan from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    if (planParam && plans[planParam]) {
      setSelectedPlan(planParam);
    }
    
    // Pre-fill email if user is authenticated
    if (user && typeof user === 'object' && 'email' in user && typeof user.email === 'string') {
      setEmail(user.email);
    }
  }, [user]);
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // For test-premium, allow guest checkout (skip validation)
      // For other plans, validate account creation fields if not authenticated
      if (!isAuthenticated && selectedPlan !== 'test-premium') {
        if (!email || !password || !confirmPassword) {
          throw new Error('Please fill in all required fields');
        }
        
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
      }
      
      // Create subscription using payment provider
      const response = await apiRequest('POST', '/api/create-subscription', {
        planId: selectedPlan,
        // Account creation data for new users (except test-premium)
        ...((!isAuthenticated && selectedPlan !== 'test-premium') && {
          email,
          password,
          companyName
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create subscription');
      }
      
      // Redirect to payment checkout (Stripe, PayPal, or Razorpay)
      if (data.checkoutUrl) {
        if (data.paymentProvider === 'razorpay') {
          // Navigate to Razorpay checkout page
          setLocation(data.checkoutUrl);
        } else {
          // External redirect for Stripe or PayPal
          window.location.href = data.checkoutUrl;
        }
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };
  
  const plan = plans[selectedPlan];
  if (!plan) {
    setLocation('/simple-pricing');
    return null;
  }
  
  const Icon = plan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscribe to {plan.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete your order to get started with {plan.operations}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="space-y-8">
          {/* Plan Summary */}
          <Card className="border-2 border-[#AD0000]">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-[#AD0000] to-red-600 rounded-full flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-[#AD0000]">
                {plan.price}<span className="text-lg text-gray-600">{plan.id === 'test-premium' ? '/24 hours' : '/month'}</span>
              </div>
              <CardDescription>{plan.operations}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold">Included features:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Details (only show if not authenticated AND not test-premium) */}
          {!isAuthenticated && selectedPlan !== 'test-premium' && (
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  We'll create your account and set up your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    data-testid="input-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name (Optional)</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                    data-testid="input-company"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                {selectedPlan === 'premium' 
                  ? 'Choose your preferred payment method'
                  : 'You\'ll be redirected to Stripe to securely enter your payment details'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span>{plan.name}</span>
                  <span className="font-semibold">{plan.price}/month</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Billed monthly • Cancel anytime • 30-day money back guarantee
                </div>
              </div>

              {/* PayPal Button for All PayPal Plans */}
              {(selectedPlan === 'premium' || selectedPlan === 'test-premium' || selectedPlan === 'enterprise') && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Pay securely with PayPal - {plan.price}{selectedPlan === 'test-premium' ? ' (24-hour access)' : '/month'}
                    </p>
                    <OptimizedPayPalButton 
                      amount={selectedPlan === 'test-premium' ? '1.00' : (selectedPlan === 'enterprise' ? '99.00' : '29.00')}
                      currency="USD"
                      intent="CAPTURE"
                      className="w-full py-3 text-lg"
                    >
                      Complete Payment
                    </OptimizedPayPalButton>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button - Only show for non-PayPal plans */}
          {selectedPlan !== 'premium' && selectedPlan !== 'test-premium' && selectedPlan !== 'enterprise' && (
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#AD0000] hover:bg-red-700 text-white py-3 text-lg"
              data-testid="button-continue-payment"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating subscription...
                </>
              ) : (
                `Continue to Payment - ${plan.price}/month`
              )}
            </Button>
          )}

          {/* Plan change option */}
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setLocation('/simple-pricing')}
              className="text-gray-600 dark:text-gray-400"
            >
              ← Change plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}