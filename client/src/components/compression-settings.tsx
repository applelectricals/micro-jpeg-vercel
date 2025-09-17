import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Crown, Lock, Sparkles, Zap, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { SmartRecommendationTooltip } from "@/components/SmartRecommendationTooltip";
import type { CompressionSettings } from "@/pages/home";

// Tier-based feature flags
interface TierFeatures {
  hasAdvancedQualitySlider: boolean;
  hasCompressionAlgorithms: boolean;
  hasResizeQualityOptions: boolean;
  hasProgressiveJPEG: boolean;
  hasCustomProfiles: boolean;
  hasLosslessMode: boolean;
}

const getTierFeatures = (tier: 'free' | 'starter' | 'professional'): TierFeatures => {
  switch (tier) {
    case 'free':
      return {
        hasAdvancedQualitySlider: false,
        hasCompressionAlgorithms: false,
        hasResizeQualityOptions: false,
        hasProgressiveJPEG: false,
        hasCustomProfiles: false,
        hasLosslessMode: false
      };
    case 'starter':
      return {
        hasAdvancedQualitySlider: true,
        hasCompressionAlgorithms: true,
        hasResizeQualityOptions: true,
        hasProgressiveJPEG: true,
        hasCustomProfiles: false,
        hasLosslessMode: false
      };
    case 'professional':
      return {
        hasAdvancedQualitySlider: true,
        hasCompressionAlgorithms: true,
        hasResizeQualityOptions: true,
        hasProgressiveJPEG: true,
        hasCustomProfiles: true,
        hasLosslessMode: true
      };
  }
};

interface CompressionSettingsProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  isPremium?: boolean;
  userTier?: 'free' | 'starter' | 'professional';
  uploadedFile?: File | null;
  uploadedJobs?: any[];
  onCompress?: () => void;
  isUploading?: boolean;
  isProcessing?: boolean;
}

