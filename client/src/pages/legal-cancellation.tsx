import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SEOHead } from "@/components/SEOHead";

export default function LegalCancellation() {

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Cancellation & Refund Policy - Micro JPEG"
        description="Learn about our cancellation and refund policies for Micro JPEG subscriptions. Understand our 30-day money-back guarantee, payment methods, and billing procedures."
        canonicalUrl="https://microjpeg.com/legal/cancellation"
        keywords="cancellation policy, refund policy, subscription billing, money-back guarantee, payment terms"
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Cancellation & Refund Policy
            </CardTitle>
            <p className="text-gray-600 text-center mt-4">
              Last updated: January 7, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-6">
              At Micro JPEG, we strive to provide exceptional image compression services. This Cancellation & Refund Policy explains our policies regarding subscription cancellations, refunds, and related procedures for our premium services.
            </p>

            <p className="text-gray-700 mb-8">
              By subscribing to our premium services, you agree to the terms outlined in this policy. Please read this policy carefully before making any purchase.
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Subscription Plans</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Available Plans</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Free Plan:</strong> No cost, limited features (10MB file size limit)</li>
                  <li><strong>Premium Plan:</strong> Monthly/yearly subscription with unlimited features</li>
                  <li><strong>Enterprise Plan:</strong> Custom pricing for business needs</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Payment Methods</h3>
                <p className="text-gray-700 mb-4">We accept payments through:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Credit and Debit Cards (Visa, MasterCard, American Express)</li>
                  <li>UPI and Net Banking (via Razorpay)</li>
                  <li>Digital Wallets (PayPal, Google Pay, Apple Pay)</li>
                  <li>Bank Transfers and Wire Transfers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cancellation Policy</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">How to Cancel</h3>
                <p className="text-gray-700 mb-4">You can cancel your subscription at any time through:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Your account dashboard under "Subscription Management"</li>
                  <li>Contacting our support team at support@microjpeg.com</li>
                  <li>Using the cancellation link in your subscription emails</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Immediate Effect</h3>
                <p className="text-gray-700 mb-4">
                  When you cancel your subscription:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Your subscription will remain active until the end of your current billing period</li>
                  <li>You will continue to have access to premium features until the subscription expires</li>
                  <li>No further charges will be made to your payment method</li>
                  <li>Your account will automatically revert to the Free plan after expiration</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">No Cancellation Fees</h3>
                <p className="text-gray-700">
                  We do not charge any fees for cancelling your subscription. The cancellation process is free and can be completed at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Refund Policy</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">30-Day Money-Back Guarantee</h3>
                <p className="text-gray-700 mb-4">
                  We offer a 30-day money-back guarantee for all new premium subscriptions. If you are not satisfied with our service, you can request a full refund within 30 days of your initial purchase.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Refund Eligibility</h3>
                <p className="text-gray-700 mb-4">Refunds are available in the following circumstances:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Technical issues that prevent service usage for more than 7 consecutive days</li>
                  <li>Service not meeting advertised specifications</li>
                  <li>Billing errors or duplicate charges</li>
                  <li>Unsatisfactory service within the first 30 days</li>
                  <li>Accidental purchases or unauthorized transactions</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Non-Refundable Items</h3>
                <p className="text-gray-700 mb-4">The following are not eligible for refunds:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Usage-based charges for API calls or processing</li>
                  <li>Custom enterprise solutions after development has begun</li>
                  <li>Subscriptions cancelled after 30 days (unless due to service failure)</li>
                  <li>Partial refunds for unused subscription time beyond 30 days</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Refund Process</h3>
                <p className="text-gray-700 mb-4">To request a refund:</p>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Contact our support team at refunds@microjpeg.com</li>
                  <li>Provide your account email and reason for refund request</li>
                  <li>We will review your request within 2-3 business days</li>
                  <li>If approved, refunds will be processed within 5-7 business days</li>
                  <li>Refunds will be issued to your original payment method</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Pro-rata Refunds</h2>
                <p className="text-gray-700 mb-4">
                  For annual subscriptions cancelled within the first 30 days, we provide full refunds. After 30 days, we may provide pro-rata refunds in exceptional circumstances, such as:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Extended service outages affecting your ability to use the platform</li>
                  <li>Significant changes to service terms that materially affect your usage</li>
                  <li>Technical issues specific to your account that cannot be resolved</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Billing and Payment Issues</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Failed Payments</h3>
                <p className="text-gray-700 mb-4">
                  If a subscription payment fails:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>We will attempt to process payment for up to 7 days</li>
                  <li>You will receive email notifications about payment failures</li>
                  <li>Your account will be downgraded to Free plan if payment cannot be processed</li>
                  <li>You can reactivate your subscription by updating payment information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Dispute Resolution</h3>
                <p className="text-gray-700">
                  For payment disputes or chargebacks, please contact us directly before initiating a chargeback with your bank. We are committed to resolving billing issues promptly and fairly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Credits</h2>
                <p className="text-gray-700 mb-4">
                  In cases where a refund is not applicable, we may offer service credits for:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Service interruptions or technical issues</li>
                  <li>Performance problems that affect your usage</li>
                  <li>Billing discrepancies or overcharges</li>
                </ul>
                <p className="text-gray-700">
                  Service credits will be applied to your account and can be used for future subscription payments or premium features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Enterprise and Custom Plans</h2>
                <p className="text-gray-700 mb-4">
                  Enterprise and custom plans have specific cancellation and refund terms outlined in individual service agreements. These may include:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Custom notice periods for cancellation</li>
                  <li>Pro-rata refunds for unused services</li>
                  <li>Special terms for long-term contracts</li>
                  <li>Migration assistance and data export services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention After Cancellation</h2>
                <p className="text-gray-700 mb-4">
                  After subscription cancellation:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Your account data will be retained for 90 days</li>
                  <li>Processed images are automatically deleted within 24 hours</li>
                  <li>You can reactivate your subscription and restore access during this period</li>
                  <li>After 90 days, account data may be permanently deleted</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Cancellation & Refund Policy from time to time. Changes will be posted on this page with an updated revision date. Significant changes will be communicated via email to active subscribers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For questions about cancellations, refunds, or this policy, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2"><strong>Email:</strong> refunds@microjpeg.com</p>
                  <p className="text-gray-700 mb-2"><strong>Support:</strong> support@microjpeg.com</p>
                  <p className="text-gray-700 mb-2"><strong>Billing:</strong> billing@microjpeg.com</p>
                  <p className="text-gray-700"><strong>Phone:</strong> Available in your account dashboard</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                This Cancellation & Refund Policy is designed to provide transparency about our billing practices and your rights as a subscriber. We are committed to fair and reasonable cancellation and refund procedures.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}