import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentGatewayProps {
  plan: 'pro' | 'enterprise';
  userLocation?: string;
  userEmail?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentGateway({
  plan,
  userLocation,
  userEmail,
  onSuccess,
  onError
}: PaymentGatewayProps) {
  const { toast } = useToast();
  const [gateway, setGateway] = useState<'razorpay' | 'paypal'>('paypal');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('USD');
  const [pricing, setPricing] = useState({ price: 0, currency: 'USD' });
  const [loading, setLoading] = useState(false);
  const [paypalPlanId, setPaypalPlanId] = useState<string>('');

  // Payment routing logic
  useEffect(() => {
    const detectPaymentGateway = async () => {
      try {
        const response = await apiRequest('POST', '/api/payment/routing', {
            plan,
            userLocation,
            userEmail
          });
        
        const data = await response.json();
        setGateway(data.gateway);
        setCurrency(data.currency);
        setPricing(data.pricing);
        setPaypalPlanId(data.paypalPlanId || '');
      } catch (error) {
        console.error('Payment routing failed:', error);
        // Default to PayPal for international
        setGateway('paypal');
        setCurrency('USD');
      }
    };

    detectPaymentGateway();
  }, [plan, userLocation, userEmail]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order
      const orderResponse = await apiRequest('POST', '/api/payment/razorpay/create-order', {
          amount: pricing.price,
          currency: pricing.currency,
          plan
        });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.error);
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Micro JPEG',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await apiRequest('POST', '/api/payment/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan
              });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              onSuccess({
                gateway: 'razorpay',
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                plan
              });
              
              toast({
                title: "Payment Successful!",
                description: `Welcome to ${plan} plan!`,
              });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            onError(error);
            toast({
              title: "Payment Failed",
              description: "Please try again or contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      onError(error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const paypalInitialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
    vault: true,
    intent: "subscription",
    currency: currency
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Payment Gateway
          <Badge variant="outline">
            {gateway === 'razorpay' ? '🇮🇳 Razorpay' : '🌍 PayPal'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold">
            {currency === 'INR' ? '₹' : '$'}{pricing.price}
            <span className="text-sm font-normal text-gray-500">/month</span>
          </h3>
          <p className="text-sm text-gray-600 capitalize">{plan} Plan</p>
        </div>

        {gateway === 'razorpay' ? (
          <Button 
            onClick={handleRazorpayPayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-razorpay-payment"
          >
            {loading ? 'Processing...' : `Pay ₹${pricing.price} with Razorpay`}
          </Button>
        ) : (
          <PayPalScriptProvider options={paypalInitialOptions}>
            <PayPalButtons
              createSubscription={(data, actions) => {
                return actions.subscription.create({
                  plan_id: paypalPlanId,
                  subscriber: {
                    email_address: userEmail || '',
                  }
                });
              }}
              onApprove={async (data, actions) => {
                try {
                  const response = await apiRequest('POST', '/api/payment/paypal/subscription-success', {
                      subscriptionId: data.subscriptionID,
                      plan
                    });

                  const result = await response.json();
                  if (result.success) {
                    onSuccess({
                      gateway: 'paypal',
                      subscriptionId: data.subscriptionID,
                      plan
                    });
                    
                    toast({
                      title: "Subscription Successful!",
                      description: `Welcome to ${plan} plan!`,
                    });
                  } else {
                    throw new Error('Subscription verification failed');
                  }
                } catch (error) {
                  console.error('PayPal subscription error:', error);
                  onError(error);
                  toast({
                    title: "Subscription Failed",
                    description: "Please try again or contact support.",
                    variant: "destructive",
                  });
                }
              }}
              onError={(err) => {
                console.error('PayPal Error:', err);
                onError(err);
                toast({
                  title: "Payment Error",
                  description: "PayPal payment failed. Please try again.",
                  variant: "destructive",
                });
              }}
              style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "subscribe"
              }}
            />
          </PayPalScriptProvider>
        )}

        <div className="text-xs text-gray-500 text-center">
          {gateway === 'razorpay' 
            ? 'Secure payments powered by Razorpay' 
            : 'Secure payments powered by PayPal'
          }
        </div>
      </CardContent>
    </Card>
  );
}