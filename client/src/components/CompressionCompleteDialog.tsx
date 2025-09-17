import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, FileIcon } from "lucide-react";

interface CompressionResult {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  downloadPath: string;
  originalFormat?: string;
  outputFormat?: string;
  wasConverted?: boolean;
  error?: string;
}

interface CompressionCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: CompressionResult[];
  zipDownloadPath?: string;
}

export function CompressionCompleteDialog({
  open,
  onOpenChange,
  results,
  zipDownloadPath
}: CompressionCompleteDialogProps) {
  const successfulResults = results.filter(r => !r.error);
  const failedResults = results.filter(r => r.error);

  // Social sharing functions
  const shareToTwitter = () => {
    if (successfulResults.length === 1) {
      const compressionPercentage = Math.round((1 - successfulResults[0].compressedSize / successfulResults[0].originalSize) * 100);
      const text = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG! 🚀 #ImageCompression #WebOptimization #MicroJPEG`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareToLinkedIn = () => {
    if (successfulResults.length === 1) {
      const compressionPercentage = Math.round((1 - successfulResults[0].compressedSize / successfulResults[0].originalSize) * 100);
      const text = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG!\n\nPerfect for web optimization and faster loading times. Check it out!`;
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareToFacebook = () => {
    if (successfulResults.length === 1) {
      const compressionPercentage = Math.round((1 - successfulResults[0].compressedSize / successfulResults[0].originalSize) * 100);
      const text = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG!\n\nSaved ${((successfulResults[0].originalSize - successfulResults[0].compressedSize) / 1024 / 1024).toFixed(1)}MB of bandwidth! Great for websites and social media.`;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareToInstagram = () => {
    if (successfulResults.length === 1) {
      const compressionPercentage = Math.round((1 - successfulResults[0].compressedSize / successfulResults[0].originalSize) * 100);
      const text = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG! Perfect for social media! ✨`;
      navigator.clipboard.writeText(text);
      // Could add toast notification here
    }
  };
  
  const totalOriginalSize = successfulResults.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = successfulResults.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSavings = totalOriginalSize > 0 ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100) : 0;

  const downloadFile = (result: CompressionResult) => {
    const link = document.createElement('a');
    link.href = result.downloadPath;
    link.download = result.originalName.replace(/\.[^/.]+$/, '') + '.' + (result.outputFormat?.toLowerCase() || 'jpg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    if (zipDownloadPath) {
      // Download as ZIP
      const link = document.createElement('a');
      link.href = zipDownloadPath;
      link.download = `compressed_images_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback: download individual files
      successfulResults.forEach((result, index) => {
        setTimeout(() => downloadFile(result), index * 500); // Stagger downloads
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Compression Complete!
            </DialogTitle>
            
            {/* Social Sharing Buttons - Debug: Always show */}
            {successfulResults.length > 0 && (() => {
              const compressionPercentage = Math.round((1 - successfulResults[0].compressedSize / successfulResults[0].originalSize) * 100);
              const twitterText = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG! 🚀 #ImageCompression #WebOptimization #MicroJPEG`;
              const linkedInText = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG!\n\nPerfect for web optimization and faster loading times. Check it out!`;
              const facebookText = `Just compressed a ${(successfulResults[0].originalSize / 1024 / 1024).toFixed(1)}MB image down to ${(successfulResults[0].compressedSize / 1024 / 1024).toFixed(1)}MB (${compressionPercentage}% smaller) using Micro JPEG!\n\nSaved ${((successfulResults[0].originalSize - successfulResults[0].compressedSize) / 1024 / 1024).toFixed(1)}MB of bandwidth! Great for websites and social media.`;
              
              return (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 mr-2">Share your results:</span>
                  <div className="flex gap-1">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 h-8 w-8 rounded-md border border-input bg-background hover:bg-blue-50 hover:text-accent-foreground transition-colors"
                      data-testid="share-twitter"
                    >
                      <svg className="h-4 w-4" fill="#1DA1F2" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 h-8 w-8 rounded-md border border-input bg-background hover:bg-blue-50 hover:text-accent-foreground transition-colors"
                      data-testid="share-linkedin"
                    >
                      <svg className="h-4 w-4" fill="#0077B5" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 h-8 w-8 rounded-md border border-input bg-background hover:bg-blue-50 hover:text-accent-foreground transition-colors"
                      data-testid="share-facebook"
                    >
                      <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <span
                      className="inline-flex items-center justify-center p-2 h-8 w-8 rounded-md border border-input bg-background hover:bg-pink-50 hover:text-accent-foreground transition-colors cursor-pointer"
                      title="Copy text for Instagram sharing"
                      data-testid="share-instagram"
                    >
                      <svg className="h-4 w-4" fill="#E4405F" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-700">{successfulResults.length}</div>
              <div className="text-sm text-green-600">Files Compressed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{totalSavings}%</div>
              <div className="text-sm text-green-600">Total Space Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">
                {(totalOriginalSize / 1024 / 1024).toFixed(1)}MB → {(totalCompressedSize / 1024 / 1024).toFixed(1)}MB
              </div>
              <div className="text-sm text-green-600">Size Reduction</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {successfulResults.length > 0 && (
          <div className="flex gap-3 mb-4">
            <Button 
              onClick={downloadAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {zipDownloadPath ? 'Download All as ZIP' : 'Download All Files'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}

        {/* Individual Results */}
        <div className="space-y-3">
          {successfulResults.map((result) => (
            <Card key={result.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-sm">{result.originalName}</h3>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>{(result.originalSize / 1024 / 1024).toFixed(2)}MB → {(result.compressedSize / 1024 / 1024).toFixed(2)}MB</span>
                        <Badge variant="secondary" className="text-green-600">
                          {result.compressionRatio}% smaller
                        </Badge>
                      </div>
                      {result.wasConverted && (
                        <div className="flex gap-2 text-xs text-blue-600 mt-1">
                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                            {result.originalFormat} → {result.outputFormat}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadFile(result)}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Failed Results */}
          {failedResults.map((result) => (
            <Card key={result.id} className="border border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-medium text-sm">{result.originalName}</h3>
                    <p className="text-red-600 text-xs">{result.error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {failedResults.length === results.length && (
          <div className="text-center py-4">
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}