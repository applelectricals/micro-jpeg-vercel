import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Copy, 
  Download, 
  Upload, 
  Settings, 
  Image as ImageIcon, 
  FileText,
  Camera,
  Layers,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  Code2,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/header";

interface ApiResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
  usage?: any;
}

export default function ApiDemo() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [quality, setQuality] = useState(85);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [curlCommand, setCurlCommand] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [activeTab, setActiveTab] = useState('demo');

  // Set document title
  useEffect(() => {
    document.title = "API Demo - Live Professional Format Conversion Examples";
  }, []);

  // Generate curl command
  useEffect(() => {
    if (selectedFile) {
      const curl = `curl -X POST "https://your-domain.com/api/v1/special/convert" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -F "file=@${selectedFile.name}" \\
  -F "outputFormat=${outputFormat}" \\
  -F "quality=${quality}" \\
  -F "resize=false"`;
      setCurlCommand(curl);
      
      const js = `// Convert ${selectedFile.name} using the API
const formData = new FormData();
formData.append('file', file); // Your file input
formData.append('outputFormat', '${outputFormat}');
formData.append('quality', '${quality}');

const response = await fetch('/api/v1/special/convert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}'
  },
  body: formData
});

const result = await response.json();
console.log('Conversion result:', result);`;
      setJsCode(js);
    }
  }, [selectedFile, apiKey, outputFormat, quality]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const runApiCall = async () => {
    if (!selectedFile || !apiKey) {
      toast({
        title: "Missing Requirements",
        description: "Please select a file and enter your API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('outputFormat', outputFormat);
      formData.append('quality', quality.toString());
      formData.append('resize', 'false');

      const apiResponse = await fetch('/api/v1/special/convert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      const result = await apiResponse.json();
      setResponse(result);

      if (result.success) {
        toast({
          title: "Conversion Successful!",
          description: `File converted to ${outputFormat.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Conversion Failed",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResponse({
        success: false,
        error: "Network Error",
        message: error.message
      });
      toast({
        title: "Request Failed",
        description: "Check your API key and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2'].includes(ext || '')) {
      return <Camera className="w-5 h-5 text-orange-600" />;
    }
    if (ext === 'svg') {
      return <Layers className="w-5 h-5 text-blue-600" />;
    }
    if (['tiff', 'tif'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      {/* Sub Navigation */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'demo', label: 'Interactive Demo & Code Examples', icon: Code2 },
              { id: 'documentation', label: 'Documentation', icon: FileText },
              { id: 'pricing', label: 'Pricing', icon: DollarSign }
            ].map(({ id, label, icon: Icon }) => (
              <Link 
                key={id} 
                href={id === 'demo' ? '/api-demo' : 
                      id === 'documentation' ? '/api-docs' : 
                      '/simple-pricing'}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                  id === 'demo'
                    ? 'border-white text-white'
                    : 'border-transparent text-purple-100 hover:text-white hover:border-purple-200'
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
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Professional Format Conversion API Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test our RAW, SVG, and TIFF conversion API in real-time. Convert professional formats 
              to standard web-optimized images with advanced quality controls.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center space-x-3 mb-3">
                <Camera className="w-8 h-8 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-800">RAW Camera Files</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Convert professional camera files (ARW, CR2, DNG, NEF, ORF, RAF, RW2) to web formats
              </p>
              <div className="mt-3 text-xs text-orange-600 font-medium">
                Max 150MB • 15-30 sec processing
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <Layers className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Vector Graphics</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Convert scalable SVG files to raster formats with precise quality control
              </p>
              <div className="mt-3 text-xs text-blue-600 font-medium">
                Max 50MB • 5-10 sec processing
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center space-x-3 mb-3">
                <ImageIcon className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800">TIFF Formats</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Process high-quality TIFF files with lossless compression options
              </p>
              <div className="mt-3 text-xs text-purple-600 font-medium">
                Max 150MB • 10-20 sec processing
              </div>
            </Card>
          </div>

          <Tabs defaultValue="interactive" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interactive" data-testid="tab-interactive">Interactive Demo</TabsTrigger>
              <TabsTrigger value="examples" data-testid="tab-examples">Code Examples</TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing Calculator</TabsTrigger>
            </TabsList>

            {/* Interactive Demo Tab */}
            <TabsContent value="interactive" className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>API Test Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* API Key Input */}
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk_test_1234567890abcdef..."
                        data-testid="input-api-key"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from the <a href="/api-dashboard" className="text-blue-600 hover:underline">API Dashboard</a>
                      </p>
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label htmlFor="fileInput">Select Special Format File</Label>
                      <div className="mt-2">
                        <Input
                          id="fileInput"
                          type="file"
                          accept=".arw,.cr2,.dng,.nef,.orf,.raf,.rw2,.svg,.tiff,.tif"
                          onChange={handleFileSelect}
                          data-testid="input-file-upload"
                        />
                      </div>
                      {selectedFile && (
                        <div className="mt-3 flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          {getFileTypeIcon(selectedFile.name)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{selectedFile.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Output Format */}
                    <div>
                      <Label>Output Format</Label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger data-testid="select-output-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="webp">WebP</SelectItem>
                          <SelectItem value="avif">AVIF</SelectItem>
                          <SelectItem value="tiff">TIFF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quality Slider */}
                    <div>
                      <Label htmlFor="quality">Quality: {quality}%</Label>
                      <Input
                        id="quality"
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="mt-2"
                        data-testid="slider-quality"
                      />
                    </div>

                    {/* Test Button */}
                    <Button
                      onClick={runApiCall}
                      disabled={!selectedFile || !apiKey || isLoading}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      data-testid="button-test-api"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Test API Call
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Response Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Live API Response</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!response ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Configure your test and click "Test API Call" to see the live response</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {response.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>

                        {/* Conversion Results */}
                        {response.success && response.result && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Conversion Results</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Original Size:</span>
                                <div className="font-medium">{formatFileSize(response.result.originalSize)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Converted Size:</span>
                                <div className="font-medium">{formatFileSize(response.result.convertedSize)}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Compression:</span>
                                <div className="font-medium text-green-600">{response.result.compressionRatio}% smaller</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Processing Time:</span>
                                <div className="font-medium">{response.result.processingTime}ms</div>
                              </div>
                            </div>
                            
                            {response.result.data && (
                              <Button
                                onClick={() => {
                                  const blob = new Blob([
                                    Uint8Array.from(atob(response.result.data), c => c.charCodeAt(0))
                                  ], { type: `image/${outputFormat}` });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `converted_${selectedFile?.name?.split('.')[0]}.${outputFormat}`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="w-full"
                                data-testid="button-download-result"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Converted File
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Error Display */}
                        {!response.success && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-red-800">Error Details</h4>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="font-medium text-red-800">{response.error}</div>
                              <div className="text-sm text-red-600 mt-1">{response.message}</div>
                            </div>
                          </div>
                        )}

                        {/* Raw Response */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Raw JSON Response</h4>
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                            <pre>{JSON.stringify(response, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Code Examples Tab */}
            <TabsContent value="examples" className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* cURL Example */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>cURL Command</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(curlCommand)}
                        data-testid="button-copy-curl"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <pre>{curlCommand || "Select a file to generate the cURL command"}</pre>
                    </div>
                  </CardContent>
                </Card>

                {/* JavaScript Example */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>JavaScript Code</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(jsCode)}
                        data-testid="button-copy-js"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <pre>{jsCode || "Select a file to generate the JavaScript code"}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Examples */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">More Examples</h3>
                
                <div className="grid gap-6">
                  {/* Batch Processing Example */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Batch Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre>{`curl -X POST "https://your-domain.com/api/v1/special/batch" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "files=@photo1.arw" \\
  -F "files=@photo2.nef" \\
  -F "files=@vector.svg" \\
  -F "outputFormat=png" \\
  -F "quality=90"`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Node.js SDK Example */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Node.js Integration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <pre>{`const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function convertRawFile(filePath, apiKey) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('outputFormat', 'jpeg');
  form.append('quality', '85');
  
  const response = await fetch('https://your-domain.com/api/v1/special/convert', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: form
  });
  
  return await response.json();
}`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Pricing Calculator Tab */}
            <TabsContent value="pricing" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Calculate Your API Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Developer Tier */}
                    <Card className="border-2 border-gray-200">
                      <CardHeader className="text-center">
                        <Badge className="w-fit mx-auto mb-2">Developer</Badge>
                        <CardTitle className="text-2xl">Free</CardTitle>
                        <p className="text-gray-600">Perfect for testing</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">50</div>
                          <div className="text-sm text-gray-500">free conversions/month</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Rate limit:</span>
                            <span>100/hour</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max file size:</span>
                            <span>25MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overage rate:</span>
                            <span>$0.10 each</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Professional Tier */}
                    <Card className="border-2 border-teal-200 bg-teal-50">
                      <CardHeader className="text-center">
                        <Badge className="w-fit mx-auto mb-2 bg-teal-600">Professional</Badge>
                        <CardTitle className="text-2xl">$29.99</CardTitle>
                        <p className="text-gray-600">For photographers</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-teal-600">500</div>
                          <div className="text-sm text-gray-500">conversions included</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Rate limit:</span>
                            <span>1,000/hour</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max file size:</span>
                            <span>150MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overage rate:</span>
                            <span>$0.08 each</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enterprise Tier */}
                    <Card className="border-2 border-purple-200 bg-purple-50">
                      <CardHeader className="text-center">
                        <Badge className="w-fit mx-auto mb-2 bg-purple-600">Enterprise</Badge>
                        <CardTitle className="text-2xl">$99.99</CardTitle>
                        <p className="text-gray-600">High-volume workflows</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">2,500</div>
                          <div className="text-sm text-gray-500">conversions included</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Rate limit:</span>
                            <span>5,000/hour</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max file size:</span>
                            <span>500MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overage rate:</span>
                            <span>$0.05 each</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Usage Calculator */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Calculate Your Monthly Costs</h4>
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Professional format conversions start at <span className="font-bold text-purple-600">$0.10 per conversion</span>
                      </p>
                      <div className="text-sm text-gray-500">
                        • RAW camera files: $0.10 each
                        • SVG conversions: $0.10 each  
                        • TIFF processing: $0.10 each
                        • Volume discounts available for 500+ conversions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4 text-sm">Create your API key and start converting</p>
              <Button 
                onClick={() => window.location.href = "/api-dashboard"}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-get-api-key"
              >
                Get API Key
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-gray-600 mb-4 text-sm">Complete API reference and guides</p>
              <Button 
                onClick={() => window.location.href = "/api-docs"}
                variant="outline"
                data-testid="button-view-docs"
              >
                View Docs
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-gray-600 mb-4 text-sm">Need help with integration?</p>
              <Button 
                onClick={() => window.location.href = "/contact"}
                variant="outline"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}