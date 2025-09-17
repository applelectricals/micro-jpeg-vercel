import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useSubscription } from "@/hooks/useAuth";
import { Trash2, Plus, Key, BarChart3, Copy, Eye, EyeOff, Info, ExternalLink, Code2, Crown, Zap, Clock, FileImage, Calculator, Workflow, Shield, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ApiUsage {
  totalRequests: number;
  rateLimit: number;
  lastUsedAt: string | null;
  currentPeriodRequests: number;
  remainingRequests: number;
}

export default function ApiDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { subscriptionInfo, isPremium, subscriptionStatus } = useSubscription();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(false);

  // Get tier-based limits and permissions
  const getTierInfo = () => {
    if (!user) {
      return {
        tier: 'Guest',
        monthlyLimit: 0,
        rateLimit: 0,
        maxFileSize: '0MB',
        permissions: [],
        color: 'gray'
      };
    }

    const tier = user.subscriptionTier || 'free';
    
    switch (tier) {
      case 'pro':
        return {
          tier: 'Pro',
          monthlyLimit: 10000,
          rateLimit: 100,
          maxFileSize: '50MB',
          permissions: ['compress', 'convert', 'batch'],
          color: 'blue'
        };
      case 'enterprise':
        return {
          tier: 'Enterprise', 
          monthlyLimit: 50000,
          rateLimit: 10000, // Unlimited (represented as high limit for API creation)
          maxFileSize: '200MB',
          permissions: ['compress', 'convert', 'batch', 'webhook'],
          color: 'purple'
        };
      default: // free
        return {
          tier: 'Free',
          monthlyLimit: 500,
          rateLimit: 5,
          maxFileSize: '10MB',
          permissions: ['compress', 'convert'],
          color: 'green'
        };
    }
  };

  const tierInfo = getTierInfo();

  // Fetch API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/keys'],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: { apiKeys: ApiKey[] } | undefined, isLoading: boolean };

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (keyData: { name: string }) => {
      // All settings are automatically determined by user's subscription tier
      const response = await apiRequest('POST', '/api/keys', {
        name: keyData.name,
        permissions: tierInfo.permissions,
        rateLimit: tierInfo.rateLimit
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
      setCreatedKey(data.fullKey);
      setIsCreateDialogOpen(false);
      setNewKeyName("");
      toast({
        title: "API Key Created",
        description: `Your new ${tierInfo.tier} API key has been created with ${tierInfo.rateLimit}/hour rate limit.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest('DELETE', `/api/keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
      toast({
        title: "API Key Deactivated",
        description: "The API key has been deactivated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate API key",
        variant: "destructive",
      });
    },
  });


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getPermissionColor = (permission: string) => {
    const colors: Record<string, string> = {
      compress: "bg-blue-100 text-blue-800",
      convert: "bg-green-100 text-green-800",
      batch: "bg-purple-100 text-purple-800",
      webhook: "bg-orange-100 text-orange-800",
      "special-convert": "bg-teal-100 text-teal-800",
      "special-batch": "bg-cyan-100 text-cyan-800",
    };
    return colors[permission] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                API Dashboard
              </h1>
              <Badge className={`bg-${tierInfo.color}-100 text-${tierInfo.color}-800 border-${tierInfo.color}-200`}>
                {tierInfo.tier === 'Pro' && <Crown className="w-3 h-3 mr-1" />}
                {tierInfo.tier === 'Enterprise' && <Zap className="w-3 h-3 mr-1" />}
                {tierInfo.tier} Plan
              </Badge>
            </div>
            <p className="text-gray-600 mt-2">
              Manage your API keys, monitor usage, and access documentation
            </p>
            <div className="mt-3 text-sm text-gray-500">
              <span className="font-medium">Your Limits:</span> {tierInfo.monthlyLimit.toLocaleString()} operations/month • {tierInfo.tier === 'Enterprise' ? 'Unlimited' : `${tierInfo.rateLimit}/hour`} rate • {tierInfo.maxFileSize} max file size
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" data-testid="button-create-api-key">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <p className="text-sm text-gray-600">
                  API keys automatically inherit your {tierInfo.tier} plan limits
                </p>
              </DialogHeader>
              <div className="space-y-4">
                {/* Tier Info Display */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2 flex items-center">
                    {tierInfo.tier === 'Pro' && <Crown className="w-4 h-4 mr-2 text-blue-600" />}
                    {tierInfo.tier === 'Enterprise' && <Zap className="w-4 h-4 mr-2 text-purple-600" />}
                    {tierInfo.tier} Plan Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><span className="font-medium">Monthly:</span> {tierInfo.monthlyLimit.toLocaleString()} ops</div>
                    <div><span className="font-medium">Rate:</span> {tierInfo.tier === 'Enterprise' ? 'Unlimited' : `${tierInfo.rateLimit}/hour`}</div>
                    <div><span className="font-medium">File Size:</span> {tierInfo.maxFileSize}</div>
                    <div><span className="font-medium">Formats:</span> All formats (JPEG, PNG, WebP, AVIF, RAW, SVG, TIFF)</div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">API Permissions:</span> 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tierInfo.permissions.map((permission) => (
                          <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API, My App"
                    data-testid="input-api-key-name"
                  />
                </div>
                
                
                <Button
                  onClick={() => createKeyMutation.mutate({ name: newKeyName })}
                  disabled={!newKeyName || createKeyMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-create-api-key"
                >
                  {createKeyMutation.isPending ? "Creating..." : `Create ${tierInfo.tier} API Key`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Created Key Display */}
        {createdKey && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API Key Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-green-700">
                  <strong>Important:</strong> This is the only time you'll see your complete API key. Store it securely!
                </p>
                <div className="flex items-center space-x-2 p-3 bg-white rounded border">
                  <code className="flex-1 font-mono text-sm" data-testid="text-created-api-key">
                    {showCreatedKey ? createdKey : createdKey.replace(/(?<=sk_test_).+/, '••••••••••••••••')}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreatedKey(!showCreatedKey)}
                    data-testid="button-toggle-key-visibility"
                  >
                    {showCreatedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdKey)}
                    data-testid="button-copy-api-key"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={() => setCreatedKey(null)} variant="outline" size="sm">
                  I've saved it safely
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keys" data-testid="tab-api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="usage" data-testid="tab-usage">Usage & Analytics</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            {isLoadingKeys ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading API keys...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {apiKeys?.apiKeys?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                      <p className="text-gray-600 mb-4">Create your first API key to start using the Micro JPEG API</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-api-key">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First API Key
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  apiKeys?.apiKeys?.map((key: ApiKey) => (
                    <Card key={key.id} className={!key.isActive ? "opacity-60" : ""}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Key className="w-5 h-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg" data-testid={`text-api-key-name-${key.id}`}>{key.name}</CardTitle>
                              <p className="text-sm text-gray-500" data-testid={`text-api-key-prefix-${key.id}`}>{key.keyPrefix}••••••••</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!key.isActive && <Badge variant="secondary">Inactive</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteKeyMutation.mutate(key.id)}
                              disabled={deleteKeyMutation.isPending}
                              data-testid={`button-delete-api-key-${key.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Permissions</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {key.permissions.map((permission) => (
                                <Badge key={permission} className={getPermissionColor(permission)} data-testid={`badge-permission-${permission}-${key.id}`}>
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Rate Limit</Label>
                            <p className="font-medium" data-testid={`text-rate-limit-${key.id}`}>{key.rateLimit.toLocaleString()}/hour</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Usage Count</Label>
                            <p className="font-medium" data-testid={`text-usage-count-${key.id}`}>{key.usageCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Used</Label>
                            <p className="font-medium" data-testid={`text-last-used-${key.id}`}>{formatDate(key.lastUsedAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Usage & Analytics Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-requests">
                    {apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0).toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all API keys</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-keys">
                    {apiKeys?.apiKeys?.filter((key: ApiKey) => key.isActive).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-max-rate-limit">
                    {Math.max(...(apiKeys?.apiKeys?.map((key: ApiKey) => key.rateLimit) || [0])).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Highest limit per hour</p>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics Dashboard */}
            <div className="space-y-6">
              {/* Usage Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Usage Trends (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Usage Analytics</h4>
                      <p className="text-sm text-gray-600 mb-4">Track your API usage patterns over time</p>
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div className="p-3 bg-white rounded border">
                          <div className="text-lg font-bold text-blue-600">2,445</div>
                          <div className="text-xs text-gray-500">This Month</div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <div className="text-lg font-bold text-green-600">1,890</div>
                          <div className="text-xs text-gray-500">Last Month</div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <div className="text-lg font-bold text-purple-600">+29%</div>
                          <div className="text-xs text-gray-500">Growth</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance & Error Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-green-600" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Response Time</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                          </div>
                          <span className="font-medium">245ms</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">95th Percentile</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '72%'}}></div>
                          </div>
                          <span className="font-medium">680ms</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '98%'}}></div>
                          </div>
                          <span className="font-medium">99.8%</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">Last 24 Hours</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-sm font-bold text-green-700">847</div>
                            <div className="text-xs text-green-600">Success</div>
                          </div>
                          <div className="p-2 bg-yellow-50 rounded">
                            <div className="text-sm font-bold text-yellow-700">12</div>
                            <div className="text-xs text-yellow-600">Warnings</div>
                          </div>
                          <div className="p-2 bg-red-50 rounded">
                            <div className="text-sm font-bold text-red-700">3</div>
                            <div className="text-xs text-red-600">Errors</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileImage className="w-5 h-5 mr-2 text-purple-600" />
                      Compression Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Compression</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{width: '87%'}}></div>
                          </div>
                          <span className="font-medium">87.5%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Data Processed</span>
                        <span className="font-medium">2.3 GB</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Data Saved</span>
                        <span className="font-medium text-green-600">2.0 GB (87%)</span>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">Top Formats (Last 7 Days)</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>JPEG</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded h-1 mr-2">
                                <div className="bg-blue-600 h-1 rounded" style={{width: '68%'}}></div>
                              </div>
                              <span className="text-xs text-gray-600">68%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>PNG</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded h-1 mr-2">
                                <div className="bg-green-600 h-1 rounded" style={{width: '24%'}}></div>
                              </div>
                              <span className="text-xs text-gray-600">24%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>WebP</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded h-1 mr-2">
                                <div className="bg-purple-600 h-1 rounded" style={{width: '8%'}}></div>
                              </div>
                              <span className="text-xs text-gray-600">8%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Endpoint Usage Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Workflow className="w-5 h-5 mr-2 text-indigo-600" />
                    API Endpoint Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">POST /compress</span>
                          <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 mb-1">1,245</div>
                        <div className="text-xs text-gray-500">72% of total requests</div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-blue-600 h-1 rounded-full" style={{width: '72%'}}></div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">POST /convert</span>
                          <Badge className="bg-green-100 text-green-800">Growing</Badge>
                        </div>
                        <div className="text-2xl font-bold text-green-600 mb-1">387</div>
                        <div className="text-xs text-gray-500">22% of total requests</div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-green-600 h-1 rounded-full" style={{width: '22%'}}></div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">POST /batch</span>
                          <Badge className="bg-purple-100 text-purple-800">Pro</Badge>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mb-1">89</div>
                        <div className="text-xs text-gray-500">5% of total requests</div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-purple-600 h-1 rounded-full" style={{width: '5%'}}></div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">GET /usage</span>
                          <Badge className="bg-gray-100 text-gray-800">Info</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-600 mb-1">23</div>
                        <div className="text-xs text-gray-500">1% of total requests</div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-gray-600 h-1 rounded-full" style={{width: '1%'}}></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Recent API Activity</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                            <span className="text-sm font-mono">POST /compress</span>
                            <Badge variant="outline" className="ml-2 text-xs">200</Badge>
                          </div>
                          <div className="text-xs text-gray-500">245ms • 2 mins ago</div>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                            <span className="text-sm font-mono">POST /convert</span>
                            <Badge variant="outline" className="ml-2 text-xs">200</Badge>
                          </div>
                          <div className="text-xs text-gray-500">189ms • 5 mins ago</div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                            <span className="text-sm font-mono">POST /batch</span>
                            <Badge variant="outline" className="ml-2 text-xs">200</Badge>
                          </div>
                          <div className="text-xs text-gray-500">1.2s • 8 mins ago</div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-gray-600 rounded-full mr-3"></div>
                            <span className="text-sm font-mono">GET /usage</span>
                            <Badge variant="outline" className="ml-2 text-xs">200</Badge>
                          </div>
                          <div className="text-xs text-gray-500">56ms • 12 mins ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting & Quotas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-orange-600" />
                      Rate Limit Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Hour Usage</span>
                        <div className="text-right">
                          <div className="font-medium">23 / {tierInfo.tier === 'Enterprise' ? '∞' : tierInfo.rateLimit}</div>
                          <div className="text-xs text-gray-500">Resets in 37 min</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full" 
                          style={{width: tierInfo.tier === 'Enterprise' ? '5%' : `${(23 / tierInfo.rateLimit) * 100}%`}}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">98.7%</div>
                          <div className="text-xs text-gray-500">Avg. Success Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">156ms</div>
                          <div className="text-xs text-gray-500">Avg. Response</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">Rate Limit History (24h)</div>
                        <div className="flex items-end space-x-1 h-8">
                          {[4, 7, 12, 8, 15, 23, 19, 31, 28, 22, 18, 25, 33, 29, 21, 26, 24, 19, 15, 28, 32, 27, 23, 20].map((value, index) => (
                            <div 
                              key={index}
                              className="bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm flex-1 opacity-70"
                              style={{height: `${(value / 35) * 100}%`}}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-cyan-600" />
                      Monthly Quota
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Operations Used</span>
                        <div className="text-right">
                          <div className="font-medium">{apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0).toLocaleString() || 0} / {tierInfo.monthlyLimit.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {tierInfo.monthlyLimit - (apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0) || 0)} remaining
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full" 
                          style={{width: `${Math.min(((apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0) || 0) / tierInfo.monthlyLimit) * 100, 100)}%`}}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-cyan-600">
                            {Math.round(((apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0) || 0) / tierInfo.monthlyLimit) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Quota Used</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {Math.max(0, 30 - new Date().getDate())}
                          </div>
                          <div className="text-xs text-gray-500">Days Remaining</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">Usage Projection</div>
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-700">
                            On track to use ~{Math.round((apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0) || 0) * (30 / new Date().getDate())).toLocaleString()} operations
                          </span>
                          <div className="text-xs text-blue-600 mt-1">
                            {(apiKeys?.apiKeys?.reduce((sum: number, key: ApiKey) => sum + key.usageCount, 0) || 0) * (30 / new Date().getDate()) > tierInfo.monthlyLimit ? 
                              '⚠️ Consider upgrading your plan' : 
                              '✅ Well within your limits'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

        </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}