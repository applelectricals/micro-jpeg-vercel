import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Crown, Shield, Zap, Mail, Calendar, CreditCard, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PurchaseFlowProps {
  source?: 'limit-reached' | 'approaching-limit' | 'continued-usage' | 'manual';
  onClose?: () => void;
}

interface PlanFeature {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export default function PurchaseFlow({ source = 'manual', onClose }: PurchaseFlowProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'plans' | 'account' | 'payment' | 'processing' | 'success'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'test-premium' | 'premium' | 'enterprise'>('premium');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [isCreatingAccount, setIsCreatingAccount] = useState(!isAuthenticated);
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  
  const [billingForm, setBillingForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    agreeToTerms: false
  });

  // Usage stats for context
  const { data: usageStats } = useQuery({
    queryKey: ["/api/usage-stats"],
    retry: false,
  });

  const plans: PlanFeature[] = [
    { feature: "Monthly Operations", free: "500", premium: "10,000", enterprise: "50,000" },
    { feature: "File Size Limit", free: "10MB", premium: "50MB", enterprise: "200MB" },
    { feature: "API Access", free: true, premium: true, enterprise: true },
    { feature: "Priority Processing", free: false, premium: true, enterprise: true },
    { feature: "Email Support", free: false, premium: true, enterprise: true },
    { feature: "Usage Analytics", free: false, premium: true, enterprise: true },
    { feature: "SLA Guarantee", free: false, premium: false, enterprise: true },
    { feature: "Custom Integrations", free: false, premium: false, enterprise: true },
    { feature: "Overage Billing", free: false, premium: "$0.005/operation", enterprise: "$0.005/operation" },
    { feature: "Concurrent Uploads", free: "1", premium: "3", enterprise: "5" },
  ];

