import { useState, useEffect } from "react";
import { Trash2, Download, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { CompressionJob } from "@shared/schema";
import { formatFileSize } from "@/lib/file-utils";
import QualityAssessment from "@/components/quality-assessment";
import avifIcon from "@assets/AVIF_1756389520683.jpg";
import jpegIcon from "@assets/JPEG_1756389520684.jpg";
import pngIcon from "@assets/PNG_1756389520685.jpg";
import webpIcon from "@assets/WEBP_1756389520685.jpg";

interface FilePreviewCardProps {
  job: CompressionJob;
  onDelete: () => void;
  onDownload: () => void;
}

export default function FilePreviewCard({ job, onDelete, onDownload }: FilePreviewCardProps) {
  
  // Get file type icon based on output format
  const getFileTypeIcon = (format: string) => {
    const formatLower = format.toLowerCase();
    switch (formatLower) {
      case 'avif': return avifIcon;
      case 'jpeg': case 'jpg': return jpegIcon;
      case 'png': return pngIcon;
      case 'webp': return webpIcon;
      default: return jpegIcon;
    }
  };

  // Social sharing handlers
  const handleShare = (platform: string) => {
    const shareText = `Just compressed a ${formatFileSize(job.originalSize)} image down to ${formatFileSize(job.compressedSize || 0)} (${job.compressionRatio}% smaller) using MicroJPEG! 🚀`;
    const shareUrl = `${window.location.origin}`;
    
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' #ImageCompression #MicroJPEG')}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=500'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=500'
        );
        break;
    }
  };
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [compressedImageUrl, setCompressedImageUrl] = useState<string | null>(null);
  const [originalImageError, setOriginalImageError] = useState(false);
  const [compressedImageError, setCompressedImageError] = useState(false);
  const [originalImageLoading, setOriginalImageLoading] = useState(true);
  const [compressedImageLoading, setCompressedImageLoading] = useState(true);

  // Get compression limits to check premium status
  const { data: compressionLimits } = useQuery({
    queryKey: ["/api/compression-limits"]
  });

  useEffect(() => {
    // Add cache-busting parameter to force fresh loads
    const cacheBuster = Date.now();
    
    // Reset loading states
    setOriginalImageError(false);
    setOriginalImageLoading(true);
    
    // Set original image preview URL using new endpoint
    console.log(`Setting original preview URL for job ${job.id}`);
    const originalUrl = `/api/preview/original/${job.id}?v=${cacheBuster}`;
    setOriginalImageUrl(originalUrl);
    
    // Pre-load the original image to trigger onLoad event
    const originalImg = new Image();
    originalImg.onload = () => {
      console.log(`Original image preloaded for job ${job.id}`);
      setOriginalImageLoading(false);
      setOriginalImageError(false);
    };
    originalImg.onerror = (e) => {
      console.log(`Failed to preload original image for job ${job.id}`, e);
      setOriginalImageLoading(false);
      setOriginalImageError(true);
    };
    originalImg.src = originalUrl;

    // Set compressed image preview URL using new endpoint
    if (job.status === "completed") {
      console.log(`Setting compressed preview URL for job ${job.id}`);
      setCompressedImageError(false);
      setCompressedImageLoading(true);
      
      const compressedUrl = `/api/preview/compressed/${job.id}?v=${cacheBuster}`;
      setCompressedImageUrl(compressedUrl);
      
      // Pre-load the compressed image to trigger onLoad event with retry logic
      const loadCompressedImage = (retryCount = 0) => {
        const compressedImg = new Image();
        compressedImg.onload = () => {
          console.log(`Compressed image preloaded for job ${job.id} (attempt ${retryCount + 1})`);
          setCompressedImageLoading(false);
          setCompressedImageError(false);
        };
        compressedImg.onerror = (e) => {
          console.log(`Failed to preload compressed image for job ${job.id} (attempt ${retryCount + 1})`, e);
          if (retryCount < 3) {
            // Retry after a short delay
            setTimeout(() => loadCompressedImage(retryCount + 1), 500);
          } else {
            setCompressedImageLoading(false);
            setCompressedImageError(true);
          }
        };
        compressedImg.src = compressedUrl;
      };
      
      // Start immediate loading and retry after 1 second
      loadCompressedImage();
      setTimeout(() => loadCompressedImage(), 1000);
    } else {
      setCompressedImageUrl(null);
      setCompressedImageError(false);
      setCompressedImageLoading(job.status === "processing");
    }
  }, [job.id, job.status]); // Only depend on job ID and status to prevent unnecessary re-runs

  // These handlers are now just backup - main loading is handled in useEffect
  const handleOriginalImageLoad = () => {
    console.log(`Original preview loaded (backup handler) for job ${job.id}`);
    setOriginalImageLoading(false);
    setOriginalImageError(false);
  };

  const handleOriginalImageError = (e: any) => {
    console.log(`Failed to load original image preview (backup handler) for job ${job.id}`, e);
    setOriginalImageLoading(false);
    setOriginalImageError(true);
  };

  const handleCompressedImageLoad = () => {
    console.log(`Compressed preview loaded (backup handler) for job ${job.id}`);
    setCompressedImageLoading(false);
    setCompressedImageError(false);
  };

  const handleCompressedImageError = (e: any) => {
    console.log(`Failed to load compressed image preview (backup handler) for job ${job.id}`, e);
    setCompressedImageLoading(false);
    setCompressedImageError(true);
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle className="mr-1" size={16} />;
      case "failed":
        return <XCircle className="mr-1" size={16} />;
      case "processing":
        return <AlertTriangle className="mr-1" size={16} />;
      default:
        return <AlertTriangle className="mr-1" size={16} />;
    }
  };

  const renderStatusSection = () => {
    if (job.status === "completed") {
      return (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Compressed Size:</span> {formatFileSize(job.compressedSize || 0)}
            </p>
            <p className="text-sm text-green-800">
              <span className="font-medium">Reduction:</span> {job.compressionRatio}% smaller
            </p>
          </div>
          <QualityAssessment 
            psnr={(job as any).psnr}
            ssim={(job as any).ssim}
            qualityScore={(job as any).qualityScore}
            qualityGrade={(job as any).qualityGrade}
          />
        </div>
      );
    }

    if (job.status === "failed") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            <span className="font-medium">Error:</span> {job.errorMessage || "Compression failed"}
          </p>
          <p className="text-xs text-red-600 mt-1">Please try again with a different file</p>
        </div>
      );
    }

    if (job.status === "processing") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Compressing...</span>
            <span className="text-sm text-gray-500">Processing</span>
          </div>
          <Progress value={75} className="w-full" />
          <p className="text-xs text-gray-500">Please wait while we compress your image</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Queued</span>
          <span className="text-sm text-gray-500">Waiting</span>
        </div>
        <Progress value={0} className="w-full" />
        <p className="text-xs text-gray-500">Waiting for processing to begin</p>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${job.status === "failed" ? "border-red-200" : "border-gray-200"}`}>
      <div className="flex items-center gap-4">
        {/* Single Thumbnail Preview */}
        <div className="flex-shrink-0">
          <div className="relative">
            {job.status === "failed" ? (
              <div className="w-12 h-12 bg-red-50 border-2 border-dashed border-red-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={16} />
              </div>
            ) : job.status === "completed" && !compressedImageError && !compressedImageLoading && compressedImageUrl ? (
              <div className="relative">
                <img
                  src={compressedImageUrl}
                  alt="Compressed thumbnail"
                  className="w-12 h-12 object-cover rounded-lg shadow-sm bg-gray-100"
                  onLoad={handleCompressedImageLoad}
                  onError={handleCompressedImageError}
                />
              </div>
            ) : originalImageError ? (
              <div className="w-12 h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-gray-400" size={16} />
              </div>
            ) : (
              originalImageLoading ? (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <img
                  src={originalImageUrl || ""}
                  alt="Original thumbnail"
                  className="w-12 h-12 object-cover rounded-lg shadow-sm bg-gray-100"
                  onLoad={handleOriginalImageLoad}
                  onError={handleOriginalImageError}
                />
              )
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">{job.originalFilename}</h4>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatFileSize(job.originalSize)}</span>
                {job.status === "completed" && (
                  <span>→ {formatFileSize(job.compressedSize || 0)}</span>
                )}
                {job.status !== "completed" && (
                  <span className={`${getStatusColor()}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {/* Format info for completed jobs */}
              {job.status === "completed" && (
                <div className="flex flex-col text-xs text-center mr-2">
                  <div className="flex items-center gap-1 justify-center">
                    <span className="text-blue-600 font-medium">{job.outputFormat.toUpperCase()}</span>
                    <CheckCircle className="text-green-600" size={12} />
                  </div>
                  <span className="text-green-600 font-medium">-{job.compressionRatio}%</span>
                </div>
              )}
              
              {/* Format icon for completed jobs */}
              {job.status === "completed" && (
                <img
                  src={getFileTypeIcon(job.outputFormat)}
                  alt={`${job.outputFormat.toUpperCase()} format`}
                  className="w-12 h-12 object-contain"
                />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </Button>
              <Button
                onClick={onDownload}
                disabled={job.status !== "completed"}
                variant="outline"
                size="sm"
                className="px-3 py-1 text-xs bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
              >
                <Download className="mr-1" size={14} />
                {job.status === "completed" ? "Download" : "Processing..."}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
