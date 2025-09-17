import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import compression from "compression";
import fs from "fs/promises";
import { createReadStream } from "fs";
import archiver from "archiver";
import { exec } from "child_process";
import { promisify } from "util";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { insertCompressionJobSchema, specialFormatTrials, creditPurchases, users, userUsage, type SpecialFormatTrial } from "@shared/schema";
import { z } from "zod";
import CompressionEngine from "./compressionEngine";
import { db } from "./db";
import { and, eq, gt, sql } from "drizzle-orm";
import { compressToTargetSize, generateOptimizationInsights } from "./compressionUtils";
import { calculateQualityMetrics } from "./qualityAssessment";
import paymentRoutes from "./paymentRoutes";
import { r2Service, R2_FOLDERS } from './r2Service';
import { pageIdentifierMiddleware } from './pageIdentifierMiddleware';
import { DualUsageTracker } from './services/DualUsageTracker';
import { OPERATION_CONFIG } from './config/operationLimits';

// Create promisified exec for shell commands
const execAsync = promisify(exec);

// Format normalization utilities
const normalizeFormat = (format: string): string => {
  const normalized = format.toLowerCase().trim();
  const formatMap: Record<string, string> = {
    // JPEG aliases
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    
    // TIFF aliases  
    'tif': 'tiff',
    'tiff': 'tiff',
    
    // Other formats (no change needed)
    'png': 'png',
    'webp': 'webp',
    'avif': 'avif',
    'svg': 'svg',
    
    // RAW formats (keep as-is for processing)
    'cr2': 'cr2',
    'cr3': 'cr3',
    'arw': 'arw',
    'dng': 'dng',
    'nef': 'nef',
    'orf': 'orf',
    'raf': 'raf',
    'crw': 'crw'
  };
  
  return formatMap[normalized] || normalized;
};

const getFileExtension = (format: string): string => {
  const normalized = normalizeFormat(format);
  const extensionMap: Record<string, string> = {
    'jpeg': 'jpg',  // JPEG files use .jpg extension
    'tiff': 'tiff', // TIFF files use .tiff extension
    'png': 'png',
    'webp': 'webp',
    'avif': 'avif',
    'svg': 'svg'
  };
  
  return extensionMap[normalized] || normalized;
};

// Process a single compression job with advanced settings
async function processCompressionJob(
  jobId: string, 
  originalPath: string, 
  originalFilename: string, 
  settings: any, 
  userId: string | null, 
  sessionId: string,
  userType: string = 'anonymous',
  pageIdentifier: string = 'free-no-auth'
) {
  try {
    // Normalize formats using our comprehensive mapping
    const rawOutputFormat = settings.outputFormat === 'keep-original' 
      ? originalFilename.split('.').pop()?.toLowerCase() || 'jpeg'
      : settings.outputFormat;
    
    const normalizedFormat = normalizeFormat(rawOutputFormat);
    const outputExtension = getFileExtension(normalizedFormat);
    // 🔧 CONSISTENCY FIX: Use 'converted' directory for all formats (same as special format conversion)
    const outputPath = path.join("converted", `${jobId}.${outputExtension}`);
    
    // Get quality from settings
    const quality = settings.customQuality || 75;
    const outputFormat = normalizedFormat;
    
    console.log(`Processing job ${jobId}: rawFormat=${rawOutputFormat}, normalizedFormat=${normalizedFormat}, outputExtension=${outputExtension}, quality=${quality}`);
    
    // Use the compression engine with advanced settings - now with normalized format
    const result = await CompressionEngine.compressWithAdvancedSettings(
      originalPath,
      outputPath,
      quality,
      outputFormat as 'jpeg' | 'webp' | 'avif' | 'png' | 'tiff',
      {
        compressionAlgorithm: settings.compressionAlgorithm || 'standard',
        progressive: settings.progressiveJpeg || false,
        optimizeScans: settings.optimizeScans || false,
        arithmeticCoding: settings.arithmeticCoding || false,
        webOptimized: settings.optimizeForWeb !== false
      }
    );
    
    // Get original file size
    const originalStats = await fs.stat(originalPath);
    const compressionRatio = Math.round(((originalStats.size - result.finalSize) / originalStats.size) * 100);
    
    // 🔧 CRITICAL FIX: Generate thumbnail for ALL formats consistently
    let thumbnailPath: string | undefined;
    try {
      // Ensure previews directory exists in the root
      const previewsDir = path.join(process.cwd(), 'previews');
      await fs.mkdir(previewsDir, { recursive: true });
      
      // Use job ID for consistent naming (same as generateThumbnailFromRaw)
      thumbnailPath = path.join(previewsDir, jobId + '_thumb.jpg');
      
      // Generate thumbnail from the compressed output file for ALL formats
      const thumbnailCommand = `convert "${outputPath}" -resize "256x256>" -quality 60 -strip "${thumbnailPath}"`;
      console.log(`🖼️ Generating thumbnail for ${outputFormat}: ${thumbnailCommand}`);
      
      await execAsync(thumbnailCommand);
      console.log(`✅ Thumbnail generated: ${thumbnailPath}`);
    } catch (thumbnailError) {
      console.warn(`⚠️ Thumbnail generation failed for ${jobId}:`, thumbnailError);
      thumbnailPath = undefined;
    }
    
    // Upload compressed image to R2 CDN
    let r2UploadResult = null;
    try {
      console.log(`📤 Uploading compressed image to R2: ${jobId}.${outputExtension}`);
      
      r2UploadResult = await r2Service.uploadFile(outputPath, `${jobId}.${outputExtension}`, {
        folder: R2_FOLDERS.COMPRESSED,
        contentType: `image/${outputFormat}`,
        metadata: {
          jobId,
          originalFilename,
          originalSize: originalStats.size.toString(),
          compressedSize: result.finalSize.toString(),
          compressionRatio: compressionRatio.toString(),
          quality: quality.toString(),
          outputFormat,
          userId: userId || 'anonymous',
          sessionId,
          processedAt: new Date().toISOString()
        }
      });
      
      console.log(`✅ Successfully uploaded to R2: ${r2UploadResult.cdnUrl}`);
      
      // Clean up local compressed file after successful R2 upload
      try {
        await fs.unlink(outputPath);
        console.log(`🗑️ Cleaned up local compressed file: ${outputPath}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up compressed file ${outputPath}:`, cleanupError);
      }
      
    } catch (r2Error) {
      console.error(`❌ Failed to upload to R2: ${r2Error instanceof Error ? r2Error.message : 'Unknown error'}`);
      // Continue without R2 upload - use local file as fallback
    }
    
    // Update job with completion data including R2 CDN URLs
    await storage.updateCompressionJob(jobId, {
      status: "completed",
      compressedSize: result.finalSize,
      compressionRatio,
      compressedPath: outputPath,
      qualityLevel: quality.toString(),
      outputFormat: outputFormat,
      // R2 CDN data
      r2Key: r2UploadResult?.key,
      cdnUrl: r2UploadResult?.cdnUrl,
      completedAt: new Date()
    });
    
    // Record successful operation with DualUsageTracker
    try {
      const dualTracker = new DualUsageTracker(userId, sessionId, userType);
      await dualTracker.recordOperation(originalFilename, originalStats.size, pageIdentifier);
      console.log(`✅ DualUsageTracker recorded operation: ${originalFilename} (${originalStats.size} bytes) on ${pageIdentifier}`);
    } catch (recordError) {
      console.error(`❌ Failed to record operation in processCompressionJob:`, recordError);
    }
    
    console.log(`Successfully processed job ${jobId}: ${originalStats.size} → ${result.finalSize} bytes (${compressionRatio}% reduction)`);
    
  } catch (error) {
    console.error(`Failed to process job ${jobId}:`, error);
    await storage.updateCompressionJob(jobId, {
      status: "failed",
      errorMessage: `Processing failed: ${error.message}`
    });
  }
}
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  processPayPalPayment, 
  getSubscriptionStatus, 
  cancelSubscription 
} from "./payment";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { hashPassword, verifyPassword } from "./auth";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@shared/schema";
import { UsageTracker } from "./usageTracker";
import { getUsageStats, checkOperationAllowed, recordOperation, UnifiedOperationCounter } from "./unifiedOperationCounter";
import { safeRedis } from './redis';
import { anonymousSessionScopes } from '@shared/schema';
import { requireScopeFromAuth, getSessionIdFromRequest } from "./scopeMiddleware";
import { getUnifiedPlan, checkFormatAccess, getUserPlan, checkFileSize } from "./unifiedPlanConfig";
import Stripe from "stripe";
import { apiRouter } from "./apiRoutes";
import { webhookRouter } from "./webhooks";
import { apiManagementRouter } from "./apiManagement";
import { apiDocsRouter } from "./apiDocs";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Configure multer for file uploads with dynamic limits
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit (supports Enterprise users)
  },
  fileFilter: (req, file, cb) => {
    // Check format access based on user plan using unified configuration
    const user = req.user;
    const planId = user ? 'free' : 'anonymous';
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
    
    const formatCheck = checkFormatAccess(planId, fileExtension);
    if (formatCheck.allowed) {
      cb(null, true);
    } else {
      cb(new Error(formatCheck.message || 'File format not supported'));
    }
  },
});

