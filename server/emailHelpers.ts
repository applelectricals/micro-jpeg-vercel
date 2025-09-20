// Helper functions for enhanced email integration
import { getWelcomeEmailTemplate, getPaymentConfirmationTemplate, getEmailVerificationTemplate, type PaymentConfirmationData } from './emailTemplates';

export async function sendWelcomeEmail(emailService: any, email: string, firstName: string, plan: string = 'free'): Promise<boolean> {
  try {
    const emailContent = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `Welcome to MicroJPEG ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉`,
      html: getWelcomeEmailTemplate(firstName, plan)
    };

    return await emailService.sendEmail(emailContent);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendPaymentConfirmationEmail(emailService: any, email: string, data: PaymentConfirmationData): Promise<boolean> {
  try {
    const emailContent = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: `Payment Confirmed - Welcome to ${data.plan}! ✅`,
      html: getPaymentConfirmationTemplate(data)
    };

    return await emailService.sendEmail(emailContent);
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    return false;
  }
}

export async function sendEnhancedVerificationEmail(emailService: any, email: string, token: string, firstName?: string): Promise<boolean> {
  try {
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    const emailContent = {
      from: process.env.SENDGRID_FROM_EMAIL || '"Micro JPEG" <compressjpg@microjpeg.com>',
      to: email,
      subject: 'Verify Your Email - MicroJPEG 📧',
      html: getEmailVerificationTemplate(verificationUrl, firstName)
    };

    return await emailService.sendEmail(emailContent);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}