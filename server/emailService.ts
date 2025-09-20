import { MailService } from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface SubscriptionDetails {
  planName: string;
  amount: string;
  billingPeriod: string;
  nextBillingDate: Date;
  subscriptionId: string;
}

interface InvoiceDetails {
  invoiceNumber: string;
  amount: string;
  paidDate: Date;
  description: string;
  invoiceUrl: string;
  period: {
    start: Date;
    end: Date;
  };
}

interface PaymentDetails {
  amount: string;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  credits?: number; // Added for credit purchase confirmations
}

class EmailService {
  private mailService: MailService | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private useSendGrid = false;
  private logoAttachment: any = null;

  constructor() {
    // Load the Micro JPEG logo
    try {
      const logoPath = path.join(process.cwd(), 'attached_assets', 'MICROJPEG_LOGO_1756492872982.png');
      this.logoAttachment = {
        content: fs.readFileSync(logoPath).toString('base64'),
        filename: 'microjpeg-logo.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'microjpeg-logo'
      };
    } catch (error) {
      console.warn('Could not load Micro JPEG logo for emails:', error);
    }

    if (process.env.SENDGRID_API_KEY) {
      this.mailService = new MailService();
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      this.useSendGrid = true;
      console.log('SendGrid email service is configured and ready');
    } else {
      // Fallback to nodemailer for development
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });

