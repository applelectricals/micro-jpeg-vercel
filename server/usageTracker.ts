import { db } from './db';
import { usageTracking, type UsageTracking, type InsertUsageTracking } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserPlan, checkOperationLimits } from './unifiedPlanConfig';

export interface UsageStats {
  totalCompressions: number;
  totalConversions: number;
  dailyCompressions: number;
  dailyConversions: number;
  lastResetDate: Date;
  monthlyCompressions: number;
  monthlyConversions: number;
  monthlyStartDate: Date;
  monthlyCreditsUsed: number;
  purchasedCredits: number;
  currentCredits: number;
}

export class UsageTracker {
  // Generate browser fingerprint for anonymous users
  static generateFingerprint(req: any): string {
    // Use more stable identifiers, focusing on User-Agent as primary identifier
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    
    // Extract just the browser and version from user agent for stability
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const stableBrowser = browserMatch ? browserMatch[0] : userAgent.substring(0, 50);
    
    // Create a more stable fingerprint
    const fingerprint = stableBrowser + acceptLanguage;
    const hash = Buffer.from(fingerprint).toString('base64').slice(0, 16);
    return `anon_${hash}`;
  }

  // Get or create usage record for user/fingerprint
  static async getUsage(userId?: string, fingerprint?: string): Promise<UsageStats> {
    if (!userId && !fingerprint) {
      throw new Error('Either userId or fingerprint must be provided');
    }

    const whereClause = userId 
      ? eq(usageTracking.userId, userId)
      : eq(usageTracking.fingerprint, fingerprint!);

    const [record] = await db
      .select()
      .from(usageTracking)
      .where(whereClause);

    // Get user's purchased credits if authenticated
    let purchasedCredits = 0;
    if (userId) {
      try {
        const { storage } = await import('./storage');
        const user = await storage.getUser(userId);
        purchasedCredits = (user?.purchasedCredits || 0) * 100; // Convert to cents
      } catch (error) {
        console.error('Error fetching user purchased credits:', error);
      }
    }

    if (record) {
      // Check if daily reset is needed
      const now = new Date();
      const lastReset = record.lastResetDate ? new Date(record.lastResetDate) : new Date();
      const needsReset = now.getDate() !== lastReset.getDate() || 
                        now.getMonth() !== lastReset.getMonth() ||
                        now.getFullYear() !== lastReset.getFullYear();

      if (needsReset) {
        // Reset daily counters
        const [updated] = await db
          .update(usageTracking)
          .set({
            dailyCompressions: 0,
            dailyConversions: 0,
            lastResetDate: now,
            updatedAt: now,
          })
          .where(whereClause)
          .returning();

        // Total available credits = free credits + purchased credits - used credits
        const totalAvailableCredits = Math.max(0, (90 * 100) + purchasedCredits - (updated.currentCredits || 0));

        return {
          totalCompressions: updated.totalCompressions || 0,
          totalConversions: updated.totalConversions || 0,
          dailyCompressions: 0,
          dailyConversions: 0,
          lastResetDate: now,
          currentCredits: totalAvailableCredits,
        };
      }

      // Total available credits = free credits + purchased credits - used credits
      const totalAvailableCredits = Math.max(0, (90 * 100) + purchasedCredits - (record.currentCredits || 0));

      return {
        totalCompressions: record.totalCompressions || 0,
        totalConversions: record.totalConversions || 0,
        dailyCompressions: record.dailyCompressions || 0,
        dailyConversions: record.dailyConversions || 0,
        lastResetDate: record.lastResetDate ? new Date(record.lastResetDate) : new Date(),
        currentCredits: totalAvailableCredits,
      };
    }

    // Create new record with starting credits (90 for free users)
    const userPlan = getUserPlan('free'); // All new users start as free
    const startingCredits = 90 * 100; // 90 credits in cents
    
    const newRecord: InsertUsageTracking = {
      userId: userId || null,
      fingerprint: fingerprint || null,
      totalCompressions: 0,
      totalConversions: 0,
      dailyCompressions: 0,
      dailyConversions: 0,
      currentCredits: 0, // Track usage, not balance
    };

    const [created] = await db
      .insert(usageTracking)
      .values(newRecord)
      .returning();

    // Total available credits = free credits + purchased credits
    const totalAvailableCredits = startingCredits + purchasedCredits;

    return {
      totalCompressions: 0,
      totalConversions: 0,
      dailyCompressions: 0,
      dailyConversions: 0,
      lastResetDate: created.lastResetDate ? new Date(created.lastResetDate) : new Date(),
      currentCredits: totalAvailableCredits,
    };
  }

