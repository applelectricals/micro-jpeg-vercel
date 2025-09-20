import { Router } from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { authenticateApiKey, requirePermission, ApiKeyManager } from './apiAuth';
import { CompressionEngine } from './compressionEngine';
import { apiCompressRequestSchema } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { rateLimitMiddleware, getRateLimitStatus } from './rateLimiter';

const router = Router();

// Import unified plan configuration
import { getUserPlan, checkFileSize } from './unifiedPlanConfig';

// Configure multer for API file uploads with tier-based limits
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB max (will be checked per tier)
    files: 10 // Up to 10 files per batch
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif',
      'image/svg+xml', 'image/tiff', 'image/tif',
      // RAW formats
      'image/arw', 'image/cr2', 'image/dng', 'image/nef', 'image/orf', 'image/raf', 'image/rw2',
      'application/octet-stream' // Some RAW files may have this MIME type
    ];
    
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'tiff', 'tif', 'arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2'];
    const isValidExtension = validExtensions.includes(fileExtension || '');
    
    if (allowedTypes.includes(file.mimetype) || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} (.${fileExtension})`));
    }
  }
});

// Configure multer for special format API uploads (RAW, SVG, TIFF)
const specialFormatUpload = multer({ 
  storage,
  limits: { 
    fileSize: 150 * 1024 * 1024, // 150MB limit for professional formats
    files: 5 // Up to 5 special format files per batch
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      // RAW formats
      'image/arw', 'image/cr2', 'image/dng', 'image/nef', 'image/orf', 'image/raf', 'image/rw2',
      'application/octet-stream', // Some RAW files may have this MIME type
      // SVG formats
      'image/svg+xml', 'text/xml',
      // TIFF formats
      'image/tiff', 'image/tif'
    ];
    
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const isValidExtension = ['arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2', 'svg', 'tiff', 'tif'].includes(fileExtension || '');
    
    if (allowedMimeTypes.includes(file.mimetype) || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported special format: ${file.mimetype} (.${fileExtension})`));
    }
  }
});

/**
 * GET /api/v1/status - API health check
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      compress: '/api/v1/compress',
      batch: '/api/v1/batch',
      webhook: '/api/v1/webhook',
      'special-convert': '/api/v1/special/convert',
      'special-batch': '/api/v1/special/batch',
      'special-formats': '/api/v1/special/formats'
    },
    supportedFormats: {
      input: ['JPEG', 'JPG', 'PNG', 'WEBP', 'AVIF', 'SVG', 'TIFF', 'TIF', 'ARW', 'CR2', 'DNG', 'NEF', 'ORF', 'RAF', 'RW2'],
      output: ['JPEG', 'PNG', 'WEBP', 'AVIF', 'TIFF']
    },
    tierLimits: {
      free: { maxFileSize: '10MB', operations: 500 },
      premium: { maxFileSize: '50MB', operations: 10000 },
      enterprise: { maxFileSize: '200MB', operations: 50000 }
    }
  });
});

/**
 * POST /api/v1/compress - Single file compression
 */
