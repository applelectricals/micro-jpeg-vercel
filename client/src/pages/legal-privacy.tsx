import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SEOHead } from "@/components/SEOHead";

export default function LegalPrivacy() {

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Privacy Policy - Micro JPEG"
        description="Learn how Micro JPEG protects your privacy and handles your personal information. Our privacy policy covers data collection, image processing, cookies, and your privacy rights."
        canonicalUrl="https://microjpeg.com/legal/privacy"
        keywords="privacy policy, data protection, image processing privacy, user data, GDPR compliance"
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Privacy Policy
            </CardTitle>
            <p className="text-gray-600 text-center mt-4">
              Last updated: September 7, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-6">
              At Micro JPEG, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our image compression and conversion services.
            </p>

            <p className="text-gray-700 mb-8">
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Personal Information</h3>
                <p className="text-gray-700 mb-4">When you create an account or use our services, we may collect:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Email address and username</li>
                  <li>Payment information (processed securely through third-party payment processors)</li>
                  <li>Subscription and billing details</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Technical Information</h3>
                <p className="text-gray-700 mb-4">We automatically collect certain technical information:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system and device characteristics</li>
                  <li>Usage patterns and service interactions</li>
                  <li>API usage statistics and performance metrics</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Image and File Data</h3>
                <p className="text-gray-700">
                  When you upload images for compression or conversion, we temporarily process and store your files to provide our services. We also collect metadata about file processing (file size, format, compression settings) for service optimization.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Provide Services:</strong> Process, compress, and convert your images according to your specifications</li>
                  <li><strong>Account Management:</strong> Create and maintain your account, process payments, and manage subscriptions</li>
                  <li><strong>Service Improvement:</strong> Analyze usage patterns to improve our compression algorithms and user experience</li>
                  <li><strong>Communication:</strong> Send service-related notifications, updates, and customer support responses</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, abuse, and technical issues</li>
                  <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Image Processing and Data Retention</h2>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Image Storage</h3>
                <p className="text-gray-700 mb-4">
                  Your uploaded images are temporarily stored on our secure servers during processing. All images are automatically and permanently deleted within 24 hours of upload, regardless of whether processing is completed.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Processing Logs</h3>
                <p className="text-gray-700 mb-4">
                  We maintain processing logs for service optimization and security purposes. These logs contain technical metadata (file size, processing time, compression ratios) but do not include your actual image content. Logs are retained for a maximum of 90 days.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Account Data</h3>
                <p className="text-gray-700">
                  Account information, subscription details, and usage statistics are retained as long as your account remains active. You may request deletion of your account and associated data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-4">We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Service Providers</h3>
                <p className="text-gray-700 mb-4">
                  We work with trusted third-party service providers who assist in delivering our services:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Cloud Infrastructure:</strong> Secure hosting and data processing services</li>
                  <li><strong>Payment Processing:</strong> Stripe and other payment processors for subscription billing</li>
                  <li><strong>Email Services:</strong> Transactional email delivery for account notifications</li>
                  <li><strong>Analytics:</strong> Service usage analytics to improve our platform</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Legal Requirements</h3>
                <p className="text-gray-700">
                  We may disclose information when required by law, legal process, or to protect the rights, property, or safety of Micro JPEG, our users, or others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Encryption in transit and at rest for all data</li>
                  <li>Secure API authentication and access controls</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Automatic deletion of processed images</li>
                  <li>Limited access to personal data on a need-to-know basis</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-3">Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  Required for basic site functionality, authentication, and security. These cannot be disabled.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Analytics Cookies</h3>
                <p className="text-gray-700 mb-4">
                  Help us understand how our service is used to improve performance and user experience. You can opt out of analytics tracking.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">Preference Cookies</h3>
                <p className="text-gray-700">
                  Remember your settings and preferences for a better user experience.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
                <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
                
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we have about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information and account</li>
                  <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Restriction:</strong> Request limitation of how we process your data</li>
                </ul>

                <p className="text-gray-700">
                  To exercise these rights, please contact us at privacy@microjpeg.com or through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
                <p className="text-gray-700">
                  Your information may be processed and stored in countries other than your own. We ensure that all international transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700">
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Business Transfers</h2>
                <p className="text-gray-700">
                  In the event of a merger, acquisition, or sale of assets, your personal information may be transferred. We will provide notice before your personal information becomes subject to a different privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@microjpeg.com</p>
                  <p className="text-gray-700 mb-2"><strong>Support:</strong> support@microjpeg.com</p>
                  <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@microjpeg.com</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                This Privacy Policy is designed to help you understand how we collect, use, and safeguard your information. 
                We are committed to maintaining the highest standards of privacy protection.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}