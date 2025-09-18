import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart, Zap, FileImage, Download, Upload, Gauge, Camera, Layers, Shield, Settings, Package, TrendingUp, Activity, Target, Cpu } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/header';
import { SEOHead } from '@/components/SEOHead';

export default function ToolsOptimizer() {
  const [activeTab, setActiveTab] = useState('optimizer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <SEOHead
        title="Image Optimization Tools - Advanced Optimization | Micro JPEG"
        description="Advanced image optimization tools for web performance. Analyze, optimize, and improve image loading speeds. Perfect for web developers and SEO optimization."
        canonicalUrl="https://microjpeg.com/tools/optimizer"
        keywords="image optimization tools, web image optimizer, image performance analyzer, image SEO tools, web performance optimization"
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
                  id === 'optimizer'
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
              <BarChart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Smart Image Optimizer
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Advanced optimization with comprehensive performance analysis, quality metrics, and detailed comparisons. 
              Perfect for developers and designers who need precise control over image optimization with data-driven insights.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/'}
                data-testid="button-start-optimizing"
              >
                Start Optimizing
              </Button>
              <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '#analytics'}
                data-testid="button-view-analytics"
              >
                View Analytics
              </Button>
            </div>
          </div>

          {/* Optimization Analytics */}
          <div className="max-w-5xl mx-auto" id="analytics">
            <Card className="p-8 shadow-lg border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Performance Analytics</CardTitle>
                <p className="text-gray-600">Comprehensive metrics and optimization insights</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">-78%</div>
                    <div className="text-sm text-gray-600">File Size Reduction</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">+45%</div>
                    <div className="text-sm text-gray-600">Page Load Speed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">96.8</div>
                    <div className="text-sm text-gray-600">Quality Score</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">2.1s</div>
                    <div className="text-sm text-gray-600">Processing Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimizer Features */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Advanced Optimization Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Performance Metrics</h3>
                <p className="text-gray-600 text-sm">
                  Detailed analytics including file size, quality scores, and optimization ratios
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Quality Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Before/after comparisons with visual quality assessment and metrics
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-indigo-100">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Optimization Insights</h3>
                <p className="text-gray-600 text-sm">
                  AI-powered recommendations for format selection and quality settings
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-shadow border-purple-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">Real-time Preview</h3>
                <p className="text-gray-600 text-sm">
                  Live optimization preview with instant quality and size feedback
                </p>
              </Card>
            </div>
          </div>

          {/* Detailed Analytics */}
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Comprehensive Analysis Dashboard</CardTitle>
              <p className="text-gray-600">Data-driven optimization with detailed insights and recommendations</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gauge className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Performance Scoring</h3>
                  <p className="text-gray-600 text-sm">
                    Comprehensive scoring system evaluating compression ratio, quality retention, and processing efficiency
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Algorithm Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Detailed breakdown of which optimization algorithms work best for your specific image content
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Format Recommendations</h3>
                  <p className="text-gray-600 text-sm">
                    AI-powered suggestions for optimal format selection based on content type and intended use case
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Use Cases */}
          <div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Perfect for Data-Driven Optimization
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <Cpu className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Performance Engineers</h3>
                <p className="text-gray-600 text-sm">Analyze and optimize images for Core Web Vitals and site performance</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <TrendingUp className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">UX Designers</h3>
                <p className="text-gray-600 text-sm">Balance visual quality with loading performance for optimal user experience</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow border-indigo-100">
                <BarChart className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Marketing Teams</h3>
                <p className="text-gray-600 text-sm">Optimize campaign assets with detailed ROI analysis and performance metrics</p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-md transition-shadow border-purple-100">
                <Target className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Quality Assurance</h3>
                <p className="text-gray-600 text-sm">Validate optimization results with comprehensive quality and performance testing</p>
              </Card>
            </div>
          </div>

          {/* Quality Comparison */}
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 shadow-lg border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Quality vs. Performance Analysis</CardTitle>
                <p className="text-gray-600">Visual quality assessment with detailed performance metrics</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <FileImage className="w-10 h-10 text-red-600 mb-1" />
                      <span className="text-xs text-red-700 font-medium">Original</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">2.5 MB | 100% Quality</h3>
                    <p className="text-gray-600">Baseline performance</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Smart Analysis</p>
                    <p className="text-sm text-gray-600">Quality preservation</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex flex-col items-center justify-center mx-auto mb-4 p-4">
                      <FileImage className="w-10 h-10 text-green-600 mb-1" />
                      <span className="text-xs text-green-700 font-medium">Optimized</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">550 KB | 97% Quality</h3>
                    <p className="text-gray-600">78% size reduction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="p-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">How Smart Optimization Works</CardTitle>
              <p className="text-gray-600">AI-powered analysis and optimization workflow</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">1. Upload & Analyze</h3>
                  <p className="text-gray-600">AI analyzes image content, complexity, and optimal compression strategies</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">2. Performance Testing</h3>
                  <p className="text-gray-600">Multiple optimization approaches tested with quality and performance metrics</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">3. Optimal Selection</h3>
                  <p className="text-gray-600">Best-performing optimization selected based on your quality requirements</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">4. Detailed Report</h3>
                  <p className="text-gray-600">Download optimized images with comprehensive analytics and recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}