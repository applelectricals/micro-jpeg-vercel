import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, Star, FileImage, Download, Upload, Camera, Image, Layers, Gauge } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';

export default function WebOverview() {
  const [activeTab, setActiveTab] = useState('overview');

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
                href={id === 'overview' ? '/web/overview' : `/web/${id}`}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'overview'
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
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              Professional Web Image Optimization
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Transform your images with our advanced compression and conversion tools. Support for 13+ formats including 
              professional RAW files, with up to 80% size reduction while maintaining stunning visual quality.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
              >
                Start Optimizing Now
              </Button>
              <Button 
                variant="outline" 
                className="border-teal-200 text-teal-600 hover:bg-teal-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '/web/compress'}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Format Support Showcase */}
          <Card className="p-8 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">13+ Supported Formats</CardTitle>
              <p className="text-gray-600">Professional support for all major image formats</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Standard Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['JPEG', 'PNG', 'WebP', 'AVIF', 'SVG', 'TIFF'].map(format => (
                    <Badge key={format} variant="secondary" className="bg-teal-100 text-teal-700">{format}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Professional RAW Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {['CR2', 'ARW', 'DNG', 'NEF', 'ORF', 'RAF', 'RW2'].map(format => (
                    <Badge key={format} variant="outline" className="border-cyan-200 text-cyan-700">{format}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-teal-100">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Smart Compression</h3>
              <p className="text-gray-600 text-sm">
                AI-powered algorithms achieve up to 80% size reduction with superior quality preservation
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-cyan-100">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Format Conversion</h3>
              <p className="text-gray-600 text-sm">
                Convert between 13+ formats including RAW files to modern web formats
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-teal-100">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">RAW Processing</h3>
              <p className="text-gray-600 text-sm">
                Professional camera RAW file support for photographers and designers
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-cyan-100">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Batch Processing</h3>
              <p className="text-gray-600 text-sm">
                Process multiple images simultaneously with intelligent queue management
              </p>
            </Card>
          </div>

          {/* Quick Start */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">Quick Start Guide</CardTitle>
              <p className="text-gray-600">Get started with professional image optimization in just 3 steps</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">1. Upload Images</h3>
                  <p className="text-gray-600">Drag & drop or select from 13+ supported formats including RAW files</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">2. Choose Settings</h3>
                  <p className="text-gray-600">Select quality, format, and optimization preferences with advanced controls</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">3. Download Results</h3>
                  <p className="text-gray-600">Get optimized images individually or as ZIP batch downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              Why Choose Our Professional Tools?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Shield className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Quality Preservation</h3>
                <p className="text-gray-600 text-sm">AI-powered algorithms maintain stunning visual quality while achieving maximum compression</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <Globe className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Modern Web Formats</h3>
                <p className="text-gray-600 text-sm">Convert to WebP, AVIF, and next-generation formats for superior web performance</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-teal-100">
                <Zap className="w-10 h-10 text-teal-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Lightning Speed</h3>
                <p className="text-gray-600 text-sm">Process images in seconds with our cloud-optimized compression pipeline</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-cyan-100">
                <FileImage className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Universal Support</h3>
                <p className="text-gray-600 text-sm">13+ formats including professional RAW files from all major camera brands</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}