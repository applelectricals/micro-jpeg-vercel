import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  Zap, 
  Shield, 
  Globe, 
  Layers, 
  Settings, 
  BarChart3,
  FileImage,
  Download,
  Upload,
  Repeat,
  Clock,
  CheckCircle,
  Smartphone,
  Palette,
  Code,
  Workflow,
  Cloud
} from "lucide-react";

export default function Features() {
  useEffect(() => {
    document.title = "Features - Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Image Compression Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to optimize, compress, and convert images at scale. From simple web compression to enterprise-grade API integration.
          </p>
        </div>

        {/* Core Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced compression algorithms process images in seconds, not minutes. Optimized for speed without sacrificing quality.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your images are automatically deleted within 24 hours. End-to-end encryption ensures your data stays private and secure.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Globe className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Universal Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Support for 13+ input formats including JPEG, PNG, WebP, AVIF, RAW, SVG, and TIFF. Convert between any supported format.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compression Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Advanced Compression</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Settings className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Smart Quality Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Intelligent quality algorithms maintain visual fidelity while maximizing compression ratios.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Layers className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Multiple Algorithms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Choose from standard, aggressive, or MozJPEG compression algorithms for optimal results.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Repeat className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Batch Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Process multiple images simultaneously with consistent settings and quality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Palette className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Progressive JPEG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Enable progressive loading for better user experience on slow connections.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Web Interface Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Web Interface</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-blue-600" />
                  Drag & Drop Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Intuitive drag-and-drop interface</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Real-time preview and comparison</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Instant quality adjustment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Bulk download options</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-6 h-6 mr-2 text-green-600" />
                  Mobile Optimized
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Responsive design for all devices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Touch-friendly interface</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Fast mobile processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Offline capability</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Developer API</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Code className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">RESTful API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Simple, well-documented REST API with comprehensive examples in multiple languages.
                </p>
                <Badge variant="secondary">JSON</Badge>
                <Badge variant="secondary" className="ml-1">HTTP</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Workflow className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Webhook Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Real-time notifications for batch processing completion and status updates.
                </p>
                <Badge>Enterprise</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Detailed analytics dashboard with usage metrics, performance insights, and quota management.
                </p>
                <Badge variant="outline">Real-time</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enterprise Features */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Enterprise Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <Cloud className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Custom Deployment</h3>
                <p className="text-sm text-gray-600">On-premise or dedicated cloud instances for maximum control and security.</p>
              </div>
              
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Priority Processing</h3>
                <p className="text-sm text-gray-600">Dedicated processing queues ensure faster turnaround times for your requests.</p>
              </div>
              
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">SLA Guarantees</h3>
                <p className="text-sm text-gray-600">99.9% uptime SLA with dedicated support and monitoring.</p>
              </div>
              
              <div className="text-center">
                <Settings className="w-12 h-12 mx-auto text-orange-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Custom Integration</h3>
                <p className="text-sm text-gray-600">Tailored solutions and custom integrations for your specific workflow needs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Special Format Support */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Professional Format Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <FileImage className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">RAW Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Professional RAW format support for photographers and designers with advanced color processing.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Canon CR2/CR3</li>
                  <li>• Nikon NEF</li>
                  <li>• Sony ARW</li>
                  <li>• Adobe DNG</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <FileImage className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Vector Graphics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  SVG optimization and rasterization with customizable resolution and quality settings.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• SVG optimization</li>
                  <li>• Vector to raster conversion</li>
                  <li>• Scalable output</li>
                  <li>• Preserve transparency</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <FileImage className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">High-End Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  TIFF and other professional formats with lossless compression and metadata preservation.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• TIFF compression</li>
                  <li>• Metadata preservation</li>
                  <li>• Color profile support</li>
                  <li>• Multi-layer handling</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16">
          <div className="bg-gray-900 text-white rounded-lg p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Performance Metrics</h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <h3 className="text-4xl font-bold text-blue-400 mb-2">95%</h3>
                <p className="text-gray-300">Average Size Reduction</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-green-400 mb-2">&lt;3s</h3>
                <p className="text-gray-300">Average Processing Time</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-purple-400 mb-2">99.9%</h3>
                <p className="text-gray-300">Service Uptime</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-orange-400 mb-2">13+</h3>
                <p className="text-gray-300">Supported Formats</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Try our free tier or explore our API with comprehensive documentation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => window.location.href = '/'}>
              Start Compressing
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = '/api-docs'}>
              View API Docs
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}