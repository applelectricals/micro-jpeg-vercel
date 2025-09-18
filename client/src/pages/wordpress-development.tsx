import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, 
  Download, 
  FileImage, 
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bug,
  Zap,
  Shield,
  Users,
  Globe,
  ArrowUp,
  Plus,
  Wrench,
  Star
} from "lucide-react";
import { SiWordpress, SiGithub } from "react-icons/si";
import { Link } from "wouter";
import Header from "@/components/header";
import { SEOHead } from '@/components/SEOHead';

export default function WordPressDevelopment() {
  const [activeTab, setActiveTab] = useState('development');

  useEffect(() => {
    document.title = "WordPress Plugin Development - Changelog & Technical Info | Micro JPEG";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead
        title="WordPress Plugin Development - Changelog & Technical Info | Micro JPEG"
        description="WordPress plugin development details, changelog, technical specifications, and developer resources for Micro JPEG image compression plugin integration."
        canonicalUrl="https://microjpeg.com/wordpress-plugin/development"
        keywords="WordPress plugin development, WordPress API integration, plugin changelog, technical documentation, developer resources"
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
                  id === 'api'
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
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Plugin Development
            </h1>
            <p className="text-xl text-gray-600">
              Browse the code, check development progress, and stay updated with the latest changes
            </p>
          </div>

          {/* Developer Resources */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center p-6">
              <SiGithub className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Source Code</h3>
              <p className="text-gray-600 text-sm mb-4">Browse the complete source code and contribute to development</p>
              <Button 
                onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin', '_blank')}
                variant="outline"
                size="sm"
              >
                <SiGithub className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </Card>
            
            <Card className="text-center p-6">
              <GitBranch className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">SVN Repository</h3>
              <p className="text-gray-600 text-sm mb-4">Access the official WordPress.org SVN repository</p>
              <Button 
                onClick={() => window.open('https://plugins.svn.wordpress.org/micro-jpeg/', '_blank')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Browse SVN
              </Button>
            </Card>
            
            <Card className="text-center p-6">
              <Bug className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Issue Tracker</h3>
              <p className="text-gray-600 text-sm mb-4">Report bugs and request features</p>
              <Button 
                onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/issues', '_blank')}
                variant="outline"
                size="sm"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issues
              </Button>
            </Card>
          </div>

          {/* Development Tabs */}
          <Tabs defaultValue="changelog" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="technical">Technical Details</TabsTrigger>
              <TabsTrigger value="contributing">Contributing</TabsTrigger>
            </TabsList>

            {/* Changelog */}
            <TabsContent value="changelog" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Version History & Changelog
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Complete version history with detailed release notes and improvements.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {/* Version 2.1.0 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-green-600">v2.1.0</Badge>
                        <span>Latest Release</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">December 15, 2024</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-green-600" />
                          New Features
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>WebP and AVIF format support added</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Bulk optimization dashboard with progress tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Advanced quality settings per image size</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Real-time compression statistics</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <ArrowUp className="w-4 h-4 text-blue-600" />
                          Improvements
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>50% faster background processing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Enhanced multisite network support</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Better error handling and retry logic</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Updated admin UI with modern design</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        Bug Fixes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Fixed memory leak in large image processing</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Resolved compatibility issue with WP Offload S3</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Fixed backup restoration for special characters in filenames</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Version 2.0.3 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary">v2.0.3</Badge>
                        <span>Security Update</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">November 8, 2024</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Security Fixes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Fixed CSRF vulnerability in settings page</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Enhanced nonce verification for AJAX requests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Improved input sanitization</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        Bug Fixes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Fixed issue with PHP 8.1 compatibility</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Resolved timeout issues on shared hosting</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Version 2.0.2 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">v2.0.2</Badge>
                        <span>Performance Update</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">October 15, 2024</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        Performance Improvements
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-yellow-600" />
                          <span>Optimized database queries for large media libraries</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-yellow-600" />
                          <span>Reduced memory usage during bulk operations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-yellow-600" />
                          <span>Improved caching for compression statistics</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-600" />
                        New Features
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Added compression preview before applying</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Integration with popular cache plugins</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Version 2.0.1 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">v2.0.1</Badge>
                        <span>Bug Fix Release</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">September 22, 2024</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        Bug Fixes
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Fixed fatal error when checking compression limits</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Resolved admin menu display issue on multisite</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Fixed image metadata preservation for rotated images</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Version 2.0.0 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-blue-600">v2.0.0</Badge>
                        <span>Major Release</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">September 1, 2024</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">
                        🎉 Complete rewrite with modern architecture and improved performance
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-green-600" />
                          Major New Features
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Background compression with queue system</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Comprehensive backup and restore system</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Advanced compression statistics dashboard</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Multisite network administration</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <ArrowUp className="w-4 h-4 text-blue-600" />
                          Architecture Improvements
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Modern object-oriented PHP code</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Improved error handling and logging</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Enhanced plugin compatibility</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span>Better resource management</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Earlier versions collapsed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-600">Earlier Versions (1.x series)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">
                      View complete version history including all 1.x releases with detailed changelogs on our 
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/releases', '_blank')}>
                        GitHub releases page
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Roadmap */}
            <TabsContent value="roadmap" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Development Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Our planned features and improvements for upcoming releases.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-orange-600">v2.2.0</Badge>
                        <span>Coming Next Quarter</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">Q1 2025</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">🎯 Planned Features</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• AI-powered quality optimization</li>
                          <li>• Batch processing with pause/resume</li>
                          <li>• Advanced CDN integration</li>
                          <li>• Real-time compression monitoring</li>
                          <li>• Custom compression profiles</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">🔧 Technical Improvements</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• WordPress 6.5 compatibility</li>
                          <li>• PHP 8.3 support</li>
                          <li>• Enhanced REST API endpoints</li>
                          <li>• Improved CLI commands</li>
                          <li>• Better debugging tools</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">v2.3.0</Badge>
                        <span>Future Release</span>
                      </CardTitle>
                      <div className="text-sm text-gray-500">Q2 2025</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">🚀 Advanced Features</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Machine learning optimization</li>
                          <li>• Advanced image analytics</li>
                          <li>• Cloud storage integration</li>
                          <li>• Enterprise management console</li>
                          <li>• White-label options</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">🌐 Platform Expansion</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Shopify integration</li>
                          <li>• Magento support</li>
                          <li>• Drupal compatibility</li>
                          <li>• Standalone API library</li>
                          <li>• Mobile app development</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Community Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Features most requested by our users:</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Selective folder compression</span>
                        <Badge variant="secondary">127 votes</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Scheduled compression jobs</span>
                        <Badge variant="secondary">89 votes</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Image format conversion rules</span>
                        <Badge variant="secondary">76 votes</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Compression quality presets</span>
                        <Badge variant="secondary">64 votes</Badge>
                      </div>
                    </div>
                    <Button className="mt-4" variant="outline" onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/discussions', '_blank')}>
                      Vote on Features
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Technical Details */}
            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">System Requirements</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>WordPress Version:</span>
                          <Badge variant="outline">5.0+</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>PHP Version:</span>
                          <Badge variant="outline">7.4+</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>Memory Limit:</span>
                          <Badge variant="outline">128MB+</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>Execution Time:</span>
                          <Badge variant="outline">60s+</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>cURL Support:</span>
                          <Badge variant="outline">Required</Badge>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Plugin Architecture</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Code Structure:</span>
                          <Badge variant="outline">Object-Oriented</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>Autoloading:</span>
                          <Badge variant="outline">PSR-4</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>Database Tables:</span>
                          <Badge variant="outline">3 Custom</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>Background Jobs:</span>
                          <Badge variant="outline">WP Cron</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>API Integration:</span>
                          <Badge variant="outline">REST + AJAX</Badge>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">&lt; 100ms</div>
                      <p className="text-sm text-gray-600">Admin page load time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">2-5s</div>
                      <p className="text-sm text-gray-600">Average compression time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">&lt; 5MB</div>
                      <p className="text-sm text-gray-600">Memory per image processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Complete technical documentation for developers integrating with the plugin.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => window.location.href = "/api-docs"}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Code2 className="w-4 h-4 mr-2" />
                      API Reference Documentation
                    </Button>
                    <Button 
                      onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/wiki', '_blank')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      Developer Wiki
                    </Button>
                    <Button 
                      onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/tree/main/docs', '_blank')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Technical Specifications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contributing */}
            <TabsContent value="contributing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contributing to Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    We welcome contributions from the community! Here's how you can help improve the plugin.
                  </p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Code Contributions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Fork the repository on GitHub</li>
                        <li>Clone your fork locally</li>
                        <li>Create a feature branch</li>
                        <li>Make your changes</li>
                        <li>Submit a pull request</li>
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Development Setup</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                        <div>git clone https://github.com/microjpeg/wordpress-plugin</div>
                        <div>cd wordpress-plugin</div>
                        <div>composer install</div>
                        <div>npm install</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Other Ways to Help</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Testing & Feedback</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Test beta releases</li>
                        <li>• Report bugs and issues</li>
                        <li>• Suggest new features</li>
                        <li>• Share performance data</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Documentation</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Improve existing docs</li>
                        <li>• Write tutorials</li>
                        <li>• Translate the plugin</li>
                        <li>• Create video guides</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Coding Standards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">PHP Standards</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Follow WordPress Coding Standards</li>
                        <li>• Use PSR-4 autoloading</li>
                        <li>• Write unit tests for new features</li>
                        <li>• Document all public methods</li>
                        <li>• Use type hints where possible</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">JavaScript Standards</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Use modern ES6+ syntax</li>
                        <li>• Follow WordPress JS guidelines</li>
                        <li>• Write JSDoc comments</li>
                        <li>• Use consistent formatting</li>
                        <li>• Test in multiple browsers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Join our developer community and stay updated with the latest development news.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => window.open('https://github.com/microjpeg/wordpress-plugin/discussions', '_blank')}
                      variant="outline"
                    >
                      <SiGithub className="w-4 h-4 mr-2" />
                      GitHub Discussions
                    </Button>
                    <Button 
                      onClick={() => window.open('https://discord.gg/microjpeg', '_blank')}
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Discord Server
                    </Button>
                    <Button 
                      onClick={() => window.location.href = "mailto:developers@microjpeg.com"}
                      variant="outline"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Developer Mailing List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}