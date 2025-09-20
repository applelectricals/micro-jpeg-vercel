// Cached storage wrapper - adds Redis caching layer to database operations
import { storage, IStorage } from './storage';
import { cacheService, CACHE_NAMESPACES, CACHE_TTL } from './cacheService';
import type { User, CompressionJob, ApiKey, UserShare, UserReward, CloudSave, LeadMagnetSignup } from '@shared/schema';

export class CachedStorage implements IStorage {
  // User operations with caching
  async getUser(id: string): Promise<User | undefined> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.USER,
      id,
      async () => storage.getUser(id),
      CACHE_TTL.USER_DATA
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.USER,
      `email:${email}`,
      async () => storage.getUserByEmail(email),
      CACHE_TTL.USER_DATA
    );
  }

  async createUser(insertUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await storage.createUser(insertUser);
    
    // Cache the new user
    await cacheService.set(CACHE_NAMESPACES.USER, user.id, user, CACHE_TTL.USER_DATA);
    if (user.email) {
      await cacheService.set(CACHE_NAMESPACES.USER, `email:${user.email}`, user, CACHE_TTL.USER_DATA);
    }
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await storage.updateUser(id, updates);
    
    if (user) {
      // Invalidate cached user data
      await this.invalidateUserCache(user);
      
      // Cache the updated user
      await cacheService.set(CACHE_NAMESPACES.USER, user.id, user, CACHE_TTL.USER_DATA);
      if (user.email) {
        await cacheService.set(CACHE_NAMESPACES.USER, `email:${user.email}`, user, CACHE_TTL.USER_DATA);
      }
    }
    
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const user = await storage.upsertUser(userData);
    
    // Cache the upserted user
    await cacheService.set(CACHE_NAMESPACES.USER, user.id, user, CACHE_TTL.USER_DATA);
    if (user.email) {
      await cacheService.set(CACHE_NAMESPACES.USER, `email:${user.email}`, user, CACHE_TTL.USER_DATA);
    }
    
    return user;
  }

  // Compression job operations with caching
  async createCompressionJob(insertJob: any): Promise<CompressionJob> {
    const job = await storage.createCompressionJob(insertJob);
    
    // Cache the new job
    await cacheService.set(CACHE_NAMESPACES.COMPRESSION_JOBS, job.id, job, CACHE_TTL.COMPRESSION_JOBS);
    
    // Invalidate user's job lists
    if (job.userId) {
      await cacheService.delete(CACHE_NAMESPACES.COMPRESSION_JOBS, `user:${job.userId}`);
    }
    if (job.sessionId) {
      await cacheService.delete(CACHE_NAMESPACES.COMPRESSION_JOBS, `session:${job.sessionId}`);
    }
    
    return job;
  }

  async getCompressionJob(id: string): Promise<CompressionJob | undefined> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.COMPRESSION_JOBS,
      id,
      async () => storage.getCompressionJob(id),
      CACHE_TTL.COMPRESSION_JOBS
    );
  }

  async getJobsByIds(ids: string[]): Promise<CompressionJob[]> {
    // Try to get as many jobs from cache as possible
    const cached = await cacheService.mget<CompressionJob>(CACHE_NAMESPACES.COMPRESSION_JOBS, ids);
    const cachedJobs: CompressionJob[] = [];
    const missedIds: string[] = [];
    
    ids.forEach(id => {
      const cachedJob = cached[id];
      if (cachedJob) {
        cachedJobs.push(cachedJob);
      } else {
        missedIds.push(id);
      }
    });
    
    // Fetch missed jobs from database
    let missedJobs: CompressionJob[] = [];
    if (missedIds.length > 0) {
      missedJobs = await storage.getJobsByIds(missedIds);
      
      // Cache the fetched jobs
      const cacheData: Record<string, CompressionJob> = {};
      missedJobs.forEach(job => {
        cacheData[job.id] = job;
      });
      await cacheService.mset(CACHE_NAMESPACES.COMPRESSION_JOBS, cacheData, CACHE_TTL.COMPRESSION_JOBS);
    }
    
    return [...cachedJobs, ...missedJobs];
  }

  async updateCompressionJob(id: string, updates: Partial<CompressionJob>): Promise<CompressionJob | undefined> {
    const job = await storage.updateCompressionJob(id, updates);
    
    if (job) {
      // Update cache
      await cacheService.set(CACHE_NAMESPACES.COMPRESSION_JOBS, job.id, job, CACHE_TTL.COMPRESSION_JOBS);
      
      // Invalidate related caches
      if (job.userId) {
        await cacheService.delete(CACHE_NAMESPACES.COMPRESSION_JOBS, `user:${job.userId}`);
      }
      if (job.sessionId) {
        await cacheService.delete(CACHE_NAMESPACES.COMPRESSION_JOBS, `session:${job.sessionId}`);
      }
    }
    
    return job;
  }

  async getAllCompressionJobs(userId?: string): Promise<CompressionJob[]> {
    const cacheKey = userId ? `user:${userId}` : 'all';
    
    return cacheService.getOrSet(
      CACHE_NAMESPACES.COMPRESSION_JOBS,
      cacheKey,
      async () => storage.getAllCompressionJobs(userId),
      CACHE_TTL.COMPRESSION_JOBS
    );
  }

  async getCompressionJobsBySession(sessionId: string): Promise<CompressionJob[]> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.COMPRESSION_JOBS,
      `session:${sessionId}`,
      async () => storage.getCompressionJobsBySession(sessionId),
      CACHE_TTL.COMPRESSION_JOBS
    );
  }

  async deleteCompressionJob(id: string): Promise<boolean> {
    const result = await storage.deleteCompressionJob(id);
    
    if (result) {
      // Remove from cache
      await cacheService.delete(CACHE_NAMESPACES.COMPRESSION_JOBS, id);
      
      // Invalidate related caches (we don't know userId/sessionId, so use pattern)
      await cacheService.deletePattern(`${CACHE_NAMESPACES.COMPRESSION_JOBS}:user:*`);
      await cacheService.deletePattern(`${CACHE_NAMESPACES.COMPRESSION_JOBS}:session:*`);
    }
    
    return result;
  }

  // Usage statistics caching
  async getUserUsageStats(userId: string): Promise<any> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.USAGE_STATS,
      `user:${userId}`,
      async () => {
        // Get user data which contains usage counters
        const user = await this.getUser(userId);
        if (!user) return null;
        
        return {
          monthlyOperations: user.monthlyOperations || 0,
          dailyOperations: user.dailyOperations || 0,
          hourlyOperations: user.hourlyOperations || 0,
          bytesProcessed: user.bytesProcessed || 0,
          lastOperationAt: user.lastOperationAt
        };
      },
      CACHE_TTL.USAGE_STATS
    );
  }

  // API limits and subscription info caching
  async getUserSubscriptionInfo(userId: string): Promise<any> {
    return cacheService.getOrSet(
      CACHE_NAMESPACES.SUBSCRIPTIONS,
      userId,
      async () => {
        const user = await this.getUser(userId);
        if (!user) return null;
        
        return {
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate,
          isPremium: user.isPremium,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId
        };
      },
      CACHE_TTL.SUBSCRIPTIONS
    );
  }

  // Cache invalidation helpers
  private async invalidateUserCache(user: User): Promise<void> {
    const invalidationPromises = [
      cacheService.delete(CACHE_NAMESPACES.USER, user.id),
      cacheService.delete(CACHE_NAMESPACES.USAGE_STATS, `user:${user.id}`),
      cacheService.delete(CACHE_NAMESPACES.SUBSCRIPTIONS, user.id)
    ];
    
    if (user.email) {
      invalidationPromises.push(
        cacheService.delete(CACHE_NAMESPACES.USER, `email:${user.email}`)
      );
    }
    
    await Promise.all(invalidationPromises);
  }

  // Direct delegation to storage for operations that don't need caching
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return storage.getUserByVerificationToken(token);
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const user = await storage.verifyUserEmail(userId);
    if (user) {
      await this.invalidateUserCache(user);
    }
    return user;
  }

  async togglePremiumStatus(userId: string): Promise<User | undefined> {
    const user = await storage.togglePremiumStatus(userId);
    if (user) {
      await this.invalidateUserCache(user);
    }
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string, endDate?: Date): Promise<User | undefined> {
    const user = await storage.updateSubscriptionStatus(userId, status, endDate);
    if (user) {
      await this.invalidateUserCache(user);
    }
    return user;
  }

  // Guest file storage (in-memory, no caching needed)
  storeGuestFile(sessionId: string, file: { buffer: Buffer; originalName: string }): void {
    return storage.storeGuestFile(sessionId, file);
  }

  getGuestFile(sessionId: string): { buffer: Buffer; originalName: string } | undefined {
    return storage.getGuestFile(sessionId);
  }

  deleteGuestFile(sessionId: string): boolean {
    return storage.deleteGuestFile(sessionId);
  }

  // API key operations (no caching for security)
  async createApiKey(insertApiKey: any): Promise<ApiKey> {
    return storage.createApiKey(insertApiKey);
  }

  async getApiKey(keyHash: string): Promise<ApiKey | undefined> {
    return storage.getApiKey(keyHash);
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return storage.getApiKeysByUserId(userId);
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    return storage.updateApiKey(id, updates);
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return storage.deleteApiKey(id);
  }

  async incrementApiKeyUsage(keyHash: string): Promise<void> {
    return storage.incrementApiKeyUsage(keyHash);
  }

  // Social and rewards (limited caching)
  async getUserShares(userId: string): Promise<UserShare[]> {
    return storage.getUserShares(userId);
  }

  async createUserShare(insertShare: any): Promise<UserShare> {
    return storage.createUserShare(insertShare);
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    return storage.getUserRewards(userId);
  }

  async updateUserDiscount(userId: string, discountPercentage: number): Promise<User | undefined> {
    const user = await storage.updateUserDiscount(userId, discountPercentage);
    if (user) {
      await this.invalidateUserCache(user);
    }
    return user;
  }

  async addRewardPoints(userId: string, points: number, reason: string): Promise<UserReward> {
    const reward = await storage.addRewardPoints(userId, points, reason);
    // Invalidate user cache since points affect user data
    await cacheService.delete(CACHE_NAMESPACES.USER, userId);
    return reward;
  }

  // Lead magnet operations (no caching needed for one-time operations)
  async checkLeadMagnetCredits(email: string): Promise<boolean> {
    return storage.checkLeadMagnetCredits(email);
  }

  async getLeadMagnetSignup(email: string): Promise<LeadMagnetSignup | undefined> {
    return storage.getLeadMagnetSignup(email);
  }

  async createLeadMagnetSignup(insertSignup: any): Promise<LeadMagnetSignup> {
    return storage.createLeadMagnetSignup(insertSignup);
  }

  async deleteLeadMagnetSignup(email: string): Promise<boolean> {
    return storage.deleteLeadMagnetSignup(email);
  }

  async getLeadMagnetSignupCountByIP(ipAddress: string): Promise<number> {
    return storage.getLeadMagnetSignupCountByIP(ipAddress);
  }

  // Referral system (no caching for simplicity)
  async getUserReferral(userId: string): Promise<any> {
    return storage.getUserReferral(userId);
  }

  async createUserReferral(insertReferral: any): Promise<any> {
    return storage.createUserReferral(insertReferral);
  }

  // Cloud save operations (no caching needed)
  async createCloudSave(insertCloudSave: any): Promise<CloudSave> {
    return storage.createCloudSave(insertCloudSave);
  }

  async getCloudSave(id: string): Promise<CloudSave | undefined> {
    return storage.getCloudSave(id);
  }

  async getCloudSavesByUser(userId: string): Promise<CloudSave[]> {
    return storage.getCloudSavesByUser(userId);
  }

  async updateCloudSave(id: string, updates: Partial<CloudSave>): Promise<CloudSave | undefined> {
    return storage.updateCloudSave(id, updates);
  }

  async deleteCloudSave(id: string): Promise<boolean> {
    return storage.deleteCloudSave(id);
  }

  // Cache management endpoints
  async getCacheStats(): Promise<any> {
    return cacheService.getCacheInfo();
  }

  async clearUserCache(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (user) {
      await this.invalidateUserCache(user);
    }
  }

  async clearAllCache(): Promise<void> {
    await cacheService.deletePattern('*');
  }
}

// Create singleton cached storage instance
export const cachedStorage = new CachedStorage();