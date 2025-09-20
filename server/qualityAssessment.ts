import sharp from 'sharp';
import { promises as fs } from 'fs';

export interface QualityMetrics {
  psnr: number;
  ssim: number;
  qualityScore: number;
  qualityGrade: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Calculate PSNR (Peak Signal-to-Noise Ratio) between two images
 * Higher PSNR indicates better quality (less noise/distortion)
 */
export async function calculatePSNR(originalPath: string, compressedPath: string): Promise<number> {
  try {
    // Load both images and normalize them to same dimensions/format for comparison
    const [originalBuffer, compressedBuffer] = await Promise.all([
      sharp(originalPath)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
      sharp(compressedPath)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    ]);

    const original = originalBuffer.data;
    const compressed = compressedBuffer.data;
    
    // Ensure both images have the same dimensions
    if (original.length !== compressed.length) {
      throw new Error('Image dimensions do not match for PSNR calculation');
    }

    // Calculate Mean Squared Error (MSE)
    let mse = 0;
    for (let i = 0; i < original.length; i++) {
      const diff = original[i] - compressed[i];
      mse += diff * diff;
    }
    mse /= original.length;

    // Handle perfect match (infinite PSNR)
    if (mse === 0) {
      return 100; // Cap at 100 for perfect quality
    }

    // Calculate PSNR
    const maxPixelValue = 255;
    const psnr = 20 * Math.log10(maxPixelValue / Math.sqrt(mse));
    
    // Cap PSNR at reasonable bounds
    return Math.min(Math.max(psnr, 0), 100);
  } catch (error) {
    console.error('Error calculating PSNR:', error);
    return 0;
  }
}

/**
 * Calculate SSIM (Structural Similarity Index) between two images
 * SSIM ranges from 0 to 1, where 1 indicates perfect similarity
 */
export async function calculateSSIM(originalPath: string, compressedPath: string): Promise<number> {
  try {
    // For SSIM calculation, we'll use a simplified approach
    // In a production environment, you might want to use a dedicated SSIM library
    
    // Load images as grayscale for SSIM calculation
    const [originalBuffer, compressedBuffer] = await Promise.all([
      sharp(originalPath)
        .greyscale()
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
      sharp(compressedPath)
        .greyscale()
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    ]);

    const { data: original, info: originalInfo } = originalBuffer;
    const { data: compressed, info: compressedInfo } = compressedBuffer;

    // Ensure same dimensions
    if (original.length !== compressed.length) {
      throw new Error('Image dimensions do not match for SSIM calculation');
    }

    // Simplified SSIM calculation
    const windowSize = Math.min(8, Math.floor(Math.sqrt(original.length / 100)));
    const width = originalInfo.width;
    const height = originalInfo.height;
    
    let ssimSum = 0;
    let windowCount = 0;

    // Sample windows across the image
    for (let y = 0; y < height - windowSize; y += windowSize) {
      for (let x = 0; x < width - windowSize; x += windowSize) {
        const ssimWindow = calculateWindowSSIM(original, compressed, x, y, windowSize, width);
        ssimSum += ssimWindow;
        windowCount++;
      }
    }

    const avgSSIM = windowCount > 0 ? ssimSum / windowCount : 0;
    return Math.min(Math.max(avgSSIM, 0), 1);
  } catch (error) {
    console.error('Error calculating SSIM:', error);
    return 0;
  }
}

/**
 * Calculate SSIM for a specific window of pixels
 */
function calculateWindowSSIM(
  original: Buffer, 
  compressed: Buffer, 
  startX: number, 
  startY: number, 
  windowSize: number, 
  width: number
): number {
  const pixels = windowSize * windowSize;
  let sumOriginal = 0;
  let sumCompressed = 0;
  let sumOriginalSq = 0;
  let sumCompressedSq = 0;
  let sumProduct = 0;

  // Calculate means and variances for the window
  for (let dy = 0; dy < windowSize; dy++) {
    for (let dx = 0; dx < windowSize; dx++) {
      const idx = (startY + dy) * width + (startX + dx);
      const origPixel = original[idx];
      const compPixel = compressed[idx];

      sumOriginal += origPixel;
      sumCompressed += compPixel;
      sumOriginalSq += origPixel * origPixel;
      sumCompressedSq += compPixel * compPixel;
      sumProduct += origPixel * compPixel;
    }
  }

  const meanOriginal = sumOriginal / pixels;
  const meanCompressed = sumCompressed / pixels;
  const varianceOriginal = sumOriginalSq / pixels - meanOriginal * meanOriginal;
  const varianceCompressed = sumCompressedSq / pixels - meanCompressed * meanCompressed;
  const covariance = sumProduct / pixels - meanOriginal * meanCompressed;

  // SSIM constants
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;

  // Calculate SSIM
  const numerator = (2 * meanOriginal * meanCompressed + c1) * (2 * covariance + c2);
  const denominator = (meanOriginal ** 2 + meanCompressed ** 2 + c1) * (varianceOriginal + varianceCompressed + c2);

  return denominator === 0 ? 1 : numerator / denominator;
}

/**
 * Calculate overall quality metrics for compressed image
 */
export async function calculateQualityMetrics(
  originalPath: string, 
  compressedPath: string
): Promise<QualityMetrics> {
  try {
    const [psnr, ssim] = await Promise.all([
      calculatePSNR(originalPath, compressedPath),
      calculateSSIM(originalPath, compressedPath)
    ]);

    // Calculate overall quality score (0-100)
    // Weighted combination of PSNR and SSIM
    const psnrWeight = 0.6;
    const ssimWeight = 0.4;
    
    // Normalize PSNR to 0-100 scale (typical PSNR range is 20-50 for images)
    const normalizedPSNR = Math.min(Math.max((psnr - 20) / 30 * 100, 0), 100);
    
    // SSIM is already 0-1, convert to 0-100
    const normalizedSSIM = ssim * 100;
    
    const qualityScore = Math.round(
      psnrWeight * normalizedPSNR + ssimWeight * normalizedSSIM
    );

    // Determine quality grade
    let qualityGrade: QualityMetrics['qualityGrade'];
    if (qualityScore >= 85) {
      qualityGrade = 'excellent';
    } else if (qualityScore >= 70) {
      qualityGrade = 'good';
    } else if (qualityScore >= 50) {
      qualityGrade = 'fair';
    } else {
      qualityGrade = 'poor';
    }

    return {
      psnr: Math.round(psnr * 100) / 100, // Store with 2 decimal precision
      ssim: Math.round(ssim * 10000) / 100, // Store as percentage with 2 decimal precision
      qualityScore,
      qualityGrade
    };
  } catch (error) {
    console.error('Error calculating quality metrics:', error);
    return {
      psnr: 0,
      ssim: 0,
      qualityScore: 0,
      qualityGrade: 'poor'
    };
  }
}

/**
 * Get quality assessment insights based on metrics
 */
export function getQualityInsights(metrics: QualityMetrics): string[] {
  const insights: string[] = [];
  
  if (metrics.qualityGrade === 'excellent') {
    insights.push('Excellent visual quality preserved - virtually no visible quality loss');
  } else if (metrics.qualityGrade === 'good') {
    insights.push('Good visual quality maintained with minor compression artifacts');
  } else if (metrics.qualityGrade === 'fair') {
    insights.push('Moderate quality loss - some compression artifacts may be visible');
  } else {
    insights.push('Significant quality loss detected - consider higher quality settings');
  }

  if (metrics.psnr > 40) {
    insights.push('High PSNR indicates excellent noise/distortion control');
  } else if (metrics.psnr < 25) {
    insights.push('Low PSNR suggests noticeable image degradation');
  }

  if (metrics.ssim > 0.95) {
    insights.push('Excellent structural similarity to original image');
  } else if (metrics.ssim < 0.8) {
    insights.push('Structural changes detected - image details may be affected');
  }

  return insights;
}