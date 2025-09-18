import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Settings, Download, Zap, Shield, Sparkles, X, Check, ArrowRight, ImageIcon, ChevronDown, Crown, Menu } from 'lucide-react';
import { SiWordpress } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useSubscription } from '@/hooks/useAuth';
import { useUsageStats } from '@/hooks/use-usage-stats';
import { canOperateHourly, recordCompression, getUsageStats } from '@/lib/usageTracker';
import UniversalUsageTracker from '@/lib/UniversalUsageTracker';
import { sessionManager } from '@/lib/sessionManager';
import Header from '@/components/header';
import { SEOHead } from '@/components/SEOHead';
import logoUrl from '@assets/mascot-logo-optimized.png';
import mascotUrl from '@/assets/mascot.webp';
import avifIcon from '@/assets/format-icons/avif.jpg';
import jpegIcon from '@/assets/format-icons/jpeg.jpg';
import pngIcon from '@/assets/format-icons/png.jpg';
import webpIcon from '@/assets/format-icons/webp.jpg';
import betaUser1 from '@assets/01_1756987891168.webp';
import betaUser2 from '@assets/06_1756987891169.webp';
import betaUser3 from '@assets/07_1756987891169.webp';
import owlMascot01 from '@assets/owl-mascot-01.webp';
import owlMascot02 from '@assets/owl-mascot-02.webp';
import owlMascot03 from '@assets/owl-mascot-03.webp';
import owlMascot05 from '@assets/owl-mascot-05.webp';
import owlMascot09 from '@assets/owl-mascot-09.webp';
import owlApiGraduate from '@assets/owl-api-graduate.webp';
import owlEnterpriseGraduate from '@assets/owl-enterprise-graduate.webp';
import enterpriseBackground from '@assets/Enterprise_1757182829138.webp';
import { AdSenseAd } from '@/components/AdSenseAd';
import OurProducts from '@/components/our-products';

// ✅ PAGE IDENTIFIER - NEVER change this constant
const PAGE_IDENTIFIER = 'enterprise-99'; // Enterprise compression page

// Supported formats for file validation
const SUPPORTED_FORMATS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif',
  'image/tiff', 'image/tif', 'image/svg+xml',
  // RAW formats with specific extensions
  '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'
];

// Feedback Form Component
function FeedbackForm() {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please enter your feedback message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedback, email: email || undefined })
      });

      if (response.ok) {
        toast({
          title: "Feedback Sent!",
          description: "Thank you for your feedback. We appreciate your input!",
        });
        setFeedback("");
        setEmail("");
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="feedback-message" className="block text-sm font-medium text-blue-400 mb-2 text-left">
          Your Feedback
        </label>
        <textarea
          id="feedback-message"
          rows={5}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          placeholder="Tell us what you think could be improved, what features you'd like to see, or any issues you've encountered..."
          data-testid="textarea-feedback-message"
        />
      </div>
      
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-green-400 mb-2 text-left">
          Email (Optional)
        </label>
        <input
          type="email"
          id="contact-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          placeholder="your@email.com"
          data-testid="input-contact-email"
        />
        <p className="text-sm text-white/60 mt-2 text-left">
          Leave your email if you'd like us to follow up on your feedback
        </p>
      </div>
      
      <Button 
        type="submit"
        size="lg" 
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg transition-colors"
        data-testid="button-submit-feedback"
      >
        {isSubmitting ? "Sending..." : "Send Feedback"}
      </Button>
    </form>
  );
}

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
  timestamp?: number;
}

// Session Management Utilities - Unified Limits
// Anonymous users have strict limits to prevent abuse
const ACCEPTED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif',
  'image/tiff', 'image/tif', 'image/svg+xml',
  // RAW formats with specific extensions
  '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'
];
const OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif', 'tiff'];

// SessionManager removed - using imported sessionManager and UniversalUsageTracker

// Processing Progress Estimation
class ProcessingEstimator {
  static estimateTime(file: File, operation: 'compress' | 'convert'): number {
    const sizeMB = file.size / (1024 * 1024);
    const baseTime = operation === 'compress' ? 2000 : 3500;
    const sizeMultiplier = operation === 'compress' ? 500 : 800;
    
    return Math.max(baseTime + (sizeMB * sizeMultiplier), 1000);
  }

  static simulateProgress(
    duration: number,
    onProgress: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = duration / 100;
      
      const timer = setInterval(() => {
        progress += Math.random() * 3 + 1;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          onProgress(100);
          setTimeout(resolve, 500);
        } else {
          onProgress(Math.floor(progress));
        }
      }, interval);
    });
  }
}

// File validation utilities
// ENTERPRISE PAGE VALIDATION - Fixed 200MB limit, All formats, 5 concurrent uploads
const validateFile = (file: File): string | null => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const isRawFormat = ['.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'].some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase()) && !isRawFormat) {
    return `${file.name}: Unsupported format. Please use JPEG, PNG, WebP, AVIF, TIFF, SVG, or RAW formats (CR2, ARW, DNG, NEF, ORF, RAF, RW2).`;
  }
  
  // ENTERPRISE PAGE: Fixed 200MB limit
  const maxSize = 200 * 1024 * 1024; // 200MB for enterprise users
  if (file.size > maxSize) {
    return `${file.name}: File too large. Enterprise users can upload files up to 200MB.`;
  }
  
  return null;
};

// Helper function to group results by original filename
const groupResultsByOriginalName = (results: CompressionResult[]) => {
  const groups = new Map<string, CompressionResult[]>();
  
  results.forEach(result => {
    const key = result.originalName;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(result);
  });
  
  return Array.from(groups.entries()).map(([originalName, results]) => ({
    originalName,
    results: results.sort((a, b) => (a.outputFormat || '').localeCompare(b.outputFormat || ''))
  }));
};

// Helper function to get format-specific styling
const getFormatInfo = (format: string) => {
  const formatMap: Record<string, { icon: string; color: string; bgColor: string; textColor: string }> = {
    'avif': { 
      icon: avifIcon, 
      color: '#F59E0B', // Yellow/orange
      bgColor: '#FEF3C7', 
      textColor: '#92400E' 
    },
    'jpeg': { 
      icon: jpegIcon, 
      color: '#10B981', // Green
      bgColor: '#D1FAE5', 
      textColor: '#065F46' 
    },
    'jpg': { 
      icon: jpegIcon, 
      color: '#10B981', // Green
      bgColor: '#D1FAE5', 
      textColor: '#065F46' 
    },
    'png': { 
      icon: pngIcon, 
      color: '#3B82F6', // Blue
      bgColor: '#DBEAFE', 
      textColor: '#1E40AF' 
    },
    'webp': { 
      icon: webpIcon, 
      color: '#F97316', // Orange
      bgColor: '#FED7AA', 
      textColor: '#EA580C' 
    }
  };
  
  return formatMap[format] || {
    icon: jpegIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textColor: '#374151'
  };
};

