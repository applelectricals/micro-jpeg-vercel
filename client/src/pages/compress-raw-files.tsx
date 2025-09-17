import { SEOHead } from '@/components/SEOHead';
import { TECHNICAL_KEYWORDS, SEO_CONTENT, STRUCTURED_DATA } from '@/data/seoData';
import Header from '@/components/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Zap, Shield, Download } from 'lucide-react';

export default function CompressRawFiles() {
  const seoData = {
    title: 'Compress RAW Files Online - Convert CR2, NEF, ARW, DNG to JPG | MicroJPEG',
    description: 'Compress and convert RAW camera files online. Support for Canon CR2, Nikon NEF, Sony ARW, Adobe DNG, and more. Professional RAW file processing with lossless quality.',
    keywords: TECHNICAL_KEYWORDS.formats.join(', '),
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "RAW File Compressor",
      "description": "Professional RAW file compression and conversion service",
      "applicationCategory": "MultimediaApplication",
      "featureList": [
        "Canon CR2 compression",
        "Nikon NEF compression", 
        "Sony ARW compression",
        "Adobe DNG compression",
        "Professional quality processing"
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
        canonicalUrl="https://microjpeg.com/compress-raw-files"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 sm:mb-6 bg-purple-100 text-purple-800 border-purple-200 text-sm sm:text-base px-3 py-1">
                <Camera className="w-4 h-4 mr-2" />
                Professional RAW Processing
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Compress <span className="text-purple-600">RAW Camera Files</span>
                <br className="hidden sm:block" />
                <span className="block sm:inline"> Without Quality Loss</span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
                Convert and compress professional camera RAW files including Canon CR2, Nikon NEF, Sony ARW, Adobe DNG, and 13+ more formats. 
                Optimized for photographers and creative professionals.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8" data-testid="button-start-compressing">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Compressing RAW Files
                </Button>
                <Button size="lg" variant="outline" className="h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8 border-2" data-testid="link-view-supported-formats">
                  View Supported Formats
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Supported RAW Formats */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">Supported RAW Camera Formats</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { format: 'CR2', brand: 'Canon', description: 'Canon RAW files from EOS cameras' },
                { format: 'NEF', brand: 'Nikon', description: 'Nikon Electronic Format files' },
                { format: 'ARW', brand: 'Sony', description: 'Sony Alpha RAW files' },
                { format: 'DNG', brand: 'Adobe', description: 'Digital Negative open standard' },
                { format: 'ORF', brand: 'Olympus', description: 'Olympus RAW Format files' },
                { format: 'RAF', brand: 'Fujifilm', description: 'Fuji RAW image files' },
                { format: 'RW2', brand: 'Panasonic', description: 'Panasonic RAW files' },
                { format: 'PEF', brand: 'Pentax', description: 'Pentax Electronic Format' },
                { format: 'SRW', brand: 'Samsung', description: 'Samsung RAW files' }
              ].map((format) => (
                <Card key={format.format} className="p-4 sm:p-6 hover:shadow-lg transition-shadow hover-lift">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg">{format.format}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{format.brand}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700">{format.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose MicroJPEG for RAW */}
        <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose MicroJPEG for RAW File Compression?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Professional Quality</h3>
                <p className="text-gray-600">
                  Advanced algorithms preserve image quality while achieving up to 90% file size reduction. 
                  Perfect for professional photographers.
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Lightning Fast</h3>
                <p className="text-gray-600">
                  Process large RAW files in seconds with our optimized compression engine. 
                  Batch processing available for multiple files.
                </p>
              </Card>
              
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Multiple Formats</h3>
                <p className="text-gray-600">
                  Convert RAW files to optimized JPG, PNG, WebP, or AVIF formats. 
                  Choose the best format for your workflow.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">RAW File Compression FAQ</h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "What RAW file formats do you support?",
                  answer: "We support all major RAW formats including Canon CR2, Nikon NEF, Sony ARW, Adobe DNG, Olympus ORF, Fujifilm RAF, Panasonic RW2, Pentax PEF, and Samsung SRW files."
                },
                {
                  question: "Will compressing RAW files reduce image quality?",
                  answer: "Our advanced compression algorithms maintain professional-grade quality while reducing file sizes by up to 90%. We use lossless compression techniques optimized for photography."
                },
                {
                  question: "Can I batch compress multiple RAW files?",
                  answer: "Yes! Premium users can upload and process multiple RAW files simultaneously. Free users can process one file at a time with up to 10MB file size limit."
                },
                {
                  question: "What output formats are available for RAW conversion?",
                  answer: "You can convert RAW files to optimized JPG, PNG, WebP, or AVIF formats. Each format is optimized for different use cases - web, print, or storage."
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