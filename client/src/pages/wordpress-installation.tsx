import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Download, 
  Upload, 
  Settings, 
  Key,
  ArrowRight,
  AlertTriangle,
  Code2,
  FileImage,
  Search,
  Folder,
  Globe,
  Monitor,
  Shield
} from "lucide-react";
import { SiWordpress } from "react-icons/si";
import { Link } from "wouter";
import Header from "@/components/header";
import { SEOHead } from '@/components/SEOHead';

export default function WordPressInstallation() {
  const [activeTab, setActiveTab] = useState('installation');

  useEffect(() => {
    document.title = "WordPress Plugin Installation Guide | Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead
        title="WordPress Plugin Installation Guide | Micro JPEG"
        description="Step-by-step WordPress plugin installation guide for Micro JPEG image compression. Easy setup, configuration, and activation instructions for your WordPress site."
        canonicalUrl="https://microjpeg.com/wordpress-plugin/install"
        keywords="WordPress plugin installation, WordPress setup guide, image compression plugin install, WordPress plugin configuration"
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
                  id === 'installation'
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
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <SiWordpress className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              WordPress Plugin Installation
            </h1>
            <p className="text-xl text-gray-600">
              Step-by-step guide to install and configure the Micro JPEG compression plugin
            </p>
          </div>

          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Prerequisites</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>WordPress 5.0 or higher</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>PHP 7.4 or higher</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>cURL extension enabled</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Admin access to WordPress</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Micro JPEG API key</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Backup of your website</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Installation Methods */}
          <Tabs defaultValue="dashboard" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">From Your WordPress Dashboard</TabsTrigger>
              <TabsTrigger value="wordpress-org">From WordPress.org</TabsTrigger>
              <TabsTrigger value="configuration">Optional Configuration</TabsTrigger>
            </TabsList>

            {/* WordPress Dashboard Installation */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Install from WordPress Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    The easiest way to install the Micro JPEG plugin is directly from your WordPress admin dashboard.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Access Plugin Section</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Log in to your WordPress admin dashboard and navigate to <strong>Plugins → Add New</strong>
                        </p>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <code className="text-sm">WordPress Admin → Plugins → Add New</code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Search for Micro JPEG</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          In the search box, type "Micro JPEG" or "Image Compression" to find our plugin
                        </p>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-800 text-sm flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Look for "Micro JPEG - WordPress Image Compression" by Micro JPEG
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Install the Plugin</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Click "Install Now" button next to the Micro JPEG plugin
                        </p>
                        <Button size="sm" className="mb-3">
                          <Download className="w-4 h-4 mr-2" />
                          Install Now
                        </Button>
                        <p className="text-xs text-gray-500">WordPress will automatically download and install the plugin</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Activate the Plugin</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          After installation, click "Activate" to enable the plugin on your website
                        </p>
                        <Button size="sm" variant="outline">
                          Activate
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Once activated, you'll need to configure your API key:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Go to <strong>Settings → Micro JPEG</strong> in your WordPress admin</li>
                    <li>Enter your API key from your Micro JPEG account</li>
                    <li>Choose your compression settings</li>
                    <li>Save the configuration</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WordPress.org Installation */}
            <TabsContent value="wordpress-org" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Install from WordPress.org
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Download the plugin directly from the WordPress.org repository and upload it manually.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Download from WordPress.org</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Visit the WordPress.org plugin repository and download the latest version
                        </p>
                        <Button 
                          onClick={() => window.open('https://wordpress.org/plugins/micro-jpeg/', '_blank')}
                          className="mb-3"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download from WordPress.org
                        </Button>
                        <p className="text-xs text-gray-500">This will download a .zip file containing the plugin</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Upload to WordPress</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          In your WordPress admin, go to <strong>Plugins → Add New → Upload Plugin</strong>
                        </p>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <code className="text-sm">Plugins → Add New → Upload Plugin</code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Choose File and Install</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Click "Choose File", select the downloaded .zip file, then click "Install Now"
                        </p>
                        <div className="space-y-2">
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                          <Button size="sm">
                            Install Now
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Activate and Configure</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Activate the plugin and configure your API key in the settings
                        </p>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-green-800 text-sm">
                            The plugin is now ready to compress your images automatically!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual FTP Installation (Advanced)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">For advanced users who prefer FTP installation:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Extract the downloaded .zip file on your computer</li>
                    <li>Upload the 'micro-jpeg' folder to '/wp-content/plugins/' via FTP</li>
                    <li>Log in to WordPress admin and activate the plugin from the Plugins page</li>
                    <li>Configure your API key in Settings → Micro JPEG</li>
                  </ol>
                  <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                    <p className="text-yellow-800 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Make sure to set correct file permissions (755 for folders, 644 for files)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Optional Configuration */}
            <TabsContent value="configuration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Optional Configuration Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    While the plugin works great with default settings, you can customize these options for optimal performance.
                  </p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compression Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Quality Levels</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>JPEG Quality:</span>
                          <Badge variant="outline">85% (recommended)</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>PNG Quality:</span>
                          <Badge variant="outline">90% (recommended)</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>WebP Quality:</span>
                          <Badge variant="outline">80% (recommended)</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Image Sizes</h4>
                      <div className="space-y-1 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Original images</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Thumbnails</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Medium size</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Large size</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Backup Settings</h4>
                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Keep original images</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Auto-cleanup after 30 days</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Processing Options</h4>
                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Background processing</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Compress on upload</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Auto-retry failed compressions</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Tuning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Processing Limits</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Max concurrent jobs:</span>
                          <Badge variant="secondary">3</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Timeout per image:</span>
                          <Badge variant="secondary">60s</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Memory limit:</span>
                          <Badge variant="secondary">256MB</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Error Handling</h4>
                      <div className="space-y-1 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Email notifications on errors</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Debug logging</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Integration Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">CDN Support</h4>
                      <div className="space-y-1 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>CloudFront integration</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>MaxCDN support</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Cache purging</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Plugin Compatibility</h4>
                      <div className="space-y-1 text-sm">
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>WooCommerce</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>NextGEN Gallery</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>WP Offload S3</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">🚀 Performance Tip</h4>
                      <p className="text-blue-800 text-sm">
                        For high-traffic sites, enable background processing and set a reasonable concurrent job limit to avoid server overload.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">💡 Quality Tip</h4>
                      <p className="text-green-800 text-sm">
                        Start with 85% quality for JPEG and adjust based on your specific needs. Photography sites may prefer 90-95%.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">🔒 Security Tip</h4>
                      <p className="text-purple-800 text-sm">
                        Always keep backups enabled for the first few weeks to ensure you're happy with compression results.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you encounter any issues during installation, our support team is here to help!
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.location.href = "mailto:support@microjpeg.com"}
                  variant="outline"
                >
                  Email Support
                </Button>
                <Button 
                  onClick={() => window.location.href = "/wordpress/details"}
                  variant="outline"
                >
                  View FAQ
                </Button>
                <Button 
                  onClick={() => window.location.href = "/api-docs"}
                  variant="outline"
                >
                  API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}