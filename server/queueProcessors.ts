// Simplified queue job processors for image compression
import { Job } from 'bull';
import { imageQueue, rawQueue, bulkQueue, JOB_TYPES } from './queueConfig';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { r2Service, R2_FOLDERS } from './r2Service';

// Job data interfaces
export interface ImageCompressionJob {
  filePath: string;
  fileName: string;
  sessionId: string;
  userId?: string;
  userTier: string;
  options: {
    quality?: number;
    width?: number;
    height?: number;
    format?: string;
  };
  outputPath: string;
}

export interface RAWProcessingJob {
  filePath: string;
  fileName: string;
  sessionId: string;
  userId?: string;
  userTier: string;
  outputFormat: string;
  outputPath: string;
}

export interface BulkProcessingJob {
  files: Array<{
    filePath: string;
    fileName: string;
    options: {
      quality?: number;
      width?: number;
      height?: number;
      format?: string;
    };
  }>;
  sessionId: string;
  userId?: string;
  userTier: string;
  zipOutputPath: string;
}

// Simple compression function using Sharp
async function performCompression(
  inputPath: string,
  outputPath: string,
  options: { quality?: number; width?: number; height?: number; format?: string } = {}
): Promise<{ originalSize: number; compressedSize: number; compressionRatio: number }> {
  const { quality = 80, width, height, format = 'jpeg' } = options;
  
  // Get original file size
  const originalStats = await fs.promises.stat(inputPath);
  const originalSize = originalStats.size;
  
  let sharpInstance = sharp(inputPath);
  
  // Apply resizing if specified
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Apply compression based on format
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality: Math.floor(quality / 10) });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
    default:
      sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
  }
  
  // Save the compressed image
  await sharpInstance.toFile(outputPath);
  
  // Get compressed file size
  const compressedStats = await fs.promises.stat(outputPath);
  const compressedSize = compressedStats.size;
  
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  
  return {
    originalSize,
    compressedSize,
    compressionRatio
  };
}

// Image compression job processor
async function processImageCompression(job: Job<ImageCompressionJob>): Promise<any> {
  const { filePath, fileName, sessionId, userId, userTier, options, outputPath } = job.data;
  
  console.log(`🔄 Processing image compression job ${job.id} for ${userTier} user (${fileName})`);
  
  try {
    // Update job progress
    await job.progress(10);
    
    // Check if input file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }
    
    await job.progress(25);
    
    // Perform compression
    const result = await performCompression(filePath, outputPath, options);
    
    await job.progress(90);
    
    // Upload compressed image to R2 CDN
    let r2UploadResult = null;
    try {
      console.log(`📤 Uploading compressed image to R2: ${fileName}`);
      
      r2UploadResult = await r2Service.uploadFile(outputPath, fileName, {
        folder: R2_FOLDERS.COMPRESSED,
        contentType: 'image/jpeg',
        metadata: {
          originalSize: result.originalSize.toString(),
          compressedSize: result.compressedSize.toString(),
          compressionRatio: result.compressionRatio.toString(),
          sessionId,
          userId: userId || 'anonymous',
          userTier,
          processedAt: new Date().toISOString()
        }
      });
      
      console.log(`✅ Successfully uploaded to R2: ${r2UploadResult.cdnUrl}`);
      
      // Clean up local compressed file after successful R2 upload
      try {
        await fs.promises.unlink(outputPath);
        console.log(`🗑️ Cleaned up local compressed file: ${outputPath}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up compressed file ${outputPath}:`, cleanupError);
      }
      
    } catch (r2Error) {
      console.error(`❌ Failed to upload to R2: ${r2Error instanceof Error ? r2Error.message : 'Unknown error'}`);
      // Continue without R2 upload - use local file as fallback
    }
    
    // Clean up input file if it's a temporary file
    if (filePath.includes('/uploads/')) {
      try {
        await fs.promises.unlink(filePath);
      } catch (cleanupError) {
        console.warn(`Failed to clean up input file ${filePath}:`, cleanupError);
      }
    }
    
    await job.progress(100);
    
    console.log(`✅ Completed image compression job ${job.id} for ${fileName}`);
    
    return {
      success: true,
      fileName,
      originalPath: filePath,
      compressedPath: outputPath,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      processingTime: Date.now() - job.timestamp,
      sessionId,
      userId,
      // R2 CDN data
      r2Key: r2UploadResult?.key,
      cdnUrl: r2UploadResult?.cdnUrl,
      r2UploadSuccess: !!r2UploadResult
    };
  } catch (error) {
    console.error(`❌ Image compression job ${job.id} failed:`, error);
    await job.progress(0);
    throw error;
  }
}

// RAW processing job processor (mock implementation)
async function processRAWConversion(job: Job<RAWProcessingJob>): Promise<any> {
  const { filePath, fileName, sessionId, userId, userTier, outputFormat, outputPath } = job.data;
  
  console.log(`🔄 Processing RAW conversion job ${job.id} for ${userTier} user (${fileName})`);
  
  try {
    await job.progress(10);
    
    // Check if input file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input RAW file not found: ${filePath}`);
    }
    
    await job.progress(25);
    
    // Mock RAW processing - in reality this would use dcraw or similar
    console.log(`Processing RAW file: ${fileName} to ${outputFormat}`);
    
    await job.progress(75);
    
    // Simulate processing time for RAW files
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a placeholder converted file
    await fs.promises.copyFile(filePath, outputPath);
    
    await job.progress(100);
    
    console.log(`✅ Completed RAW conversion job ${job.id} for ${fileName}`);
    
    return {
      success: true,
      fileName,
      originalPath: filePath,
      convertedPath: outputPath,
      outputFormat,
      processingTime: Date.now() - job.timestamp,
      sessionId,
      userId
    };
  } catch (error) {
    console.error(`❌ RAW conversion job ${job.id} failed:`, error);
    await job.progress(0);
    throw error;
  }
}

