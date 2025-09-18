import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  MessageCircle, 
  Mail, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Zap,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Support() {
  useEffect(() => {
    document.title = "Support - Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get support for your image compression needs. We're here to help you optimize your workflow.
          </p>
        </div>

        {/* Quick Help Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get instant help from our support team during business hours.
              </p>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Mail className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send us an email and we'll respond within 24 hours.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:support@microjpeg.com'}>
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive guides and API documentation.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api-docs'}>
                View Docs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-6 h-6 mr-2" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-2">How does image compression work?</h4>
                <p className="text-gray-600">
                  Our advanced algorithms reduce file sizes while maintaining visual quality. We support multiple formats including JPEG, PNG, WebP, and AVIF with customizable quality settings.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-2">What file formats do you support?</h4>
                <p className="text-gray-600">
                  We support 13+ input formats including JPEG, PNG, WebP, AVIF, TIFF, RAW, SVG, and more. Output formats include JPEG, PNG, WebP, AVIF, and TIFF.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
                <p className="text-gray-600">
                  Yes! All images are automatically deleted within 24 hours. We use encryption in transit and at rest, and never store your images permanently.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I upgrade my subscription?</h4>
                <p className="text-gray-600">
                  You can upgrade anytime through your account dashboard. Changes take effect immediately with prorated billing.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I use the API for commercial projects?</h4>
                <p className="text-gray-600">
                  Absolutely! Our API is designed for commercial use. Choose the tier that fits your volume needs and integrate seamlessly into your applications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Levels */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Free Support</CardTitle>
                <Badge variant="secondary">Free</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Email support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Documentation access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">48-hour response time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pro Support</CardTitle>
                <Badge>Pro</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Priority email support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Live chat support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm">24-hour response time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Enterprise Support</CardTitle>
                <Badge variant="destructive">Enterprise</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Dedicated support manager</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Phone support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm">2-hour response time</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <p className="text-gray-600">
              Can't find what you're looking for? Send us a detailed message and we'll get back to you soon.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <Textarea 
                  placeholder="Please provide as much detail as possible about your question or issue..."
                  rows={6}
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Additional Resources</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => window.location.href = '/api-docs'}>
              <FileText className="w-4 h-4 mr-2" />
              API Docs
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/simple-pricing'}>
              <FileText className="w-4 h-4 mr-2" />
              Pricing
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/about'}>
              <FileText className="w-4 h-4 mr-2" />
              About Us
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/privacy-policy'}>
              <FileText className="w-4 h-4 mr-2" />
              Privacy Policy
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}