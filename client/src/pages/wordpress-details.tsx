import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Download, 
  ArrowRight, 
  Settings, 
  Zap,
  Shield,
  Globe,
  Code2,
  Upload,
  FileImage,
  Clock,
  Users,
  HelpCircle,
  Mail,
  Server,
  Gauge,
  Image,
  Layers
} from "lucide-react";
import { SiWordpress } from "react-icons/si";
import { Link } from "wouter";
import Header from "@/components/header";
import { SEOHead } from '@/components/SEOHead';

export default function WordPressDetails() {
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    document.title = "WordPress Plugin Details - Automatic Image Compression | Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead
        title="WordPress Plugin Details - Automatic Image Compression | Micro JPEG"
        description="Complete WordPress plugin details for automatic image compression. Features, installation guide, technical specifications, and integration options for your WordPress site."
        canonicalUrl="https://microjpeg.com/wordpress-plugin"
        keywords="WordPress plugin details, WordPress image compression features, WordPress plugin installation, WordPress SEO optimization"
      />
      <Header />
      
      {/* Sub Navigation */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'details', label: 'Details', icon: FileImage },
              { id: 'installation', label: 'Installation', icon: Download },
              { id: 'docs', label: 'Documentation', icon: FileImage },
              { id: 'api', label: 'API', icon: Code2 }
            ].map(({ id, label, icon: Icon }) => (
              <Link 
                key={id} 
                href={id === 'details' ? '/wordpress-plugin' : 
                      id === 'installation' ? '/wordpress-plugin/install' : 
                      id === 'docs' ? '/wordpress-plugin/docs' :
                      '/wordpress-plugin/api'}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'details'
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-100 hover:text-white hover:border-blue-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <SiWordpress className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Micro JPEG WordPress Plugin
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automatically compress, convert, and optimize all images uploaded to your WordPress site including RAW files. 
              Support for JPEG, PNG, WebP, AVIF, SVG, TIFF, and professional camera RAW formats with intelligent format conversion.
            </p>
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                onClick={() => window.location.href = "/api/download/wordpress-plugin"}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3"
                data-testid="button-download-plugin"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Plugin
              </Button>
              <Link
                href="/wordpress-plugin/install"
                className="inline-flex items-center px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                data-testid="button-installation-guide"
              >
                Installation Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="description" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="multisite">Multisite</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* Description */}
            <TabsContent value="description" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5" />
                    Plugin Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    The Micro JPEG WordPress Plugin automatically compresses, converts, and optimizes every image uploaded to your WordPress media library. 
                    Supporting 13+ image formats including professional RAW files (CR2, ARW, DNG, NEF, ORF, RAF, RW2), it uses advanced compression algorithms 
                    to reduce file sizes by up to 80% while maintaining excellent visual quality.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Perfect for professional photographers, bloggers, e-commerce sites, and any WordPress website handling diverse image formats. 
                    The plugin features intelligent format conversion, automatically converting RAW files to web-optimized formats, and works 
                    seamlessly in the background requiring no technical knowledge.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Key Benefits</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Faster page loading times</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Reduced bandwidth usage</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Better SEO rankings</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Improved user experience</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Supported Formats</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Standard Formats:</p>
                          <div className="flex flex-wrap gap-2">
                            {['JPEG', 'PNG', 'WebP', 'AVIF', 'SVG', 'TIFF'].map(format => (
                              <Badge key={format} variant="secondary">{format}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">RAW Formats:</p>
                          <div className="flex flex-wrap gap-2">
                            {['CR2', 'ARW', 'DNG', 'NEF', 'ORF', 'RAF', 'RW2'].map(format => (
                              <Badge key={format} variant="outline" className="text-purple-600 border-purple-200">{format}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Automatically detects, converts, and optimizes all supported image formats including professional RAW files
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why Choose Micro JPEG?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Gauge className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Superior Compression</h4>
                      <p className="text-sm text-gray-600">Advanced algorithms achieve up to 80% size reduction while maintaining quality</p>
                    </div>
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Automatic Processing</h4>
                      <p className="text-sm text-gray-600">No manual work required - compression happens automatically on upload</p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Safe & Reliable</h4>
                      <p className="text-sm text-gray-600">Backup originals and rollback capabilities for complete peace of mind</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Automatic Compression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Every image uploaded to your media library is automatically compressed in the background.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Compression on upload</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">All image sizes compressed</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Background processing</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      Bulk Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Compress thousands of existing images in your media library with one click.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Process entire media library</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Progress tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Pause and resume</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      Flexible Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Customize compression settings to match your quality requirements.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Quality control</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Image size selection</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Format preferences</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Backup & Restore
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Keep original images safe with automatic backups and easy restoration.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Original backup storage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">One-click restore</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Backup management</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-orange-600" />
                      RAW File Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Professional camera RAW file support with intelligent conversion to web formats.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">CR2, ARW, DNG, NEF support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">ORF, RAF, RW2 compatibility</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Automatic web conversion</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-teal-600" />
                      Smart Format Conversion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Intelligent format conversion optimized for web performance and compatibility.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">SVG to optimized raster</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">TIFF compression</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Next-gen format output</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* How It Works */}
            <TabsContent value="how-it-works" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How the Plugin Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Image Upload Detection</h3>
                        <p className="text-gray-600">The plugin automatically detects when new images are uploaded to your WordPress media library.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Format Detection & Conversion</h3>
                        <p className="text-gray-600">The plugin identifies the image format (including RAW files) and determines the optimal web format for conversion.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Background Processing</h3>
                        <p className="text-gray-600">Images are sent to Micro JPEG's compression servers for processing, without blocking your workflow.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Smart Compression</h3>
                        <p className="text-gray-600">Advanced algorithms analyze each image and apply optimal compression settings for maximum size reduction.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">File Replacement</h3>
                        <p className="text-gray-600">Compressed images replace the originals in your media library, with originals safely backed up.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Compression Technology</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Advanced lossy and lossless algorithms</li>
                        <li>• Smart quality adjustment based on content</li>
                        <li>• RAW file processing and conversion</li>
                        <li>• 13+ format support (JPEG, PNG, WebP, AVIF, SVG, TIFF, RAW)</li>
                        <li>• Intelligent format conversion</li>
                        <li>• Metadata preservation options</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">WordPress Integration</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Hooks into WordPress upload process</li>
                        <li>• Compatible with all image sizes</li>
                        <li>• Works with page builders</li>
                        <li>• Admin dashboard integration</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Getting Started */}
            <TabsContent value="getting-started" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Step 1: Install the Plugin</h3>
                      <p className="text-gray-600">Download and install the plugin from your WordPress dashboard or WordPress.org repository.</p>
                    </div>
                    
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Step 2: Get Your API Key</h3>
                      <p className="text-gray-600">Sign up for a Micro JPEG account and copy your API key from the dashboard.</p>
                    </div>
                    
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Step 3: Configure Settings</h3>
                      <p className="text-gray-600">Enter your API key in the plugin settings and choose your compression preferences.</p>
                    </div>
                    
                    <div className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Step 4: Optimize Existing Images</h3>
                      <p className="text-gray-600">Use the bulk optimization tool to compress all existing images in your media library.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimizing All Your Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The plugin provides multiple ways to ensure all images on your site are optimized:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Automatic Future Compression</h4>
                      <p className="text-blue-800 text-sm">
                        Once activated, every new image upload is automatically compressed in the background.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Bulk Optimization Tool</h4>
                      <p className="text-green-800 text-sm">
                        Use the dedicated bulk optimization page to process thousands of existing images at once.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Selective Processing</h4>
                      <p className="text-purple-800 text-sm">
                        Choose specific folders, dates, or image types to optimize only what you need.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Multisite Support */}
            <TabsContent value="multisite" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    WordPress Multisite Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The Micro JPEG plugin is fully compatible with WordPress Multisite installations, offering flexible management options for network administrators.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Network Admin Features</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Centralized API key management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Network-wide settings control</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Usage monitoring across all sites</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Bulk optimization for entire network</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Site Admin Features</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Individual site customization</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Site-specific compression stats</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Local backup management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Independent optimization queues</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multisite Configuration Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Centralized Mode</h4>
                      <p className="text-blue-800 text-sm">
                        Network admin manages all settings and API keys. Individual sites use compression automatically.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Distributed Mode</h4>
                      <p className="text-green-800 text-sm">
                        Each site manages its own API key and settings while sharing plugin updates and features.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Hybrid Mode</h4>
                      <p className="text-purple-800 text-sm">
                        Network admin sets defaults and limits, while sites can customize within those boundaries.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Will the plugin slow down my website?</h3>
                      <p className="text-gray-600 text-sm">
                        No, the plugin processes images in the background using WordPress's built-in queue system. 
                        Your website continues to function normally while images are being compressed.
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">What happens to my original images?</h3>
                      <p className="text-gray-600 text-sm">
                        Original images are safely backed up before compression. You can restore originals at any time 
                        through the plugin's backup management interface.
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Does it work with page builders like Elementor?</h3>
                      <p className="text-gray-600 text-sm">
                        Yes, the plugin works with all page builders including Elementor, Gutenberg, Divi, and others. 
                        Any image uploaded through WordPress gets automatically compressed.
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Can I choose which image sizes to compress?</h3>
                      <p className="text-gray-600 text-sm">
                        Absolutely! You can select which WordPress image sizes to compress (thumbnail, medium, large, etc.) 
                        and set different quality levels for each size.
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">What file formats are supported?</h3>
                      <p className="text-gray-600 text-sm">
                        The plugin supports JPEG, PNG, WebP, and AVIF formats. It can also convert between formats 
                        for optimal compression (e.g., PNG to WebP for smaller file sizes).
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Is there a limit to how many images I can compress?</h3>
                      <p className="text-gray-600 text-sm">
                        Compression limits depend on your Micro JPEG plan. Free accounts get monthly compression credits, 
                        while premium plans offer unlimited compression.
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Can I use the plugin on multiple websites?</h3>
                      <p className="text-gray-600 text-sm">
                        Yes, you can install the plugin on multiple websites. Each site will need its own API key 
                        and will count toward your account's usage limits.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">What if I'm not satisfied with the compression results?</h3>
                      <p className="text-gray-600 text-sm">
                        You can adjust quality settings anytime and re-compress images. Original images are always 
                        preserved, so you can restore them if needed. We also offer a 30-day money-back guarantee.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Still have questions? Our support team is here to help!
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">support@microjpeg.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Average response time: 2-4 hours</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">24/7 support for premium users</span>
                    </div>
                  </div>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = "mailto:support@microjpeg.com"}
                  >
                    Get Support
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}