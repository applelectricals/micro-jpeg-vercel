/**
 * Razorpay Service for Indian Payments
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';

export class RazorpayService {
  private razorpay: Razorpay | null = null;
  private enabled: boolean = false;

  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      this.enabled = true;
      console.log('Razorpay service initialized successfully');
      console.log(`Razorpay Configuration: ${process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? 'CONFIGURED' : 'MISSING_CREDENTIALS'}`);
    } else {
      console.log('Razorpay credentials not found - service disabled');
      console.log(`Razorpay Configuration: MISSING_CREDENTIALS`);
      this.enabled = false;
    }
  }

  async createOrder(amount: number, currency = 'USD', receipt?: string) {
    if (!this.enabled || !this.razorpay) {
      return {
        success: false,
        error: 'Razorpay service not available'
      };
    }

    try {
      const options = {
        amount: Math.round(amount), // Amount should already be in smallest currency unit
        currency,
        receipt: receipt || `order_${Date.now()}`,
        payment_capture: 1, // Auto-capture
      };

      const order = await this.razorpay.orders.create(options);
      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      };
    } catch (error: any) {
      console.error('Razorpay order creation failed:', error);
      console.error('Razorpay error details:', {
        statusCode: error.statusCode,
        error: error.error,
        description: error.error?.description,
        code: error.error?.code
      });
      return {
        success: false,
        error: error?.error?.description || error.message || 'Unknown error'
      };
    }
  }

  async createSubscription(planId: string, customerId: string, totalCount?: number) {
    if (!this.enabled || !this.razorpay) {
      return {
        success: false,
        error: 'Razorpay service not available'
      };
    }

    try {
      const subscriptionData: any = {
        plan_id: planId,
        customer_id: customerId,
        quantity: 1,
        start_at: Math.floor(Date.now() / 1000) + 300, // Start 5 minutes from now
      };

      if (totalCount) {
        subscriptionData.total_count = totalCount;
      }

      const subscription: any = await this.razorpay.subscriptions.create(subscriptionData);

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        planId: subscription.plan_id
      };
    } catch (error) {
      console.error('Razorpay subscription creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!this.enabled || !process.env.RAZORPAY_KEY_SECRET) {
      return false;
    }

    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    if (!this.enabled || !this.razorpay) {
      return {
        success: false,
        error: 'Razorpay service not available'
      };
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          captured: payment.captured,
          createdAt: payment.created_at
        }
      };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = false) {
    if (!this.enabled || !this.razorpay) {
      return {
        success: false,
        error: 'Razorpay service not available'
      };
    }

    try {
      const result: any = await this.razorpay.subscriptions.cancel(
        subscriptionId, 
        cancelAtCycleEnd
      );

      return {
        success: true,
        subscriptionId: result.id,
        status: result.status
      };
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const razorpayService = new RazorpayService();