// Bulk processing job processor
async function processBulkCompression(job: Job<BulkProcessingJob>): Promise<any> {
  const { files, sessionId, userId, userTier, zipOutputPath } = job.data;
  
  console.log(`🔄 Processing bulk compression job ${job.id} for ${userTier} user (${files.length} files)`);
  
  try {
    const results = [];
    const totalFiles = files.length;
    
    await job.progress(5);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.floor(((i + 1) / totalFiles) * 90) + 5;
      
      console.log(`Processing file ${i + 1}/${totalFiles}: ${file.fileName}`);
      
      try {
        const outputPath = path.join('compressed', `${Date.now()}_${file.fileName}`);
        const result = await performCompression(file.filePath, outputPath, file.options);
        
        results.push({
          fileName: file.fileName,
          success: true,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
          outputPath
        });
      } catch (fileError) {
        console.error(`Failed to process ${file.fileName}:`, fileError);
        results.push({
          fileName: file.fileName,
          success: false,
          error: (fileError as Error).message
        });
      }
      
      await job.progress(progress);
    }
    
    await job.progress(95);
    
    // Create ZIP archive would go here
    console.log(`Creating ZIP archive: ${zipOutputPath}`);
    
    await job.progress(100);
    
    console.log(`✅ Completed bulk compression job ${job.id} (${results.filter(r => r.success).length}/${totalFiles} successful)`);
    
    return {
      success: true,
      totalFiles,
      successfulFiles: results.filter(r => r.success).length,
      failedFiles: results.filter(r => !r.success).length,
      results,
      zipPath: zipOutputPath,
      processingTime: Date.now() - job.timestamp,
      sessionId,
      userId
    };
  } catch (error) {
    console.error(`❌ Bulk compression job ${job.id} failed:`, error);
    await job.progress(0);
    throw error;
  }
}

// Initialize queue processors
export function initializeQueueProcessors(): void {
  console.log('🔧 Initializing queue processors...');
  
  try {
    // Image queue processor
    imageQueue.process(JOB_TYPES.COMPRESS_IMAGE, 2, processImageCompression);
    imageQueue.process(JOB_TYPES.CONVERT_FORMAT, 2, processImageCompression);
    
    // RAW queue processor
    rawQueue.process(JOB_TYPES.PROCESS_RAW, 1, processRAWConversion);
    
    // Bulk queue processor
    bulkQueue.process(JOB_TYPES.BULK_PROCESS, 1, processBulkCompression);
    
    // Add job event listeners
    [imageQueue, rawQueue, bulkQueue].forEach(queue => {
      queue.on('completed', (job, result) => {
        console.log(`✅ Job ${job.id} completed in queue ${queue.name}`);
      });
      
      queue.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} failed in queue ${queue.name}:`, err.message);
      });
      
      queue.on('stalled', (job) => {
        console.warn(`⚠️  Job ${job.id} stalled in queue ${queue.name}`);
      });
      
      queue.on('progress', (job, progress) => {
        console.log(`📊 Job ${job.id} progress: ${progress}%`);
      });
    });
    
    console.log('✅ Queue processors initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize queue processors:', error);
    throw error;
  }
}

// Helper function to add a job to the appropriate queue
export async function addJobToQueue(
  jobType: keyof typeof JOB_TYPES,
  jobData: any,
  userTier: string = 'free',
  options: any = {}
): Promise<any> {
  try {
    let queue;
    
    switch (jobType) {
      case 'PROCESS_RAW':
        queue = rawQueue;
        break;
      case 'BULK_PROCESS':
        queue = bulkQueue;
        break;
      case 'COMPRESS_IMAGE':
      case 'CONVERT_FORMAT':
      default:
        queue = imageQueue;
        break;
    }
    
    // Set priority based on user tier
    const priorities = {
      enterprise: 1,
      premium: 5,
      test_premium: 5,
      free: 10,
      guest: 15
    };
    
    const priority = priorities[userTier as keyof typeof priorities] || 10;
    
    const job = await queue.add(JOB_TYPES[jobType], jobData, {
      priority,
      removeOnComplete: 10,
      removeOnFail: 20,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options
    });
    
    console.log(`➕ Added ${jobType} job ${job.id} to queue with priority ${priority} (${userTier} tier)`);
    
    return job;
  } catch (error) {
    console.error(`❌ Failed to add ${jobType} job to queue:`, error);
    throw error;
  }
}

// Get job status from any queue
export async function getJobStatus(jobId: string): Promise<any> {
  const queues = [imageQueue, rawQueue, bulkQueue];
  
  for (const queue of queues) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        
        return {
          id: job.id,
          state,
          progress: job.progress(),
          data: job.data,
          result: state === 'completed' ? job.returnvalue : null,
          error: state === 'failed' ? job.failedReason : null,
          attempts: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          priority: job.opts.priority,
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : null,
          finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
          queueName: queue.name
        };
      }
    } catch (error) {
      console.error(`Error checking job ${jobId} in queue ${queue.name}:`, error);
    }
  }
  
  return null;
}