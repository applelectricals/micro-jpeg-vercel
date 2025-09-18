import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, Star, FileImage, Download, Upload, Camera, Image, Layers, Gauge, Settings, BarChart, Package } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';
import { SEOHead } from '@/components/SEOHead';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';

export default function Tools() {
  const [activeTab, setActiveTab] = useState('tools');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <SEOHead
        title="Professional Image Tools - Micro JPEG"
        description="Comprehensive suite of professional image tools for compression, conversion, batch processing, and optimization. Advanced features for photographers, designers, and businesses."
        canonicalUrl="https://microjpeg.com/tools"
        keywords="image tools, professional image processing, image optimization suite, batch processing tools, image converter"
      />
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <DynamicBreadcrumb />
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'tools', label: 'Tools', icon: Settings },
              { id: 'compress', label: 'Compress', icon: Zap },
              { id: 'convert', label: 'Convert', icon: ArrowRight },
              { id: 'batch', label: 'Batch', icon: Package },
              { id: 'optimizer', label: 'Optimizer', icon: BarChart }
            ].map(({ id, label, icon: Icon }) => (
              <Link 
                key={id} 
                href={id === 'tools' ? '/tools' : `/tools/${id}`}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'tools'
                    ? 'border-white text-white'
                    : 'border-transparent text-indigo-100 hover:text-white hover:border-indigo-200'
                }`}
                data-testid={`nav-${id}`}
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
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Professional Image Tools
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Comprehensive suite of professional image processing tools. Compress, convert, optimize, and batch process your images 
              with advanced AI-powered algorithms and support for 13+ formats including professional RAW files.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
                data-testid="button-start-processing"
              >
                Start Processing Now
              </Button>
              <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '#tools-overview'}
                data-testid="button-explore-tools"
              >
                Explore Tools
              </Button>
            </div>
          </div>

          {/* Tools Overview */}
          <div id="tools-overview" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100 group">
              <Link href="/tools/compress" className="block">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Zap className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Compress</h3>
                <p className="text-gray-600 text-sm mb-4">
                  AI-powered compression achieving up to 80% size reduction while preserving stunning visual quality
                </p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">13+ Formats</Badge>
              </Link>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100 group">
              <Link href="/tools/convert" className="block">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Format Convert</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Transform between formats including RAW files to modern web formats like WebP and AVIF
                </p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">RAW Support</Badge>
              </Link>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100 group">
              <Link href="/tools/batch" className="block">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Package className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Batch Process</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Process multiple images simultaneously with intelligent queue management and bulk operations
                </p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Bulk Operations</Badge>
              </Link>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100 group">
              <Link href="/tools/optimizer" className="block">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <BarChart className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Image Optimizer</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Advanced optimization with performance analysis, size metrics, and quality comparisons
                </p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Analytics</Badge>
              </Link>
            </Card>
          </div>

          {/* Format Support Showcase */}
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">13+ Supported Formats</CardTitle>
              <p className="text-gray-600">Professional support for all major image formats across all tools</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Standard & Web Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['JPEG', 'PNG', 'WebP', 'AVIF', 'SVG', 'TIFF'].map(format => (
                    <Badge key={format} variant="secondary" className="bg-indigo-100 text-indigo-700">{format}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Professional RAW Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['CR2', 'ARW', 'DNG', 'NEF', 'ORF', 'RAF', 'RW2'].map(format => (
                    <Badge key={format} variant="outline" className="border-purple-200 text-purple-700">{format}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Professional Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <Gauge className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">AI-Powered Processing</h3>
                <p className="text-gray-600 text-sm">Advanced algorithms analyze and optimize each image for perfect quality-to-size ratio</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <Globe className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Universal Compatibility</h3>
                <p className="text-gray-600 text-sm">Support for 13+ formats including professional camera RAW files from all major brands</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <Zap className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Lightning Performance</h3>
                <p className="text-gray-600 text-sm">Cloud-optimized processing pipeline delivers results in seconds, not minutes</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <Shield className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Quality Preservation</h3>
                <p className="text-gray-600 text-sm">Maintain stunning visual fidelity while achieving maximum file size reduction</p>
              </Card>
            </div>
          </div>

          {/* Quick Start Guide */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">How to Get Started</CardTitle>
              <p className="text-gray-600">Professional image processing in just 3 simple steps</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">1. Choose Your Tool</h3>
                  <p className="text-gray-600">Select from compression, conversion, batch processing, or optimization tools based on your needs</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">2. Upload & Configure</h3>
                  <p className="text-gray-600">Upload your images and adjust quality, format, and optimization settings with advanced controls</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">3. Download Results</h3>
                  <p className="text-gray-600">Get your processed images individually or as batch ZIP downloads, ready for immediate use</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Perfect for Every Use Case
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-md transition-shadow border-indigo-100">
                <Camera className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Photographers</h3>
                <p className="text-gray-600 text-sm">Process RAW files, batch convert portfolios, and optimize images for web galleries and client delivery</p>
              </Card>
              
              <Card className="p-6 hover:shadow-md transition-shadow border-purple-100">
                <Globe className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Web Developers</h3>
                <p className="text-gray-600 text-sm">Optimize images for faster loading, convert to modern web formats, and improve Core Web Vitals</p>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow border-indigo-100">
                <FileImage className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Content Creators</h3>
                <p className="text-gray-600 text-sm">Reduce file sizes for social media, batch process content, and maintain quality across platforms</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}