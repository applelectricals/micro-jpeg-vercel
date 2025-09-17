import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, X, Check, Crown, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sessionManager } from '@/lib/sessionManager';
import Header from '@/components/header';
import { SEOHead } from '@/components/SEOHead';
import { useLocation, useParams } from 'wouter';
import ConversionOutputModal from '@/components/ConversionOutputModal';

// Import conversion matrix and utilities
import { 
  CONVERSIONS, 
  FORMATS, 
  getConversionByPair, 
  getFormatInfo, 
  validateFile as validateFileFromMatrix,
  type ConversionConfig,
  type FormatInfo
} from '@/data/conversionMatrix';

// Import format icons
import avifIcon from '@/assets/format-icons/avif.jpg';
import jpegIcon from '@/assets/format-icons/jpeg.jpg';
import pngIcon from '@/assets/format-icons/png.jpg';
import webpIcon from '@/assets/format-icons/webp.jpg';

// Types
interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

interface CompressionResult {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  downloadUrl: string;
  originalFormat: string;
  outputFormat: string;
  wasConverted: boolean;
}

interface SessionData {
  compressions: number;
  conversions: number;
  uploadedFiles: FileWithPreview[];
  results: CompressionResult[];
  showPricingProbability: number;
  activityScore: number;
  batchDownloadUrl?: string;
}

// Processing Progress Simulation
const simulateProgress = (
  duration: number,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = duration / 100;
    
    const timer = setInterval(() => {
      progress += Math.random() * 3 + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        onProgress(100);
        setTimeout(resolve, 500);
      } else {
        onProgress(Math.floor(progress));
      }
    }, interval);
  });
};

// Get format icon
const getFormatIcon = (format: string) => {
  const iconMap: Record<string, string> = {
    'avif': avifIcon,
    'jpeg': jpegIcon,
    'jpg': jpegIcon,
    'png': pngIcon,
    'webp': webpIcon
  };
  return iconMap[format] || jpegIcon;
};

// Format information for displaying results
const getFormatDisplayInfo = (format: string) => {
  const formatInfo = getFormatInfo(format);
  if (formatInfo) {
    return {
      icon: getFormatIcon(format),
      color: formatInfo.color,
      bgColor: formatInfo.bgColor,
      textColor: formatInfo.textColor
    };
  }
  
  return {
    icon: jpegIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textColor: '#374151'
  };
};

// Parse route parameters to extract conversion pair with malformed route handling
const parseConversionFromParams = (params: any, location: string): { from: string; to: string; operation: string } | null => {
  // Handle /convert/:conversion pattern (e.g., cr2-to-webp)
  if (params.conversion) {
    const convertMatch = params.conversion.match(/^([a-z0-9]+)-to-([a-z0-9]+)$/);
    if (convertMatch) {
      const [, from, to] = convertMatch;
      return { from, to, operation: 'convert' };
    }
  }
  
  // Handle /compress/:format pattern (e.g., jpg)
  if (params.format) {
    // Check for malformed compress routes like /compress/jpg-to-jpg
    const malformedMatch = params.format.match(/^([a-z0-9]+)-to-([a-z0-9]+)$/);
    if (malformedMatch) {
      const [, from, to] = malformedMatch;
      
      // If source and target are the same, it's a compression operation - redirect
      if (from === to) {
        console.warn(`Malformed compress route detected: /compress/${params.format}. Redirecting to /compress/${from}`);
        window.location.replace(`/compress/${from}`);
        return null;
      } else {
        // If source and target are different, it should be a convert route - redirect
        console.warn(`Malformed compress route detected: /compress/${params.format}. Redirecting to /convert/${params.format}`);
        window.location.replace(`/convert/${params.format}`);
        return null;
      }
    }
    
    // Normal compression format
    return { from: params.format, to: params.format, operation: 'compress' };
  }
  
  // Fallback: parse from URL path with malformed route detection
  const convertMatch = location.match(/\/convert\/([a-z0-9]+)-to-([a-z0-9]+)$/);
  const compressMatch = location.match(/\/compress\/([a-z0-9]+)$/);
  const malformedCompressMatch = location.match(/\/compress\/([a-z0-9]+)-to-([a-z0-9]+)$/);
  
  // Handle malformed compress URLs in fallback
  if (malformedCompressMatch) {
    const [, from, to] = malformedCompressMatch;
    
    if (from === to) {
      console.warn(`Malformed compress URL detected: ${location}. Redirecting to /compress/${from}`);
      window.location.replace(`/compress/${from}`);
      return null;
    } else {
      console.warn(`Malformed compress URL detected: ${location}. Redirecting to /convert/${from}-to-${to}`);
      window.location.replace(`/convert/${from}-to-${to}`);
      return null;
    }
  }
  
  if (convertMatch) {
    const [, from, to] = convertMatch;
    return { from, to, operation: 'convert' };
  }
  
  if (compressMatch) {
    const [, format] = compressMatch;
    return { from: format, to: format, operation: 'compress' };
  }
  
  return null;
};

