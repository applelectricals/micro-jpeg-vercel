import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package, Zap, FileImage, Download, Upload, Gauge, Camera, Layers, Shield, Settings, BarChart, Clock, Users } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';
import { SEOHead } from '@/components/SEOHead';

export default function ToolsBatch() {
  const [activeTab, setActiveTab] = useState('batch');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <SEOHead
        title="Batch Image Processing Tools - Bulk Processing | Micro JPEG"
        description="Professional batch image processing tools. Process hundreds of images simultaneously with compression, conversion, and optimization. Perfect for bulk operations."
        canonicalUrl="https://microjpeg.com/tools/batch"
        keywords="batch image processing, bulk image compression, bulk image converter, batch image optimizer, bulk image tools"
      />
      <Header />

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
                  id === 'batch'
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
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Intelligent Batch Processing
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Process hundreds of images simultaneously with intelligent queue management, progress tracking, and bulk operations. 
              Perfect for photographers, agencies, and content creators who need to optimize large image collections efficiently.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
                data-testid="button-start-batch-processing"
              >
                Start Batch Processing
              </Button>
              <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '#features'}
                data-testid="button-view-features"
              >
                View Features
              </Button>
            </div>
          </div>

          {/* Batch Processing Demo */}
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 shadow-lg border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Batch Processing Power</CardTitle>
                <p className="text-gray-600">See how we handle large-scale image optimization</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <Package className="w-10 h-10 text-red-600 mb-1" />
                      <span className="text-xs text-red-700 font-medium">Large Collection</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">500 Images</h3>
                    <p className="text-gray-600">Mixed formats, 2.5GB total</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Intelligent Queue</p>
                    <p className="text-sm text-gray-600">Parallel processing</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <Download className="w-10 h-10 text-green-600 mb-1" />
                      <span className="text-xs text-green-700 font-medium">Optimized ZIP</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">500KB Each</h3>
                    <p className="text-gray-600">Ready in 3 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Batch Features */}
          <div id="features">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Advanced Batch Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Bulk Operations</h3>
                <p className="text-gray-600 text-sm">
                  Process up to 1000 images simultaneously with intelligent queue management
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Gauge className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Real-time progress indicators with detailed processing statistics and ETA
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Uniform Settings</h3>
                <p className="text-gray-600 text-sm">
                  Apply consistent quality, format, and optimization settings across all images
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">ZIP Downloads</h3>
                <p className="text-gray-600 text-sm">
                  Download all processed images as organized ZIP archives with folder structure
                </p>
              </Card>
            </div>
          </div>

          {/* Queue Management */}
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Intelligent Queue Management</CardTitle>
              <p className="text-gray-600">Advanced processing engine optimized for large-scale operations</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Parallel Processing</h3>
                  <p className="text-gray-600 text-sm">
                    Process multiple images simultaneously using cloud-distributed computing power
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Smart Prioritization</h3>
                  <p className="text-gray-600 text-sm">
                    Intelligent scheduling based on file size, format complexity, and processing requirements
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Error Recovery</h3>
                  <p className="text-gray-600 text-sm">
                    Automatic retry mechanisms and graceful error handling for problematic files
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Perfect for Large-Scale Projects
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <Camera className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Photo Agencies</h3>
                <p className="text-gray-600 text-sm">Process thousands of photos from events, shoots, and client deliveries</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <Users className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Corporate Teams</h3>
                <p className="text-gray-600 text-sm">Optimize marketing assets, product catalogs, and website imagery at scale</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <FileImage className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Content Creators</h3>
                <p className="text-gray-600 text-sm">Batch process social media content, thumbnails, and promotional materials</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <Layers className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Archive Migration</h3>
                <p className="text-gray-600 text-sm">Convert legacy image collections to modern formats for long-term storage</p>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">How Batch Processing Works</CardTitle>
              <p className="text-gray-600">Streamlined workflow for maximum efficiency</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">1. Upload Collection</h3>
                  <p className="text-gray-600">Drag & drop or select hundreds of images at once from any supported format</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">2. Configure Settings</h3>
                  <p className="text-gray-600">Set uniform quality, format, and optimization preferences for the entire batch</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">3. Process Queue</h3>
                  <p className="text-gray-600">Watch real-time progress as our intelligent queue processes your images</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">4. Download ZIP</h3>
                  <p className="text-gray-600">Get your optimized images as organized ZIP archives ready for deployment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}