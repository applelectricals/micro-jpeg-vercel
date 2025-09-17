import { Star, TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QualityAssessmentProps {
  psnr?: number; // Stored as integer with 2 decimal precision (divide by 100)
  ssim?: number; // Stored as integer percentage
  qualityScore?: number;
  qualityGrade?: 'excellent' | 'good' | 'fair' | 'poor';
  className?: string;
}

export default function QualityAssessment({
  psnr,
  ssim,
  qualityScore,
  qualityGrade,
  className
}: QualityAssessmentProps) {
  if (!psnr || !ssim || !qualityScore || !qualityGrade) {
    return (
      <div className={cn("bg-gray-50 border border-gray-200 rounded-lg p-3", className)}>
        <p className="text-sm text-gray-500">Quality analysis pending...</p>
      </div>
    );
  }

  // Convert back to display values
  const displayPSNR = psnr / 100;
  const displaySSIM = ssim / 100;

  const getGradeConfig = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return {
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeVariant: 'default' as const,
          icon: Award,
          iconColor: 'text-green-600'
        };
      case 'good':
        return {
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'secondary' as const,
          icon: TrendingUp,
          iconColor: 'text-blue-600'
        };
      case 'fair':
        return {
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'outline' as const,
          icon: TrendingDown,
          iconColor: 'text-yellow-600'
        };
      case 'poor':
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const,
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'secondary' as const,
          icon: Star,
          iconColor: 'text-gray-600'
        };
    }
  };

  const gradeConfig = getGradeConfig(qualityGrade);
  const Icon = gradeConfig.icon;

  const getQualityInsights = () => {
    const insights: string[] = [];
    
    if (qualityGrade === 'excellent') {
      insights.push('Excellent visual quality preserved');
    } else if (qualityGrade === 'good') {
      insights.push('Good visual quality maintained');
    } else if (qualityGrade === 'fair') {
      insights.push('Some compression artifacts may be visible');
    } else {
      insights.push('Significant quality loss detected');
    }

    if (displayPSNR > 40) {
      insights.push('High noise control');
    } else if (displayPSNR < 25) {
      insights.push('Noticeable image degradation');
    }

    if (displaySSIM > 95) {
      insights.push('Excellent structural similarity');
    } else if (displaySSIM < 80) {
      insights.push('Structural changes detected');
    }

    return insights.slice(0, 2); // Show max 2 insights
  };

  const insights = getQualityInsights();

  return (
    <div className={cn(`${gradeConfig.bgColor} ${gradeConfig.borderColor} border rounded-lg p-4`, className)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`${gradeConfig.iconColor}`} size={16} />
            <h4 className="text-sm font-medium text-gray-900">Visual Quality</h4>
          </div>
          <Badge variant={gradeConfig.badgeVariant} className="text-xs">
            {qualityGrade.toUpperCase()}
          </Badge>
        </div>

        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Score</span>
            <span className={`text-sm font-bold ${gradeConfig.color}`}>{qualityScore}/100</span>
          </div>
          <Progress 
            value={qualityScore} 
            className={cn("w-full h-2", {
              "bg-green-100": qualityScore >= 85,
              "bg-blue-100": qualityScore >= 70 && qualityScore < 85,
              "bg-yellow-100": qualityScore >= 50 && qualityScore < 70,
              "bg-red-100": qualityScore < 50
            })}
          />
        </div>

        {/* Technical Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">PSNR</span>
              <span className="font-medium text-gray-900">{displayPSNR.toFixed(1)} dB</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {displayPSNR > 40 ? 'Excellent' : displayPSNR > 30 ? 'Good' : displayPSNR > 20 ? 'Fair' : 'Poor'}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">SSIM</span>
              <span className="font-medium text-gray-900">{displaySSIM.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {displaySSIM > 95 ? 'Excellent' : displaySSIM > 85 ? 'Good' : displaySSIM > 70 ? 'Fair' : 'Poor'}
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-1">
            {insights.map((insight, index) => (
              <p key={index} className={`text-xs ${gradeConfig.color}`}>
                • {insight}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}