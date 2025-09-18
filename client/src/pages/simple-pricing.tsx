import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, Users, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Header from '@/components/header';
import logoUrl from '@assets/mascot-logo-optimized.png';
import { logPerformanceMetrics, preloadImage } from '@/lib/performance';

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out our service',
    operations: '500 operations/month',
    fileSize: '10MB max file size',
    features: [
      'Web interface access',
      'API access',
      'All image formats',
      'WordPress plugin',
      'Community support'
    ],
    limits: [
      '25 operations/day max',
      '5 operations/hour max',
      '1 concurrent upload',
      '30s processing timeout'
    ],
    icon: Users,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    id: 'test-premium',
    name: 'Test Premium',
    price: '$1',
    description: 'Try Premium features for 24 hours',
    operations: '300 operations (24-hour access)',
    fileSize: '50MB max file size',
    features: [
      'All Premium features',
      'Advanced quality controls',
      'No ads',
      'Priority support',
      'API access',
      '3 concurrent uploads',
      'All formats including RAW'
    ],
    limits: [
      '24-hour access only',
      'Perfect for testing Premium'
    ],
    icon: Zap,
    buttonText: '🚀 Try for $1',
    buttonVariant: 'default' as const,
    popular: true,
    badge: 'Hot'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29',
    description: 'Best for professionals',
    operations: '10,000 operations/month',
    fileSize: '50MB max file size',
    features: [
      'Everything in Free',
      'Email support',
      'Higher processing priority',
      'Usage analytics',
      'API key management',
      '100 operations/hour',
      '3 concurrent uploads'
    ],
    limits: [
      'Overage: $0.005/operation',
      '60s processing timeout'
    ],
    icon: Crown,
    buttonText: 'Start Premium Plan',
    buttonVariant: 'default' as const,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    description: 'For high-volume users and large teams',
    operations: '50,000 operations/month',
    fileSize: '200MB max file size',
    features: [
      'Everything in Premium',
      'Priority support',
      'SLA guarantee',
      'Custom integrations',
      'No rate limits',
      '5 concurrent uploads',
      'Dedicated account manager'
    ],
    limits: [
      'Overage: $0.005/operation',
      '120s processing timeout'
    ],
    icon: Building2,
    buttonText: 'Subscribe',
    buttonVariant: 'outline' as const,
    popular: false,
    badge: 'Corporate'
  }
];

