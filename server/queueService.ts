// Queue service initialization and health monitoring
let redis: any = null;
let checkRedisHealth: any = null;
let closeRedisConnection: any = null;
let imageQueue: any = null;
let rawQueue: any = null;
let bulkQueue: any = null;
let checkQueueHealth: any = null;
let getQueueStats: any = null;
let closeAllQueues: any = null;
let QUEUE_PRIORITIES: any = null;
let JOB_TYPES: any = null;
let initializeQueueProcessors: any = null;
let addJob: any = null;
let getJobStatus: any = null;

// Lazy load Redis modules only when needed
async function loadRedisModules() {
  try {
    // First try to import redis module to see if it works
    const redisModule = await Promise.race([
      import('./redis'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Import timeout')), 3000))
    ]);
    
    // If redis import succeeds, try the others
    const queueConfigModule = await import('./queueConfig');
    const queueProcessorsModule = await import('./queueProcessors');
    
    redis = redisModule.redis;
    checkRedisHealth = redisModule.checkRedisHealth;
    closeRedisConnection = redisModule.closeRedisConnection;
    imageQueue = queueConfigModule.imageQueue;
    rawQueue = queueConfigModule.rawQueue;
    bulkQueue = queueConfigModule.bulkQueue;
    checkQueueHealth = queueConfigModule.checkQueueHealth;
    getQueueStats = queueConfigModule.getQueueStats;
    closeAllQueues = queueConfigModule.closeAllQueues;
    QUEUE_PRIORITIES = queueConfigModule.QUEUE_PRIORITIES;
    JOB_TYPES = queueConfigModule.JOB_TYPES;
    initializeQueueProcessors = queueProcessorsModule.initializeQueueProcessors;
    addJob = queueProcessorsModule.addJobToQueue;
    getJobStatus = queueProcessorsModule.getJobStatus;
    
    return true;
  } catch (error) {
    console.warn('⚠️  Failed to load Redis modules (Redis unavailable):', error.message || error);
    return false;
  }
}

export interface QueueJob {
  id: string;
  data: any;
  priority: number;
  attempts: number;
}

export interface QueueStatus {
  redis: boolean;
  queues: {
    imageQueue: boolean;
    rawQueue: boolean;
    bulkQueue: boolean;
  };
  stats?: any;
}

// Initialize queue service
export async function initializeQueueService(): Promise<boolean> {
  try {
    console.log('🚀 Initializing queue service...');
    
    // Try to load Redis modules first with short timeout
    const modulesLoaded = await Promise.race([
      loadRedisModules(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)) // 2 second timeout
    ]);
    
    if (!modulesLoaded) {
      console.warn('⚠️  Redis modules failed to load or timed out - skipping queue initialization');
      return false;
    }
    
    // Check Redis connection with very short timeout to prevent hanging
    const redisHealth = await Promise.race([
      checkRedisHealth(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)) // 1 second timeout
    ]);
    
    if (!redisHealth) {
      console.warn('⚠️  Redis connection failed or timed out - skipping queue initialization');
      return false;
    }
    
    // Check all queues
    const queueHealth = await checkQueueHealth();
    const allQueuesHealthy = Object.values(queueHealth).every(Boolean);
    
    if (!allQueuesHealthy) {
      console.warn('⚠️  One or more queues failed to initialize:', queueHealth);
      return false;
    }
    
    // Initialize queue processors
    initializeQueueProcessors();
    
    console.log('✅ Queue service initialized successfully');
    console.log('📊 Queue status:', queueHealth);
    
    return true;
  } catch (error) {
    console.warn('⚠️  Failed to initialize queue service:', error);
    return false;
  }
}

// Get comprehensive queue service status
export async function getQueueServiceStatus(): Promise<QueueStatus> {
  if (!checkRedisHealth || !checkQueueHealth) {
    return {
      redis: false,
      queues: {
        imageQueue: false,
        rawQueue: false,
        bulkQueue: false,
      },
    };
  }
  
  const redisHealth = await checkRedisHealth();
  const queueHealth = await checkQueueHealth();
  const stats = redisHealth && getQueueStats ? await getQueueStats() : null;
  
  return {
    redis: redisHealth,
    queues: queueHealth,
    ...(stats && { stats }),
  };
}

// Export the job management functions from processors
export const addJobToQueue = addJob;
export { getJobStatus };

// Graceful shutdown
export async function shutdownQueueService(): Promise<void> {
  try {
    console.log('🔄 Shutting down queue service...');
    
    // Close all queues if they exist
    if (closeAllQueues) {
      await closeAllQueues();
    }
    
    // Close Redis connection if it exists
    if (closeRedisConnection) {
      await closeRedisConnection();
    }
    
    console.log('✅ Queue service shut down gracefully');
  } catch (error) {
    console.warn('⚠️  Error during queue service shutdown:', error);
  }
}

// Export for direct access if needed (will be null if not loaded)
export {
  redis,
  imageQueue,
  rawQueue,
  bulkQueue,
  QUEUE_PRIORITIES,
  JOB_TYPES,
};