// Session Management Utilities
const SESSION_LIMITS = {
  free: { 
    compressions: 25,
    conversions: 5,
    maxFileSize: 25 * 1024 * 1024,
    maxConcurrent: 1,
    timeoutSeconds: 30
  }
};

// Dynamic ConversionPage Component
export default function ConversionPage() {
  const [location] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Parse conversion config from route parameters
  const urlParams = parseConversionFromParams(params, location);
  const conversionConfig = urlParams ? getConversionByPair(urlParams.from, urlParams.to) : null;
  const fromFormat = urlParams ? getFormatInfo(urlParams.from) : null;
  const toFormat = urlParams ? getFormatInfo(urlParams.to) : null;

  // If no valid conversion found, show 404
  if (!urlParams || !conversionConfig || !fromFormat || !toFormat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-light flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404 - Conversion Not Found</h1>
            <p className="text-gray-600 mb-4">The conversion format you're looking for doesn't exist.</p>
            <a href="/tools/convert" className="text-blue-600 hover:underline">Browse available conversions</a>
          </div>
        </div>
      </div>
    );
  }

  // State management
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [newlyAddedFiles, setNewlyAddedFiles] = useState<FileWithPreview[]>([]);
  const [fileObjectUrls, setFileObjectUrls] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalState, setModalState] = useState<'hidden' | 'processing' | 'results'>('hidden');
  const [showPricingCards, setShowPricingCards] = useState(false);
  const [consecutiveUploads, setConsecutiveUploads] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingFileIds, setProcessingFileIds] = useState<Set<string>>(new Set());
  const [qualityPercent, setQualityPercent] = useState(conversionConfig.defaultQuality);
  const [sizePercent, setSizePercent] = useState(conversionConfig.defaultSize);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<SessionData>({
    compressions: 0,
    conversions: 0,
    uploadedFiles: [],
    results: [],
    showPricingProbability: 0,
    activityScore: 0
  });

  // File validation using conversion matrix
  const validateFile = useCallback((file: File): string | null => {
    return validateFileFromMatrix(file, urlParams!.from);
  }, [urlParams]);

  const handleFileInput = useCallback(() => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  }, [isProcessing]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (isProcessing) {
      toast({
        title: "Processing in progress",
        description: "Please wait for current conversion to complete.",
        variant: "destructive"
      });
      return;
    }

    const fileArray = Array.from(files);
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        validFiles.push(fileWithPreview);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      // Create object URLs for previews
      setFileObjectUrls(prev => {
        const newMap = new Map(prev);
        validFiles.forEach(file => {
          newMap.set(file.name, URL.createObjectURL(file));
        });
        return newMap;
      });
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setNewlyAddedFiles(validFiles);
      sessionManager.trackActivity();
      
      // Auto-start conversion
      setTimeout(() => startConversion(validFiles), 100);
      
      const actionText = conversionConfig.operation === 'compress' ? 'Compressing' : 'Converting';
      toast({
        title: `Files added - ${actionText}...`,
        description: `${validFiles.length} file(s) added. ${actionText} ${fromFormat.displayName} to ${toFormat.displayName} automatically.`,
      });
    }
  }, [isProcessing, toast, validateFile, conversionConfig, fromFormat, toFormat]);

  const startConversion = useCallback(async (filesToProcess?: FileWithPreview[]) => {
    const files = filesToProcess || selectedFiles;
    if (files.length === 0) return;

    setIsProcessing(true);
    setModalState('processing');
    setProcessingProgress(0);
    setProcessingFileIds(new Set(files.map(f => f.id)));

    // Add counter validation before upload 
    try {
      const response = await fetch('/api/universal-usage-stats', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const stats = await response.json();
        const operationType = fromFormat!.category === 'raw' ? 'raw' : 'standard';
        const rawStats = stats.stats?.[operationType] || {};
        const { used: hourlyUsed = 0, limit: hourlyLimit = 5 } = rawStats.hourly || {};
        const { used: dailyUsed = 0, limit: dailyLimit = 10 } = rawStats.daily || {};
        
        if (hourlyUsed >= hourlyLimit) {
          const nextHour = new Date(Date.now() + 60*60*1000).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
          });
          toast({
            title: "Hourly Limit Reached",
            description: `You've reached your hourly limit of ${hourlyLimit} ${operationType} operations. Please try again after ${nextHour}, or upgrade for unlimited access!`,
            variant: "destructive",
          });
          setIsProcessing(false);
          setModalState('hidden');
          return;
        }
        
        if (dailyUsed >= dailyLimit) {
          toast({
            title: "Daily Limit Reached", 
            description: `You've reached your daily limit of ${dailyLimit} ${operationType} operations. Limit resets at midnight, or upgrade for unlimited access!`,
            variant: "destructive",
          });
          setIsProcessing(false);
          setModalState('hidden');
          return;
        }
      }
    } catch (error) {
      console.log('Could not check limits:', error);
      // Continue with upload if limit check fails
    }

    try {
      // Process files using the appropriate endpoint
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Set parameters based on conversion config
      formData.append('outputFormat', urlParams!.to);
      formData.append('quality', qualityPercent.toString());
      formData.append('resize', sizePercent < 100 ? 'true' : 'false');
      formData.append('resizePercentage', sizePercent.toString());
      
      if (sizePercent >= 100) {
        formData.append('width', '2560');
        formData.append('height', '2560'); 
        formData.append('maintainAspect', 'true');
      }
      formData.append('pageIdentifier', conversionConfig.pageIdentifier);

      // Choose endpoint based on source format
      const endpoint = conversionConfig.endpoint;
      
      // Start proper progress simulation
      const estimatedTime = fromFormat!.category === 'raw' 
        ? Math.max(30000, files.length * 15000) // RAW files take longer
        : Math.max(10000, files.length * 5000);
      
      const progressPromise = simulateProgress(estimatedTime, (progress) => {
        setProcessingProgress(progress);
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      // Wait for progress to complete
      await progressPromise;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const result = await response.json();
      
      // Handle batch results
      if (result.results && Array.isArray(result.results)) {
        const convertedResults = result.results.map((r: any) => ({
          id: r.id,
          originalName: r.originalFilename || r.originalName,
          originalSize: r.originalSize,
          compressedSize: r.convertedSize || r.compressedSize || r.finalSize,
          compressionRatio: r.compressionRatio || Math.round(((r.originalSize - (r.convertedSize || r.compressedSize || r.finalSize)) / r.originalSize) * 100),
          downloadUrl: r.downloadUrl || `/api/download/${r.id}`,
          originalFormat: urlParams!.from,
          outputFormat: urlParams!.to,
          wasConverted: conversionConfig.operation === 'convert'
        }));
        
        setSession(prev => ({
          ...prev,
          results: [...prev.results, ...convertedResults]
        }));
      }

      setProcessingProgress(100);
      setModalState('results');
      setConsecutiveUploads(prev => prev + 1);
      
      // Show pricing cards after 3 uploads
      if (consecutiveUploads >= 2) {
        setShowPricingCards(true);
      }

      // Force counter refresh after successful conversion
      setTimeout(() => {
        window.dispatchEvent(new Event('refreshUniversalCounter'));
      }, 500);

    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setModalState('hidden');
    } finally {
      setIsProcessing(false);
      setProcessingFileIds(new Set());
      
      // Refresh counter after operation
      window.dispatchEvent(new Event('refreshUniversalCounter'));
    }
  }, [selectedFiles, consecutiveUploads, toast, conversionConfig, fromFormat, urlParams, qualityPercent, sizePercent]);

  const downloadAllResults = useCallback(async () => {
    if (session.results.length === 0) {
      toast({
        title: "No files to download",
        description: "Please process some files first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const resultIds = session.results.map(result => result.id);
      
      const response = await fetch('/api/create-session-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resultIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Open the download URL in a new tab
      window.open(data.batchDownloadUrl, '_blank');

      // Show pricing cards after download is initiated
      setShowPricingCards(true);

      toast({
        title: "Download started",
        description: `Creating ZIP with ${data.fileCount} files...`,
      });

    } catch (error) {
      console.error('Download all error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to create download",
        variant: "destructive",
      });
    }
  }, [session.results, toast]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupResultsByOriginalName = (results: CompressionResult[]) => {
    const groups: { [key: string]: CompressionResult[] } = {};
    results.forEach(result => {
      if (!groups[result.originalName]) {
        groups[result.originalName] = [];
      }
      groups[result.originalName].push(result);
    });
    
    return Object.entries(groups).map(([originalName, results]) => ({
      originalName,
      results
    }));
  };

  // Generate dynamic canonical URL
  const canonicalUrl = `https://microjpeg.com${location}`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-light flex flex-col">
      <SEOHead
        title={conversionConfig.title}
        description={conversionConfig.description}
        canonicalUrl={canonicalUrl}
        keywords={conversionConfig.keywords.join(', ')}
        authoritative={true}
      />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="flex-1 px-4 pt-20 sm:pt-24 md:pt-28 pb-8 lg:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left side - Text content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                  {conversionConfig.operation === 'compress' ? (
                    <>
                      Compress <span className="text-brand-gold">{fromFormat.displayName}</span> Online
                      <br className="hidden sm:block" />
                      <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-700 block sm:inline">
                        Free {fromFormat.category === 'raw' && conversionConfig.from === 'cr2' ? 'Canon RAW' : fromFormat.displayName} Compressor
                      </span>
                    </>
                  ) : (
                    <>
                      Convert <span className="text-brand-gold">{fromFormat.displayName}</span> to <span className="text-brand-teal">{toFormat.displayName}</span> Online
                      <br className="hidden sm:block" />
                      <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-700 block sm:inline">
                        Free {fromFormat.category === 'raw' && conversionConfig.from === 'cr2' ? 'Canon RAW' : fromFormat.displayName} Converter
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {conversionConfig.description}
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {conversionConfig.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-brand-teal" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/simple-pricing'}
                  className="w-full sm:w-auto bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-8 py-4 text-lg rounded-lg animate-pulse-glow min-h-[48px]"
                  data-testid="button-plans-pricing"
                >
                  Plans & Pricing
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = '/subscribe?plan=test-premium'}
                  className="w-full sm:w-auto px-8 py-4 text-lg border-2 border-brand-gold text-brand-dark hover:bg-brand-gold/10 min-h-[48px]"
                  data-testid="button-try-now"
                >
                  Try Now ($1)
                </Button>
              </div>
            </div>

            {/* Right side - Upload interface */}
            <div className="relative mt-8 lg:mt-0 upload-interface w-full">
              <Card className="p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur border-2 border-brand-gold/20 shadow-2xl w-full">
                {/* Drag & Drop Zone */}
                <div
                  className={`relative border-3 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 ${
                    isProcessing 
                      ? 'cursor-not-allowed opacity-50 bg-gray-50' 
                      : dragActive 
                      ? 'border-brand-teal bg-brand-teal/5 scale-105 cursor-pointer' 
                      : 'border-gray-300 hover:border-brand-gold hover:bg-brand-cream/50 cursor-pointer'
                  }`}
                  onDragEnter={isProcessing ? undefined : handleDrag}
                  onDragLeave={isProcessing ? undefined : handleDrag}
                  onDragOver={isProcessing ? undefined : handleDrag}
                  onDrop={isProcessing ? undefined : handleDrop}
                  onClick={isProcessing ? undefined : handleFileInput}
                  title={isProcessing ? 'Please wait - conversion in progress...' : ''}
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-teal/10 rounded-xl mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-brand-teal" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm sm:text-base font-medium text-gray-700">
                        Drop {fromFormat.displayName} files here or click to upload
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {conversionConfig.operation === 'compress' 
                          ? `Compress ${fromFormat.displayName} files`
                          : `Convert ${fromFormat.displayName} files to ${toFormat.displayName} format`
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {fromFormat.extensions.map(ext => ext.toUpperCase()).join(', ')} files only
                      </p>
                    </div>

                    {/* Quality and Size Controls */}
                    <div className="pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Size Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Size</label>
                            <span className="text-xs text-gray-500">{sizePercent}%</span>
                          </div>
                          <input
                            type="range"
                            min="25"
                            max="100"
                            value={sizePercent}
                            onChange={(e) => setSizePercent(Number(e.target.value))}
                            disabled={isProcessing}
                            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            style={{
                              background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${sizePercent}%, #e5e5e5 ${sizePercent}%, #e5e5e5 100%)`
                            }}
                          />
                        </div>
                        
                        {/* Quality Slider - only show if target format supports quality */}
                        {toFormat.supportsQuality && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">Quality</label>
                              <span className="text-xs text-gray-500">{qualityPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={qualityPercent}
                              onChange={(e) => setQualityPercent(Number(e.target.value))}
                              disabled={isProcessing}
                              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              style={{
                                background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${qualityPercent}%, #e5e5e5 ${qualityPercent}%, #e5e5e5 100%)`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={fromFormat.extensions.map(ext => `.${ext}`).join(',')}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFiles(e.target.files);
                      }
                    }}
                    data-testid="file-input"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Conversion Output Modal */}
      <ConversionOutputModal
        modalState={modalState}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
        processingFileIds={processingFileIds}
        selectedFiles={selectedFiles}
        session={session}
        showPricingCards={showPricingCards}
        fromFormatName={fromFormat.displayName}
        toFormatName={toFormat.displayName}
        operationType={conversionConfig.operation}
        onDownloadAll={downloadAllResults}
        onClose={() => setModalState('hidden')}
      />

      {/* Pricing Cards Upsell */}
      {showPricingCards && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="p-4 bg-white/95 backdrop-blur border-2 border-brand-gold/20 shadow-xl max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-brand-gold" />
                <h4 className="font-semibold text-sm">Upgrade for More</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPricingCards(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Get unlimited conversions and larger file sizes
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs"
                onClick={() => window.location.href = '/simple-pricing'}
              >
                View Plans
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => window.location.href = '/subscribe?plan=test-premium'}
              >
                Try $1
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}