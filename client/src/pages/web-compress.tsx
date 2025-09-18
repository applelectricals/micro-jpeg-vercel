import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Upload, Zap, FileImage, Download, Globe, Star, Gauge, Camera, Layers, Shield } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';

export default function WebCompress() {
  const [activeTab, setActiveTab] = useState('compress');

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
                href={id === 'compress' ? '/web/compress' : `/web/${id}`}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'compress'
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
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              Advanced Image Compression
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Achieve up to 80% size reduction with our AI-powered compression algorithms. Support for 13+ formats including 
              professional RAW files, with intelligent quality preservation and batch processing capabilities.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
              >
                Start Compressing Now
              </Button>
              <Button 
                variant="outline" 
                className="border-teal-200 text-teal-600 hover:bg-teal-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '#demo'}
              >
                View Demo
              </Button>
            </div>
          </div>

          {/* Format Support Showcase */}
          <Card className="p-8 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200" id="demo">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Supported Formats</CardTitle>
              <p className="text-gray-600">Professional compression for all major image formats</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Web & Standard Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['JPEG', 'PNG', 'WebP', 'AVIF', 'SVG', 'TIFF'].map(format => (
                    <Badge key={format} variant="secondary" className="bg-teal-100 text-teal-700">{format}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Professional RAW Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['CR2 (Canon)', 'ARW (Sony)', 'DNG (Adobe)', 'NEF (Nikon)', 'ORF (Olympus)', 'RAF (Fujifilm)', 'RW2 (Panasonic)'].map(format => (
                    <Badge key={format} variant="outline" className="border-cyan-200 text-cyan-700">{format}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compression Demo */}
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 shadow-lg border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Compression Performance</CardTitle>
                <p className="text-gray-600">See how our advanced algorithms achieve stunning results</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FileImage className="w-14 h-14 text-red-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Original Image</h3>
                    <p className="text-3xl font-bold text-red-600">2.5 MB</p>
                    <p className="text-gray-600">High quality JPEG</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">AI-Powered</p>
                    <p className="text-sm text-gray-600">Smart compression</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FileImage className="w-14 h-14 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Optimized Image</h3>
                    <p className="text-3xl font-bold text-green-600">500 KB</p>
                    <p className="text-gray-600">80% smaller</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              Why Compress Your Images?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Gauge className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Faster Load Times</h3>
                <p className="text-gray-600 text-sm">Dramatically improve website speed and user experience with optimized file sizes</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <Download className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Reduced Bandwidth</h3>
                <p className="text-gray-600 text-sm">Save hosting costs and improve accessibility for users on limited data plans</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Zap className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Better SEO</h3>
                <p className="text-gray-600 text-sm">Search engines favor fast-loading sites, boosting your search rankings</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <Shield className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Quality Preservation</h3>
                <p className="text-gray-600 text-sm">Maintain stunning visual quality while achieving maximum file size reduction</p>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">How Our Compression Works</CardTitle>
              <p className="text-gray-600">Advanced AI-powered optimization process</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">1. Upload & Analyze</h3>
                  <p className="text-gray-600">
                    AI analyzes your image content, format, and quality to determine optimal compression strategy
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">2. Smart Processing</h3>
                  <p className="text-gray-600">
                    Advanced algorithms apply format-specific optimizations while preserving visual fidelity
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">3. Instant Download</h3>
                  <p className="text-gray-600">
                    Get your optimized images individually or as batch ZIP downloads, ready for deployment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              Advanced Compression Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-teal-100">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Gauge className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Adjustable Quality</h3>
                <p className="text-gray-600 text-sm">
                  Precise control from 1-100% to perfectly balance file size and visual quality
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-cyan-100">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileImage className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">13+ Formats</h3>
                <p className="text-gray-600 text-sm">
                  Professional support including RAW files with format-specific optimizations
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-teal-100">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Batch Processing</h3>
                <p className="text-gray-600 text-sm">
                  Process multiple images simultaneously with intelligent queue management
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-cyan-100">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Lightning Speed</h3>
                <p className="text-gray-600 text-sm">
                  Get compressed images in seconds with our cloud-optimized processing pipeline
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}