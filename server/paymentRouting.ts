/**
 * Payment Gateway Routing Logic
 * Routes payments to Razorpay (India) or PayPal (International)
 */

export interface PaymentRoutingResult {
  gateway: 'razorpay' | 'paypal';
  currency: 'INR' | 'USD';
  reason: string;
}

export function determinePaymentGateway(
  countryCode?: string,
  preferredCurrency?: string,
  userLocation?: string
): PaymentRoutingResult {
  
  // If user explicitly requests INR or is from India, use Razorpay
  if (countryCode === 'IN' || preferredCurrency === 'INR' || userLocation?.toLowerCase().includes('india')) {
    return {
      gateway: 'razorpay',
      currency: 'INR',
      reason: 'India-based customer'
    };
  }
  
  // For all other international customers, use PayPal
  return {
    gateway: 'paypal', 
    currency: 'USD',
    reason: 'International customer'
  };
}

export const PRICING_CONFIG = {
  // Subscription plans with regional pricing
  plans: {
    free: {
      INR: { price: 0, currency: 'INR' },
      USD: { price: 0, currency: 'USD' }
    },
    pro: {
      INR: { price: 799, currency: 'INR' }, // ₹799/month
      USD: { price: 9.99, currency: 'USD' }  // $9.99/month
    },
    enterprise: {
      INR: { price: 2499, currency: 'INR' }, // ₹2499/month
      USD: { price: 29.99, currency: 'USD' }  // $29.99/month
    }
  }
};

export function getPlanPricing(plan: string, currency: 'INR' | 'USD') {
  return PRICING_CONFIG.plans[plan as keyof typeof PRICING_CONFIG.plans]?.[currency] || null;
}