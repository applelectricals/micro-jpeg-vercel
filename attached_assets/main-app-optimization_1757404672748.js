// Optimized main application for Replit deployment
// Combines all features: RAW processing, API, WordPress plugin support, etc.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const { Pool } = require('pg');
const sharp = require('sharp');
const libraw = require('node-libraw'); // For RAW processing
const Bull = require('bull');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sgMail = require('@sendgrid/mail');

// Import our optimization modules
const { 
  performanceMiddleware, 
  cachedProcess,
  MemoryManager,
  CDNOptimizer 
} = require('./performance-caching');

const { imageQueue, rawQueue, bulkQueue } = require('./queue-system');

// Initialize services
const app = express();
const memoryManager = new MemoryManager();
const cdnOptimizer = new CDNOptimizer();

// Database connection with optimal settings
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
  query_timeout: 30000,
  ssl: { rejectUnauthorized: false }
});

// R2 Configuration (Cloudflare R2 compatible with S3 SDK)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Global middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(compression({ level: 6 })); // Balanced compression
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for RAW files
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true,
  createParentPath: true,
  parseNested: true
}));

// Apply performance middleware
app.use(performanceMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'checking',
    redis: 'checking',
    r2: 'checking',
    memory: memoryManager.getStatus()
  };

  try {
    // Check database
    await dbPool.query('SELECT 1');
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }

  try {
    // Check Redis through queue
    await imageQueue.client.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok' || typeof v === 'object');
  res.status(allOk ? 200 : 503).json(checks);
});

// Main image processing endpoint with caching
app.post('/api/process', authenticateUser, async (req, res) => {
  await cachedProcess(req, res, async (params) => {
    const { file, outputFormat, quality, width, height } = params;
    
    // Determine if it's a RAW format
    const rawFormats = ['ARW', 'CR2', 'CR3', 'DNG', 'NEF', 'ORF', 'RW2', 'RAF'];
    const fileExtension = file.name.split('.').pop().toUpperCase();
    const isRaw = rawFormats.includes(fileExtension);
    
    if (isRaw) {
      // Queue for RAW processing
      const job = await rawQueue.add('process', {
        userId: req.user.id,
        file: file.tempFilePath,
        outputFormat,
        quality,
        width,
        height
      });
      
      return {
        success: true,
        jobId: job.id,
        message: 'RAW processing queued',
        estimatedTime: '30-60 seconds'
      };
    } else {
      // Process regular image immediately
      return await processRegularImage(file, outputFormat, quality, width, height, req.user.id);
    }
  });
});

// Process regular images (JPEG, PNG, WebP, AVIF, SVG, TIFF)
async function processRegularImage(file, outputFormat, quality, width, height, userId) {
  const startTime = Date.now();
  
  try {
    // Request memory allocation
    const estimatedMemory = file.size / 1024 / 1024 * 3; // Rough estimate
    await memoryManager.requestMemory(estimatedMemory);
    
    // Read and process image
    let pipeline = sharp(file.tempFilePath);
    
    // Get metadata for validation
    const metadata = await pipeline.metadata();
    
    // Apply resizing if specified
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3
      });
    }
    
    // Apply format-specific optimizations
    switch(outputFormat.toLowerCase()) {
      case 'avif':
        pipeline = pipeline.avif({
          quality: quality || 80,
          effort: 4,
          chromaSubsampling: '4:2:0'
        });
        break;
        
      case 'webp':
        pipeline = pipeline.webp({
          quality: quality || 85,
          effort: 4,
          smartSubsample: true,
          nearLossless: quality > 90,
          alphaQuality: 100
        });
        break;
        
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality: quality || 85,
          progressive: true,
          optimizeCoding: true,
          mozjpeg: true,
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: true
        });
        break;
        
      case 'png':
        pipeline = pipeline.png({
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: metadata.channels <= 3
        });
        break;
        
      case 'tiff':
        pipeline = pipeline.tiff({
          quality: quality || 90,
          compression: 'lzw',
          predictor: 'horizontal'
        });
        break;
    }
    
    // Process to buffer
    const outputBuffer = await pipeline.toBuffer();
    
    // Upload to R2
    const key = `processed/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${outputFormat}`;
    await uploadToR2(outputBuffer, key, outputFormat);
    
    // Get optimized CDN URL
    const cdnUrl = cdnOptimizer.generateOptimizedUrl(key);
    
    // Save to database
    await saveProcessingRecord(userId, {
      inputFormat: metadata.format,
      outputFormat,
      inputSize: file.size,
      outputSize: outputBuffer.length,
      compressionRatio: (file.size / outputBuffer.length).toFixed(2),
      processingTime: Date.now() - startTime,
      cdnUrl
    });
    
    // Release memory
    memoryManager.releaseMemory(estimatedMemory);
    
    return {
      success: true,
      url: cdnUrl,
      size: outputBuffer.length,
      compressionRatio: (file.size / outputBuffer.length).toFixed(2),
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    memoryManager.releaseMemory(estimatedMemory);
    throw error;
  }
}

