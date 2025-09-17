import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SmartRecommendationTooltip } from "@/components/SmartRecommendationTooltip";

export interface CompressionSettings {
  quality: number;
  resizeOption: string;
  outputFormat: string;
  compressionAlgorithm: string;
  webOptimized: boolean;
  progressiveJpeg: boolean;
  arithmeticCoding: boolean;
}

interface AdvancedCompressionSettingsProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  disabled?: boolean;
  uploadedFile?: File | null;
  isPremiumUser?: boolean;
}

const qualityPresets = [
  { name: "Best(85%)", value: 85, description: "Good balance", size: "~6.3KB per 100KB" },
  { name: "Standard(75%)", value: 75, description: "Recommended", size: "75% - Recommended" },
  { name: "Small(60%)", value: 60, description: "Compact", size: "60% - Compact" },
  { name: "Tiny(50%)", value: 50, description: "Smallest", size: "50% - Smallest" }
];

const outputFormats = [
  { value: "jpeg", label: "JPEG (Universal)", description: "Best compatibility" },
  { value: "png", label: "PNG (Lossless)", description: "Transparency support" },
  { value: "webp", label: "WebP (Modern)", description: "Better compression" },
  { value: "avif", label: "AVIF (Future)", description: "Best compression" }
];

const compressionAlgorithms = [
  { value: "standard", label: "Standard JPEG", description: "Universal compatibility" },
  { value: "mozjpeg", label: "MozJPEG", description: "Better compression" },
  { value: "webp", label: "WebP Encoder", description: "Modern format" },
  { value: "avif", label: "AVIF Encoder", description: "Next-gen format" }
];

const resizeOptions = [
  { value: "none", label: "Keep Original Size" },
  { value: "50", label: "50% smaller" },
  { value: "75", label: "25% smaller" },
  { value: "custom", label: "Custom dimensions" }
];

export function AdvancedCompressionSettings({ 
  settings, 
  onSettingsChange, 
  disabled = false,
  uploadedFile = null,
  isPremiumUser = false 
}: AdvancedCompressionSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = (updates: Partial<CompressionSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const handleApplyRecommendation = (quality: number, format: string) => {
    updateSettings({ 
      quality, 
      outputFormat: format 
    });
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 90) return "Highest (Large files)";
    if (quality >= 80) return "High (Medium files)";
    if (quality >= 70) return "Standard";
    if (quality >= 60) return "Compact";
    return "Smallest (Tiny files)";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Advanced Compression Settings
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Web Optimized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Level */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Quality Level</Label>
            <div className="flex items-center gap-2">
              {isPremiumUser && (
                <SmartRecommendationTooltip
                  file={uploadedFile}
                  isPremiumUser={isPremiumUser}
                  onApplyRecommendation={handleApplyRecommendation}
                >
                  <div className="flex items-center gap-1 cursor-pointer group">
                    <Sparkles className="h-4 w-4 text-brand-gold group-hover:text-brand-gold-dark transition-colors" />
                    <span className="text-xs text-brand-gold group-hover:text-brand-gold-dark font-medium">
                      AI Recommendations
                    </span>
                  </div>
                </SmartRecommendationTooltip>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Higher quality = larger file size</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="space-y-3">
            <Slider
              value={[settings.quality]}
              onValueChange={([value]) => updateSettings({ quality: value })}
              max={100}
              min={10}
              step={5}
              className="w-full"
              disabled={disabled && !isPremiumUser}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low (10%)</span>
              <span className="font-medium">{settings.quality}% Quality</span>
              <span>High (100%)</span>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {getQualityLabel(settings.quality)}
              </Badge>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {qualityPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={settings.quality === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettings({ quality: preset.value })}
                  disabled={disabled && !isPremiumUser}
                  className="text-xs"
                >
                  {preset.name}
                  <br />
                  <span className="text-xs opacity-75">{preset.value}%</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
            disabled={disabled && !isPremiumUser}
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-6 border-t pt-6">
            {/* Resize Option */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resize Option</Label>
              <Select
                value={settings.resizeOption}
                onValueChange={(value) => updateSettings({ resizeOption: value })}
                disabled={disabled && !isPremiumUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Output Format</Label>
              <Select
                value={settings.outputFormat}
                onValueChange={(value) => updateSettings({ outputFormat: value })}
                disabled={disabled && !isPremiumUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div>{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compression Algorithm */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Algorithm</Label>
              <Select
                value={settings.compressionAlgorithm}
                onValueChange={(value) => updateSettings({ compressionAlgorithm: value })}
                disabled={disabled && !isPremiumUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {compressionAlgorithms.map((algo) => (
                    <SelectItem key={algo.value} value={algo.value}>
                      <div>
                        <div>{algo.label}</div>
                        <div className="text-xs text-gray-500">{algo.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Web Optimization */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Web Optimization Mode</Label>
              <RadioGroup
                value={settings.webOptimized ? "optimized" : "scans"}
                onValueChange={(value) => updateSettings({ webOptimized: value === "optimized" })}
                disabled={disabled && !isPremiumUser}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="optimized" id="web-optimized" />
                  <Label htmlFor="web-optimized" className="text-sm">
                    <div>Optimize for Web</div>
                    <div className="text-xs text-gray-500">Strip metadata, optimize color space</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scans" id="optimize-scans" />
                  <Label htmlFor="optimize-scans" className="text-sm">
                    <div>Optimize Scans</div>
                    <div className="text-xs text-gray-500">Better compression with optimized scan order</div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="progressive"
                    id="progressive"
                    checked={settings.progressiveJpeg}
                    onClick={() => updateSettings({ progressiveJpeg: !settings.progressiveJpeg })}
                    disabled={disabled && !isPremiumUser}
                  />
                  <Label htmlFor="progressive" className="text-sm">
                    <div>Progressive JPEG</div>
                    <div className="text-xs text-gray-500">Loads progressively for faster perception</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="arithmetic"
                    id="arithmetic"
                    checked={settings.arithmeticCoding}
                    onClick={() => updateSettings({ arithmeticCoding: !settings.arithmeticCoding })}
                    disabled={disabled && !isPremiumUser}
                  />
                  <Label htmlFor="arithmetic" className="text-sm">
                    <div>Arithmetic Coding</div>
                    <div className="text-xs text-gray-500">Better compression (limited browser support)</div>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}