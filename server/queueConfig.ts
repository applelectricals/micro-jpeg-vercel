import Bull, { Queue } from 'bull';
import { redis } from './redis';

// Queue configuration with retry and timeout settings
const queueConfig = {
  redis: redis,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 20,     // Keep last 20 failed jobs for debugging
    attempts: 3,          // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,        // Start with 2 second delay
    },
  },
  settings: {
    stalledInterval: 30 * 1000,    // 30 seconds
    maxStalledCount: 1,            // Jobs become failed after 1 stall
  }
};

// Create separate queues for different types of processing
export const imageQueue: Queue = new Bull('image-processing', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
    db: redis.options.db,
    ...(redis.options.tls && { tls: redis.options.tls })
  },
  defaultJobOptions: {
    ...queueConfig.defaultJobOptions,
    delay: 0, // Process immediately
  },
  settings: queueConfig.settings,
});

export const rawQueue: Queue = new Bull('raw-processing', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
    db: redis.options.db,
    ...(redis.options.tls && { tls: redis.options.tls })
  },
  defaultJobOptions: {
    ...queueConfig.defaultJobOptions,
    delay: 0, // Process immediately
    timeout: 300000, // 5 minute timeout for RAW processing
  },
  settings: queueConfig.settings,
});

export const bulkQueue: Queue = new Bull('bulk-processing', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
    db: redis.options.db,
    ...(redis.options.tls && { tls: redis.options.tls })
  },
  defaultJobOptions: {
    ...queueConfig.defaultJobOptions,
    delay: 1000, // 1 second delay to prevent overwhelming
    timeout: 600000, // 10 minute timeout for bulk operations
  },
  settings: queueConfig.settings,
});

// Priority levels for different user tiers
export const QUEUE_PRIORITIES = {
  enterprise: 1,    // Highest priority
  premium: 5,       // High priority  
  test_premium: 5,  // High priority (same as premium)
  free: 10,         // Normal priority
  guest: 15,        // Lowest priority
} as const;

// Job types for different operations
export const JOB_TYPES = {
  COMPRESS_IMAGE: 'compress-image',
  PROCESS_RAW: 'process-raw',
  CONVERT_FORMAT: 'convert-format',
  BULK_PROCESS: 'bulk-process',
} as const;

// Queue health check
export async function checkQueueHealth(): Promise<{
  imageQueue: boolean;
  rawQueue: boolean;
  bulkQueue: boolean;
}> {
  try {
    // Check if queues are ready by testing basic operations
    const [imageHealth, rawHealth, bulkHealth] = await Promise.all([
      imageQueue.client.ping().then(() => true).catch(() => false),
      rawQueue.client.ping().then(() => true).catch(() => false),
      bulkQueue.client.ping().then(() => true).catch(() => false),
    ]);

    return {
      imageQueue: imageHealth,
      rawQueue: rawHealth,
      bulkQueue: bulkHealth,
    };
  } catch (error) {
    console.error('Queue health check failed:', error);
    return {
      imageQueue: false,
      rawQueue: false,
      bulkQueue: false,
    };
  }
}

// Get queue statistics
export async function getQueueStats() {
  try {
    const [imageStats, rawStats, bulkStats] = await Promise.all([
      Promise.all([
        imageQueue.getWaiting(),
        imageQueue.getActive(),
        imageQueue.getCompleted(),
        imageQueue.getFailed(),
      ]),
      Promise.all([
        rawQueue.getWaiting(),
        rawQueue.getActive(),
        rawQueue.getCompleted(),
        rawQueue.getFailed(),
      ]),
      Promise.all([
        bulkQueue.getWaiting(),
        bulkQueue.getActive(),
        bulkQueue.getCompleted(),
        bulkQueue.getFailed(),
      ]),
    ]);

    return {
      imageQueue: {
        waiting: imageStats[0].length,
        active: imageStats[1].length,
        completed: imageStats[2].length,
        failed: imageStats[3].length,
      },
      rawQueue: {
        waiting: rawStats[0].length,
        active: rawStats[1].length,
        completed: rawStats[2].length,
        failed: rawStats[3].length,
      },
      bulkQueue: {
        waiting: bulkStats[0].length,
        active: bulkStats[1].length,
        completed: bulkStats[2].length,
        failed: bulkStats[3].length,
      },
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return null;
  }
}

// Graceful shutdown for all queues
export async function closeAllQueues(): Promise<void> {
  try {
    await Promise.all([
      imageQueue.close(),
      rawQueue.close(), 
      bulkQueue.close(),
    ]);
    console.log('All queues closed gracefully');
  } catch (error) {
    console.error('Error closing queues:', error);
  }
}