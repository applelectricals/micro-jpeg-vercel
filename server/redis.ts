import Redis from 'ioredis';

// Clean the Redis URL to remove any command-line artifacts
function cleanRedisUrl(url: string): string {
  if (!url) return 'redis://localhost:6379';
  
  // Security: Not logging raw URL to prevent credential exposure
  
  // Handle URL encoding issues
  let cleanUrl = url;
  
  // If URL is encoded, decode it
  try {
    if (url.includes('%')) {
      cleanUrl = decodeURIComponent(url);
    }
  } catch (e) {
    console.warn('Failed to decode URL, using raw URL');
  }
  
  // Remove common command-line artifacts that might get included
  cleanUrl = cleanUrl.replace(/.*--tls.*-u\s*/, '');
  cleanUrl = cleanUrl.replace(/^.*?(redis[s]?:\/\/)/, '$1');
  cleanUrl = cleanUrl.trim();
  
  // If the URL still doesn't look right, extract just the redis part
  const redisMatch = cleanUrl.match(/(redis[s]?:\/\/[^,\s]+)/);
  if (redisMatch) {
    cleanUrl = redisMatch[1];
  }
  
  // Security: Not logging URL details to prevent credential exposure
  
  return cleanUrl;
}

// Redis connection configuration optimized for UpStash Redis
const redisUrl = cleanRedisUrl(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379');
const isUpstash = redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://');

const redisConfig = {
  // Connection options optimized for UpStash Redis cloud service
  maxRetriesPerRequest: isUpstash ? 2 : 3,
  enableReadyCheck: false,
  lazyConnect: true,
  // Increased timeouts for cloud Redis
  connectTimeout: isUpstash ? 60000 : 30000,
  commandTimeout: isUpstash ? 30000 : 10000,
  // Keep-alive settings for stable connection
  keepAlive: 30000,
  // Network settings
  family: isUpstash ? 4 : undefined, // Force IPv4 for Upstash
  // Database settings
  db: 0,
};

// Create Redis connection - Security: Using configuration status only
const hasRedisConfig = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL);
const connectionType = hasRedisConfig ? (isUpstash ? 'cloud' : 'standard') : 'local-fallback';
console.log('🔧 Redis configuration:', {
  configured: hasRedisConfig,
  type: connectionType,
  upstashOptimizations: isUpstash
});

// Create Redis connection with error handling for quota limits
let redis: Redis | null = null;

// For development/testing - completely skip Redis initialization to avoid quota issues
const SKIP_REDIS = process.env.NODE_ENV === 'development';

if (SKIP_REDIS) {
  console.warn('🚫 Skipping Redis initialization in development mode due to quota limits');
  redis = null;
} else {
  try {
    redis = new Redis(redisUrl, {
      ...redisConfig,
      // Enhanced TLS configuration for Upstash Redis
      tls: isUpstash || redisUrl.startsWith('rediss://') ? {
        rejectUnauthorized: false, // Accept Upstash SSL certificates
        checkServerIdentity: () => undefined, // Skip hostname verification for Upstash
      } : undefined,
      // Note: retryScheduler removed as it's not a valid Redis option
      // Reconnection is handled by the connection event handlers below
    });
  } catch (error: any) {
    console.warn('⚠️  Redis connection failed:', error.message);
    redis = null;
  }
}

export { redis };

// Connection event handlers with graceful error handling
if (redis) {
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
  });

  redis.on('error', (error: Error) => {
    console.error('❌ Redis connection error:', error.message);
    // If quota exceeded, disable Redis permanently for this session
    if (error.message && error.message.includes('max requests limit exceeded')) {
      console.warn('🚫 Disabling Redis due to quota limit - using fallback storage');
      redis = null;
    }
  });

  redis.on('close', () => {
    console.log('🔴 Redis connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });
}

// Graceful Redis wrapper that doesn't crash the app
export const safeRedis = {
  async get(key: string): Promise<string | null> {
    try {
      if (!redis) return null;
      return await redis.get(key);
    } catch (error) {
      console.warn('Redis GET failed, continuing without cache:', error);
      return null;
    }
  },
  
  async set(key: string, value: string, ...args: any[]): Promise<string | null> {
    try {
      if (!redis) return null;
      return await redis.set(key, value, ...args);
    } catch (error) {
      console.warn('Redis SET failed, continuing without cache:', error);
      return null;
    }
  },
  
  async del(key: string): Promise<number> {
    try {
      if (!redis) return 0;
      return await redis.del(key);
    } catch (error) {
      console.warn('Redis DEL failed, continuing without cache:', error);
      return 0;
    }
  }
};

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redis) return false;
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  try {
    if (!redis) return;
    await redis.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}

export default redis;