      this.transporter.verify((error) => {
        if (error) {
          console.warn('Email service not configured properly. Emails will be logged to console.');
        } else {
          console.log('Development email service is ready');
          this.isConfigured = true;
        }
      });
    }
  }

  private async sendEmail(emailConfig: EmailConfig): Promise<boolean> {
    try {
      if (this.useSendGrid && this.mailService) {
        console.log(`Attempting to send email via SendGrid...`);
        console.log(`TO: ***MASKED***`);
        console.log(`FROM: ***MASKED***`);
        console.log(`SUBJECT: ${emailConfig.subject}`);
        
        const emailData: any = {
          to: emailConfig.to,
          from: emailConfig.from,
          subject: emailConfig.subject,
          html: emailConfig.html,
        };

        // Add logo attachment if available
        if (this.logoAttachment) {
          emailData.attachments = [this.logoAttachment];
        }

        const result = await this.mailService.send(emailData);
        console.log(`✓ Email sent successfully via SendGrid`);
        console.log(`SendGrid response status:`, result[0]?.statusCode);
        return true;
      } else if (this.transporter && this.isConfigured) {
        const info = await this.transporter.sendMail(emailConfig);
        console.log('Email sent via nodemailer:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        return true;
      } else {
        // Development fallback - log to console
        console.log('=== EMAIL WOULD BE SENT ===');
        console.log(`To: ***MASKED***`);
        console.log(`Subject: ${emailConfig.subject}`);
        console.log(`From: ***MASKED***`);
        console.log('=== END EMAIL ===');
        return true;
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    console.log(`Sending verification email to: ${email ? '***MASKED***' : 'NONE'}`);
    console.log(`Verification URL generated: ${!!verificationUrl}`);
    console.log(`SENDGRID_FROM_EMAIL configured: ${!!process.env.SENDGRID_FROM_EMAIL}`);
    
    // Use the correct verified SendGrid sender email
    // Override any invalid environment variable with the verified sender
    let fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail || !fromEmail.includes('@') || fromEmail.includes('DMARC')) {
      console.log('Invalid SENDGRID_FROM_EMAIL - using fallback verified sender');
      fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
      console.log('Fallback email configured');
    }
    console.log(`Email sender configured: ${!!fromEmail}`);
    
    // Force the correct verified email until environment variable is fixed
    fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
    console.log(`Using verified sender configuration`);
    
    const emailContent: EmailConfig = {
      from: fromEmail,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .logo-img { max-width: 120px; height: auto; margin-bottom: 10px; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: #f9fafb; padding: 30px; }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
              box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">PICTURE PERFECT</div>
            </div>
            <div class="content">
              <h2>Welcome${firstName ? ` ${firstName}` : ''}!</h2>
              <p>Thank you for signing up for Micro JPEG. To complete your registration and start compressing images, please verify your email address.</p>
              
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <p><strong>This verification link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account with us, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const success = await this.sendEmail(emailContent);
    if (!success && !this.isConfigured) {
      // Development fallback - log the verification URL
      console.log('DEVELOPMENT: Verification URL for', email, ':', verificationUrl);
    }
    return success;
  }

  async sendSubscriptionConfirmation(email: string, firstName: string, details: SubscriptionDetails): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: 'Welcome to Premium! Your Subscription is Active',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Premium Subscription Activated</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .premium-badge { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .details-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Premium!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Congratulations! Your premium subscription has been successfully activated. You now have unlimited access to all premium features.</p>
              
              <div class="premium-badge">👑 Premium Member</div>
              
              <div class="details-box">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${details.planName}</p>
                <p><strong>Amount:</strong> ${details.amount}</p>
                <p><strong>Billing:</strong> ${details.billingPeriod}</p>
                <p><strong>Next billing date:</strong> ${details.nextBillingDate.toLocaleDateString()}</p>
                <p><strong>Subscription ID:</strong> ${details.subscriptionId}</p>
              </div>

              <h3>What's included in Premium:</h3>
              <ul>
                <li>✅ Unlimited file compressions</li>
                <li>✅ No file size restrictions</li>
                <li>✅ Priority processing</li>
                <li>✅ Advanced compression settings</li>
                <li>✅ Batch download capabilities</li>
              </ul>

              <p>Start enjoying your premium benefits right away! Head over to the compression tool and upload files of any size.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Subscription ID: ${details.subscriptionId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendInvoiceEmail(email: string, firstName: string, details: InvoiceDetails): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `Invoice ${details.invoiceNumber} - Payment Received`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .invoice-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { 
              display: inline-block; 
              background: #2563eb; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            .success { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received ✅</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p class="success">Your payment has been successfully processed. Thank you for your subscription!</p>
              
              <div class="invoice-box">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${details.invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> ${details.amount}</p>
                <p><strong>Payment Date:</strong> ${details.paidDate.toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${details.description}</p>
                <p><strong>Service Period:</strong> ${details.period.start.toLocaleDateString()} - ${details.period.end.toLocaleDateString()}</p>
              </div>

              ${details.invoiceUrl ? `
                <p style="text-align: center;">
                  <a href="${details.invoiceUrl}" class="button">View Full Invoice</a>
                </p>
              ` : ''}

              <p>This payment confirms your premium subscription for the current billing period. Your premium features remain active.</p>
              
              <p>If you have any questions about this payment or your subscription, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Invoice: ${details.invoiceNumber}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendPaymentConfirmation(email: string, firstName: string, details: PaymentDetails): Promise<boolean> {
    // Check if this is a credit purchase
    const isCredits = details.credits && details.credits > 0;
    
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: isCredits ? `🎉 ${details.credits} Credits Added to Your Account!` : 'Payment Confirmation - Thank You!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${isCredits ? 'Credits Purchase Confirmation' : 'Payment Confirmation'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isCredits ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#059669'}; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .payment-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .credits-highlight { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .credit-count { font-size: 36px; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            .success { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isCredits ? '🎉 Credits Purchased!' : '✅ Payment Successful'}</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p class="success">Your payment has been successfully processed!</p>
              
              ${isCredits ? `
                <div class="credits-highlight">
                  <h3>🚀 Credits Added to Your Account</h3>
                  <div class="credit-count">${details.credits}</div>
                  <p>Credits are now available for image compression</p>
                </div>
              ` : ''}
              
              <div class="payment-box">
                <h3>Payment Details</h3>
                <p><strong>Amount:</strong> ${details.amount}</p>
                ${isCredits ? `<p><strong>Credits Purchased:</strong> ${details.credits}</p>` : ''}
                <p><strong>Payment Date:</strong> ${details.paymentDate.toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${details.paymentMethod}</p>
                <p><strong>Transaction ID:</strong> ${details.transactionId}</p>
              </div>

              ${isCredits ? `
                <h3>How to Use Your Credits</h3>
                <ul>
                  <li>💡 1 credit = 1 MB of image processing</li>
                  <li>📁 Smaller files use fewer credits automatically</li>
                  <li>♾️ Credits never expire</li>
                  <li>🔄 Use them across all our compression tools</li>
                </ul>
                
                <p>Start compressing images now with your new credits!</p>
              ` : `
                <p>Your premium subscription is now active and you can start enjoying unlimited file compression with no size restrictions.</p>
              `}
              
              <p>Thank you for choosing Micro JPEG!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Transaction: ${details.transactionId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendSubscriptionCancellation(email: string, firstName: string): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: 'Subscription Cancelled - We\'re Sorry to See You Go',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Subscription Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We're sorry to see you go! Your premium subscription has been successfully cancelled.</p>
              
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Your premium features will remain active until the end of your current billing period</li>
                <li>No future charges will be made to your payment method</li>
                <li>You can continue using the free version with 10MB file size limits</li>
                <li>You can resubscribe at any time to regain premium benefits</li>
              </ul>
              
              <p>If you cancelled by mistake or would like to provide feedback about your experience, please don't hesitate to contact our support team.</p>
              
              <p>Thank you for being a premium member. We hope to see you again in the future!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendUsageLimitWarning(email: string, firstName: string, usagePercent: number, tierName: string): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `⚠️ You've used ${usagePercent}% of your daily limit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Usage Limit Warning</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .upgrade-box { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { 
              display: inline-block; 
              background: #3b82f6; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px 0;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Daily Limit Warning</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>You've used <strong>${usagePercent}%</strong> of your daily compression limit on your ${tierName} plan.</p>
              
              <div class="warning-box">
                <h3>⏰ Running Low on Compressions</h3>
                <p>You're approaching your daily limit. Your usage resets at midnight automatically.</p>
              </div>

              <div class="upgrade-box">
                <h3>🚀 Need More Compressions?</h3>
                <p>Upgrade to Premium for 50 daily compressions + unlimited format conversions!</p>
                <a href="#" class="button">Upgrade to Premium</a>
              </div>

              <p><strong>Current Plan Benefits:</strong></p>
              <ul>
                <li>20 compressions per day (Free)</li>
                <li>3 format conversions per day</li>
                <li>Resets daily at midnight</li>
              </ul>
              
              <p>Keep compressing with confidence!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendTierUpgradePromo(email: string, firstName: string, currentTier: string, suggestedTier: string): Promise<boolean> {
    const promoData = {
      premium: {
        features: ['50 daily compressions', 'Unlimited conversions', 'Advanced settings', 'AI recommendations', 'SVG support'],
        price: '$9.99/month',
        savings: 'Save 2 months with yearly billing!'
      },
      business: {
        features: ['150 daily compressions', 'All formats (TIFF, RAW)', 'Priority processing', '15MB file limit'],
        price: '$29.99/month',
        savings: 'Perfect for teams and businesses!'
      },
      enterprise: {
        features: ['Unlimited everything', 'Full API access', 'No daily limits', '24/7 support'],
        price: '$99.99/month',
        savings: 'Built for developers and high-volume users!'
      }
    };

    const promo = promoData[suggestedTier as keyof typeof promoData] || promoData.premium;

    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `🚀 Ready to upgrade to ${suggestedTier}? Special offer inside!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Upgrade Your Plan</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .upgrade-box { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .feature-list { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .button { 
              display: inline-block; 
              background: #fbbf24; 
              color: #1f2937; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 15px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            .price { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Ready for More Power?</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>You've been making great use of your ${currentTier} plan! Ready to unlock even more compression power?</p>
              
              <div class="upgrade-box">
                <h3>✨ ${suggestedTier.toUpperCase()} PLAN</h3>
                <div class="price">${promo.price}</div>
                <p>${promo.savings}</p>
                <a href="#" class="button">Upgrade Now</a>
              </div>

              <div class="feature-list">
                <h3>What you'll get with ${suggestedTier}:</h3>
                <ul>
                  ${promo.features.map(feature => `<li>✅ ${feature}</li>`).join('')}
                </ul>
              </div>
              
              <p>Join thousands of users who've upgraded for unlimited compression power!</p>
              
              <p><small>Questions? Reply to this email and our team will help you choose the perfect plan.</small></p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Don't want promotional emails? <a href="#">Unsubscribe here</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendPaymentFailureNotification(email: string, firstName: string, planName: string, nextRetryDate?: Date): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: '⚠️ Payment Failed - Update Your Payment Method',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .warning-box { background: #fee2e2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .action-box { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { 
              display: inline-block; 
              background: #fbbf24; 
              color: #1f2937; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 10px 0;
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Issue</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We had trouble processing your payment for your ${planName} subscription.</p>
              
              <div class="warning-box">
                <h3>⚠️ Action Required</h3>
                <p>Your premium features may be suspended if payment isn't updated soon.</p>
                ${nextRetryDate ? `<p><strong>Next retry:</strong> ${nextRetryDate.toLocaleDateString()}</p>` : ''}
              </div>

              <div class="action-box">
                <h3>🔧 Fix This Now</h3>
                <p>Update your payment method to keep your premium benefits active.</p>
                <a href="#" class="button">Update Payment Method</a>
              </div>

              <p><strong>Common reasons for payment failure:</strong></p>
              <ul>
                <li>Expired credit card</li>
                <li>Insufficient funds</li>
                <li>Card was declined by bank</li>
                <li>Billing address mismatch</li>
              </ul>
              
              <p>Need help? Contact our support team and we'll assist you right away.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendDailyUsageReport(email: string, firstName: string, stats: { compressions: number; conversions: number; planName: string }): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `📊 Your daily compression report - ${stats.compressions} files processed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Usage Report</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .stats-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stat-item { display: inline-block; text-align: center; margin: 10px 20px; }
            .stat-number { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 14px; color: #6b7280; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Report</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Here's your compression activity summary for today:</p>
              
              <div class="stats-box">
                <h3>Today's Activity</h3>
                <div style="text-align: center;">
                  <div class="stat-item">
                    <div class="stat-number">${stats.compressions}</div>
                    <div class="stat-label">Compressions</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${stats.conversions}</div>
                    <div class="stat-label">Format Conversions</div>
                  </div>
                </div>
                <p style="text-align: center; margin-top: 20px;">
                  <strong>Plan:</strong> ${stats.planName}
                </p>
              </div>
              
              <p>Great job optimizing your images! Your usage resets at midnight for another day of compression power.</p>
              
              ${stats.planName === 'Free' ? `
                <p style="background: #dbeafe; padding: 15px; border-radius: 8px;">
                  💡 <strong>Tip:</strong> Upgrade to Premium for 50 daily compressions and unlimited format conversions!
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: 'Welcome to JPEG Compressor!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Micro JPEG</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">PICTURE PERFECT</div>
              <h2 style="margin-top: 15px; font-size: 20px;">Welcome!</h2>
            </div>
            <div class="content">
              <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
              <p>Welcome to Micro JPEG! Your email has been verified and your account is now active.</p>
              
              <p><strong>What you can do with Free tier:</strong></p>
              <ul>
                <li>✅ 20 compressions per day</li>
                <li>✅ 3 format conversions per day</li>
                <li>✅ Upload files up to 5MB each</li>
                <li>✅ All basic formats (JPEG, PNG, WebP, AVIF)</li>
                <li>✅ Daily reset at midnight</li>
              </ul>
              
              <p><strong>Want more power?</strong> Upgrade to Premium for 50 daily compressions, unlimited conversions, and advanced features for just $9.99/month!</p>
              
              <p>Start compressing your images today and experience professional-quality optimization!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  // ===== CREDIT-SPECIFIC EMAIL NOTIFICATIONS =====

  async sendCreditLowWarning(email: string, firstName: string, remainingCredits: number, severity: 'warning' | 'urgent' | 'critical'): Promise<boolean> {
    const colors = {
      warning: { bg: '#f59e0b', border: '#f59e0b', text: '⚠️' },
      urgent: { bg: '#ef4444', border: '#ef4444', text: '🚨' },
      critical: { bg: '#dc2626', border: '#dc2626', text: '❌' }
    };
    
    const config = colors[severity];
    const subjectText = severity === 'critical' ? 'Out of Credits' : `${severity === 'urgent' ? 'Urgent' : ''} Low Credits Alert`;
    
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `${config.text} ${subjectText} - ${remainingCredits} Credits Remaining`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Credit Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${config.bg}; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .alert-box { background: white; border: 2px solid ${config.border}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .credit-count { font-size: 48px; font-weight: bold; color: ${config.bg}; margin: 10px 0; }
            .packages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .package-card { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
            .package-card.best-value { border: 2px solid #3b82f6; background: linear-gradient(135deg, #eff6ff, #dbeafe); }
            .button { 
              display: inline-block; 
              background: #3b82f6; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 10px 0;
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.text} Credit Alert</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>${severity === 'critical' 
                ? 'You\'ve run out of credits and cannot compress more images.' 
                : `You're running low on credits. You have ${remainingCredits} credits remaining.`}</p>
              
              <div class="alert-box">
                <h3>${severity === 'critical' ? 'No Credits Remaining' : 'Credits Running Low'}</h3>
                <div class="credit-count">${remainingCredits}</div>
                <p>Credits left in your account</p>
              </div>

              <h3>💳 Buy More Credits - Instant Delivery</h3>
              <div class="packages-grid">
                <div class="package-card">
                  <h4>Starter Pack</h4>
                  <p><strong>200 Credits</strong></p>
                  <p>$5.00</p>
                  <p>2.5¢ per credit</p>
                </div>
                <div class="package-card best-value">
                  <h4>Popular Pack</h4>
                  <p><strong>500 Credits</strong></p>
                  <p>$9.00</p>
                  <p>1.8¢ per credit</p>
                  <p style="color: #3b82f6; font-weight: bold;">💎 Best Value</p>
                </div>
                <div class="package-card">
                  <h4>Pro Pack</h4>
                  <p><strong>3000 Credits</strong></p>
                  <p>$49.00</p>
                  <p>1.6¢ per credit</p>
                </div>
                <div class="package-card">
                  <h4>Business Pack</h4>
                  <p><strong>15000 Credits</strong></p>
                  <p>$199.00</p>
                  <p>1.3¢ per credit</p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="/buy-credits" class="button">Buy Credits Now</a>
              </div>

              <h3>💡 Why Credits?</h3>
              <ul>
                <li>♾️ Credits never expire</li>
                <li>💡 1 credit = 1 MB of processing</li>
                <li>📁 Smaller files use fewer credits automatically</li>
                <li>🚀 Instant delivery - use credits immediately</li>
              </ul>
              
              <p>Thank you for using Micro JPEG!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendLeadMagnetGuide(email: string, firstName?: string): Promise<boolean> {
    // Force the correct verified email until environment variable is fixed
    const fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
    
    const emailContent: EmailConfig = {
      from: fromEmail,
      to: email,
      subject: 'Your Free Credits and Image Optimization Guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Your Free Credits + Image Optimization Guide</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 0 auto; padding: 15px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8, #7c3aed); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo-img { max-width: 80px; height: auto; margin-bottom: 5px; }
            .brand-text { font-size: 20px; font-weight: bold; margin: 5px 0; }
            .tagline { font-size: 12px; opacity: 0.9; margin: 0; }
            .content { background: #f9fafb; padding: 25px; }
            .credits-highlight { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .credit-count { font-size: 32px; font-weight: bold; margin: 10px 0; }
            .guide-section { background: white; border: 1px solid #e5e7eb; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .guide-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .guide-column { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; }
            .tip-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .pro-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; background: white; border-radius: 0 0 8px 8px; }
            h3 { color: #1e40af; margin-top: 0; }
            h4 { color: #374151; margin-bottom: 10px; }
            ul, ol { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
            .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .feature-item { background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">PICTURE PERFECT</div>
              <h2 style="margin-top: 15px; font-size: 20px;">Welcome to Micro JPEG!</h2>
            </div>
            <div class="content">
              <h2>Hello${firstName ? ` ${firstName}` : ''}!</h2>
              <p>Welcome to our exclusive community! Here's your promised gift:</p>
              
              <div class="credits-highlight">
                <h3>1000 Free Credits Added!</h3>
                <div class="credit-count">1000</div>
                <p>Worth $25 - Ready to use immediately</p>
              </div>
              
              <div class="guide-section">
                <h3>📚 Complete Image Optimization Guide</h3>
                <p>Master image compression with our comprehensive guide. Save bandwidth, improve loading times, and reduce storage costs.</p>
                
                <div class="guide-grid">
                  <div class="guide-column">
                    <h4>🎯 Quick Start Process</h4>
                    <ol>
                      <li><strong>Upload Images</strong><br>Drag & drop or browse up to 20 files</li>
                      <li><strong>Choose Settings</strong><br>Quality, format, and resize options</li>
                      <li><strong>Smart Compress</strong><br>AI-powered lossless optimization</li>
                      <li><strong>Download Results</strong><br>Individual files or batch ZIP</li>
                    </ol>
                  </div>
                  
                  <div class="guide-column">
                    <h4>⚙️ Quality Settings</h4>
                    <ul>
                      <li><strong>High (85%)</strong><br>Professional quality, 60-70% smaller</li>
                      <li><strong>Standard (75%)</strong><br>Recommended balance, 70-80% smaller</li>
                      <li><strong>Small (60%)</strong><br>Web optimized, 80-85% smaller</li>
                      <li><strong>Tiny (45%)</strong><br>Maximum compression, 85-90% smaller</li>
                    </ul>
                  </div>
                </div>
                
                <h4>📁 Format Guide & When to Use Each</h4>
                <div class="feature-grid">
                  <div class="feature-item">
                    <strong>JPEG/JPG</strong><br>
                    Perfect for: Photos, complex images<br>
                    Compression: 70-90% smaller<br>
                    Best for: Photography, artwork
                  </div>
                  <div class="feature-item">
                    <strong>PNG</strong><br>
                    Perfect for: Graphics with transparency<br>
                    Compression: 50-80% smaller<br>
                    Best for: Logos, icons, screenshots
                  </div>
                  <div class="feature-item">
                    <strong>WebP</strong><br>
                    Perfect for: Modern web applications<br>
                    Compression: 80-95% smaller than JPEG<br>
                    Best for: Website images, e-commerce
                  </div>
                  <div class="feature-item">
                    <strong>AVIF</strong><br>
                    Perfect for: Next-gen web optimization<br>
                    Compression: 90-95% smaller than JPEG<br>
                    Best for: Progressive web apps, CDNs
                  </div>
                </div>
                
                <div class="tip-box">
                  <h4>💡 Pro Tips for Maximum Savings</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                      <strong>Batch Processing:</strong><br>
                      • Upload multiple files simultaneously<br>
                      • Apply same settings to all images<br>
                      • Download as convenient ZIP archive<br>
                      • Process up to 20 images at once
                    </div>
                    <div>
                      <strong>Format Selection:</strong><br>
                      • Use WebP for 30% better compression<br>
                      • Choose AVIF for cutting-edge optimization<br>
                      • Stick with JPEG for maximum compatibility<br>
                      • Use PNG only when transparency needed
                    </div>
                  </div>
                </div>
                
                <div class="pro-section">
                  <h4>🚀 Advanced Optimization Strategies</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                    <div>
                      <strong>E-commerce Optimization:</strong><br>
                      • Product photos: 75% quality JPEG<br>
                      • Thumbnails: 60% quality for fast loading<br>
                      • Hero images: WebP format for 40% savings<br>
                      • Mobile optimization: Resize to 800px width
                    </div>
                    <div>
                      <strong>Website Performance:</strong><br>
                      • Above-fold images: High priority compression<br>
                      • Background images: Aggressive compression OK<br>
                      • Gallery images: Progressive JPEG loading<br>
                      • CDN optimization: Use modern formats
                    </div>
                  </div>
                </div>
                
                <h4>💼 Business Impact & ROI</h4>
                <div class="feature-grid">
                  <div class="feature-item">
                    <strong>Cost Savings</strong><br>
                    Save $500+ monthly on processing<br>
                    Reduce storage costs by 80%<br>
                    Lower bandwidth expenses
                  </div>
                  <div class="feature-item">
                    <strong>Performance Gains</strong><br>
                    3x faster page loading times<br>
                    Better SEO rankings<br>
                    Improved user experience
                  </div>
                  <div class="feature-item">
                    <strong>Technical Benefits</strong><br>
                    API integration ready<br>
                    Bulk processing capabilities<br>
                    Multiple output formats
                  </div>
                  <div class="feature-item">
                    <strong>Quality Assurance</strong><br>
                    Lossless compression algorithms<br>
                    Visual quality preservation<br>
                    Professional-grade results
                  </div>
                </div>
              </div>
              
              <h3>Your Benefits</h3>
              <ul>
                <li>✅ 1000 FREE compression credits ($25 value)</li>
                <li>✅ Priority email support</li>
                <li>✅ Early access to new features</li>
                <li>✅ Exclusive optimization tips</li>
              </ul>
              
              <p><strong>Start using your credits now!</strong> Head to our compression tool and begin optimizing your images.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Questions? Reply to this email - we're here to help!</p>
              <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px;">
                <a href="mailto:compressjpg@microjpeg.com?subject=Unsubscribe%20Request&body=Please%20unsubscribe%20${email}" 
                   style="color: #666; text-decoration: underline;">
                  Unsubscribe from future emails
                </a> | 
                <a href="mailto:compressjpg@microjpeg.com" style="color: #666; text-decoration: underline;">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendCreditPurchaseReceipt(email: string, firstName: string, details: {
    packageName: string;
    credits: number;
    amount: string;
    transactionId: string;
    pricePerCredit: string;
  }): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `Receipt: ${details.credits} Credits Purchased - ${details.packageName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Credit Purchase Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .logo-img { max-width: 120px; height: auto; margin-bottom: 10px; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: #f9fafb; padding: 30px; }
            .receipt-box { background: white; border: 1px solid #e5e7eb; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .receipt-header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
            .receipt-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .receipt-total { display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #e5e7eb; margin-top: 15px; font-weight: bold; font-size: 18px; }
            .credits-highlight { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .credit-count { font-size: 36px; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">PICTURE PERFECT</div>
              <h2 style="margin-top: 15px; font-size: 20px;">📄 Purchase Receipt</h2>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Thank you for your credit purchase! Here's your receipt:</p>
              
              <div class="credits-highlight">
                <h3>🎉 Credits Added to Your Account</h3>
                <div class="credit-count">${details.credits}</div>
                <p>Ready to use for image compression</p>
              </div>
              
              <div class="receipt-box">
                <div class="receipt-header">
                  <h3>🧾 Receipt Details</h3>
                  <p>Transaction ID: ${details.transactionId}</p>
                </div>
                
                <div class="receipt-line">
                  <span>Package:</span>
                  <span><strong>${details.packageName}</strong></span>
                </div>
                <div class="receipt-line">
                  <span>Credits:</span>
                  <span><strong>${details.credits} credits</strong></span>
                </div>
                <div class="receipt-line">
                  <span>Price per credit:</span>
                  <span>${details.pricePerCredit}</span>
                </div>
                <div class="receipt-line">
                  <span>Purchase date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                
                <div class="receipt-total">
                  <span>Total Paid:</span>
                  <span>${details.amount}</span>
                </div>
              </div>

              <h3>💡 Using Your Credits</h3>
              <ul>
                <li>🖼️ Credits are automatically used when compressing images</li>
                <li>📏 1 credit = 1 MB of image processing</li>
                <li>💾 Smaller files use proportionally fewer credits</li>
                <li>♾️ Credits never expire - use them anytime</li>
              </ul>
              
              <p>Start compressing your images now with your new credits!</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Receipt ID: ${details.transactionId}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendPaymentFailureForCredits(email: string, firstName: string, packageName: string, amount: string): Promise<boolean> {
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: '❌ Credit Purchase Failed - Try Again',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .error-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .retry-box { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { 
              display: inline-block; 
              background: #fbbf24; 
              color: #1f2937; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 10px 0;
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Payment Failed</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>We encountered an issue processing your payment for ${packageName} (${amount}).</p>
              
              <div class="error-box">
                <h3>⚠️ Payment Not Processed</h3>
                <p>Your credit card was not charged and no credits were added to your account.</p>
              </div>

              <div class="retry-box">
                <h3>🔄 Try Again</h3>
                <p>Most payment issues are easily resolved. Try your purchase again:</p>
                <a href="/buy-credits" class="button">Retry Purchase</a>
              </div>

              <h3>💡 Common Solutions</h3>
              <ul>
                <li>🔍 Check your card details are correct</li>
                <li>💳 Ensure your card has sufficient funds</li>
                <li>🌍 Verify your card works for international payments</li>
                <li>📞 Contact your bank if the issue persists</li>
              </ul>
              
              <p>Need help? Reply to this email and our support team will assist you.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  // Professional Format Section Email Methods
  async sendSpecialFormatConversionComplete(email: string, firstName: string, conversionDetails: {
    filesProcessed: number;
    originalFormats: string[];
    outputFormat: string;
    totalOriginalSize: number;
    totalConvertedSize: number;
    conversionTypes: string[];
    isTrialUser: boolean;
    trialRemaining?: number;
  }): Promise<boolean> {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const savings = ((conversionDetails.totalOriginalSize - conversionDetails.totalConvertedSize) / conversionDetails.totalOriginalSize * 100).toFixed(1);
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';

    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpeg.com>',
      to: email,
      subject: `🎉 Professional Format Conversion Complete - ${conversionDetails.filesProcessed} files processed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Format Conversion Complete</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0;
            }
            .logo-container { text-align: center; margin-bottom: 15px; }
            .logo-img { max-width: 120px; height: auto; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .tagline { font-size: 14px; opacity: 0.9; }
            .content { background: #f8fafc; padding: 30px; }
            .success-box { 
              background: linear-gradient(135deg, #10b981, #059669); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin: 20px 0; 
            }
            .stat-card { 
              background: white; 
              border: 1px solid #e2e8f0; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center; 
            }
            .stat-number { font-size: 24px; font-weight: bold; color: #14b8a6; }
            .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; }
            .conversion-list { 
              background: white; 
              border: 1px solid #e2e8f0; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
            }
            .trial-warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 10px 5px;
              font-weight: bold;
            }
            .button-secondary { 
              background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                ${this.logoAttachment ? '<img src="cid:microjpeg-logo" alt="Micro JPEG" class="logo-img" />' : ''}
                <div class="brand-text">Micro JPEG</div>
                <div class="tagline">Professional Format Conversions</div>
              </div>
              <h1>✨ Conversion Complete!</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Great news! Your professional format conversion has been completed successfully.</p>
              
              <div class="success-box">
                <h3>🎯 Mission Accomplished!</h3>
                <p>We've processed <strong>${conversionDetails.filesProcessed} files</strong> with our advanced conversion engine.</p>
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${conversionDetails.filesProcessed}</div>
                  <div class="stat-label">Files Processed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${savings}%</div>
                  <div class="stat-label">Size Reduction</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${formatFileSize(conversionDetails.totalOriginalSize)}</div>
                  <div class="stat-label">Original Size</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${formatFileSize(conversionDetails.totalConvertedSize)}</div>
                  <div class="stat-label">Final Size</div>
                </div>
              </div>

              <div class="conversion-list">
                <h3>📋 Conversion Summary</h3>
                <p><strong>Input Formats:</strong> ${conversionDetails.originalFormats.join(', ')}</p>
                <p><strong>Output Format:</strong> ${conversionDetails.outputFormat.toUpperCase()}</p>
                <p><strong>Conversion Types:</strong> ${conversionDetails.conversionTypes.join(', ')}</p>
                <p><strong>Processing Engine:</strong> Advanced ImageMagick with professional optimizations</p>
              </div>

              ${conversionDetails.isTrialUser ? `
                <div class="trial-warning">
                  <h3>⏰ Trial Status</h3>
                  <p>You have <strong>${conversionDetails.trialRemaining || 0} conversions</strong> remaining in your free trial.</p>
                  <p>Upgrade to premium for unlimited professional format conversions!</p>
                  <a href="${baseUrl}/pricing" class="button">Upgrade to Premium</a>
                </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/special-formats" class="button">Convert More Files</a>
                <a href="${baseUrl}" class="button button-secondary">Standard Compression</a>
              </div>

              <p><strong>Professional Features Available:</strong></p>
              <ul>
                <li>📸 RAW file processing (CR2, ARW, NEF, DNG)</li>
                <li>🎨 Vector format conversion (SVG)</li>
                <li>🖨️ Print-ready TIFF processing</li>
                <li>⚡ Advanced quality controls</li>
                <li>🔧 Custom resize options</li>
              </ul>
              
              <p>Thank you for choosing Micro JPEG for your professional image processing needs!</p>
            </div>
            
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression and conversion tools.</p>
              <p>Need help? Contact our support team anytime.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendSpecialFormatTrialExhausted(email: string, firstName: string): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';

    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpeg.com>',
      to: email,
      subject: '⚠️ Professional Format Trial Exhausted - Upgrade for Unlimited Access',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Format Trial Exhausted</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0;
            }
            .content { background: #f8fafc; padding: 30px; }
            .trial-expired-box { 
              background: #fef3c7; 
              border: 2px solid #f59e0b; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .upgrade-box { 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .features-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin: 20px 0; 
            }
            .feature-card { 
              background: white; 
              border: 1px solid #e2e8f0; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 15px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Trial Limit Reached</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>You've used all 5 conversions in your professional format trial. We hope you enjoyed experiencing our advanced conversion capabilities!</p>
              
              <div class="trial-expired-box">
                <h3>🚀 Ready to Go Pro?</h3>
                <p><strong>Your trial has ended, but the power doesn't have to!</strong></p>
                <p>Upgrade to premium for unlimited professional format conversions.</p>
              </div>

              <div class="upgrade-box">
                <h3>💎 Premium Benefits</h3>
                <p>Unlock unlimited access to all professional features!</p>
                <a href="${baseUrl}/pricing" class="button" style="background: #fbbf24; color: #1f2937;">Upgrade Now</a>
              </div>

              <div class="features-grid">
                <div class="feature-card">
                  <h4>📸 RAW Processing</h4>
                  <p>CR2, ARW, NEF, DNG</p>
                </div>
                <div class="feature-card">
                  <h4>🎨 Vector Conversion</h4>
                  <p>SVG to raster formats</p>
                </div>
                <div class="feature-card">
                  <h4>🖨️ TIFF Processing</h4>
                  <p>Print-ready optimization</p>
                </div>
                <div class="feature-card">
                  <h4>⚡ Advanced Controls</h4>
                  <p>Quality & resize options</p>
                </div>
              </div>

              <p><strong>What you get with Premium:</strong></p>
              <ul>
                <li>✅ Unlimited professional format conversions</li>
                <li>✅ No file size limits (vs 25MB trial limit)</li>
                <li>✅ Priority processing queue</li>
                <li>✅ Advanced quality controls</li>
                <li>✅ Custom resize & aspect ratio options</li>
                <li>✅ Batch processing capabilities</li>
                <li>✅ Professional customer support</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/pricing" class="button">View Pricing Plans</a>
              </div>
              
              <p>You can still use our standard compression tools for JPG, PNG, WebP, and AVIF files with no limits!</p>
              
              <p>Questions about upgrading? Reply to this email and our team will help you choose the perfect plan.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression and conversion tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  async sendSpecialFormatTrialWarning(email: string, firstName: string, usedCount: number, totalLimit: number): Promise<boolean> {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
    const remaining = totalLimit - usedCount;

    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpeg.com>',
      to: email,
      subject: `⚠️ Professional Format Trial - ${remaining} conversions remaining`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Format Trial Warning</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0;
            }
            .content { background: #f8fafc; padding: 30px; }
            .warning-box { 
              background: #fef3c7; 
              border: 2px solid #f59e0b; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .upgrade-box { 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .progress-bar { 
              background: #e5e7eb; 
              height: 20px; 
              border-radius: 10px; 
              margin: 15px 0; 
              overflow: hidden; 
            }
            .progress-fill { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              height: 100%; 
              width: ${(usedCount / totalLimit) * 100}%; 
              border-radius: 10px; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0f766e); 
              color: white; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 15px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Trial Usage Warning</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>You're getting close to your professional format conversion limit. Make the most of your remaining conversions!</p>
              
              <div class="warning-box">
                <h3>📊 Trial Status</h3>
                <p><strong>${usedCount} of ${totalLimit}</strong> conversions used</p>
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <p><strong>${remaining} conversions remaining</strong></p>
              </div>

              <div class="upgrade-box">
                <h3>🚀 Want Unlimited Access?</h3>
                <p>Upgrade to premium before your trial ends and get unlimited professional format conversions!</p>
                <a href="${baseUrl}/pricing" class="button" style="background: #fbbf24; color: #1f2937;">Upgrade Now</a>
              </div>

              <p><strong>What you can still do:</strong></p>
              <ul>
                <li>📸 Convert ${remaining} more RAW files (CR2, ARW, NEF, DNG)</li>
                <li>🎨 Process ${remaining} more SVG vector files</li>
                <li>🖨️ Optimize ${remaining} more TIFF print files</li>
                <li>⚡ Use advanced quality controls</li>
                <li>🔧 Apply custom resize options</li>
              </ul>

              <p><strong>Premium Benefits:</strong></p>
              <ul>
                <li>✅ Unlimited professional format conversions</li>
                <li>✅ No file size limits (vs 25MB trial limit)</li>
                <li>✅ Priority processing queue</li>
                <li>✅ Advanced batch processing</li>
                <li>✅ Professional customer support</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/special-formats" class="button">Continue Converting</a>
              </div>
              
              <p>Your trial resets when you start a new browser session. You can still use our standard compression tools for JPG, PNG, WebP, and AVIF files with no limits!</p>
            </div>
            
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression and conversion tools.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailContent);
  }

  // === STANDARD FORMAT EMAIL METHODS ===
  
  async sendStandardCompressionComplete(email: string, userName: string = 'User', stats: {
    filesProcessed: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    qualityLevel: number;
    processingTime: number;
    filenames: string[];
    sizeSavings: string;
  }): Promise<boolean> {
    const fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    const emailContent: EmailConfig = {
      from: fromEmail,
      to: email,
      subject: `✅ ${stats.filesProcessed} Image${stats.filesProcessed > 1 ? 's' : ''} Compressed Successfully - ${stats.sizeSavings} Saved!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Compression Complete</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0; 
            }
            .logo-img { max-width: 120px; height: auto; margin-bottom: 10px; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: #f9fafb; padding: 30px; }
            .success-box { 
              background: linear-gradient(135deg, #10b981, #059669); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 20px 0; 
              text-align: center;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin: 20px 0;
            }
            .stat-item { 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              border: 1px solid #e5e7eb;
              text-align: center;
            }
            .stat-number { 
              font-size: 24px; 
              font-weight: bold; 
              color: #14b8a6;
              margin-bottom: 5px;
            }
            .compression-bar { 
              background: #e5e7eb; 
              height: 20px; 
              border-radius: 10px; 
              overflow: hidden; 
              margin: 15px 0;
            }
            .compression-fill { 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              height: 100%; 
              border-radius: 10px;
            }
            .file-list { 
              background: white; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0;
            }
            .upgrade-hint { 
              background: #f0f9ff; 
              border: 1px solid #0ea5e9; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 12px 25px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 10px 5px;
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            @media (max-width: 600px) {
              .stats-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">PICTURE PERFECT COMPRESSION</div>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="success-box">
                <h3>🎉 Compression Complete!</h3>
                <p><strong>${stats.filesProcessed} image${stats.filesProcessed > 1 ? 's' : ''} compressed successfully</strong></p>
                <p>You saved <strong>${stats.sizeSavings}</strong> in file size!</p>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-number">${formatBytes(stats.totalOriginalSize)}</div>
                  <div>Original Size</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${formatBytes(stats.totalCompressedSize)}</div>
                  <div>Compressed Size</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${stats.averageCompressionRatio}%</div>
                  <div>Size Reduction</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${stats.qualityLevel}%</div>
                  <div>Quality Level</div>
                </div>
              </div>

              <div>
                <h3>📊 Compression Performance</h3>
                <div class="compression-bar">
                  <div class="compression-fill" style="width: ${stats.averageCompressionRatio}%;"></div>
                </div>
                <p><strong>${stats.averageCompressionRatio}% smaller</strong> than original files while maintaining ${stats.qualityLevel}% quality</p>
              </div>

              ${stats.filenames.length > 0 ? `
              <div class="file-list">
                <h3>📁 Processed Files</h3>
                <ul>
                  ${stats.filenames.slice(0, 5).map(filename => `<li><strong>${filename}</strong></li>`).join('')}
                  ${stats.filenames.length > 5 ? `<li><em>...and ${stats.filenames.length - 5} more files</em></li>` : ''}
                </ul>
              </div>
              ` : ''}

              <div class="upgrade-hint">
                <h3>💡 Need More Compression Power?</h3>
                <p><strong>Upgrade to Premium for:</strong></p>
                <ul>
                  <li>♾️ Unlimited daily compressions</li>
                  <li>📁 No file size restrictions (currently 10MB limit)</li>
                  <li>⚡ Priority processing speeds</li>
                  <li>🎯 Advanced compression algorithms</li>
                  <li>📦 Batch ZIP downloads</li>
                </ul>
                <a href="https://micro-jpeg.replit.app/pricing" class="button">View Premium Plans</a>
              </div>
              
              <p>Thank you for using Micro JPEG! We hope you're satisfied with the compression results.</p>
              
              <p><em>Processing completed in ${stats.processingTime} seconds</em></p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Continue compressing at <a href="https://micro-jpeg.replit.app">micro-jpeg.replit.app</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`Sending standard compression complete email to: ${email}`);
    const success = await this.sendEmail(emailContent);
    if (success) {
      console.log(`✓ Standard compression complete email sent successfully to ${email}`);
    } else {
      console.error(`✗ Failed to send standard compression complete email to ${email}`);
    }
    return success;
  }

  async sendDailyLimitWarning(email: string, userName: string = 'User', usageInfo: {
    used: number;
    limit: number;
    percentage: number;
    remainingHours: number;
  }): Promise<boolean> {
    const fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
    
    const emailContent: EmailConfig = {
      from: fromEmail,
      to: email,
      subject: `⚠️ Daily Limit Warning - ${usageInfo.used}/${usageInfo.limit} Compressions Used (${usageInfo.percentage}%)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Limit Warning</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0; 
            }
            .logo-img { max-width: 120px; height: auto; margin-bottom: 10px; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: #f9fafb; padding: 30px; }
            .warning-box { 
              background: #fef3c7; 
              border: 2px solid #f59e0b; 
              padding: 20px; 
              border-radius: 12px; 
              margin: 20px 0;
            }
            .usage-bar { 
              background: #e5e7eb; 
              height: 25px; 
              border-radius: 12px; 
              overflow: hidden; 
              margin: 15px 0;
            }
            .usage-fill { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              height: 100%; 
              border-radius: 12px;
              position: relative;
            }
            .usage-text { 
              position: absolute; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%); 
              color: white; 
              font-weight: bold; 
              font-size: 14px;
            }
            .upgrade-box { 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0; 
              text-align: center;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 15px 10px;
              font-weight: bold;
              box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);
            }
            .features-list { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin: 15px 0;
            }
            .feature-item { color: white; }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            .countdown { 
              background: #f3f4f6; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center; 
              margin: 15px 0;
            }
            @media (max-width: 600px) {
              .features-list { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">DAILY USAGE NOTIFICATION</div>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="warning-box">
                <h3>⚠️ Daily Limit Warning</h3>
                <p>You've used <strong>${usageInfo.used} out of ${usageInfo.limit}</strong> daily compressions (${usageInfo.percentage}%)</p>
                
                <div class="usage-bar">
                  <div class="usage-fill" style="width: ${usageInfo.percentage}%;">
                    <div class="usage-text">${usageInfo.used}/${usageInfo.limit}</div>
                  </div>
                </div>
                
                <p>You have <strong>${usageInfo.limit - usageInfo.used} compressions remaining</strong> today.</p>
              </div>

              <div class="countdown">
                <h3>⏰ Usage Resets In</h3>
                <p><strong>${usageInfo.remainingHours} hours</strong> until your daily limit refreshes</p>
              </div>

              <div class="upgrade-box">
                <h3>🚀 Need Unlimited Compressions?</h3>
                <p><strong>Upgrade to Premium and get:</strong></p>
                <div class="features-list">
                  <div class="feature-item">♾️ Unlimited daily compressions</div>
                  <div class="feature-item">📁 No 10MB file size limit</div>
                  <div class="feature-item">⚡ Priority processing speeds</div>
                  <div class="feature-item">🎯 Advanced compression controls</div>
                  <div class="feature-item">📦 Batch ZIP downloads</div>
                  <div class="feature-item">💎 Premium format conversions</div>
                </div>
                
                <a href="https://micro-jpeg.replit.app/pricing" class="button">View Premium Plans</a>
                <a href="https://micro-jpeg.replit.app/api/login" class="button">Sign In to Upgrade</a>
              </div>

              <h3>💡 Ways to Optimize Usage</h3>
              <ul>
                <li><strong>Batch Process:</strong> Upload multiple images at once to save compressions</li>
                <li><strong>Optimize Settings:</strong> Use our smart quality presets for best results</li>
                <li><strong>Preview First:</strong> Use the preview feature to check results before downloading</li>
              </ul>
              
              <p>Thanks for being an active user of Micro JPEG! We hope our compression service is helping you optimize your images effectively.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Visit <a href="https://micro-jpeg.replit.app">micro-jpeg.replit.app</a> to continue compressing</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`Sending daily limit warning email to: ${email}`);
    const success = await this.sendEmail(emailContent);
    if (success) {
      console.log(`✓ Daily limit warning email sent successfully to ${email}`);
    } else {
      console.error(`✗ Failed to send daily limit warning email to ${email}`);
    }
    return success;
  }

  async sendUpgradePromotion(email: string, userName: string = 'User', reason: 'file_size_limit' | 'daily_limit_reached' | 'advanced_features'): Promise<boolean> {
    const fromEmail = '"Micro JPEG" <compressjpg@microjpeg.com>';
    
    const reasons = {
      'file_size_limit': {
        subject: '📁 Upgrade for Unlimited File Sizes - No More 10MB Restrictions!',
        title: 'File Too Large?',
        description: 'Your file exceeded the 10MB free limit. Upgrade for unlimited file sizes!'
      },
      'daily_limit_reached': {
        subject: '🚀 Daily Limit Reached - Upgrade for Unlimited Compressions!',
        title: 'Need More Compressions?',
        description: 'You\'ve reached your daily compression limit. Upgrade for unlimited daily access!'
      },
      'advanced_features': {
        subject: '⚡ Unlock Advanced Features - Premium Compression Tools Await!',
        title: 'Take Your Compression Further',
        description: 'Unlock advanced compression algorithms and premium features with our Pro plan!'
      }
    };
    
    const currentReason = reasons[reason];
    
    const emailContent: EmailConfig = {
      from: fromEmail,
      to: email,
      subject: currentReason.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Upgrade to Premium</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0; 
            }
            .logo-img { max-width: 120px; height: auto; margin-bottom: 10px; }
            .brand-text { font-size: 24px; font-weight: bold; margin: 10px 0 5px 0; }
            .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .content { background: #f9fafb; padding: 30px; }
            .promo-box { 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 30px; 
              border-radius: 12px; 
              margin: 25px 0; 
              text-align: center;
            }
            .pricing-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin: 25px 0;
            }
            .pricing-card { 
              background: white; 
              border: 2px solid #e5e7eb; 
              border-radius: 12px; 
              padding: 25px; 
              text-align: center;
            }
            .pricing-card.featured { 
              border-color: #14b8a6; 
              transform: scale(1.05);
            }
            .price { 
              font-size: 36px; 
              font-weight: bold; 
              color: #14b8a6;
              margin: 10px 0;
            }
            .features-list { 
              text-align: left; 
              margin: 20px 0;
            }
            .feature { 
              display: flex; 
              align-items: center; 
              margin: 8px 0;
            }
            .check { 
              color: #10b981; 
              margin-right: 10px; 
              font-weight: bold;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #14b8a6, #0d9488); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 15px 10px;
              font-weight: bold;
              box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);
            }
            .comparison-table { 
              background: white; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              margin: 25px 0;
            }
            .comparison-row { 
              display: grid; 
              grid-template-columns: 2fr 1fr 1fr; 
              padding: 12px 20px; 
              border-bottom: 1px solid #f3f4f6;
            }
            .comparison-header { 
              background: #f9fafb; 
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            @media (max-width: 600px) {
              .pricing-grid { grid-template-columns: 1fr; }
              .pricing-card.featured { transform: none; }
              .comparison-row { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:microjpeg-logo" alt="Micro JPEG Logo" class="logo-img" />
              <div class="brand-text">microjpeg</div>
              <div class="tagline">UPGRADE TO PREMIUM</div>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <div class="promo-box">
                <h3>🚀 ${currentReason.title}</h3>
                <p>${currentReason.description}</p>
                <a href="https://micro-jpeg.replit.app/pricing" class="button">View All Plans</a>
              </div>

              <div class="pricing-grid">
                <div class="pricing-card">
                  <h3>Free Plan</h3>
                  <div class="price">$0</div>
                  <p>Great for getting started</p>
                  <div class="features-list">
                    <div class="feature"><span class="check">✓</span> 15 daily compressions</div>
                    <div class="feature"><span class="check">✓</span> 10MB file size limit</div>
                    <div class="feature"><span class="check">✓</span> Basic compression</div>
                    <div class="feature"><span class="check">✓</span> JPEG output only</div>
                  </div>
                </div>
                
                <div class="pricing-card featured">
                  <h3>Premium Plan</h3>
                  <div class="price">$9.99</div>
                  <p>per month</p>
                  <div class="features-list">
                    <div class="feature"><span class="check">✓</span> Unlimited compressions</div>
                    <div class="feature"><span class="check">✓</span> No file size limits</div>
                    <div class="feature"><span class="check">✓</span> Advanced compression</div>
                    <div class="feature"><span class="check">✓</span> Multiple output formats</div>
                    <div class="feature"><span class="check">✓</span> Priority processing</div>
                    <div class="feature"><span class="check">✓</span> Batch ZIP downloads</div>
                    <div class="feature"><span class="check">✓</span> 24/7 support</div>
                  </div>
                  <a href="https://micro-jpeg.replit.app/api/login" class="button">Upgrade Now</a>
                </div>
              </div>

              <div class="comparison-table">
                <div class="comparison-row comparison-header">
                  <div>Feature</div>
                  <div>Free</div>
                  <div>Premium</div>
                </div>
                <div class="comparison-row">
                  <div>Daily Compressions</div>
                  <div>15</div>
                  <div>Unlimited</div>
                </div>
                <div class="comparison-row">
                  <div>File Size Limit</div>
                  <div>10MB</div>
                  <div>No Limit</div>
                </div>
                <div class="comparison-row">
                  <div>Processing Speed</div>
                  <div>Standard</div>
                  <div>Priority</div>
                </div>
                <div class="comparison-row">
                  <div>Output Formats</div>
                  <div>JPEG</div>
                  <div>JPEG, PNG, WebP</div>
                </div>
                <div class="comparison-row">
                  <div>Batch Downloads</div>
                  <div>Individual</div>
                  <div>ZIP Archives</div>
                </div>
              </div>

              <h3>🎯 Why Choose Premium?</h3>
              <ul>
                <li><strong>Unlimited Freedom:</strong> No daily limits or file size restrictions</li>
                <li><strong>Advanced Algorithms:</strong> Our best compression technology</li>
                <li><strong>Time Savings:</strong> Priority processing and batch operations</li>
                <li><strong>Professional Results:</strong> Multiple output formats for any use case</li>
                <li><strong>Dedicated Support:</strong> Get help when you need it</li>
              </ul>
              
              <p>Join thousands of professionals who trust Micro JPEG for their image compression needs!</p>
              
              <p style="text-align: center;">
                <a href="https://micro-jpeg.replit.app/pricing" class="button">Compare All Plans</a>
                <a href="https://micro-jpeg.replit.app/api/login" class="button">Start Free Trial</a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Questions? Contact us at support@microjpeg.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`Sending upgrade promotion email to: ${email} (reason: ${reason})`);
    const success = await this.sendEmail(emailContent);
    if (success) {
      console.log(`✓ Upgrade promotion email sent successfully to ${email}`);
    } else {
      console.error(`✗ Failed to send upgrade promotion email to ${email}`);
    }
    return success;
  }

  /**
   * Send web credit purchase confirmation email
   */
  async sendCreditPurchaseConfirmation(
    email: string, 
    packageName: string, 
    credits: number, 
    price: number
  ): Promise<boolean> {
    const displayPrice = `$${(price / 100).toFixed(2)}`;
    const pricePerCredit = `$${(price / credits / 100).toFixed(4)}`;
    
    const emailContent: EmailConfig = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `🎉 ${credits} Credits Added to Your Account!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Credit Purchase Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f0fdfa; padding: 30px; border-radius: 0 0 8px 8px; }
            .credits-highlight { background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .credit-count { font-size: 48px; font-weight: bold; margin: 15px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            .purchase-box { background: white; border: 2px solid #5eead4; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .usage-guide { background: white; border-left: 4px solid #0d9488; padding: 20px; margin: 20px 0; }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #0d9488, #0f766e); 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 10px 5px;
              font-weight: bold;
            }
            .footer { text-align: center; color: #666; font-size: 14px; padding: 20px; }
            .success { color: #059669; font-weight: bold; }
            .highlight { color: #0d9488; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Credit Purchase Successful!</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p class="success">Your credit purchase has been successfully processed and credits have been added to your account!</p>
              
              <div class="credits-highlight">
                <h3>✨ Credits Added to Your Account</h3>
                <div class="credit-count">${credits.toLocaleString()}</div>
                <p style="margin: 0; font-size: 18px;">Credits ready to use!</p>
              </div>
              
              <div class="purchase-box">
                <h3>📄 Purchase Details</h3>
                <p><strong>Package:</strong> ${packageName}</p>
                <p><strong>Credits Purchased:</strong> ${credits.toLocaleString()}</p>
                <p><strong>Amount Paid:</strong> ${displayPrice}</p>
                <p><strong>Price per Credit:</strong> ${pricePerCredit}</p>
                <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div class="usage-guide">
                <h3>💡 How to Use Your Credits</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><span class="highlight">1 credit</span> = Compress images up to 1MB in size</li>
                  <li><span class="highlight">Smaller files</span> use fewer credits automatically</li>
                  <li><span class="highlight">Multiple formats</span> supported: JPEG, PNG, WebP, AVIF</li>
                  <li><span class="highlight">Credits never expire</span> - use them anytime</li>
                  <li><span class="highlight">Batch processing</span> available for bulk compression</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <h3>🚀 Ready to Start Compressing?</h3>
                <p>Your credits are immediately available. Start optimizing your images now!</p>
                <a href="https://micro-jpeg.replit.app/" class="button">Start Compressing Images</a>
                <a href="https://micro-jpeg.replit.app/account" class="button" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">View Account Balance</a>
              </div>

              <h3>🎯 What You Can Do Next</h3>
              <ul>
                <li>🖼️ <strong>Compress Images:</strong> Upload your photos and optimize them instantly</li>
                <li>🔄 <strong>Convert Formats:</strong> Change between JPEG, PNG, WebP, and AVIF</li>
                <li>📦 <strong>Batch Process:</strong> Handle multiple files at once</li>
                <li>⚙️ <strong>Advanced Settings:</strong> Fine-tune quality and compression options</li>
              </ul>
              
              <p>Thank you for choosing Micro JPEG! If you have any questions, our support team is here to help.</p>
            </div>
            <div class="footer">
              <p>© 2025 Micro JPEG. Professional image compression tools.</p>
              <p>Need help? Contact us at <a href="mailto:support@microjpeg.com">support@microjpeg.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`Sending credit purchase confirmation email to: ${email} (${credits} credits, ${displayPrice})`);
    const success = await this.sendEmail(emailContent);
    if (success) {
      console.log(`✓ Credit purchase confirmation email sent successfully to ${email}`);
    } else {
      console.error(`✗ Failed to send credit purchase confirmation email to ${email}`);
    }
    return success;
  }
}

export const emailService = new EmailService();