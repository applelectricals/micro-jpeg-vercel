import React, { useState, useEffect } from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles, Target, Zap } from 'lucide-react';
import { 
  analyzeImage, 
  generateSmartRecommendations,
  type ImageCharacteristics,
  type SmartRecommendations 
} from '@/lib/image-analysis';

interface SmartRecommendationTooltipProps {
  file: File | null;
  isPremiumUser: boolean;
  onApplyRecommendation: (quality: number, format: string) => void;
  children: React.ReactNode;
}

export function SmartRecommendationTooltip({
  file,
  isPremiumUser,
  onApplyRecommendation,
  children
}: SmartRecommendationTooltipProps) {
  const [recommendations, setRecommendations] = useState<SmartRecommendations | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [characteristics, setCharacteristics] = useState<ImageCharacteristics | null>(null);

  // Analyze image when file changes
  useEffect(() => {
    if (!file || !isPremiumUser) {
      setRecommendations(null);
      setCharacteristics(null);
      return;
    }

    const analyzeImageFile = async () => {
      setIsAnalyzing(true);
      try {
        const imageCharacteristics = await analyzeImage(file);
        const smartRecommendations = generateSmartRecommendations(imageCharacteristics);
        
        setCharacteristics(imageCharacteristics);
        setRecommendations(smartRecommendations);
      } catch (error) {
        console.error('Failed to analyze image:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeImageFile();
  }, [file, isPremiumUser]);

  // Don't show tooltip for non-premium users
  if (!isPremiumUser) {
    return <>{children}</>;
  }

  if (!file || isAnalyzing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="flex items-center gap-2 p-2">
              <Sparkles className="w-4 h-4 animate-pulse text-brand-gold" />
              <span className="text-sm">
                {isAnalyzing ? 'Analyzing image...' : 'Upload an image for AI recommendations'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!recommendations || !characteristics) {
    return <>{children}</>;
  }

  const { primary, alternatives, insights } = recommendations;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-0" side="right">
          <div className="bg-white border border-brand-gold/20 rounded-lg shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-gold to-brand-gold-dark p-3 rounded-t-lg">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">AI Recommendations</span>
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                  Premium
                </Badge>
              </div>
            </div>

            {/* Image Analysis Summary */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3 h-3 text-brand-teal" />
                <span className="text-xs font-medium text-gray-600">
                  {characteristics.classification.category.charAt(0).toUpperCase() + 
                   characteristics.classification.category.slice(1)} • 
                  {characteristics.classification.orientation} • 
                  {Math.round(characteristics.fileInfo.size / 1024)}KB
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {characteristics.dimensions.width} × {characteristics.dimensions.height}px
              </div>
            </div>

            {/* Primary Recommendation */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-brand-gold" />
                  <span className="font-medium text-sm text-brand-dark">
                    {primary.useCase}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Recommended
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Quality:</span>
                  <span className="font-medium">{primary.quality}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">{primary.format.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Expected size:</span>
                  <span className="font-medium text-brand-teal">{primary.expectedSize}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Reduction:</span>
                  <span className="font-medium text-green-600">{primary.expectedReduction}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2 italic">
                {primary.reasoning}
              </p>

              <Button
                size="sm"
                onClick={() => onApplyRecommendation(primary.quality, primary.format)}
                className="w-full mt-3 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Apply Settings
              </Button>
            </div>

            {/* Alternative Recommendations */}
            {alternatives.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Other Options:
                </div>
                <div className="space-y-2">
                  {alternatives.slice(0, 2).map((alt, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div>
                        <span className="font-medium">{alt.useCase}</span>
                        <div className="text-gray-500">
                          {alt.quality}% • {alt.expectedReduction} smaller
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyRecommendation(alt.quality, alt.format)}
                        className="text-xs h-6 px-2"
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  💡 Smart Insights:
                </div>
                <ul className="space-y-1">
                  {insights.slice(0, 2).map((insight, index) => (
                    <li key={index} className="text-xs text-gray-500 flex items-start gap-1">
                      <span className="text-brand-gold mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}