import { useCallback, useState, useEffect } from "react";
import { CloudUpload, FolderOpen, AlertCircle, CheckCircle, X, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { validateFiles, formatFileSize } from "@/lib/file-utils";

interface UploadProgress {
  overall: number;
  current: number;
  currentFileName?: string;
  queuePosition?: number;
  totalInQueue?: number;
  statusText?: string;
}

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress?: UploadProgress;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  queueCount?: number;
  isPremium?: boolean;
  isProcessing?: boolean;
  hasCompletedJobs?: boolean;
}

interface ValidationError {
  fileName: string;
  reason: string;
}

export default function UploadArea({ 
  onFilesSelected, 
  isUploading, 
  uploadProgress = { overall: 0, current: 0 },
  isPaused = false,
  onPause,
  onResume,
  onCancel,
  queueCount = 0,
  isPremium = false,
  isProcessing = false,
  hasCompletedJobs = false
}: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastUploadInfo, setLastUploadInfo] = useState<{ valid: number; total: number } | null>(null);

  // Clear upload status when processing is done or when there are completed jobs
  useEffect(() => {
    if (!isProcessing && hasCompletedJobs && lastUploadInfo) {
      const timer = setTimeout(() => {
        setLastUploadInfo(null);
      }, 1000); // Clear after 1 second when processing is done
      return () => clearTimeout(timer);
    }
  }, [isProcessing, hasCompletedJobs, lastUploadInfo]);

  // Clear upload status when no jobs exist (like after Clear All)
  useEffect(() => {
    if (!hasCompletedJobs && !isUploading && !isProcessing && lastUploadInfo) {
      setLastUploadInfo(null);
    }
  }, [hasCompletedJobs, isUploading, isProcessing, lastUploadInfo]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    
    // Reset input value
    e.target.value = "";
  }, [onFilesSelected]);

  const processFiles = useCallback((files: File[]) => {
    const errors: ValidationError[] = [];
    const validFiles: File[] = [];
    const maxFileSize = isPremium ? null : 10 * 1024 * 1024; // 10MB for free users, unlimited for premium
    
    for (const file of files) {
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        errors.push({ fileName: file.name, reason: 'Only JPEG, PNG, WebP, and AVIF files are allowed' });
        continue;
      }

      // Check file extension
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extension)) {
        errors.push({ fileName: file.name, reason: 'Invalid file extension. Supported: .jpg, .jpeg, .png, .webp, .avif' });
        continue;
      }

      // Check file size (only for free users)
      if (maxFileSize && file.size > maxFileSize) {
        errors.push({ 
          fileName: file.name, 
          reason: `File too large (${formatFileSize(file.size)}). Free users can upload files up to ${formatFileSize(maxFileSize)}. Upgrade to Premium for unlimited file sizes.`
        });
        continue;
      }

      // Check if file is empty
      if (file.size === 0) {
        errors.push({ fileName: file.name, reason: 'File is empty' });
        continue;
      }

      validFiles.push(file);
    }
    
    setValidationErrors(errors);
    setLastUploadInfo({ valid: validFiles.length, total: files.length });
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, isPremium]);

  const openFileDialog = () => {
    const input = document.getElementById("fileInput") as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 text-center transition-all duration-300 cursor-pointer",
          isDragOver ? "border-primary-500 bg-primary-100 scale-[1.02] shadow-lg" : "border-gray-300 hover:border-primary-400 hover:bg-primary-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        <div className="space-y-2 sm:space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <CloudUpload className="text-primary-500" size={18} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
              {isUploading ? "Uploading files..." : "Drop JPEG files here or click to browse"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 px-2">
              Up to 90 credits free • Using smaller files below 5MB will allow more files to be compressed or converted
            </p>
            
            {/* Enhanced Upload Progress */}
            {isUploading && (
              <div className="mt-3 space-y-2">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {isPaused ? "Upload paused" : (uploadProgress.statusText || "Uploading files...")}
                    </span>
                    <span className="text-sm text-gray-500">{uploadProgress.overall}%</span>
                  </div>
                  <Progress value={uploadProgress.overall} className="w-full" />
                </div>
                
                
                {/* Queue Information */}
                {uploadProgress.queuePosition && uploadProgress.totalInQueue && (
                  <p className="text-xs text-gray-500 text-center">
                    Processing batch {uploadProgress.queuePosition} of {uploadProgress.totalInQueue}
                    {queueCount > 0 && ` • ${queueCount} files remaining`}
                  </p>
                )}
                
              </div>
            )}
            
            {/* Upload Status */}
            {lastUploadInfo && !isUploading && (
              <div className="mt-3 flex items-center justify-center">
                <CheckCircle className="text-green-500 mr-2" size={16} />
                <span className="text-sm text-green-600">
                  {lastUploadInfo.valid} of {lastUploadInfo.total} files selected successfully
                </span>
              </div>
            )}
          </div>
          <Button
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            <FolderOpen className="mr-2" size={16} />
            {isUploading ? "Processing..." : "Choose Files"}
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="text-red-500 mr-2" size={16} />
            <h4 className="text-sm font-medium text-red-800">Some files could not be uploaded:</h4>
          </div>
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between text-sm text-red-700 bg-red-100 px-3 py-2 rounded">
                <span>
                  <strong>{error.fileName}:</strong> {error.reason}
                </span>
                <button
                  onClick={() => setValidationErrors(errors => errors.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="file"
        id="fileInput"
        accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
}
