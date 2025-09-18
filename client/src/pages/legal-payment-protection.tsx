import { Shield, CreditCard, AlertTriangle, Clock, CheckCircle, XCircle, Mail, Ban } from 'lucide-react';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SEOHead } from "@/components/SEOHead";

export default function LegalPaymentProtection() {

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Payment Protection System - Micro JPEG"
        description="Understand how Micro JPEG handles payment failures and protects our service. Learn about our payment retry system, progressive enforcement, and service restoration procedures."
        canonicalUrl="https://microjpeg.com/legal/payment-protection"
        keywords="payment protection, billing system, payment failures, subscription billing, API payment enforcement"
      />
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8 bg-white shadow-sm">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Payment Protection System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Understanding how we handle payment failures and protect our service from non-payment
          </p>
        </div>

        {/* Payment Protection Overview */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                How It Works
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Our payment protection system ensures service sustainability while giving users multiple opportunities to resolve payment issues.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automatic payment retry system</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Progressive enforcement with warnings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Immediate restoration after payment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Comprehensive email notifications</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Billing Model
              </h2>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Pay-Per-Use System
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• No upfront payment required</li>
                  <li>• 7-day free trial period</li>
                  <li>• Monthly billing for actual usage</li>
                  <li>• Transparent per-compression pricing</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">$0.005</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Starter</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">$0.003</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Professional</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Failure Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
            <Clock className="h-6 w-6 text-orange-600" />
            <span>Payment Failure Timeline</span>
          </h2>
          
          <div className="space-y-6">
            {/* First Failure */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">First Payment Failure</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Friendly reminder email sent • Service continues normally • Automatic retry in 3 days
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">Payment reminder email</span>
                </div>
              </div>
            </div>

            {/* Second Failure */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Second Payment Failure</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Warning email sent • Service continues with warning • Final retry scheduled
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 dark:text-orange-400">Suspension warning email</span>
                </div>
              </div>
            </div>

            {/* Third Failure */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-red-800 dark:text-red-200">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Third Payment Failure</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Service suspended immediately • API keys deactivated • Suspension notice sent
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">Service suspension email</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protection Measures */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">Immediate Actions</h3>
            </div>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li>• API keys immediately deactivated</li>
              <li>• All API requests return 402 Payment Required</li>
              <li>• Account marked as suspended</li>
              <li>• User dashboard shows payment status</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Communication</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Progressive email notifications</li>
              <li>• Clear payment instructions</li>
              <li>• Direct links to billing portal</li>
              <li>• Support contact information</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Recovery</h3>
            </div>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <li>• Automatic restoration after payment</li>
              <li>• Service restored within 15 minutes</li>
              <li>• Welcome back confirmation email</li>
              <li>• Full access to all features</li>
            </ul>
          </div>
        </div>

        {/* API Error Responses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            API Error Responses for Non-Payment
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-600 dark:text-gray-400 mb-2">HTTP/1.1 402 Payment Required</div>
            <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{`{
  "error": "Payment Required",
  "message": "Your API access is suspended due to outstanding payment of $47.50. Please update your payment method to restore service.",
  "paymentRequired": true,
  "amountDue": 47.50,
  "daysPastDue": 12,
  "billingPortal": "https://billing.stripe.com/p/login/xxx"
}`}</pre>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            This ensures developers receive clear information about the payment issue and know exactly how to resolve it.
          </p>
        </div>

        {/* Business Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Why This Protects Our Business
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Revenue Protection</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• Prevents unlimited free usage after trial</li>
                <li>• Ensures sustainable business model</li>
                <li>• Automatic debt collection process</li>
                <li>• Clear payment enforcement</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User Experience</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• Multiple chances to resolve issues</li>
                <li>• Clear communication throughout</li>
                <li>• Immediate restoration after payment</li>
                <li>• No punitive measures for honest mistakes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This Payment Protection System ensures fair treatment for users while protecting our business sustainability. 
            For questions about payment protection policies, please contact us at billing@microjpeg.com
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}