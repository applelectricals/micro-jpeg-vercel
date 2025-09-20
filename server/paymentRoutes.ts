/**
 * Payment Routes - Handles both Razorpay and PayPal payments
 */
import { Router } from 'express';
import { razorpayService } from './razorpayService';
import { paypalService } from './paypalService';
import { determinePaymentGateway, getPlanPricing } from './paymentRouting';
import { storage } from './storage';

const router = Router();

// Payment routing endpoint
router.post('/payment/routing', async (req, res) => {
  try {
    const { plan, userLocation, userEmail } = req.body;
    
    // Determine which gateway to use
    const routing = determinePaymentGateway(undefined, undefined, userLocation);
    const pricing = getPlanPricing(plan, routing.currency);
    
    if (!pricing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid plan or pricing not found' 
      });
    }

    let paypalPlanId = '';
    
    // If PayPal, ensure subscription plan exists
    if (routing.gateway === 'paypal') {
      // In production, you'd store these plan IDs in database
      // For now, return pre-configured plan IDs based on environment
      const planMapping = {
        pro: process.env.PAYPAL_PRO_PLAN_ID || 'P-1234567890',
        enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID || 'P-0987654321'
      };
      paypalPlanId = planMapping[plan as keyof typeof planMapping] || '';
    }

    res.json({
      success: true,
      gateway: routing.gateway,
      currency: routing.currency,
      pricing,
      paypalPlanId,
      reason: routing.reason
    });
  } catch (error) {
    console.error('Payment routing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment routing failed' 
    });
  }
});

// Razorpay Routes
router.post('/payment/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', plan } = req.body;
    
    console.log(`Creating Razorpay order: plan=${plan}, amount=${amount}, currency=${currency}`);
    
    const result = await razorpayService.createOrder(
      amount, 
      currency, 
      `order_${plan}_${Date.now()}`
    );
    
    if (result.success) {
      res.json({
        success: true,
        order_id: result.orderId,
        amount: result.amount,
        currency: result.currency,
        key: process.env.RAZORPAY_KEY_ID // Add the public key for frontend
      });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create order' 
    });
  }
});

router.post('/payment/razorpay/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan 
    } = req.body;
    
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    if (isValid) {
      // Update user subscription in database
      const sessionData = req.session as any;
      if (sessionData.userId) {
        await storage.updateUser(sessionData.userId, {
          subscriptionTier: plan,
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          stripeSubscriptionId: razorpay_payment_id // Store payment ID
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed' 
    });
  }
});

// PayPal Routes
// PayPal subscription success - handles redirect from PayPal after payment
router.get('/payment/paypal/subscription-success', async (req, res) => {
  try {
    const { subscription_id, plan_id } = req.query;
    
    const sessionData = req.session as any;
    if (!subscription_id || !sessionData.userId) {
      return res.redirect('/simple-pricing?error=missing_subscription');
    }
    
    console.log('PayPal subscription redirect:', { subscription_id, plan_id });
    
    // Verify subscription with PayPal
    const result = await paypalService.getSubscription(subscription_id as string);
    
    if (result.success && result.subscription.status === 'ACTIVE') {
      console.log('PayPal subscription verified as ACTIVE:', result.subscription);
      
      // Determine plan from subscription details
      const plan = result.subscription.plan_id?.includes('test') ? 'test_premium' :
                   result.subscription.plan_id?.includes('enterprise') ? 'enterprise' : 'premium';
      
      const planPrices = {
        'test_premium': 1.00,
        'premium': 29.00,
        'enterprise': 99.00
      };
      
      const subscriptionEndDate = plan === 'test_premium' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for test
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for others
      
      // NOW activate subscription after payment verification
      await storage.updateUser(sessionData.userId, {
        subscriptionTier: plan,
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate,
        stripeSubscriptionId: subscription_id as string // Store PayPal subscription ID
      });
      
      const amount = planPrices[plan as keyof typeof planPrices];
      const planDisplayName = plan.replace('_', '-'); // Convert to display format
      
      console.log('Subscription activated successfully for user:', sessionData.userId);
      
      // Redirect to success page with payment confirmation
      res.redirect(`/subscription-success?plan=${planDisplayName}&amount=${amount}&paypal_subscription_id=${subscription_id}`);
    } else {
      console.error('PayPal subscription verification failed:', result);
      res.redirect('/simple-pricing?error=payment_verification_failed');
    }
  } catch (error) {
    console.error('PayPal subscription verification error:', error);
    res.redirect('/simple-pricing?error=payment_processing_failed');
  }
});

router.post('/payment/paypal/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    const result = await paypalService.cancelSubscription(subscriptionId);
    
    if (result.success) {
      // Update user subscription in database
      const sessionData = req.session as any;
      if (sessionData.userId) {
        await storage.updateUser(sessionData.userId, {
          subscriptionStatus: 'cancelled'
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Subscription cancelled successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('PayPal subscription cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Subscription cancellation failed' 
    });
  }
});

// Webhook handling (for production)
router.post('/payment/razorpay/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // Handle different Razorpay events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        break;
      case 'subscription.activated':
        console.log('Subscription activated:', event.payload.subscription.entity.id);
        break;
      case 'subscription.cancelled':
        console.log('Subscription cancelled:', event.payload.subscription.entity.id);
        break;
      default:
        console.log('Unhandled Razorpay event:', event.event);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/payment/paypal/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // Handle different PayPal events
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log('PayPal subscription activated:', event.resource.id);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('PayPal subscription cancelled:', event.resource.id);
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        console.log('PayPal payment failed:', event.resource.id);
        break;
      default:
        console.log('Unhandled PayPal event:', event.event_type);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;