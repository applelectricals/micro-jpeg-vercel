import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudUpload, Download, Zap, Star, Crown, AlertCircle, CheckCircle, X, Upload, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFiles, formatFileSize } from "@/lib/file-utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UpgradePromptDialog } from "./upgrade-prompt-dialog";

interface CompressedFile {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
}

interface GuestCompressorProps {
  onRegisterPrompt: () => void;
  onCompressionComplete?: () => void;
}

const GUEST_QUALITY = 80; // Preset quality for guests
const GUEST_MAX_FILES = 3; // Limit number of files for guests
const GUEST_FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB limit for guests

export default function GuestCompressor({ onRegisterPrompt, onCompressionComplete }: GuestCompressorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeData, setUpgradeData] = useState<any>(null);
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    // Redirect to pricing page with selected plan
    window.location.href = `/simple-pricing?plan=${planId}`;
  };

  const compressionMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('quality', GUEST_QUALITY.toString());
      formData.append('guest', 'true');

      const response = await fetch("/api/guest/compress", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 && errorData.upgradeRequired) {
          // Credits exhausted - show upgrade prompt  
          setUpgradeData(errorData);
          setShowUpgradePrompt(true);
          throw new Error('Credits exhausted');
        }
        throw new Error(errorData.message || "Compression failed");
      }
      return response;
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setCompressedFiles(data.files || []);
      setCurrentProgress(100);
      onCompressionComplete?.(); // Trigger ad display
      toast({
        title: "Compression Complete!",
        description: `Successfully compressed ${selectedFiles.length} file(s) with preset quality.`,
      });
    },
    onError: (error) => {
      if (error.message !== 'Credits exhausted') {
        toast({
          title: "Compression Failed",
          description: error.message || "Failed to compress files. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const validateGuestFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    if (files.length > GUEST_MAX_FILES) {
      errors.push(`Guest mode limited to ${GUEST_MAX_FILES} files. Sign up for unlimited uploads!`);
      files = files.slice(0, GUEST_MAX_FILES);
    }

    files.forEach(file => {
      // Check file type (JPEG and PNG)
      if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png') && 
          !file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        errors.push(`${file.name}: Only JPEG and PNG files supported in guest mode`);
        return;
      }

      // Check file size
      if (file.size > GUEST_FILE_SIZE_LIMIT) {
        errors.push(`${file.name}: File too large (max ${formatFileSize(GUEST_FILE_SIZE_LIMIT)} in guest mode)`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const processFiles = (files: File[]) => {
    const { valid, errors } = validateGuestFiles(files);
    setValidationErrors(errors);
    setSelectedFiles(valid);
    setCompressedFiles([]);
    setCurrentProgress(0);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  }, []);

  const handleCompress = () => {
    if (selectedFiles.length === 0) return;
    setCurrentProgress(0);
    compressionMutation.mutate(selectedFiles);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/guest/download/${fileId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalOriginalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const totalCompressedSize = compressedFiles.reduce((sum, file) => sum + file.compressedSize, 0);
  const overallRatio = totalOriginalSize > 0 ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Guest Mode Header */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                Guest Mode - Try Before You Register
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Limited Features
            </Badge>
          </div>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Compress up to {GUEST_MAX_FILES} JPEG/PNG files (max {formatFileSize(GUEST_FILE_SIZE_LIMIT)} each) with preset quality settings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragOver 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
              compressionMutation.isPending && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('guest-file-input')?.click()}
          >
            <input
              id="guest-file-input"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileSelect}
              className="hidden"
              disabled={compressionMutation.isPending}
            />
            
            <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Drop JPEG or PNG files here or click to browse
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Guest mode: Up to {GUEST_MAX_FILES} files, max {formatFileSize(GUEST_FILE_SIZE_LIMIT)} each
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Quality: {GUEST_QUALITY}% (preset)</span>
              <span>•</span>
              <span>JPEG & PNG output</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Selected Files ({selectedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = selectedFiles.filter((_, i) => i !== index);
                      setSelectedFiles(newFiles);
                    }}
                    disabled={compressionMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {compressionMutation.isPending && (
                <div>
                  <Progress value={currentProgress} className="mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Compressing files with preset quality...
                  </p>
                </div>
              )}

              <Button
                onClick={handleCompress}
                disabled={selectedFiles.length === 0 || compressionMutation.isPending}
                className="w-full"
                size="lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                {compressionMutation.isPending ? 'Compressing...' : `Compress ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {compressedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Compression Complete
            </CardTitle>
            <CardDescription>
              Saved {overallRatio.toFixed(1)}% overall ({formatFileSize(totalOriginalSize - totalCompressedSize)} reduction)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {compressedFiles.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{file.originalName}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(file.originalSize)} → {formatFileSize(file.compressedSize)} 
                      <span className="text-green-600 ml-2">(-{file.compressionRatio.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(file.id, file.originalName)}
                    className="ml-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Prompts */}
      {(selectedFiles.length > 0 || compressedFiles.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Benefits Card */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Unlock Full Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-4 h-4" />
                <span>Unlimited compressions (10MB file limit)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-4 h-4" />
                <span>Basic quality controls (step resize only)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-4 h-4" />
                <span>JPEG output format</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-4 h-4" />
                <span>Image preview & comparison</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-4 h-4" />
                <span>Single file downloads</span>
              </div>
              <Button 
                onClick={onRegisterPrompt}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Sign Up Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Card */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Premium Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Unlimited compressions (no file size limit)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Advanced quality controls</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Multiple output formats</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Batch processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>ZIP batch downloads</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Priority processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>Custom resize options (slider)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>24/7 priority support</span>
              </div>
              <Button 
                onClick={onRegisterPrompt}
                className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
              >
                Start Premium - $9.99/mo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Prompt Dialog */}
      <UpgradePromptDialog
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        creditsUsed={upgradeData?.creditsUsed || 0}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}