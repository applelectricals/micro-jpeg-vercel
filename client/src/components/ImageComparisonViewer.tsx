import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Eye, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CompressionJob } from "@shared/schema";

interface ImageComparisonViewerProps {
  job: CompressionJob;
  originalImageUrl: string;
  compressedImageUrl: string;
  onDownload?: () => void;
}

export function ImageComparisonViewer({
  job,
  originalImageUrl,
  compressedImageUrl,
  onDownload
}: ImageComparisonViewerProps) {
  const [comparison, setComparison] = useState(50); // 0 = original, 100 = compressed
  const [zoom, setZoom] = useState(100);
  const [showDifferences, setShowDifferences] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getQualityColor = (grade: string) => {
    switch (grade?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Original
              <Badge variant="outline">Original</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{formatFileSize(job.originalSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium uppercase">{job.originalFormat || 'JPEG'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compressed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Compressed
              <Badge className="bg-green-100 text-green-800">
                {job.status === 'completed' ? 'Completed' : 'Processing...'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{formatFileSize(job.compressedSize || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reduction:</span>
                <span className="font-medium text-green-600">
                  {job.compressionRatio}% smaller
                </span>
              </div>
              
              {job.qualityGrade && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Visual Quality</span>
                    </div>
                    <Badge className={getQualityColor(job.qualityGrade)}>
                      {job.qualityGrade?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Overall Score</span>
                      <span className="font-bold text-green-800">{job.qualityScore}/100</span>
                    </div>
                    <Progress 
                      value={job.qualityScore || 0} 
                      className="h-2 bg-green-100"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600">PSNR</span>
                        <span className="font-medium">
                          {job.psnr ? `${(job.psnr / 100).toFixed(1)} dB` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">SSIM</span>
                        <span className="font-medium">
                          {job.ssim ? `${(job.ssim / 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <span>• Excellent visual quality preserved</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <span>• High noise control</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Image Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              Advanced Image Comparison
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Comparison
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Use the slider to compare original vs compressed images. Zoom and pan for detailed inspection.
          </p>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent>
            {/* Comparison Controls */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showDifferences ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDifferences(!showDifferences)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showDifferences ? 'Hide' : 'Show'} Differences
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(zoom + 25, 200))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(zoom - 25, 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZoom(100);
                    setComparison(50);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                {onDownload && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onDownload}
                    className="ml-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium whitespace-nowrap">Zoom: {zoom}%</span>
                <div className="flex-1">
                  <Slider
                    value={[zoom]}
                    onValueChange={([value]) => setZoom(value)}
                    min={25}
                    max={200}
                    step={25}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Image Comparison Container */}
            <div 
              ref={containerRef}
              className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
            >
              {/* Original Image */}
              <div 
                className="absolute inset-0 bg-gray-50"
                style={{ 
                  clipPath: `polygon(0 0, ${comparison}% 0, ${comparison}% 100%, 0 100%)` 
                }}
              >
                <img
                  src={originalImageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center'
                  }}
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-black/70 text-white">Original</Badge>
                </div>
              </div>

              {/* Compressed Image */}
              <div 
                className="absolute inset-0 bg-gray-50"
                style={{ 
                  clipPath: `polygon(${comparison}% 0, 100% 0, 100% 100%, ${comparison}% 100%)` 
                }}
              >
                <img
                  src={compressedImageUrl}
                  alt="Compressed"
                  className="w-full h-full object-contain"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center'
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black/70 text-white">Compressed</Badge>
                </div>
              </div>

              {/* Comparison Slider */}
              <div 
                ref={sliderRef}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
                style={{ left: `${comparison}%`, transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  const container = containerRef.current;
                  if (!container) return;

                  const handleMouseMove = (e: MouseEvent) => {
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                    setComparison(percentage);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div className="w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md flex items-center justify-center">
                  <div className="w-1 h-3 bg-blue-500 rounded"></div>
                </div>
              </div>
            </div>

            {/* Comparison Slider Control */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Original</span>
                <span>Equal comparison</span>
                <span>Compressed</span>
              </div>
              <Slider
                value={[comparison]}
                onValueChange={([value]) => setComparison(value)}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}