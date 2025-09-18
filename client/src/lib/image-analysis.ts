// AI-Powered Image Analysis Engine for Premium Users

export interface ImageCharacteristics {
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  fileInfo: {
    size: number;
    type: string;
    name: string;
  };
  classification: {
    orientation: 'portrait' | 'landscape' | 'square';
    category: 'photo' | 'screenshot' | 'graphic' | 'document' | 'artwork';
    complexity: 'low' | 'medium' | 'high';
  };
  currentCompression: {
    bytesPerPixel: number;
    compressionRatio: number;
  };
}

export interface CompressionRecommendation {
  quality: number;
  format: 'jpeg' | 'webp' | 'avif';
  useCase: string;
  expectedSize: string;
  expectedReduction: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SmartRecommendations {
  primary: CompressionRecommendation;
  alternatives: CompressionRecommendation[];
  insights: string[];
}

/**
 * Analyzes uploaded image to extract characteristics for AI recommendations
 */
export async function analyzeImage(file: File): Promise<ImageCharacteristics> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;
      
      // Calculate bytes per pixel for compression analysis
      const totalPixels = width * height;
      const bytesPerPixel = file.size / totalPixels;
      
      // Determine orientation
      let orientation: 'portrait' | 'landscape' | 'square';
      if (aspectRatio > 1.1) orientation = 'landscape';
      else if (aspectRatio < 0.9) orientation = 'portrait';
      else orientation = 'square';
      
      // Classify image category based on characteristics
      const category = classifyImageCategory(file, width, height, bytesPerPixel);
      
      // Determine complexity based on file size vs pixels
      const complexity = determineComplexity(bytesPerPixel, file.size);
      
      const characteristics: ImageCharacteristics = {
        dimensions: { width, height, aspectRatio },
        fileInfo: { 
          size: file.size, 
          type: file.type,
          name: file.name 
        },
        classification: { orientation, category, complexity },
        currentCompression: {
          bytesPerPixel,
          compressionRatio: estimateCurrentCompression(bytesPerPixel)
        }
      };
      
      URL.revokeObjectURL(url);
      resolve(characteristics);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to analyze image'));
    };
    
    img.src = url;
  });
}

/**
 * Generates AI-powered compression recommendations based on image analysis
 */
export function generateSmartRecommendations(
  characteristics: ImageCharacteristics,
  userPreferences?: { useCase?: string; prioritizeSize?: boolean }
): SmartRecommendations {
  const recommendations: CompressionRecommendation[] = [];
  
  // Web optimization recommendation
  recommendations.push(generateWebRecommendation(characteristics));
  
  // Social media recommendation
  recommendations.push(generateSocialMediaRecommendation(characteristics));
  
  // Email-friendly recommendation
  recommendations.push(generateEmailRecommendation(characteristics));
  
  // High-quality preservation recommendation
  recommendations.push(generateHighQualityRecommendation(characteristics));
  
  // Sort recommendations by relevance and user preferences
  const sortedRecommendations = sortRecommendationsByRelevance(
    recommendations, 
    characteristics, 
    userPreferences
  );
  
  return {
    primary: sortedRecommendations[0],
    alternatives: sortedRecommendations.slice(1),
    insights: generateInsights(characteristics)
  };
}

function classifyImageCategory(
  file: File, 
  width: number, 
  height: number, 
  bytesPerPixel: number
): 'photo' | 'screenshot' | 'graphic' | 'document' | 'artwork' {
  const { name } = file;
  
  // Check for screenshot indicators
  if (name.toLowerCase().includes('screenshot') || 
      name.toLowerCase().includes('screen') ||
      (width > 1000 && height > 600 && bytesPerPixel < 1.5)) {
    return 'screenshot';
  }
  
  // Check for document/text indicators
  if (bytesPerPixel < 0.8 && (width > height * 1.2)) {
    return 'document';
  }
  
  // Check for graphic/logo indicators
  if (bytesPerPixel < 1.0 && file.size < 500000) {
    return 'graphic';
  }
  
  // High bytes per pixel usually indicates photographs
  if (bytesPerPixel > 2.0) {
    return 'photo';
  }
  
  return 'artwork';
}

function determineComplexity(bytesPerPixel: number, fileSize: number): 'low' | 'medium' | 'high' {
  if (bytesPerPixel < 1.0 || fileSize < 200000) return 'low';
  if (bytesPerPixel < 2.5 || fileSize < 2000000) return 'medium';
  return 'high';
}

function estimateCurrentCompression(bytesPerPixel: number): number {
  // Estimate how compressed the image already is
  // Uncompressed RGB would be ~3 bytes per pixel
  return Math.max(0, Math.min(100, (1 - bytesPerPixel / 3) * 100));
}

