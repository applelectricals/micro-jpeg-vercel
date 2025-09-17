import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Zap } from 'lucide-react';

const tiers = [
  {
    id: 'free',
    name: 'Free',
    description: 'No signup needed! Perfect for daily image compression',
    price: 0,
    popular: false,
    features: [
      '20 compressions per day',
      '3 format conversions per day',
      '5MB file size limit',
      'All basic formats (JPEG, PNG, WebP, AVIF)',
      'Preset quality levels',
      'Daily reset at midnight',
      'No signup required',
    ],
    cta: 'Start Compressing',
    highlight: 'Most Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Enhanced limits with advanced features',
    price: 9.99,
    popular: true,
    features: [
      '50 compressions per day',
      'Unlimited format conversions',
      '10MB file size limit',
      'Advanced quality settings',
      'AI compression recommendations',
      'SVG format support',
      'Email support',
      'No ads',
    ],
    cta: 'Upgrade to Premium',
    highlight: 'Best Value',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional features for teams and businesses',
    price: 29.99,
    popular: false,
    features: [
      '150 compressions per day',
      'Unlimited format conversions',
      '15MB file size limit',
      'All formats (SVG, TIFF, RAW)',
      'Advanced quality settings',
      'AI compression recommendations',
      'Priority processing',
      'Priority support',
      'No ads',
    ],
    cta: 'Get Business',
    highlight: 'For Teams',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'API access and unlimited processing for developers',
    price: 99.99,
    popular: false,
    features: [
      'Unlimited compressions',
      'Unlimited format conversions',
      'Unlimited file size',
      'Full API access',
      'All formats and features',
      '24/7 priority support',
      'No daily limits',
    ],
    cta: 'Contact Sales',
    highlight: 'For Developers',
  },
];

interface TierComparisonProps {
  currentTier?: string;
  onSelectTier?: (tierId: string) => void;
  className?: string;
}

export function TierComparison({ currentTier = 'free', onSelectTier, className = '' }: TierComparisonProps) {
  const handleTierSelect = (tierId: string) => {
    if (onSelectTier) {
      onSelectTier(tierId);
    } else {
      // Default behavior - could redirect to payment flow
      console.log(`Selected tier: ${tierId}`);
    }
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="tier-comparison">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground mt-2">
          Start free, upgrade when you need more power
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${tier.popular ? 'ring-2 ring-primary' : ''} ${currentTier === tier.id ? 'border-primary' : ''}`}
            data-testid={`tier-card-${tier.id}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  {tier.highlight}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription className="text-sm">{tier.description}</CardDescription>
              <div className="py-4">
                <div className="text-3xl font-bold">
                  {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  {tier.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                variant={currentTier === tier.id ? 'outline' : tier.popular ? 'default' : 'outline'}
                disabled={currentTier === tier.id}
                onClick={() => handleTierSelect(tier.id)}
                data-testid={`button-select-${tier.id}`}
              >
                {currentTier === tier.id ? (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Current Plan
                  </div>
                ) : (
                  tier.cta
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Feature comparison note */}
      <div className="text-center text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p>
          <strong>All plans include:</strong> Secure processing, instant downloads, cross-browser compatibility, and mobile-friendly interface. 
          Daily limits reset automatically at midnight.
        </p>
      </div>
    </div>
  );
}