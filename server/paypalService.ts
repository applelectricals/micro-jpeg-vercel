/**
 * PayPal Service for International Payments
 */
import axios from 'axios';

export class PayPalService {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private enabled: boolean = false;

  constructor() {
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      this.clientId = process.env.PAYPAL_CLIENT_ID;
      this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      // Check for manual environment override first
      const manualEnv = process.env.PAYPAL_ENVIRONMENT?.toLowerCase();
      let isLiveCredentials = false;
      
      if (manualEnv === 'live' || manualEnv === 'production') {
        isLiveCredentials = true;
        console.log('PayPal Environment: LIVE (Manual override)');
      } else if (manualEnv === 'sandbox' || manualEnv === 'test') {
        isLiveCredentials = false;
        console.log('PayPal Environment: SANDBOX (Manual override)');
      } else {
        // Auto-detect based on Client ID prefix
        // Updated logic: Some live credentials start with 'BAA', some sandbox start with 'AeG'
        // We'll check both patterns
        const startsWithA = this.clientId.startsWith('A') && !this.clientId.startsWith('AeG');
        const startsWithBAA = this.clientId.startsWith('BAA');
        
        // For your account pattern: LIVE starts with BAA, SANDBOX starts with AeG
        if (startsWithBAA) {
          isLiveCredentials = true;
          console.log('PayPal Environment: LIVE (Detected BAA pattern - Production credentials)');
        } else if (this.clientId.startsWith('AeG') || this.clientId.startsWith('sb-')) {
          isLiveCredentials = false;
          console.log('PayPal Environment: SANDBOX (Detected test pattern)');
        } else if (startsWithA) {
          isLiveCredentials = true;
          console.log('PayPal Environment: LIVE (Detected A pattern)');
        } else {
          isLiveCredentials = false;
          console.log('PayPal Environment: SANDBOX (Default fallback)');
        }
      }
      
      this.baseURL = isLiveCredentials
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      this.enabled = true;
      console.log('PayPal service initialized successfully');
      console.log(`PayPal Environment: ${this.baseURL.includes('sandbox') ? 'SANDBOX' : 'LIVE'}`);
      console.log(`PayPal Configuration: ${this.clientId && this.clientSecret ? 'CONFIGURED' : 'MISSING_CREDENTIALS'}`);
    } else {
      console.log('PayPal credentials not found - service disabled');
      console.log(`PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? 'SET' : 'MISSING'}`);
      console.log(`PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
      this.enabled = false;
      this.clientId = '';
      this.clientSecret = '';
      this.baseURL = '';
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.enabled) {
      throw new Error('PayPal service not available');
    }

    try {
      console.log('PayPal getAccessToken - Environment:', process.env.NODE_ENV);
      console.log('PayPal getAccessToken - Environment Type:', this.baseURL.includes('sandbox') ? 'SANDBOX' : 'LIVE');
      console.log('PayPal getAccessToken - Configuration Status: CONFIGURED');
      
      const response = await axios({
        url: `${this.baseURL}/v1/oauth2/token`,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: this.clientId,
          password: this.clientSecret,
        },
        data: 'grant_type=client_credentials'
      });

      console.log('PayPal access token retrieved successfully');
      return response.data.access_token;
    } catch (error: any) {
      console.error('PayPal access token failed:', error.response?.data || error.message);
      console.error('PayPal credentials check - Client ID exists:', !!this.clientId);
      console.error('PayPal credentials check - Client Secret exists:', !!this.clientSecret);
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createProduct(name: string, description: string) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'PayPal service not available'
      };
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        url: `${this.baseURL}/v1/catalogs/products`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'PayPal-Request-Id': `PRODUCT-${Date.now()}`
        },
        data: {
          name,
          description,
          type: "SERVICE",
          category: "SOFTWARE"
        }
      });

      return {
        success: true,
        productId: response.data.id
      };
    } catch (error) {
      console.error('PayPal product creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createSubscriptionPlan(
    productId: string, 
    name: string, 
    description: string, 
    price: string,
    currency = 'USD'
  ) {
    try {
      const token = await this.getAccessToken();
      
      
      const response = await axios({
        url: `${this.baseURL}/v1/billing/plans`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'PayPal-Request-Id': `PLAN-${Date.now()}`
        },
        data: {
          product_id: productId,
          name,
          description,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: name.includes('Test') ? 1 : 0, // 1 cycle for test, infinite for others
              pricing_scheme: {
                fixed_price: {
                  value: price,
                  currency_code: currency
                }
              }
            }
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
              value: "0",
              currency_code: currency
            },
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3
          }
        }
      });

      return {
        success: true,
        planId: response.data.id
      };
    } catch (error) {
      console.error('PayPal plan creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createSubscription(planId: string, returnUrl: string, cancelUrl: string) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        url: `${this.baseURL}/v1/billing/subscriptions`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `SUBSCRIPTION-${Date.now()}`
        },
        data: {
          plan_id: planId,
          subscriber: {
            name: {
              given_name: "Customer",
              surname: "User"
            },
            email_address: "customer@example.com"
          },
          application_context: {
            brand_name: "Micro JPEG",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            payment_method: {
              payer_selected: "PAYPAL",
              payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
            },
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        }
      });

      const subscription = response.data;
      const approvalUrl = subscription.links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        success: true,
        subscriptionId: subscription.id,
        approvalUrl: approvalUrl,
        subscription: subscription
      };
    } catch (error) {
      console.error('PayPal subscription creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        url: `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      return {
        success: true,
        subscription: response.data
      };
    } catch (error) {
      console.error('PayPal get subscription failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancelSubscription(subscriptionId: string, reason = "User requested cancellation") {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        url: `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          reason: reason
        }
      });

      return {
        success: response.status === 204,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      console.error('PayPal subscription cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const paypalService = new PayPalService();