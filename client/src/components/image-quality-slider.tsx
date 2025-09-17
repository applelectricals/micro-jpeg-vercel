import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Eye, Download, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageQualitySliderProps {
  originalUrl: string;
  compressedUrl: string;
  originalFileName: string;
  className?: string;
}

export default function ImageQualitySlider({
  originalUrl,
  compressedUrl,
  originalFileName,
  className
}: ImageQualitySliderProps) {
  const [sliderPosition, setSliderPosition] = useState([50]);
  const [zoom, setZoom] = useState(1);
  const [showDifferences, setShowDifferences] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({ original: false, compressed: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);
  const compressedImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load images and setup
  useEffect(() => {
    const loadImage = (url: string, type: 'original' | 'compressed') => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [type]: true }));
      };
      img.onerror = () => {
        console.error(`Failed to load ${type} image:`, url);
      };
      img.src = url;
      return img;
    };

    const originalImg = loadImage(originalUrl, 'original');
    const compressedImg = loadImage(compressedUrl, 'compressed');

    if (originalImageRef.current) {
      originalImageRef.current.src = originalUrl;
    }
    if (compressedImageRef.current) {
      compressedImageRef.current.src = compressedUrl;
    }
  }, [originalUrl, compressedUrl]);

  // Check if both images are loaded
  useEffect(() => {
    if (imagesLoaded.original && imagesLoaded.compressed) {
      setIsLoading(false);
    }
  }, [imagesLoaded]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setSliderPosition([50]);
  }, []);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  }, [zoom, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Generate difference visualization
  const generateDifferenceImage = useCallback(async () => {
    if (!originalImageRef.current || !compressedImageRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originalImg = originalImageRef.current;
    const compressedImg = compressedImageRef.current;

    // Set canvas size to match images
    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;

    // Create temporary canvases for image data
    const tempCanvas1 = document.createElement('canvas');
    const tempCanvas2 = document.createElement('canvas');
    tempCanvas1.width = tempCanvas2.width = canvas.width;
    tempCanvas1.height = tempCanvas2.height = canvas.height;

    const ctx1 = tempCanvas1.getContext('2d')!;
    const ctx2 = tempCanvas2.getContext('2d')!;

    // Draw images to temporary canvases
    ctx1.drawImage(originalImg, 0, 0);
    ctx2.drawImage(compressedImg, 0, 0);

    // Get image data
    const imageData1 = ctx1.getImageData(0, 0, canvas.width, canvas.height);
    const imageData2 = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const diffData = ctx.createImageData(canvas.width, canvas.height);

    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const diffPixels = diffData.data;

    // Calculate differences
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

      // Calculate absolute difference
      const diffR = Math.abs(r1 - r2);
      const diffG = Math.abs(g1 - g2);
      const diffB = Math.abs(b1 - b2);
      const totalDiff = diffR + diffG + diffB;

      if (totalDiff > 30) { // Threshold for visible difference
        // Highlight differences in red
        diffPixels[i] = 255;     // Red
        diffPixels[i + 1] = 0;   // Green
        diffPixels[i + 2] = 0;   // Blue
        diffPixels[i + 3] = Math.min(255, totalDiff * 2); // Alpha based on difference magnitude
      } else {
        // Keep original pixel with reduced opacity
        diffPixels[i] = (r1 + r2) / 2;
        diffPixels[i + 1] = (g1 + g2) / 2;
        diffPixels[i + 2] = (b1 + b2) / 2;
        diffPixels[i + 3] = 80; // Low opacity for unchanged areas
      }
    }

    // Draw difference image
    ctx.putImageData(diffData, 0, 0);
  }, []);

  // Toggle differences view
  const toggleDifferences = useCallback(async () => {
    if (!showDifferences) {
      await generateDifferenceImage();
    }
    setShowDifferences(prev => !prev);
  }, [showDifferences, generateDifferenceImage]);

  // Download functionality
  const downloadComparison = useCallback(() => {
    if (!containerRef.current) return;

    // Create a new canvas for the comparison
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !originalImageRef.current || !compressedImageRef.current) return;

    const originalImg = originalImageRef.current;
    const compressedImg = compressedImageRef.current;
    
    // Set canvas size (side by side comparison)
    canvas.width = originalImg.naturalWidth * 2 + 40; // 40px gap
    canvas.height = Math.max(originalImg.naturalHeight, compressedImg.naturalHeight) + 60; // 60px for labels

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw original image
    ctx.drawImage(originalImg, 0, 30, originalImg.naturalWidth, originalImg.naturalHeight);
    
    // Draw compressed image
    ctx.drawImage(compressedImg, originalImg.naturalWidth + 40, 30, compressedImg.naturalWidth, compressedImg.naturalHeight);

    // Add labels
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Original', 10, 25);
    ctx.fillText('Compressed', originalImg.naturalWidth + 50, 25);

    // Download the canvas as image
    const link = document.createElement('a');
    link.download = `${originalFileName}-comparison.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [originalFileName]);

  if (isLoading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading comparison images...</p>
          </div>
        </div>
      </Card>
    );
  }

  const sliderPercent = sliderPosition[0];

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Controls */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
            Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="flex items-center gap-1"
          >
            <ZoomOut className="h-4 w-4" />
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant={showDifferences ? "default" : "outline"}
            size="sm"
            onClick={toggleDifferences}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Differences
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
          {zoom > 1 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Move className="h-3 w-3" />
              Drag to pan
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadComparison}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Comparison Container */}
      <div className="relative bg-gray-100">
        <div
          ref={containerRef}
          className="relative overflow-hidden h-96 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          {/* Original Image */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              ref={originalImageRef}
              src={originalUrl}
              alt="Original"
              className="w-full h-full object-contain"
              draggable={false}

            />
          </div>

          {/* Compressed Image Overlay */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `inset(0 ${100 - sliderPercent}% 0 0)`,
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              ref={compressedImageRef}
              src={compressedUrl}
              alt="Compressed"
              className="w-full h-full object-contain"
              draggable={false}

            />
          </div>

          {/* Differences Canvas Overlay */}
          {showDifferences && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
          )}

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
            style={{
              left: `${sliderPercent}%`,
              transform: `scale(${zoom}) translateX(${panOffset.x / zoom}px)`,
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>

          {/* Labels */}
          {!showDifferences && (
            <>
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                Original
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                Compressed
              </div>
            </>
          )}

          {showDifferences && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-90 text-white px-3 py-1 rounded text-sm">
              Differences Highlighted
            </div>
          )}
        </div>

        {/* Slider Control */}
        <div className="p-4 bg-white border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Original</span>
              <span>Comparison Slider</span>
              <span>Compressed</span>
            </div>
            <Slider
              value={sliderPosition}
              onValueChange={setSliderPosition}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-center text-xs text-gray-500">
              {sliderPercent < 50 
                ? `${Math.round((50 - sliderPercent) * 2)}% more original visible`
                : sliderPercent > 50 
                  ? `${Math.round((sliderPercent - 50) * 2)}% more compressed visible`
                  : "Equal comparison"
              }
            </div>
          </div>
        </div>
      </div>

      {/* Hidden images for canvas operations */}
      <div className="hidden">
        <img ref={originalImageRef} crossOrigin="anonymous" />
        <img ref={compressedImageRef} crossOrigin="anonymous" />
      </div>
    </Card>
  );
}