router.post('/compress', 
  authenticateApiKey,
  rateLimitMiddleware,
  requirePermission('compress'),
  upload.single('image'),
  async (req, res) => {
    const startTime = Date.now();

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Missing file',
          message: 'Please provide an image file in the "image" field'
        });
      }

      // Tier-based file size validation
      const fileSize = req.file.size;
      const user = (req as any).apiKey?.user; // Set by authenticateApiKey middleware
      const tierConfig = getUserTier(user);
      const fileSizeCheck = checkFileLimit(user, fileSize);
      
      if (!fileSizeCheck.allowed) {
        const maxSizeMB = Math.round(tierConfig.limits.maxFileSize / (1024 * 1024));
        return res.status(413).json({
          error: 'File size limit exceeded',
          message: `Maximum file size for ${tierConfig.displayName} tier is ${maxSizeMB}MB`,
          tier: tierConfig.displayName,
          maxFileSize: tierConfig.limits.maxFileSize,
          currentFileSize: fileSize,
          upgrade: tierConfig.id === 'free' ? 'Upgrade to Premium for 50MB files or Enterprise for 200MB files' : tierConfig.id === 'pro' ? 'Upgrade to Enterprise for 200MB files' : null
        });
      }

      // Parse and validate compression settings
      const settingsInput = req.body.settings ? JSON.parse(req.body.settings) : {};
      const parseResult = apiCompressRequestSchema.safeParse(settingsInput);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Invalid settings',
          message: 'Compression settings validation failed',
          details: parseResult.error.issues
        });
      }

      const settings = parseResult.data;

      // Create temporary directories
      const tempDir = path.join(process.cwd(), 'temp');
      const uploadsDir = path.join(tempDir, 'uploads');
      const outputDir = path.join(tempDir, 'compressed');

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      // Save uploaded file
      const fileId = uuidv4();
      const originalExtension = path.extname(req.file.originalname);
      const inputPath = path.join(uploadsDir, `${fileId}${originalExtension}`);
      
      await fs.writeFile(inputPath, req.file.buffer);

      // Determine output format and extension
      let outputFormat = settings.outputFormat;
      if (outputFormat === 'jpeg' && !req.file.originalname.toLowerCase().includes('.jpg') && !req.file.originalname.toLowerCase().includes('.jpeg')) {
        // Convert to JPEG
      }

      const outputExtension = outputFormat === 'jpeg' ? '.jpg' : `.${outputFormat}`;
      const outputPath = path.join(outputDir, `compressed_${fileId}${outputExtension}`);

      // Compress the image using the enhanced compression engine
      const result = await CompressionEngine.compressWithAdvancedSettings(
        inputPath,
        outputPath,
        settings.quality,
        outputFormat as 'jpeg' | 'webp' | 'avif' | 'png',
        {
          compressionAlgorithm: settings.compressionAlgorithm,
          resizeQuality: settings.resizeQuality,
          progressive: settings.progressive,
          webOptimized: settings.webOptimization
        }
      );

      // Get file stats
      const originalStats = await fs.stat(inputPath);
      const compressedStats = await fs.stat(outputPath);
      
      const compressionRatio = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);

      // Read compressed file for response
      const compressedBuffer = await fs.readFile(outputPath);

      // Clean up temporary files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        result: {
          id: fileId,
          originalFilename: req.file.originalname,
          originalSize: originalStats.size,
          compressedSize: compressedStats.size,
          compressionRatio,
          outputFormat,
          qualityUsed: result.qualityUsed,
          processingTime,
          data: compressedBuffer.toString('base64'), // Return as base64 for API
        },
        usage: {
          apiKeyId: req.apiKey!.id,
          bytesProcessed: originalStats.size,
          bytesReturned: compressedStats.size,
        }
      });

    } catch (error: any) {
      console.error('API compression error:', error);
      res.status(500).json({
        error: 'Compression failed',
        message: error.message || 'An unexpected error occurred during compression'
      });
    }
  }
);

/**
 * POST /api/v1/batch - Batch file compression
 */