// API endpoints for developers
app.post('/api/v1/convert', authenticateAPI, async (req, res) => {
  const { imageUrl, outputFormat, options = {} } = req.body;
  
  // Rate limiting check based on API tier
  const rateCheck = await checkAPIRateLimit(req.apiKey);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateCheck.reset
    });
  }
  
  // Queue the conversion
  const job = await imageQueue.add('api-conversion', {
    imageUrl,
    outputFormat,
    options,
    apiKey: req.apiKey
  });
  
  res.json({
    success: true,
    jobId: job.id,
    statusUrl: `/api/v1/status/${job.id}`,
    webhookUrl: options.webhookUrl || null
  });
});

// Batch API for multiple conversions
app.post('/api/v1/batch', authenticateAPI, async (req, res) => {
  const { images, notificationEmail } = req.body;
  
  // Validate batch size based on tier
  const maxBatchSize = getMaxBatchSize(req.apiTier);
  if (images.length > maxBatchSize) {
    return res.status(400).json({
      error: `Batch size exceeds limit of ${maxBatchSize} for ${req.apiTier} tier`
    });
  }
  
  const batchJob = await bulkQueue.add('batch-process', {
    images,
    apiKey: req.apiKey,
    notificationEmail
  });
  
  res.json({
    success: true,
    batchId: batchJob.id,
    imageCount: images.length,
    statusUrl: `/api/v1/batch/${batchJob.id}`
  });
});

// WordPress plugin endpoint
app.post('/api/wordpress/optimize', authenticateWordPress, async (req, res) => {
  const { images, siteUrl, returnFormat } = req.body;
  
  const jobs = await Promise.all(images.map(image => 
    imageQueue.add('wordpress-optimization', {
      imageUrl: image.url,
      imageId: image.id,
      siteUrl,
      returnFormat: returnFormat || 'webp'
    })
  ));
  
  res.json({
    success: true,
    jobs: jobs.map(job => ({
      imageId: job.data.imageId,
      jobId: job.id
    }))
  });
});

// Browser extension endpoint
app.post('/api/extension/quick-convert', authenticateExtension, async (req, res) => {
  const { imageData, format } = req.body;
  
  // Quick conversion for browser extension
  const buffer = Buffer.from(imageData, 'base64');
  const converted = await sharp(buffer)
    .toFormat(format, { quality: 85 })
    .toBuffer();
  
  res.json({
    success: true,
    data: converted.toString('base64'),
    size: converted.length
  });
});

// Helper functions
async function uploadToR2(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: `image/${contentType}`,
    CacheControl: 'public, max-age=31536000',
  });
  
  await r2Client.send(command);
  return `${process.env.R2_CDN_URL}/${key}`;
}

async function saveProcessingRecord(userId, data) {
  const query = `
    INSERT INTO processing_history 
    (user_id, input_format, output_format, input_size_bytes, 
     output_size_bytes, compression_ratio, processing_time_ms, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
    RETURNING id
  `;
  
  const values = [
    userId,
    data.inputFormat,
    data.outputFormat,
    data.inputSize,
    data.outputSize,
    data.compressionRatio,
    data.processingTime
  ];
  
  const result = await dbPool.query(query, values);
  return result.rows[0].id;
}

// Authentication middlewares
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify JWT token and get user
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const user = await getUserByAPIKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.apiKey = apiKey;
  req.apiTier = user.tier;
  next();
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.requestId 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Image Processing Platform running on port ${PORT}`);
  console.log(`📊 Memory limit: ${memoryManager.maxMemory}MB`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await dbPool.end();
  await imageQueue.close();
  await rawQueue.close();
  process.exit(0);
});