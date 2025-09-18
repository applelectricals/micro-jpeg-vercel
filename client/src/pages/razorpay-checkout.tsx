import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Shield, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Get order_id from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (!orderId) {
      setError('Invalid order ID');
      return;
    }

    // Load order details (you could fetch from API if needed)
    setOrderDetails({
      orderId,
      amount: 7500, // ₹75.00 = 7500 paise (≈ $1 USD)
      currency: 'INR'
    });

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!orderDetails || !window.Razorpay) {
      setError('Payment system not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 7500, // ₹75.00 = 7500 paise (≈ $1 USD)
          currency: 'INR',
          plan: 'test-premium'
        })
      });

      const orderData = await response.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const options = {
        key: orderData.key, // Razorpay key from backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Micro JPEG',
        description: 'Test Premium - 24 Hour Trial',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: 'test_premium'
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Redirect to success page
              setLocation('/subscription-success?plan=test-premium');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@microjpeg.com'
        },
        theme: {
          color: '#AD0000'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setError('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Secure ₹75 payment for 24-hour Test Premium access (≈ $1 USD)
          </p>
        </div>

        {/* Payment Card */}
        <Card className="border-2 border-[#AD0000]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-[#AD0000] to-red-600 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Test Premium</CardTitle>
            <div className="text-3xl font-bold text-[#AD0000]">
              ₹75<span className="text-lg text-gray-600">/24 hours</span>
            </div>
            <CardDescription>≈ $1 USD • Perfect for testing Premium features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-2">
              <h4 className="font-semibold">You'll get instant access to:</h4>
              <ul className="space-y-1">
                <li className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  50MB max file size
                </li>
                <li className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  All Premium features
                </li>
                <li className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  Advanced quality controls
                </li>
                <li className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  No ads
                </li>
                <li className="flex items-center text-sm">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  Priority support
                </li>
              </ul>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={loading || !orderDetails}
              className="w-full bg-[#AD0000] hover:bg-red-700 text-white py-3 text-lg"
              data-testid="button-pay"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹75 Securely
                </>
              )}
            </Button>

            {/* Security Note */}
            <div className="text-center text-sm text-gray-500">
              <Shield className="w-4 h-4 inline mr-1" />
              Secured by Razorpay • 256-bit SSL encryption
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Button 
            variant="link" 
            onClick={() => setLocation('/simple-pricing')}
            className="text-gray-600 hover:text-[#AD0000]"
          >
            ← Back to pricing
          </Button>
        </div>
      </div>
    </div>
  );
}