router.post('/batch',
  authenticateApiKey,
  rateLimitMiddleware,
  requirePermission('batch'),
  upload.array('images', 10),
  async (req, res) => {
    const startTime = Date.now();

    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'Missing files',
          message: 'Please provide image files in the "images" field'
        });
      }

      // Parse settings
      const settingsInput = req.body.settings ? JSON.parse(req.body.settings) : {};
      const parseResult = apiCompressRequestSchema.safeParse(settingsInput);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Invalid settings',
          message: 'Compression settings validation failed',
          details: parseResult.error.issues
        });
      }

      const settings = parseResult.data;

      // Create temporary directories
      const tempDir = path.join(process.cwd(), 'temp');
      const uploadsDir = path.join(tempDir, 'uploads');
      const outputDir = path.join(tempDir, 'compressed');

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      const results = [];
      let totalBytesProcessed = 0;
      let totalBytesReturned = 0;

      // Process each file
      for (const file of files) {
        try {
          const fileId = uuidv4();
          const originalExtension = path.extname(file.originalname);
          const inputPath = path.join(uploadsDir, `${fileId}${originalExtension}`);
          
          await fs.writeFile(inputPath, file.buffer);

          const outputFormat = settings.outputFormat;
          const outputExtension = outputFormat === 'jpeg' ? '.jpg' : `.${outputFormat}`;
          const outputPath = path.join(outputDir, `compressed_${fileId}${outputExtension}`);

          // Compress the image
          const result = await CompressionEngine.compressWithAdvancedSettings(
            inputPath,
            outputPath,
            settings.quality,
            outputFormat as 'jpeg' | 'webp' | 'avif' | 'png',
            {
              compressionAlgorithm: settings.compressionAlgorithm,
              resizeQuality: settings.resizeQuality,
              progressive: settings.progressive,
              webOptimized: settings.webOptimization
            }
          );

          // Get file stats
          const originalStats = await fs.stat(inputPath);
          const compressedStats = await fs.stat(outputPath);
          
          const compressionRatio = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);

          // Read compressed file
          const compressedBuffer = await fs.readFile(outputPath);

          totalBytesProcessed += originalStats.size;
          totalBytesReturned += compressedStats.size;

          results.push({
            id: fileId,
            originalFilename: file.originalname,
            originalSize: originalStats.size,
            compressedSize: compressedStats.size,
            compressionRatio,
            outputFormat,
            qualityUsed: result.qualityUsed,
            data: compressedBuffer.toString('base64'),
            success: true
          });

          // Clean up files
          await fs.unlink(inputPath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});

        } catch (error: any) {
          results.push({
            originalFilename: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        results,
        summary: {
          totalFiles: files.length,
          successfulFiles: results.filter(r => r.success).length,
          failedFiles: results.filter(r => !r.success).length,
          totalBytesProcessed,
          totalBytesReturned,
          totalCompressionRatio: Math.round(((totalBytesProcessed - totalBytesReturned) / totalBytesProcessed) * 100),
          processingTime
        },
        usage: {
          apiKeyId: req.apiKey!.id,
          bytesProcessed: totalBytesProcessed,
          bytesReturned: totalBytesReturned,
        }
      });

    } catch (error: any) {
      console.error('API batch compression error:', error);
      res.status(500).json({
        error: 'Batch compression failed',
        message: error.message || 'An unexpected error occurred during batch compression'
      });
    }
  }
);

/**
 * GET /api/v1/usage - Get API usage statistics
 */
