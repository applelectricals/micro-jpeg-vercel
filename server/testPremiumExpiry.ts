// Test Premium Expiry Management System
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { emailService } from './emailService';

export class TestPremiumExpiryManager {
  
  /**
   * Check for expired test-premium subscriptions and downgrade them
   */
  static async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all users with expired test-premium subscriptions
      const expiredUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.subscriptionTier, 'test_premium'),
            eq(users.subscriptionStatus, 'active'),
            lt(users.subscriptionEndDate, now)
          )
        );

      console.log(`Found ${expiredUsers.length} expired test-premium subscriptions`);

      for (const user of expiredUsers) {
        await this.expireTestPremiumSubscription(user);
      }

      if (expiredUsers.length > 0) {
        console.log(`Expired ${expiredUsers.length} test-premium subscriptions`);
      }

    } catch (error) {
      console.error('Error checking expired test-premium subscriptions:', error);
    }
  }

  /**
   * Expire a single test-premium subscription
   */
  static async expireTestPremiumSubscription(user: any): Promise<void> {
    try {
      // Downgrade user to free_registered
      await db
        .update(users)
        .set({
          subscriptionTier: 'free_registered',
          subscriptionStatus: 'inactive',
          subscriptionEndDate: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Send expiry notification email
      await this.sendExpiryEmail(user);

      console.log(`Test-premium subscription expired for user ${user.id} (${user.email})`);

    } catch (error) {
      console.error(`Error expiring test-premium for user ${user.id}:`, error);
    }
  }

  /**
   * Send test-premium expiry notification with upgrade options
   */
  static async sendExpiryEmail(user: any): Promise<void> {
    if (!user.email) return;

    const subject = "⏰ Your Test Premium has expired - Ready for the full experience?";
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⏰ Test Premium Expired</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Hope you loved the Premium experience!</p>
        </div>
        
        <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p>Hi ${user.firstName || 'there'},</p>
          
          <p>Your 24-hour Test Premium access has expired, but we hope you enjoyed the premium features!</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #AD0000; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 15px 0; color: #AD0000;">🆙 Ready to Upgrade?</h3>
            <p style="margin: 0 0 15px 0;">You're now back on the Free plan with 500 operations/month and 10MB file limit.</p>
            <p style="margin: 0; font-weight: bold;">Miss those premium features? Upgrade to our full Premium plan!</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #d97706;">💎 Premium Plan Benefits:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>10,000 operations/month</strong> (33x more than Free)</li>
              <li><strong>50MB file size limit</strong> (5x bigger than Free)</li>
              <li><strong>All formats including RAW</strong> (CR2, ARW, DNG, NEF, etc.)</li>
              <li><strong>Advanced quality controls</strong></li>
              <li><strong>No ads</strong> - clean, professional interface</li>
              <li><strong>3 concurrent uploads</strong></li>
              <li><strong>Priority processing</strong></li>
              <li><strong>API access</strong></li>
              <li><strong>Email support</strong></li>
            </ul>
            <p style="margin: 15px 0 0 0; font-size: 18px; font-weight: bold; color: #d97706;">Just $29/month - Cancel anytime!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://microjpeg.com'}/subscribe?plan=pro" 
               style="background: #AD0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 15px;">
              Upgrade to Premium →
            </a>
            <a href="${process.env.FRONTEND_URL || 'https://microjpeg.com'}/compress-free" 
               style="background: transparent; color: #AD0000; border: 2px solid #AD0000; padding: 13px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Continue with Free
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <h3 style="color: #AD0000;">🤔 Have questions about Premium?</h3>
          <p>We'd love to help! Reply to this email or reach out to our support team.</p>
          
          <p><strong>Fun fact:</strong> The average Premium user saves 2-3 hours per week with our advanced features and higher limits!</p>
          
          <p>Thanks for testing Premium with us!<br>
          The Micro JPEG Team</p>
        </div>
      </div>
    `;

    // Use the private sendEmail method with proper EmailConfig
    try {
      await (emailService as any).sendEmail({
        from: 'noreply@microjpeg.com',
        to: user.email,
        subject: subject,
        html: html
      });
    } catch (error) {
      console.error('Failed to send expiry email:', error);
    }
  }

  /**
   * Get time until test-premium expires for a user
   */
  static async getTimeUntilExpiry(userId: string): Promise<number | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.subscriptionTier !== 'test_premium' || !user.subscriptionEndDate) {
        return null;
      }

      const now = new Date();
      const expiry = new Date(user.subscriptionEndDate);
      const timeLeft = expiry.getTime() - now.getTime();

      return timeLeft > 0 ? timeLeft : 0; // Return 0 if already expired
    } catch (error) {
      console.error('Error getting time until expiry:', error);
      return null;
    }
  }

  /**
   * Start the expiry check interval (runs every 5 minutes)
   */
  static startExpiryChecker(): void {
    // Disable background process in production deployments to prevent hanging
    if (process.env.NODE_ENV === 'production') {
      console.log('Background expiry checker disabled in production deployment');
      return;
    }

    const interval = 5 * 60 * 1000; // 5 minutes

    console.log('Starting test-premium expiry checker (every 5 minutes)');
    
    // Run immediately
    this.checkExpiredSubscriptions();
    
    // Then run every 5 minutes
    setInterval(() => {
      this.checkExpiredSubscriptions();
    }, interval);
  }
}