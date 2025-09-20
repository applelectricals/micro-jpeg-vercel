// Redis-based database query caching service
import { redis } from './redis';

export interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  keyPrefix: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

export class CacheService {
  private config: CacheConfig;
  private metrics: CacheMetrics;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300, // 5 minutes default
      keyPrefix: 'microjpeg:cache:',
      ...config
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };
  }

  private generateKey(namespace: string, identifier: string): string {
    return `${this.config.keyPrefix}${namespace}:${identifier}`;
  }

  private updateMetrics(isHit: boolean): void {
    this.metrics.totalRequests++;
    if (isHit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
  }

  /**
   * Get cached data
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(namespace, key);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        this.updateMetrics(true);
        return JSON.parse(cached);
      }
      
      this.updateMetrics(false);
      return null;
    } catch (error) {
      console.error(`Cache get error for ${namespace}:${key}:`, error);
      this.updateMetrics(false);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(namespace: string, key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = JSON.stringify(data);
      const expiry = ttl || this.config.defaultTTL;
      
      await redis.setex(cacheKey, expiry, value);
      return true;
    } catch (error) {
      console.error(`Cache set error for ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await redis.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = `${this.config.keyPrefix}${pattern}`;
      const keys = await redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet<T>(
    namespace: string, 
    key: string, 
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data and cache it
    try {
      const freshData = await fetchFunction();
      await this.set(namespace, key, freshData, ttl);
      return freshData;
    } catch (error) {
      console.error(`getOrSet fetch error for ${namespace}:${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(namespace: string, keys: string[]): Promise<Record<string, T | null>> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(namespace, key));
      const values = await redis.mget(...cacheKeys);
      
      const result: Record<string, T | null> = {};
      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            result[key] = JSON.parse(value);
            this.updateMetrics(true);
          } catch (parseError) {
            result[key] = null;
            this.updateMetrics(false);
          }
        } else {
          result[key] = null;
          this.updateMetrics(false);
        }
      });
      
      return result;
    } catch (error) {
      console.error(`Cache mget error for ${namespace}:`, error);
      const result: Record<string, T | null> = {};
      keys.forEach(key => {
        result[key] = null;
        this.updateMetrics(false);
      });
      return result;
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(namespace: string, data: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const expiry = ttl || this.config.defaultTTL;
      const pipeline = redis.pipeline();
      
      Object.entries(data).forEach(([key, value]) => {
        const cacheKey = this.generateKey(namespace, key);
        pipeline.setex(cacheKey, expiry, JSON.stringify(value));
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache mset error for ${namespace}:`, error);
      return false;
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    };
  }

  /**
   * Get cache info and statistics
   */
  async getCacheInfo(): Promise<any> {
    try {
      const info = await redis.info('memory');
      const keyCount = await redis.dbsize();
      
      return {
        metrics: this.getMetrics(),
        redis: {
          keyCount,
          memoryInfo: this.parseRedisInfo(info)
        }
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        metrics: this.getMetrics(),
        redis: {
          keyCount: 0,
          memoryInfo: {}
        }
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });
    return result;
  }
}

// Create singleton cache service instance
export const cacheService = new CacheService({
  defaultTTL: 300, // 5 minutes
  keyPrefix: 'microjpeg:cache:'
});

// Cache namespaces for different data types
export const CACHE_NAMESPACES = {
  USER: 'user',
  USAGE_STATS: 'usage_stats',
  COMPRESSION_JOBS: 'compression_jobs',
  SUBSCRIPTIONS: 'subscriptions',
  API_LIMITS: 'api_limits',
  PRICING: 'pricing',
  SESSIONS: 'sessions'
} as const;

// Cache TTL configurations for different data types
export const CACHE_TTL = {
  USER_DATA: 600,        // 10 minutes - user info changes infrequently
  USAGE_STATS: 300,      // 5 minutes - usage data updates regularly
  COMPRESSION_JOBS: 120, // 2 minutes - job status changes frequently
  SUBSCRIPTIONS: 900,    // 15 minutes - subscription info stable
  API_LIMITS: 60,        // 1 minute - limits need to be fresh
  PRICING: 3600,         // 1 hour - pricing rarely changes
  SESSIONS: 1800         // 30 minutes - session data
} as const;

export default cacheService;