  const planPricing = {
    free: { price: 0, period: 'forever', description: 'Perfect for getting started' },
    'test-premium': { price: 1, period: '24-hour access', description: 'Try Premium features for 24 hours' },
    premium: { price: 29, period: 'month', description: 'Best for professionals' },
    enterprise: { price: 99, period: 'month', description: 'For high-volume users and large teams' }
  };

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof accountForm) => {
      return apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setStep('payment');
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Account creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Payment processing mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = paymentMethod === 'razorpay' ? '/api/payment/razorpay/verify' : '/api/payment/paypal/process';
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          plan: selectedPlan,
          ...data
        })
      });
    },
    onSuccess: () => {
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ["/api/usage-stats"] });
      toast({
        title: "Payment successful!",
        description: `Welcome to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
      setStep('payment');
    }
  });

  const handlePlanSelect = (plan: 'free' | 'test-premium' | 'premium' | 'enterprise') => {
    setSelectedPlan(plan);
    
    if (plan === 'free') {
      if (!isAuthenticated) {
        setStep('account');
      } else {
        // Free account upgrade - just redirect to dashboard
        window.location.href = '/dashboard';
      }
    } else {
      // For paid plans, authenticated users go directly to payment
      if (isAuthenticated) {
        setStep('payment');
      } else {
        setStep('account');
        setIsCreatingAccount(true);
      }
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlan === 'free') {
      createAccountMutation.mutate(accountForm);
    } else {
      // For paid plans, create account first, then proceed to payment
      createAccountMutation.mutate(accountForm);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!billingForm.name || !billingForm.address || !billingForm.city || !billingForm.zipCode || !billingForm.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all billing details.",
        variant: "destructive",
      });
      return;
    }
    
    if (!billingForm.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }
    
    setStep('processing');
    
    if (paymentMethod === 'razorpay') {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => handleRazorpayPayment();
        script.onerror = () => {
          toast({
            title: "Payment Error",
            description: "Failed to load payment system. Please try again.",
            variant: "destructive",
          });
          setStep('payment');
        };
        document.body.appendChild(script);
      } else {
        handleRazorpayPayment();
      }
    } else {
      // PayPal processing - simplified for testing
      toast({
        title: "Processing Payment",
        description: "PayPal integration coming soon. Using demo flow.",
      });
      
      setTimeout(() => {
        processPaymentMutation.mutate({
          plan: selectedPlan,
          paypal_payment_id: `paypal_${Date.now()}`,
          billing: billingForm
        });
      }, 2000);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const orderResponse = await apiRequest('/api/payment/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          plan: selectedPlan,
          amount: planPricing[selectedPlan].price * 100
        })
      });

      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        order_id: orderResponse.order_id,
        name: 'MicroJPEG',
        description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan Subscription`,
        handler: (response: any) => {
          processPaymentMutation.mutate({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan: selectedPlan,
            billing: billingForm
          });
        },
        modal: {
          ondismiss: () => {
            setStep('payment');
            toast({
              title: "Payment Cancelled",
              description: "You can try again when ready.",
            });
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || billingForm.name,
          email: user?.email || '',
        },
        theme: {
          color: '#2563eb'
        }
      };
      
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Failed to create Razorpay order:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setStep('payment');
    }
  };

  const renderUsageContext = () => {
    const used = usageStats?.operations?.used || 0;
    const limit = usageStats?.operations?.limit || 500;
    
    if (source === 'limit-reached') {
      return (
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>🔒 Monthly limit reached</strong><br />
            You've used all {limit} free operations this month. Choose a plan to continue processing images.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (source === 'approaching-limit') {
      const remaining = limit - used;
      return (
        <Alert className="mb-6">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ You have {remaining} operations left this month</strong><br />
            Upgrade now to avoid interruptions in your workflow.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderPlansStep = () => (
    <div className="max-w-4xl mx-auto p-6">
      {renderUsageContext()}
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-gray-600">Unlock the full potential of image compression</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {/* Free Plan */}
        <Card className={`cursor-pointer transition-all ${selectedPlan === 'free' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan('free')}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for trying out our service</CardDescription>
              </div>
              {selectedPlan === 'free' && <Badge>Selected</Badge>}
            </div>
            <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-gray-500">/month</span></div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-4" 
              variant={selectedPlan === 'free' ? 'default' : 'outline'}
              onClick={() => handlePlanSelect('free')}
            >
              {!isAuthenticated ? 'Get Started Free' : 'Current Plan'}
            </Button>
            <ul className="text-sm space-y-2">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />500 operations/month</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />10MB file limit</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />API access</li>
            </ul>
          </CardContent>
        </Card>

        {/* Test Premium Plan */}
        <Card className={`cursor-pointer transition-all relative ${selectedPlan === 'test-premium' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan('test-premium')}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-green-500">Hot</Badge>
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  Test Premium <Zap className="w-4 h-4 ml-2 text-yellow-500" />
                </CardTitle>
                <CardDescription>Try Premium features for 24 hours</CardDescription>
              </div>
              {selectedPlan === 'test-premium' && <Badge>Selected</Badge>}
            </div>
            <div className="text-3xl font-bold">$1<span className="text-sm font-normal text-gray-500">/24hrs</span></div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-4" 
              variant={selectedPlan === 'test-premium' ? 'default' : 'outline'}
              onClick={() => handlePlanSelect('test-premium')}
            >
              🚀 Try for $1
            </Button>
            <ul className="text-sm space-y-2">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />300 operations</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />50MB file limit</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />24-hour access</li>
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={`cursor-pointer transition-all relative ${selectedPlan === 'premium' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan('premium')}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500">Popular</Badge>
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  Premium <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                </CardTitle>
                <CardDescription>Best for professionals</CardDescription>
              </div>
              {selectedPlan === 'premium' && <Badge>Selected</Badge>}
            </div>
            <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-4" 
              variant={selectedPlan === 'premium' ? 'default' : 'outline'}
              onClick={() => handlePlanSelect('premium')}
            >
              Start Premium Plan
            </Button>
            <ul className="text-sm space-y-2">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />10,000 operations/month</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />50MB file limit</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Email support</li>
            </ul>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className={`cursor-pointer transition-all ${selectedPlan === 'enterprise' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan('enterprise')}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  Enterprise <Building className="w-4 h-4 ml-2" />
                </CardTitle>
                <CardDescription>For high-volume users and large teams</CardDescription>
              </div>
              {selectedPlan === 'enterprise' && <Badge>Selected</Badge>}
            </div>
            <div className="text-3xl font-bold">$99<span className="text-sm font-normal text-gray-500">/month</span></div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-4" 
              variant={selectedPlan === 'enterprise' ? 'default' : 'outline'}
              onClick={() => handlePlanSelect('enterprise')}
            >
              Subscribe
            </Button>
            <ul className="text-sm space-y-2">
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />50,000 operations/month</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />200MB file limit</li>
              <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />SLA guarantee</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Feature comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Features</th>
                  <th className="text-center py-2">Free</th>
                  <th className="text-center py-2">Pro</th>
                  <th className="text-center py-2">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{plan.feature}</td>
                    <td className="text-center py-2">
                      {typeof plan.free === 'boolean' ? 
                        (plan.free ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : '—') : 
                        plan.free
                      }
                    </td>
                    <td className="text-center py-2">
                      {typeof plan.pro === 'boolean' ? 
                        (plan.pro ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : '—') : 
                        plan.pro
                      }
                    </td>
                    <td className="text-center py-2">
                      {typeof plan.enterprise === 'boolean' ? 
                        (plan.enterprise ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : '—') : 
                        plan.enterprise
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountStep = () => (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedPlan === 'free' ? 'Create Your Free Account' : 'Complete Your Order'}
        </h2>
        <p className="text-gray-600">
          {selectedPlan === 'free' 
            ? 'Get 500 operations per month, completely free' 
            : `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan - $${planPricing[selectedPlan].price}/${planPricing[selectedPlan].period}`
          }
        </p>
      </div>

      <form onSubmit={handleAccountSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={accountForm.firstName}
              onChange={(e) => setAccountForm(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={accountForm.lastName}
              onChange={(e) => setAccountForm(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={accountForm.email}
            onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={accountForm.password}
            onChange={(e) => setAccountForm(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        {selectedPlan !== 'free' && (
          <div>
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input
              id="companyName"
              value={accountForm.companyName}
              onChange={(e) => setAccountForm(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createAccountMutation.isPending}
        >
          {createAccountMutation.isPending ? 'Creating Account...' : 
           selectedPlan === 'free' ? 'Create Free Account' : 'Continue to Payment'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep('plans')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to plans
          </button>
        </div>
      </form>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method</h2>
        <p className="text-gray-600">
          {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan - ${planPricing[selectedPlan].price}/{planPricing[selectedPlan].period}
        </p>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-base font-semibold">Payment Method</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              type="button"
              variant={paymentMethod === 'razorpay' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('razorpay')}
              className="justify-start"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Credit/Debit Card
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('paypal')}
              className="justify-start"
            >
              PayPal
            </Button>
          </div>
        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Billing Address</Label>
          
          <div>
            <Label htmlFor="billingName">Full Name</Label>
            <Input
              id="billingName"
              value={billingForm.name}
              onChange={(e) => setBillingForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={billingForm.address}
              onChange={(e) => setBillingForm(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={billingForm.city}
                onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={billingForm.zipCode}
                onChange={(e) => setBillingForm(prev => ({ ...prev, zipCode: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={billingForm.country}
              onChange={(e) => setBillingForm(prev => ({ ...prev, country: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={billingForm.agreeToTerms}
            onCheckedChange={(checked) => setBillingForm(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the{' '}
            <a href="/terms-of-service" target="_blank" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal:</span>
            <span>${planPricing[selectedPlan].price}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${planPricing[selectedPlan].price}/{planPricing[selectedPlan].period}</span>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={!billingForm.agreeToTerms || processPaymentMutation.isPending}
        >
          Complete Purchase
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep('account')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to account details
          </button>
        </div>
      </form>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
        <p className="text-gray-600">Please wait while we process your payment...</p>
      </div>
      <Progress value={66} className="w-full" />
    </div>
  );

  const renderSuccessStep = () => (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}!</h2>
        <p className="text-gray-600">Your payment was successful and your account has been upgraded.</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">🎉 You now have access to:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• {planPricing[selectedPlan].price === 0 ? '500' : selectedPlan === 'pro' ? '10,000' : 'Unlimited'} operations per month</li>
          <li>• {selectedPlan === 'free' ? '10MB' : selectedPlan === 'pro' ? '50MB' : '500MB'} file size limit</li>
          {selectedPlan !== 'free' && <li>• API access with your personal key</li>}
          {selectedPlan !== 'free' && <li>• Priority processing queue</li>}
          {selectedPlan === 'enterprise' && <li>• Dedicated account manager</li>}
        </ul>
      </div>

      <div className="space-y-3">
        <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
          Start Compressing Images
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'plans' && renderPlansStep()}
      {step === 'account' && renderAccountStep()}
      {step === 'payment' && renderPaymentStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
}