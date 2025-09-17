import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Settings, Crown } from "lucide-react";

export interface CompressionSettings {
  quality: number;
  outputFormat: string;
  resizeOption: string;
  compressionAlgorithm: string;
  webOptimization: string;
}

interface CompressionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompress: (settings: CompressionSettings) => void;
  isCompressing: boolean;
  fileCount: number;
}

export function CompressionSettingsDialog({
  open,
  onOpenChange,
  onCompress,
  isCompressing,
  fileCount
}: CompressionSettingsDialogProps) {
  const [quality, setQuality] = useState([75]);
  const [outputFormat, setOutputFormat] = useState("keep-original");
  const [resizeOption, setResizeOption] = useState("keep-original");
  const [compressionAlgorithm, setCompressionAlgorithm] = useState("standard");
  const [webOptimization, setWebOptimization] = useState("optimize-web");

  const getQualityDescription = (value: number) => {
    if (value <= 30) return "Low (10%) - Smallest";
    if (value <= 50) return "Small Files - 60% Compact";
    if (value <= 70) return "Standard - 75% Recommended";
    if (value <= 85) return "High Quality - 85% Good balance";
    return "High (100%) - Largest";
  };

  const getEstimatedSize = (value: number) => {
    const baseSize = 100; // Assuming 100KB base
    const factor = value / 100;
    return `~${(baseSize * factor).toFixed(0)}KB per 100KB`;
  };

  const handleCompress = () => {
    const settings: CompressionSettings = {
      quality: quality[0],
      outputFormat,
      resizeOption,
      compressionAlgorithm,
      webOptimization
    };
    onCompress(settings);
  };

  const applyPreset = (preset: 'high' | 'standard' | 'small' | 'tiny') => {
    switch (preset) {
      case 'high':
        setQuality([85]);
        break;
      case 'standard':
        setQuality([75]);
        break;
      case 'small':
        setQuality([60]);
        break;
      case 'tiny':
        setQuality([50]);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-green-600" />
            <Settings className="h-5 w-5" />
            Advanced Compression Settings
          </DialogTitle>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            Web Optimization Mode
          </Badge>
        </DialogHeader>

        {/* File Type Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-blue-700">How Multi-Format Processing Works</span>
            <Badge variant="secondary" className="text-xs">Smart Engine</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-600">
            <div>
              <div className="font-medium mb-1">✓ Universal Format Support</div>
              <div>JPEG, PNG, WebP, AVIF files processed simultaneously with one settings profile</div>
            </div>
            <div>
              <div className="font-medium mb-1">✓ Smart Format Conversion</div>
              <div>Any format → Any format (e.g., PNG → WebP, JPEG → AVIF)</div>
            </div>
            <div>
              <div className="font-medium mb-1">✓ Intelligent Algorithm Mapping</div>
              <div>Algorithms automatically matched to compatible formats (e.g., MozJPEG only for JPEG output)</div>
            </div>
            <div>
              <div className="font-medium mb-1">✓ Universal Resize & Quality</div>
              <div>Resize and quality settings work across all file types uniformly</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Left Column - Quality Settings */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium text-gray-600">Quality Level</Label>
                <span className="text-sm font-medium">{quality[0]}% Quality</span>
              </div>
              
              <div className="px-2">
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full [&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_.relative]:bg-accent/20 [&_.bg-primary]:bg-accent"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (10%)</span>
                  <span>High (100%)</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <div>{getQualityDescription(quality[0])}</div>
                <div className="text-blue-600">{getEstimatedSize(quality[0])}</div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('high')}
                  className="text-left justify-start"
                >
                  <div>
                    <div className="font-medium">Best(85%)</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('standard')}
                  className="text-left justify-start"
                >
                  <div>
                    <div className="font-medium">Standard(75%)</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('small')}
                  className="text-left justify-start"
                >
                  <div>
                    <div className="font-medium">Small(60%)</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('tiny')}
                  className="text-left justify-start"
                >
                  <div>
                    <div className="font-medium">Tiny(50%)</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Advanced Options */}
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Advanced Options</Label>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Resize Option (Optional)</Label>
                  <Select value={resizeOption} onValueChange={setResizeOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-original">Keep Original Size</SelectItem>
                      <SelectItem value="resize-50">Resize to 50% (Reduces file size)</SelectItem>
                      <SelectItem value="resize-75">Resize to 75% (Moderate reduction)</SelectItem>
                      <SelectItem value="max-width-1920">Max Width 1920px (Web standard)</SelectItem>
                      <SelectItem value="max-width-1280">Max Width 1280px (Mobile optimized)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    Resize is optional but greatly reduces file size. Works with all formats.
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-original">Keep Original Format</SelectItem>
                      <SelectItem value="jpeg">JPEG (Universal - All formats → JPEG)</SelectItem>
                      <SelectItem value="webp">WebP (Modern - All formats → WebP)</SelectItem>
                      <SelectItem value="avif">AVIF (Next-gen - All formats → AVIF)</SelectItem>
                      <SelectItem value="png">PNG (Lossless - All formats → PNG)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    {outputFormat === 'keep-original' 
                      ? 'Each file keeps its original format' 
                      : `All uploaded files will be converted to ${outputFormat.toUpperCase()}`
                    }
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Algorithm</Label>
                  <Select value={compressionAlgorithm} onValueChange={setCompressionAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Universal (Works with all formats)</SelectItem>
                      <SelectItem value="progressive">Progressive (JPEG/WebP only)</SelectItem>
                      <SelectItem value="mozjpeg">MozJPEG (JPEG output only)</SelectItem>
                      <SelectItem value="webp-lossless">WebP Lossless (WebP output only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    {compressionAlgorithm === 'standard' && 'Optimized settings applied per file type'}
                    {compressionAlgorithm === 'progressive' && 'Applied only to JPEG/WebP files'}
                    {compressionAlgorithm === 'mozjpeg' && 'Only for JPEG output format'}
                    {compressionAlgorithm === 'webp-lossless' && 'Only for WebP output format'}
                  </div>
                </div>
              </div>
            </div>

            {/* Web Optimization */}
            <div>
              <RadioGroup value={webOptimization} onValueChange={setWebOptimization}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="optimize-web" id="optimize-web" />
                  <Label htmlFor="optimize-web" className="flex-1">
                    <div className="font-medium">Optimize for Web</div>
                    <div className="text-xs text-gray-500">Strip metadata, optimize color space</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="progressive" id="progressive" />
                  <Label htmlFor="progressive" className="flex-1">
                    <div className="font-medium">Progressive JPEG</div>
                    <div className="text-xs text-gray-500">Loads progressively for faster perception</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="optimize-scans" id="optimize-scans" />
                  <Label htmlFor="optimize-scans" className="flex-1">
                    <div className="font-medium">Optimize Scans</div>
                    <div className="text-xs text-gray-500">Better compression with optimized scan order</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="arithmetic" id="arithmetic" />
                  <Label htmlFor="arithmetic" className="flex-1">
                    <div className="font-medium">Arithmetic Coding</div>
                    <div className="text-xs text-gray-500">Better compression (limited browser support)</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCompressing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompress}
            disabled={isCompressing}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isCompressing ? "Compressing..." : `Compress ${fileCount} File${fileCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}