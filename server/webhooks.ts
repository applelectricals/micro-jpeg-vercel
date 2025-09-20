import { Router } from "express";
import Stripe from "stripe";
import { handlePaymentFailure, handlePaymentSuccess } from "./paymentProtection";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing required Stripe webhook secret: STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

const router = Router();

/**
 * Stripe webhook endpoint for handling payment events
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  
  if (invoice.customer && typeof invoice.customer === 'string') {
    await handlePaymentFailure(
      invoice.customer,
      invoice.id || '',
      'payment_failed'
    );
  }
}

/**
 * Handle successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  if (invoice.customer && typeof invoice.customer === 'string') {
    // Determine tier from Stripe subscription
    let tier = 'free_registered';
    let endDate: Date | undefined = undefined;
    
    // Get subscription to determine tier
    if (invoice.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        
        if (priceId === 'price_test_premium_placeholder') {
          tier = 'test_premium';
          endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        } else if (priceId && priceId.includes('pro')) {
          tier = 'pro';
        } else if (priceId && priceId.includes('enterprise')) {
          tier = 'enterprise';
        }
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }
    
    await handlePaymentSuccess(
      invoice.customer,
      invoice.id || '',
      tier,
      endDate
    );
  }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  if (typeof subscription.customer === 'string') {
    // When user cancels subscription, suspend API access
    await handlePaymentFailure(
      subscription.customer,
      'subscription_cancelled',
      'subscription_cancelled'
    );
  }
}

/**
 * Handle payment requiring action (3D Secure, etc.)
 */
async function handlePaymentActionRequired(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Payment action required for invoice: ${invoice.id}`);
  
  // Could send email to user about required payment action
  // For now, just log it
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
  
  if (typeof subscription.customer === 'string') {
    // Determine tier from Stripe price ID
    const priceId = subscription.items.data[0]?.price.id;
    let tier = 'free_registered';
    let endDate: Date | undefined = undefined;
    
    // Map Stripe price IDs to our tiers
    if (priceId === 'price_test_premium_placeholder') {
      tier = 'test_premium';
      endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    } else if (priceId && priceId.includes('pro')) {
      tier = 'pro';
    } else if (priceId && priceId.includes('enterprise')) {
      tier = 'enterprise';
    }
    
    // Handle subscription status changes
    if (subscription.status === 'past_due') {
      await handlePaymentFailure(
        subscription.customer,
        'subscription_past_due',
        'subscription_past_due'
      );
    } else if (subscription.status === 'active') {
      await handlePaymentSuccess(
        subscription.customer,
        'subscription_updated',
        tier,
        endDate
      );
    }
  }
}

export { router as webhookRouter };