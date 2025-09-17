import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Code, 
  Zap, 
  Shield, 
  Globe, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  Calculator,
  Key,
  Download,
  Upload,
  Repeat,
  Clock,
  FileImage,
  Settings,
  BarChart3,
  Workflow,
  ExternalLink
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ApiDocs() {
  const [activeTab, setActiveTab] = useState("overview");
  const [apiKey, setApiKey] = useState("sk_test_1234567890abcdef");

  useEffect(() => {
    document.title = "API Documentation - Micro JPEG Developer API";
    
    // Handle URL fragment navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['overview', 'how-it-works', 'api-vs-web', 'documentation'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    
    // Set initial tab from URL fragment
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const codeExamples = {
    singleCompress: `curl -X POST \\
  https://api.microjpeg.com/v1/compress \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "image=@your-image.jpg" \\
  -F "settings={\\"quality\\": 85, \\"outputFormat\\": \\"webp\\"}"`,
    
    batchCompress: `curl -X POST \\
  https://api.microjpeg.com/v1/batch \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "images=@image1.jpg" \\
  -F "images=@image2.png" \\
  -F "settings={\\"quality\\": 85, \\"outputFormat\\": \\"jpeg\\"}"`,
    
    rawConvert: `curl -X POST \\
  https://api.microjpeg.com/v1/special/convert \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "file=@IMG_0001.CR2" \\
  -F "settings={\\"outputFormat\\": \\"jpeg\\", \\"quality\\": 90}"`,

    javascript: `const formData = new FormData();
formData.append('image', file);
formData.append('settings', JSON.stringify({
  quality: 85,
  outputFormat: 'webp'
}));

const response = await fetch('https://api.microjpeg.com/v1/compress', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  },
  body: formData
});

const result = await response.json();`
  };

  const tierComparison = [
    {
      name: "Free",
      operations: "500/month",
      fileSize: "10MB",
      formats: "JPEG, PNG, WebP, AVIF",
      concurrent: "2",
      api: "✓",
      support: "Community"
    },
    {
      name: "Premium",
      operations: "10,000/month",
      fileSize: "50MB", 
      formats: "All formats + RAW",
      concurrent: "5",
      api: "✓",
      support: "Email + Priority"
    },
    {
      name: "Enterprise",
      operations: "50,000/month",
      fileSize: "200MB",
      formats: "All formats + RAW",
      concurrent: "10",
      api: "✓",
      support: "24/7 + Custom"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Sub Navigation */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Globe },
              { id: "how-it-works", label: "How it Works", icon: Workflow },
              { id: "api-vs-web", label: "API vs Web", icon: ArrowRight },
              { id: "documentation", label: "Documentation", icon: Code }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  window.history.pushState(null, '', `#${id}`);
                }}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-white text-white"
                    : "border-transparent text-blue-100 hover:text-white hover:border-blue-200"
                }`}
                data-testid={`tab-${id}`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Professional Image Processing API
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Convert and compress images at scale with our powerful API. Support for all major formats including RAW, TIFF, SVG with tier-based limits for every use case.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/api-dashboard'}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Get API Key
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setActiveTab('documentation')}
                >
                  <Code className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
              </div>
            </div>

            {/* Quick Visual Guide */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-lg p-8 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Start: Making HTTP Requests</h2>
                <p className="text-gray-600">Follow these visual steps to start using our API in minutes</p>
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setActiveTab('documentation');
                      setTimeout(() => {
                        const videoElement = document.querySelector('[data-testid="video-http-tutorial"]');
                        if (videoElement) {
                          videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    📹 Watch detailed video tutorial
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Step 1: Get API Key */}
                <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      1
                    </div>
                    <CardTitle className="text-blue-900 text-sm">Get API Key</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-3">
                      <Key className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-xs text-blue-700 mb-3">Generate from dashboard</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded text-xs">
                      <code className="text-blue-800">sk_test_1234...</code>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      ✓ Tier-based limits<br/>
                      ✓ Instant generation<br/>
                      ✓ Secure storage
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Choose Tool */}
                <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      2
                    </div>
                    <CardTitle className="text-green-900 text-sm">Choose Tool</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-3">
                      <Settings className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-xs text-green-700 mb-3">Pick your method</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="bg-green-100 p-1 rounded">🖥️ cURL</div>
                      <div className="bg-green-100 p-1 rounded">📮 Postman</div>
                      <div className="bg-green-100 p-1 rounded">⚡ JavaScript</div>
                      <div className="bg-green-100 p-1 rounded">🐍 Python</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Setup Request */}
                <Card className="border-2 border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      3
                    </div>
                    <CardTitle className="text-yellow-900 text-sm">Setup Request</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-3">
                      <Upload className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                      <p className="text-xs text-yellow-700 mb-3">Configure & upload</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded text-xs">
                      <div className="text-yellow-800 font-mono">
                        POST /v1/compress<br/>
                        Authorization: Bearer...<br/>
                        Content-Type: multipart...
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-yellow-600">
                      ✓ Headers<br/>
                      ✓ File upload<br/>
                      ✓ Settings
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4: Send Request */}
                <Card className="border-2 border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      4
                    </div>
                    <CardTitle className="text-purple-900 text-sm">Send Request</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-3">
                      <Zap className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-xs text-purple-700 mb-3">Execute & process</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded text-xs">
                      <div className="text-purple-800 text-center">
                        ⚡ Processing...<br/>
                        🎯 Compressing<br/>
                        📊 Optimizing
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-purple-600">
                      ✓ Fast processing<br/>
                      ✓ Quality preserved<br/>
                      ✓ All formats
                    </div>
                  </CardContent>
                </Card>

                {/* Step 5: Get Response */}
                <Card className="border-2 border-emerald-200 bg-emerald-50/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-3">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                      5
                    </div>
                    <CardTitle className="text-emerald-900 text-sm">Get Response</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-3">
                      <Download className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                      <p className="text-xs text-emerald-700 mb-3">Receive results</p>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded text-xs">
                      <div className="text-emerald-800 font-mono">
                        {"{"}<br/>
                        &nbsp;"success": true,<br/>
                        &nbsp;"data": "base64...",<br/>
                        &nbsp;"ratio": 87.5%<br/>
                        {"}"}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-emerald-600">
                      ✓ Compressed file<br/>
                      ✓ Metadata<br/>
                      ✓ Statistics
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Code Examples */}
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Code className="w-5 h-5 mr-2 text-blue-600" />
                      cURL Example
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      <code>{`curl -X POST \\
  https://api.microjpeg.com/v1/compress \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F 'settings={"quality": 85}'`}</code>
                    </pre>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Code className="w-5 h-5 mr-2 text-green-600" />
                      JavaScript Example
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      <code>{`const formData = new FormData();
formData.append('image', file);
formData.append('settings', JSON.stringify({
  quality: 85
}));

fetch('https://api.microjpeg.com/v1/compress', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-6">
                <Button 
                  onClick={() => window.location.href = '/api-dashboard'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Start with Your API Key
                </Button>
              </div>
            </div>

            {/* Coming Soon - Extensions & Apps */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Expand Your Workflow</h2>
                <p className="text-gray-600">Powerful tools to integrate image compression into your daily workflow</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Browser Extension */}
                <Card className="border-2 border-blue-200 bg-white hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Browser Extension</CardTitle>
                    <p className="text-gray-600 text-sm">Compress images directly from your browser with one click</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Right-click to compress any image
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Bulk compress downloads folder
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Works with Chrome, Firefox, Safari
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Uses your existing API key
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 text-center">
                        🚀 <strong>Beta coming Q4 2025</strong> - Get notified when it's ready!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Desktop App */}
                <Card className="border-2 border-emerald-200 bg-white hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mb-3">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Desktop App</CardTitle>
                    <p className="text-gray-600 text-sm">Professional desktop application for power users</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Drag & drop batch processing
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Watch folders for auto-compression
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Windows, macOS, Linux support
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Offline processing with sync
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700 text-center">
                        🎯 <strong>Beta coming Q1 2026</strong> - Join the waitlist for early access!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-6">
                <Button 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    // Could add email signup for notifications
                    window.open('mailto:hello@microjpeg.com?subject=Extension%20and%20App%20Waitlist&body=Hi!%20Please%20notify%20me%20when%20the%20browser%20extension%20and%20desktop%20app%20are%20available.%0A%0AThanks!', '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Notified When Available
                </Button>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileImage className="w-5 h-5 mr-2 text-blue-600" />
                    Universal Format Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Process any image format including professional RAW files</p>
                  <div className="space-y-2">
                    <Badge variant="secondary">JPEG, PNG, WebP, AVIF</Badge>
                    <Badge variant="secondary">SVG, TIFF</Badge>
                    <Badge variant="secondary">RAW: CR2, ARW, DNG, NEF, ORF, RAF</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Tier-Based Scaling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Flexible plans to match your processing needs</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Free: 500 ops</span>
                      <span>10MB files</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Premium: 10K ops</span>
                      <span>50MB files</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Enterprise: 50K ops</span>
                      <span>200MB files</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                    High Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Optimized processing with concurrent uploads</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Concurrent processing
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Advanced compression algorithms
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Batch operations
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supported Formats */}
            <Card>
              <CardHeader>
                <CardTitle>Supported Input & Output Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Input Formats</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline">JPEG (.jpg, .jpeg)</Badge>
                      <Badge variant="outline">PNG (.png)</Badge>
                      <Badge variant="outline">WebP (.webp)</Badge>
                      <Badge variant="outline">AVIF (.avif)</Badge>
                      <Badge variant="outline">SVG (.svg)</Badge>
                      <Badge variant="outline">TIFF (.tiff, .tif)</Badge>
                      <Badge variant="outline">Canon RAW (.cr2)</Badge>
                      <Badge variant="outline">Sony RAW (.arw)</Badge>
                      <Badge variant="outline">Adobe DNG (.dng)</Badge>
                      <Badge variant="outline">Nikon RAW (.nef)</Badge>
                      <Badge variant="outline">Olympus RAW (.orf)</Badge>
                      <Badge variant="outline">Fuji RAW (.raf)</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">Output Formats</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline">JPEG (.jpg)</Badge>
                      <Badge variant="outline">PNG (.png)</Badge>
                      <Badge variant="outline">WebP (.webp)</Badge>
                      <Badge variant="outline">AVIF (.avif)</Badge>
                      <Badge variant="outline">TIFF (.tiff)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works Tab */}
        {activeTab === "how-it-works" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">How Our API Works</h1>
              <p className="text-xl text-gray-600">Simple, powerful, and reliable image processing in 3 steps</p>
            </div>

            {/* Process Steps */}
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Authenticate</h3>
                  <p className="text-gray-600">
                    Get your API key from the dashboard and include it in your requests. Each tier provides different limits and capabilities.
                  </p>
                </div>
                <div className="md:w-2/3">
                  <Card>
                    <CardContent className="p-4">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{`# Include your API key in the Authorization header
Authorization: Bearer sk_test_1234567890abcdef

# Or as a query parameter (less secure)
?api_key=sk_test_1234567890abcdef`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Upload & Configure</h3>
                  <p className="text-gray-600">
                    Send your images with processing settings. Support for single files, batch uploads, and all major formats including RAW files.
                  </p>
                </div>
                <div className="md:w-2/3">
                  <Card>
                    <CardContent className="p-4">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{codeExamples.singleCompress}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Receive Results</h3>
                  <p className="text-gray-600">
                    Get optimized images back with metadata including compression ratios, file sizes, and quality metrics.
                  </p>
                </div>
                <div className="md:w-2/3">
                  <Card>
                    <CardContent className="p-4">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{`{
  "success": true,
  "result": {
    "filename": "compressed_image.webp",
    "originalSize": 2048576,
    "compressedSize": 256000,
    "compressionRatio": 87.5,
    "format": "webp",
    "quality": 85,
    "data": "base64_encoded_image_data"
  },
  "processing_time": 1250
}`}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Advanced Processing Features</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <Settings className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold mb-2">Custom Quality Controls</h4>
                  <p className="text-sm text-gray-600">Fine-tune compression with advanced algorithms</p>
                </div>
                <div className="text-center">
                  <Layers className="w-8 h-8 mx-auto mb-3 text-green-600" />
                  <h4 className="font-semibold mb-2">Batch Processing</h4>
                  <p className="text-sm text-gray-600">Process multiple files simultaneously</p>
                </div>
                <div className="text-center">
                  <Repeat className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                  <h4 className="font-semibold mb-2">Format Conversion</h4>
                  <p className="text-sm text-gray-600">Convert between any supported formats</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API vs Web Tab */}
        {activeTab === "api-vs-web" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">API vs Web Interface</h1>
              <p className="text-xl text-gray-600">Choose the right solution for your needs</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Web Interface */}
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center text-green-800">
                    <Globe className="w-5 h-5 mr-2" />
                    Web Interface
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                      <div>
                        <h4 className="font-semibold">Perfect for Manual Processing</h4>
                        <p className="text-sm text-gray-600">Upload and compress images individually with visual controls</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                      <div>
                        <h4 className="font-semibold">Real-time Preview</h4>
                        <p className="text-sm text-gray-600">See compression results instantly with before/after comparison</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                      <div>
                        <h4 className="font-semibold">No Technical Knowledge Required</h4>
                        <p className="text-sm text-gray-600">User-friendly interface with preset quality levels</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                      <div>
                        <h4 className="font-semibold">Batch ZIP Downloads</h4>
                        <p className="text-sm text-gray-600">Download multiple processed files as a single ZIP</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-green-600 hover:bg-green-700" onClick={() => window.location.href = '/'}>
                    Try Web Interface
                  </Button>
                </CardContent>
              </Card>

              {/* API */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center text-blue-800">
                    <Code className="w-5 h-5 mr-2" />
                    Developer API
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">Automated Processing</h4>
                        <p className="text-sm text-gray-600">Integrate image processing directly into your applications</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">High-Volume Processing</h4>
                        <p className="text-sm text-gray-600">Process thousands of images with batch endpoints</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">Advanced Controls</h4>
                        <p className="text-sm text-gray-600">Programmatic access to all compression settings</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 mt-0.5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">Concurrent Processing</h4>
                        <p className="text-sm text-gray-600">Multiple simultaneous requests based on your tier</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab('overview')}>
                    Get API Access
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Tier Comparison Table */}
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">Tier Comparison</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Operations/Month</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">500</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">10,000</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">50,000</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Max File Size</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">10MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">50MB</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">200MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Concurrent Requests</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">2</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">5</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">10</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RAW Format Support</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-500">✗</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-500">✓</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-500">✓</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Support Level</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Community</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Email + Priority</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">24/7 + Custom</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Use Cases */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800">Free Tier</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Perfect for:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Small websites</li>
                    <li>• Personal projects</li>
                    <li>• Testing and evaluation</li>
                    <li>• Basic image optimization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">Premium Tier</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Perfect for:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• E-commerce sites</li>
                    <li>• Digital agencies</li>
                    <li>• Photography blogs</li>
                    <li>• Professional workflows</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-800">Enterprise Tier</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Perfect for:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Large platforms</li>
                    <li>• Media companies</li>
                    <li>• High-volume processing</li>
                    <li>• Custom integrations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === "documentation" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete API Documentation</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                Comprehensive guide to integrate image compression and conversion into your applications.
                Support for all major formats with tier-based access control.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/api-dashboard'}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Get API Key
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setActiveTab('overview')}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Quick Overview
                </Button>
              </div>
            </div>

            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key-input">Your API Key:</Label>
                    <Input
                      id="api-key-input"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk_test_..."
                      className="font-mono"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/api-dashboard'}>
                        Get your API key from the dashboard
                      </Button>
                    </p>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded">
                    <pre className="text-sm overflow-x-auto">
                      <code>{codeExamples.singleCompress}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HTTP Requests Video Tutorial */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Learn HTTP Requests (Video Tutorial)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  New to APIs? Watch this beginner-friendly tutorial to understand how HTTP requests work before using our API.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.youtube.com/embed/WXsD0ZgxjRw"
                      title="APIs for Beginners 2023 - How to use an API (Full Course / Tutorial)"
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid="video-http-tutorial"
                    ></iframe>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <h4 className="font-medium text-blue-900">📚 "APIs for Beginners 2023" by freeCodeCamp</h4>
                      <p className="text-sm text-blue-700">⏱️ 3+ hours • 👨‍🏫 Craig Dennis • 4M+ views</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://www.youtube.com/watch?v=WXsD0ZgxjRw" target="_blank" rel="noopener noreferrer">
                        Watch on YouTube
                      </a>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">📖 What You'll Learn:</h5>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• What APIs are and how they work</li>
                        <li>• HTTP methods (GET, POST, etc.)</li>
                        <li>• Making requests with code</li>
                        <li>• Handling API responses</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">🛠️ Tools Covered:</h5>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• cURL (command line)</li>
                        <li>• Postman (testing)</li>
                        <li>• JavaScript fetch()</li>
                        <li>• Python requests</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Base URL & Authentication */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                    https://api.microjpeg.com/v1
                  </code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                    Authorization: Bearer sk_test_...
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* Endpoints */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">API Endpoints</h3>

              {/* Single Compress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-3 bg-green-50 text-green-700 border-green-200">POST</Badge>
                    /compress
                  </CardTitle>
                  <p className="text-gray-600">Compress or convert a single image file</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Parameters</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <code className="bg-gray-100 px-2 py-1 rounded w-24 mr-3">image</code>
                        <span className="text-gray-600">File (required) - The image file to process</span>
                      </div>
                      <div className="flex">
                        <code className="bg-gray-100 px-2 py-1 rounded w-24 mr-3">settings</code>
                        <span className="text-gray-600">JSON (optional) - Compression settings object</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Settings Object</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre>{`{
  "quality": 85,              // 1-100 (default: 75)
  "outputFormat": "webp",     // jpeg, png, webp, avif, tiff
  "compressionAlgorithm": "standard", // standard, aggressive, lossless
  "progressive": false,       // Progressive JPEG
  "resize": {
    "width": 1920,           // Optional resize
    "height": 1080,
    "maintainAspect": true
  }
}`}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example Request</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                      <pre>{codeExamples.singleCompress}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">JavaScript Example</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                      <pre>{codeExamples.javascript}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Batch Compress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-3 bg-blue-50 text-blue-700 border-blue-200">POST</Badge>
                    /batch
                  </CardTitle>
                  <p className="text-gray-600">Process multiple images in a single request</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Parameters</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <code className="bg-gray-100 px-2 py-1 rounded w-24 mr-3">images</code>
                        <span className="text-gray-600">Files (required) - Array of image files (max 10)</span>
                      </div>
                      <div className="flex">
                        <code className="bg-gray-100 px-2 py-1 rounded w-24 mr-3">settings</code>
                        <span className="text-gray-600">JSON (optional) - Same settings as single compress</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example Request</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                      <pre>{codeExamples.batchCompress}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Format Conversion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-3 bg-purple-50 text-purple-700 border-purple-200">POST</Badge>
                    /special/convert
                  </CardTitle>
                  <p className="text-gray-600">Convert RAW, SVG, or TIFF files to standard formats</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                      <strong>Premium/Enterprise Only:</strong> RAW format conversion requires Premium or Enterprise tier
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Supported RAW Formats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Badge variant="outline">.CR2 (Canon)</Badge>
                      <Badge variant="outline">.ARW (Sony)</Badge>
                      <Badge variant="outline">.DNG (Adobe)</Badge>
                      <Badge variant="outline">.NEF (Nikon)</Badge>
                      <Badge variant="outline">.ORF (Olympus)</Badge>
                      <Badge variant="outline">.RAF (Fuji)</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example Request</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                      <pre>{codeExamples.rawConvert}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-3 bg-gray-50 text-gray-700 border-gray-200">GET</Badge>
                    /usage
                  </CardTitle>
                  <p className="text-gray-600">Get usage statistics for your API key</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                    <pre>{`curl -H "Authorization: Bearer ${apiKey}" \\
  https://api.microjpeg.com/v1/usage`}</pre>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Response</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre>{`{
  "usage": {
    "current_period": {
      "operations": 245,
      "limit": 10000,
      "remaining": 9755
    },
    "rate_limit": {
      "requests_per_hour": 1000,
      "current_hour_usage": 23
    }
  },
  "tier": "premium"
}`}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Codes */}
            <Card>
              <CardHeader>
                <CardTitle>Error Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <code className="bg-red-50 text-red-700 px-2 py-1 rounded">400</code>
                    <span className="text-sm">Bad Request - Invalid parameters or file format</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <code className="bg-red-50 text-red-700 px-2 py-1 rounded">401</code>
                    <span className="text-sm">Unauthorized - Invalid or missing API key</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <code className="bg-red-50 text-red-700 px-2 py-1 rounded">413</code>
                    <span className="text-sm">File Too Large - Exceeds tier file size limit</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <code className="bg-red-50 text-red-700 px-2 py-1 rounded">429</code>
                    <span className="text-sm">Rate Limited - Too many requests</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <code className="bg-red-50 text-red-700 px-2 py-1 rounded">500</code>
                    <span className="text-sm">Server Error - Processing failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compression Settings Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                  Compression Settings Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Basic Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">quality</code>
                        <span className="text-gray-600">10-100 (default: 75) - Compression quality level</span>
                      </div>
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">outputFormat</code>
                        <span className="text-gray-600">"jpeg", "png", "webp", "avif", "tiff"</span>
                      </div>
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">progressive</code>
                        <span className="text-gray-600">true/false - Progressive JPEG encoding</span>
                      </div>
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">webOptimization</code>
                        <span className="text-gray-600">true/false - Web-specific optimizations</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Advanced Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">compressionAlgorithm</code>
                        <span className="text-gray-600">"standard", "aggressive", "mozjpeg"</span>
                      </div>
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">resizeQuality</code>
                        <span className="text-gray-600">"lanczos", "bicubic", "bilinear"</span>
                      </div>
                      <div className="flex items-start">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-3 text-xs">resize</code>
                        <span className="text-gray-600">Object with width, height, maintainAspect</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Example Settings Object:</h5>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                    <pre>{`{
  "quality": 85,
  "outputFormat": "webp",
  "progressive": true,
  "compressionAlgorithm": "standard",
  "resize": {
    "width": 1920,
    "height": 1080,
    "maintainAspect": true
  }
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limits & Tier Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  Rate Limits & Tier Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800">Free</h4>
                    <p className="text-sm text-green-600">5 req/hour</p>
                    <p className="text-xs text-green-500">500 operations/month</p>
                    <p className="text-xs text-green-500 mt-1">10MB file limit</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800">Pro</h4>
                    <p className="text-sm text-blue-600">100 req/hour</p>
                    <p className="text-xs text-blue-500">10K operations/month</p>
                    <p className="text-xs text-blue-500 mt-1">50MB file limit</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-800">Enterprise</h4>
                    <p className="text-sm text-purple-600">10000 req/hour</p>
                    <p className="text-xs text-purple-500">50K operations/month</p>
                    <p className="text-xs text-purple-500 mt-1">200MB file limit</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-medium">Tier-Based Features:</h5>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium text-green-700">Free Tier</h6>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• Basic compression</li>
                        <li>• Format conversion</li>
                        <li>• Standard algorithms</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium text-blue-700">Pro Tier</h6>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• Batch processing</li>
                        <li>• Advanced algorithms</li>
                        <li>• RAW format support</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className="font-medium text-purple-700">Enterprise Tier</h6>
                      <ul className="text-gray-600 mt-1 space-y-1">
                        <li>• Webhook support</li>
                        <li>• Priority processing</li>
                        <li>• Custom integrations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}