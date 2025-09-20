// Install: npm install bull redis ioredis sharp raw-decoder
const Queue = require('bull');
const sharp = require('sharp');
const Redis = require('ioredis');

// Redis connection for queue management
const redis = new Redis(process.env.REDIS_URL);

// Create separate queues for different processing priorities
const imageQueue = new Queue('image-processing', process.env.REDIS_URL);
const rawQueue = new Queue('raw-processing', process.env.REDIS_URL);
const bulkQueue = new Queue('bulk-processing', process.env.REDIS_URL);

// API endpoint - immediately return job ID
app.post('/api/process-image', async (req, res) => {
  const { fileUrl, format, outputFormat, quality, userId, tier } = req.body;
  
  // Determine which queue based on file type and user tier
  const isRaw = ['ARW', 'CR2', 'DNG', 'NEF', 'ORF', 'RW2'].includes(format.toUpperCase());
  const queue = isRaw ? rawQueue : imageQueue;
  
  // Priority based on tier
  const priority = {
    'enterprise': 1,
    'premium': 5,
    'free': 10
  }[tier] || 10;
  
  // Add job to queue
  const job = await queue.add('process', {
    fileUrl,
    format,
    outputFormat,
    quality,
    userId,
    timestamp: Date.now()
  }, {
    priority,
    removeOnComplete: false, // Keep for 24 hours for retrieval
    removeOnFail: false
  });
  
  // Return immediately with job ID
  res.json({
    success: true,
    jobId: job.id,
    estimatedTime: isRaw ? '30-60 seconds' : '5-10 seconds',
    statusUrl: `/api/job-status/${job.id}`
  });
});

// Process RAW images with proper memory management
rawQueue.process('process', 3, async (job) => { // Max 3 concurrent RAW processing
  const { fileUrl, outputFormat, quality, userId } = job.data;
  
  try {
    // Update job progress
    job.progress(10);
    
    // Download file from R2
    const fileBuffer = await downloadFromR2(fileUrl);
    job.progress(30);
    
    // Process RAW with libraw or dcraw
    const processedBuffer = await processRawImage(fileBuffer, {
      outputFormat,
      quality,
      // RAW-specific options
      whiteBalance: 'auto',
      denoise: true,
      sharpen: true
    });
    job.progress(80);
    
    // Upload to R2
    const outputUrl = await uploadToR2(processedBuffer, userId);
    job.progress(95);
    
    // Update database
    await updateDatabase(userId, job.id, outputUrl);
    
    // Send completion email if configured
    if (job.data.notifyEmail) {
      await sendCompletionEmail(job.data.notifyEmail, outputUrl);
    }
    
    job.progress(100);
    return { success: true, url: outputUrl };
    
  } catch (error) {
    console.error('RAW processing error:', error);
    throw error;
  }
});

// Regular image processing (JPEG, PNG, WebP, AVIF)
imageQueue.process('process', 10, async (job) => { // Max 10 concurrent
  const { fileUrl, outputFormat, quality, userId } = job.data;
  
  try {
    job.progress(10);
    
    const fileBuffer = await downloadFromR2(fileUrl);
    job.progress(30);
    
    // Use sharp for efficient processing
    let pipeline = sharp(fileBuffer);
    
    // Apply optimizations based on format
    switch(outputFormat.toLowerCase()) {
      case 'avif':
        pipeline = pipeline.avif({ 
          quality: quality || 80,
          effort: 4, // Balance between speed and compression
          chromaSubsampling: '4:2:0'
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: quality || 85,
          effort: 4,
          smartSubsample: true,
          nearLossless: quality > 90
        });
        break;
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality: quality || 85,
          progressive: true,
          optimizeCoding: true,
          mozjpeg: true // Better compression
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true // Auto-detect if palette mode is better
        });
        break;
    }
    
    job.progress(70);
    
    const outputBuffer = await pipeline.toBuffer();
    job.progress(80);
    
    const outputUrl = await uploadToR2(outputBuffer, userId);
    job.progress(95);
    
    await updateDatabase(userId, job.id, outputUrl);
    job.progress(100);
    
    return { success: true, url: outputUrl };
    
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
});

// Webhook endpoint for job status
app.get('/api/job-status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  
  // Check all queues
  const queues = [imageQueue, rawQueue, bulkQueue];
  
  for (const queue of queues) {
    const job = await queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      const progress = job.progress();
      
      return res.json({
        jobId,
        state,
        progress,
        result: state === 'completed' ? job.returnvalue : null,
        error: state === 'failed' ? job.failedReason : null
      });
    }
  }
  
  res.status(404).json({ error: 'Job not found' });
});

// Bulk processing for API users
app.post('/api/bulk-process', async (req, res) => {
  const { images, apiKey } = req.body;
  
  // Validate API key and get tier
  const user = await validateApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Rate limiting based on tier
  const rateLimit = {
    'enterprise': 1000,
    'premium': 100,
    'developer': 20
  }[user.tier] || 10;
  
  if (images.length > rateLimit) {
    return res.status(429).json({ 
      error: `Bulk limit exceeded. Maximum ${rateLimit} images per request for ${user.tier} tier.` 
    });
  }
  
  // Create bulk job
  const bulkJob = await bulkQueue.add('bulk-process', {
    images,
    userId: user.id,
    tier: user.tier
  });
  
  res.json({
    success: true,
    bulkJobId: bulkJob.id,
    imageCount: images.length,
    estimatedTime: `${images.length * 5} seconds`,
    webhookUrl: `/api/bulk-status/${bulkJob.id}`
  });
});

// Process bulk jobs
bulkQueue.process('bulk-process', 1, async (job) => {
  const { images, userId, tier } = job.data;
  const results = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    job.progress(Math.round((i / images.length) * 100));
    
    // Add individual job to appropriate queue
    const isRaw = ['ARW', 'CR2', 'DNG', 'NEF', 'ORF', 'RW2'].includes(image.format.toUpperCase());
    const queue = isRaw ? rawQueue : imageQueue;
    
    const subJob = await queue.add('process', {
      ...image,
      userId,
      parentJobId: job.id
    }, {
      priority: tier === 'enterprise' ? 1 : 5
    });
    
    results.push({
      originalFile: image.fileUrl,
      jobId: subJob.id
    });
  }
  
  return { success: true, jobs: results };
});

// Helper functions
async function downloadFromR2(url) {
  // Implement R2 download with retry logic
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.buffer();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

async function uploadToR2(buffer, userId) {
  // Implement R2 upload with proper key structure
  const key = `processed/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
  // Upload logic here
  return `https://your-r2-bucket.r2.dev/${key}`;
}

async function processRawImage(buffer, options) {
  // Use dcraw or libraw for RAW processing
  // This is a placeholder - implement actual RAW processing
  const sharp = require('sharp');
  return await sharp(buffer)
    .jpeg({ quality: options.quality || 90 })
    .toBuffer();
}

// Cleanup old jobs
setInterval(async () => {
  const queues = [imageQueue, rawQueue, bulkQueue];
  for (const queue of queues) {
    await queue.clean(24 * 60 * 60 * 1000); // 24 hours
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = { imageQueue, rawQueue, bulkQueue };