  // Check if operation is allowed and get remaining quota
  static async checkLimit(
    user: any, 
    req: any, 
    operationCount: number = 1, 
    isConversion: boolean = false
  ): Promise<{ allowed: boolean; remaining: number; message?: string; usage: UsageStats }> {
    const userId = user?.id;
    const fingerprint = userId ? undefined : this.generateFingerprint(req);
    
    const usage = await this.getUsage(userId, fingerprint);
    const userPlan = getUserPlan(user?.subscriptionPlan || 'free');
    
    // Simple operation check using unified plan system
    const allowed = operationCount <= userPlan.limits.monthlyOperations;
    const result = {
      allowed,
      message: allowed ? '' : `Operation limit exceeded. You have reached your ${userPlan.limits.monthlyOperations} operations/month limit.`,
      remaining: Math.max(0, userPlan.limits.monthlyOperations - (usage.monthlyCompressions + usage.monthlyConversions))
    };
    
    return {
      ...result,
      usage,
    };
  }

  // Track usage after successful operation
  static async trackUsage(
    user: any,
    req: any,
    fileSizeMB: number,
    operationCount: number = 1,
    isConversion: boolean = false
  ): Promise<UsageStats> {
    const userId = user?.id;
    const fingerprint = userId ? undefined : this.generateFingerprint(req);
    const userPlan = getUserPlan(user?.subscriptionPlan || 'free');
    
    const whereClause = userId 
      ? eq(usageTracking.userId, userId)
      : eq(usageTracking.fingerprint, fingerprint!);

    // Calculate credits for pay-per-use tracking
    const credits = calculateCredits(fileSizeMB, operationCount);

    if (isConversion) {
      const result = await db
        .update(usageTracking)
        .set({
          totalConversions: sql`${usageTracking.totalConversions} + ${operationCount}`,
          dailyConversions: userPlan.limits.resetPolicy !== 'never' 
            ? sql`${usageTracking.dailyConversions} + ${operationCount}`
            : usageTracking.dailyConversions,
          currentCredits: sql`${usageTracking.currentCredits} - ${Math.round(credits * 100)}`, // DEDUCT credits
          updatedAt: new Date(),
        })
        .where(whereClause);
    } else {
      const result = await db
        .update(usageTracking)
        .set({
          totalCompressions: sql`${usageTracking.totalCompressions} + ${operationCount}`,
          dailyCompressions: userPlan.limits.resetPolicy !== 'never'
            ? sql`${usageTracking.dailyCompressions} + ${operationCount}`
            : usageTracking.dailyCompressions,
          currentCredits: sql`${usageTracking.currentCredits} - ${Math.round(credits * 100)}`, // DEDUCT credits
          updatedAt: new Date(),
        })
        .where(whereClause);
    }

    // Get updated usage and check for low credit warnings
    const updatedUsage = await this.getUsage(userId, fingerprint);
    
    // Send low credit warning emails for authenticated users
    if (userId) {
      await this.checkAndSendCreditWarnings(userId, updatedUsage.currentCredits);
    }
    
    return updatedUsage;
  }

  // Get usage statistics for display
  static async getUsageStats(user: any, req: any): Promise<{
    usage: UsageStats;
    limits: {
      maxCompressions: number;
      maxConversions: number;
      resetPolicy: string;
    };
    remaining: {
      compressions: number;
      conversions: number;
    };
  }> {
    const userId = user?.id;
    const fingerprint = userId ? undefined : this.generateFingerprint(req);
    
    // Use subscriptionTier (newer field) or fallback to subscriptionPlan (legacy)
    const userTier = user?.subscriptionTier || user?.subscriptionPlan || 'free_registered';
    
    // For test-premium users, check if subscription has expired
    let effectiveTier = userTier;
    if (userTier === 'test_premium' && user?.subscriptionEndDate) {
      const now = new Date();
      const endDate = new Date(user.subscriptionEndDate);
      
      if (now > endDate) {
        effectiveTier = 'free_registered'; // Expired test-premium gets free limits
      }
    }
    
    const userPlan = getUserPlan(effectiveTier);
    
    const usage = await this.getUsage(userId, fingerprint);
    
    const compRemaining = Math.max(0, userPlan.limits.monthlyOperations - usage.monthlyCompressions);
    const convRemaining = Math.max(0, userPlan.limits.monthlyOperations - usage.monthlyConversions);

    return {
      usage,
      limits: {
        maxCompressions: userPlan.limits.monthlyOperations,
        maxConversions: userPlan.limits.monthlyOperations,
        resetPolicy: 'monthly',
      },
      remaining: {
        compressions: compRemaining,
        conversions: convRemaining,
      },
    };
  }