// Main Component
// Social sharing tracking function
const trackSocialShare = async (platform: string) => {
  try {
    const response = await fetch('/api/social-share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.points) {
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        // You can add toast notification here if needed
        console.log(`+${data.points} points earned for sharing on ${platformName}!`);
      }
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.log('Social share tracking failed:', error);
  }
};

// Simplified social sharing function will be defined inside the component

// Loyalty program sharing function will be defined inside the component


// Results sharing function - shares actual compression results (moved inside component for session access)

export default function MicroJPEGLanding() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const subscriptionData = useSubscription();
  const { isPremium, subscriptionStatus } = subscriptionData;
  const { data: usageStats, refetch: refetchUsage } = useUsageStats();
  const { toast } = useToast();

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access Enterprise features.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Subscription guard - check if user has enterprise access
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const hasEnterpriseAccess = subscriptionStatus === 'active' && isPremium;
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasEnterpriseAccess) {
      setShowPaymentModal(true);
    }
  }, [isAuthenticated, isLoading, hasEnterpriseAccess]);
  
  // Debug subscription data (temporary)
  const [session, setSession] = useState<SessionData>(() => {
    const initialSession = sessionManager.getSession();
    return initialSession;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [newlyAddedFiles, setNewlyAddedFiles] = useState<FileWithPreview[]>([]);
  const [fileObjectUrls, setFileObjectUrls] = useState<Map<string, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingFileIds, setProcessingFileIds] = useState<Set<string>>(new Set());
  const [formatQueue, setFormatQueue] = useState<string[]>([]);
  const [currentlyProcessingFormat, setCurrentlyProcessingFormat] = useState<string | null>(null);
  
  // Quality and size controls
  const [qualityPercent, setQualityPercent] = useState(85);
  const [sizePercent, setSizePercent] = useState(100);
  const [activeUploads, setActiveUploads] = useState(0); // Track concurrent uploads for Premium limit (3)
  const [conversionEnabled, setConversionEnabled] = useState(true); // Always enable format selection
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['jpeg']); // Default to JPEG compression/conversion
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<'processing' | 'complete'>('processing');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lead magnet state
  const [leadMagnetEmail, setLeadMagnetEmail] = useState('');
  const [isSubmittingLeadMagnet, setIsSubmittingLeadMagnet] = useState(false);

  // Lead magnet form handler
  const handleLeadMagnetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!leadMagnetEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to get your free credits.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadMagnetEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingLeadMagnet(true);
    
    try {
      const response = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: leadMagnetEmail,
          firstName: leadMagnetEmail.split('@')[0] // Extract first name from email
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: "Check your email for your free credits and optimization guide!",
          duration: 5000,
        });
        setLeadMagnetEmail(''); // Clear the form
      } else {
        throw new Error(data.message || 'Failed to send guide');
      }
    } catch (error) {
      console.error('Lead magnet error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLeadMagnet(false);
    }
  };

  // Simplified social sharing function
  const shareApp = (platform: string) => {
    // Different text for Twitter (shorter) vs other platforms (full)
    const twitterText = "🦉 https://microjpeg.com | 🚀 Discover Micro JPEG - the ultimate image compression tool! ✨\n\n✅ 90% Size Reduction\n✅ Lossless Quality\n✅ Instant Processing\n✅ Web Optimized\n✅ JPG, PNG, AVIF, WEBP, SVG, RAW, TIFF supported\n\nCompress your images without losing quality!";
    
    const fullText = "🦉 https://microjpeg.com | 🚀 Discover Micro JPEG - the ultimate image compression tool! ✨\n\n✅ 90% Size Reduction\n✅ Lossless Quality\n✅ Instant Processing\n✅ Web Optimized\n✅ JPG, PNG, AVIF, WEBP, SVG, RAW, TIFF supported\n\nCompress your images without losing quality! Perfect for websites, social media, and storage optimization.";
    
    const appUrl = "https://microjpeg.com";
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`, '_blank', 'width=550,height=420');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullText)}`, '_blank', 'width=550,height=420');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent('Discover Micro JPEG - Ultimate Image Compression Tool')}&text=${encodeURIComponent(fullText)}`, '_blank', 'width=550,height=420');
        break;
      case 'youtube':
        // Copy to clipboard for YouTube video description
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fullText).then(() => {
            toast({
              title: "📋 Copied to clipboard!",
              description: "Perfect for YouTube video descriptions!",
            });
          }).catch(() => {
            toast({
              title: "Copy Failed",
              description: "Please manually copy this text for YouTube: " + fullText,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Copy This Text",
            description: "For YouTube: " + fullText,
          });
        }
        break;
    }
    trackSocialShare(platform);
  };

  // Loyalty program sharing function
  const shareLoyaltyContent = async (platform: string) => {
    const successStoryText = "🚀 Just discovered MicroJPEG - the ultimate image compression tool! ✨\n\n📸 Compressed my images by 80% without quality loss\n⚡ Lightning-fast processing\n🌐 Perfect for web optimization\n\n#MicroJPEGCompress #ImageOptimization #WebPerformance\n\nTry it yourself: https://microjpeg.com";
    
    const featureText = "💎 MicroJPEG Features That Impressed Me:\n\n✅ 90% Size Reduction\n✅ Lossless Quality\n✅ Multiple Formats (JPG, PNG, WEBP, AVIF, SVG, RAW, TIFF)\n✅ Instant Processing\n✅ Web Optimized Output\n\n#MicroJPEGCompress #ImageCompression #TechTools\n\nhttps://microjpeg.com";
    
    const appUrl = "https://microjpeg.com";
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(successStoryText)}`, '_blank', 'width=550,height=420');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(featureText)}`, '_blank', 'width=550,height=420');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/dialog/share?app_id=87741124305&href=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(featureText)}`, '_blank', 'width=550,height=420');
        break;
      case 'instagram':
        // Copy to clipboard for Instagram
        if (navigator.clipboard) {
          navigator.clipboard.writeText(successStoryText).then(() => {
            toast({
              title: "📋 Copied to clipboard!",
              description: "Open Instagram and paste to share. You'll earn +12 operations!",
            });
          }).catch(() => {
            toast({
              title: "Copy Failed",
              description: "Please manually copy this text for Instagram: " + successStoryText,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Copy This Text",
            description: "For Instagram: " + successStoryText,
          });
        }
        break;
      case 'pinterest':
        const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(appUrl)}&description=${encodeURIComponent(featureText)}`;
        window.open(pinterestUrl, '_blank', 'width=550,height=420');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent('Amazing Image Compression Tool - MicroJPEG')}&text=${encodeURIComponent(featureText)}`, '_blank', 'width=550,height=420');
        break;
    }
    
    // Track the loyalty share and award operations
    try {
      const response = await fetch('/api/loyalty-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.operations) {
          toast({
            title: "🎉 Bonus Operations Earned!",
            description: `You earned +${data.operations} operations for sharing on ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`,
          });
          // Refresh usage stats to show updated operations
          refetchUsage();
        }
      } else if (response.status === 429) {
        const data = await response.json();
        toast({
          title: "Daily Limit Reached",
          description: data.message || "You can only earn rewards once per day per platform. Try again tomorrow!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log('Loyalty share tracking failed:', error);
    }
  };




  // Load existing session state but preserve results for accumulation
  useEffect(() => {
    const currentSession = sessionManager.getSession();
    setSession(currentSession);
  }, []);

  // SEO Meta Tags Effect
  useEffect(() => {
    document.title = "MicroJPEG - Smart Image Compression | Free AVIF, WebP, PNG & JPEG Optimizer";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Compress AVIF, WebP, PNG & JPEG images up to 90% smaller while maintaining quality. Free online image optimizer with advanced compression algorithms. No registration required.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Compress AVIF, WebP, PNG & JPEG images up to 90% smaller while maintaining quality. Free online image optimizer with advanced compression algorithms. No registration required.';
      document.head.appendChild(meta);
    }

    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: 'MicroJPEG - Smart Image Compression Tool' },
      { property: 'og:description', content: 'Compress images up to 90% smaller while maintaining quality. Support for AVIF, WebP, PNG & JPEG formats.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'MicroJPEG - Smart Image Compression' },
      { name: 'twitter:description', content: 'Free online image compression tool. Reduce file sizes by up to 90%.' }
    ];

    ogTags.forEach(tag => {
      const existing = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
      if (existing) {
        existing.setAttribute('content', tag.content);
      } else {
        const meta = document.createElement('meta');
        if (tag.property) meta.setAttribute('property', tag.property);
        if (tag.name) meta.setAttribute('name', tag.name);
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
  }, []);

  // Start processing function - moved up to be accessible in useEffect
  const startProcessing = useCallback(async () => {
    // Process only newly added files to avoid reprocessing existing ones
    const filesToProcess = newlyAddedFiles.length > 0 ? newlyAddedFiles : selectedFiles;
    if (filesToProcess.length === 0) return;

    // Check concurrent upload limit for Premium users (3 uploads)
    if (activeUploads >= 3) {
      toast({
        title: "Concurrent Upload Limit",
        description: "You can upload up to 3 files simultaneously. Please wait for current uploads to complete.",
        variant: "destructive",
      });
      return;
    }

    // Check local hourly usage limits for premium users (100 operations/hour)
    const hourlyCheck = canOperateHourly(filesToProcess.length, 50000);
    
    if (!hourlyCheck.allowed) {
      toast({
        title: "Hourly Limit Reached",
        description: hourlyCheck.message || "You have reached your hourly limit of 100 operations.",
        variant: "destructive",
      });
      return;
    }

    // Increment active uploads counter
    setActiveUploads(prev => prev + 1);
    setIsProcessing(true);
    setShowModal(true);
    setModalState('processing');
    setProcessingProgress(0);
    setProcessingStatus('Preparing files...');
    
    // Mark files as processing
    const fileIds = new Set(filesToProcess.map(f => f.id));
    setProcessingFileIds(fileIds);

    try {
      // Prepare FormData for the real API
      const formData = new FormData();
      
      // Add files to process to FormData
      filesToProcess.forEach((file) => {
        formData.append('files', file as File);
      });

      // Prepare compression settings
      const settings = {
        quality: qualityPercent, // Use quality slider value
        outputFormat: conversionEnabled && selectedFormats.length > 0 ? selectedFormats : 'keep-original',
        resizeOption: sizePercent < 100 ? 'resize-percentage' : 'keep-original',
        resizePercentage: sizePercent, // Add size percentage for resizing
        compressionAlgorithm: 'standard',
        processingPriority: 'high', // Premium users get higher processing priority
      };

      // Add settings to FormData
      formData.append('settings', JSON.stringify(settings));
      formData.append('pageSource', 'enterprise');

      // Start dynamic progress simulation based on file sizes
      const totalFileSize = filesToProcess.reduce((sum, file) => sum + file.size, 0);
      const estimatedDuration = Math.max(2000 + (totalFileSize / (1024 * 1024)) * 500, 3000);
      
      setProcessingProgress(15);
      setProcessingStatus('Compressing images...');
      
      // Start progress simulation
      let currentProgress = 15;
      const progressInterval = setInterval(() => {
        const increment = Math.random() * 8 + 2; // 2-10% increments
        currentProgress = Math.min(currentProgress + increment, 85); // Cap at 85% until completion
        setProcessingProgress(Math.floor(currentProgress));
      }, Math.max(estimatedDuration / 20, 200)); // Update every 200ms minimum

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Clear progress interval and set to completion
      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (data.error) {
        throw new Error(data.error);
      }

      // Record usage in local sessionStorage for premium tier tracking
      if (data.results && data.results.length > 0) {
        // Each completed file operation counts as 1 operation
        const operationCount = data.results.length;
        
        // Record operations in local storage
        recordCompression(operationCount);
        
        // Record usage universally for each processed file
        data.results.forEach((result: any) => {
          const fileExtension = result.originalName.split('.').pop() || 'unknown';
          UniversalUsageTracker.recordUsage(fileExtension);
        });
        
        console.log(`Recorded ${operationCount} operations for ${data.results.length} files processed (enterprise page)`);
      }

      // Get the latest session data to ensure we don't lose any previous results
      const latestSession = sessionManager.getSession();
      
      // Simply append all new results - each backend job has a unique ID now
      const newSession: SessionData = {
        ...latestSession,
        results: [...latestSession.results, ...(data.results || [])],
        batchDownloadUrl: data.batchDownloadUrl,
        timestamp: Date.now(),
      };

      setSession(newSession);
      sessionManager.updateSession(newSession);

      // Trigger usage refetch for authenticated users
      await refetchUsage();
      setProcessingProgress(100);
      setProcessingStatus('MicroJPEG just saved you space!');
      setModalState('complete');
      setIsProcessing(false);
      setProcessingFileIds(new Set()); // Clear processing state
      setActiveUploads(prev => Math.max(0, prev - 1)); // Decrement active uploads
      
      // Don't clear selected files - keep them for thumbnails and format conversions
      // Clear newly added files to prevent reprocessing
      setNewlyAddedFiles([]);

    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression failed",
        description: error instanceof Error ? error.message : "An error occurred during compression",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProcessingFileIds(new Set()); // Clear processing state on error
      setCurrentlyProcessingFormat(null); // Clear currently processing format
      setActiveUploads(prev => Math.max(0, prev - 1)); // Decrement active uploads on error
      setShowModal(false);
      
      // Don't clear selected files - keep them for thumbnails and format conversions
      // Clear newly added files to prevent reprocessing
      setNewlyAddedFiles([]);
    }
  }, [selectedFiles, user, usageStats, selectedFormats, conversionEnabled, toast, refetchUsage]);

  // Auto-start processing when new files are added
  useEffect(() => {
    if (newlyAddedFiles.length > 0 && !isProcessing && selectedFormats.length > 0) {
      // Process only newly added files
      // Small delay to ensure state updates are complete
      const timer = setTimeout(() => {
        startProcessing();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [newlyAddedFiles.length, isProcessing, selectedFormats, startProcessing]); // Auto-process new uploads only

  // Clear session only on page unload/refresh for fresh start and cleanup object URLs
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear session data when page is about to unload (window close or refresh)
      clearResults();
      // Cleanup object URLs to prevent memory leaks
      fileObjectUrls.forEach(url => URL.revokeObjectURL(url));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup object URLs on component unmount
      fileObjectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fileObjectUrls]);

  // This useEffect will be moved after the processSpecificFormat function

  // Process files for a specific format only
  const processSpecificFormat = useCallback(async (format: string) => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setShowModal(true);
    // Only switch to processing if no existing results, otherwise stay in complete mode
    if (session.results.length === 0) {
      setModalState('processing');
    }
    setProcessingProgress(0);
    setProcessingStatus(`Converting to ${format.toUpperCase()}...`);

    try {
      // Prepare FormData for the API
      const formData = new FormData();
      
      // Get fresh session data to check existing results
      const currentSession = sessionManager.getSession();
      
      // Add only files that don't already have results for this format
      const filesToProcess = selectedFiles.filter(file => 
        !currentSession.results.some(result => 
          result.originalName === file.name && 
          result.outputFormat?.toLowerCase() === format.toLowerCase()
        )
      );
      
      // Check local hourly usage limits for premium users (100 operations/hour)
      const hourlyCheck = canOperateHourly(filesToProcess.length, 50000);
      
      if (!hourlyCheck.allowed) {
        toast({
          title: "Hourly Limit Reached",
          description: hourlyCheck.message || "You have reached your hourly limit of 100 operations.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // If no files need processing for this format, skip
      if (filesToProcess.length === 0) {
        console.log(`All files already have ${format.toUpperCase()} results, skipping processing`);
        setIsProcessing(false);
        return;
      }
      
      filesToProcess.forEach((file) => {
        formData.append('files', file as File);
      });

      // Prepare compression settings for specific format
      const settings = {
        quality: 80,
        outputFormat: [format], // Only process this specific format
        resizeOption: 'keep-original',
        compressionAlgorithm: 'standard',
      };

      formData.append('settings', JSON.stringify(settings));

      // Start dynamic progress simulation for format conversion
      const totalFileSize = filesToProcess.reduce((sum, file) => sum + file.size, 0);
      const estimatedDuration = Math.max(3000 + (totalFileSize / (1024 * 1024)) * 800, 4000);
      
      setProcessingProgress(10);
      setProcessingStatus(`Processing ${format.toUpperCase()}...`);
      
      // Start progress simulation for conversion
      let currentProgress = 10;
      const progressInterval = setInterval(() => {
        const increment = Math.random() * 12 + 3; // 3-15% increments for conversion
        currentProgress = Math.min(currentProgress + increment, 80); // Cap at 80% until completion
        setProcessingProgress(Math.floor(currentProgress));
      }, Math.max(estimatedDuration / 15, 250)); // Update every 250ms minimum

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Clear progress interval and set to completion
      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (data.error) {
        throw new Error(data.error);
      }

      // Record usage in local sessionStorage for premium tier tracking
      if (data.results && data.results.length > 0) {
        // Each completed file operation counts as 1 operation
        const operationCount = data.results.length;
        
        // Record operations in local storage
        recordCompression(operationCount);
        
        // Record usage universally for each processed file
        data.results.forEach((result: any) => {
          const fileExtension = result.originalName.split('.').pop() || 'unknown';
          UniversalUsageTracker.recordUsage(fileExtension);
        });
        
        console.log(`Recorded ${operationCount} operations for ${data.results.length} files converted to ${format} (enterprise page)`);
      }

      // Get the latest session data to ensure we don't lose any previous results
      const latestSession = sessionManager.getSession();
      
      // Simply append new results - backend creates unique job IDs
      const updatedSession = sessionManager.updateSession({
        results: [...latestSession.results, ...data.results],
        batchDownloadUrl: data.batchDownloadUrl || latestSession.batchDownloadUrl,
        compressions: latestSession.compressions + data.results.length,
        conversions: latestSession.conversions + data.results.length,
      });
      setSession(updatedSession);

      // Trigger usage refetch for authenticated users
      await refetchUsage();
      setProcessingProgress(100);
      setProcessingStatus(`${format.toUpperCase()} conversion complete!`);
      setModalState('complete');
      setIsProcessing(false);
      setProcessingFileIds(new Set()); // Clear processing state
      setCurrentlyProcessingFormat(null); // Clear currently processing format
      
      // Don't clear selected files - keep them for thumbnails and format conversions
      // Clear newly added files to prevent reprocessing
      setNewlyAddedFiles([]);

    } catch (error) {
      console.error('Format conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An error occurred during format conversion",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProcessingFileIds(new Set()); // Clear processing state on error
      setCurrentlyProcessingFormat(null); // Clear currently processing format
      
      // Don't clear selected files - keep them for thumbnails and format conversions
      // Clear newly added files to prevent reprocessing
      setNewlyAddedFiles([]);
    }
  }, [selectedFiles, user, usageStats, session, toast, refetchUsage]);

  // Download all results as comprehensive ZIP
  const downloadAllResults = useCallback(async () => {
    if (session.results.length === 0) {
      toast({
        title: "No files to download",
        description: "Please compress some images first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const resultIds = session.results.map(result => result.id);
      
      const response = await fetch('/api/create-session-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resultIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Open the download URL in a new tab
      window.open(data.batchDownloadUrl, '_blank');

      toast({
        title: "Download started",
        description: `Creating ZIP with ${data.fileCount} files...`,
      });

    } catch (error) {
      console.error('Download all error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to create download",
        variant: "destructive",
      });
    }
  }, [session.results, toast]);

  // Process format queue sequentially
  useEffect(() => {
    if (formatQueue.length > 0 && !isProcessing && !currentlyProcessingFormat) {
      const nextFormat = formatQueue[0];
      setCurrentlyProcessingFormat(nextFormat);
      setFormatQueue(prev => prev.slice(1)); // Remove from queue
      
      // Start processing the format
      setTimeout(() => {
        processSpecificFormat(nextFormat);
      }, 100);
    }
  }, [formatQueue, isProcessing, currentlyProcessingFormat, processSpecificFormat]);

  // File handling
  const handleFiles = useCallback((files: FileList | File[]) => {
    // File upload validation with Premium subscription support

    const fileArray = Array.from(files);
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    // Check batch upload limit - premium users can upload up to 3 files concurrently
    // ENTERPRISE PAGE: Fixed 5 concurrent uploads limit
    const maxBatchSize = 5;
    if (fileArray.length > maxBatchSize) {
      toast({
        title: "Batch upload limit reached",
        description: `Enterprise users can upload up to ${maxBatchSize} files at a time.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if already processing - prevent exceeding concurrent upload limit
    if (isProcessing) {
      toast({
        title: "Processing in progress",
        description: "Please wait for current files to finish processing before uploading more.",
        variant: "destructive",
      });
      return;
    }

    fileArray.forEach((file) => {
      // Use subscription data directly since it's working correctly, with user data fallback
      const isUserAuthenticated = !!user || (subscriptionData && subscriptionData.isPremium);
      const actualPremiumStatus = subscriptionData.isPremium || false;
      const actualSubscriptionStatus = subscriptionData.subscriptionStatus || 'inactive';
      
      // console.log('File validation debug:', JSON.stringify({
      //   fileName: file.name,
      //   fileSize: file.size,
      //   fileSizeMB: Math.round(file.size / (1024 * 1024)),
      //   hasUser: isUserAuthenticated,
      //   isPremium: actualPremiumStatus,
      //   subscriptionStatus: actualSubscriptionStatus,
      //   isPremiumType: typeof actualPremiumStatus,
      //   subscriptionStatusType: typeof actualSubscriptionStatus
      // }, null, 2));
      
      const error = validateFile(file);
      if (error) {
        // console.log('Validation error:', error);
        errors.push(error);
      } else {
        // Check for duplicates - prevent uploading files already in selectedFiles or results
        const isDuplicate = selectedFiles.some(
          existing => existing.name === file.name && existing.size === file.size
        ) || session.results.some(result => 
          result.originalName === file.name
        );
        
        if (!isDuplicate) {
          const fileWithPreview = Object.assign(file, {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }) as FileWithPreview;
          validFiles.push(fileWithPreview);
        }
      }
    });

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join('\n'),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      // Create and cache object URLs for the valid files to prevent repaint issues
      setFileObjectUrls(prev => {
        const newMap = new Map(prev);
        validFiles.forEach(file => {
          if (!newMap.has(file.name)) {
            newMap.set(file.name, URL.createObjectURL(file));
          }
        });
        return newMap;
      });
      
      // For sequential uploads, accumulate files and track newly added files
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setNewlyAddedFiles(validFiles);
      sessionManager.trackActivity();
      
      // Reset format selection to JPEG only on every new file upload
      setSelectedFormats(['jpeg']);
      
      toast({
        title: "Files added - Auto-compressing...",
        description: `${validFiles.length} file(s) added. Starting compression automatically.`,
      });
    }
  }, [selectedFiles, toast, user, subscriptionData]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // File input click
  const handleFileInput = () => {
    fileInputRef.current?.click();
  };

  // Remove file
  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Clear all files
  const clearFiles = () => {
    setSelectedFiles([]);
    // Reset file input to allow same file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset format selection to JPEG only
    setSelectedFormats(['jpeg']);
  };

  // Clear all results from the output modal and close it
  const clearResults = () => {
    const newSession: SessionData = {
      ...session,
      results: [],
      batchDownloadUrl: undefined,
    };
    setSession(newSession);
    sessionManager.updateSession(newSession);
    // Clear selected files to allow re-upload of same files
    setSelectedFiles([]);
    // Reset file input to allow same file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset format selection to JPEG only
    setSelectedFormats(['jpeg']);
    // Close the modal
    setShowModal(false);
    // Reset modal state
    setModalState('processing');
    setIsProcessing(false);
    setProcessingProgress(0);
    // Reset drag state
    setDragActive(false);
  };


  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if format already exists for ALL current files in output modal
  const hasFormatInResults = (format: string) => {
    // If no files selected, allow format selection
    if (selectedFiles.length === 0) {
      return false;
    }
    
    // Get fresh session data to check existing results
    const currentSession = sessionManager.getSession();
    
    // Check if ALL selected files already have results for this format
    return selectedFiles.every(file => 
      currentSession.results.some(result => 
        result.originalName === file.name && 
        result.outputFormat?.toLowerCase() === format.toLowerCase()
      )
    );
  };

  // Toggle format selection and trigger automatic compression
  const toggleFormat = async (format: string) => {
    // If format already exists in output modal, do nothing
    if (hasFormatInResults(format)) {
      return;
    }

    // Only process if we have files to compress
    if (selectedFiles.length === 0) {
      return;
    }

    // Update selected formats
    setSelectedFormats(prev => {
      if (prev.includes(format)) {
        // Never allow removing JPEG - it must always stay selected
        if (format === 'jpeg') {
          return prev; // Keep JPEG selected
        }
        return prev.filter(f => f !== format);
      } else {
        const newFormats = [...prev, format];
        
        // Add to queue for sequential processing
        setFormatQueue(prev => {
          if (!prev.includes(format)) {
            return [...prev, format];
          }
          return prev;
        });
        
        return newFormats;
      }
    });
  };


  // File type to available formats mapping (based on conversion table)
  // RAW formats only offer conversion to standard formats, not to themselves
  const fileTypeFormatMap: Record<string, string[]> = {
    'jpg': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'jpeg': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'png': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'webp': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'avif': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'dng': ['jpeg', 'png', 'webp', 'avif', 'tiff'], // RAW formats convert to standard formats only
    'cr2': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'arw': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'nef': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'orf': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'raf': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'rw2': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'tiff': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'tif': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'bmp': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'gif': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'svg': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'heic': ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    'heif': ['jpeg', 'png', 'webp', 'avif', 'tiff']
  };

  // Get available formats based on uploaded file types
  const getAvailableFormats = () => {
    if (selectedFiles.length === 0) return OUTPUT_FORMATS;
    
    // Get unique file extensions from selected files
    const fileExtensions = selectedFiles.map(file => {
      const extension = file.name.toLowerCase().split('.').pop() || '';
      return extension;
    });
    
    // Find common formats available for all selected file types
    let availableFormats = OUTPUT_FORMATS;
    
    if (fileExtensions.length > 0) {
      // Start with formats available for the first file type
      const firstExtension = fileExtensions[0];
      availableFormats = fileTypeFormatMap[firstExtension] || OUTPUT_FORMATS;
      
      // Find intersection with other file types
      for (const extension of fileExtensions.slice(1)) {
        const formatOptions = fileTypeFormatMap[extension] || OUTPUT_FORMATS;
        availableFormats = availableFormats.filter(format => formatOptions.includes(format));
      }
    }
    
    return availableFormats;
  };

  // Check if PNG is disabled for current selection
  const isPngDisabled = () => {
    // PNG conversion is now enabled for all users including free users
    return false;
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), url(${enterpriseBackground})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      <SEOHead
        title="Enterprise Image Compression - Micro JPEG"
        description="Enterprise-grade image compression for businesses. Unlimited processing, dedicated support, advanced APIs, and custom solutions. Perfect for high-volume operations and enterprise workflows."
        canonicalUrl="https://microjpeg.com/compress/enterprise"
        keywords="enterprise image compression, business image optimizer, API integration, high volume processing, dedicated support"
      />
      {/* Mobile spacing for fixed header */}
      <div className="h-16 lg:hidden"></div>
      
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-gold/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="MicroJPEG Logo" className="w-10 h-10 sm:w-14 sm:h-14" />
              
              {/* Mobile: Vertical layout with PICTURE PERFECT below */}
              <div className="block sm:hidden">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-poppins text-brand-dark">MicroJPEG</span>
                    <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1">
                      ENTERPRISE
                    </Badge>
                  </div>
                  <span className="text-xs font-opensans text-brand-dark/70 tracking-widest">PICTURE PERFECT</span>
                </div>
              </div>
              
              {/* Desktop: Vertical stack */}
              <div className="hidden sm:block">
                <div className="flex flex-col items-center relative">
                  <span className="text-2xl font-bold font-poppins text-brand-dark">MicroJPEG</span>
                  <span className="text-xs font-opensans text-brand-dark/70 tracking-widest">PICTURE PERFECT</span>
                  {/* Premium Elements - positioned absolute to not affect layout */}
                  <div className="absolute -right-28 top-0 flex items-center gap-1">
                    <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1">
                      ENTERPRISE
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="/web/overview" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium">
                Web
              </a>
              <a href="/api-docs" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium">
                API
              </a>
              <a href="/wordpress-plugin" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium flex items-center gap-1">
                <SiWordpress className="w-4 h-4" />
                Plugin
              </a>
              <a href="/web/pricing" className="text-brand-dark/80 hover:text-brand-dark font-opensans font-medium">
                Pricing
              </a>
              
            </nav>

            {/* Auth Buttons - Desktop Only */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-brand-dark">
                    Hello, User!
                  </span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
                    Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/logout'}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 border border-gray-300 rounded-md"
                style={{ 
                  display: 'flex !important', 
                  alignItems: 'center !important', 
                  justifyContent: 'center !important',
                  padding: '8px !important',
                  border: '1px solid #d1d5db !important',
                  borderRadius: '6px !important',
                  backgroundColor: 'transparent !important',
                  cursor: 'pointer !important',
                  width: '40px !important',
                  height: '40px !important'
                }}
              >
                <Menu className="w-5 h-5 text-brand-dark" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden fixed inset-0 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              <div 
                className="absolute top-16 right-4 w-60 bg-white rounded-lg shadow-2xl border"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  position: 'absolute',
                  top: '4rem',
                  right: '1rem',
                  width: '15rem',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #e5e7eb',
                  zIndex: 1000
                }}
              >
                {/* Close Button */}
                <div className="flex justify-end p-2">
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="px-4 pb-4 space-y-3">
                  {/* Navigation Links */}
                  <div>
                    <a 
                      href="/web/overview" 
                      className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Web
                    </a>
                    <a 
                      href="/api-docs" 
                      className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      API
                    </a>
                    <a 
                      href="/wordpress-plugin" 
                      className="flex items-center gap-2 py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <SiWordpress className="w-4 h-4" />
                      Plugin
                    </a>
                    <a 
                      href="/web/pricing" 
                      className="block py-2 text-brand-dark font-medium hover:bg-gray-50 rounded px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </a>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Auth Section */}
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-sm text-gray-600">
                        Hello, User!
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/dashboard';
                        }}
                      >
                        Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/api/logout';
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/login';
                        }}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Hero Text */}
            <div className="space-y-4">
              
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-5xl font-bold font-poppins text-brand-dark leading-tight">
                  Enterprise Scale.<br />
                  <span style={{color: '#AD0000'}}>Unlimited Potential.</span><br />
                  <span className="text-brand-dark">200MB Files • 5 Concurrent • 50K Operations</span>
                </h1>
                
                <p className="text-lg text-brand-dark/80 font-opensans max-w-md">
                  Your Enterprise plan delivers 50,000 operations/month, 200MB files, 5 concurrent uploads, and priority processing. 
                  <span style={{color: '#AD0000'}} className="font-semibold">Maximize efficiency with our API for bulk processing at no extra cost.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = '/api-docs'}
                    style={{backgroundColor: '#AD0000'}} 
                    className="hover:opacity-90 text-white font-semibold px-8 py-3 rounded-lg"
                  >
                    Explore Enterprise API
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = '/api-docs#how-it-works'}
                    className="bg-brand-gold hover:bg-yellow-500 text-white hover:text-white font-semibold px-8 py-3 rounded-lg"
                  >
                    Start Processing
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side - Upload Interface */}
            <div className="relative">
              <Card className="p-8 bg-white/95 backdrop-blur border-2 border-brand-gold/20 shadow-2xl">
                {/* Drag & Drop Zone */}
                <div
                  className={`relative border-3 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    isProcessing 
                      ? 'cursor-not-allowed opacity-50 bg-gray-50' 
                      : dragActive 
                      ? 'border-brand-gold bg-brand-gold/5 scale-105 cursor-pointer' 
                      : 'border-gray-300 hover:border-brand-gold hover:bg-brand-cream/50 cursor-pointer'
                  }`}
                  onDragEnter={isProcessing ? undefined : handleDrag}
                  onDragLeave={isProcessing ? undefined : handleDrag}
                  onDragOver={isProcessing ? undefined : handleDrag}
                  onDrop={isProcessing ? undefined : handleDrop}
                  onClick={isProcessing ? undefined : handleFileInput}
                  title={isProcessing ? 'Please wait - compression in progress...' : ''}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-brand-gold/10 rounded-xl mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6 text-brand-gold" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-brand-gold rounded-full"></span>
                        <span className="text-xs text-brand-gold font-semibold">50,000 operations/month | Max 200MB per image</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Formats: JPG, PNG, WEBP, AVIF, SVG, TIFF, RAW (DNG, CR2, ARW, NEF, ORF, RAF, RA2)
                      </p>
                    </div>

                    {/* Format Selection */}
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2 border-t border-gray-200 pt-2">
                        <p className="text-xs font-medium text-brand-dark text-center">Select output format:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {getAvailableFormats().map((format) => {
                            const isVisuallyDisabled = format === 'png' && isPngDisabled();
                            const isSelected = selectedFormats.includes(format);
                            
                            return (
                              <Button
                                key={format}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                disabled={isVisuallyDisabled || isProcessing}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isVisuallyDisabled && !isProcessing) {
                                    toggleFormat(format);
                                  }
                                }}
                                className={`${
                                  isSelected ? "bg-brand-gold" : "hover:bg-brand-gold hover:text-white hover:border-brand-gold"
                                } ${
                                  isVisuallyDisabled ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" : ""
                                } ${
                                  isProcessing ? "cursor-not-allowed" : ""
                                }`}
                                title={
                                  isVisuallyDisabled 
                                    ? "This format is not available for the current selection" 
                                    : isProcessing 
                                    ? "Please wait for current processing to complete"
                                    : ""
                                }
                              >
                                {format.toUpperCase()}
                              </Button>
                            );
                          })}
                        </div>
                        
                        {/* Quality and Size Controls */}
                        <div className="grid grid-cols-2 gap-3 mt-3 px-2">
                          {/* Quality Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">Quality</label>
                              <span className="text-xs text-gray-500">{qualityPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={qualityPercent}
                              onChange={(e) => setQualityPercent(Number(e.target.value))}
                              disabled={isProcessing}
                              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              style={{
                                background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${qualityPercent}%, #e5e5e5 ${qualityPercent}%, #e5e5e5 100%)`
                              }}
                            />
                          </div>
                          
                          {/* Size Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">Size</label>
                              <span className="text-xs text-gray-500">{sizePercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="25"
                              max="100"
                              value={sizePercent}
                              onChange={(e) => setSizePercent(Number(e.target.value))}
                              disabled={isProcessing}
                              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              style={{
                                background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${sizePercent}%, #e5e5e5 ${sizePercent}%, #e5e5e5 100%)`
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* PNG conversion is now enabled for all file types */}
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.cr2,.arw,.dng,.nef,.orf,.raf,.rw2"
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

              </Card>

              {/* Mascot */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 animate-float">
                <img src={mascotUrl} alt="MicroJPEG Mascot" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Processing Modal - Embedded in page flow */}
      {showModal && (
        <div className="w-full max-w-6xl mx-auto mt-4 mb-8">
          <Card className="w-full bg-white shadow-2xl rounded-2xl border border-gray-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between bg-gray-900 p-4 rounded-t-2xl -m-6 mb-0">
                <div className="flex items-center gap-3">
                  <img 
                    src={owlMascot09} 
                    alt="Processing Owl" 
                    className={`w-8 h-8 ${isProcessing ? 'animate-bounce' : ''}`}
                  />
                  <div className="text-lg font-semibold text-white">
                    {isProcessing ? processingStatus : 'Your optimized images are ready!'}
                  </div>
                  {isProcessing && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {processingProgress}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Social Sharing Buttons - Only show when compression is complete */}
                  {modalState === 'complete' && session.results.length > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white">Follow Us:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => shareApp('twitter')}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-300 bg-white hover:bg-blue-50 transition-colors"
                          title="Follow us on X"
                          data-testid="follow-x"
                        >
                          <svg width="14" height="14" fill="#000000" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => shareApp('linkedin')}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-300 bg-white hover:bg-blue-50 transition-colors"
                          title="Follow us on LinkedIn"
                          data-testid="follow-linkedin"
                        >
                          <svg width="14" height="14" fill="#0077B5" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Download and Cloud Save Buttons - Always show when results exist */}
                  {session.results.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Button 
                        className="bg-brand-gold hover:bg-brand-gold-dark text-white"
                        onClick={downloadAllResults}
                        data-testid="button-download-all"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Display */}
              {selectedFiles.length > 0 && session.results.length > 0 && (
                <div className="mt-6">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {groupResultsByOriginalName(session.results).map((group) => (
                      <div key={group.originalName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {(() => {
                                  const originalFile = selectedFiles.find(f => f.name === group.originalName);
                                  
                                  // Try to show actual file preview for all file types using cached object URL
                                  if (originalFile) {
                                    const cachedUrl = fileObjectUrls.get(originalFile.name);
                                    return (
                                      <img 
                                        src={cachedUrl || URL.createObjectURL(originalFile)} 
                                        alt={group.originalName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // If client-side preview fails, show compressed image as thumbnail
                                          const result = group.results[0];
                                          if (result && result.downloadUrl) {
                                            const target = e.currentTarget;
                                            target.src = result.downloadUrl;
                                            target.onerror = () => {
                                              // Final fallback to icon only if compressed image also fails
                                              const parent = target.parentElement!;
                                              parent.innerHTML = `
                                                <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                  </svg>
                                                </div>
                                              `;
                                            };
                                          } else {
                                            // No download URL available, fallback to icon
                                            const parent = e.currentTarget.parentElement!;
                                            parent.innerHTML = `
                                              <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                              </div>
                                            `;
                                          }
                                        }}
                                      />
                                    );
                                  }
                                  
                                  // If no original file, show placeholder
                                  return (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-brand-dark">
                                  {group.originalName.length > 8 ? `${group.originalName.substring(0, 8)}...` : group.originalName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {formatFileSize(group.results[0].originalSize)} • {group.results.length} format{group.results.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-wrap flex-1 justify-end">
                              {group.results.map((result) => {
                                const formatInfo = getFormatInfo((result.outputFormat || 'unknown').toLowerCase());
                                return (
                                  <div key={result.id} className="flex items-center gap-2">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-700">
                                        {result.compressedSize > result.originalSize ? '+' : '-'}{Math.abs(result.compressionRatio)}%
                                      </div>
                                      <div className="text-sm text-gray-500">{formatFileSize(result.compressedSize)}</div>
                                    </div>
                                    
                                    <div 
                                      className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      style={{ backgroundColor: formatInfo.color }}
                                      onClick={() => window.open(result.downloadUrl, '_blank')}
                                    >
                                      <img 
                                        src={formatInfo.icon} 
                                        alt={result.outputFormat} 
                                        className="w-4 h-4 object-contain"
                                      />
                                      <span className="text-white text-xs font-bold">
                                        {(result.outputFormat || 'unknown').toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Pro Usage Intelligence Section */}
      <section className="py-12 bg-gradient-to-br from-brand-teal/5 to-brand-gold/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">Your Enterprise Plan Usage</h2>
            <p className="text-gray-600">Track your operations and maximize your Enterprise benefits</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Current Usage */}
            <Card className="p-6 text-center bg-white shadow-lg">
              <div className="text-3xl font-bold text-brand-gold mb-2">
                {usageStats?.regular?.monthly?.used?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 mb-3">Operations Used This Month</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((usageStats?.regular?.monthly?.used || 0) / 50000) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {(50000 - (usageStats?.regular?.monthly?.used || 0)).toLocaleString()} operations remaining
              </div>
            </Card>

            {/* Pro Benefits */}
            <Card className="p-6 text-center bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 shadow-lg">
              <Crown className="w-8 h-8 text-brand-gold mx-auto mb-3" />
              <div className="text-lg font-semibold text-brand-dark mb-2">Enterprise Benefits Active</div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>✓ 200MB file limit</div>
                <div>✓ Priority processing</div>
                <div>✓ Full API access</div>
                <div>✓ 24/7 support</div>
              </div>
            </Card>

            {/* Enterprise Support */}
            <Card className="p-6 text-center bg-white shadow-lg border-2" style={{borderColor: '#AD0000'}}>
              <Zap className="w-8 h-8 mx-auto mb-3" style={{color: '#AD0000'}} />
              <div className="text-lg font-semibold text-brand-dark mb-2">Enterprise Support</div>
              <div className="text-sm text-gray-600 mb-4">
                24/7 Priority Support<br />
                Custom integrations • API access
              </div>
              <Button 
                size="sm" 
                style={{backgroundColor: '#AD0000'}} 
                className="hover:opacity-90 text-white"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* API Adoption Section */}
      <section id="api-section" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center gap-2 bg-brand-teal/10 px-4 py-2 rounded-full mb-4">
              <Shield className="w-5 h-5" style={{color: '#AD0000'}} />
              <span className="text-sm font-semibold" style={{color: '#AD0000'}}>INCLUDED IN YOUR ENTERPRISE PLAN</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-dark mb-4">
              Automate Your Workflow with <span className="text-brand-gold">Enterprise API Access</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your Enterprise plan includes full API access. Stop manually uploading files and start automating your image compression workflow.
            </p>
            
            {/* Owl positioned separately without affecting text layout */}
            <div className="absolute right-8 top-0 bottom-0 flex items-center">
              <img 
                src={owlApiGraduate} 
                alt="API Developer Owl" 
                className="w-32 h-40 hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* API Benefits */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6" style={{color: '#AD0000'}} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">WordPress Plugin Ready</h3>
                  <p className="text-gray-600">Automatically compress images as you upload them to your WordPress site.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">Batch Processing</h3>
                  <p className="text-gray-600">Process hundreds of images with a single API call. Perfect for e-commerce and content sites.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" style={{color: '#AD0000'}} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">Priority Processing</h3>
                  <p className="text-gray-600">Your API requests get processed first with dedicated server resources.</p>
                </div>
              </div>
            </div>

            {/* API Code Example */}
            <div className="bg-gray-900 rounded-xl p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-2">Your Pro API in action</span>
                </div>
              <pre className="text-green-400 text-sm leading-relaxed">
{`curl -X POST \\
  https://api.microjpeg.com/compress \\
  -H "Authorization: Bearer YOUR_PRO_KEY" \\
  -F "file=@your-image.jpg" \\
  -F "quality=85" \\
  -F "format=webp"`}
              </pre>
              <div className="flex gap-4 mt-6">
                <Button 
                  size="sm" 
                  className="bg-brand-teal hover:bg-brand-teal/90"
                  onClick={() => window.location.href = '/api-docs'}
                >
                  Get API Key
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => window.location.href = '/api-docs#documentation'}
                >
                  View Docs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>






      {/* API Integration Options Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-poppins text-brand-dark mb-4">
              Use Our Compression Service <span className="text-brand-gold">Your Way</span>
            </h2>
            <p className="text-lg text-gray-600 font-opensans max-w-2xl mx-auto">
              Whether you're a developer, business owner, or content creator - we have the perfect solution for your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Developer API */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Developer API</h3>
              <p className="text-gray-600 text-sm mb-4">Direct API access with authentication for custom applications</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/api-docs'}
              >
                View API Docs
              </Button>
            </Card>

            {/* WordPress Plugin */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <SiWordpress className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">WordPress Plugin</h3>
              <p className="text-gray-600 text-sm mb-4">Automatic compression for your WordPress website</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/wordpress-plugin'}
              >
                Download Plugin
              </Button>
            </Card>

            {/* Browser Extension */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9V3"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Browser Extension</h3>
              <p className="text-gray-600 text-sm mb-4">Right-click any image to compress instantly</p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = '#'}
                  disabled
                >
                  Coming Soon
                </Button>
                <p className="text-xs text-gray-500">Chrome & Firefox</p>
              </div>
            </Card>

            {/* Desktop App */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Desktop App</h3>
              <p className="text-gray-600 text-sm mb-4">Drag & drop application for bulk processing</p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = '#'}
                  disabled
                >
                  Coming Soon
                </Button>
                <p className="text-xs text-gray-500">Windows, Mac, Linux</p>
              </div>
            </Card>
          </div>

          {/* API Benefits */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-brand-dark mb-6">Why Choose Our API?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h4 className="font-semibold text-brand-dark mb-2">Lightning Fast</h4>
                  <p className="text-sm text-gray-600">Process images in seconds with our optimized servers</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h4 className="font-semibold text-brand-dark mb-2">Secure & Reliable</h4>
                  <p className="text-sm text-gray-600">Your images are processed securely and never stored</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h4 className="font-semibold text-brand-dark mb-2">Highly Customizable</h4>
                  <p className="text-sm text-gray-600">Fine-tune compression settings for your specific needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Exit Intent Pop-up Trigger Section */}
      <div id="exit-intent-trigger" className="hidden"></div>

      {/* Feedback Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Help Us Improve <span className="text-brand-gold">MicroJPEG</span>
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Your feedback drives our <span className="text-blue-400">innovation</span>. Share your suggestions, feature requests, 
                or ideas to make our platform even better for <span style={{color: '#AD0000'}}>enterprise users</span> like you.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 max-w-2xl mx-auto">
              <FeedbackForm />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span>Quick Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-gold" />
                <span>Actionable Insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="MicroJPEG Logo" className="w-10 h-10" />
                <span className="text-xl font-bold font-poppins">MicroJPEG</span>
              </div>
              <p className="text-gray-600 font-opensans">
                The smartest way to compress and optimize your images for the web.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="#" className="hover:text-black">Features</a></li>
                <li><a href="#" className="hover:text-black">Pricing</a></li>
                <li><a href="#" className="hover:text-black">API</a></li>
                <li><a href="#" className="hover:text-black">Documentation</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="#" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Blog</a></li>
                <li><a href="#" className="hover:text-black">Contact</a></li>
                <li><a href="#" className="hover:text-black">Support</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold font-poppins mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 font-opensans">
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-black">GDPR</a></li>
              </ul>
            </div>
          </div>


          <div className="border-t border-gray-300 pt-8 text-center text-gray-500 font-opensans">
            <p>© 2025 MicroJPEG. All rights reserved. Making the web faster, one image at a time.</p>
            <p className="text-xs mt-2 opacity-75">
              Background photo by <a href="https://www.pexels.com/photo/red-purple-and-yellow-tulip-fields-69776/" target="_blank" rel="noopener noreferrer" className="hover:underline">Pixabay</a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}