function generateWebRecommendation(characteristics: ImageCharacteristics): CompressionRecommendation {
  const { classification, fileInfo, dimensions } = characteristics;
  
  let quality = 75;
  let format: 'jpeg' | 'webp' | 'avif' = 'webp';
  
  // Adjust quality based on image type
  if (classification.category === 'photo') {
    quality = classification.complexity === 'high' ? 80 : 75;
  } else if (classification.category === 'screenshot') {
    quality = 65;
    format = 'webp';
  } else if (classification.category === 'graphic') {
    quality = 85;
    format = 'webp';
  }
  
  const estimatedSize = Math.round(fileInfo.size * (quality / 100) * 0.6);
  const reduction = Math.round((1 - estimatedSize / fileInfo.size) * 100);
  
  return {
    quality,
    format,
    useCase: 'Web Optimization',
    expectedSize: formatFileSize(estimatedSize),
    expectedReduction: `${reduction}%`,
    reasoning: `Optimized for fast web loading with ${format.toUpperCase()} format`,
    priority: 'high'
  };
}

function generateSocialMediaRecommendation(characteristics: ImageCharacteristics): CompressionRecommendation {
  const { classification, fileInfo, dimensions } = characteristics;
  
  let quality = 80;
  const format: 'jpeg' | 'webp' | 'avif' = 'jpeg'; // Most social platforms prefer JPEG
  
  // Social media specific optimizations
  if (classification.orientation === 'square' && dimensions.width >= 1080) {
    quality = 85; // Instagram square posts
  } else if (classification.orientation === 'portrait' && dimensions.height >= 1350) {
    quality = 80; // Instagram stories/reels
  } else if (classification.orientation === 'landscape') {
    quality = 78; // Facebook/Twitter posts
  }
  
  const estimatedSize = Math.round(fileInfo.size * (quality / 100) * 0.7);
  const reduction = Math.round((1 - estimatedSize / fileInfo.size) * 100);
  
  return {
    quality,
    format,
    useCase: 'Social Media',
    expectedSize: formatFileSize(estimatedSize),
    expectedReduction: `${reduction}%`,
    reasoning: `Perfect for ${classification.orientation} social media posts`,
    priority: classification.category === 'photo' ? 'high' : 'medium'
  };
}

function generateEmailRecommendation(characteristics: ImageCharacteristics): CompressionRecommendation {
  const { fileInfo } = characteristics;
  
  // Aggressive compression for email attachments
  const quality = 60;
  const format: 'jpeg' | 'webp' | 'avif' = 'jpeg';
  
  const estimatedSize = Math.round(fileInfo.size * 0.3); // Aggressive reduction
  const reduction = Math.round((1 - estimatedSize / fileInfo.size) * 100);
  
  return {
    quality,
    format,
    useCase: 'Email Attachment',
    expectedSize: formatFileSize(estimatedSize),
    expectedReduction: `${reduction}%`,
    reasoning: 'Heavily compressed for email size limits',
    priority: fileInfo.size > 5000000 ? 'high' : 'low'
  };
}

function generateHighQualityRecommendation(characteristics: ImageCharacteristics): CompressionRecommendation {
  const { classification, fileInfo } = characteristics;
  
  let quality = 90;
  const format: 'jpeg' | 'webp' | 'avif' = 'jpeg';
  
  if (classification.category === 'photo' && classification.complexity === 'high') {
    quality = 95;
  }
  
  const estimatedSize = Math.round(fileInfo.size * 0.85);
  const reduction = Math.round((1 - estimatedSize / fileInfo.size) * 100);
  
  return {
    quality,
    format,
    useCase: 'High Quality',
    expectedSize: formatFileSize(estimatedSize),
    expectedReduction: `${reduction}%`,
    reasoning: 'Preserves maximum quality for printing or archival',
    priority: 'medium'
  };
}

function sortRecommendationsByRelevance(
  recommendations: CompressionRecommendation[],
  characteristics: ImageCharacteristics,
  userPreferences?: { useCase?: string; prioritizeSize?: boolean }
): CompressionRecommendation[] {
  return recommendations.sort((a, b) => {
    // Prioritize based on user preferences
    if (userPreferences?.prioritizeSize) {
      const aReduction = parseInt(a.expectedReduction);
      const bReduction = parseInt(b.expectedReduction);
      return bReduction - aReduction;
    }
    
    // Default sorting by priority and relevance
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateInsights(characteristics: ImageCharacteristics): string[] {
  const insights: string[] = [];
  const { classification, fileInfo, dimensions, currentCompression } = characteristics;
  
  // File size insights
  if (fileInfo.size > 5000000) {
    insights.push('Large file size detected - significant compression possible');
  }
  
  // Resolution insights
  if (dimensions.width > 4000 || dimensions.height > 4000) {
    insights.push('High resolution image - consider resizing for web use');
  }
  
  // Compression insights
  if (currentCompression.compressionRatio < 50) {
    insights.push('Image appears minimally compressed - good compression potential');
  }
  
  // Category-specific insights
  if (classification.category === 'screenshot') {
    insights.push('Screenshots compress well with aggressive settings');
  } else if (classification.category === 'photo') {
    insights.push('Photo content requires balanced quality settings');
  }
  
  return insights;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}