  // Check for low credits and send warning emails
  static async checkAndSendCreditWarnings(userId: string, currentCredits: number): Promise<void> {
    try {
      const { storage } = await import('./storage');
      const { emailService } = await import('./emailService');
      
      const user = await storage.getUser(userId);
      if (!user || !user.email) return;
      
      const creditsInUnits = Math.floor(currentCredits / 100); // Convert cents to credits
      
      // Define warning thresholds
      let severity: 'warning' | 'urgent' | 'critical' | null = null;
      
      if (creditsInUnits === 0) {
        severity = 'critical';
      } else if (creditsInUnits <= 5) {
        severity = 'urgent';
      } else if (creditsInUnits <= 10) {
        severity = 'warning';
      }
      
      if (severity) {
        // Check if we've already sent this type of warning recently (to avoid spam)
        const shouldSend = await this.shouldSendWarningEmail(userId, severity, creditsInUnits);
        
        if (shouldSend) {
          console.log(`Sending ${severity} credit warning to ${user.email} (${creditsInUnits} credits remaining)`);
          
          await emailService.sendCreditLowWarning(
            user.email,
            user.firstName || 'Valued Customer',
            creditsInUnits,
            severity
          );
          
          // Record that we sent this warning
          await this.recordWarningEmailSent(userId, severity, creditsInUnits);
        }
      }
    } catch (error) {
      console.error('Error checking/sending credit warnings:', error);
    }
  }
  
  // Track when warning emails are sent to avoid spam
  private static warningEmailCache = new Map<string, { severity: string; credits: number; sentAt: Date }>();
  
  static async shouldSendWarningEmail(userId: string, severity: 'warning' | 'urgent' | 'critical', currentCredits: number): Promise<boolean> {
    const cacheKey = `${userId}_${severity}`;
    const cached = this.warningEmailCache.get(cacheKey);
    
    if (!cached) return true;
    
    // Don't send the same severity warning more than once per day
    const now = new Date();
    const timeDiff = now.getTime() - cached.sentAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Send critical warnings every 6 hours, urgent every 12 hours, warning once per day
    const resendThreshold = severity === 'critical' ? 6 : severity === 'urgent' ? 12 : 24;
    
    return hoursDiff >= resendThreshold;
  }
  
  static async recordWarningEmailSent(userId: string, severity: 'warning' | 'urgent' | 'critical', currentCredits: number): Promise<void> {
    const cacheKey = `${userId}_${severity}`;
    this.warningEmailCache.set(cacheKey, {
      severity,
      credits: currentCredits,
      sentAt: new Date()
    });
    
    // Clean up old entries (older than 48 hours)
    for (const [key, value] of this.warningEmailCache.entries()) {
      const age = Date.now() - value.sentAt.getTime();
      if (age > 48 * 60 * 60 * 1000) {
        this.warningEmailCache.delete(key);
      }
    }
  }

  // Add bonus operations for loyalty program
  static async addBonusOperations(userId: string | undefined, sessionId: string, operationsToAdd: number, reason: string): Promise<void> {
    try {
      const identifier = userId || sessionId;
      if (!identifier) {
        console.log('No user ID or session ID provided for bonus operations');
        return;
      }

      // For authenticated users, update their database record
      if (userId) {
        // Add bonus operations to user's account (you may need to add a bonusOperations field to user schema)
        console.log(`Adding ${operationsToAdd} bonus operations to user ${userId} for: ${reason}`);
        
        // For now, we'll track this in the session storage as well
        // In the future, you might want to add a separate bonus operations table
      }

      // For session-based tracking (works for both guest and authenticated users)
      const now = new Date();
      const cacheKey = `bonus_${identifier}_${now.getFullYear()}_${now.getMonth() + 1}`;
      
      // Get existing bonus operations from cache or start with 0
      const existingBonus = this.usageCache.get(cacheKey) || 0;
      const newBonus = existingBonus + operationsToAdd;
      
      // Store the updated bonus operations
      this.usageCache.set(cacheKey, newBonus);
      
      console.log(`Loyalty program: Added ${operationsToAdd} operations to ${identifier}. Total bonus: ${newBonus}`);
      
    } catch (error) {
      console.error('Error adding bonus operations:', error);
    }
  }

  // Get bonus operations for a user/session
  static getBonusOperations(userId: string | undefined, sessionId: string): number {
    try {
      const identifier = userId || sessionId;
      if (!identifier) return 0;

      const now = new Date();
      const cacheKey = `bonus_${identifier}_${now.getFullYear()}_${now.getMonth() + 1}`;
      
      return this.usageCache.get(cacheKey) || 0;
    } catch (error) {
      console.error('Error getting bonus operations:', error);
      return 0;
    }
  }

  // Rate limiting for loyalty rewards
  static hasClaimedTodayReward(rateLimitKey: string): boolean {
    return this.usageCache.has(rateLimitKey);
  }

  static markRewardClaimed(rateLimitKey: string): void {
    // Store with 24-hour expiry (86400 seconds)
    this.usageCache.set(rateLimitKey, true);
    
    // Clean up expired rate limit entries (older than 48 hours)
    setTimeout(() => {
      for (const [key, value] of this.usageCache.entries()) {
        if (key.startsWith('loyalty_') && key !== rateLimitKey) {
          // Remove entries that are likely expired
          this.usageCache.delete(key);
        }
      }
    }, 24 * 60 * 60 * 1000); // Clean up after 24 hours
  }
}