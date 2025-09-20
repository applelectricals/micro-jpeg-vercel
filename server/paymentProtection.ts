import Stripe from "stripe";
import { db } from "./db";
import { users, apiKeys } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { emailService } from "./emailService";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export interface PaymentFailureAction {
  userId: string;
  reason: 'payment_failed' | 'card_declined' | 'insufficient_funds' | 'disputed_charge';
  amountDue: number;
  attemptCount: number;
  nextAttempt?: Date;
  suspensionDate?: Date;
}

/**
 * Handle payment failure scenarios
 */
export async function handlePaymentFailure(
  customerId: string,
  invoiceId: string,
  failureReason: string
): Promise<void> {
  try {
    // Get user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      console.error(`No user found for Stripe customer: ${customerId}`);
      return;
    }

    // Get invoice details
    const invoice = await stripe.invoices.retrieve(invoiceId);
    const amountDue = invoice.amount_due / 100; // Convert from cents

    console.log(`Payment failure for user ${user.id}: $${amountDue} - ${failureReason}`);

    // Implement progressive enforcement
    const attemptCount = (invoice.attempt_count || 0);
    
    if (attemptCount === 1) {
      // First failure - send friendly reminder
      await sendPaymentReminder(user, amountDue, failureReason);
      
    } else if (attemptCount === 2) {
      // Second failure - send warning email
      await sendPaymentWarning(user, amountDue);
      
    } else if (attemptCount >= 3) {
      // Third failure - suspend API access
      await suspendApiAccess(user.id, amountDue, 'payment_failed');
      await sendSuspensionNotice(user, amountDue);
    }

    // Schedule automatic retry in 3 days
    if (attemptCount < 3) {
      await schedulePaymentRetry(invoice.id, 3);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Suspend API access for non-payment
 */
export async function suspendApiAccess(
  userId: string,
  amountDue: number,
  reason: string
): Promise<void> {
  try {
    // Deactivate all API keys for this user
    await db
      .update(apiKeys)
      .set({ 
        isActive: false,
        suspendedAt: new Date(),
        suspensionReason: `Payment failure: $${amountDue} - ${reason}`
      })
      .where(eq(apiKeys.userId, userId));

    // Update user status
    await db
      .update(users)
      .set({ 
        accountStatus: 'suspended',
        suspendedAt: new Date(),
        suspensionReason: reason
      })
      .where(eq(users.id, userId));

    console.log(`API access suspended for user ${userId} - Amount due: $${amountDue}`);

  } catch (error) {
    console.error('Error suspending API access:', error);
  }
}

/**
 * Restore API access after payment
 */
export async function restoreApiAccess(userId: string): Promise<void> {
  try {
    // Reactivate API keys
    await db
      .update(apiKeys)
      .set({ 
        isActive: true,
        suspendedAt: null,
        suspensionReason: null
      })
      .where(eq(apiKeys.userId, userId));

    // Update user status
    await db
      .update(users)
      .set({ 
        accountStatus: 'active',
        suspendedAt: null,
        suspensionReason: null
      })
      .where(eq(users.id, userId));

    console.log(`API access restored for user ${userId}`);

  } catch (error) {
    console.error('Error restoring API access:', error);
  }
}

/**
 * Send payment reminder email
 */
async function sendPaymentReminder(user: any, amountDue: number, reason: string): Promise<void> {
  if (!user.email) return;

  const subject = "Payment Reminder - Micro JPEG API";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #2563eb;">Payment Reminder</h2>
      
      <p>Hi there,</p>
      
      <p>We had trouble processing your payment for the Micro JPEG API service:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>Amount Due:</strong> $${amountDue.toFixed(2)}<br>
        <strong>Reason:</strong> ${reason}<br>
        <strong>Service:</strong> API Compression Usage
      </div>
      
      <p>Please update your payment method to continue using our API services. We'll automatically retry the payment in 3 days.</p>
      
      <div style="margin: 30px 0;">
        <a href="https://billing.stripe.com/p/login/test_123" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Update Payment Method
        </a>
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Best regards,<br>Micro JPEG Team</p>
    </div>
  `;

  await emailService.sendEmail(user.email, subject, html);
}

/**
 * Send payment warning email
 */
async function sendPaymentWarning(user: any, amountDue: number): Promise<void> {
  if (!user.email) return;

  const subject = "Payment Warning - API Service Suspension Notice";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #dc2626;">Payment Warning</h2>
      
      <p>Hi there,</p>
      
      <p><strong>This is our second attempt to collect payment for your Micro JPEG API usage.</strong></p>
      
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>⚠️ Service Suspension Warning</strong><br><br>
        <strong>Amount Due:</strong> $${amountDue.toFixed(2)}<br>
        <strong>Action Required:</strong> Update payment method immediately<br>
        <strong>Suspension Date:</strong> After next failed payment attempt
      </div>
      
      <p>To avoid service interruption, please update your payment method now:</p>
      
      <div style="margin: 30px 0;">
        <a href="https://billing.stripe.com/p/login/test_123" 
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Update Payment Method Now
        </a>
      </div>
      
      <p><strong>What happens if payment fails again?</strong></p>
      <ul>
        <li>Your API keys will be immediately deactivated</li>
        <li>All API requests will be blocked</li>
        <li>Service will remain suspended until payment is received</li>
      </ul>
      
      <p>Contact support if you need assistance: support@microjpeg.com</p>
      
      <p>Best regards,<br>Micro JPEG Team</p>
    </div>
  `;

  await emailService.sendEmail(user.email, subject, html);
}

/**
 * Send suspension notice email
 */
async function sendSuspensionNotice(user: any, amountDue: number): Promise<void> {
  if (!user.email) return;

  const subject = "API Service Suspended - Payment Required";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #dc2626;">Service Suspended</h2>
      
      <p>Hi there,</p>
      
      <p><strong>Your Micro JPEG API service has been suspended due to non-payment.</strong></p>
      
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>🚫 Service Status: SUSPENDED</strong><br><br>
        <strong>Outstanding Balance:</strong> $${amountDue.toFixed(2)}<br>
        <strong>Suspension Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>API Keys:</strong> Deactivated
      </div>
      
      <p><strong>To restore service immediately:</strong></p>
      <ol>
        <li>Update your payment method</li>
        <li>Pay the outstanding balance</li>
        <li>Service will be automatically restored within 15 minutes</li>
      </ol>
      
      <div style="margin: 30px 0;">
        <a href="https://billing.stripe.com/p/login/test_123" 
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Pay Now to Restore Service
        </a>
      </div>
      
      <p><strong>Important:</strong> Continued non-payment may result in account termination and debt collection proceedings.</p>
      
      <p>Need help? Contact support: support@microjpeg.com</p>
      
      <p>Best regards,<br>Micro JPEG Team</p>
    </div>
  `;

  await emailService.sendEmail(user.email, subject, html);
}

/**
 * Schedule automatic payment retry
 */
async function schedulePaymentRetry(invoiceId: string, daysFromNow: number): Promise<void> {
  try {
    // Stripe automatically retries failed payments, but we can customize the schedule
    const retryDate = new Date();
    retryDate.setDate(retryDate.getDate() + daysFromNow);

    console.log(`Payment retry scheduled for invoice ${invoiceId} on ${retryDate.toISOString()}`);
    
    // Note: In production, you might want to use a job queue system like Bull or Agenda
    // to handle these retries more reliably
    
  } catch (error) {
    console.error('Error scheduling payment retry:', error);
  }
}

/**
 * Handle successful payment after failure
 */
export async function handlePaymentSuccess(
  customerId: string, 
  invoiceId: string, 
  tier: string = 'pro', 
  endDate?: Date
): Promise<void> {
  try {
    // Get user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      console.error(`No user found for Stripe customer: ${customerId}`);
      return;
    }

    // Update user tier and subscription status
    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionEndDate: endDate,
        accountStatus: 'active',
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    console.log(`User ${user.id} activated with tier: ${tier}${endDate ? `, expires: ${endDate}` : ''}`);

    // If user was suspended, restore access
    if (user.accountStatus === 'suspended') {
      await restoreApiAccess(user.id);
      await sendServiceRestoredEmail(user);
    }

    // Send tier-specific welcome email
    if (tier === 'test_premium') {
      await sendTestPremiumWelcomeEmail(user, endDate!);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Send service restored email
 */
async function sendServiceRestoredEmail(user: any): Promise<void> {
  if (!user.email) return;

  const subject = "API Service Restored - Thank You!";
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #059669;">Service Restored</h2>
      
      <p>Hi there,</p>
      
      <p><strong>Great news! Your Micro JPEG API service has been restored.</strong></p>
      
      <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <strong>✅ Service Status: ACTIVE</strong><br><br>
        <strong>Payment:</strong> Received and processed<br>
        <strong>API Keys:</strong> Reactivated<br>
        <strong>Restored:</strong> ${new Date().toLocaleString()}
      </div>
      
      <p>Your API keys are now active and ready to use. Thank you for your payment!</p>
      
      <p>To prevent future service interruptions, consider:</p>
      <ul>
        <li>Setting up automatic payment notifications</li>
        <li>Keeping your payment method up to date</li>
        <li>Monitoring your usage through our dashboard</li>
      </ul>
      
      <p>Thank you for using Micro JPEG API!</p>
      
      <p>Best regards,<br>Micro JPEG Team</p>
    </div>
  `;

  await emailService.sendEmail(user.email, subject, html);
}

/**
 * Check if user has outstanding debt
 */
export async function checkOutstandingDebt(userId: string): Promise<{
  hasDebt: boolean;
  amount: number;
  daysPastDue: number;
}> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return { hasDebt: false, amount: 0, daysPastDue: 0 };
    }

    // Get unpaid invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'open',
      limit: 10
    });

    let totalDebt = 0;
    let daysPastDue = 0;

    for (const invoice of invoices.data) {
      totalDebt += invoice.amount_due / 100; // Convert from cents
      
      if (invoice.due_date) {
        const dueDate = new Date(invoice.due_date * 1000);
        const daysPast = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        daysPastDue = Math.max(daysPastDue, daysPast);
      }
    }

    return {
      hasDebt: totalDebt > 0,
      amount: totalDebt,
      daysPastDue: Math.max(0, daysPastDue)
    };

  } catch (error) {
    console.error('Error checking outstanding debt:', error);
    return { hasDebt: false, amount: 0, daysPastDue: 0 };
  }
}

