import { SEOHead } from '@/components/SEOHead';
import { PRIMARY_KEYWORDS } from '@/data/seoData';
import Header from '@/components/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SiWordpress } from 'react-icons/si';
import { Download, Zap, Shield, Settings, BarChart } from 'lucide-react';

export default function WordPressImagePlugin() {
  const seoData = {
    title: 'WordPress Image Optimization Plugin - Auto Compress Images | MicroJPEG',
    description: 'Automatically compress WordPress images with our plugin. Reduce file sizes up to 90%, improve page speed, boost SEO. Easy installation, bulk optimization available.',
    keywords: 'WordPress image optimization plugin, WordPress image compression, WordPress image plugin, optimize WordPress images, WordPress SEO images, reduce WordPress image size',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "MicroJPEG WordPress Plugin",
      "description": "WordPress plugin for automatic image compression and optimization",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "WordPress",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  };

  return (
    <>
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        structuredData={seoData.structuredData}
        canonicalUrl="https://microjpeg.com/wordpress-image-plugin"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                <SiWordpress className="w-4 h-4 mr-2" />
                WordPress Plugin
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-blue-600">WordPress Image</span><br />
                Optimization Plugin
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Automatically compress and optimize images when you upload to WordPress. 
                Reduce file sizes by 90%, improve page speed, and boost your SEO rankings - all without losing quality.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-download-plugin">
                  <Download className="w-5 h-5 mr-2" />
                  Download Free Plugin
                </Button>
                <Button size="lg" variant="outline" data-testid="link-view-documentation">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">WordPress Plugin Features</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Automatic Compression</h3>
                <p className="text-gray-600">
                  Images are automatically compressed when uploaded to your media library. 
                  No manual work required - just upload and go.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Bulk Optimization</h3>
                <p className="text-gray-600">
                  Optimize all existing images in your media library with one click. 
                  Process thousands of images in the background.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Custom Settings</h3>
                <p className="text-gray-600">
                  Configure compression quality, output formats, and size limits. 
                  Perfect control over your image optimization workflow.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Backup & Restore</h3>
                <p className="text-gray-600">
                  Keep original images safely backed up. Restore originals anytime 
                  if needed. Never lose your source files.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <SiWordpress className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">WordPress Native</h3>
                <p className="text-gray-600">
                  Built specifically for WordPress with native integration. 
                  Works with all themes and other plugins seamlessly.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">WebP & AVIF Support</h3>
                <p className="text-gray-600">
                  Convert images to modern WebP and AVIF formats for maximum 
                  compression and fastest loading times.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Easy Installation</h2>
            
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: "Download Plugin",
                  description: "Download the MicroJPEG WordPress plugin ZIP file from our secure server."
                },
                {
                  step: 2,
                  title: "Upload to WordPress",
                  description: "Go to Plugins → Add New → Upload Plugin in your WordPress admin panel."
                },
                {
                  step: 3,
                  title: "Activate & Configure",
                  description: "Activate the plugin and configure your compression settings in the MicroJPEG settings page."
                },
                {
                  step: 4,
                  title: "Start Optimizing",
                  description: "New uploads are automatically optimized. Use bulk optimization for existing images."
                }
              ].map((step) => (
                <Card key={step.step} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* WordPress Optimization FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">WordPress Image Optimization FAQ</h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "Will the plugin slow down my WordPress site?",
                  answer: "No! The compression happens in the background via our API, so it won't affect your website's performance. The optimized images will actually make your site load faster."
                },
                {
                  question: "Can I optimize existing images in my media library?",
                  answer: "Yes! The plugin includes a bulk optimization feature that lets you compress all existing images with just a few clicks. Track progress in real-time."
                },
                {
                  question: "What happens if I deactivate the plugin?",
                  answer: "Your optimized images remain optimized. If you have backup enabled, you can restore original images anytime. The plugin is fully reversible."
                },
                {
                  question: "Does it work with WooCommerce and other plugins?",
                  answer: "Absolutely! Our plugin is built to work seamlessly with WooCommerce, page builders, gallery plugins, and all major WordPress themes and plugins."
                },
                {
                  question: "How many images can I optimize for free?",
                  answer: "The plugin uses your MicroJPEG API quota. Free accounts get 500 compressions per month, which is perfect for small to medium WordPress sites."
                }
              ].map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-bold text-lg mb-3">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}