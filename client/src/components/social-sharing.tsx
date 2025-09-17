import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Copy,
  Share2,
  Gift,
  Zap,
  Download
} from 'lucide-react';
import type { CompressionJob } from '@shared/schema';

interface SocialSharingProps {
  compressionJob: CompressionJob;
  compressedImageUrl?: string;
  isGuest?: boolean;
}

interface ShareStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  qualityScore?: number;
}

const SocialSharing: React.FC<SocialSharingProps> = ({ 
  compressionJob, 
  compressedImageUrl,
  isGuest = false 
}) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Calculate sharing stats
  const shareStats: ShareStats = {
    originalSize: compressionJob.originalSize,
    compressedSize: compressionJob.compressedSize || compressionJob.originalSize,
    compressionRatio: compressionJob.compressionRatio || 0,
    qualityScore: compressionJob.qualityScore || undefined,
  };

  const compressionPercentage = Math.round((1 - shareStats.compressedSize / shareStats.originalSize) * 100);
  const sizeSaved = shareStats.originalSize - shareStats.compressedSize;

  // Generate sharing text based on compression results
  const generateShareText = (platform: string) => {
    const baseText = `Just compressed a ${formatFileSize(shareStats.originalSize)} image down to ${formatFileSize(shareStats.compressedSize)} (${compressionPercentage}% smaller) using Micro JPEG! 🚀`;
    
    const platformTexts = {
      twitter: `${baseText} #ImageCompression #WebOptimization #MicroJPEG`,
      linkedin: `${baseText}\n\nPerfect for web optimization and faster loading times. Check it out!`,
      facebook: `${baseText}\n\nSaved ${formatFileSize(sizeSaved)} of bandwidth! Great for websites and social media.`,
      instagram: `${baseText} Perfect for social media! ✨`,
    };

    return platformTexts[platform as keyof typeof platformTexts] || baseText;
  };

  // Share mutation
  const shareToSocialMutation = useMutation({
    mutationFn: async (data: { platform: string; shareText: string }) => {
      const response = await apiRequest('POST', '/api/social/share', {
        platform: data.platform,
        compressionJobId: compressionJob.id,
        shareText: data.shareText,
        imageStats: shareStats,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const rewardPoints = data.rewardPoints || 0;
      toast({
        title: "Share Recorded! 🎉",
        description: isGuest 
          ? "Share recorded! Sign up to earn reward points and unlock discounts."
          : `You earned ${rewardPoints} reward points! ${data.discountMessage || ''}`,
        duration: 5000,
      });
      setSelectedPlatform(null);
      setIsSharing(false);
    },
    onError: (error) => {
      toast({
        title: "Error Recording Share",
        description: "We couldn't record your share right now. Please try again.",
        variant: "destructive",
      });
      setIsSharing(false);
    },
  });

  // Platform sharing handlers
  const handleShare = async (platform: string) => {
    setSelectedPlatform(platform);
    setIsSharing(true);

    const shareText = generateShareText(platform);
    const shareUrl = `${window.location.origin}?ref=${compressionJob.id}`;
    
    // Record the share attempt first
    if (!isGuest) {
      shareToSocialMutation.mutate({ platform, shareText });
    }

    // Platform-specific sharing logic
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=500'
        );
        break;
      
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=500'
        );
        break;
      
      case 'instagram':
        // Instagram doesn't support direct sharing, so we copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast({
          title: "Copied to Clipboard!",
          description: "Share text copied! Open Instagram and paste it into your story or post.",
        });
        break;
    }

    if (isGuest && platform !== 'instagram') {
      // For guests, still show encouragement to sign up
      setTimeout(() => {
        toast({
          title: "Share Recorded!",
          description: "Sign up to earn reward points and unlock exclusive discounts! 🎁",
          duration: 6000,
        });
      }, 1000);
    }
  };

  // Copy link handler  
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}?ref=${compressionJob.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Share this link with anyone to show off your compression results!",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full" data-testid="social-sharing-card">
      <CardContent className="p-6 space-y-6">
        {/* Compression Stats Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            <h3 className="text-lg font-semibold">Amazing Results! Share Your Success</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{compressionPercentage}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Size Reduced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatFileSize(sizeSaved)}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{shareStats.qualityScore || '95'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Quality Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{compressionJob.outputFormat.toUpperCase()}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Format</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rewards Preview */}
        {!isGuest && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Reward Points Available
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p>• Share on social media → 5-10 reward points</p>
              <p>• Points convert to subscription discounts</p>
              <p>• Refer friends for bonus multipliers</p>
            </div>
          </div>
        )}

        {isGuest && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Sign Up to Unlock Rewards!
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Get reward points for sharing and unlock exclusive discounts on premium plans!
            </div>
          </div>
        )}

        {/* Social Sharing Buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Share Your Results</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleShare('twitter')}
              disabled={isSharing && selectedPlatform === 'twitter'}
              variant="outline"
              className="flex items-center gap-2 h-12"
              data-testid="share-twitter"
            >
              <Twitter className="h-4 w-4 text-blue-500" />
              <div className="text-left">
                <div className="text-xs font-medium">Twitter</div>
                <div className="text-xs text-gray-500">+5 points</div>
              </div>
            </Button>

            <Button
              onClick={() => handleShare('linkedin')}
              disabled={isSharing && selectedPlatform === 'linkedin'}
              variant="outline"
              className="flex items-center gap-2 h-12"
              data-testid="share-linkedin"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <div className="text-left">
                <div className="text-xs font-medium">LinkedIn</div>
                <div className="text-xs text-gray-500">+7 points</div>
              </div>
            </Button>

            <Button
              onClick={() => handleShare('facebook')}
              disabled={isSharing && selectedPlatform === 'facebook'}
              variant="outline"
              className="flex items-center gap-2 h-12"
              data-testid="share-facebook"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <div className="text-left">
                <div className="text-xs font-medium">Facebook</div>
                <div className="text-xs text-gray-500">+6 points</div>
              </div>
            </Button>

            <Button
              onClick={() => handleShare('instagram')}
              disabled={isSharing && selectedPlatform === 'instagram'}
              variant="outline"
              className="flex items-center gap-2 h-12"
              data-testid="share-instagram"
            >
              <Instagram className="h-4 w-4 text-pink-600" />
              <div className="text-left">
                <div className="text-xs font-medium">Instagram</div>
                <div className="text-xs text-gray-500">+8 points</div>
              </div>
            </Button>
          </div>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            variant="ghost"
            className="w-full flex items-center gap-2"
            data-testid="copy-link"
          >
            <Copy className="h-4 w-4" />
            Copy Shareable Link
          </Button>
        </div>

        {/* Dropbox Save Section - Will be implemented next */}
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Save to Cloud</span>
          </div>
          
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 h-12 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20"
            disabled
            data-testid="save-dropbox"
          >
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Save to Dropbox</div>
              <div className="text-xs text-gray-500">Coming soon - one-click cloud saves</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialSharing;