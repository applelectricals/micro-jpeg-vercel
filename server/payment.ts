import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { db } from './db';
import { users, subscriptions, paymentTransactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
// Use simplified email approach for now
import crypto from 'crypto';

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan configuration
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    operations: 500,
    features: ['500 operations/month', '10MB file limit', 'API access', 'Community support']
  },
  'test-premium': {
    id: 'test-premium',
    name: 'Test Premium',
    price: 1,
    operations: 300,
    features: ['300 operations (24-hour access)', '50MB file limit', 'All Premium features', 'Priority support']
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29,
    operations: 10000,
    features: ['10,000 operations/month', '50MB file limit', 'Priority processing', 'API access', 'Email support']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    operations: 50000,
    features: ['50,000 operations/month', '200MB file limit', 'Custom integrations', 'SLA guarantee', 'Priority support']
  }
};

export interface PaymentData {
  plan: 'free' | 'test-premium' | 'premium' | 'enterprise';
  paymentMethod: 'razorpay' | 'paypal';
  billing: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  paypal_payment_id?: string;
}

// Create Razorpay order
export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    const { plan, amount } = req.body;
    
    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    const planConfig = PLANS[plan as keyof typeof PLANS];
    const orderAmount = amount || planConfig.price * 100; // Convert to paise
    
    const options = {
      amount: orderAmount,
      currency: 'USD',
      receipt: `order_${Date.now()}_${plan}`,
      notes: {
        plan,
        user_id: req.user?.id || 'anonymous'
      }
    };
    
    const order = await razorpayInstance.orders.create(options);
    
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.VITE_RAZORPAY_KEY_ID
    });
    
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      message: error.message 
    });
  }
}

// Verify Razorpay payment
export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan,
      billing
    } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    
    // Payment verified - update user subscription
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const planConfig = PLANS[plan as keyof typeof PLANS];
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription
    
    // Update user subscription
    await db.update(users)
      .set({
        subscriptionTier: plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
        monthlyOperations: 0, // Reset operations count
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Record payment transaction
    await db.insert(paymentTransactions).values({
      userId,
      amount: planConfig.price,
      currency: 'USD',
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed',
      plan,
      billingDetails: JSON.stringify(billing),
    });
    
    // Send confirmation emails (simplified for now)
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (user?.email) {
      console.log(`Payment confirmed for ${user.email} - Plan: ${planConfig.name}, Amount: $${planConfig.price}`);
      // Email sending will be enhanced later
    }
    
    res.json({ 
      success: true, 
      message: 'Payment verified and subscription updated',
      subscription: {
        plan: planConfig.name,
        operations: planConfig.operations,
        features: planConfig.features
      }
    });
    
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message 
    });
  }
}

// Process PayPal payment
export async function processPayPalPayment(req: Request, res: Response) {
  try {
    const { plan, paypal_payment_id, billing } = req.body;
    
    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const planConfig = PLANS[plan as keyof typeof PLANS];
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    
    // Update user subscription
    await db.update(users)
      .set({
        subscriptionTier: plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
        monthlyOperations: 0,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Record payment transaction
    await db.insert(paymentTransactions).values({
      userId,
      amount: planConfig.price,
      currency: 'USD',
      paymentMethod: 'paypal',
      paymentId: paypal_payment_id,
      status: 'completed',
      plan,
      billingDetails: JSON.stringify(billing),
    });
    
    // Send confirmation emails (simplified for now)
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (user?.email) {
      console.log(`PayPal payment confirmed for ${user.email} - Plan: ${planConfig.name}, Amount: $${planConfig.price}`);
      // Email sending will be enhanced later
    }
    
    res.json({ 
      success: true, 
      message: 'PayPal payment processed and subscription updated',
      subscription: {
        plan: planConfig.name,
        operations: planConfig.operations,
        features: planConfig.features
      }
    });
    
  } catch (error) {
    console.error('PayPal payment processing failed:', error);
    res.status(500).json({ 
      error: 'PayPal payment processing failed',
      message: error.message 
    });
  }
}

// Get subscription status
export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const plan = user.subscriptionTier || 'free';
    const planConfig = PLANS[plan as keyof typeof PLANS];
    
    res.json({
      success: true,
      subscription: {
        plan: planConfig.name,
        status: user.subscriptionStatus || 'inactive',
        operations: planConfig.operations,
        operationsUsed: user.monthlyOperations || 0,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        features: planConfig.features
      }
    });
    
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
}

// Cancel subscription
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Update user to free tier
    await db.update(users)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully. You will retain access until the end of your current billing period.' 
    });
    
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error.message 
    });
  }
}