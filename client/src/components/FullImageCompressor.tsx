import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, X, Download, Settings, Image as ImageIcon } from "lucide-react";
import { AdvancedCompressionSettings, type CompressionSettings } from "./AdvancedCompressionSettings";
import { ImageComparisonViewer } from "./ImageComparisonViewer";
import { CreditExhaustionDialog } from "./credit-exhaustion-dialog";
import { CreditWarning } from "./credit-warning";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { CompressionJob } from "@shared/schema";

interface UsageStats {
  // New unified operation structure
  operations?: {
    used: number;
    limit: number | null;
    remaining: number | null;
    planId: string;
    planName: string;
    isAnonymous: boolean;
    dailyUsed: number;
    dailyLimit: number | null;
    hourlyUsed: number;
    hourlyLimit: number | null;
  };
  
  // Legacy credit structure for backward compatibility
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  freeCredits: number;
  purchasedCredits: number;
}

interface SubscriptionInfo {
  isPremium: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
}

interface FullImageCompressorProps {
  sessionId?: string;
  onCompressionComplete?: () => void;
}

export function FullImageCompressor({ sessionId, onCompressionComplete }: FullImageCompressorProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    quality: 75,
    resizeOption: "none",
    outputFormat: "jpeg",
    compressionAlgorithm: "standard",
    webOptimized: true,
    progressiveJpeg: false,
    arithmeticCoding: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showCreditExhaustion, setShowCreditExhaustion] = useState(false);
  const [upgradeData, setUpgradeData] = useState<any>(null);
  const [creditsNeeded, setCreditsNeeded] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Get credit usage statistics
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ["/api/usage-stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get subscription info for premium features
  const { data: subscriptionInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription-info"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Get compression jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<CompressionJob[]>({
    queryKey: sessionId ? ['/api/jobs', sessionId] : ['/api/jobs'],
    refetchInterval: 1000,
  });

  // Compression mutation
  const compressionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // CRITICAL: Use apiRequest to ensure pageIdentifier and sessionId are included
      const response = await apiRequest('POST', '/api/compress', formData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 && errorData.creditsExhausted) {
          // Credits exhausted - show credit purchase dialog
          setCreditsNeeded(errorData.creditsNeeded || 1);
          setShowCreditExhaustion(true);
          throw new Error('Credits exhausted');
        }
        throw new Error(errorData.message || 'Compression failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.jobs && data.jobs.length > 0) {
        setActiveJobId(data.jobs[0].id);
        toast({
          title: "Compression Started",
          description: `Processing ${data.jobs.length} file(s)...`,
        });
        // Call completion callback when compression is done
        if (onCompressionComplete) {
          onCompressionComplete();
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Credits exhausted') {
        toast({
          title: "Compression Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      ...file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 20,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleUpgrade = (planId: string) => {
    // Redirect to pricing page with selected plan
    window.location.href = `/simple-pricing?plan=${planId}`;
  };

  const handlePurchaseCredits = () => {
    // Redirect to buy credits page
    window.location.href = '/buy-credits';
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one image to compress.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    // Add compression settings
    Object.entries(compressionSettings).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    compressionMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      case 'png':
        return '🖼️';
      case 'webp':
        return '🖼️';
      case 'avif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const completedJobs = jobs.filter((job: CompressionJob) => job.status === 'completed');
  const processingJobs = jobs.filter((job: CompressionJob) => job.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Professional Image Compression
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Upload multiple images and compress them with advanced settings
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✓ Up to 20 images
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            ✓ Max 10MB each
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            ✓ JPEG, PNG, WebP, AVIF
          </Badge>
        </div>
      </div>

      {/* Operation Usage Display */}
      {usageStats?.operations && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Operations:</strong> {usageStats.operations.used}/{usageStats.operations.limit || '∞'} used
                {usageStats.operations.isAnonymous && (
                  <span className="text-sm text-blue-600 ml-2">
                    (Anonymous {usageStats.operations.planName})
                  </span>
                )}
                {!usageStats.operations.isAnonymous && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({usageStats.operations.planName})
                  </span>
                )}
              </div>
              {usageStats.operations.isAnonymous && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/login'}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Sign Up for More
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Or click to browse and select images from your device
            </p>
            <Button>
              <ImageIcon className="h-4 w-4 mr-2" />
              Select Images
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Selected Files ({files.length}/20)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="text-2xl">{getFileTypeIcon(file.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id!)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCompress}
              disabled={files.length === 0 || compressionMutation.isPending}
              className="flex-1"
            >
              {compressionMutation.isPending ? 'Processing...' : 'Compress Images'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compression Settings */}
      {showSettings && (
        <AdvancedCompressionSettings
          settings={compressionSettings}
          onSettingsChange={setCompressionSettings}
          disabled={compressionMutation.isPending}
          uploadedFile={files.length > 0 ? files[0] : null}
          isPremiumUser={subscriptionInfo?.isPremium || false}
        />
      )}

      {/* Processing Jobs */}
      {processingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processingJobs.map((job: CompressionJob) => (
                <div key={job.id} className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{job.originalFilename}</p>
                    <Progress value={75} className="h-2 mt-1" />
                  </div>
                  <Badge variant="outline">Processing...</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs */}
      {completedJobs.map((job: CompressionJob) => (
        <ImageComparisonViewer
          key={job.id}
          job={job}
          originalImageUrl={`/api/preview/original/${job.id}`}
          compressedImageUrl={`/api/preview/compressed/${job.id}`}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = `/api/download/${job.id}`;
            // Let the server determine the correct filename with proper extension
            // Don't set link.download to let Content-Disposition header work
            link.click();
          }}
        />
      ))}

      {/* Operation Usage Summary */}
      {usageStats?.operations && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Monthly Operations:</strong> {usageStats.operations.used} / {usageStats.operations.limit || '∞'} used
                {usageStats.operations.remaining !== null && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({usageStats.operations.remaining} remaining)
                  </span>
                )}
              </div>
              {usageStats.operations.isAnonymous ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/signup'}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Register for Free
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/simple-pricing'}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Credit Exhaustion Dialog */}
      <CreditExhaustionDialog
        open={showCreditExhaustion}
        onOpenChange={setShowCreditExhaustion}
        remainingCredits={usageStats?.remainingCredits || 0}
        creditsNeeded={creditsNeeded}
        onPurchaseCredits={handlePurchaseCredits}
      />

      {/* Legacy Upgrade Prompt Dialog */}
      <UpgradePromptDialog
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        creditsUsed={upgradeData?.creditsUsed || 0}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}