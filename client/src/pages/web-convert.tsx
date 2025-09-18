import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileImage, Zap, Globe, Star, Download, Upload, Gauge, Camera, Layers, Shield } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';

export default function WebConvert() {
  const [activeTab, setActiveTab] = useState('convert');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Header />

      {/* Sub Navigation */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Globe },
              { id: 'compress', label: 'Compress', icon: Zap },
              { id: 'convert', label: 'Convert', icon: ArrowRight }
            ].map(({ id, label, icon: Icon }) => (
              <Link 
                key={id} 
                href={id === 'convert' ? '/web/convert' : `/web/${id}`}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'convert'
                    ? 'border-white text-white'
                    : 'border-transparent text-teal-100 hover:text-white hover:border-teal-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="space-y-12">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowRight className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              Professional Format Conversion
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Transform between 13+ image formats including professional RAW files. Convert to modern web formats 
              like WebP and AVIF for superior performance, or process camera RAW files for professional workflows.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
              >
                Start Converting Now
              </Button>
              <Button 
                variant="outline" 
                className="border-teal-200 text-teal-600 hover:bg-teal-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '#formats'}
              >
                View Formats
              </Button>
            </div>
          </div>

          {/* Format Support Showcase */}
          <Card className="p-8 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200" id="formats">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">13+ Supported Formats</CardTitle>
              <p className="text-gray-600">Professional conversion between all major image formats</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Web & Standard Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['JPEG', 'PNG', 'WebP', 'AVIF', 'SVG', 'TIFF'].map(format => (
                    <Badge key={format} variant="secondary" className="bg-teal-100 text-teal-700 px-3 py-1">{format}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Professional RAW Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['CR2 (Canon)', 'ARW (Sony)', 'DNG (Adobe)', 'NEF (Nikon)', 'ORF (Olympus)', 'RAF (Fujifilm)', 'RW2 (Panasonic)'].map(format => (
                    <Badge key={format} variant="outline" className="border-cyan-200 text-cyan-700 px-3 py-1">{format}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Demo */}
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 shadow-lg border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Conversion Examples</CardTitle>
                <p className="text-gray-600">See how we transform between different formats</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <Camera className="w-10 h-10 text-teal-600 mb-1" />
                      <span className="text-xs text-teal-700 font-medium">RAW/Legacy</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Source Format</h3>
                    <p className="text-gray-600">CR2, TIFF, PNG, JPEG</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Smart Conversion</p>
                    <p className="text-sm text-gray-600">Format optimization</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <Globe className="w-10 h-10 text-cyan-600 mb-1" />
                      <span className="text-xs text-cyan-700 font-medium">Web Ready</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Target Format</h3>
                    <p className="text-gray-600">WebP, AVIF, optimized JPEG</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              Why Convert to Modern Formats?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Gauge className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Superior Compression</h3>
                <p className="text-gray-600 text-sm">WebP and AVIF provide 25-50% better compression than JPEG with identical quality</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <Globe className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Universal Support</h3>
                <p className="text-gray-600 text-sm">Modern browsers support next-gen formats with automatic fallback options</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Zap className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Lightning Speed</h3>
                <p className="text-gray-600 text-sm">Dramatically faster page loads and improved user experience across all devices</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <Star className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">SEO Advantage</h3>
                <p className="text-gray-600 text-sm">Boost Core Web Vitals and search rankings with optimized image formats</p>
              </Card>
            </div>
          </div>

          {/* Professional Features */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">Professional Conversion Features</CardTitle>
              <p className="text-gray-600">Advanced tools for photographers, designers, and developers</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">RAW Processing</h3>
                  <p className="text-gray-600">
                    Convert professional camera RAW files from Canon, Nikon, Sony, and more to web-ready formats
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">Batch Conversion</h3>
                  <p className="text-gray-600">
                    Convert multiple images simultaneously with consistent settings and quality preservation
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">Quality Control</h3>
                  <p className="text-gray-600">
                    Fine-tune compression settings with real-time preview and before/after comparisons
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}