router.get('/usage',
  authenticateApiKey,
  rateLimitMiddleware,
  async (req, res) => {
    try {
      // This would typically query the apiUsage table for statistics
      // For now, return basic info
      res.json({
        apiKey: {
          id: req.apiKey!.id,
          name: req.apiKey!.name,
          permissions: req.apiKey!.permissions,
          rateLimit: req.apiKey!.rateLimit
        },
        usage: {
          currentHour: 0, // Would be calculated from apiUsage table
          remainingRequests: req.apiKey!.rateLimit,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      });
    } catch (error: any) {
      console.error('API usage check error:', error);
      res.status(500).json({
        error: 'Usage check failed',
        message: error.message
      });
    }
  }
);

// Import required modules for special format processing
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execAsync = promisify(exec);

/**
 * GET /api/v1/special/formats - Get supported special formats
 */
router.get('/special/formats', authenticateApiKey, rateLimitMiddleware, async (req, res) => {
  res.json({
    supportedFormats: {
      input: {
        raw: {
          formats: ['ARW', 'CR2', 'DNG', 'NEF', 'ORF', 'RAF', 'RW2'],
          description: 'Camera RAW files from professional cameras',
          maxFileSize: '150MB',
          processingTime: '15-30 seconds'
        },
        vector: {
          formats: ['SVG'],
          description: 'Scalable Vector Graphics',
          maxFileSize: '50MB',
          processingTime: '5-10 seconds'
        },
        formats: {
          formats: ['TIFF', 'TIF'],
          description: 'Tagged Image File Format',
          maxFileSize: '150MB',
          processingTime: '10-20 seconds'
        }
      },
      output: ['JPEG', 'PNG', 'WebP', 'AVIF', 'TIFF'],
      pricing: {
        perConversion: '$0.10',
        monthlyPlan: '$29.99/month for 500 conversions',
        enterprisePlan: 'Custom pricing for 1000+ conversions/month'
      }
    }
  });
});

/**
 * POST /api/v1/special/convert - Single special format conversion
 */
router.post('/special/convert',
  authenticateApiKey,
  rateLimitMiddleware,
  requirePermission('special-convert'),
  specialFormatUpload.single('file'),
  async (req, res) => {
    const startTime = Date.now();

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Missing file',
          message: 'Please provide a special format file in the "file" field'
        });
      }

      const { outputFormat = 'jpeg', quality = 85, resize, width, height, maintainAspect = 'true' } = req.body;

      // Validate output format
      const validOutputFormats = ['jpeg', 'png', 'webp', 'avif', 'tiff'];
      if (!validOutputFormats.includes(outputFormat.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid output format',
          message: `Supported output formats: ${validOutputFormats.join(', ')}`
        });
      }

      // Create temporary directories
      const tempDir = path.join(process.cwd(), 'temp');
      const uploadsDir = path.join(tempDir, 'uploads');
      const outputDir = path.join(tempDir, 'converted');

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      // Save uploaded file
      const fileId = uuidv4();
      const originalExtension = path.extname(req.file.originalname);
      const inputPath = path.join(uploadsDir, `${fileId}${originalExtension}`);
      
      await fs.writeFile(inputPath, req.file.buffer);

      // Determine file type and process accordingly
      const fileExtension = req.file.originalname.toLowerCase().split('.').pop();
      const outputExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
      const outputPath = path.join(outputDir, `converted_${fileId}.${outputExtension}`);

      let conversionResult;

      if (['arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2'].includes(fileExtension || '')) {
        // RAW file conversion using dcraw_emu + ImageMagick
        conversionResult = await convertRawFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
      } else if (fileExtension === 'svg') {
        // SVG conversion using ImageMagick
        conversionResult = await convertSvgFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
      } else if (['tiff', 'tif'].includes(fileExtension || '')) {
        // TIFF conversion using Sharp
        conversionResult = await convertTiffFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      // Get file stats
      const originalStats = await fs.stat(inputPath);
      const compressedStats = await fs.stat(outputPath);
      const compressionRatio = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);

      // Read converted file for response
      const convertedBuffer = await fs.readFile(outputPath);

      // Clean up temporary files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        result: {
          id: fileId,
          originalFilename: req.file.originalname,
          originalSize: originalStats.size,
          convertedSize: compressedStats.size,
          compressionRatio,
          inputFormat: fileExtension?.toUpperCase(),
          outputFormat: outputFormat.toUpperCase(),
          processingTime,
          data: convertedBuffer.toString('base64'),
        },
        usage: {
          apiKeyId: req.apiKey!.id,
          bytesProcessed: originalStats.size,
          bytesReturned: compressedStats.size,
        }
      });

    } catch (error: any) {
      console.error('API special format conversion error:', error);
      res.status(500).json({
        error: 'Conversion failed',
        message: error.message || 'An unexpected error occurred during conversion'
      });
    }
  }
);

/**
 * POST /api/v1/special/batch - Batch special format conversion
 */
