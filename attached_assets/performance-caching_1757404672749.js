// Advanced caching and performance monitoring for image processing platform
const Redis = require('ioredis');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class PerformanceOptimizer {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.cache = new Map(); // In-memory cache for hot data
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      avgProcessingTime: 0,
      requestCount: 0
    };
  }

  // Intelligent caching system
  async getCachedOrProcess(req, res, processFunction) {
    const startTime = performance.now();
    
    // Generate cache key based on request parameters
    const cacheKey = this.generateCacheKey(req.body);
    
    // Check multi-tier cache
    const cached = await this.checkCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      this.recordMetric('cache_hit', performance.now() - startTime);
      
      // Touch cache to update last accessed time
      await this.touchCache(cacheKey);
      
      return res.json({
        ...cached,
        cached: true,
        processingTime: performance.now() - startTime
      });
    }
    
    this.metrics.cacheMisses++;
    
    // Check if identical processing is already in progress
    const inProgress = await this.checkInProgress(cacheKey);
    if (inProgress) {
      // Wait for the result instead of processing again
      const result = await this.waitForResult(cacheKey, 30000); // 30 sec timeout
      if (result) {
        return res.json(result);
      }
    }
    
    // Mark as in progress
    await this.markInProgress(cacheKey);
    
    try {
      // Process the image
      const result = await processFunction(req.body);
      
      // Cache the result
      await this.cacheResult(cacheKey, result, req.body);
      
      // Clear in-progress flag
      await this.clearInProgress(cacheKey);
      
      const processingTime = performance.now() - startTime;
      this.recordMetric('processing_time', processingTime);
      
      return res.json({
        ...result,
        cached: false,
        processingTime
      });
    } catch (error) {
      await this.clearInProgress(cacheKey);
      throw error;
    }
  }

  generateCacheKey(params) {
    // Create deterministic cache key
    const keyData = {
      format: params.format,
      outputFormat: params.outputFormat,
      quality: params.quality,
      width: params.width,
      height: params.height,
      // For file-based caching, use file hash
      fileHash: params.fileHash || null
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async checkCache(key) {
    // L1: In-memory cache (fastest)
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // L2: Redis cache (fast)
    const redisResult = await this.redis.get(`cache:${key}`);
    if (redisResult) {
      const data = JSON.parse(redisResult);
      // Promote to L1 cache
      this.cache.set(key, data);
      return data;
    }
    
    // L3: Database cache (for expensive operations)
    // Implement if needed for very expensive RAW conversions
    
    return null;
  }

  async cacheResult(key, result, params) {
    // Determine cache TTL based on operation cost
    const ttl = this.calculateTTL(params);
    
    // Save to Redis
    await this.redis.setex(
      `cache:${key}`,
      ttl,
      JSON.stringify(result)
    );
    
    // Save to in-memory cache with LRU eviction
    this.cache.set(key, result);
    if (this.cache.size > 1000) {
      // Simple LRU: remove first item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Log cache efficiency
    await this.logCacheMetrics(key, params);
  }

  calculateTTL(params) {
    // Longer TTL for expensive operations
    const baseTTL = 3600; // 1 hour
    
    const multipliers = {
      'RAW': 4,      // 4 hours for RAW
      'AVIF': 2,     // 2 hours for AVIF
      'WEBP': 1.5,   // 1.5 hours for WebP
      'JPG': 1       // 1 hour for JPEG
    };
    
    const format = params.format?.toUpperCase();
    const multiplier = multipliers[format] || 1;
    
    return Math.floor(baseTTL * multiplier);
  }

  async checkInProgress(key) {
    return await this.redis.get(`progress:${key}`);
  }

  async markInProgress(key) {
    await this.redis.setex(`progress:${key}`, 60, 'processing');
  }

  async clearInProgress(key) {
    await this.redis.del(`progress:${key}`);
  }

  async waitForResult(key, timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Check if processing is complete
      const cached = await this.checkCache(key);
      if (cached) return cached;
      
      // Check if still in progress
      const inProgress = await this.checkInProgress(key);
      if (!inProgress) return null;
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  }

  async touchCache(key) {
    // Update last accessed time for cache eviction
    await this.redis.expire(`cache:${key}`, 3600);
  }

  recordMetric(type, value) {
    // Send to monitoring service
    if (process.env.DATADOG_API_KEY) {
      // Send to DataDog/NewRelic/CloudWatch
      this.sendToMonitoring(type, value);
    }
    
    // Local metrics
    this.metrics.requestCount++;
    if (type === 'processing_time') {
      this.metrics.avgProcessingTime = 
        (this.metrics.avgProcessingTime * (this.metrics.requestCount - 1) + value) 
        / this.metrics.requestCount;
    }
  }

  async logCacheMetrics(key, params) {
    // Track cache performance
    const date = new Date().toISOString().split('T')[0];
    await this.redis.hincrby(`metrics:${date}`, 'cache_saves', 1);
    await this.redis.hincrby(`metrics:${date}`, `format:${params.format}`, 1);
  }

  getMetricsSummary() {
    const hitRate = this.metrics.cacheHits / 
      (this.metrics.cacheHits + this.metrics.cacheMisses) * 100;
    
    return {
      cacheHitRate: `${hitRate.toFixed(2)}%`,
      avgProcessingTime: `${this.metrics.avgProcessingTime.toFixed(2)}ms`,
      totalRequests: this.metrics.requestCount,
      cacheSize: this.cache.size
    };
  }
}

// Memory management for RAW processing
class MemoryManager {
  constructor() {
    this.maxMemory = process.env.MAX_MEMORY || 2048; // MB
    this.currentUsage = 0;
    this.queue = [];
  }

  async requestMemory(sizeMB) {
    // Check if memory is available
    if (this.currentUsage + sizeMB <= this.maxMemory) {
      this.currentUsage += sizeMB;
      return true;
    }
    
    // Queue the request
    return new Promise((resolve) => {
      this.queue.push({ sizeMB, resolve });
      this.processQueue();
    });
  }

  releaseMemory(sizeMB) {
    this.currentUsage = Math.max(0, this.currentUsage - sizeMB);
    this.processQueue();
  }

  processQueue() {
    while (this.queue.length > 0) {
      const request = this.queue[0];
      if (this.currentUsage + request.sizeMB <= this.maxMemory) {
        this.queue.shift();
        this.currentUsage += request.sizeMB;
        request.resolve(true);
      } else {
        break;
      }
    }
  }

  getStatus() {
    return {
      used: this.currentUsage,
      available: this.maxMemory - this.currentUsage,
      queued: this.queue.length,
      utilization: `${(this.currentUsage / this.maxMemory * 100).toFixed(2)}%`
    };
  }
}

// CDN optimization for R2
class CDNOptimizer {
  constructor() {
    this.cdnUrls = {
      primary: process.env.R2_CDN_URL,
      fallback: process.env.R2_FALLBACK_URL
    };
  }

  generateOptimizedUrl(key, options = {}) {
    const baseUrl = this.cdnUrls.primary;
    
    // Add transformation parameters for on-the-fly optimization
    const params = new URLSearchParams();
    
    if (options.width) params.append('w', options.width);
    if (options.height) params.append('h', options.height);
    if (options.quality) params.append('q', options.quality);
    if (options.format) params.append('f', options.format);
    
    // Add cache-busting parameter
    params.append('v', Date.now());
    
    return `${baseUrl}/${key}?${params.toString()}`;
  }

  async warmCache(urls) {
    // Pre-warm CDN cache for frequently accessed images
    const promises = urls.map(url => 
      fetch(url, { method: 'HEAD' }).catch(() => null)
    );
    
    await Promise.all(promises);
  }

  getCDNHeaders() {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000',
      'Cloudflare-CDN-Cache-Control': 'max-age=31536000',
      'X-Robots-Tag': 'noindex'
    };
  }
}

// Rate limiting with tier support
class RateLimiter {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.limits = {
      enterprise: { requests: 10000, window: 3600 },
      premium: { requests: 1000, window: 3600 },
      free: { requests: 100, window: 3600 }
    };
  }

  async checkLimit(userId, tier) {
    const key = `rate:${userId}`;
    const limit = this.limits[tier] || this.limits.free;
    
    const current = await this.redis.incr(key);
    