/**
 * Send test premium welcome email
 */
async function sendTestPremiumWelcomeEmail(user: any, endDate: Date): Promise<void> {
  if (!user.email) return;

  const subject = "🚀 Welcome to Test Premium - 24 Hours of Premium Features!";
  const expiryFormatted = endDate.toLocaleDateString() + ' at ' + endDate.toLocaleTimeString();
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #AD0000 0%, #FF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚀 Welcome to Test Premium!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">24 hours of unlimited Premium features</p>
      </div>
      
      <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Hi ${user.firstName || 'there'},</p>
        
        <p><strong>Congratulations! Your $1 Test Premium access is now active.</strong></p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #AD0000; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 15px 0; color: #AD0000;">✨ Your Test Premium Benefits:</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>300 operations</strong> for 24 hours</li>
            <li><strong>50MB file size limit</strong> (5x bigger than Free)</li>
            <li><strong>All formats including RAW</strong> (CR2, ARW, DNG, NEF, etc.)</li>
            <li><strong>Advanced quality controls</strong></li>
            <li><strong>No ads</strong> - clean, professional interface</li>
            <li><strong>3 concurrent uploads</strong></li>
            <li><strong>Priority processing</strong></li>
            <li><strong>API access</strong></li>
          </ul>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⏰ Your Test Premium expires:</strong> ${expiryFormatted}</p>
        </div>
        
        <p><strong>Ready to test?</strong> Head to your compression page and experience the difference!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://microjpeg.com'}/test-premium" 
             style="background: #AD0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Start Testing Premium Features →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <h3 style="color: #AD0000;">💡 Love the Premium experience?</h3>
        <p>After your 24-hour test, upgrade to our full Premium plan:</p>
        <ul style="line-height: 1.6;">
          <li><strong>$29/month</strong> for 10,000 operations</li>
          <li>Everything from Test Premium</li>
          <li>Monthly billing, cancel anytime</li>
          <li>Priority support</li>
        </ul>
        
        <p>Questions? Reply to this email - we're here to help!</p>
        
        <p>Happy compressing!<br>
        The Micro JPEG Team</p>
      </div>
    </div>
  `;

  await emailService.sendEmail(user.email, subject, html);
}