import { useState, useCallback } from 'react';
import { Download, Check, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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

interface ConversionOutputModalProps {
  modalState: 'hidden' | 'processing' | 'results';
  isProcessing: boolean;
  processingProgress: number;
  processingFileIds: Set<string>;
  selectedFiles: FileWithPreview[];
  session: SessionData;
  showPricingCards: boolean;
  fromFormatName: string;
  toFormatName: string;
  operationType: 'convert' | 'compress';
  onDownloadAll: () => void;
  onClose: () => void;
}

// Utility function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ConversionOutputModal({
  modalState,
  isProcessing,
  processingProgress,
  processingFileIds,
  selectedFiles,
  session,
  showPricingCards,
  fromFormatName,
  toFormatName,
  operationType,
  onDownloadAll,
  onClose
}: ConversionOutputModalProps) {
  const { toast } = useToast();

  if (modalState === 'hidden') {
    return null;
  }

  // Dynamic title based on operation and formats
  const getTitle = () => {
    if (isProcessing) {
      return operationType === 'compress' 
        ? `Compressing your ${fromFormatName.toUpperCase()} files...`
        : `Converting your ${fromFormatName.toUpperCase()} files to ${toFormatName.toUpperCase()}...`;
    }
    return 'Your optimized images are ready!';
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 mb-8">
      <Card className="w-full bg-white shadow-2xl rounded-2xl border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-900 p-4 rounded-t-2xl -m-6 mb-0">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-white">
                {getTitle()}
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {Math.floor(processingProgress)}%
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Download and Cloud Save Buttons - Always show when results exist */}
              {session.results.length > 0 && (
                <div className="flex items-center gap-3">
                  <Button 
                    className="bg-brand-gold hover:bg-brand-gold-dark text-white"
                    onClick={onDownloadAll}
                    data-testid="button-download-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>
              )}
              
              {/* Close button for results state */}
              {modalState === 'results' && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-white hover:bg-white/10"
                  data-testid="button-close-modal"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Ad Banner Strip */}
          <div className="w-full my-4 px-2">
            <div className="flex items-center justify-between min-h-[80px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded border-2 border-blue-200 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-900 mb-1">⚡ Process 1000s of Images in Minutes with Our API</p>
                  <p className="text-xs text-blue-700">Bulk compression • 90% cost reduction • Auto-format conversion • Enterprise-grade reliability</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs px-3 py-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => window.location.href = '/api-docs'}
                >
                  View API Docs
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                  onClick={() => window.location.href = '/simple-pricing'}
                >
                  Get API Key
                </Button>
              </div>
            </div>
          </div>

          {/* Professional Upgrade Plans - TinyPNG-inspired design */}
          {(session.results.length >= 3 || showPricingCards) && (
            <div className="w-full my-6 px-2">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Want to compress larger files? Get <span className="font-bold">Premium!</span></h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Test Premium Card - TinyPNG Style */}
                <div className="relative bg-white border-2 border-brand-teal rounded-xl overflow-hidden shadow-sm">
                  {/* Recommended Badge */}
                  <div className="bg-brand-teal text-white text-center py-2 text-xs font-semibold uppercase tracking-wide">
                    RECOMMENDED FOR YOU
                  </div>
                  
                  <div className="p-6">
                    {/* Header with Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-teal/10 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Test Premium</h4>
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">COMPRESS & CONVERT</p>
                        </div>
                      </div>
                      <div className="w-10 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">Unlimited</span> image compression</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">50 MB</span> as maximum file size</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">All formats</span> including RAW & TIFF</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700">Advanced compression algorithms</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700">API access</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">$1</span>
                        <span className="text-sm text-gray-600 ml-1">24-hour trial</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-medium py-3 rounded-lg"
                      onClick={() => window.location.href = '/subscribe?plan=test-premium'}
                    >
                      Get Test Premium
                    </Button>
                  </div>
                </div>

                {/* Premium Plan Card - TinyPNG Style */}
                <div className="relative bg-white border-2 border-brand-gold rounded-xl overflow-hidden shadow-sm">
                  {/* Gold Top Banner */}
                  <div className="bg-brand-gold text-white text-center py-4 text-xs font-semibold uppercase tracking-wide"></div>
                  
                  <div className="p-6">
                    {/* Header with Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-gold/10 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-brand-gold" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 16L3 4l5.5 4L12 4l3.5 4L21 4l-2 12H5zm0 0h14v2H5v-2z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Premium</h4>
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">COMPRESS & CONVERT</p>
                        </div>
                      </div>
                      <div className="w-10 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">Unlimited</span> image compression</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">50 MB</span> as maximum file size</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700"><span className="font-semibold">All formats</span> conversion support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700">Advanced analytics & reporting</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-brand-teal" />
                        </div>
                        <span className="text-sm text-gray-700">Priority support & API access</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">$29</span>
                        <span className="text-sm text-gray-600 ml-1">Monthly per user</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className="w-full bg-brand-gold hover:bg-brand-gold-dark text-white font-medium py-3 rounded-lg"
                      onClick={() => window.location.href = '/subscribe?plan=premium'}
                    >
                      Get Premium
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Section - Show immediately with thumbnails and progress */}
          {selectedFiles.length > 0 && (
            <div className="space-y-0">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {modalState === 'processing' && session.results.length === 0 ? (
                  // Show mixed state: processing files with spinner, others with results if available
                  selectedFiles.map((file) => {
                    const isThisFileProcessing = processingFileIds.has(file.id);
                    const fileResults = session.results.filter(result => result.originalName === file.name);
                    
                    return (
                      <div key={file.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Thumbnail and file info */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to icon if preview fails
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.className = 'w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0';
                                      parent.innerHTML = '<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-brand-dark">
                                  {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {formatFileSize(file.size)} • {isThisFileProcessing ? 'Processing...' : fileResults.length > 0 ? `${fileResults.length} format${fileResults.length > 1 ? 's' : ''} ready` : 'Queued...'}
                                </p>
                                {/* Show progress bar only for initial processing */}
                                {isThisFileProcessing && session.results.length === 0 && (
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-brand-teal h-1 rounded-full transition-all duration-300 animate-pulse"
                                      style={{ width: `${Math.floor(processingProgress)}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Conditional right side indicator */}
                            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                              {isThisFileProcessing ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-sm text-gray-600">Processing...</span>
                                </div>
                              ) : fileResults.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-sm text-green-600">Ready</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-sm text-gray-500">Queued</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Show results for completed files
                  session.results.length > 0 && selectedFiles.map((file) => {
                    const fileResults = session.results.filter(result => result.originalName === file.name);
                    
                    if (fileResults.length === 0) return null;
                    
                    return (
                      <div key={file.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={fileResults[0]?.downloadUrl || URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.className = 'w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0';
                                    parent.innerHTML = '<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                  }
                                }}
                              />
                            </div>
                            
                            {/* File info and results */}
                            <div className="flex-1">
                              <h4 className="font-semibold text-brand-dark mb-1">
                                {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                              </h4>
                              <div className="space-y-1">
                                {fileResults.map((result) => (
                                  <div key={result.id} className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                      {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)} 
                                      <span className="text-green-600 font-medium ml-1">
                                        ({result.compressionRatio}% smaller)
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(result.downloadUrl, '_blank')}
                                      data-testid={`button-download-${result.id}`}
                                      className="ml-2"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}