// Configure multer for special format uploads (RAW, SVG, TIFF)
const specialUpload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for special formats (same as regular upload)
  },
  fileFilter: (req, file, cb) => {
    // Special formats: JPG, PNG, RAW (ARW, CR2, DNG, NEF), SVG, TIFF
    const specialAllowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png',
      'image/tiff', 'image/svg+xml',
      'image/x-adobe-dng', 'image/x-canon-cr2',
      'image/CR2', // Some browsers use this MIME type for CR2 files
      'image/x-nikon-nef', 'image/x-sony-arw'
    ];
    
    const fileName = file.originalname.toLowerCase();
    const hasValidExtension = 
      fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') ||
      fileName.endsWith('.tiff') || fileName.endsWith('.tif') || fileName.endsWith('.svg') ||
      fileName.endsWith('.dng') || fileName.endsWith('.cr2') ||
      fileName.endsWith('.nef') || fileName.endsWith('.arw');
    
    console.log(`Special upload: ${file.originalname}, MIME: ${file.mimetype}, Valid extension: ${hasValidExtension}`);
    
    if (specialAllowedTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, RAW (ARW, CR2, DNG, NEF), SVG, and TIFF files are allowed for special format conversions'));
    }
  },
});

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir("uploads", { recursive: true });
    await fs.mkdir("compressed", { recursive: true });
  } catch (error) {
    console.log("Directories already exist or created successfully");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDirectories();
  
  // Enable compression middleware for better performance
  app.use(compression({
    filter: (req, res) => {
      // Don't compress if the client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Compress all responses by default
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress files larger than 1KB
  }));

  // Cache control headers for static assets
  app.use('/assets', (req, res, next) => {
    // Cache static assets for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    next();
  });

  // Cache control for API responses
  app.use('/api', (req, res, next) => {
    // Default cache settings for API responses
    if (req.method === 'GET' && !req.path.includes('/auth/')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  });
  
  // Setup authentication middleware first
  await setupAuth(app);

  // Add pageIdentifier middleware for all API routes
  app.use('/api', pageIdentifierMiddleware);
  app.use('/paypal', pageIdentifierMiddleware);

  // R2 CDN health check endpoint
  app.get('/health/r2', async (req, res) => {
    try {
      const { r2Service } = await import('./r2Service');
      const healthStatus = await r2Service.healthCheck();
      
      if (healthStatus.status === 'healthy') {
        res.json({
          status: 'healthy',
          r2: healthStatus.details
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          r2: healthStatus.details
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'R2 service not available',
        error: error.message
      });
    }
  });

  // Health check endpoints for Redis and queues
  app.get('/health/redis', async (req, res) => {
    try {
      const { getQueueServiceStatus } = await import('./queueService');
      const status = await getQueueServiceStatus();
      
      if (status.redis && Object.values(status.queues).every(Boolean)) {
        res.json({
          status: 'healthy',
          redis: status.redis,
          queues: status.queues,
          ...(status.stats && { stats: status.stats })
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          redis: status.redis,
          queues: status.queues
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Queue service not available',
        redis: false,
        queues: { imageQueue: false, rawQueue: false, bulkQueue: false }
      });
    }
  });

  // Cache monitoring endpoints
  app.get('/health/cache', async (req, res) => {
    try {
      const { cachedStorage } = await import('./cachedStorage');
      const cacheStats = await cachedStorage.getCacheStats();
      
      res.json({
        status: 'healthy',
        cache: cacheStats
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Cache service not available',
        error: error.message
      });
    }
  });

  // Cache management endpoints (admin only)
  app.delete('/api/cache/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { cachedStorage } = await import('./cachedStorage');
      
      await cachedStorage.clearUserCache(userId);
      
      res.json({
        success: true,
        message: `Cache cleared for user ${userId}`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to clear user cache',
        message: error.message
      });
    }
  });

  app.delete('/api/cache/all', async (req, res) => {
    try {
      const { cachedStorage } = await import('./cachedStorage');
      await cachedStorage.clearAllCache();
      
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to clear all cache',
        message: error.message
      });
    }
  });

  // Job status tracking endpoints
  app.get('/api/job/:jobId/status', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { getJobStatus } = await import('./queueService');
      
      const jobStatus = await getJobStatus(jobId);
      
      if (!jobStatus) {
        return res.status(404).json({
          error: 'Job not found',
          jobId
        });
      }
      
      res.json({
        success: true,
        job: jobStatus
      });
    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        error: 'Failed to get job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Queue management endpoints
  app.post('/api/queue/add', async (req, res) => {
    try {
      const { jobType, jobData, options = {} } = req.body;
      const { addJobToQueue } = await import('./queueService');
      
      if (!jobType || !jobData) {
        return res.status(400).json({
          error: 'Missing required fields: jobType, jobData'
        });
      }
      
      const job = await addJobToQueue(jobType, jobData, 'standard', options);
      
      res.json({
        success: true,
        jobId: job.id,
        message: `Job added to queue successfully`
      });
    } catch (error) {
      console.error('Error adding job to queue:', error);
      res.status(500).json({
        error: 'Failed to add job to queue',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register API v1 routes
  app.use('/api/v1', apiRouter);
  
  // Register API management routes (for web interface)
  app.use('/api', apiManagementRouter);
  
  
  // Register payment routes (Razorpay + PayPal)
  app.use('/api', paymentRoutes);
  
  // Register new subscription routes - DISABLED: Using legacy endpoint instead to avoid PayPal product creation errors
  // registerNewSubscriptionRoutes(app);
  
  // Register webhook routes (must be before body parsing middleware)
  app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter);
  
  // Register API documentation
  app.use('/api/v1', apiDocsRouter);


  // Preview image endpoint for thumbnails
  app.get('/api/preview/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      // Sanitize the ID to prevent path traversal
      if (!id.match(/^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).json({ error: "Invalid preview ID" });
      }
      
      const previewPath = path.join(process.cwd(), 'previews', id + '_thumb.jpg');
      
      // Check if preview file exists
      fs.access(previewPath)
        .then(() => {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
          
          const fileStream = createReadStream(previewPath);
          fileStream.pipe(res);
        })
        .catch(() => {
          res.status(404).json({ error: "Preview not found" });
        });
    } catch (error) {
      console.error("Error serving preview:", error);
      res.status(500).json({ error: "Failed to serve preview" });
    }
  });

  // Download endpoint for converted files (special formats and regular compression)
  app.get('/api/download/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      // Sanitize the ID to prevent path traversal
      if (!id.match(/^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).json({ error: "Invalid download ID" });
      }
      
      // Check for files in converted directory (special formats)
      const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff', 'svg'];
      
      const findAndServeFile = async () => {
        // First try converted directory for special formats
        for (const ext of possibleExtensions) {
          const convertedPath = path.join(process.cwd(), 'converted', `${id}.${ext}`);
          try {
            await fs.access(convertedPath);
            
            // Determine content type
            const contentType = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg', 
              'png': 'image/png',
              'webp': 'image/webp',
              'avif': 'image/avif',
              'tiff': 'image/tiff',
              'svg': 'image/svg+xml'
            }[ext] || 'application/octet-stream';
            
            const stats = await fs.stat(convertedPath);
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stats.size);
            res.setHeader('Content-Disposition', `attachment; filename="${id}.${ext}"`);
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
            
            const fileStream = createReadStream(convertedPath);
            return fileStream.pipe(res);
          } catch (err) {
            // File doesn't exist with this extension, continue to next
            continue;
          }
        }
        
        // If not found in converted, try compressed directory (regular compression)
        for (const ext of possibleExtensions) {
          const compressedPath = path.join(process.cwd(), 'compressed', `${id}.${ext}`);
          try {
            await fs.access(compressedPath);
            
            const contentType = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg', 
              'png': 'image/png',
              'webp': 'image/webp',
              'avif': 'image/avif',
              'tiff': 'image/tiff'
            }[ext] || 'application/octet-stream';
            
            const stats = await fs.stat(compressedPath);
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stats.size);
            res.setHeader('Content-Disposition', `attachment; filename="${id}.${ext}"`);
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
            
            const fileStream = createReadStream(compressedPath);
            return fileStream.pipe(res);
          } catch (err) {
            // File doesn't exist with this extension, continue to next
            continue;
          }
        }
        
        // File not found in either location
        res.status(404).json({ error: "Download file not found" });
      };
      
      findAndServeFile().catch(error => {
        console.error("Error serving download:", error);
        res.status(500).json({ error: "Failed to serve download" });
      });
      
    } catch (error) {
      console.error("Error processing download:", error);
      res.status(500).json({ error: "Failed to process download" });
    }
  });

  // WordPress Plugin Download Route
  app.get('/api/download/wordpress-plugin', (req, res) => {
    const pluginPath = path.join(process.cwd(), 'micro-jpeg-api-wordpress-plugin.zip');
    
    // Check if plugin file exists
    fs.access(pluginPath)
      .then(() => {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="micro-jpeg-api-wordpress-plugin.zip"');
        
        const fileStream = createReadStream(pluginPath);
        fileStream.pipe(res);
      })
      .catch(() => {
        res.status(404).json({ error: 'WordPress plugin not found' });
      });
  });

  // Upload-only endpoint - stores files without compression
  app.post("/api/upload", upload.array('files', 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Check if user is authenticated
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const user = isUserAuthenticated ? req.user : null;
      const sessionId = req.body.sessionId || req.sessionID;
      const userId = (user as any)?.claims?.sub || null;
      
      // Get user tier configuration
      const userPlan = getUserPlan(user);
      
      
      // Check batch limits (max 20 files for all users)
      if (files.length > 20) {
        return res.status(400).json({ 
          error: "Batch size limit exceeded", 
          message: "Maximum 20 files per batch",

        });
      }

      // Create jobs with 'uploaded' status (not processed yet)
      const results = [];
      console.log(`Creating ${files.length} upload jobs for user ${userId || 'guest'}`);

      for (const file of files) {
        try {
          const jobId = randomUUID();
          const originalPath = file.path; // Multer stores the file
          
          // Get original format from file extension
          const originalFormat = file.originalname.split('.').pop()?.toLowerCase() || 'unknown';
          
          // Create job entry for uploaded file (not compressed yet)
          const job = await storage.createCompressionJob({
            userId,
            sessionId,
            originalFilename: file.originalname,
            originalSize: file.size,
            originalPath,
            originalFormat,
            status: 'uploaded' // New status for uploaded but not processed
          });

          results.push({
            id: job.id,
            originalName: file.originalname,
            originalSize: file.size,
            status: 'uploaded'
          });
          
          console.log(`Created upload job ${job.id} for file ${file.originalname}`);
        } catch (error) {
          console.error(`Failed to create upload job for ${file.originalname}:`, error);
          return res.status(500).json({ 
            error: `Failed to upload ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }

      res.json({ 
        results,
        message: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}. Use advanced settings to process them.`
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // Process uploaded files endpoint - processes already uploaded files with settings
  app.post("/api/process", async (req, res) => {
    // Set timeout based on user plan
    const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
    const user = isUserAuthenticated ? req.user : null;
    const planLimits = user ? getUnifiedPlan('free') : getUnifiedPlan('anonymous');
    const timeoutMs = planLimits.limits.processingTimeout * 1000;
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);
    
    try {
      const { jobIds, settings } = req.body;
      
      if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ error: "No job IDs provided" });
      }
      
      console.log('Compression settings received:', settings);
      
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const user = isUserAuthenticated ? req.user : null;
      const sessionId = req.sessionID;
      const userId = (user as any)?.claims?.sub || null;
      
      // Determine userType for DualUsageTracker
      let userType = 'anonymous';
      if (user) {
        const userData = await storage.getUser((user as any)?.claims?.sub);
        userType = userData?.subscriptionTier || 'free';
      }
      
      // Use generic processing page identifier
      const pageIdentifier = 'advanced-process';
      
      // Get jobs to process
      const jobs = await storage.getJobsByIds(jobIds);
      
      if (jobs.length === 0) {
        return res.status(404).json({ error: "No valid jobs found to process" });
      }
      
      // Check usage limits for compressions
      for (const job of jobs) {
        const usageCheck = await UsageTracker.checkLimit(user, req, 1, false);
        if (!usageCheck.allowed) {
          return res.status(429).json({
            error: "Usage limit exceeded",
            message: usageCheck.message || "You have reached your compression limit",
            usage: usageCheck.usage
          });
        }
      }
      
      const results = [];
      
      for (const job of jobs) {
        try {
          // Update job status to processing
          await storage.updateCompressionJob(job.id, { 
            status: 'processing',
            compressionSettings: settings 
          });
          
          // Start async compression and wait for it to complete
          await processCompressionJob(job.id, job.originalPath, job.originalFilename, settings, userId, sessionId, userType, pageIdentifier);
          
          // Get the updated job status after compression
          const updatedJob = await storage.getCompressionJob(job.id);
          
          results.push({
            id: job.id,
            status: updatedJob?.status || 'completed',
            originalName: job.originalFilename
          });
          
        } catch (error) {
          console.error(`Failed to start processing job ${job.id}:`, error);
          await storage.updateCompressionJob(job.id, { 
            status: 'failed',
            errorMessage: `Processing failed: ${error.message}`
          });
        }
      }
      
      res.json({ 
        results,
        message: `Started processing ${results.length} file${results.length > 1 ? 's' : ''}`
      });
      
    } catch (error) {
      console.error("Process error:", error);
      res.status(500).json({ error: "Failed to process files" });
    }
  });

  // Compression endpoint for both guest and authenticated users  
  app.post("/api/compress", upload.array('files', 20), requireScopeFromAuth, async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Check if user is authenticated
      console.log('Authentication check:', {
        hasIsAuthenticated: !!req.isAuthenticated,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        sessionID: req.sessionID,
        session: req.session
      });
      
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      let user = isUserAuthenticated ? req.user : null;
      
      // Fallback: If Passport auth failed but session has userId, use that
      if (!user && req.session && req.session.userId) {
        console.log('Using session userId as fallback:', req.session.userId);
        try {
          user = await storage.getUser(req.session.userId);
          console.log('Fetched user data from session fallback:', { 
            id: user?.id, 
            isPremium: user?.isPremium, 
            subscriptionStatus: user?.subscriptionStatus 
          });
        } catch (error) {
          console.log('Error fetching user from session fallback:', error.message);
        }
      }
      
      // If user is authenticated, ensure we have complete user data with subscription info
      if (user && user.id) {
        console.log('User authenticated, ensuring complete data for ID:', user.id);
      } else {
        console.log('No authenticated user found');
      }
      
      // ✅ COMPREHENSIVE PAGE-SPECIFIC RULES VALIDATION
      // Extract page-aware settings for complete validation
      let pageIdentifier = 'free-no-auth'; // Default fallback
      let sessionId = req.sessionID;
      let settings = {
        quality: 80,
        outputFormat: 'keep-original',
        resizeOption: 'keep-original',
        resizePercentage: 100,
        compressionAlgorithm: 'standard',
        webOptimization: 'optimize-web'
      };
      
      // Parse settings to extract pageIdentifier and sessionId
      if (req.body.settings) {
        try {
          const parsedSettings = JSON.parse(req.body.settings);
          settings = { ...settings, ...parsedSettings };
          pageIdentifier = parsedSettings.pageIdentifier || pageIdentifier;
          sessionId = parsedSettings.sessionId || sessionId;
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
      
      // ✅ Import and validate page rules
      const { getPageLimits, isValidPageIdentifier, validateFileSize, validateFileFormat, ALLOWED_PAGE_IDENTIFIERS } = await import('./pageRules');
      
      // ✅ CRITICAL: Validate pageIdentifier against allowed values
      if (!isValidPageIdentifier(pageIdentifier)) {
        return res.status(400).json({
          error: 'Invalid page identifier',
          message: `Page identifier "${pageIdentifier}" is not allowed`,
          allowedPages: ALLOWED_PAGE_IDENTIFIERS
        });
      }
      
      const pageLimits = getPageLimits(pageIdentifier);
      if (!pageLimits) {
        return res.status(400).json({
          error: 'Invalid page configuration',
          message: `No limits configured for page identifier: ${pageIdentifier}`,
          pageIdentifier
        });
      }
      
      console.log(`🔧 COMPRESSION: pageIdentifier="${pageIdentifier}", sessionId="${sessionId}"`);
      
      // ✅ Validate authentication requirements
      if (pageLimits.requiresAuth && !user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: `${pageLimits.displayName} requires user authentication`,
          pageIdentifier
        });
      }
      
      // ✅ CRITICAL: Enforce payment requirements for paid pages
      if (pageLimits.requiresPayment && user) {
        const hasActiveSubscription = user.isPremium && user.subscriptionStatus === 'active';
        const hasValidTestPremium = user.testPremiumExpiresAt && new Date(user.testPremiumExpiresAt) > new Date();
        
        // Check specific payment requirements per page
        if (pageIdentifier === 'test-1-dollar' && !hasValidTestPremium) {
          return res.status(402).json({
            error: 'Payment required',
            message: 'Test Premium ($1) subscription required for this page',
            pageIdentifier,
            requiredPayment: pageLimits.paymentAmount,
            subscriptionType: 'test-premium'
          });
        }
        
        if ((pageIdentifier === 'premium-29' || pageIdentifier === 'enterprise-99') && !hasActiveSubscription) {
          return res.status(402).json({
            error: 'Payment required', 
            message: `${pageLimits.displayName} subscription required for this page`,
            pageIdentifier,
            requiredPayment: pageLimits.paymentAmount,
            subscriptionType: pageIdentifier === 'premium-29' ? 'premium' : 'enterprise'
          });
        }
        
        console.log(`✅ Payment verification passed for ${pageIdentifier}: user has required subscription`);
      }
      
      // ✅ Validate file constraints for each file
      for (const file of files) {
        // File size validation
        const sizeValidation = validateFileSize(file, pageIdentifier);
        if (!sizeValidation.valid) {
          return res.status(400).json({ 
            error: "File size limit exceeded", 
            message: sizeValidation.error,
            pageIdentifier,
            fileName: file.originalname
          });
        }
        
        // File format validation
        const formatValidation = validateFileFormat(file.originalname, pageIdentifier);
        if (!formatValidation.valid) {
          return res.status(400).json({ 
            error: "File format not supported", 
            message: formatValidation.error,
            pageIdentifier,
            fileName: file.originalname
          });
        }
      }
      
      // Check batch limits (max 20 files for all users)
      if (files.length > 20) {
        return res.status(400).json({ 
          error: "Batch size limit exceeded", 
          message: "Maximum 20 files per batch",

        });
      }

      // Settings already parsed and validated above ✅

      // Map pageIdentifier to plan configuration (PAGE_LIMITS equivalent)
      const getPagePlan = (pageId: string) => {
        switch (pageId) {
          case 'free-no-auth':
          case '/':
            return 'anonymous';
          case 'free-auth':
          case '/compress-free':
            return 'free';
          case 'test-1-dollar':
          case '/test-premium':
            return 'test_premium';
          case 'premium-29':
          case '/compress-premium':
            return 'pro';
          case 'enterprise-99':
          case '/compress-enterprise':
            return 'enterprise';
          case 'cr2-free':
          case '/convert/cr2-to-jpg':
            return 'cr2-free';
          default:
            return null;
        }
      };

      const planId = getPagePlan(pageIdentifier);
      if (!planId) {
        return res.status(400).json({ 
          error: 'Invalid page identifier',
          message: `Unsupported page identifier: ${pageIdentifier}`,
          pageIdentifier
        });
      }

      const limits = getUnifiedPlan(planId);
      console.log(`🔧 Page-specific limits for ${pageIdentifier} (${planId}):`, limits);

      // Check page-specific usage limits BEFORE processing
      const finalSessionId = sessionId || getSessionIdFromRequest(req);

      // ✅ Check usage limits using DualUsageTracker (single source of truth)
      let userType = 'anonymous';
      if (user) {
        const userData = await storage.getUser((user as any)?.claims?.sub);
        userType = userData?.subscriptionTier || 'free';
      }
      
      const dualTracker = new DualUsageTracker((user as any)?.claims?.sub, finalSessionId, userType);
      
      // Check limits for each file
      for (const file of files) {
        const canPerform = await dualTracker.canPerformOperation(file.originalname, file.size, pageIdentifier);
        if (!canPerform.allowed) {
          return res.status(429).json({
            error: 'Usage limit exceeded',
            message: canPerform.reason,
            pageIdentifier,
            usage: canPerform.usage,
            limits: canPerform.limits
          });
        }
      }

      console.log(`✅ DualUsageTracker check passed for ${pageIdentifier}: ${files.length} operations allowed`);

      // Apply Free user optimizations for speed
      if (!user) { // Guest/Free user
        // Maintain quality but optimize algorithm for speed instead
        settings.compressionAlgorithm = 'standard'; // Use standard instead of aggressive compression
      }

      const results = [];
      const jobs = [];
      
      console.log("Compression settings received:", settings);
      console.log("Files to process:", files.map(f => ({ name: f.originalname, ext: f.originalname.split('.').pop() })));
      console.log("=== PROCESSING FILES WITH SHARP + IMAGEMAGICK ===");
      
      // Create database jobs for each file and format combination
      for (const file of files) {
        // Handle multiple output formats
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
        console.log(`File: ${file.originalname}, extension: ${fileExtension}, settings.outputFormat: ${settings.outputFormat}`);
        
        let outputFormats = Array.isArray(settings.outputFormat) 
          ? settings.outputFormat 
          : settings.outputFormat === 'keep-original' 
            ? [fileExtension] 
            : [settings.outputFormat];
            
        console.log(`Determined outputFormats: [${outputFormats.join(', ')}]`);

        // Create a separate job for each format
        console.log(`File: ${file.originalname}, outputFormats array: [${outputFormats.join(', ')}], settings.outputFormat: ${settings.outputFormat}`);
        for (const outputFormat of outputFormats) {
          console.log(`Creating compression job for user ${user?.id}, file: ${file.originalname}, format: ${outputFormat}`);
          const job = await storage.createCompressionJob({
            userId: user?.id || null,
            sessionId: req.sessionID, // For guest users
            originalFilename: file.originalname,
            originalSize: file.size,
            status: "pending",
            qualityLevel: "custom",
            resizeOption: settings.resizeOption,
            outputFormat: outputFormat,
            originalPath: file.path,
            originalFormat: file.mimetype.split('/')[1], // Add required field
            compressedSize: null,
            compressionRatio: null,
            errorMessage: null,
            compressedPath: null,
          });
          
          console.log(`Created job ${job.id} for user ${user?.id || 'guest'}`);
          jobs.push({ job, file, outputFormat });
        }
      }
      
      // Process jobs and update them
      for (const { job, file, outputFormat } of jobs) {
        try {
          // PNG conversion is now enabled for all users including free users
          // Leveraging our optimized compression engine for fast processing
          
          // Map format names to proper file extensions
          const getFileExtension = (format: string) => {
            switch (format) {
              case 'jpeg':
              case 'jpg': return 'jpg';
              case 'png': return 'png';
              case 'webp': return 'webp';
              case 'avif': return 'avif';
              case 'tiff': return 'tiff';
              case 'dng': return 'dng';
              case 'cr2': return 'cr2';
              case 'nef': return 'nef';
              case 'arw': return 'arw';
              case 'orf': return 'orf';
              case 'raf': return 'raf';
              case 'rw2': return 'rw2';
              default: return format;
            }
          };
          
          const fileExtension = getFileExtension(outputFormat);
          const outputPath = path.join("compressed", `${job.id}.${fileExtension}`);
          
          console.log(`Processing ${file.originalname} -> ${outputFormat.toUpperCase()} (parallel)`);
          
          // Check if this is a RAW file that needs special processing
          const inputFormat = getFileFormat(file.originalname);
          const fileExtName = file.originalname.split('.').pop()?.toLowerCase() || '';
          const isRawFile = ['dng', 'cr2', 'nef', 'arw', 'orf', 'raf', 'rw2'].includes(fileExtName);
          console.log(`File: ${file.originalname}, inputFormat: ${inputFormat}, fileExt: ${fileExtName}, isRawFile: ${isRawFile}`);
          
          let result;
          if (isRawFile || inputFormat === 'svg' || inputFormat === 'tiff') {
            // Use the EXACT same engine as /professional-formats/convert
            console.log(`Using professional formats conversion engine for ${file.originalname} -> ${outputFormat}`);
            try {
              // Calculate resize dimensions if needed  
              // Handle both premium page format (resizeOption) and CR2 page format (direct resize parameter)
              const shouldResize = (settings.resizeOption === 'resize-percentage' && settings.resizePercentage && settings.resizePercentage < 100) ||
                                   (settings.resize && settings.resizePercentage && settings.resizePercentage < 100);
              
              result = await processSpecialFormatConversion(
                file.path,
                outputPath,
                isRawFile ? 'raw' : fileExtName, // Professional formats engine expects 'raw' for all RAW files
                outputFormat,
                {
                  quality: settings.quality,
                  resize: shouldResize,
                  resizePercentage: settings.resizePercentage,
                  width: 0, // Will be calculated dynamically from actual image dimensions
                  height: 0, // Will be calculated dynamically from actual image dimensions
                  maintainAspect: true
                }
              );
              console.log(`RAW conversion result:`, result);
            } catch (error) {
              console.error(`RAW conversion failed for ${file.originalname}:`, error);
              throw error; // Re-throw to be caught by the outer error handler
            }
          } else {
            // Use Sharp for standard image formats (JPEG, PNG, WEBP, etc.) - much faster
            let sharpOperation = sharp(file.path);
            
            // Apply resize if specified
            if (settings.resizeOption === 'resize-percentage' && settings.resizePercentage && settings.resizePercentage < 100) {
              const metadata = await sharpOperation.metadata();
              console.log(`Original dimensions: ${metadata.width}x${metadata.height}, Resize to: ${settings.resizePercentage}%`);
              if (metadata.width && metadata.height) {
                const targetWidth = Math.round(metadata.width * (settings.resizePercentage / 100));
                const targetHeight = Math.round(metadata.height * (settings.resizePercentage / 100));
                console.log(`Target dimensions: ${targetWidth}x${targetHeight}`);
                sharpOperation = sharpOperation.resize(targetWidth, targetHeight, {
                  fit: 'inside',
                  withoutEnlargement: true
                });
              }
            }
            
            sharpOperation = sharpOperation.toFormat(outputFormat as keyof sharp.FormatEnum, {
                quality: settings.quality,
                ...(outputFormat === 'png' && { compressionLevel: 8 }),
                ...(outputFormat === 'webp' && { effort: 4 }),
                ...(outputFormat === 'avif' && { effort: 2 }) // Faster AVIF processing
              })
              .toFile(outputPath);
            
            // Apply 30-second timeout
            await Promise.race([
              sharpOperation,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Processing timeout after 30 seconds for ${outputFormat}`)), 30000)
              )
            ]);
            
            const stats = await fs.stat(outputPath);
            result = { success: true, outputSize: stats.size };
          }
          
          // Get file stats
          const originalStats = await fs.stat(file.path);
          const compressedStats = await fs.stat(outputPath);
          // Calculate compression ratio using original file size
          const compressionRatio = Math.round((1 - compressedStats.size / originalStats.size) * 100);
          
          // Update job with compression results - wrap in try/catch to prevent database crashes
          try {
            await storage.updateCompressionJob(job.id, {
              status: "completed",
              compressedPath: outputPath,
              compressedSize: compressedStats.size,
              compressionRatio: compressionRatio,
              outputFormat: outputFormat, // Store the actual output format
            });
          } catch (dbError) {
            console.error(`Database update failed for job ${job.id}:`, dbError);
            // Continue processing even if database update fails
          }

          const resultData = {
            id: job.id, // Use actual job ID
            originalName: file.originalname,
            originalSize: originalStats.size,
            compressedSize: compressedStats.size,
            compressionRatio,
            downloadUrl: `/api/download/${job.id}`,
            originalFormat: file.mimetype.split('/')[1].toUpperCase(),
            outputFormat: outputFormat.toUpperCase(),
            wasConverted: settings.outputFormat !== 'keep-original',
            compressedFileName: path.basename(outputPath),
            settings: {
              quality: settings.quality,
              outputFormat: settings.outputFormat,
              resizeOption: settings.resizeOption,
              compressionAlgorithm: settings.compressionAlgorithm || 'standard',
              webOptimization: settings.webOptimization || 'optimize-web'
            }
          };

          console.log(`${outputFormat.toUpperCase()} compression result for ${file.originalname}:`, {
            size: `${originalStats.size} -> ${compressedStats.size}`,
            ratio: `${compressionRatio}%`,
            quality: result?.qualityUsed || settings.quality // Use actual quality used
          });
          results.push(resultData);
          
        } catch (jobError) {
          console.error(`Error compressing ${file.originalname} to ${outputFormat}:`, jobError);
          // Update job with error - wrap in try/catch to prevent secondary crashes
          try {
            await storage.updateCompressionJob(job.id, {
              status: "failed",
              errorMessage: jobError instanceof Error ? jobError.message : "Compression failed",
            });
          } catch (dbError) {
            console.error(`Database update failed for failed job ${job.id}:`, dbError);
          }
          
          results.push({
            id: job.id,
            originalName: file.originalname,
            error: "Compression failed"
          });
        }
      }
      
      // Clean up original uploaded files (only after processing all formats)
      const processedFiles = new Set();
      for (const { file } of jobs) {
        if (!processedFiles.has(file.path)) {
          try {
            await fs.unlink(file.path);
            processedFiles.add(file.path);
          } catch (unlinkError) {
            console.log(`Could not clean up ${file.path}:`, unlinkError);
          }
        }
      }
      
      // Track usage for successful compressions using DualUsageTracker
      const successfulJobs = results.filter(r => !r.error);
      if (successfulJobs.length > 0) {
        // Record each successful operation with DualUsageTracker
        for (const result of successfulJobs) {
          try {
            console.log(`🔧 Recording operation: ${result.originalName} (${result.originalSize} bytes) on page ${pageIdentifier}`);
            await dualTracker.recordOperation(result.originalName, result.originalSize, pageIdentifier);
            console.log(`✅ Operation recorded successfully for ${result.originalName}`);
          } catch (recordError) {
            console.error(`❌ Failed to record operation for ${result.originalName}:`, recordError);
          }
        }
        
        console.log(`✅ Recorded ${successfulJobs.length} successful operations via DualUsageTracker`);
      }
      
      // Generate batch ID and store file list for ZIP download
      const batchId = randomUUID();
      const successfulFiles = results
        .filter(r => !r.error && r.compressedFileName)
        .map(r => r.compressedFileName);
      
      // Store batch info in memory (you could use Redis in production)
      global.batchFiles = global.batchFiles || {};
      global.batchFiles[batchId] = {
        files: successfulFiles,
        timestamp: Date.now()
      };
      
      res.json({ 
        results,
        batchId: batchId,
        batchDownloadUrl: `/api/download-zip/${batchId}`
      });
      
    } catch (error) {
      console.error("Compression error:", error);
      res.status(500).json({ error: "Compression failed" });
    }
  });

  // Download endpoint for compressed files by job ID
  app.get("/api/download/compressed/:jobId", async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const job = await storage.getCompressionJob(jobId);
      
      if (!job || job.status !== "completed") {
        return res.status(404).json({ error: "Compressed file not found" });
      }
      
      // Generate a user-friendly filename
      const originalName = job.originalFilename;
      const outputFormat = job.outputFormat || 'jpeg';
      const extension = outputFormat === 'jpeg' ? '.jpg' : `.${outputFormat}`;
      const baseName = path.parse(originalName).name;
      const downloadName = `${baseName}_compressed${extension}`;
      
      // Priority 1: If CDN URL is available, redirect to it with download headers
      if (job.cdnUrl) {
        console.log(`🌐 Redirecting download to CDN: ${job.cdnUrl}`);
        // For downloads from CDN, we redirect with appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        return res.redirect(302, job.cdnUrl);
      }
      
      // Priority 2: Fallback to local file download
      if (!job.compressedPath) {
        return res.status(404).json({ error: "Compressed file not found" });
      }
      
      // Check if local file exists
      await fs.access(job.compressedPath);
      
      // Set proper headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      console.log(`📁 Serving local download: ${job.compressedPath}`);
      res.download(job.compressedPath, downloadName, (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(404).json({ error: "File not found" });
          }
        }
      });
    } catch (error) {
      console.error("File access error:", error);
      res.status(404).json({ error: "File not found" });
    }
  });

  // Image serving endpoint for thumbnails (CDN-first, local fallback)
  app.get("/api/image/:jobId", async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const job = await storage.getCompressionJob(jobId);
      
      if (!job || job.status !== "completed") {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Priority 1: Redirect to CDN URL if available
      if (job.cdnUrl) {
        console.log(`🌐 Serving from CDN: ${job.cdnUrl}`);
        return res.redirect(302, job.cdnUrl);
      }
      
      // Priority 2: Fallback to local file serving
      if (!job.compressedPath) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Check if local file exists
      await fs.access(job.compressedPath);
      
      // Determine content type based on file extension or output format
      const outputFormat = job.outputFormat || 'jpeg';
      let contentType = 'image/jpeg'; // default
      switch (outputFormat.toLowerCase()) {
        case 'png': contentType = 'image/png'; break;
        case 'webp': contentType = 'image/webp'; break;
        case 'avif': contentType = 'image/avif'; break;
        case 'tiff': case 'tif': contentType = 'image/tiff'; break;
        case 'jpg': case 'jpeg': contentType = 'image/jpeg'; break;
        default: contentType = 'image/jpeg';
      }
      
      // Set proper headers for image display (not download)
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Send the local file directly
      console.log(`📁 Serving local file: ${job.compressedPath}`);
      res.sendFile(path.resolve(job.compressedPath));
    } catch (error) {
      console.error("Image serving error:", error);
      res.status(404).json({ error: "Image not found" });
    }
  });

  // ZIP download endpoint
  app.get("/api/download-zip/:batchId", async (req, res) => {
    try {
      const batchId = req.params.batchId;
      const compressedDir = "compressed";
      
      // Get batch info from memory
      global.batchFiles = global.batchFiles || {};
      const batchInfo = global.batchFiles[batchId];
      
      if (!batchInfo) {
        return res.status(404).json({ error: "Batch not found or expired" });
      }
      
      // Check if batch is still valid (within 24 hours for better UX)
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (batchInfo.timestamp < twentyFourHoursAgo) {
        delete global.batchFiles[batchId];
        return res.status(404).json({ error: "Batch expired" });
      }
      
      const validFiles = [];
      
      // Only include files from this specific batch
      for (const filename of batchInfo.files) {
        try {
          // Try compressed directory first
          let filePath = path.join(compressedDir, filename);
          try {
            await fs.access(filePath);
            validFiles.push({
              name: filename,
              path: filePath
            });
            continue;
          } catch (err) {
            // If not found in compressed/, try converted/ directory
            filePath = path.join("converted", filename);
            await fs.access(filePath);
            validFiles.push({
              name: filename,
              path: filePath
            });
          }
        } catch (err) {
          console.log(`File ${filename} not found in either compressed/ or converted/, skipping`);
        }
      }
      
      if (validFiles.length === 0) {
        return res.status(404).json({ error: "No files found for download" });
      }
      
      console.log(`Creating ZIP for batch ${batchId} with ${validFiles.length} files:`, validFiles.map(f => f.name));
      
      // Set response headers for ZIP download
      const zipFilename = `compressed_images_${batchId.slice(0, 8)}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      
      // Create zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Best compression
      });
      
      // Handle archive errors
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create archive' });
        }
      });
      
      // Pipe archive to response
      archive.pipe(res);
      
      // Add files to archive with clean names
      for (const file of validFiles) {
        try {
          await fs.access(file.path);
          // Use clean filename without timestamp prefix
          const cleanName = file.name.replace(/^compressed_\d+_/, '');
          archive.file(file.path, { name: cleanName });
        } catch (err) {
          console.error(`Failed to add file ${file.name} to archive:`, err);
        }
      }
      
      // Finalize the archive
      await archive.finalize();
      
      // Note: Batch info cleanup is handled by the 24-hour expiration check
      // No immediate cleanup to allow multiple downloads of the same ZIP
      
    } catch (error) {
      console.error("ZIP download error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create ZIP archive" });
      }
    }
  });

  // Create comprehensive ZIP from multiple compression results
  app.post("/api/create-session-zip", async (req, res) => {
    try {
      const { resultIds } = req.body;
      
      if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
        return res.status(400).json({ error: "No result IDs provided" });
      }
      
      const validFiles = [];
      
      // Find all completed jobs and converted files for the provided result IDs
      for (const resultId of resultIds) {
        try {
          // First try compression jobs from storage
          const job = await storage.getCompressionJob(resultId);
          if (job && job.compressedPath && job.status === "completed") {
            // Check if file exists
            await fs.access(job.compressedPath);
            
            // Extract filename from the path
            const filename = path.basename(job.compressedPath);
            validFiles.push({
              name: filename,
              path: job.compressedPath,
              originalName: job.originalFilename
            });
          } else {
            // If not found in compression jobs, check converted/ directory (special formats)
            // Check TIFF first since JPG might be a preview file, not the actual conversion
            const specialFormatExtensions = ['tiff', 'avif', 'webp', 'png', 'jpg', 'jpeg'];
            let filePath = null;
            
            for (const ext of specialFormatExtensions) {
              const potentialPath = path.join("converted", `${resultId}.${ext}`);
              try {
                await fs.access(potentialPath);
                filePath = potentialPath;
                break;
              } catch (error) {
                // File doesn't exist with this extension, try next
              }
            }
            
            if (filePath) {
              const filename = path.basename(filePath);
              validFiles.push({
                name: filename,
                path: filePath,
                originalName: `converted_image.${path.extname(filePath).substring(1)}`
              });
            }
          }
        } catch (err) {
          console.log(`File for result ${resultId} not found, skipping`);
        }
      }
      
      if (validFiles.length === 0) {
        return res.status(404).json({ error: "No valid files found for download" });
      }
      
      // Generate batch ID and store file list for comprehensive ZIP
      const batchId = randomUUID();
      const fileNames = validFiles.map(f => f.name);
      
      // Store batch info in memory 
      global.batchFiles = global.batchFiles || {};
      global.batchFiles[batchId] = {
        files: fileNames,
        timestamp: Date.now()
      };
      
      console.log(`Created comprehensive ZIP batch ${batchId} with ${validFiles.length} files from session`);
      
      res.json({ 
        batchId: batchId,
        batchDownloadUrl: `/api/download-zip/${batchId}`,
        fileCount: validFiles.length
      });
      
    } catch (error) {
      console.error("Session ZIP creation error:", error);
      res.status(500).json({ error: "Failed to create session ZIP" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req, res) => {
    console.log("GET /api/auth/user called");
    console.log("Session ID:", req.sessionID);
    console.log("Session userId:", req.session.userId);
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    
    if (!req.session.userId) {
      console.log("No userId in session, returning 401");
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("User not found in database, destroying session");
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("User found:", user.email);
      req.user = user;
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // ✅ USER-TYPE-BASED UNIVERSAL COUNTER API - NO CACHE FOR REAL-TIME UPDATES
  app.get('/api/universal-usage-stats', async (req, res) => {
    try {
      // Disable caching for real-time updates
      res.setHeader('Cache-Control', 'no-store');
      
      const sessionId = req.sessionID;
      const userId = req.user?.id;
      
      // Determine user type
      let userType = 'anonymous';
      if (userId) {
        const user = await storage.getUser(userId);
        userType = user?.subscriptionTier || 'free';
      }
      
      // Create tracker instance - use exact same logic as recordOperation
      const tracker = new DualUsageTracker(userId, sessionId, userType);
      const stats = await tracker.getUsageStats();
      
      // Debug logging to trace the issue
      console.log(`🔧 Stats API called: userId=${userId}, sessionId=${sessionId}, userType=${userType}`);
      console.log(`🔧 Stats returned:`, JSON.stringify(stats, null, 2));
      
      res.json({
        userType,
        stats,
        limits: OPERATION_CONFIG.limits[userType as keyof typeof OPERATION_CONFIG.limits]
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
  });

  // Check before processing
  app.post('/api/check-operation', async (req, res) => {
    const { filename, fileSize, pageIdentifier } = req.body;
    const sessionId = req.sessionID;
    const userId = req.user?.id;
    
    let userType = 'anonymous';
    if (userId) {
      const user = await storage.getUser(userId);
      userType = user?.subscriptionTier || 'free';
    }
    
    const tracker = new DualUsageTracker(userId, sessionId, userType);
    const result = await tracker.canPerformOperation(filename, fileSize, pageIdentifier);
    
    res.json(result);
  });

  // ✅ UNIFIED PAGE-AWARE USAGE STATS API
  app.get('/api/usage-stats/:pageIdentifier', async (req, res) => {
    try {
      console.log(`🔧 UNIFIED USAGE STATS: pageIdentifier=${req.params.pageIdentifier}`);
      const { pageIdentifier } = req.params;
      const sessionId = getSessionIdFromRequest(req);
      
      // ✅ Use new page-specific rules system
      const { getPageLimits, isValidPageIdentifier, ALLOWED_PAGE_IDENTIFIERS } = await import('./pageRules');
      
      // ✅ Validate pageIdentifier against allowed values
      if (!isValidPageIdentifier(pageIdentifier)) {
        return res.status(400).json({
          error: 'Invalid page identifier',
          message: `Page identifier "${pageIdentifier}" is not allowed`,
          allowedPages: ALLOWED_PAGE_IDENTIFIERS
        });
      }
      
      // ✅ Get page-specific limits from new rules system
      const pageLimits = getPageLimits(pageIdentifier);
      const PAGE_LIMITS = {
        daily: pageLimits.daily,
        hourly: pageLimits.hourly,
        monthly: pageLimits.monthly
      };
      
      // Get page-specific usage using DualUsageTracker
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const userId = isUserAuthenticated && req.user ? req.user.claims?.sub : req.session?.userId || undefined;
      
      // Determine user type for DualUsageTracker
      let userType = 'anonymous';
      if (userId) {
        const user = await storage.getUser(userId);
        userType = user?.subscriptionTier || 'free';
      }
      
      const dualTracker = new DualUsageTracker(userId, sessionId, userType);
      const statsResult = await dualTracker.getUsageStats();
      const usage = statsResult.regular; // Get regular usage stats for display
      
      return res.json({
        pageIdentifier,
        operations: {
          dailyUsed: usage.regularDaily,
          dailyLimit: PAGE_LIMITS.daily,
          used: usage.regularMonthly,
          limit: PAGE_LIMITS.monthly
        }
      });
      
    } catch (error) {
      console.error('Error fetching page-specific usage stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch usage statistics',
        message: 'Internal server error'
      });
    }
  });

  // Get usage statistics (works for both authenticated and anonymous users)
  app.get('/api/usage-stats', requireScopeFromAuth, async (req, res) => {
    try {
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      // Handle both session-based and OAuth authentication
      let userId = isUserAuthenticated && req.user ? req.user.claims?.sub : 
                   req.session?.userId || undefined;
      
      // Enhanced fallback for session authentication
      if (!userId && req.session && req.session.userId) {
        console.log(`🐛 DEBUG usage-stats: Using session userId fallback: ${req.session.userId}`);
        userId = req.session.userId;
      }
      
      const sessionId = getSessionIdFromRequest(req);
      
      // Get pageIdentifier-based usage stats (enforced by middleware) 
      const pageIdentifier = (req as any).context?.pageIdentifier || '/'; // Set by pageIdentifierMiddleware
      const scope = req.trackingScope!; // Set by requireScopeFromAuth middleware
      console.log(`🔧 PAGE IDENTIFIER usage-stats: userId=${userId}, pageIdentifier=${pageIdentifier}, scope=${scope}, sessionId=${sessionId}`);
      
      // Use new pageIdentifier tracking system
      const { getPageIdentifierUsageStats } = await import('./pageIdentifierOperationCounter');
      const operationStats = await getPageIdentifierUsageStats(pageIdentifier, userId, sessionId, req);
      
      // Check for lead magnet credits if user is authenticated
      let leadMagnetCredits = null;
      if (isUserAuthenticated && req.user?.email) {
        try {
          leadMagnetCredits = await storage.checkLeadMagnetCredits(req.user.email);
        } catch (error) {
          console.log("No lead magnet credits found for user");
        }
      }
      
      // Also get legacy credit stats for backward compatibility during transition
      const legacyStats = await UsageTracker.getUsageStats(isUserAuthenticated ? req.user : null, req);
      
      // Calculate total available operations including lead magnet credits
      let totalAvailableOperations = operationStats.monthlyUsed;
      let totalOperationLimit = operationStats.monthlyLimit;
      let bonusCredits = 0;
      
      if (leadMagnetCredits?.hasCredits) {
        bonusCredits = leadMagnetCredits.creditsRemaining;
        // Add lead magnet credits to available operations
        totalOperationLimit = (operationStats.monthlyLimit || 0) + leadMagnetCredits.creditsGranted;
      }
      
      // Return unified stats with operation-based structure
      const unifiedStats = {
        // New unified operation structure
        operations: {
          used: operationStats.monthlyUsed,
          limit: totalOperationLimit,
          remaining: totalOperationLimit ? Math.max(0, totalOperationLimit - operationStats.monthlyUsed) : null,
          planId: operationStats.planId,
          planName: operationStats.planName,
          isAnonymous: operationStats.isAnonymous,
          dailyUsed: operationStats.dailyUsed,
          dailyLimit: operationStats.dailyLimit,
          hourlyUsed: operationStats.hourlyUsed,
          hourlyLimit: operationStats.hourlyLimit,
          // Lead magnet bonus info
          bonusCredits: bonusCredits,
          bonusCreditsExpiry: leadMagnetCredits?.expiresAt || null,
        },
        
        // Legacy credit structure for backward compatibility
        totalCredits: legacyStats.usage?.totalCredits || 0,
        usedCredits: legacyStats.usage?.usedCredits || 0,
        remainingCredits: legacyStats.usage?.remainingCredits || 0,
        freeCredits: legacyStats.usage?.freeCredits || 0,
        purchasedCredits: legacyStats.usage?.purchasedCredits || 0,
        
        // Keep existing structure for now
        usage: legacyStats.usage
      };
      
      res.json(unifiedStats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage statistics" });
    }
  });

  // Helper function for page-specific usage stats
  async function getPageSpecificUsageStats(pageIdentifier: string, req: any, res: any) {
    try {
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      // Handle both session-based and OAuth authentication
      let userId = isUserAuthenticated && req.user ? req.user.claims?.sub : 
                   req.session?.userId || undefined;
      
      // Enhanced fallback for session authentication
      if (!userId && req.session && req.session.userId) {
        console.log(`🐛 DEBUG ${pageIdentifier} usage-stats: Using session userId fallback: ${req.session.userId}`);
        userId = req.session.userId;
      }
      
      const sessionId = getSessionIdFromRequest(req);
      
      console.log(`🔧 PAGE SPECIFIC usage-stats: pageIdentifier=${pageIdentifier}, userId=${userId}, sessionId=${sessionId}`);
      
      // Use new pageIdentifier tracking system with specific pageIdentifier
      const { getPageIdentifierUsageStats } = await import('./pageIdentifierOperationCounter');
      const operationStats = await getPageIdentifierUsageStats(pageIdentifier, userId, sessionId, req);
      
      // Check for lead magnet credits if user is authenticated
      let leadMagnetCredits = null;
      if (isUserAuthenticated && req.user?.email) {
        try {
          leadMagnetCredits = await storage.checkLeadMagnetCredits(req.user.email);
        } catch (error) {
          console.log("No lead magnet credits found for user");
        }
      }
      
      // Also get legacy credit stats for backward compatibility during transition
      const legacyStats = await UsageTracker.getUsageStats(isUserAuthenticated ? req.user : null, req);
      
      // Calculate total available operations including lead magnet credits
      let totalAvailableOperations = operationStats.monthlyUsed;
      let totalOperationLimit = operationStats.monthlyLimit;
      let bonusCredits = 0;
      
      if (leadMagnetCredits?.hasCredits) {
        bonusCredits = leadMagnetCredits.creditsRemaining;
        // Add lead magnet credits to available operations
        totalOperationLimit = (operationStats.monthlyLimit || 0) + leadMagnetCredits.creditsGranted;
      }
      
      // Return unified stats with operation-based structure
      const unifiedStats = {
        // Page identifier for verification
        pageIdentifier: pageIdentifier,
        
        // New unified operation structure
        operations: {
          used: operationStats.monthlyUsed,
          limit: totalOperationLimit,
          remaining: totalOperationLimit ? Math.max(0, totalOperationLimit - operationStats.monthlyUsed) : null,
          planId: operationStats.planId,
          planName: operationStats.planName,
          isAnonymous: operationStats.isAnonymous,
          dailyUsed: operationStats.dailyUsed,
          dailyLimit: operationStats.dailyLimit,
          hourlyUsed: operationStats.hourlyUsed,
          hourlyLimit: operationStats.hourlyLimit,
          // Lead magnet bonus info
          bonusCredits: bonusCredits,
          bonusCreditsExpiry: leadMagnetCredits?.expiresAt || null,
        },
        
        // Legacy credit structure for backward compatibility
        totalCredits: legacyStats.usage?.totalCredits || 0,
        usedCredits: legacyStats.usage?.usedCredits || 0,
        remainingCredits: legacyStats.usage?.remainingCredits || 0,
        freeCredits: legacyStats.usage?.freeCredits || 0,
        purchasedCredits: legacyStats.usage?.purchasedCredits || 0,
        
        // Keep existing structure for now
        usage: legacyStats.usage
      };
      
      res.json(unifiedStats);
    } catch (error) {
      console.error(`Error fetching ${pageIdentifier} usage stats:`, error);
      res.status(500).json({ message: "Failed to fetch usage statistics" });
    }
  }

  // Separate usage endpoints for each page-specific system
  
  // Main landing page usage stats
  app.get('/api/usage-stats/main', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });
  
  // Free tier usage stats
  app.get('/api/usage-stats/free', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/compress-free';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });
  
  // Premium tier usage stats  
  app.get('/api/usage-stats/premium', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/compress-premium';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });
  
  // Test premium usage stats
  app.get('/api/usage-stats/test-premium', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/test-premium';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });
  
  // Enterprise usage stats
  app.get('/api/usage-stats/enterprise', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/compress-enterprise';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });
  
  // CR2 converter usage stats
  app.get('/api/usage-stats/cr2-converter', requireScopeFromAuth, async (req, res) => {
    const pageIdentifier = (req as any).context?.pageIdentifier || (req as any).context?.pageIdentifierCanonical || '/convert/cr2-to-jpg';
    await getPageSpecificUsageStats(pageIdentifier, req, res);
  });

  // Universal Usage Tracker API endpoints
  app.get('/api/usage', async (req, res) => {
    try {
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const userId = isUserAuthenticated && req.user ? req.user.claims?.sub : req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user limits based on user type/tier  
      const { determineUserType, USER_LIMITS } = await import('./userLimits');
      
      const userType = determineUserType(req.user?.subscription);
      const limits = USER_LIMITS[userType];
      
      // Get usage from unified tracking system
      const { UnifiedOperationCounter } = await import('./unifiedOperationCounter');
      const usage = await UnifiedOperationCounter.getUsageStats(userId);
      
      res.json({
        used: usage.monthlyUsed,
        limit: limits.monthly.total,
        remaining: limits.monthly.total - usage.monthlyUsed
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
      res.status(500).json({ error: 'Failed to fetch usage data' });
    }
  });

  app.post('/api/record-usage', async (req, res) => {
    try {
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const userId = isUserAuthenticated && req.user ? req.user.claims?.sub : req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Record usage through unified tracking system
      const { UnifiedOperationCounter } = await import('./unifiedOperationCounter');
      const operationContext = {
        userId,
        operationType: 'compression' as const,
        fileFormat: 'generic',
        fileSizeMb: 1,
        interface: 'web' as const,
        req
      };
      await UnifiedOperationCounter.recordOperation(operationContext);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording usage:', error);
      res.status(500).json({ error: 'Failed to record usage' });
    }
  });

  // Loyalty program - social share tracking endpoint with rate limiting
  app.post('/api/loyalty-share', async (req, res) => {
    try {
      const { platform, postUrl } = req.body;
      
      if (!platform) {
        return res.status(400).json({ error: "Platform is required" });
      }

      // Define reward structure
      const rewards: { [key: string]: number } = {
        'twitter': 10,
        'linkedin': 15,
        'facebook': 10,
        'instagram': 12,
        'pinterest': 8,
        'reddit': 15
      };

      const operationsToAdd = rewards[platform];
      if (!operationsToAdd) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      // Check if user is authenticated
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const userId = isUserAuthenticated && req.user ? req.user.claims?.sub : undefined;
      const sessionId = req.headers['x-session-id'] as string;
      const identifier = userId || sessionId;

      if (!identifier) {
        return res.status(400).json({ error: "Unable to identify user session" });
      }

      // Rate limiting: Check if user has already claimed reward for this platform today
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const rateLimitKey = `loyalty_${identifier}_${platform}_${dateKey}`;
      
      // Simple in-memory rate limiting (in production, use Redis or database)
      if (UsageTracker.hasClaimedTodayReward(rateLimitKey)) {
        return res.status(429).json({ 
          error: "Daily limit reached", 
          message: `You can only earn rewards once per day per platform. Try again tomorrow!`,
          nextClaimTime: "tomorrow"
        });
      }

      // Mark this platform as claimed for today
      UsageTracker.markRewardClaimed(rateLimitKey);

      // If URL provided, store it for future verification
      if (postUrl) {
        console.log(`URL verification: User ${identifier} shared on ${platform}: ${postUrl}`);
        // Store for later verification - in production, add to verification queue
      }

      // Award operations (works for both authenticated and guest users)
      await UsageTracker.addBonusOperations(userId, sessionId, operationsToAdd, `Social share on ${platform}`);

      res.json({ 
        success: true, 
        operations: operationsToAdd,
        platform: platform,
        message: `You earned ${operationsToAdd} bonus operations for sharing on ${platform}!`,
        nextClaimTime: "tomorrow"
      });

    } catch (error) {
      console.error("Loyalty share tracking error:", error);
      res.status(500).json({ error: "Failed to process loyalty share" });
    }
  });

  // Subscription info endpoint
  app.get('/api/subscription-info', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if test-premium has expired or is not active
      let effectiveTier = user.subscriptionTier || 'free_registered';
      let subscriptionStatus = user.subscriptionStatus || 'inactive';
      let isExpired = false;
      
      if (effectiveTier === 'test_premium' && user.subscriptionEndDate) {
        const now = new Date();
        const endDate = new Date(user.subscriptionEndDate);
        
        if (now > endDate) {
          // Test premium has expired, but haven't run cleanup yet
          effectiveTier = 'free_registered';
          subscriptionStatus = 'expired';
          isExpired = true;
        }
      }

      // Determine premium status - must be active/paid tier OR manual premium flag
      let isPremium = false;
      
      if (isExpired || subscriptionStatus === 'expired' || subscriptionStatus === 'cancelled') {
        // Explicitly expired or cancelled
        isPremium = false;
      } else if (user.isPremium === true) {
        // Manual premium grant (for testing)
        isPremium = true;
      } else if (effectiveTier === 'pro' || effectiveTier === 'enterprise') {
        // Paid tiers with active subscription
        isPremium = subscriptionStatus === 'active';
      } else if (effectiveTier === 'test_premium') {
        // Test premium only if status is active and not expired
        isPremium = subscriptionStatus === 'active';
      } else {
        // Free tiers
        isPremium = false;
      }

      // Basic subscription info
      const subscriptionInfo = {
        isPremium,
        subscriptionStatus,
        subscriptionTier: effectiveTier,
        subscriptionPlan: effectiveTier, // Legacy field
        subscriptionEndDate: user.subscriptionEndDate || null,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        timeUntilExpiry: effectiveTier === 'test_premium' && user.subscriptionEndDate ? 
          Math.max(0, new Date(user.subscriptionEndDate).getTime() - new Date().getTime()) : null
      };

      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error fetching subscription info:", error);
      res.status(500).json({ message: "Failed to fetch subscription info" });
    }
  });

  // Check email availability
  app.post('/api/auth/check-email', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ message: "Failed to check email" });
    }
  });

  // Signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        });
      }

      const { email, password, firstName, lastName } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Generate email verification token
      const verificationToken = emailService.generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profileImageUrl: null,
        isEmailVerified: "false",
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        lastLogin: null,
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email, 
          verificationToken, 
          user.firstName || undefined
        );
        console.log(`Verification email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with signup even if email fails
      }

      // Set session
      req.session.userId = user.id;

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Account created successfully. Please check your email to verify your account."
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Manually save session to ensure it's persisted
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for user:", user.id);
            resolve(undefined);
          }
        });
      });

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Note: Logout is handled by Replit Auth at /api/logout in replitAuth.ts

  // Email verification endpoint
  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Check if already verified
      if (user.isEmailVerified === "true") {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Verify the user's email
      const verifiedUser = await storage.verifyUserEmail(user.id);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(
          verifiedUser.email, 
          verifiedUser.firstName || undefined
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if welcome email fails
      }

      res.json({ 
        message: "Email verified successfully! Welcome to JPEG Compressor.",
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          firstName: verifiedUser.firstName,
          lastName: verifiedUser.lastName,
          isEmailVerified: true,
        }
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isEmailVerified === "true") {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = emailService.generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email, 
          verificationToken, 
          user.firstName || undefined
        );
        res.json({ message: "Verification email sent successfully" });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });



  // Cancel subscription endpoint
  app.post('/api/cancel-subscription', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel subscription at period end (don't immediately cancel)
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({
        message: "Subscription cancelled successfully",
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get current subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ status: 'inactive', subscription: null });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        status: subscription.status,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: subscription.items.data[0]?.price?.nickname || 'Premium Plan',
        },
      });
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });


  // Legacy Stripe webhook endpoint - REPLACED by /api/webhooks/stripe-new in newSubscriptionRoutes.ts
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const user = await storage.getUserByEmail(customer.email);
          if (user) {
            await storage.updateSubscriptionStatus(
              user.id,
              subscription.status,
              new Date((subscription as any).current_period_end * 1000)
            );

            // Send subscription confirmation email for active subscriptions
            if (subscription.status === 'active') {
              try {
                // Determine plan details based on price
                const priceId = subscription.items.data[0]?.price?.id;
                let planName = 'Premium';
                let amount = '$9.99';
                
                // Map price IDs to plan names
                if (priceId?.includes('business')) {
                  planName = 'Business';
                  amount = '$29.99';
                } else if (priceId?.includes('enterprise')) {
                  planName = 'Enterprise';
                  amount = '$99.99';
                }

                await emailService.sendSubscriptionConfirmation(
                  customer.email,
                  user.firstName || 'Valued Customer',
                  {
                    planName,
                    amount,
                    billingPeriod: 'monthly',
                    nextBillingDate: new Date((subscription as any).current_period_end * 1000),
                    subscriptionId: subscription.id
                  }
                );
                console.log(`${planName} subscription confirmation email sent to ${customer.email}`);
              } catch (emailError) {
                console.error('Failed to send subscription confirmation email:', emailError);
              }
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const user = await storage.getUserByEmail(customer.email);
          if (user) {
            await storage.updateSubscriptionStatus(user.id, 'canceled');

            // Send cancellation email
            try {
              await emailService.sendSubscriptionCancellation(
                customer.email,
                user.firstName || 'Valued Customer'
              );
              console.log(`Subscription cancellation email sent to ${customer.email}`);
            } catch (emailError) {
              console.error('Failed to send cancellation email:', emailError);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.customer && invoice.customer_email) {
          const user = await storage.getUserByEmail(invoice.customer_email);
          if (user) {
            try {
              // Send invoice email with payment confirmation
              await emailService.sendInvoiceEmail(
                invoice.customer_email,
                user.firstName || 'Valued Customer',
                {
                  invoiceNumber: invoice.number || `INV-${invoice.id?.slice(-8) || 'UNKNOWN'}`,
                  amount: `$${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
                  paidDate: new Date((invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000),
                  description: 'Premium JPEG Compressor Subscription',
                  invoiceUrl: invoice.hosted_invoice_url || '',
                  period: {
                    start: new Date(invoice.period_start * 1000),
                    end: new Date(invoice.period_end * 1000)
                  }
                }
              );
              console.log(`Invoice email sent to ${invoice.customer_email}`);
            } catch (emailError) {
              console.error('Failed to send invoice email:', emailError);
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Check if this is a credit purchase (has packageId in metadata)
        if (paymentIntent.metadata.packageId) {
          try {
            console.log(`Processing credit purchase payment: ${paymentIntent.id}`);
            
            // Import necessary modules
            const { creditPurchases } = await import('@shared/schema');
            const { db } = await import('./db');
            const { eq } = await import('drizzle-orm');
            
            // Update purchase record to completed
            await db
              .update(creditPurchases)
              .set({ 
                status: 'completed', 
                completedAt: new Date() 
              })
              .where(eq(creditPurchases.stripePaymentIntentId, paymentIntent.id));
            
            // Add credits to user account if authenticated
            const userId = paymentIntent.metadata.userId;
            if (userId && userId !== 'guest') {
              const credits = parseInt(paymentIntent.metadata.credits);
              
              // Get current user
              const user = await storage.getUser(userId);
              if (user) {
                // Add credits to user account
                const newCredits = (user.purchasedCredits || 0) + credits;
                await storage.updateUser(userId, { 
                  purchasedCredits: newCredits 
                });
                
                console.log(`Added ${credits} credits to user ${userId}. Total: ${newCredits}`);
                
                // Send credit-specific confirmation email if we have user email
                if (user.email) {
                  try {
                    // Send enhanced credit purchase confirmation
                    await emailService.sendPaymentConfirmation(
                      user.email,
                      user.firstName || 'Valued Customer',
                      {
                        amount: `$${(paymentIntent.amount / 100).toFixed(2)}`,
                        paymentDate: new Date(),
                        paymentMethod: 'Credit Card',
                        transactionId: paymentIntent.id,
                        credits: credits
                      }
                    );
                    
                    // Also send detailed receipt
                    const packageName = paymentIntent.metadata.packageName || `${credits} Credits`;
                    const pricePerCredit = `${(paymentIntent.amount / 100 / credits).toFixed(3)}¢`;
                    
                    await emailService.sendCreditPurchaseReceipt(
                      user.email,
                      user.firstName || 'Valued Customer',
                      {
                        packageName,
                        credits,
                        amount: `$${(paymentIntent.amount / 100).toFixed(2)}`,
                        transactionId: paymentIntent.id,
                        pricePerCredit
                      }
                    );
                    console.log(`Credit purchase confirmation and receipt sent to ${user.email}`);
                  } catch (emailError) {
                    console.error('Failed to send credit purchase confirmation email:', emailError);
                  }
                }
              }
            }
            
            console.log(`Successfully processed credit purchase for ${paymentIntent.metadata.credits} credits`);
          } catch (error) {
            console.error('Error processing credit purchase:', error);
          }
        }
        // Handle regular subscription payments
        else if (paymentIntent.customer && paymentIntent.receipt_email) {
          const user = await storage.getUserByEmail(paymentIntent.receipt_email);
          if (user) {
            try {
              // Send payment confirmation email
              await emailService.sendPaymentConfirmation(
                paymentIntent.receipt_email,
                user.firstName || 'Valued Customer',
                {
                  amount: `$${(paymentIntent.amount / 100).toFixed(2)}`,
                  paymentDate: new Date(),
                  paymentMethod: 'Credit Card',
                  transactionId: paymentIntent.id
                }
              );
              console.log(`Payment confirmation email sent to ${paymentIntent.receipt_email}`);
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.customer && invoice.customer_email) {
          const user = await storage.getUserByEmail(invoice.customer_email);
          if (user) {
            try {
              // Send payment failure notification
              await emailService.sendPaymentFailureNotification(
                invoice.customer_email,
                user.firstName || 'Valued Customer',
                'Premium', // Plan name - could be determined from invoice
                invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : undefined
              );
              console.log(`Payment failure notification sent to ${invoice.customer_email}`);
            } catch (emailError) {
              console.error('Failed to send payment failure email:', emailError);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Check if this is a credit purchase that failed
        if (paymentIntent.metadata.packageId && paymentIntent.metadata.userId) {
          try {
            const userId = paymentIntent.metadata.userId;
            const user = await storage.getUser(userId);
            
            if (user && user.email) {
              const packageName = paymentIntent.metadata.packageName || `${paymentIntent.metadata.credits} Credits`;
              const amount = `$${(paymentIntent.amount / 100).toFixed(2)}`;
              
              // Send credit purchase failure notification
              await emailService.sendPaymentFailureForCredits(
                user.email,
                user.firstName || 'Valued Customer',
                packageName,
                amount
              );
              console.log(`Credit purchase failure notification sent to ${user.email}`);
              
              // Update purchase record to failed
              const { creditPurchases } = await import('@shared/schema');
              const { db } = await import('./db');
              const { eq } = await import('drizzle-orm');
              
              await db
                .update(creditPurchases)
                .set({ 
                  status: 'failed',
                  completedAt: new Date()
                })
                .where(eq(creditPurchases.stripePaymentIntentId, paymentIntent.id));
            }
          } catch (error) {
            console.error('Failed to process credit purchase payment failure:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Usage monitoring endpoint for automated email triggers
  app.post("/api/monitor-usage", async (req, res) => {
    try {
      const { email, firstName, tierName, compressions, conversions, usagePercent } = req.body;
      
      if (!email || !firstName || !tierName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Send usage warning at 80% threshold
      if (usagePercent >= 80) {
        try {
          await emailService.sendUsageLimitWarning(email, firstName, usagePercent, tierName);
          console.log(`Usage warning email sent to ${email} (${usagePercent}% usage)`);
        } catch (emailError) {
          console.error('Failed to send usage warning email:', emailError);
        }
      }

      // Send promotional upgrade email at 90% threshold
      if (usagePercent >= 90 && tierName.toLowerCase() === 'free') {
        try {
          await emailService.sendTierUpgradePromo(email, firstName, 'free', 'premium');
          console.log(`Upgrade promo email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send upgrade promo email:', emailError);
        }
      }

      res.json({ success: true, message: "Usage monitoring completed" });
    } catch (error: any) {
      console.error("Error monitoring usage:", error);
      res.status(500).json({ error: "Failed to monitor usage" });
    }
  });

  // Send daily usage report (could be called by a cron job)
  app.post("/api/send-daily-report", async (req, res) => {
    try {
      const { email, firstName, stats } = req.body;
      
      if (!email || !firstName || !stats) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await emailService.sendDailyUsageReport(email, firstName, stats);
      console.log(`Daily usage report sent to ${email}`);

      res.json({ success: true, message: "Daily report sent" });
    } catch (error: any) {
      console.error("Error sending daily report:", error);
      res.status(500).json({ error: "Failed to send daily report" });
    }
  });

  // Track conversion operations for specialized landing pages
  app.post("/api/track-operation", async (req, res) => {
    try {
      const { operationType, fileFormat, fileSizeMb, interface: interfaceType } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!operationType || !fileFormat || !fileSizeMb) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get user ID if authenticated
      const userId = req.session?.userId;

      // Use DualUsageTracker for recording operations
      const pageIdentifier = (req as any).context?.pageIdentifier || '/';
      let userType = 'anonymous';
      if (userId) {
        const user = await storage.getUser(userId);
        userType = user?.subscriptionTier || 'free';
      }
      
      const dualTracker = new DualUsageTracker(userId, sessionId, userType);
      // Create a fake filename for tracking - format determines the file type
      const fakeFilename = `file.${fileFormat}`;
      const fileSizeBytes = fileSizeMb * 1024 * 1024;
      await dualTracker.recordOperation(fakeFilename, fileSizeBytes, pageIdentifier);

      console.log(`Tracked ${operationType}: ${fileFormat} file (${fileSizeMb}MB) for ${userId ? 'user ' + userId : 'session ' + sessionId}`);
      res.json({ success: true, message: "Operation tracked successfully" });
    } catch (error: any) {
      console.error("Error tracking operation:", error);
      res.status(500).json({ error: "Failed to track operation" });
    }
  });

  // Development-only: Create master test user
  app.post("/api/dev/create-master-user", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "This endpoint is only available in development" });
      }

      const masterEmail = "master@microjpeg.com";
      const masterPassword = "MasterTest123!";

      // Check if master user already exists
      const existingUser = await storage.getUserByEmail(masterEmail);
      if (existingUser) {
        return res.json({
          message: "Master user already exists",
          email: masterEmail,
          password: masterPassword,
          userId: existingUser.id
        });
      }

      // Create master user
      const hashedPassword = await hashPassword(masterPassword);
      const masterUser = await storage.createUser({
        email: masterEmail,
        password: hashedPassword,
        firstName: "Master",
        lastName: "Test",
        profileImageUrl: null,
        isEmailVerified: "true", // Pre-verified
        emailVerificationToken: null,
        emailVerificationExpires: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionPlan: "free",
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        isPremium: false,
        lastLogin: null,
      });

      res.json({
        message: "Master test user created successfully",
        email: masterEmail,
        password: masterPassword,
        userId: masterUser.id,
        instructions: "Use this user to test all subscription tiers. Use /api/dev/set-user-tier to switch tiers."
      });
    } catch (error: any) {
      console.error("Error creating master user:", error);
      res.status(500).json({ message: "Failed to create master user" });
    }
  });

  // Development-only: Set user tier for testing
  app.post("/api/dev/set-user-tier", isAuthenticated, async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "This endpoint is only available in development" });
      }

      const { tier } = req.body;
      const sessionUser = req.user;
      
      if (!sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!['free', 'premium', 'business', 'enterprise'].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier. Must be: free, premium, business, or enterprise" });
      }

      // Update user tier settings
      let updateData: any = {
        subscriptionPlan: tier,
        subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
        isPremium: tier !== 'free',
        subscriptionEndDate: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      const updatedUser = await storage.updateUserTier(sessionUser.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: `User tier set to ${tier.toUpperCase()}`,
        userId: updatedUser.id,
        tier: tier,
        isPremium: updatedUser.isPremium,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan
      });
    } catch (error: any) {
      console.error("Error setting user tier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Development-only: Get current user tier info
  app.get("/api/dev/user-tier-info", isAuthenticated, async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "This endpoint is only available in development" });
      }

      const sessionUser = req.user;
      if (!sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userPlan = getUserPlan(user);

      res.json({
        userId: user.id,
        email: user.email,
        currentTier: userPlan.id,
        // User tier information removed
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEndDate: user.subscriptionEndDate,
        // Tier limits removed - using page-specific limits instead
        availableTiers: ['free', 'premium', 'business', 'enterprise']
      });
    } catch (error: any) {
      console.error("Error getting user tier info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's compression limits and usage
  app.get("/api/compression-limits", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user;
      if (!sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the full user from storage to check subscription status
      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription status properly (including development toggle)
      let isPremium = false;
      
      // Check if manually set to premium (for development/testing)
      if (user.isPremium) {
        isPremium = true;
      } else if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          isPremium = subscription.status === 'active';
        } catch (error) {
          console.error("Error checking subscription:", error);
          isPremium = false;
        }
      }
      
      if (isPremium) {
        return res.json({
          isPremium: true,
          limit: null, // Unlimited compressions
          used: 0,
          remaining: null,
          resetTime: null,
          maxFileSize: null // No file size limit for premium
        });
      }

      // Free users now have unlimited compressions but 10MB file size limit
      res.json({
        isPremium: false,
        limit: null, // Unlimited compressions for free users too
        used: 0,
        remaining: null,
        resetTime: null,
        maxFileSize: 10 * 1024 * 1024 // 10MB limit for free users
      });
    } catch (error) {
      console.error("Error fetching compression limits:", error);
      res.status(500).json({ message: "Failed to fetch compression limits" });
    }
  });

  // Development-only premium toggle endpoint
  app.post("/api/dev/toggle-premium", isAuthenticated, async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "This endpoint is only available in development" });
      }

      const sessionUser = req.user;
      if (!sessionUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Toggle the premium status
      const updatedUser = await storage.togglePremiumStatus(sessionUser.id);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: `Premium status ${updatedUser.isPremium ? 'enabled' : 'disabled'}`,
        isPremium: updatedUser.isPremium,
        userId: updatedUser.id
      });
    } catch (error: any) {
      console.error("Error toggling premium status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload and compress images (now supports guest users) - SECURE VERSION
  app.post("/api/compress-legacy", requireScopeFromAuth, upload.array("images", 20), async (req, res) => {
    // Set timeout based on user plan - 30 seconds for anonymous, longer for paid users
    const user = req.user;
    const planLimits = user ? getUnifiedPlan('free') : getUnifiedPlan('anonymous');
    const timeoutMs = planLimits.limits.processingTimeout * 1000;
    req.setTimeout(timeoutMs);
    res.setTimeout(timeoutMs);
    try {
      console.log("Upload request received:", { filesCount: req.files?.length || 0 });
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.log("No files found in request");
        return res.status(400).json({ error: "No files uploaded" });
      }

      const user = req.user;
      const sessionId = req.body.sessionId || req.sessionID;
      const userId = user?.id || null; // Now optional for guest users
      
      // Apply tier-based restrictions
      if (user) {
        // Check batch size limits (max 20 files for all users)
        if (files.length > 20) {
          return res.status(400).json({ 
            error: "Maximum 20 files per batch",
            limit: 20,
            current: files.length,
            upgradeRequired: false
          });
        }

        // Check individual file size limits - DISABLED for testing
        // for (const file of files) {
        //   if (!fileSizeCheck.allowed) {
        //     return res.status(413).json({ 
        //       error: fileSizeCheck.message,
        //       limit: fileSizeCheck.limit,
        //       fileSize: file.size,
        //       fileName: file.originalname,
        //       upgradeRequired: true
        //     });
        //   }
        // }
      } else {
        // Anonymous user limits using unified plan configuration
        const anonPlan = getUnifiedPlan('anonymous');
        
        // Enforce 1 concurrent upload for anonymous users
        if (files.length > anonPlan.limits.maxConcurrentUploads) {
          return res.status(400).json({ 
            error: `Free users can only upload ${anonPlan.limits.maxConcurrentUploads} file at a time. Sign up for batch uploads!`,
            limit: anonPlan.limits.maxConcurrentUploads,
            current: files.length
          });
        }

        // Check file size limits
        for (const file of files) {
          if (file.size > anonPlan.limits.maxFileSize) {
            const maxSizeMB = Math.round(anonPlan.limits.maxFileSize / (1024 * 1024));
            return res.status(413).json({ 
              error: `File "${file.originalname}" exceeds the ${maxSizeMB}MB limit for free users. Sign up for larger files!`,
              limit: anonPlan.limits.maxFileSize,
              fileSize: file.size,
              fileName: file.originalname
            });
          }
        }
      }

      const { 
        qualityLevel = "medium", 
        resizeOption = "none", 
        outputFormat = "jpeg",
        customQuality = 75,
        compressionAlgorithm = "standard",
        optimizeForWeb = true,
        progressiveJpeg = false,
        optimizeScans = false,
        arithmeticCoding = false,
        customWidth,
        customHeight,
        bulkMode = false // New: enable fast processing for bulk uploads
      } = req.body;

      // All output formats are supported for all users
      
      // Check operation limits using unified counter
      for (const file of files) {
        // Use DualUsageTracker for limit checking
        const pageIdentifier = (req as any).context?.pageIdentifier || '/';
        const dualTracker = new DualUsageTracker(userId, req.sessionID, 'anonymous'); // Guest compression always uses anonymous plan
        
        const operationCheck = await dualTracker.canPerformOperation(file.originalname, file.size, pageIdentifier);
        
        if (!operationCheck.allowed) {
          return res.status(429).json({
            error: "Operation limit exceeded",
            message: operationCheck.reason,
            usage: operationCheck.usage,
            limits: operationCheck.limits,
            upgradeRequired: !user
          });
        }
      }

      // Determine if this is a bulk upload (for performance optimizations)
      const isBulkUpload = files.length >= 3 || bulkMode; // Lowered threshold for speed

      const jobs = [];
      // Fast job creation without blocking analysis
      for (const file of files) {
        console.log(`Creating compression job for user ${userId}, file: ${file.originalname}`);
        const job = await storage.createCompressionJob({
          userId, // Add userId for user association
          originalFilename: file.originalname,
          originalSize: file.size,
          status: "pending",
          qualityLevel,
          resizeOption,
          outputFormat,
          originalPath: file.path,
          compressedSize: null,
          compressionRatio: null,
          errorMessage: null,
          compressedPath: null,
        });

        console.log(`Created job ${job.id} for user ${userId}`);
        jobs.push(job);

        // Start compression with performance optimizations for bulk uploads
        compressImage(job.id, file, {
          qualityLevel,
          resizeOption,
          outputFormat,
          customQuality: parseInt(customQuality) || 75,
          compressionAlgorithm,
          optimizeForWeb: false, // Always disabled for speed
          progressiveJpeg: false, // Always disabled for speed
          optimizeScans: false, // Always disabled for speed
          arithmeticCoding: false, // Always false for speed
          customWidth: customWidth ? parseInt(customWidth) : undefined,
          customHeight: customHeight ? parseInt(customHeight) : undefined,
          fastMode: true // Always enable fast mode for speed
        }).catch((error: Error) => {
          console.error(`Compression failed for job ${job.id}:`, error);
        });
      }

      res.json({ jobs });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // Get job status
  app.get("/api/jobs/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    try {
      // Disable caching for real-time job updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const job = await storage.getCompressionJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Add preview images as base64 data URLs
      let jobWithPreview: any = { ...job };
      
      // Add original image preview
      if (job.originalPath) {
        try {
          const imageBuffer = await fs.readFile(job.originalPath);
          const base64Image = imageBuffer.toString('base64');
          jobWithPreview.originalPreviewDataUrl = `data:image/jpeg;base64,${base64Image}`;
        } catch (fileError) {
          console.warn(`Could not read original preview for job ${job.id}:`, fileError);
        }
      }
      
      // Add compressed image preview (only if compression is completed)
      if (job.status === "completed" && job.compressedPath) {
        try {
          const compressedBuffer = await fs.readFile(job.compressedPath);
          const base64Compressed = compressedBuffer.toString('base64');
          let mimeType;
          switch (job.outputFormat) {
            case 'webp': mimeType = 'image/webp'; break;
            case 'avif': mimeType = 'image/avif'; break;
            case 'png': mimeType = 'image/png'; break;
            default: mimeType = 'image/jpeg'; break;
          }
          jobWithPreview.compressedPreviewDataUrl = `data:${mimeType};base64,${base64Compressed}`;
        } catch (fileError) {
          console.warn(`Could not read compressed preview for job ${job.id}:`, fileError);
        }
      }
      
      res.json(jobWithPreview);
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  // Get all jobs (supports both authenticated users and guest sessions)
  app.get("/api/jobs", async (req, res) => {
    try {
      // Disable caching for real-time job updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const sessionId = req.query.sessionId as string || req.sessionID;
      const user = req.user;
      
      console.log(`/api/jobs called - User authenticated: ${!!req.isAuthenticated?.()}, User ID: ${user?.id}, Session ID: ${sessionId}`);
      
      let jobs;
      if (req.isAuthenticated?.() && user?.id) {
        // Authenticated user - get their jobs
        console.log(`Fetching jobs for authenticated user: ${user.id}`);
        jobs = await storage.getAllCompressionJobs(user.id);
        console.log(`Found ${jobs.length} jobs for user ${user.id}`);
      } else {
        // Guest user - get jobs by session ID
        console.log(`Fetching jobs for guest session: ${sessionId}`);
        jobs = await storage.getCompressionJobsBySession(sessionId);
        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);
      }
      
      res.json(jobs || []);
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });


  // Get original image preview
  app.get("/api/preview/original/:id", async (req, res) => {
    try {
      console.log(`Requesting original preview for job: ${req.params.id}`);
      const job = await storage.getCompressionJob(req.params.id);
      
      if (!job) {
        console.log(`Job not found: ${req.params.id}`);
        return res.status(404).json({ error: "Original image not found" });
      }
      
      if (!job.originalPath) {
        console.log(`No original path for job: ${req.params.id}`);
        return res.status(404).json({ error: "Original image path not found" });
      }

      console.log(`Original path for job ${req.params.id}: ${job.originalPath}`);

      // Check if file exists
      try {
        await fs.access(job.originalPath);
        console.log(`Original file exists: ${job.originalPath}`);
      } catch (accessError) {
        console.log(`Original file does not exist: ${job.originalPath}`, accessError);
        return res.status(404).json({ error: "Original image file not found" });
      }

      // Set caching headers for performance
      res.set({
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'image/jpeg'
      });

      // Stream the file efficiently using createReadStream for better performance
      const stream = createReadStream(job.originalPath);
      stream.pipe(res);
      
      // Handle stream errors
      stream.on('error', (streamError) => {
        console.error(`Stream error for job ${req.params.id}:`, streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream original image' });
        }
      });
    } catch (error) {
      console.error(`Error serving original preview for job ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to load original preview" });
    }
  });

  // Get compressed image preview
  app.get("/api/preview/compressed/:id", async (req, res) => {
    try {
      const job = await storage.getCompressionJob(req.params.id);
      if (!job || !job.compressedPath || job.status !== "completed") {
        return res.status(404).json({ error: "Compressed image not found" });
      }

      // Check if file exists
      try {
        await fs.access(job.compressedPath);
      } catch {
        return res.status(404).json({ error: "Compressed image file not found" });
      }

      // Set caching headers and content type based on output format
      let mimeType;
      switch (job.outputFormat) {
        case 'webp': mimeType = 'image/webp'; break;
        case 'avif': mimeType = 'image/avif'; break;
        case 'png': mimeType = 'image/png'; break;
        default: mimeType = 'image/jpeg'; break;
      }
      res.set({
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': mimeType
      });

      // Stream the file efficiently using createReadStream for better performance
      const stream = createReadStream(job.compressedPath);
      stream.pipe(res);
      
      // Handle stream errors
      stream.on('error', (streamError) => {
        console.error('Stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream compressed image' });
        }
      });
    } catch (error) {
      console.error(`Error serving compressed preview for job ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to load compressed preview" });
    }
  });

  // Download compressed image
  app.get("/api/download/:id", async (req, res) => {
    try {
      const job = await storage.getCompressionJob(req.params.id);
      if (!job || !job.compressedPath) {
        // Check if this is a special format conversion file (not stored in database)
        // Check TIFF first since JPG might be a preview file, not the actual conversion
        const specialFormatExtensions = ['tiff', 'avif', 'webp', 'png', 'jpg', 'jpeg'];
        let filePath = null;
        
        for (const ext of specialFormatExtensions) {
          const potentialPath = path.join("converted", `${req.params.id}.${ext}`);
          try {
            await fs.access(potentialPath);
            filePath = potentialPath;
            break;
          } catch (error) {
            // File doesn't exist with this extension, try next
          }
        }
        
        if (!filePath) {
          return res.status(404).json({ error: "Compressed file not found" });
        }
        
        // Handle special format conversion download
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).substring(1).toLowerCase();
        
        let contentType;
        switch (ext) {
          case 'png': contentType = 'image/png'; break;
          case 'jpg':
          case 'jpeg': contentType = 'image/jpeg'; break;
          case 'webp': contentType = 'image/webp'; break;
          case 'avif': contentType = 'image/avif'; break;
          case 'tiff': contentType = 'image/tiff'; break;
          default: contentType = 'application/octet-stream';
        }
        
        const downloadName = `converted_image.${ext}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Length', stats.size);
        
        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
        
        console.log(`Special format download: ${filePath} (${stats.size} bytes) as ${downloadName}`);
        return;
      }

      console.log(`=== DOWNLOAD DEBUG ===`);
      console.log(`Job ID: ${job.id}`);
      console.log(`Output Format: ${job.outputFormat}`);
      console.log(`Compressed Path: ${job.compressedPath}`);
      console.log(`Original Filename: ${job.originalFilename}`);

      // Set correct filename with proper extension based on output format
      const originalName = job.originalFilename.replace(/\.[^/.]+$/, ""); // Remove original extension
      let extension, contentType;
      
      switch (job.outputFormat) {
        case 'webp':
          extension = 'webp';
          contentType = 'image/webp';
          break;
        case 'avif':
          extension = 'avif';
          contentType = 'image/avif';
          break;
        case 'png':
          extension = 'png';
          contentType = 'image/png';
          break;
        case 'tiff':
          extension = 'tiff';
          contentType = 'image/tiff';
          break;
        case 'jpeg':
        default:
          extension = 'jpg';
          contentType = 'image/jpeg';
          break;
      }
      
      const filename = `compressed_${originalName}.${extension}`;
      
      console.log(`Download filename: ${filename}`);
      console.log(`Content-Type: ${contentType}`);
      console.log(`Extension: ${extension}`);
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Check if local file exists, if not fallback to R2 CDN
      try {
        const stats = await fs.stat(job.compressedPath);
        console.log(`File size: ${stats.size} bytes`);
        console.log(`=== END DOWNLOAD DEBUG ===`);
        
        // Set Content-Length header for better download performance
        res.setHeader('Content-Length', stats.size);
        
        // Stream the file efficiently instead of loading into memory
        const stream = createReadStream(job.compressedPath);
        stream.pipe(res);
        
        stream.on('error', (streamError) => {
          console.error('Download stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
          }
        });
      } catch (localFileError) {
        console.log(`Local file not found: ${job.compressedPath}, checking R2 CDN...`);
        
        // Local file not found, check if we have R2 CDN URL
        if (job.cdnUrl) {
          console.log(`Redirecting to R2 CDN: ${job.cdnUrl}`);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.redirect(302, job.cdnUrl);
        } else {
          console.error(`No local file or R2 CDN URL available for job ${req.params.id}`);
          return res.status(404).json({ error: "Compressed file not found" });
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Download all compressed images as ZIP
  app.post("/api/download-all", async (req, res) => {
    try {
      const { jobIds } = req.body;
      if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ error: "Job IDs array is required" });
      }

      // Get all completed jobs
      const jobs = [];
      for (const jobId of jobIds) {
        const job = await storage.getCompressionJob(jobId);
        if (job && job.status === "completed" && job.compressedPath) {
          jobs.push(job);
        }
      }

      if (jobs.length === 0) {
        return res.status(404).json({ error: "No completed files found" });
      }

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed_images.zip"');

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle archiver errors
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create ZIP archive" });
        }
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      for (const job of jobs) {
        try {
          const filename = `compressed_${job.originalFilename}`;
          archive.file(job.compressedPath!, { name: filename });
        } catch (fileError) {
          console.warn(`Could not add file ${job.originalFilename} to archive:`, fileError);
        }
      }

      // Finalize the archive
      await archive.finalize();
      console.log(`ZIP download completed for ${jobs.length} files`);

    } catch (error) {
      console.error("Download all error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create ZIP download" });
      }
    }
  });

  // Delete job and files
  app.delete("/api/jobs/:id", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    try {
      const job = await storage.getCompressionJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Delete files with proper existence checks
      try {
        // Check and delete original file
        try {
          await fs.access(job.originalPath);
          await fs.unlink(job.originalPath);
          console.log(`Deleted original file: ${job.originalPath}`);
        } catch (accessError) {
          console.warn(`Original file ${job.originalPath} already deleted or not found`);
        }
        
        // Check and delete compressed file
        if (job.compressedPath) {
          try {
            await fs.access(job.compressedPath);
            await fs.unlink(job.compressedPath);
            console.log(`Deleted compressed file: ${job.compressedPath}`);
          } catch (accessError) {
            console.warn(`Compressed file ${job.compressedPath} already deleted or not found`);
          }
        }
      } catch (fileError) {
        console.warn("Failed to delete files:", fileError);
      }

      // Delete job from storage
      await storage.deleteCompressionJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Clear all jobs
  app.delete("/api/jobs", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string || req.sessionID;
      const user = req.user;
      
      let jobs;
      if (req.isAuthenticated?.() && user?.id) {
        // Authenticated user - get their jobs
        console.log(`Clearing jobs for authenticated user: ${user.id}`);
        jobs = await storage.getAllCompressionJobs(user.id);
      } else {
        // Guest user - get jobs by session ID
        console.log(`Clearing jobs for guest session: ${sessionId}`);
        jobs = await storage.getCompressionJobsBySession(sessionId);
      }
      
      // Delete all files with proper existence checks
      for (const job of jobs) {
        try {
          // Check and delete original file
          try {
            await fs.access(job.originalPath);
            await fs.unlink(job.originalPath);
            console.log(`Deleted original file for job ${job.id}: ${job.originalPath}`);
          } catch (accessError) {
            console.warn(`Original file for job ${job.id} already deleted: ${job.originalPath}`);
          }
          
          // Check and delete compressed file
          if (job.compressedPath) {
            try {
              await fs.access(job.compressedPath);
              await fs.unlink(job.compressedPath);
              console.log(`Deleted compressed file for job ${job.id}: ${job.compressedPath}`);
            } catch (accessError) {
              console.warn(`Compressed file for job ${job.id} already deleted: ${job.compressedPath}`);
            }
          }
          
          // Delete job from storage after files are handled
          await storage.deleteCompressionJob(job.id);
        } catch (fileError) {
          console.warn(`Failed to delete files for job ${job.id}:`, fileError);
          // Still try to delete from storage even if files fail
          try {
            await storage.deleteCompressionJob(job.id);
          } catch (storageError) {
            console.warn(`Failed to delete job ${job.id} from storage:`, storageError);
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Clear all jobs error:", error);
      res.status(500).json({ error: "Failed to clear jobs" });
    }
  });

  // Get compression analysis for uploaded file
  app.get("/api/analyze/:id", async (req, res) => {
    try {
      const job = await storage.getCompressionJob(req.params.id);
      if (!job || !job.originalPath) {
        return res.status(404).json({ error: "Job or file not found" });
      }

      const analysis = await CompressionEngine.analyzeImage(job.originalPath);
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Compress with target file size - SECURE VERSION
  app.post("/api/compress-target-size", requireScopeFromAuth, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const { targetSize, maxQuality = 95, minQuality = 30 } = req.body;
      if (!targetSize) {
        return res.status(400).json({ error: "Target size is required" });
      }

      const targetSizeBytes = parseInt(targetSize) * 1024; // Convert KB to bytes
      const jobs = [];

      for (const file of files) {
        const job = await storage.createCompressionJob({
          originalFilename: file.originalname,
          originalSize: file.size,
          status: "pending",
          qualityLevel: "custom",
          resizeOption: "none",
          outputFormat: "jpeg",
          originalPath: file.path,
          compressedSize: null,
          compressionRatio: null,
          errorMessage: null,
          compressedPath: null,
        });

        jobs.push(job);

        // Start target size compression
        compressToTargetSize(job.id, file, targetSizeBytes, {
          maxQuality: parseInt(maxQuality),
          minQuality: parseInt(minQuality)
        }).catch(error => {
          console.error(`Target size compression failed for job ${job.id}:`, error);
        });
      }

      res.json({ jobs, message: `Compressing to target size: ${targetSize}KB` });
    } catch (error) {
      console.error("Target size compression error:", error);
      res.status(500).json({ error: "Failed to start target size compression" });
    }
  });

  // Guest compression endpoints - SECURE VERSION (still needs limits)
  app.post('/api/guest/compress', requireScopeFromAuth, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // Guest limits
      const GUEST_MAX_FILES = 3;
      const GUEST_FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
      const GUEST_QUALITY = 80;

      if (files.length > GUEST_MAX_FILES) {
        return res.status(400).json({ error: `Guest mode limited to ${GUEST_MAX_FILES} files` });
      }

      const results = [];
      
      for (const file of files) {
        if (file.size > GUEST_FILE_SIZE_LIMIT) {
          return res.status(400).json({ 
            error: `File ${file.originalname} is too large (max 5MB in guest mode)` 
          });
        }

        const jobId = randomUUID();
        const timestamp = new Date().toISOString();
        
        try {
          // Debug file information
          console.log(`Processing file: ${file.originalname}, path: ${file.path}, size: ${file.size}`);
          
          // Check if file exists
          try {
            await fs.access(file.path);
          } catch (accessError) {
            console.error(`File does not exist at path: ${file.path}`);
            throw new Error(`File not found: ${file.path}`);
          }
          
          // Read the file from disk since multer stores it there
          const fileBuffer = await fs.readFile(file.path);
          console.log(`File buffer size: ${fileBuffer.length}`);
          
          // Validate that we have a valid image buffer
          if (fileBuffer.length === 0) {
            throw new Error('Empty file buffer');
          }
          
          // Compress the image
          const compressedBuffer = await sharp(fileBuffer)
            .jpeg({ quality: GUEST_QUALITY, progressive: true })
            .toBuffer();

          // Store the compressed file temporarily (in memory for guests)
          storage.setGuestFile(jobId, compressedBuffer, file.originalname);

          const compressionRatio = ((file.size - compressedBuffer.length) / file.size) * 100;

          results.push({
            id: jobId,
            originalName: file.originalname,
            originalSize: file.size,
            compressedSize: compressedBuffer.length,
            compressionRatio: compressionRatio,
            quality: GUEST_QUALITY
          });

        } catch (error) {
          console.error(`Error compressing ${file.originalname}:`, error);
          return res.status(500).json({ 
            error: `Failed to compress ${file.originalname}` 
          });
        } finally {
          // Clean up temporary file
          try {
            await fs.unlink(file.path);
          } catch (cleanupError) {
            console.error(`Failed to cleanup temp file ${file.path}:`, cleanupError);
          }
        }
      }

      // Track usage after successful compression using DualUsageTracker
      const pageIdentifier = (req as any).context?.pageIdentifier || '/';
      const dualTracker = new DualUsageTracker(userId, req.sessionID, 'anonymous'); // Guest compression always uses anonymous plan
      
      for (const file of files) {
        await dualTracker.recordOperation(file.originalname, file.size, pageIdentifier);
      }

      res.json({ files: results });
    } catch (error) {
      console.error('Guest compression error:', error);
      res.status(500).json({ error: 'Failed to process files' });
    }
  });

  app.get('/api/guest/download/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const guestFile = storage.getGuestFile(fileId);
      
      if (!guestFile) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${guestFile.originalName}"`,
        'Content-Length': guestFile.buffer.length,
      });

      res.send(guestFile.buffer);
    } catch (error) {
      console.error('Guest download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  // Social sharing and rewards API endpoints
  app.post('/api/social/share', async (req, res) => {
    try {
      const { platform, compressionJobId, shareText, imageStats } = req.body;

      // Validate the request
      if (!platform || !compressionJobId || !imageStats) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const validPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      // Get user info (could be authenticated user or guest)
      let userId: string | null = null;
      let sessionId: string | null = null;

      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        userId = (req.user as any).id;
      } else {
        // For guest users, use session or generate one
        sessionId = req.sessionID || randomUUID();
      }

      // Calculate reward points based on platform
      const platformRewards = {
        twitter: 5,
        linkedin: 7,
        facebook: 6,
        instagram: 8
      };
      const rewardPoints = platformRewards[platform as keyof typeof platformRewards];

      // Create the social share record
      const shareData = {
        userId,
        sessionId,
        compressionJobId,
        platform,
        shareUrl: `${req.protocol}://${req.get('host')}?ref=${compressionJobId}`,
        shareText,
        imageStats,
        rewardPointsEarned: rewardPoints
      };

      const share = await storage.createSocialShare(shareData);

      // If user is authenticated, update their rewards
      let discountMessage = '';
      if (userId) {
        try {
          const updatedRewards = await storage.addRewardPoints(userId, rewardPoints, 'social_share', share.id);
          
          // Check if they unlocked a new discount level
          const newDiscountPercent = calculateDiscountFromPoints(updatedRewards.totalPoints);
          if (newDiscountPercent > updatedRewards.currentDiscountPercent) {
            await storage.updateUserDiscount(userId, newDiscountPercent);
            discountMessage = `You unlocked a ${newDiscountPercent}% discount on your next subscription!`;
          }
        } catch (rewardError) {
          console.error('Error updating rewards:', rewardError);
          // Don't fail the request, just log the error
        }
      }

      res.json({
        success: true,
        shareId: share.id,
        rewardPoints: userId ? rewardPoints : 0,
        discountMessage,
        message: userId 
          ? `Share recorded! You earned ${rewardPoints} reward points.`
          : 'Share recorded! Sign up to start earning reward points.'
      });

    } catch (error) {
      console.error('Social sharing error:', error);
      res.status(500).json({ error: 'Failed to record social share' });
    }
  });

  // Get user's social sharing stats and rewards
  app.get('/api/social/stats', async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = (req.user as any).id;

      // Get user's rewards info
      const rewards = await storage.getUserRewards(userId);
      
      // Get recent shares
      const recentShares = await storage.getUserShares(userId, 10);
      
      // Get referral info
      const referralInfo = await storage.getUserReferral(userId);

      res.json({
        rewards: {
          totalPoints: rewards?.totalPoints || 0,
          currentDiscountPercent: rewards?.currentDiscountPercent || 0,
          sharePoints: rewards?.sharePoints || 0,
          referralPoints: rewards?.referralPoints || 0,
          nextDiscountThreshold: rewards?.nextDiscountThreshold || 1
        },
        recentShares: recentShares || [],
        referral: referralInfo ? {
          referralCode: referralInfo.referralCode,
          totalReferrals: referralInfo.totalReferrals,
          totalEarned: referralInfo.totalEarned
        } : null
      });

    } catch (error) {
      console.error('Error fetching social stats:', error);
      res.status(500).json({ error: 'Failed to fetch social stats' });
    }
  });

  // Generate or get user's referral code
  app.post('/api/social/referral', async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = (req.user as any).id;

      // Check if user already has a referral code
      let referralInfo = await storage.getUserReferral(userId);
      
      if (!referralInfo) {
        // Generate new referral code
        const referralCode = generateReferralCode();
        referralInfo = await storage.createUserReferral(userId, referralCode);
      }

      res.json({
        referralCode: referralInfo.referralCode,
        referralUrl: `${req.protocol}://${req.get('host')}?ref=${referralInfo.referralCode}`,
        totalReferrals: referralInfo.totalReferrals,
        totalEarned: referralInfo.totalEarned
      });

    } catch (error) {
      console.error('Error managing referral code:', error);
      res.status(500).json({ error: 'Failed to manage referral code' });
    }
  });

  // Social sharing tracking endpoint (simple version)
  app.post('/api/social-share', async (req, res) => {
    const { platform, timestamp } = req.body;
    
    // Points system for social sharing
    const points = {
      twitter: 5,
      linkedin: 7, 
      facebook: 6,
      instagram: 8,
      twitter_app: 5,
      linkedin_app: 7,
      facebook_app: 6,
      instagram_app: 8,
      twitter_results: 5,
      linkedin_results: 7,
      facebook_results: 6,
      instagram_results: 8
    };

    const earnedPoints = points[platform as keyof typeof points] || 0;
    
    // Here you could save to database if needed
    console.log(`Social share tracked: ${platform} at ${timestamp}, earned ${earnedPoints} points`);
    
    res.json({ 
      success: true, 
      platform,
      points: earnedPoints,
      timestamp 
    });
  });

  // Check trial status for special formats
  app.get("/api/trial-status", async (req, res) => {
    try {
      // Use the same session logic as the conversion endpoint
      const sessionId = req.query.sessionId as string || req.sessionID;
      const TRIAL_LIMIT = 5; // 5 free special format conversions
      
      // Get current trial usage from session
      const sessionKey = `special_trial_${sessionId}`;
      let trialUsage = 0;
      
      // In a real implementation, you'd store this in Redis or database
      // For now, using in-memory storage (will reset on server restart)
      if (!global.trialUsage) {
        global.trialUsage = new Map();
      }
      
      trialUsage = global.trialUsage.get(sessionKey) || 0;
      const remaining = Math.max(0, TRIAL_LIMIT - trialUsage);
      const allowed = remaining > 0;
      
      // Debug logging
      console.log(`Trial status check - SessionID: ${sessionId}, SessionKey: ${sessionKey}, Usage: ${trialUsage}, Remaining: ${remaining}`);
      
      res.json({
        allowed,
        remaining,
        total: TRIAL_LIMIT,
        used: trialUsage,
        message: remaining === 0 
          ? "Free trial exhausted. Upgrade to premium for unlimited professional format conversions."
          : `${remaining} free conversions remaining`
      });
    } catch (error) {
      console.error("Trial status check error:", error);
      res.status(500).json({ error: "Failed to check trial status" });
    }
  });

  // Lead magnet email endpoint with abuse prevention and credit tracking
  app.post('/api/lead-magnet', async (req, res) => {
    try {
      const { email, firstName } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }
      
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Check for existing signup with same email
      const existingSignup = await storage.getLeadMagnetSignup(email);
      if (existingSignup) {
        return res.status(409).json({ 
          error: 'Email already registered for free credits',
          message: 'This email has already received the free credits and guide. Check your inbox or contact support.' 
        });
      }
      
      // Check for IP-based abuse (max 3 signups per IP per day)
      const ipSignupCount = await storage.getLeadMagnetSignupCountByIP(ipAddress);
      if (ipSignupCount >= 3) {
        return res.status(429).json({ 
          error: 'Too many signups from this location',
          message: 'Maximum 3 signups per day from the same location. Please try again tomorrow.' 
        });
      }
      
      console.log(`Processing lead magnet signup for: ${email}`);
      
      // Create lead magnet signup record with 90-day credit expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90); // Credits expire in 90 days
      
      const signupRecord = await storage.createLeadMagnetSignup({
        email,
        firstName: firstName || null,
        ipAddress,
        userAgent,
        creditsGranted: 1000,
        creditsUsed: 0,
        status: 'active',
        expiresAt,
      });
      
      // Send email with improved deliverability
      const success = await emailService.sendLeadMagnetGuide(email, firstName);
      
      if (success) {
        console.log(`✓ Lead magnet guide sent successfully to ${email}`);
        res.json({ 
          success: true, 
          message: 'Guide sent successfully! Check your email for your free credits and optimization guide.',
          credits: 1000,
          expiresAt: expiresAt.toISOString()
        });
      } else {
        // If email fails, remove the signup record to allow retry
        await storage.deleteLeadMagnetSignup(signupRecord.id);
        console.error(`✗ Failed to send lead magnet guide to ${email}`);
        res.status(500).json({ 
          error: 'Failed to send guide. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Lead magnet endpoint error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Test endpoint for email integration
  app.post('/api/test-emails', async (req: any, res) => {
    try {
      const { emailType, testEmail } = req.body;
      
      if (!testEmail || !emailType) {
        return res.status(400).json({ error: 'Email address and email type are required' });
      }

      let result;
      const testFirstName = 'TestUser';

      switch (emailType) {
        case 'conversion_complete':
          result = await emailService.sendSpecialFormatConversionComplete(
            testEmail,
            testFirstName,
            {
              filesProcessed: 3,
              originalFormats: ['RAW', 'SVG', 'TIFF'],
              outputFormat: 'jpeg',
              totalOriginalSize: 15728640, // 15MB
              totalConvertedSize: 3145728,  // 3MB
              conversionTypes: ['RAW → JPEG', 'SVG → JPEG', 'TIFF → JPEG'],
              isTrialUser: true,
              trialRemaining: 2
            }
          );
          break;

        case 'trial_warning':
          result = await emailService.sendSpecialFormatTrialWarning(
            testEmail,
            testFirstName,
            4, // Used 4 of 5
            5  // Total limit
          );
          break;

        case 'trial_exhausted':
          result = await emailService.sendSpecialFormatTrialExhausted(
            testEmail,
            testFirstName
          );
          break;

        // === STANDARD FORMAT EMAIL TESTS ===
        case 'standard_compression_complete':
          result = await emailService.sendStandardCompressionComplete(
            testEmail,
            testFirstName,
            {
              filesProcessed: 5,
              totalOriginalSize: 25165824,  // 24MB
              totalCompressedSize: 3145728, // 3MB
              averageCompressionRatio: 87,
              qualityLevel: 85,
              processingTime: 12,
              filenames: ['vacation-photo-1.jpg', 'landscape-shot.jpg', 'portrait-selfie.jpg', 'product-image.jpg', 'event-group-photo.jpg'],
              sizeSavings: '21MB (87% reduction)'
            }
          );
          break;

        case 'daily_limit_warning':
          result = await emailService.sendDailyLimitWarning(
            testEmail,
            testFirstName,
            {
              used: 12,
              limit: 15,
              percentage: 80,
              remainingHours: 6
            }
          );
          break;

        case 'upgrade_file_size':
          result = await emailService.sendUpgradePromotion(
            testEmail,
            testFirstName,
            'file_size_limit'
          );
          break;

        case 'upgrade_daily_limit':
          result = await emailService.sendUpgradePromotion(
            testEmail,
            testFirstName,
            'daily_limit_reached'
          );
          break;

        case 'upgrade_advanced_features':
          result = await emailService.sendUpgradePromotion(
            testEmail,
            testFirstName,
            'advanced_features'
          );
          break;

        default:
          return res.status(400).json({ 
            error: 'Invalid email type. Use: conversion_complete, trial_warning, trial_exhausted, standard_compression_complete, daily_limit_warning, upgrade_file_size, upgrade_daily_limit, upgrade_advanced_features' 
          });
      }

      res.json({
        success: result,
        message: result ? `${emailType} email sent successfully to ${testEmail}` : 'Failed to send email',
        emailType,
        recipient: testEmail
      });

    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ 
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Reset RAW usage counters - ROBUST VERSION
  app.post("/api/reset-raw-usage", async (req, res) => {
    try {
      console.log('🔧 Universal RAW reset initiated for all anonymous users');
      
      // Reset ALL anonymous users' RAW counters to be robust
      const result = await db.update(userUsage)
        .set({
          rawMonthly: 0,
          rawDaily: 0,
          rawHourly: 0,
          updatedAt: new Date()
        })
        .where(eq(userUsage.userId, 'anonymous'));
        
      console.log('🔧 Universal reset result:', result);
      
      res.json({ 
        success: true, 
        message: "All RAW usage counters reset to 0", 
        resetType: "universal_anonymous"
      });
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ error: "Failed to reset counters", details: error.message });
    }
  });

  // Special Format Conversion endpoint - ACCESSIBLE VERSION
  app.post("/api/convert-special", specialUpload.array('files', 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const { outputFormat, quality, resize, width, height, maintainAspect, resizePercentage } = req.body;
      if (!outputFormat) {
        return res.status(400).json({ error: "Output format is required" });
      }
      
      // Parse advanced quality settings with proper percentage handling
      const qualityValue = quality ? parseInt(quality, 10) : 85;
      const shouldResize = resize === 'true';
      const resizePercentageValue = resizePercentage ? parseInt(resizePercentage, 10) : 100;
      
      // Only use width/height if NOT using percentage mode (to fix resize bug)
      const customWidth = (!shouldResize || resizePercentageValue === 100) ? (width ? parseInt(width, 10) : 2560) : 0;
      const customHeight = (!shouldResize || resizePercentageValue === 100) ? (height ? parseInt(height, 10) : 2560) : 0;
      const maintainAspectRatio = maintainAspect !== 'false';
      
      console.log(`🔧 CR2 RESIZE DEBUG: resize=${resize}, shouldResize=${shouldResize}, resizePercentage=${resizePercentageValue}, width=${customWidth}, height=${customWidth}`);
      console.log(`🔧 CR2 RAW BODY:`, JSON.stringify(req.body, null, 2));
      

      // Check if user is authenticated
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const user = isUserAuthenticated ? req.user : null;
      const sessionId = req.body.sessionId || req.sessionID;
      const userId = user?.id || null;

      // Check if user has premium subscription for special formats
      let isPremiumUser = false;
      if (isUserAuthenticated && user && user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          isPremiumUser = subscription.status === 'active';
        } catch (error) {
          console.warn('Failed to check subscription status:', error);
        }
      }
      
      // Check trial limits for guest users
      if (!isUserAuthenticated) {
        const sessionKey = `special_trial_${sessionId}`;
        const TRIAL_LIMIT = 5;
        
        if (!global.trialUsage) {
          global.trialUsage = new Map();
        }
        
        const trialUsage = global.trialUsage.get(sessionKey) || 0;
        const remaining = Math.max(0, TRIAL_LIMIT - trialUsage);
        
        if (remaining <= 0) {
          return res.status(403).json({ 
            error: "Trial limit exceeded", 
            message: "Free trial exhausted. Upgrade to premium for unlimited professional format conversions.",
            requiresUpgrade: true 
          });
        }
      }

      // Special formats require premium subscription for authenticated users
      // Allow guest users with trial limits
      if (isUserAuthenticated && !isPremiumUser) {
        return res.status(403).json({ 
          error: "Premium subscription required", 
          message: "Special format conversions require a premium subscription. Please upgrade to continue.",
          requiresUpgrade: true 
        });
      }

      // Get user tier configuration  
      const userPlan = getUserPlan(user);

      // TEMPORARY: Disable file size checks for testing
      // Check file size limits (special formats may be larger)
      // for (const file of files) {
      //   const fileSizeCheck = checkFileLimit(user, file.size);
      //   if (!fileSizeCheck.allowed) {
      //     return res.status(400).json({ 
      //       error: "File size limit exceeded", 
      //       message: fileSizeCheck.message,
      //     });
      //   }
      // }

      // Check batch limits
      if (files.length > 20) {
        return res.status(400).json({ 
          error: "Batch size limit exceeded", 
          message: "Maximum 20 files per batch",

        });
      }

      const results = [];
      console.log(`Processing ${files.length} special format conversions for user ${userId || 'guest'}`);

      // Process each file
      for (const file of files) {
        try {
          const jobId = randomUUID();
          const originalFormat = getFileFormat(file.originalname);
          
          // Determine output extension
          const outputExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
          const outputPath = path.join("converted", `${jobId}.${outputExtension}`);

          console.log(`Converting ${file.originalname} (${originalFormat}) to ${outputFormat}`);
          console.log(`Input file path: ${file.path}`);
          console.log(`Output file path: ${outputPath}`);

          // Get original file size before processing (in case file gets modified)
          const originalStats = await fs.stat(file.path);
          console.log(`Original file size: ${originalStats.size} bytes`);

          // Process the conversion based on input format
          console.log(`🔧 CALLING processSpecialFormatConversion with:`, {
            quality: qualityValue,
            resize: shouldResize,
            width: customWidth,
            height: customHeight,
            maintainAspect: maintainAspectRatio,
            resizePercentage: resizePercentageValue
          });
          
          const conversionResult = await processSpecialFormatConversion(
            file.path,
            outputPath,
            originalFormat,
            outputFormat,
            {
              quality: qualityValue,
              resize: shouldResize,
              width: customWidth,
              height: customHeight,
              maintainAspect: maintainAspectRatio,
              resizePercentage: resizePercentageValue
            }
          );
          const convertedStats = await fs.stat(outputPath);
          
          // For special format conversions, skip database operations to prevent crashes
          // Just create a simple job object with the conversion results
          const job = {
            id: jobId,
            originalFilename: file.originalname,
            originalSize: originalStats.size,
            compressedSize: convertedStats.size,
            outputFormat,
            status: 'completed'
          };
          
          console.log(`Conversion completed: ${file.originalname} -> ${outputPath}`);

          // Generate thumbnail for ALL formats (not just TIFF) and include download/preview URLs
          let previewUrl: string | undefined;
          let downloadUrl: string;
          
          // Generate thumbnail for ALL CR2 conversions for consistent UI experience
          try {
            const thumbnailPath = await generateThumbnailFromRaw(outputPath, path.dirname(outputPath), jobId);
            if (thumbnailPath) {
              previewUrl = `/api/preview/${jobId}`;
              console.log(`✅ Thumbnail generated for ${outputFormat}: ${thumbnailPath}`);
            }
          } catch (thumbnailError) {
            console.warn(`⚠️ Thumbnail generation failed for ${jobId} (${outputFormat}):`, thumbnailError);
          }
          
          // Always include download URL
          downloadUrl = `/api/download/${jobId}`;

          results.push({
            id: job.id,
            originalName: file.originalname,
            originalSize: originalStats.size,
            compressedSize: convertedStats.size, // Use consistent naming with compression endpoint
            originalFormat,
            outputFormat,
            status: 'completed',
            downloadUrl, // Always include download URL
            ...(previewUrl && { previewUrl }) // Include preview URL if thumbnail was generated
          });

          console.log(`Successfully converted ${file.originalname}: ${originalStats.size} → ${convertedStats.size} bytes`);

          // Update dual usage tracker for RAW counter display
          if (sessionId) {
            try {
              const pageIdentifier = '/convert/cr2-to-png';
              const userType = isUserAuthenticated ? 'authenticated' : 'anonymous';
              const dualTracker = new (await import('./services/DualUsageTracker')).DualUsageTracker(
                userId || undefined, 
                sessionId,
                userType
              );
              await dualTracker.recordOperation(file.originalname, convertedStats.size, pageIdentifier);
              console.log('✅ DualUsageTracker updated for RAW conversion');
            } catch (error) {
              console.log('⚠️ Failed to update DualUsageTracker:', error);
            }
          }

          // Increment trial usage for guest users
          if (!isUserAuthenticated) {
            const sessionKey = `special_trial_${sessionId}`;
            const currentUsage = global.trialUsage.get(sessionKey) || 0;
            const newUsage = currentUsage + 1;
            global.trialUsage.set(sessionKey, newUsage);
            console.log(`Trial usage incremented - SessionID: ${sessionId}, SessionKey: ${sessionKey}, Usage: ${newUsage}/5`);
            
            // Send trial warning email when reaching 80% usage (4/5)
            if (newUsage === 4) {
              console.log('Trial warning threshold reached (4/5 conversions used)');
              // Email functionality ready - when we collect guest emails:
              // try {
              //   await emailService.sendSpecialFormatTrialWarning(guestEmail, 'User', newUsage, 5);
              // } catch (emailError) {
              //   console.error('Failed to send trial warning email:', emailError);
              // }
            }
            
            // Send trial exhausted email when limit is reached (5/5)
            if (newUsage >= 5) {
              console.log('Trial limit exhausted - sending notification email');
              // Email functionality ready - when we collect guest emails:
              // try {
              //   await emailService.sendSpecialFormatTrialExhausted(guestEmail, 'User');
              // } catch (emailError) {
              //   console.error('Failed to send trial exhausted email:', emailError);
              // }
            }
          }
        } catch (error) {
          console.error(`Failed to convert ${file.originalname}:`, error);
          results.push({
            originalName: file.originalname,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Send email notification for successful conversions (if any)
      const completedResults = results.filter(r => r.status === 'completed');
      if (completedResults.length > 0) {
        // Calculate totals for email
        const totalOriginalSize = completedResults.reduce((sum, r) => sum + (r.originalSize || 0), 0);
        const totalConvertedSize = completedResults.reduce((sum, r) => sum + (r.convertedSize || 0), 0);
        const originalFormats = [...new Set(completedResults.map(r => r.originalFormat).filter(Boolean))];
        const conversionTypes = originalFormats.map(format => `${format?.toUpperCase()} → ${outputFormat.toUpperCase()}`);
        
        // Get trial status for email content
        const sessionKey = `special_trial_${sessionId}`;
        const currentTrialUsage = global.trialUsage?.get(sessionKey) || 0;
        const trialRemaining = Math.max(0, 5 - currentTrialUsage);
        
        // Send email notification for guest users or authenticated users with email
        const shouldSendEmail = !isUserAuthenticated; // For now, only send to guest users
        
        if (shouldSendEmail) {
          // For guest users, we don't have email - could be enhanced to collect email for notifications
          console.log('Email notification skipped for guest user (no email collected)');
          
          // When we have email collection for guest users or authenticated users:
          // try {
          //   await emailService.sendSpecialFormatConversionComplete(
          //     userEmail,
          //     firstName || 'User',
          //     {
          //       filesProcessed: completedResults.length,
          //       originalFormats,
          //       outputFormat,
          //       totalOriginalSize,
          //       totalConvertedSize,
          //       conversionTypes,
          //       isTrialUser: !isUserAuthenticated,
          //       trialRemaining
          //     }
          //   );
          // } catch (emailError) {
          //   console.error('Failed to send conversion completion email:', emailError);
          // }
        }
      }

      res.json({
        message: `Processed ${files.length} file(s)`,
        results,
        totalFilesProcessed: completedResults.length
      });

    } catch (error) {
      console.error("Special format conversion error:", error);
      res.status(500).json({ 
        error: "Failed to process special format conversion",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });



  // Payment processing routes
  app.post('/api/payment/razorpay/create-order', isAuthenticated, createRazorpayOrder);
  app.post('/api/payment/razorpay/verify', isAuthenticated, verifyRazorpayPayment);
  app.post('/api/payment/paypal/process', isAuthenticated, processPayPalPayment);
  app.get('/api/subscription/status', isAuthenticated, getSubscriptionStatus);
  app.post('/api/subscription/cancel', isAuthenticated, cancelSubscription);

  // PayPal button integration routes (from blueprint)
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });


  // PayPal subscription activation (after payment)
  app.post('/api/activate-paypal-subscription', isAuthenticated, async (req, res) => {
    try {
      const { orderId, paymentId, amount, plan } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (!orderId || !paymentId || !amount || !plan) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Activate subscription in database  
      const subscriptionEndDate = new Date();
      if (plan === 'test_premium') {
        subscriptionEndDate.setHours(subscriptionEndDate.getHours() + 24); // 24 hours for $1 plan
      } else {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month for $29/$99 plans
      }

      // Map plan names correctly
      let subscriptionTier = 'premium'; // default
      if (plan === 'test_premium') {
        subscriptionTier = 'test_premium';
      } else if (plan === 'enterprise') {
        subscriptionTier = 'enterprise';
      }

      await storage.updateUser(userId, {
        subscriptionTier: subscriptionTier,
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate,
        stripeSubscriptionId: paymentId // Store PayPal payment ID
      });

      console.log(`PayPal subscription activated for user ${userId}: Plan=${plan}, Payment=${paymentId}`);

      res.json({ 
        success: true, 
        message: 'Subscription activated successfully',
        plan: plan,
        validUntil: subscriptionEndDate
      });
    } catch (error) {
      console.error('PayPal subscription activation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to activate subscription' 
      });
    }
  });

  // Legacy subscription creation endpoint (for backward compatibility)
  app.post('/api/create-subscription', isAuthenticated, async (req, res) => {
    try {
      const { planId, email, password, firstName, lastName } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      if (!planId) {
        return res.status(400).json({ success: false, message: "Plan ID is required" });
      }

      // Map legacy plan IDs to new structure
      const planMapping = {
        'test-premium': 'pro',
        'pro': 'pro',
        'enterprise': 'enterprise',
        'free': 'free'
      };

      const plan = planMapping[planId] || 'free';
      const subscriptionEndDate = new Date();
      
      if (plan !== 'free') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription
      }

      // Update user subscription
      await db.update(users)
        .set({
          subscriptionTier: plan,
          subscriptionStatus: plan === 'free' ? 'inactive' : 'active',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: plan === 'free' ? null : subscriptionEndDate,
          monthlyOperations: 0, // Reset operations count
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ 
        success: true, 
        message: `Successfully upgraded to ${plan} plan`,
        subscription: {
          plan,
          status: plan === 'free' ? 'inactive' : 'active',
          endDate: plan === 'free' ? null : subscriptionEndDate
        }
      });

    } catch (error) {
      console.error('Legacy subscription creation failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create subscription',
        error: error.message 
      });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Send email to support
      const emailContent = `
        Contact Form Submission:
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject || 'No subject'}
        
        Message:
        ${message}
      `;

      await emailService.sendEmail({
        to: 'support@microjpeg.com',
        subject: `Contact Form: ${subject || 'New message from ' + name}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });

      console.log(`Contact form submitted by ${name} (${email})`);
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Feedback form endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const { message, email } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Feedback message is required" });
      }

      // Send feedback email
      const emailContent = `
        Feedback Submission:
        
        User Email: ${email || 'Anonymous'}
        
        Feedback:
        ${message}
      `;

      await emailService.sendEmail({
        to: 'feedback@microjpeg.com',
        subject: 'New Feedback Submission',
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });

      console.log(`Feedback submitted by ${email || 'anonymous'}`);
      res.json({ success: true, message: "Feedback sent successfully" });
    } catch (error) {
      console.error("Error processing feedback:", error);
      res.status(500).json({ message: "Failed to send feedback" });
    }
  });

  // Register development reset endpoints for testing
  registerResetEndpoints(app);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for social sharing and rewards
function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function calculateDiscountFromPoints(points: number): number {
  if (points >= 100) return 25; // 25% discount for 100+ points
  if (points >= 50) return 15;  // 15% discount for 50+ points  
  if (points >= 20) return 10;  // 10% discount for 20+ points
  if (points >= 10) return 5;   // 5% discount for 10+ points
  return 0; // No discount under 10 points
}

interface CompressionOptions {
  qualityLevel: string;
  resizeOption: string;
  outputFormat: string; // 'jpeg', 'png', 'webp'
  customQuality: number;
  compressionAlgorithm: string;
  optimizeForWeb: boolean;
  progressiveJpeg: boolean;
  optimizeScans: boolean;
  arithmeticCoding: boolean;
  customWidth?: number;
  customHeight?: number;
  fastMode?: boolean; // New: enable fast mode for bulk uploads
  pngCompressionLevel?: number; // 0-9 for PNG compression
  pngOptimization?: 'speed' | 'size'; // PNG optimization strategy
}

async function compressImage(
  jobId: string,
  file: Express.Multer.File,
  options: CompressionOptions
) {
  try {
    console.log(`Starting advanced compression for job ${jobId} with algorithm: ${options.compressionAlgorithm}`);
    
    // Update job status to processing
    await storage.updateCompressionJob(jobId, { status: "processing" });
    console.log(`Updated job ${jobId} status to processing`);

    // Use custom quality or fallback to quality level
    let quality = options.customQuality;
    if (!quality) {
      switch (options.qualityLevel) {
        case "high":
          quality = 85;
          break;
        case "medium":
          quality = 75;
          break;
        case "low":
          quality = 50;
          break;
        default:
          quality = 75;
      }
    }

    // Set up Sharp pipeline with advanced options
    let sharpInstance = sharp(file.path, {
      // Enable advanced processing
      unlimited: true,
      sequentialRead: true
    });

    // Get original image metadata
    const metadata = await sharpInstance.metadata();
    console.log(`Image metadata for job ${jobId}:`, { 
      width: metadata.width, 
      height: metadata.height,
      format: metadata.format,
      colorSpace: metadata.space,
      hasAlpha: metadata.hasAlpha
    });

    // Fast mode always enabled for maximum speed
    console.log(`Fast mode enabled for job ${jobId} - minimal processing for speed`);
    // Skipping all expensive operations for speed
    
    // Apply advanced resize options
    if (options.resizeOption !== "none" && metadata.width && metadata.height) {
      let targetWidth: number, targetHeight: number;
      
      if (options.resizeOption === "custom" && options.customWidth && options.customHeight) {
        targetWidth = options.customWidth;
        targetHeight = options.customHeight;
      } else {
        const scale = parseFloat(options.resizeOption) / 100;
        targetWidth = Math.round(metadata.width * scale);
        targetHeight = Math.round(metadata.height * scale);
      }
      
      // Use advanced resampling for better quality
      sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        kernel: options.fastMode ? sharp.kernel.nearest : sharp.kernel.lanczos3, // Fast vs high-quality resampling
        withoutEnlargement: true,
        withoutReduction: false
      });
    }

    // Determine output format and extension
    let fileExtension: string;
    let mimeType: string;
    
    switch (options.outputFormat) {
      case "png":
        fileExtension = "png";
        mimeType = "image/png";
        break;
      case "webp":
        fileExtension = "webp";
        mimeType = "image/webp";
        break;
      case "avif":
        fileExtension = "avif";
        mimeType = "image/avif";
        break;
      default:
        fileExtension = "jpg";
        mimeType = "image/jpeg";
    }
    
    const outputPath = path.join("compressed", `${jobId}.${fileExtension}`);
    console.log(`Output path for job ${jobId}: ${outputPath}`);
    
    // Apply format-specific compression with advanced options
    if (options.outputFormat === "png") {
      // PNG compression with optimization
      const pngOptions: any = {
        compressionLevel: options.pngCompressionLevel || 6, // 0-9, 6 is default
        quality: quality >= 95 ? undefined : quality, // Only use quality for lossy PNG
        effort: options.pngOptimization === 'size' ? 10 : 4, // Higher effort for smaller files
        palette: quality < 80, // Use palette for aggressive compression
        colors: quality < 60 ? 64 : quality < 80 ? 128 : 256, // Reduce colors for smaller files
        dither: 1.0 // Add dithering to reduce banding
      };
      
      // Progressive PNG for larger images
      if (metadata.width && metadata.height && metadata.width * metadata.height > 500000) {
        pngOptions.progressive = true;
      }
      
      sharpInstance = sharpInstance.png(pngOptions);
    } else if (options.outputFormat === "webp") {
      sharpInstance = sharpInstance.webp({
        quality,
        effort: 6, // Maximum compression effort
        lossless: quality >= 95,
        nearLossless: quality >= 90 && quality < 95,
        smartSubsample: true
      });
    } else if (options.outputFormat === "avif") {
      sharpInstance = sharpInstance.avif({
        quality,
        effort: 9, // Maximum compression effort
        lossless: quality >= 95,
        chromaSubsampling: quality < 90 ? '4:2:0' : '4:4:4'
      });
    } else {
      // JPEG compression options (optimized for fast mode)
      const jpegOptions: any = {
        quality,
        mozjpeg: options.fastMode ? false : (options.compressionAlgorithm === "mozjpeg"), // Skip MozJPEG for speed
        progressive: options.fastMode ? false : (options.progressiveJpeg || options.compressionAlgorithm === "progressive"),
        optimiseScans: options.fastMode ? false : options.optimizeScans,
        overshootDeringing: true, // Reduce ringing artifacts
        trellisQuantisation: options.compressionAlgorithm === "mozjpeg"
      };
      
      // Advanced JPEG features
      if (options.arithmeticCoding && options.compressionAlgorithm === "mozjpeg") {
        jpegOptions.arithmeticCoding = true;
      }
      
      // Optimize for web: use 4:2:0 chroma subsampling for smaller files
      if (options.optimizeForWeb && quality < 85) {
        jpegOptions.chromaSubsampling = '4:2:0';
      } else if (quality >= 85) {
        jpegOptions.chromaSubsampling = '4:4:4'; // Better quality
      }
      
      sharpInstance = sharpInstance.jpeg(jpegOptions);
    }

    // Apply final optimizations
    if (options.optimizeForWeb) {
      // Optimize for web delivery
      sharpInstance = sharpInstance
        .withMetadata({})
        .normalize(); // Normalize color space for web
    }

    // Compress and save with performance monitoring
    const startTime = Date.now();
    await sharpInstance.toFile(outputPath);
    const compressionTime = Date.now() - startTime;
    
    console.log(`Compression completed for job ${jobId} in ${compressionTime}ms using ${options.compressionAlgorithm} algorithm`);
    console.log(`Advanced compression completed for job ${jobId}, file saved to ${outputPath}`);

    // Get compressed file size
    const stats = await fs.stat(outputPath);
    const compressedSize = stats.size;
    const compressionRatio = Math.round(((file.size - compressedSize) / file.size) * 100);
    // Calculate compression metrics
    const compressionEfficiency = compressionRatio > 0 ? 'Excellent' : 
                                 compressionRatio > -10 ? 'Good' : 'Limited';
    
    console.log(`Job ${jobId} - Original: ${file.size} bytes, Compressed: ${compressedSize} bytes`);
    console.log(`Compression ratio: ${compressionRatio}% (${compressionEfficiency}), Algorithm: ${options.compressionAlgorithm}`);
    console.log(`Quality setting: ${quality}%, Web optimized: ${options.optimizeForWeb}`);

    // Update job with comprehensive results (complete immediately)
    const updatedJob = await storage.updateCompressionJob(jobId, {
      status: "completed",
      compressedSize,
      compressionRatio,
      compressedPath: outputPath,
      // Store compression settings for reference
      qualityLevel: options.qualityLevel,
      resizeOption: options.resizeOption,
      outputFormat: options.outputFormat
    });
    console.log(`Successfully updated job ${jobId} to completed status with ${options.compressionAlgorithm} compression`);
    
    // Generate optimization insights
    const optimizationInsights = generateOptimizationInsights({
      originalSize: file.size,
      compressedSize,
      compressionRatio,
      quality,
      algorithm: options.compressionAlgorithm,
      webOptimized: options.optimizeForWeb
    });
    
    console.log(`Optimization insights for job ${jobId}:`, optimizationInsights.join('; '));
    
    // Log compression analytics
    if (compressionRatio > 0) {
      console.log(`✅ Successful compression: ${compressionRatio}% size reduction`);
    } else {
      console.log(`⚠️ File size increased by ${Math.abs(compressionRatio)}% - consider different settings`);
    }

    // Calculate quality metrics in background (non-blocking) with timeout
    setTimeout(() => {
      calculateQualityMetricsInBackground(jobId, file.path, outputPath).catch(error => {
        console.warn(`Quality analysis skipped for job ${jobId}:`, error.message);
      });
    }, 100); // Small delay to prevent blocking compression completion

  } catch (error) {
    console.error(`Compression failed for job ${jobId}:`, error);
    await storage.updateCompressionJob(jobId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Helper function to detect file format
function getFileFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // RAW formats
  const rawFormats = ['cr2', 'nef', 'arw', 'dng', 'orf', 'raf', 'pef', 'crw', 'erf', 'dcr', 'k25', 'kdc', 'mrw', 'raw', 'sr2', 'srf'];
  if (rawFormats.includes(ext)) return 'raw';
  
  // Standard formats
  if (ext === 'svg') return 'svg';
  if (['tiff', 'tif'].includes(ext)) return 'tiff';
  
  return ext;
}



// Helper functions for special format trial tracking
async function getOrCreateTrialRecord(ipAddress: string, userAgent: string, browserFingerprint?: string): Promise<SpecialFormatTrial> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  // First, clean up expired records
  await db.delete(specialFormatTrials).where(
    gt(now, specialFormatTrials.expiresAt)
  );

  // Try to find existing trial record
  const [existingTrial] = await db
    .select()
    .from(specialFormatTrials)
    .where(and(
      eq(specialFormatTrials.ipAddress, ipAddress),
      eq(specialFormatTrials.userAgent, userAgent || '')
    ))
    .limit(1);

  if (existingTrial) {
    return existingTrial;
  }

  // Create new trial record
  const [newTrial] = await db
    .insert(specialFormatTrials)
    .values({
      ipAddress,
      userAgent: userAgent || '',
      browserFingerprint: browserFingerprint || '',
      conversionsUsed: 0,
      maxConversions: 3,
      expiresAt: tomorrow,
    })
    .returning();

  return newTrial;
}

async function checkTrialLimit(ipAddress: string, userAgent: string, browserFingerprint?: string): Promise<{
  allowed: boolean;
  remaining: number;
  total: number;
  message?: string;
}> {
  const trial = await getOrCreateTrialRecord(ipAddress, userAgent, browserFingerprint);
  
  const remaining = trial.maxConversions - trial.conversionsUsed;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      total: trial.maxConversions,
      message: "Trial limit reached. Upgrade to continue converting special formats."
    };
  }

  return {
    allowed: true,
    remaining,
    total: trial.maxConversions
  };
}

async function incrementTrialUsage(ipAddress: string, userAgent: string): Promise<void> {
  await db
    .update(specialFormatTrials)
    .set({
      conversionsUsed: sql`${specialFormatTrials.conversionsUsed} + 1`,
      lastUsed: new Date(),
    })
    .where(and(
      eq(specialFormatTrials.ipAddress, ipAddress),
      eq(specialFormatTrials.userAgent, userAgent || '')
    ));
}

// Generate thumbnail from any converted image file for immediate preview
async function generateThumbnailFromRaw(inputPath: string, outputDir: string, jobId: string): Promise<string | undefined> {
  try {
    // Ensure previews directory exists in the root
    const previewsDir = path.join(process.cwd(), 'previews');
    await fs.mkdir(previewsDir, { recursive: true });
    
    // Use job ID for consistent naming
    const thumbnailPath = path.join(previewsDir, jobId + '_thumb.jpg');
    
    // Generate small, fast JPEG thumbnail from any input format
    const thumbnailCommand = `convert "${inputPath}" -resize "256x256>" -quality 60 -strip "${thumbnailPath}"`;
    console.log(`🖼️ Generating thumbnail from ${inputPath}: ${thumbnailCommand}`);
    
    await execAsync(thumbnailCommand);
    console.log(`✅ Fast thumbnail generated: ${thumbnailPath}`);
    return thumbnailPath;
  } catch (error) {
    console.warn(`⚠️ Fast thumbnail generation failed for ${jobId}:`, error);
    return undefined;
  }
}

// Special format conversion processor
async function processSpecialFormatConversion(
  inputPath: string,
  outputPath: string,
  inputFormat: string,
  outputFormat: string,
  options: {
    quality: number;
    resize: boolean;
    width: number;
    height: number;
    maintainAspect: boolean;
    resizePercentage?: number;
  } = {
    quality: 85,
    resize: false,
    width: 2560,
    height: 2560,
    maintainAspect: true
  }
): Promise<{ success: boolean; outputSize: number; previewPath?: string }> {
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  let sharpInstance: sharp.Sharp;

  try {
    // Handle different input formats
    if (inputFormat === 'raw') {
      // For RAW files, use dcraw to extract to PPM, then convert with ImageMagick
      // This bypasses ImageMagick's TIFF parsing issues with RAW files
      console.log(`Converting RAW file ${inputPath} to ${outputFormat} using dcraw_emu + ImageMagick...`);
      
      // Verify input file exists before conversion
      const inputExists = await fs.access(inputPath).then(() => true).catch(() => false);
      console.log(`Input file exists: ${inputExists}`);
      
      // Step 1: Use dcraw_emu (from libraw) to extract RAW to PPM format (uncompressed RGB)
      const tempPpmPath = inputPath + '_temp.ppm';
      const dcrawCommand = `dcraw_emu -w -T "${inputPath}"`;
      console.log(`Running dcraw_emu command: ${dcrawCommand}`);
      await execAsync(dcrawCommand);
      
      // dcraw_emu creates a .tiff file with the same base name
      const baseName = inputPath.replace(/\.[^/.]+$/, "");
      const tempTiffPath = baseName + '.tiff';
      console.log(`Expected TIFF output: ${tempTiffPath}`);
      
      // Verify TIFF file was created
      const tiffExists = await fs.access(tempTiffPath).then(() => true).catch(() => false);
      console.log(`TIFF file created: ${tiffExists}`);
      
      // Step 2: Convert TIFF to final format using ImageMagick with compression
      let convertCommand;
      let resizeParam = '';
      
      
      // FORCE PNG RESIZE: If resize is requested, get actual dimensions from TIFF and calculate target size
      // Check both explicit resize flag AND percentage < 100 (fallback for parameter issues)  
      const shouldResizeImage = options.resize === true || options.resize === 'true';
      const hasValidPercentage = options.resizePercentage && options.resizePercentage < 100 && options.resizePercentage > 0;
      
      console.log(`🔧 RESIZE CONDITIONS: shouldResizeImage=${shouldResizeImage}, hasValidPercentage=${hasValidPercentage}, resizePercentage=${options.resizePercentage}`);
      
      if ((shouldResizeImage && hasValidPercentage) || hasValidPercentage) {
        // Get actual dimensions from the TIFF file
        const identifyCommand = `identify -ping -format "%wx%h" "${tempTiffPath}"`;
        console.log(`🔧 RESIZE DEBUG: Running identify command: ${identifyCommand}`);
        const dimensionsOutput = await execAsync(identifyCommand);
        const dimensions = dimensionsOutput.stdout.trim();
        const [actualWidth, actualHeight] = dimensions.split('x').map(Number);
        
        console.log(`🔧 RAW actual dimensions: ${actualWidth}x${actualHeight}, Resize to: ${options.resizePercentage}%`);
        
        // Calculate target dimensions based on actual image size and percentage
        const targetWidth = Math.round(actualWidth * (options.resizePercentage / 100));
        const targetHeight = Math.round(actualHeight * (options.resizePercentage / 100));
        
        console.log(`🔧 RAW target dimensions: ${targetWidth}x${targetHeight}`);
        resizeParam = `-resize "${targetWidth}x${targetHeight}!"`;  // Added ! to force exact dimensions
      } else {
        console.log(`🔧 RESIZE DEBUG: No resize requested - options.resize=${options.resize}, options.resizePercentage=${options.resizePercentage}`);
      }
      
      switch (outputFormat) {
        case 'jpeg':
          convertCommand = `convert "${tempTiffPath}" -quality ${options.quality} ${resizeParam} "${outputPath}"`;
          break;
        case 'png':
          convertCommand = `convert "${tempTiffPath}" -define png:compression-level=8 ${resizeParam} "${outputPath}"`;
          break;
        case 'webp':
          convertCommand = `convert "${tempTiffPath}" -quality ${options.quality} ${resizeParam} "${outputPath}"`;
          break;
        case 'tiff':
          convertCommand = `convert "${tempTiffPath}" -compress jpeg -quality ${options.quality} ${resizeParam} "${outputPath}"`;
          break;
        case 'avif':
          convertCommand = `convert "${tempTiffPath}" -quality ${options.quality} ${resizeParam} "${outputPath}"`;
          break;
          
        default:
          throw new Error(`Unsupported output format: ${outputFormat}`);
      }
      
      console.log(`Running ImageMagick convert command: ${convertCommand}`);
      
      // For TIFF output, generate thumbnail in parallel for immediate preview
      let thumbnailPromise: Promise<string | undefined> | undefined;
      if (outputFormat === 'tiff') {
        // Extract jobId from output path (format: converted/{jobId}.{ext})
        const outputFilename = path.basename(outputPath, path.extname(outputPath));
        thumbnailPromise = generateThumbnailFromRaw(tempTiffPath, path.dirname(outputPath), outputFilename);
      }
      
      await execAsync(convertCommand);
      
      // Verify output file was created
      const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
      console.log(`Output file created: ${outputExists}`);
      
      let previewPath: string | undefined;
      
      // Generate preview for TIFF files
      if (outputFormat === 'tiff') {
        try {
          const previewsDir = path.dirname(outputPath).replace('/converted', '/previews');
          await fs.mkdir(previewsDir, { recursive: true });
          
          const outputFilename = path.basename(outputPath, path.extname(outputPath));
          previewPath = path.join(previewsDir, outputFilename + '.jpg');
          
          const previewCommand = `convert "${tempTiffPath}" -resize "512x512>" -quality 70 "${previewPath}"`;
          console.log(`Generating TIFF preview: ${previewCommand}`);
          await execAsync(previewCommand);
          
          console.log(`TIFF preview generated: ${previewPath}`);
        } catch (previewError) {
          console.warn(`Failed to generate TIFF preview:`, previewError);
          previewPath = undefined;
        }
      }
      
      // Clean up temp TIFF file
      try {
        await fs.unlink(tempTiffPath);
        console.log(`Cleaned up temporary TIFF file: ${tempTiffPath}`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up temporary TIFF file ${tempTiffPath}:`, cleanupError);
      }
      
      // Wait for thumbnail generation if it was started
      let thumbnailPath: string | undefined;
      if (thumbnailPromise) {
        try {
          thumbnailPath = await thumbnailPromise;
          console.log(`Thumbnail generated: ${thumbnailPath}`);
        } catch (thumbnailError) {
          console.warn(`Thumbnail generation failed:`, thumbnailError);
        }
      }
      
      // Skip Sharp processing for RAW files since we handled everything
      const stats = await fs.stat(outputPath);
      return { success: true, outputSize: stats.size, previewPath: thumbnailPath || previewPath };
      
      // Clean up temp file after processing (we'll do this in finally block)
    } else if (inputFormat === 'svg') {
      // For SVG files, Sharp handles them natively
      sharpInstance = sharp(inputPath, {
        density: 300 // High DPI for SVG rasterization
      });
    } else if (inputFormat === 'tiff') {
      // For TIFF files
      sharpInstance = sharp(inputPath);
    } else {
      // Standard image formats (JPEG, PNG, WebP) - use Sharp
      sharpInstance = sharp(inputPath);
    }

    // Apply resize if enabled
    if (options.resize) {
      const resizeOptions: any = {
        width: options.width,
        height: options.height,
        fit: options.maintainAspect ? 'inside' : 'fill',
        withoutEnlargement: true
      };
      sharpInstance = sharpInstance.resize(resizeOptions);
    }
    
    // Apply output format conversion
    switch (outputFormat) {
      case 'jpeg':
        await sharpInstance
          .jpeg({ 
            quality: options.quality,
            progressive: true,
            mozjpeg: true
          })
          .toFile(outputPath);
        break;
        
      case 'png':
        await sharpInstance
          .png({ 
            quality: options.quality,
            compressionLevel: 8,
            adaptiveFiltering: true
          })
          .toFile(outputPath);
        break;
        
      case 'webp':
        await sharpInstance
          .webp({ 
            quality: options.quality,
            effort: 4
          })
          .toFile(outputPath);
        break;
        
      case 'tiff':
        await sharpInstance
          .tiff({ 
            compression: 'jpeg',
            quality: options.quality,
            predictor: 'horizontal'
          })
          .toFile(outputPath);
        break;
        
      case 'avif':
        await sharpInstance
          .avif({ 
            quality: 90,
            effort: 4
          })
          .toFile(outputPath);
        break;
        
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    const stats = await fs.stat(outputPath);
    
    let previewPath: string | undefined;
    
    // Generate preview for TIFF files
    if (outputFormat === 'tiff') {
      try {
        const previewsDir = path.dirname(outputPath).replace('/converted', '/previews');
        await fs.mkdir(previewsDir, { recursive: true });
        
        const outputFilename = path.basename(outputPath, path.extname(outputPath));
        previewPath = path.join(previewsDir, outputFilename + '.jpg');
        
        // Generate preview using Sharp for better quality
        await sharp(outputPath)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 70, progressive: true })
          .toFile(previewPath);
        
        console.log(`TIFF preview generated: ${previewPath}`);
      } catch (previewError) {
        console.warn(`Failed to generate TIFF preview:`, previewError);
        previewPath = undefined;
      }
    }
    
    return { success: true, outputSize: stats.size, previewPath };

  } catch (error) {
    console.error(`Conversion error (${inputFormat} → ${outputFormat}):`, error);
    throw new Error(`Failed to convert ${inputFormat} to ${outputFormat}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Background quality assessment function with timeout
async function calculateQualityMetricsInBackground(
  jobId: string, 
  originalPath: string, 
  compressedPath: string
): Promise<void> {
  const timeoutMs = 10000; // 10 second timeout
  
  try {
    console.log(`Calculating quality metrics for job ${jobId} in background...`);
    
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

/**
 * DEVELOPMENT: Reset counter for testing
 */
export function registerResetEndpoints(app: Express) {
  app.post('/api/dev-reset-counter', async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.body?.sessionId || req.body?.clientSessionId;
      const pageIdentifier = req.headers['x-page-identifier'] || req.body?.pageIdentifier || 'cr2-free';
      
      console.log(`🔧 DEV: Reset counter request - sessionId: ${sessionId}, pageIdentifier: ${pageIdentifier}`);
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      let clearedSystems = 0;

      // Try various cache key patterns that might be used
      const cacheKeys = [
        `usage:${sessionId}:${pageIdentifier}`,
        `session:${sessionId}:${pageIdentifier}`, 
        `counters:${sessionId}:${pageIdentifier}`,
        `daily:${sessionId}:${pageIdentifier}`,
        `monthly:${sessionId}:${pageIdentifier}`
      ];

      // Clear Redis cache if it exists
      if (safeRedis) {
        for (const key of cacheKeys) {
          await safeRedis.del(key);
          console.log(`🔧 DEV: Cleared cache key: ${key}`);
        }
        clearedSystems++;
      }

      // Clear database entries
      try {
        // Clear from anonymousSessionScopes table for anonymous users
        await db.delete(anonymousSessionScopes)
          .where(
            and(
              eq(anonymousSessionScopes.sessionId, sessionId),
              eq(anonymousSessionScopes.scope, pageIdentifier)
            )
          );
        console.log(`🔧 DEV: Cleared anonymousSessionScopes for session: ${sessionId}, scope: ${pageIdentifier}`);
        clearedSystems++;
      } catch (dbError) {
        console.warn('🔧 DEV: anonymousSessionScopes clear failed (might not exist):', dbError);
      }

      // ** CRITICAL: Clear DualUsageTracker data from userUsage table **
      try {
        const userUsageDeleted = await db.delete(userUsage)
          .where(
            and(
              eq(userUsage.sessionId, sessionId),
              eq(userUsage.userId, 'anonymous')
            )
          );
        console.log(`🔧 DEV: CLEARED DualUsageTracker userUsage for session: ${sessionId}`);
        clearedSystems++;
      } catch (dbError) {
        console.error('🔧 DEV: userUsage clear failed:', dbError);
      }

      // Clear operation logs for this session
      try {
        await db.delete(operationLog)
          .where(eq(operationLog.sessionId, sessionId));
        console.log(`🔧 DEV: Cleared operationLog for session: ${sessionId}`);
        clearedSystems++;
      } catch (dbError) {
        console.warn('🔧 DEV: operationLog clear failed:', dbError);
      }

      res.json({ 
        success: true, 
        message: `ALL tracking systems reset for session ${sessionId}`,
        cleared: {
          sessionId,
          pageIdentifier,
          systems: clearedSystems,
          redisKeys: cacheKeys.length,
          database: ['anonymousSessionScopes', 'userUsage', 'operationLog']
        }
      });
      
    } catch (error) {
      console.error('🔧 DEV: Counter reset failed:', error);
      res.status(500).json({ error: 'Reset failed', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // ** NEW: NUCLEAR RESET - Clear everything for all anonymous users **
  app.post('/api/dev-nuclear-reset', async (req, res) => {
    try {
      console.log(`🚨 DEV: NUCLEAR RESET - Clearing ALL anonymous usage data`);
      
      let clearedItems = 0;

      // Clear all anonymous userUsage records
      try {
        const result = await db.delete(userUsage)
          .where(eq(userUsage.userId, 'anonymous'));
        console.log(`🚨 DEV: Cleared ALL anonymous userUsage records`);
        clearedItems++;
      } catch (error) {
        console.error('Nuclear reset userUsage failed:', error);
      }

      // Clear all anonymousSessionScopes
      try {
        await db.delete(anonymousSessionScopes);
        console.log(`🚨 DEV: Cleared ALL anonymousSessionScopes`);
        clearedItems++;
      } catch (error) {
        console.error('Nuclear reset anonymousSessionScopes failed:', error);
      }

      // Clear all operation logs for anonymous users
      try {
        await db.delete(operationLog)
          .where(eq(operationLog.userId, null));
        console.log(`🚨 DEV: Cleared ALL anonymous operationLog records`);
        clearedItems++;
      } catch (error) {
        console.error('Nuclear reset operationLog failed:', error);
      }

      res.json({
        success: true,
        message: `NUCLEAR RESET: All anonymous usage data cleared`,
        clearedSystems: clearedItems
      });

    } catch (error) {
      console.error('🚨 DEV: Nuclear reset failed:', error);
      res.status(500).json({ error: 'Nuclear reset failed', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}