export default function SimplePricing() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Performance optimization
  useEffect(() => {
    logPerformanceMetrics();
    preloadImage(logoUrl);
    setIsLoaded(true);
  }, []);
  
  // Optimize initial render
  useEffect(() => {
    // Set page as loaded after initial render to prevent layout shifts
    setIsLoaded(true);
  }, []);
  
  const handlePlanSelect = (tierId: string) => {
    if (tierId === 'free') {
      if (!isAuthenticated) {
        setLocation('/signup');
      } else {
        setLocation('/compress-free');
      }
    } else if (tierId === 'test-premium') {
      setLocation('/subscribe?plan=test-premium');
    } else if (tierId === 'premium') {
      setLocation('/subscribe?plan=premium');
    } else if (tierId === 'enterprise') {
      setLocation('/subscribe?plan=enterprise');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 overflow-x-hidden">
      <Header />
      <div className="container mx-auto px-4 py-16 pt-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include both web interface and API access.
          </p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              ✅ No hidden fees ✅ Cancel anytime ✅ 30-day money back guarantee
            </Badge>
          </div>
        </div>

        {/* Pricing Cards - Premium Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 items-stretch">
          {tiers.filter(tier => tier.id !== 'free').map((tier) => {
            const Icon = tier.icon;
            return (
              <Card 
                key={tier.id} 
                className={`relative overflow-hidden transition-all duration-300 h-full flex flex-col ${tier.id === 'enterprise' ? 'shadow-2xl border border-gray-300 scale-105' : 'hover:scale-105 hover:shadow-2xl'} ${tier.popular ? 'border-2 border-blue-300 shadow-xl scale-105' : tier.id !== 'enterprise' ? 'border border-gray-200 dark:border-gray-700 hover:border-gray-300' : ''} ${tier.id === 'test-premium' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100' : tier.id === 'premium' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100' : tier.id === 'enterprise' ? 'bg-gradient-to-br from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200' : 'bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100'}`}
              >
                {/* Top Banner */}
                <div className={`absolute top-0 left-0 right-0 h-12 z-10 transition-all duration-300 ${tier.id === 'test-premium' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : tier.id === 'premium' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}></div>
                {/* Hover highlight bar */}
                <div className={`absolute top-12 left-0 right-0 h-3 opacity-0 hover:opacity-50 transition-opacity duration-300 z-10 ${tier.id === 'test-premium' ? 'bg-gradient-to-r from-emerald-300 to-teal-400' : tier.id === 'premium' ? 'bg-gradient-to-r from-blue-300 to-indigo-400' : 'bg-gradient-to-r from-orange-300 to-red-400'}`}></div>
                {/* Badge area - centered in banner */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 h-6 z-20 flex items-center justify-center">
                  {(tier.popular || tier.badge) && (
                    <Badge className={`${tier.id === 'test-premium' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : tier.id === 'premium' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-orange-500 to-red-600'} text-white px-4 py-1 shadow-lg text-sm font-semibold`}>
                      {tier.badge || 'Popular'}
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="text-center pb-4 pt-16">
                  <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:w-14 hover:h-14 hover:shadow-xl ${tier.id === 'test-premium' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600' : tier.id === 'premium' ? 'bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600' : 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600'} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white transition-all duration-300 hover:scale-110" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300 hover:text-gray-700">
                    {tier.name}
                  </CardTitle>
                  <div className="text-4xl font-bold mb-2 transition-all duration-300 hover:scale-110">
                    <span className={`${tier.id === 'test-premium' ? 'text-emerald-600 hover:text-emerald-700' : tier.id === 'premium' ? 'text-blue-600 hover:text-blue-700' : 'text-orange-600 hover:text-orange-700'}`}>
                      {tier.price}
                    </span>
                    {tier.price !== '$0' && <span className="text-lg text-gray-600 dark:text-gray-400">/month</span>}
                  </div>
                  <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 transition-all duration-300 hover:px-7 flex-1 flex flex-col">
                  <div className="space-y-4 mb-6 flex-1">
                    <div className="text-center">
                      <div className="font-semibold text-lg text-gray-900 dark:text-white">
                        {tier.operations}
                      </div>
                      <div className="text-base text-gray-600 dark:text-gray-400">
                        {tier.fileSize}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-2">Features:</h4>
                      <ul className="space-y-1">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-base text-gray-600 dark:text-gray-300 transition-all duration-200 hover:text-gray-800 hover:translate-x-1">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 transition-all duration-200 hover:scale-110" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-2">Limits:</h4>
                      <ul className="space-y-1">
                        {tier.limits.map((limit, index) => (
                          <li key={index} className="text-base text-gray-500 dark:text-gray-400">
                            • {limit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    className={`w-full transition-all duration-300 hover:scale-105 hover:shadow-lg min-h-[44px] ${tier.popular ? (tier.id === 'test-premium' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700') + ' text-white shadow-lg' : tier.id === 'enterprise' ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg' : ''}`}
                    variant={tier.buttonVariant}
                    onClick={() => handlePlanSelect(tier.id)}
                    data-testid={`button-select-${tier.id}`}
                  >
                    {tier.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Free Plan - Horizontal Card */}
        <div className="max-w-6xl mx-auto mb-16">
          {(() => {
            const freeTier = tiers.find(tier => tier.id === 'free');
            if (!freeTier) return null;
            const Icon = freeTier.icon;
            
            return (
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 border-2 border-green-200">
                {/* Top Banner */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-green-400 to-emerald-500 z-10"></div>
                
                <CardContent className="p-8 pt-12">
                  <div className="grid md:grid-cols-4 gap-6 items-center">
                    {/* Icon and Title */}
                    <div className="text-center md:text-left">
                      <div className="mx-auto md:mx-0 mb-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{freeTier.name}</h3>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {freeTier.price}
                        <span className="text-lg text-gray-600">/month</span>
                      </div>
                      <p className="text-gray-600">{freeTier.description}</p>
                    </div>

                    {/* Operations and File Size */}
                    <div className="text-center">
                      <div className="font-semibold text-lg text-gray-900 mb-1">
                        {freeTier.operations}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        {freeTier.fileSize}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                      <ul className="space-y-2">
                        {freeTier.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="text-center">
                      <Button
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 hover:scale-105"
                        onClick={() => handlePlanSelect('free')}
                        data-testid="button-select-free"
                      >
                        {freeTier.buttonText}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">No credit card required</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need to sign up to try the service?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  No! You can use up to 500 operations per month without signing up. Just visit our homepage and start compressing images.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens when I reach my limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  You'll see options to create a free account (500 more operations), upgrade to Pro, or wait until next month for your limit to reset.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I use both web interface and API?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! All plans include access to both our web interface and API. Your operations count toward the same monthly limit regardless of how you use the service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What about overage charges?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Pro and Enterprise plans charge $0.005 per operation beyond your monthly limit. Free plans cannot exceed their limits.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white border-none shadow-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-lg mb-6 opacity-90">
                Try our service right now - no signup required!
              </p>
              <div className="space-x-4">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
                  onClick={() => setLocation('/')}
                  data-testid="button-try-now"
                >
                  Try Now - Free
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-gray-800 border-white bg-white hover:bg-gray-100 hover:text-purple-600 shadow-lg font-semibold"
                  onClick={() => handlePlanSelect('premium')}
                  data-testid="button-upgrade-premium"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 text-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="MicroJPEG Logo" className="w-10 h-10 hidden md:block" />
                <span className="text-xl font-bold font-poppins">MicroJPEG</span>
              </div>
              <p className="text-gray-600 font-opensans">
                The smartest way to compress and optimize your images for the web.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="/web/overview" className="hover:text-black">Features</a></li>
                <li><a href="/simple-pricing" className="hover:text-black">Pricing</a></li>
                <li><a href="/api-docs" className="hover:text-black">API</a></li>
                <li><a href="/api-docs" className="hover:text-black">Documentation</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="/about" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
                <li><a href="/contact" className="hover:text-black">Contact</a></li>
                <li><a href="#" className="hover:text-black">Support</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-black">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-8 pt-8 text-center text-gray-500 font-opensans">
            <p>© 2025 MicroJPEG. All rights reserved. Making the web faster, one image at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}