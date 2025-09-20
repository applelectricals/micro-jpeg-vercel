// Enhanced email templates for Purchase Sequence

export interface PaymentConfirmationData {
  plan: string;
  amount: number;
  paymentId: string;
  features: string[];
}

export function getWelcomeEmailTemplate(firstName: string, plan: string): string {
  const planFeatures = {
    free: ['500 operations/month', '10MB file limit', 'Basic compression'],
    pro: ['10,000 operations/month', '50MB file limit', 'Priority processing', 'API access', 'Email support'],
    enterprise: ['Unlimited operations', '500MB file limit', 'Custom integrations', '99.9% SLA', 'Phone support']
  };

  const features = planFeatures[plan as keyof typeof planFeatures] || planFeatures.free;
  const isPaid = plan !== 'free';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MicroJPEG ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-badge {
          display: inline-block;
          background: ${isPaid ? '#10b981' : '#3b82f6'};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .features {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin: 8px 0;
          color: #4a5568;
        }
        .feature-icon {
          width: 20px;
          height: 20px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          margin-right: 12px;
          position: relative;
        }
        .feature-icon::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
        }
        .cta-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 10px 5px;
        }
        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          display: block;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀</div>
          <h1 style="margin: 0; font-size: 28px;">Welcome to MicroJPEG!</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">You're now ready to compress images like a pro</p>
        </div>
        
        <div class="content">
          <div class="welcome-badge">
            ${isPaid ? '🎉 Premium Member' : '✨ Free Account Created'}
          </div>
          
          <h2>Hi ${firstName || 'there'}!</h2>
          
          <p>Welcome to MicroJPEG! You now have access to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan with all these amazing features:</p>
          
          <div class="features">
            <h3 style="margin-top: 0; color: #374151;">Your Plan Features:</h3>
            ${features.map(feature => `
              <div class="feature-item">
                <span class="feature-icon"></span>
                ${feature}
              </div>
            `).join('')}
          </div>

          ${isPaid ? `
          <div class="stats">
            <div class="stat-card">
              <span class="stat-number">${plan === 'pro' ? '10,000' : '∞'}</span>
              <span>Operations/Month</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">${plan === 'pro' ? '50MB' : '500MB'}</span>
              <span>File Size Limit</span>
            </div>
          </div>
          ` : `
          <div class="stats">
            <div class="stat-card">
              <span class="stat-number">500</span>
              <span>Free Operations</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">10MB</span>
              <span>File Size Limit</span>
            </div>
          </div>
          `}
          
          <h3>What's Next?</h3>
          <p>Here are some things you can do right now:</p>
          
          <div style="margin: 30px 0;">
            <a href="https://microjpeg.com" class="cta-button">Start Compressing Images</a>
            <a href="https://microjpeg.com/dashboard" class="cta-button">Visit Your Dashboard</a>
          </div>

          ${isPaid ? `
          <div style="background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">🔑 Your API Key</h4>
            <p style="margin-bottom: 0; color: #92400e;">Your personal API key will be available in your dashboard. Use it to integrate image compression into your applications.</p>
          </div>
          ` : ''}
          
          <p>If you have any questions, just reply to this email or contact our support team. We're here to help!</p>
          
          <p>Happy compressing!<br>
          The MicroJPEG Team</p>
        </div>
        
        <div class="footer">
          <p>You're receiving this email because you signed up for MicroJPEG.</p>
          <p>
            <a href="https://microjpeg.com" style="color: #667eea;">MicroJPEG</a> | 
            <a href="https://microjpeg.com/privacy-policy" style="color: #667eea;">Privacy Policy</a> | 
            <a href="https://microjpeg.com/support" style="color: #667eea;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPaymentConfirmationTemplate(data: PaymentConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation - MicroJPEG</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 40px 30px;
        }
        .receipt {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
        }
        .total-row {
          border-top: 2px solid #e5e7eb;
          padding-top: 10px;
          font-weight: 600;
          font-size: 18px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin: 8px 0;
          color: #4a5568;
        }
        .feature-icon {
          width: 20px;
          height: 20px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          margin-right: 12px;
          position: relative;
        }
        .feature-icon::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">✅ Payment Confirmed!</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Your subscription is now active</p>
        </div>
        
        <div class="content">
          <h2>Thank you for your payment!</h2>
          
          <p>We've successfully processed your payment and your <strong>${data.plan}</strong> subscription is now active.</p>
          
          <div class="receipt">
            <h3 style="margin-top: 0; color: #374151;">Payment Receipt</h3>
            <div class="receipt-row">
              <span>Plan:</span>
              <span><strong>${data.plan}</strong></span>
            </div>
            <div class="receipt-row">
              <span>Amount:</span>
              <span><strong>$${data.amount}</strong></span>
            </div>
            <div class="receipt-row">
              <span>Payment ID:</span>
              <span><code>${data.paymentId}</code></span>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div class="receipt-row total-row">
              <span>Total Paid:</span>
              <span>$${data.amount}</span>
            </div>
          </div>
          
          <h3>What's Included in Your Plan:</h3>
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            ${data.features.map(feature => `
              <div class="feature-item">
                <span class="feature-icon"></span>
                ${feature}
              </div>
            `).join('')}
          </div>
          
          <h3>Next Steps:</h3>
          <ol>
            <li>Visit your <a href="https://microjpeg.com/dashboard">dashboard</a> to see your new limits</li>
            <li>Start compressing images with your enhanced plan</li>
            <li>Access your API key for integrations (if applicable)</li>
          </ol>
          
          <p>Your subscription will automatically renew monthly. You can manage your subscription or cancel anytime from your dashboard.</p>
          
          <p>If you have any questions about your payment or subscription, please don't hesitate to contact our support team.</p>
          
          <p>Thank you for choosing MicroJPEG!<br>
          The MicroJPEG Team</p>
        </div>
        
        <div class="footer">
          <p>This is your payment confirmation for MicroJPEG ${data.plan} subscription.</p>
          <p>
            <a href="https://microjpeg.com" style="color: #667eea;">MicroJPEG</a> | 
            <a href="https://microjpeg.com/dashboard" style="color: #667eea;">Dashboard</a> | 
            <a href="https://microjpeg.com/support" style="color: #667eea;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getEmailVerificationTemplate(verificationUrl: string, firstName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - MicroJPEG</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .verify-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
        }
        .security-note {
          background: #fef3cd;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">📧 Verify Your Email</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">One more step to get started</p>
        </div>
        
        <div class="content">
          <h2>Hi ${firstName || 'there'}!</h2>
          
          <p>Welcome to MicroJPEG! To complete your account setup and start compressing images, please verify your email address by clicking the button below:</p>
          
          <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
          
          <div class="security-note">
            <h4 style="margin-top: 0; color: #92400e;">🔒 Security Note</h4>
            <p style="margin-bottom: 0; color: #92400e;">If you didn't create an account with MicroJPEG, you can safely ignore this email. Your email address will not be added to any mailing lists.</p>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationUrl}</p>
          
          <p>Once verified, you'll be able to:</p>
          <ul style="text-align: left; max-width: 300px; margin: 20px auto;">
            <li>Compress up to 500 images per month</li>
            <li>Upload files up to 10MB</li>
            <li>Access advanced compression settings</li>
            <li>Track your usage and history</li>
          </ul>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <p>Welcome aboard!<br>
          The MicroJPEG Team</p>
        </div>
        
        <div class="footer">
          <p>You're receiving this email because someone created an account with this email address on MicroJPEG.</p>
          <p>
            <a href="https://microjpeg.com" style="color: #667eea;">MicroJPEG</a> | 
            <a href="https://microjpeg.com/privacy-policy" style="color: #667eea;">Privacy Policy</a> | 
            <a href="https://microjpeg.com/support" style="color: #667eea;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}