router.post('/special/batch',
  authenticateApiKey,
  rateLimitMiddleware,
  requirePermission('special-batch'),
  specialFormatUpload.array('files', 5),
  async (req, res) => {
    const startTime = Date.now();

    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'Missing files',
          message: 'Please provide special format files in the "files" field'
        });
      }

      const { outputFormat = 'jpeg', quality = 85, resize, width, height, maintainAspect = 'true' } = req.body;

      // Validate output format
      const validOutputFormats = ['jpeg', 'png', 'webp', 'avif', 'tiff'];
      if (!validOutputFormats.includes(outputFormat.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid output format',
          message: `Supported output formats: ${validOutputFormats.join(', ')}`
        });
      }

      // Create temporary directories
      const tempDir = path.join(process.cwd(), 'temp');
      const uploadsDir = path.join(tempDir, 'uploads');
      const outputDir = path.join(tempDir, 'converted');

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      const results = [];
      let totalBytesProcessed = 0;
      let totalBytesReturned = 0;

      // Process each file
      for (const file of files) {
        try {
          const fileId = uuidv4();
          const originalExtension = path.extname(file.originalname);
          const inputPath = path.join(uploadsDir, `${fileId}${originalExtension}`);
          
          await fs.writeFile(inputPath, file.buffer);

          const fileExtension = file.originalname.toLowerCase().split('.').pop();
          const outputExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
          const outputPath = path.join(outputDir, `converted_${fileId}.${outputExtension}`);

          let conversionResult;

          if (['arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2'].includes(fileExtension || '')) {
            conversionResult = await convertRawFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
          } else if (fileExtension === 'svg') {
            conversionResult = await convertSvgFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
          } else if (['tiff', 'tif'].includes(fileExtension || '')) {
            conversionResult = await convertTiffFileAPI(inputPath, outputPath, outputFormat, quality, resize, width, height, maintainAspect);
          } else {
            throw new Error(`Unsupported file format: ${fileExtension}`);
          }

          // Get file stats
          const originalStats = await fs.stat(inputPath);
          const compressedStats = await fs.stat(outputPath);
          const compressionRatio = Math.round(((originalStats.size - compressedStats.size) / originalStats.size) * 100);

          // Read converted file
          const convertedBuffer = await fs.readFile(outputPath);

          totalBytesProcessed += originalStats.size;
          totalBytesReturned += compressedStats.size;

          results.push({
            id: fileId,
            originalFilename: file.originalname,
            originalSize: originalStats.size,
            convertedSize: compressedStats.size,
            compressionRatio,
            inputFormat: fileExtension?.toUpperCase(),
            outputFormat: outputFormat.toUpperCase(),
            data: convertedBuffer.toString('base64'),
            success: true
          });

          // Clean up files
          await fs.unlink(inputPath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});

        } catch (error: any) {
          results.push({
            originalFilename: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        results,
        summary: {
          totalFiles: files.length,
          successfulFiles: results.filter(r => r.success).length,
          failedFiles: results.filter(r => !r.success).length,
          totalBytesProcessed,
          totalBytesReturned,
          totalCompressionRatio: Math.round(((totalBytesProcessed - totalBytesReturned) / totalBytesProcessed) * 100),
          processingTime
        },
        usage: {
          apiKeyId: req.apiKey!.id,
          bytesProcessed: totalBytesProcessed,
          bytesReturned: totalBytesReturned,
        }
      });

    } catch (error: any) {
      console.error('API special format batch conversion error:', error);
      res.status(500).json({
        error: 'Batch conversion failed',
        message: error.message || 'An unexpected error occurred during batch conversion'
      });
    }
  }
);

// Helper functions for special format conversions

/**
 * Convert RAW file using dcraw_emu and ImageMagick
 */
async function convertRawFileAPI(
  inputPath: string, 
  outputPath: string, 
  outputFormat: string, 
  quality: number, 
  resize: string, 
  width: number, 
  height: number, 
  maintainAspect: string
) {
  console.log(`Converting RAW file ${inputPath} to ${outputFormat}...`);
  
  // Step 1: Convert RAW to TIFF using dcraw_emu
  const tiffPath = inputPath + '.tiff';
  await execAsync(`dcraw_emu -w -T "${inputPath}"`);
  
  // Check if TIFF was created
  const tiffExists = await fs.access(tiffPath).then(() => true).catch(() => false);
  if (!tiffExists) {
    throw new Error('Failed to convert RAW file to TIFF');
  }
  
  // Step 2: Convert TIFF to desired format using ImageMagick
  let convertCmd = `convert "${tiffPath}"`;
  
  // Add resize if specified
  if (resize === 'true' && width && height) {
    const resizeOption = maintainAspect === 'true' ? `${width}x${height}>` : `${width}x${height}!`;
    convertCmd += ` -resize "${resizeOption}"`;
  }
  
  // Add format-specific settings
  switch (outputFormat.toLowerCase()) {
    case 'jpeg':
      convertCmd += ` -quality ${quality}`;
      break;
    case 'png':
      convertCmd += ` -define png:compression-level=8`;
      break;
    case 'webp':
      convertCmd += ` -quality ${quality}`;
      break;
    case 'avif':
      convertCmd += ` -quality ${quality}`;
      break;
    case 'tiff':
      convertCmd += ` -compress lzw`;
      break;
  }
  
  convertCmd += ` "${outputPath}"`;
  
  await execAsync(convertCmd);
  
  // Clean up temporary TIFF file
  await fs.unlink(tiffPath).catch(() => {});
  
  return { success: true };
}

/**
 * Convert SVG file using ImageMagick
 */
