import { SEOHead } from '@/components/SEOHead';
import { PRIMARY_KEYWORDS, LONG_TAIL_KEYWORDS } from '@/data/seoData';
import Header from '@/components/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Zap, Download, BarChart, Clock, Shield } from 'lucide-react';

export default function BulkImageCompression() {
  const seoData = {
    title: 'Bulk Image Compression - Compress Multiple Images Online | MicroJPEG',
    description: 'Compress hundreds of images at once with bulk processing. Upload multiple files, reduce sizes by 90%, download as ZIP. Perfect for websites, ecommerce, and developers.',
    keywords: 'bulk image compression, compress multiple images, batch image processing, bulk photo compression, compress images in bulk, mass image optimization',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Bulk Image Compressor",
      "description": "Compress multiple images simultaneously with bulk processing",
      "applicationCategory": "MultimediaApplication",
      "featureList": [
        "Bulk image compression",
        "Multiple file upload",
        "ZIP download",
        "Batch processing",
        "Progress tracking"
      ]
    }
  };

  return (
    <>
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        structuredData={seoData.structuredData}
        canonicalUrl="https://microjpeg.com/bulk-image-compression"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
                <BarChart className="w-4 h-4 mr-2" />
                Bulk Processing
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-green-600">Bulk Image</span><br />
                Compression Made Easy
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Compress hundreds of images simultaneously with our powerful bulk processing engine. 
                Upload multiple files, optimize them all at once, and download as a convenient ZIP file.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700" data-testid="button-start-bulk-compression">
                  <Upload className="w-5 h-5 mr-2" />
                  Start Bulk Compression
                </Button>
                <Button size="lg" variant="outline" data-testid="link-how-it-works">
                  How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Bulk Compression in 3 Easy Steps</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">1. Upload Multiple Files</h3>
                <p className="text-gray-600">
                  Drag and drop or select up to 100 images at once. 
                  Support for JPG, PNG, WebP, AVIF, TIFF, SVG, and RAW formats.
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">2. Process in Parallel</h3>
                <p className="text-gray-600">
                  Our servers process all images simultaneously using advanced 
                  compression algorithms. Watch real-time progress updates.
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">3. Download ZIP</h3>
                <p className="text-gray-600">
                  Download all compressed images in a single ZIP file. 
                  Original filenames preserved with compression stats included.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bulk Processing?</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Save Time</h3>
                <p className="text-gray-600">
                  Process hundreds of images in minutes instead of hours. 
                  Perfect for large photo collections and website migrations.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Consistent Quality</h3>
                <p className="text-gray-600">
                  Apply the same compression settings to all images ensuring 
                  consistent quality and file sizes across your collection.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Enterprise Grade</h3>
                <p className="text-gray-600">
                  Built for high-volume processing with enterprise security. 
                  Perfect for agencies, developers, and large organizations.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Easy Downloads</h3>
                <p className="text-gray-600">
                  Get all compressed images in one convenient ZIP file. 
                  No need to download files individually.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Parallel Processing</h3>
                <p className="text-gray-600">
                  Advanced algorithms process multiple images simultaneously 
                  for maximum speed and efficiency.
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Multiple Formats</h3>
                <p className="text-gray-600">
                  Support for 13+ input formats including RAW files. 
                  Convert to optimized web formats in bulk.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Perfect for Every Use Case</h2>
            
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">Website Owners</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Compress product images for ecommerce sites
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Optimize gallery photos for faster loading
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Reduce server storage costs dramatically
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Improve SEO with faster page speeds
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6">Developers & Agencies</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Integrate with API for automated workflows
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Process client assets efficiently
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Handle website migrations and optimization
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Offer compression services to clients
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Bulk Compression FAQ</h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "How many images can I compress at once?",
                  answer: "Free users can compress up to 10 images per batch. Premium users can process up to 100 images simultaneously. Enterprise users have custom limits based on their needs."
                },
                {
                  question: "What file formats are supported for bulk processing?",
                  answer: "We support JPG, PNG, WebP, AVIF, TIFF, SVG, and RAW formats (CR2, NEF, ARW, DNG, ORF, RAF, RW2) for bulk compression and conversion."
                },
                {
                  question: "How long does bulk processing take?",
                  answer: "Processing time depends on file sizes and quantity. Typically, 100 images (5MB each) take 2-3 minutes to process with our parallel processing engine."
                },
                {
                  question: "Can I choose different settings for each image?",
                  answer: "Bulk processing applies the same compression settings to all images for consistency. For individual settings, use our single image compression tool."
                },
                {
                  question: "Is there a file size limit for bulk uploads?",
                  answer: "Free users have a 10MB per file limit. Premium users can upload files up to 100MB each. Total batch size limits vary by plan."
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