export default function CompressionSettings({ 
  settings, 
  onSettingsChange, 
  isPremium = false, 
  userTier = 'free',
  uploadedFile = null,
  uploadedJobs = [],
  onCompress,
  isUploading = false,
  isProcessing = false
}: CompressionSettingsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tierFeatures = getTierFeatures(userTier);
  
  // Determine available output formats based on uploaded files
  const getAvailableOutputFormats = () => {
    const formats = [
      { value: "keep-original", label: "Keep Original Format", description: "Same as input" },
      { value: "jpeg", label: "JPEG", description: "Universal support" },
      { value: "png", label: "PNG", description: "Lossless quality" }
    ];
    
    // Always show WebP and AVIF for all users (no restrictions)
    formats.push(
      { value: "webp", label: "WebP", description: "Modern, smaller" },
      { value: "avif", label: "AVIF", description: "Next-gen, smallest" }
    );
    
    return formats;
  };
  
  const availableFormats = getAvailableOutputFormats();
  
  const updateSetting = (key: keyof CompressionSettings, value: string | number | boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };
  
  // Only update format if the current selection becomes unavailable
  React.useEffect(() => {
    // Don't override user selection if they have a valid format
    if (settings.outputFormat && availableFormats.some(f => f.value === settings.outputFormat)) {
      return; // Current selection is valid, don't change it
    }
    
    // Only change if current format is actually unavailable
    if (settings.outputFormat && !availableFormats.some(f => f.value === settings.outputFormat)) {
      // Choose 'jpeg' as default instead of 'keep-original' for better user experience
      const defaultFormat = availableFormats.find(f => f.value === 'jpeg')?.value || availableFormats[0]?.value || "jpeg";
      updateSetting("outputFormat", defaultFormat);
    }
  }, [availableFormats]);

  const handlePremiumFeatureClick = () => {
    setLocation("/subscribe");
  };

  const handleApplyRecommendation = (quality: number, format: string) => {
    updateSetting("customQuality", quality);
    updateSetting("outputFormat", format);
  };
  
  const getQualityDescription = (quality: number) => {
    if (quality >= 95) return "Lossless (Huge files)";
    if (quality >= 85) return "Excellent (Large files)";
    if (quality >= 75) return "High (Medium files)";
    if (quality >= 65) return "Good (Small files)";
    if (quality >= 50) return "Fair (Very small files)";
    return "Low (Tiny files)";
  };
  
  const getFileSizeEstimate = (quality: number) => {
    const baseSize = 100; // KB baseline
    const factor = Math.pow(quality / 100, 2);
    return Math.round(baseSize * factor * 10) / 10;
  };
  
  const getCompressionAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'standard': return 'Balanced compression for all image types';
      case 'aggressive': return 'Maximum compression, slight quality trade-off';
      case 'lossless': return 'Zero quality loss, larger file sizes';
      case 'mozjpeg': return 'Mozilla\'s optimized JPEG encoder';
      case 'progressive': return 'Loads progressively for faster perception';
      default: return 'Standard compression';
    }
  };
  
  const getResizeQualityDescription = (quality: string) => {
    switch (quality) {
      case 'lanczos': return 'Highest quality, best for photography';
      case 'bicubic': return 'Good balance of quality and speed';
      case 'bilinear': return 'Fast processing, acceptable quality';
      case 'nearest': return 'Fastest, sharp edges (pixel art)';
      default: return 'Standard resize quality';
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Advanced Compression Settings</h3>
          <Badge variant="outline" className="text-xs w-fit">
            {settings.optimizeForWeb ? "Web Optimized" : "Standard"}
          </Badge>
        </div>
        
        {/* Quality Control Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Custom Quality Slider - Premium Feature */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-700">Quality Level</Label>
                {isPremium && uploadedFile && (
                  <SmartRecommendationTooltip
                    file={uploadedFile}
                    isPremiumUser={isPremium}
                    onApplyRecommendation={handleApplyRecommendation}
                  >
                    <div className="flex items-center gap-1 cursor-pointer group">
                      <Sparkles className="h-4 w-4 text-accent group-hover:text-accent/80 transition-colors" />
                      <span className="text-xs text-accent group-hover:text-accent/80 font-medium">
                        AI Help
                      </span>
                    </div>
                  </SmartRecommendationTooltip>
                )}
                {!isPremium && (
                  <Badge variant="secondary" className="text-xs bg-accent/10 text-accent">
                    <Crown size={10} className="mr-1" />
                    Premium
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Higher quality = larger file size</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2">
                {tierFeatures.hasAdvancedQualitySlider ? (
                  <>
                    <Slider
                      value={[(settings.customQuality as number) || 75]}
                      onValueChange={(value) => updateSetting("customQuality", value[0])}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full [&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_.relative]:bg-accent/20 [&_.bg-primary]:bg-accent"
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Low (10%)</span>
                      <div className="text-center">
                        <div className="font-medium text-gray-700 text-sm">
                          {(settings.customQuality as number) || 75}%
                        </div>
                        <div className="text-xs text-blue-600">
                          ~{getFileSizeEstimate((settings.customQuality as number) || 75)}KB/100KB
                        </div>
                      </div>
                      <span>High (100%)</span>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Lock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Advanced quality slider available with Premium</p>
                        <p className="text-xs text-gray-500 mb-3">Free plan includes basic quality presets below</p>
                        <Button size="sm" onClick={handlePremiumFeatureClick} className="bg-accent hover:bg-accent/90 text-white">
                          <Crown size={14} className="mr-1" />
                          Upgrade to Premium
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Presets - Available for all users */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                {isPremium ? "Quick Presets" : "Quality Options (Free Plan)"}
              </Label>
              <Select 
                value={String(settings.customQuality || 75)} 
                onValueChange={(value) => updateSetting("customQuality", parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="85">Best(85%)</SelectItem>
                  <SelectItem value="75">Standard(75%)</SelectItem>
                  <SelectItem value="60">Small(60%)</SelectItem>
                  <SelectItem value="50">Tiny(50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Resize for Free Users */}
          {!isPremium && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Resize Options (Free Plan)</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateSetting("resizeOption", "none")}
                  className={`p-3 text-xs border rounded-lg transition-colors ${
                    settings.resizeOption === "none" 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">Original Size</div>
                  <div className="text-gray-500">Keep as is</div>
                </button>
                <button
                  onClick={() => updateSetting("resizeOption", "75")}
                  className={`p-3 text-xs border rounded-lg transition-colors ${
                    settings.resizeOption === "75" 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">75% Size</div>
                  <div className="text-gray-500">Reduce slightly</div>
                </button>
                <button
                  onClick={() => updateSetting("resizeOption", "50")}
                  className={`p-3 text-xs border rounded-lg transition-colors ${
                    settings.resizeOption === "50" 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">50% Size</div>
                  <div className="text-gray-500">Half size</div>
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Free plan includes basic resize options. 
                <button
                  onClick={handlePremiumFeatureClick}
                  className="text-accent hover:text-accent/80 underline ml-1"
                >
                  Upgrade for custom dimensions
                </button>
              </div>
            </div>
          )}

          {/* Advanced Options - Premium Features */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-between flex-1">
                <h4 className="text-sm font-medium text-gray-900">Advanced Options</h4>
                <p className="text-xs text-gray-500 text-right">
                  {getCompressionAlgorithmDescription(settings.compressionAlgorithm || "standard")}
                </p>
              </div>
              {!isPremium && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                  <Crown size={10} className="mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            
            {isPremium ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Resize Options */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Resize Option</Label>
                  <Select value={settings.resizeOption} onValueChange={(value) => updateSetting("resizeOption", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keep Original Size</SelectItem>
                      <SelectItem value="25">25% (Thumbnails)</SelectItem>
                      <SelectItem value="50">50% (Small)</SelectItem>
                      <SelectItem value="75">75% (Medium)</SelectItem>
                      <SelectItem value="custom">Custom Dimensions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Output Format */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Output Format</Label>
                  <Select value={settings.outputFormat} onValueChange={(value) => updateSetting("outputFormat", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div>
                            <div className="font-medium">{format.label}</div>
                            <div className="text-xs text-gray-500">{format.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Compression Algorithm */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    Algorithm
                    {!tierFeatures.hasCompressionAlgorithms && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 ml-2">
                        <Crown size={10} className="mr-1" />
                        Starter+
                      </Badge>
                    )}
                  </Label>
                  {tierFeatures.hasCompressionAlgorithms ? (
                    <Select value={settings.compressionAlgorithm || "standard"} onValueChange={(value) => updateSetting("compressionAlgorithm", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                        <SelectItem value="mozjpeg">MozJPEG Optimized</SelectItem>
                        <SelectItem value="progressive">Progressive</SelectItem>
                        {tierFeatures.hasLosslessMode && (
                          <SelectItem value="lossless">Lossless</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600 mb-1">Standard Algorithm</p>
                      <p className="text-xs text-gray-500">Upgrade for aggressive, MozJPEG, and lossless options</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Lock className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Advanced Features Locked</h5>
                  <p className="text-xs text-gray-600 mb-4">
                    Get access to advanced compression algorithms, custom resize options, and professional quality controls
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>Free: Basic compression only</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>Starter: Advanced algorithms + quality slider</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>Professional: Custom profiles + lossless mode</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={handlePremiumFeatureClick} className="bg-accent hover:bg-accent/90 text-white">
                    <Crown size={14} className="mr-1" />
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}
            
            {/* Resize Quality Options - Starter+ Feature */}
            {tierFeatures.hasResizeQualityOptions && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700 min-w-[100px]">Resize Quality</Label>
                  <Select 
                    value={settings.resizeQuality || "lanczos"} 
                    onValueChange={(value) => updateSetting("resizeQuality", value)}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lanczos">
                        <div>
                          <div className="font-medium">Lanczos</div>
                          <div className="text-xs text-gray-500">Highest quality, best for photography</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="bicubic">
                        <div>
                          <div className="font-medium">Bicubic</div>
                          <div className="text-xs text-gray-500">Good balance of quality and speed</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="bilinear">
                        <div>
                          <div className="font-medium">Bilinear</div>
                          <div className="text-xs text-gray-500">Fast processing, acceptable quality</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="nearest">
                        <div>
                          <div className="font-medium">Nearest</div>
                          <div className="text-xs text-gray-500">Fastest, sharp edges (pixel art)</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
          </div>

          {/* Web Optimization Settings - Premium Feature */}
          <div className="border-t pt-6">
            {!isPremium && (
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">Web Optimization</h4>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                  <Crown size={10} className="mr-1" />
                  Premium
                </Badge>
              </div>
            )}
            
            {isPremium ? (
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-gray-700 min-w-[120px]">Web Optimization</Label>
                <Select 
                  value={
                    settings.optimizeForWeb ? "optimize-web" :
                    settings.progressiveJpeg ? "progressive" :
                    settings.optimizeScans ? "optimize-scans" :
                    settings.arithmeticCoding ? "arithmetic" :
                    "standard"
                  } 
                  onValueChange={(value) => {
                    // Reset all optimization flags
                    updateSetting("optimizeForWeb", false);
                    updateSetting("progressiveJpeg", false);
                    updateSetting("optimizeScans", false);
                    updateSetting("arithmeticCoding", false);
                    
                    // Set the selected optimization
                    switch(value) {
                      case "optimize-web":
                        updateSetting("optimizeForWeb", true);
                        break;
                      case "progressive":
                        updateSetting("progressiveJpeg", true);
                        break;
                      case "optimize-scans":
                        updateSetting("optimizeScans", true);
                        break;
                      case "arithmetic":
                        updateSetting("arithmeticCoding", true);
                        break;
                    }
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (No optimization)</SelectItem>
                    <SelectItem value="optimize-web">Optimize for Web (Strip metadata, optimize color space)</SelectItem>
                    <SelectItem value="progressive">Progressive JPEG (Loads progressively for faster perception)</SelectItem>
                    <SelectItem value="optimize-scans">Optimize Scans (Better compression with optimized scan order)</SelectItem>
                    <SelectItem value="arithmetic">Arithmetic Coding (Better compression, limited browser support)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Lock className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Advanced web optimization features</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Unlock progressive JPEG, scan optimization, and metadata stripping
                  </p>
                  <Button size="sm" onClick={handlePremiumFeatureClick} className="bg-accent hover:bg-accent/90 text-white">
                    <Crown size={12} className="mr-1" />
                    Get Premium
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          {onCompress && (
            <div className="border-t pt-6">
              <div className="w-full">
                <Button
                  onClick={onCompress}
                  disabled={(isUploading || isProcessing) || (!isPremium && settings.outputFormat !== 'keep-original' && settings.outputFormat !== 'jpeg')}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white disabled:opacity-50"
                  data-testid="button-process"
                >
                  <Zap className="h-4 w-4" />
                  {isUploading ? "File Uploading..." : isProcessing ? "Processing..." : "Process My Files"}
                </Button>
              </div>
              {!isPremium && settings.outputFormat !== 'keep-original' && settings.outputFormat !== 'jpeg' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Format conversion requires Premium. 
                  <button
                    onClick={handlePremiumFeatureClick}
                    className="text-accent hover:text-accent/80 underline ml-1"
                  >
                    Upgrade now
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
