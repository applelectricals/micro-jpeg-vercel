import CompressionEngine from './compressionEngine';
import { storage } from './storage';
import { calculateQualityMetrics } from './qualityAssessment';
import path from 'path';

// Target size compression function
export async function compressToTargetSize(
  jobId: string,
  file: Express.Multer.File,
  targetSize: number,
  options: { maxQuality: number; minQuality: number }
) {
  try {
    console.log(`Starting target size compression for job ${jobId}: ${targetSize} bytes`);
    await storage.updateCompressionJob(jobId, { status: "processing" });

    const outputPath = path.join("compressed", `${jobId}.jpg`);
    
    const result = await CompressionEngine.compressToTargetSize(
      file.path,
      outputPath,
      targetSize,
      {
        maxQuality: options.maxQuality,
        minQuality: options.minQuality,
        webOptimized: false // Disabled for speed - was causing overhead
      }
    );

    const compressionRatio = Math.round(((file.size - result.finalSize) / file.size) * 100);
    
    console.log(`Target size compression completed: ${result.finalSize} bytes (${result.qualityUsed}% quality, ${result.iterations} iterations)`);

    // Mark compression as completed immediately
    await storage.updateCompressionJob(jobId, {
      status: "completed",
      compressedSize: result.finalSize,
      compressionRatio,
      compressedPath: outputPath,
    });

    // Calculate quality metrics in background (optional) with timeout
    setTimeout(() => {
      calculateQualityMetricsAsync(jobId, file.path, outputPath).catch(error => {
        console.warn(`Quality analysis skipped for job ${jobId}:`, error.message);
      });
    }, 100); // Small delay to prevent blocking compression completion

  } catch (error) {
    console.error(`Target size compression failed for job ${jobId}:`, error);
    await storage.updateCompressionJob(jobId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Generate optimization insights based on compression results
export function generateOptimizationInsights(params: {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  algorithm: string;
  webOptimized: boolean;
}): string[] {
  const insights: string[] = [];
  const { originalSize, compressedSize, compressionRatio, quality, algorithm, webOptimized } = params;
  
  // File size insights
  if (compressionRatio > 70) {
    insights.push('Excellent compression achieved!');
  } else if (compressionRatio > 50) {
    insights.push('Good compression ratio');
  } else if (compressionRatio > 20) {
    insights.push('Moderate compression - consider lower quality for web');
  } else {
    insights.push('Limited compression - image may already be optimized');
  }
  
  // Quality insights
  if (quality > 85 && originalSize > 500000) {
    insights.push('High quality setting on large image - consider reducing for web');
  } else if (quality < 60 && compressedSize < originalSize * 0.3) {
    insights.push('Aggressive compression applied - check quality is acceptable');
  }
  
  // Algorithm insights
  if (algorithm === 'standard' && compressionRatio < 40) {
    insights.push('Try MozJPEG algorithm for better compression');
  }
  
  // Web optimization insights
  if (!webOptimized && originalSize > 100000) {
    insights.push('Enable web optimization for better performance');
  }
  
  // File size recommendations
  if (compressedSize > 200000) {
    insights.push('Large file size - consider progressive JPEG for better loading');
  } else if (compressedSize > 500000) {
    insights.push('Very large file - consider resizing or WebP format');
  }
  
  return insights;
}

// Fast compression without expensive quality assessment (optional)
export async function compressToTargetSizeFast(
  jobId: string,
  file: Express.Multer.File,
  targetSize: number,
  options: { maxQuality: number; minQuality: number }
) {
  try {
    console.log(`Starting fast compression for job ${jobId}`);
    await storage.updateCompressionJob(jobId, { status: "processing" });

    const outputPath = path.join("compressed", `${jobId}.jpg`);
    
    const result = await CompressionEngine.compressToTargetSize(
      file.path,
      outputPath,
      targetSize,
      {
        maxQuality: options.maxQuality,
        minQuality: options.minQuality,
        webOptimized: false // Skip some optimizations for speed
      }
    );

    const compressionRatio = Math.round(((file.size - result.finalSize) / file.size) * 100);
    
    console.log(`Fast compression completed: ${result.finalSize} bytes`);

    // Mark compression as completed immediately
    await storage.updateCompressionJob(jobId, {
      status: "completed",
      compressedSize: result.finalSize,
      compressionRatio,
      compressedPath: outputPath,
    });

  } catch (error) {
    console.error(`Fast compression failed for job ${jobId}:`, error);
    await storage.updateCompressionJob(jobId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Async quality assessment function that runs in background (optional) with timeout
async function calculateQualityMetricsAsync(
  jobId: string, 
  originalPath: string, 
  compressedPath: string
): Promise<void> {
  const timeoutMs = 10000; // 10 second timeout
  
  try {
    console.log(`Calculating quality metrics for job ${jobId}...`);
    
    // Race between quality calculation and timeout
    const qualityMetrics = await Promise.race([
      calculateQualityMetrics(originalPath, compressedPath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Quality analysis timeout')), timeoutMs)
      )
    ]) as any;
    
    console.log(`Quality assessment completed - PSNR: ${qualityMetrics.psnr}, SSIM: ${qualityMetrics.ssim}%, Score: ${qualityMetrics.qualityScore}, Grade: ${qualityMetrics.qualityGrade}`);

    // Update job with quality metrics
    await storage.updateCompressionJob(jobId, {
      psnr: Math.round(qualityMetrics.psnr * 100), // Store as integer with 2 decimal precision
      ssim: Math.round(qualityMetrics.ssim * 100), // Store as integer percentage
      qualityScore: qualityMetrics.qualityScore,
      qualityGrade: qualityMetrics.qualityGrade,
    });
    
    console.log(`Quality metrics updated for job ${jobId}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      console.warn(`Quality assessment timed out for job ${jobId} - skipping`);
    } else {
      console.error(`Quality assessment failed for job ${jobId}:`, error);
    }
    // Don't fail the job - quality assessment is optional
  }
}

// Get compression quality recommendation based on use case
export function getQualityRecommendation(useCase: string, fileSize: number): {
  quality: number;
  explanation: string;
} {
  switch (useCase) {
    case 'thumbnail':
      return {
        quality: 60,
        explanation: 'Lower quality suitable for small thumbnails'
      };
    case 'web':
      return {
        quality: fileSize > 1000000 ? 70 : 75,
        explanation: 'Balanced quality for web display'
      };
    case 'print':
      return {
        quality: 90,
        explanation: 'High quality for print materials'
      };
    case 'archive':
      return {
        quality: 95,
        explanation: 'Maximum quality for archival purposes'
      };
    default:
      return {
        quality: 75,
        explanation: 'Standard quality for general use'
      };
  }
}