async function convertSvgFileAPI(
  inputPath: string, 
  outputPath: string, 
  outputFormat: string, 
  quality: number, 
  resize: string, 
  width: number, 
  height: number, 
  maintainAspect: string
) {
  console.log(`Converting SVG file ${inputPath} to ${outputFormat}...`);
  
  let convertCmd = `convert "${inputPath}"`;
  
  // Set density for better quality (SVG to raster conversion)
  convertCmd = `convert -density 300 "${inputPath}"`;
  
  // Add resize if specified
  if (resize === 'true' && width && height) {
    const resizeOption = maintainAspect === 'true' ? `${width}x${height}>` : `${width}x${height}!`;
    convertCmd += ` -resize "${resizeOption}"`;
  }
  
  // Add format-specific settings
  switch (outputFormat.toLowerCase()) {
    case 'jpeg':
      convertCmd += ` -quality ${quality} -background white -flatten`;
      break;
    case 'png':
      convertCmd += ` -define png:compression-level=8`;
      break;
    case 'webp':
      convertCmd += ` -quality ${quality}`;
      break;
    case 'avif':
      convertCmd += ` -quality ${quality}`;
      break;
    case 'tiff':
      convertCmd += ` -compress lzw`;
      break;
  }
  
  convertCmd += ` "${outputPath}"`;
  
  await execAsync(convertCmd);
  
  return { success: true };
}

/**
 * Convert TIFF file using Sharp
 */
async function convertTiffFileAPI(
  inputPath: string, 
  outputPath: string, 
  outputFormat: string, 
  quality: number, 
  resize: string, 
  width: number, 
  height: number, 
  maintainAspect: string
) {
  console.log(`Converting TIFF file ${inputPath} to ${outputFormat}...`);
  
  let sharpInstance = sharp(inputPath);
  
  // Add resize if specified
  if (resize === 'true' && width && height) {
    const resizeOptions: sharp.ResizeOptions = {
      width: parseInt(width.toString()),
      height: parseInt(height.toString()),
      fit: maintainAspect === 'true' ? 'inside' : 'fill',
      withoutEnlargement: true
    };
    sharpInstance = sharpInstance.resize(resizeOptions);
  }
  
  // Apply output format settings
  switch (outputFormat.toLowerCase()) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality.toString()) });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ compressionLevel: 8, palette: true });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality: parseInt(quality.toString()) });
      break;
    case 'avif':
      sharpInstance = sharpInstance.avif({ quality: parseInt(quality.toString()) });
      break;
    case 'tiff':
      sharpInstance = sharpInstance.tiff({ compression: 'lzw' });
      break;
  }
  
  await sharpInstance.toFile(outputPath);
  
  return { success: true };
}

/**
 * GET /api/v1/pricing - Get API pricing information
 */
router.get('/pricing', authenticateApiKey, rateLimitMiddleware, (req, res) => {
  try {
    const pricing = {
      tiers: Object.values(API_PRICING_TIERS),
      payPerUse: {
        standardCompression: {
          rate: PAY_PER_USE_RATES.standardCompression,
          displayRate: `$${(PAY_PER_USE_RATES.standardCompression / 100).toFixed(3)}`,
          description: 'Per standard image compression'
        },
        formatConversion: {
          rate: PAY_PER_USE_RATES.formatConversion,
          displayRate: `$${(PAY_PER_USE_RATES.formatConversion / 100).toFixed(3)}`,
          description: 'Per format conversion (JPEG→PNG, etc.)'
        },
        specialFormatConversion: {
          rate: PAY_PER_USE_RATES.specialFormatConversion,
          displayRate: `$${(PAY_PER_USE_RATES.specialFormatConversion / 100).toFixed(2)}`,
          description: 'Per special format conversion (RAW, SVG, TIFF)'
        },
        batchProcessing: {
          rate: PAY_PER_USE_RATES.batchProcessing,
          displayRate: `$${(PAY_PER_USE_RATES.batchProcessing / 100).toFixed(3)}`,
          description: 'Per batch request (multiple files)'
        }
      },
      calculator: {
        description: 'Use these rates to calculate costs for your expected usage',
        example: 'For 1000 special format conversions: 1000 × $0.10 = $100.00'
      }
    };

    res.json(pricing);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pricing',
      message: 'An error occurred while retrieving pricing information'
    });
  }
});

export { router as apiRouter };