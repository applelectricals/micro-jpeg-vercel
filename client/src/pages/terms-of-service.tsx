import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service - Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              Terms of Service
            </CardTitle>
            <p className="text-gray-600 text-center mt-4">
              Last updated: September 7, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-6">
              The following terms and conditions (the "Agreement") govern the use of the Micro JPEG website and all content and services available at or through the website (collectively, the "Service"). The Service is owned and operated by Micro JPEG ("Micro JPEG", "we", "us"). The Service is offered subject to your acceptance without modification of the Agreement. By accessing or using any part of the Service, you agree to become bound by the Agreement. If you do not agree to all the terms and conditions of this Agreement, then you may not access the Service or use any services.
            </p>

            <p className="text-gray-700 mb-8">
              This Agreement is between Micro JPEG and you, or any legal entity that you represent ("you"). If you enter into this Agreement on behalf of another legal entity, you represent and warrant that you have authority to bind such entity to this Agreement.
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Submitted Content</h2>
                <p className="text-gray-700 mb-4">
                  You retain all rights to content you submit to the Service. You grant Micro JPEG and its service providers the right to temporarily store, process, and modify your images and files as necessary to provide the compression and conversion services to you. Submitted content will be automatically deleted from our servers within 24 hours of processing.
                </p>
                <p className="text-gray-700">
                  We do not claim ownership of your images or files, and your intellectual property rights remain with you at all times.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Limits</h2>
                <p className="text-gray-700 mb-4">
                  You acknowledge and agree that Micro JPEG imposes limits on file size, number of requests, and processing capabilities based on your subscription tier:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Free Tier:</strong> 10MB maximum file size, 500 operations per month, 5 requests per hour</li>
                  <li><strong>Pro Tier:</strong> 50MB maximum file size, 10,000 operations per month, 100 requests per hour</li>
                  <li><strong>Enterprise Tier:</strong> 200MB maximum file size, 50,000 operations per month, 10,000 requests per hour</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Micro JPEG may change such limits at any time, at our sole discretion, with reasonable notice to users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payments</h2>
                <p className="text-gray-700 mb-4">
                  By purchasing a subscription, you agree to pay Micro JPEG the applicable fees for your usage of the Service. Subscriptions are billed monthly or annually depending on your selected plan. Payments will be charged at the beginning of each billing period.
                </p>
                <p className="text-gray-700 mb-4">
                  You authorize Micro JPEG to collect fees using any payment method we have on record for you. We may increase fees or add new charges with 30 days advance notice.
                </p>
                <p className="text-gray-700">
                  All prices are listed in U.S. dollars (USD) and include applicable taxes. Payments are generally non-refundable, except as required by applicable law or our refund policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Renewals and Cancellation</h2>
                <p className="text-gray-700 mb-4">
                  Subscriptions will renew automatically at the end of each billing period based on the current pricing at the time of renewal. You may cancel your subscription at any time through your account dashboard.
                </p>
                <p className="text-gray-700">
                  Upon cancellation, your account will be downgraded to the free service at the end of the current billing period. For annual subscriptions, we will send email reminders before renewal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. License and Ownership</h2>
                <p className="text-gray-700">
                  When subscribing to the Service, Micro JPEG grants you a non-exclusive, non-transferable, non-sublicensable license during your subscription period to use the Service for image compression and conversion according to your subscription tier.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                <p className="text-gray-700">
                  Micro JPEG respects the intellectual property rights of others and asks that you do the same. All rights, title, and interest in the Service, including our compression algorithms, software, and technology, remain solely with Micro JPEG. You may not reverse engineer, copy, or create derivative works of our Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User Responsibilities</h2>
                <p className="text-gray-700 mb-4">You represent and warrant that:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Your use of the Service will not infringe on proprietary rights, including copyright, patent, trademark, or trade secret rights of any third party</li>
                  <li>Content you submit does not contain viruses, malware, or other harmful code</li>
                  <li>You will not use the Service to disable, damage, or overburden our systems</li>
                  <li>Your use of the Service complies with this Agreement and all applicable laws and regulations</li>
                  <li>You have the right to compress and modify any images you submit to our Service</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Micro JPEG reserves the right to refuse service, terminate subscriptions, and deny access to any user who violates these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
                <p className="text-gray-700 mb-4">
                  At Micro JPEG, we take your privacy seriously. We collect only the minimum personal information necessary to provide our services and administer your account. We are committed to data protection and security in compliance with applicable privacy laws.
                </p>
                <p className="text-gray-700 mb-4">
                  You may review, correct, or update your personal data through your account dashboard. You have the right to data portability, access, and deletion of your personal information.
                </p>
                <p className="text-gray-700">
                  For privacy-related inquiries, please contact us at privacy@microjpeg.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Processing</h2>
                <p className="text-gray-700 mb-4">
                  Images uploaded to the Service are temporarily stored, processed for compression or conversion, and automatically deleted within 24 hours. We do not retain your images beyond this period.
                </p>
                <p className="text-gray-700 mb-4">
                  Service requests may be logged for analytics, security, and abuse prevention. Log entries contain technical information such as IP address, timestamp, API key usage, and file metadata. Log entries are retained for a maximum of 90 days.
                </p>
                <p className="text-gray-700">
                  Account information including username, email address, and subscription details are stored securely and retained as long as your account is active.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Service Providers</h2>
                <p className="text-gray-700 mb-4">
                  Micro JPEG uses trusted third-party service providers to deliver our services, including cloud hosting, payment processing, and email communications. Your data may be processed by these providers in accordance with their privacy policies and our data processing agreements.
                </p>
                <p className="text-gray-700">
                  We ensure that all service providers maintain appropriate security measures and comply with applicable data protection regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimer of Warranties</h2>
                <p className="text-gray-700 mb-4">
                  The Service is provided "as is" without warranties of any kind, express or implied. Micro JPEG disclaims all warranties including merchantability, fitness for a particular purpose, and non-infringement.
                </p>
                <p className="text-gray-700">
                  We do not warrant that the Service will be error-free, uninterrupted, or that compression results will meet your specific requirements. You use the Service at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  Micro JPEG's liability is limited to the maximum extent permitted by law. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business interruption.
                </p>
                <p className="text-gray-700">
                  Our total liability for any claims related to the Service shall not exceed the amount you paid to Micro JPEG in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
                <p className="text-gray-700">
                  You agree to indemnify and hold harmless Micro JPEG, its employees, and contractors from any claims, damages, or expenses arising from your use of the Service or violation of these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
                <p className="text-gray-700">
                  Micro JPEG reserves the right to modify these terms at any time. We will notify users of material changes via email or service announcements. Continued use of the Service after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
                <p className="text-gray-700">
                  These terms are governed by the laws of the jurisdiction where Micro JPEG operates. Any disputes will be resolved in the appropriate courts of that jurisdiction. If any provision is found unenforceable, the remaining provisions shall remain in effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Entire Agreement</h2>
                <p className="text-gray-700">
                  This Agreement constitutes the entire agreement between Micro JPEG and you concerning the Service and supersedes all prior agreements and understandings.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                For questions about these Terms of Service, please contact us at legal@microjpeg.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}