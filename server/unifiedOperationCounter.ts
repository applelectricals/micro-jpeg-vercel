// Unified Operation Counter - Single source of truth for all operation tracking
// Works across web interface, API, and all formats (standard + premium)

import { db } from './db';
import { users, anonymousSessions, operationsLog, type AnonymousSession, type InsertOperationLog } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import { UNIFIED_PLANS, getUnifiedPlan, getUserPlan, checkOperationLimits } from './unifiedPlanConfig';
import { storage } from './storage';
import crypto from 'crypto';

export interface OperationContext {
  userId?: string;
  sessionId?: string;
  operationType: 'compression' | 'conversion' | 'special_conversion';
  fileFormat: string;
  fileSizeMb: number;
  interface: 'web' | 'api';
  req?: any; // For IP extraction
  leadMagnetEmail?: string; // For lead magnet credit usage
}

export interface OperationResult {
  allowed: boolean;
  planId: string;
  limitType?: 'monthly' | 'daily' | 'hourly';
  remaining: number;
  message?: string;
  overage?: boolean;
  overageRate?: number;
  usingLeadMagnetCredits?: boolean;
  leadMagnetCreditsRemaining?: number;
}

export class UnifiedOperationCounter {
  
  /**
   * Generate anonymous session ID - prefer client-provided ID, fallback to IP+UserAgent
   */
  static generateAnonymousSessionId(req: any): string {
    // First, check if client provided a stable session ID
    
    const clientSessionId = req.headers['x-session-id'] || req.body?.clientSessionId;
    if (clientSessionId && typeof clientSessionId === 'string' && clientSessionId.startsWith('mj_client_')) {
      return clientSessionId;
    }
    
    // Fallback to IP + User Agent (less stable)
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create stable hash from IP + User Agent (more stable than browser fingerprint)
    const identifier = `${ip}:${userAgent}`;
    const hash = crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 16);
    const sessionId = `anon_${hash}`;
    
    return sessionId;
  }

  /**
   * Get or create anonymous session record
   */
  static async getAnonymousSession(sessionId: string, req?: any): Promise<AnonymousSession> {
    let [session] = await db
      .select()
      .from(anonymousSessions)
      .where(eq(anonymousSessions.sessionId, sessionId));

    if (!session) {
      // Create new anonymous session
      const ipHash = req ? crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex').substring(0, 16) : 'unknown';
      
      [session] = await db
        .insert(anonymousSessions)
        .values({
          sessionId,
          ipHash,
          monthlyOperationsUsed: 0,
          dailyOperationsUsed: 0,
          hourlyOperationsUsed: 0,
        })
        .returning();
    }

    // Check if we need to reset counters
    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset (30 days) - only reset if a month has actually passed
    const currentPeriodStart = session.currentPeriodStart ? new Date(session.currentPeriodStart) : new Date();
    const monthsElapsed = Math.floor((now.getTime() - currentPeriodStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsElapsed >= 1) {
      updates.monthlyOperationsUsed = 0;
      updates.currentPeriodStart = now;
      needsUpdate = true;
    }

    // Daily reset (check if last daily reset was not today)
    const lastDailyReset = session.lastDailyReset ? new Date(session.lastDailyReset) : new Date(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    if (lastDailyReset < today) {
      updates.dailyOperationsUsed = 0;
      updates.lastDailyReset = now;
      needsUpdate = true;
    }

    // Hourly reset (check if last hourly reset was not this hour)
    const lastHourlyReset = session.lastHourlyReset ? new Date(session.lastHourlyReset) : new Date(0);
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0); // Start of current hour
    if (lastHourlyReset < currentHour) {
      updates.hourlyOperationsUsed = 0;
      updates.lastHourlyReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      [session] = await db
        .update(anonymousSessions)
        .set(updates)
        .where(eq(anonymousSessions.sessionId, sessionId))
        .returning();
    }

    return session;
  }

  /**
   * Get user operation counts with period resets
   */
  static async getUserOperationCounts(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset (30 days) - use lastOperationAt as reset reference
    const lastOperation = user.lastOperationAt ? new Date(user.lastOperationAt) : new Date();
    const monthlyResetNeeded = now.getTime() - lastOperation.getTime() > (30 * 24 * 60 * 60 * 1000);
    if (monthlyResetNeeded) {
      updates.monthlyOperations = 0;
      updates.lastOperationAt = now;
      needsUpdate = true;
    }

    // Daily reset (check if last operation was not today) - for registered users
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const lastOpToday = user.lastOperationAt ? new Date(user.lastOperationAt) : new Date(0);
    if (lastOpToday < today) {
      updates.dailyOperations = 0;
      updates.lastOperationAt = now;
      needsUpdate = true;
    }

    // Hourly reset (check if last operation was not this hour) - for registered users
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0); // Start of current hour
    const lastOpThisHour = user.lastOperationAt ? new Date(user.lastOperationAt) : new Date(0);
    if (lastOpThisHour < currentHour) {
      updates.hourlyOperations = 0;
      updates.lastOperationAt = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }

    return user;
  }

  /**
   * Check if operation is allowed based on all limits
   */
  static async checkOperationAllowed(context: OperationContext, requestedOperations: number = 1): Promise<OperationResult> {
    // First, check if user has lead magnet credits (highest priority)
    if (context.leadMagnetEmail) {
      const leadMagnetCheck = await storage.checkLeadMagnetCredits(context.leadMagnetEmail);
      if (leadMagnetCheck.hasCredits && leadMagnetCheck.creditsRemaining >= requestedOperations) {
        return {
          allowed: true,
          planId: 'lead-magnet',
          remaining: leadMagnetCheck.creditsRemaining,
          message: `Using ${requestedOperations} lead magnet credits`,
          usingLeadMagnetCredits: true,
          leadMagnetCreditsRemaining: leadMagnetCheck.creditsRemaining - requestedOperations,
          overage: false,
        };
      }
    }

    let planId: string;
    let monthlyUsed: number;
    let dailyUsed: number = 0;
    let hourlyUsed: number = 0;

    if (context.userId) {
      // Registered user
      const user = await this.getUserOperationCounts(context.userId);
      const userPlan = getUserPlan(user);
      planId = userPlan.id;
      monthlyUsed = user.monthlyOperations || 0;
      
      // For registered users, we now track daily/hourly in the users table
      dailyUsed = user.dailyOperations || 0;
      hourlyUsed = user.hourlyOperations || 0;
    } else {
      // Anonymous user
      const sessionId = context.sessionId || this.generateAnonymousSessionId(context.req);
      const session = await this.getAnonymousSession(sessionId, context.req);
      planId = 'anonymous';
      monthlyUsed = session.monthlyOperationsUsed || 0;
      dailyUsed = session.dailyOperationsUsed || 0;
      hourlyUsed = session.hourlyOperationsUsed || 0;
    }

    // Check all limits using unified plan configuration
    const limitCheck = checkOperationLimits(planId, monthlyUsed, dailyUsed, hourlyUsed, requestedOperations);
    
    return {
      allowed: limitCheck.allowed,
      planId,
      limitType: limitCheck.limitType,
      remaining: limitCheck.remaining,
      message: limitCheck.message,
      overage: false, // TODO: Implement overage for Pro/Enterprise plans
      overageRate: planId === 'pro' || planId === 'enterprise' ? 0.5 : undefined, // $0.005/operation
    };
  }

  /**
   * Record an operation and increment all relevant counters
   */
  static async recordOperation(context: OperationContext): Promise<void> {
    // First, try to use lead magnet credits if available
    if (context.leadMagnetEmail) {
      const creditsUsed = await storage.useLeadMagnetCredits(context.leadMagnetEmail, 1);
      if (creditsUsed) {
        // Successfully used lead magnet credits - log as lead magnet operation
        const operationLog: InsertOperationLog = {
          userId: context.userId || null,
          sessionId: context.sessionId || null,
          operationType: context.operationType,
          fileFormat: context.fileFormat,
          fileSizeMb: Math.round(context.fileSizeMb),
          interface: context.interface,
          planId: 'lead-magnet',
        };
        await db.insert(operationsLog).values(operationLog);
        return; // Don't increment regular counters when using lead magnet credits
      }
    }

    const planId = context.userId ? getUserPlan(await this.getUserOperationCounts(context.userId)).id : 'anonymous';
    
    // Log the operation
    const operationLog: InsertOperationLog = {
      userId: context.userId || null,
      sessionId: context.sessionId || null,
      operationType: context.operationType,
      fileFormat: context.fileFormat,
      fileSizeMb: Math.round(context.fileSizeMb),
      interface: context.interface,
      planId,
    };

    await db.insert(operationsLog).values(operationLog);

    // Increment counters
    if (context.userId) {
      // Increment registered user counter (monthly, daily, and hourly)
      await db
        .update(users)
        .set({
          monthlyOperations: sql`${users.monthlyOperations} + 1`,
          dailyOperations: sql`${users.dailyOperations} + 1`,
          hourlyOperations: sql`${users.hourlyOperations} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, context.userId));
    } else {
      // Increment anonymous session counters
      const sessionId = context.sessionId || this.generateAnonymousSessionId(context.req);
      await db
        .update(anonymousSessions)
        .set({
          monthlyOperationsUsed: sql`${anonymousSessions.monthlyOperationsUsed} + 1`,
          dailyOperationsUsed: sql`${anonymousSessions.dailyOperationsUsed} + 1`,
          hourlyOperationsUsed: sql`${anonymousSessions.hourlyOperationsUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(anonymousSessions.sessionId, sessionId));
    }
  }

  /**
   * Record operation with forced plan ID for isolated tracking
   */
  static async recordOperationWithForcedPlan(context: OperationContext, forcePlanId: string): Promise<void> {
    
    // For anonymous users, ensure we have a sessionId
    let finalSessionId = context.sessionId;
    if (!context.userId && !finalSessionId) {
      finalSessionId = this.generateAnonymousSessionId(context.req);
    }
    
    // Log the operation with forced plan ID
    const operationLog: InsertOperationLog = {
      userId: context.userId || null,
      sessionId: finalSessionId || null,
      operationType: context.operationType,
      fileFormat: context.fileFormat,
      fileSizeMb: Math.round(context.fileSizeMb),
      interface: context.interface,
      planId: forcePlanId,
    };
    
    await db.insert(operationsLog).values(operationLog);
    
    // For isolated plans like CR2 converter, don't touch regular user counters
    // Operations are tracked only in the operationsLog table
  }

  /**
   * Get usage statistics for display
   */
  static async getUsageStats(userId?: string, sessionId?: string, req?: any, forcePlanId?: string) {
    if (userId) {
      const user = await this.getUserOperationCounts(userId);
      // Use forced plan ID if provided (e.g., for CR2 converter), otherwise use user's plan
      const plan = forcePlanId ? getUnifiedPlan(forcePlanId) : getUserPlan(user);
      
      // For CR2 converter, use separate isolated counters
      if (forcePlanId === 'cr2-free') {
        // Get CR2-specific operations from operations log
        const cr2Operations = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(operationsLog)
          .where(
            and(
              eq(operationsLog.userId, userId),
              eq(operationsLog.planId, 'cr2-free')
            )
          );
        
        const cr2MonthlyUsed = cr2Operations[0]?.count || 0;
        
        // Get daily CR2 operations (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const cr2DailyOperations = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(operationsLog)
          .where(
            and(
              eq(operationsLog.userId, userId),
              eq(operationsLog.planId, 'cr2-free'),
              sql`${operationsLog.createdAt} >= ${oneDayAgo}`
            )
          );
        
        const cr2DailyUsed = cr2DailyOperations[0]?.count || 0;
        
        return {
          planId: plan.id,
          planName: plan.displayName,
          monthlyUsed: cr2MonthlyUsed,
          monthlyLimit: plan.limits.monthlyOperations,
          dailyUsed: cr2DailyUsed,
          dailyLimit: plan.limits.maxOperationsPerDay,
          hourlyUsed: 0, // CR2 doesn't track hourly
          hourlyLimit: plan.limits.maxOperationsPerHour,
          isAnonymous: false,
        };
      }
      
      return {
        planId: plan.id,
        planName: plan.displayName,
        monthlyUsed: user.monthlyOperations || 0,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: user.dailyOperations || 0,
        dailyLimit: plan.limits.maxOperationsPerDay,
        hourlyUsed: user.hourlyOperations || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour,
        isAnonymous: false,
      };
    } else {
      const finalSessionId = sessionId || this.generateAnonymousSessionId(req);
      const session = await this.getAnonymousSession(finalSessionId, req);
      // Use forced plan ID if provided (e.g., for CR2 converter), otherwise use anonymous plan
      const plan = forcePlanId ? getUnifiedPlan(forcePlanId) : getUnifiedPlan('anonymous');
      
      // For CR2 converter anonymous users, get operations from logs with sessionId + planId
      if (forcePlanId === 'cr2-free') {
        
        // Get CR2-specific operations from operations log for this session
        const cr2Operations = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(operationsLog)
          .where(
            and(
              eq(operationsLog.sessionId, finalSessionId),
              eq(operationsLog.planId, 'cr2-free')
            )
          );
        
        
        const cr2MonthlyUsed = cr2Operations[0]?.count || 0;
        
        // Get daily CR2 operations (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const cr2DailyOperations = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(operationsLog)
          .where(
            and(
              eq(operationsLog.sessionId, finalSessionId),
              eq(operationsLog.planId, 'cr2-free'),
              sql`${operationsLog.createdAt} >= ${oneDayAgo}`
            )
          );
        
        const cr2DailyUsed = cr2DailyOperations[0]?.count || 0;
        
        return {
          planId: plan.id,
          planName: plan.displayName,
          monthlyUsed: cr2MonthlyUsed,
          monthlyLimit: plan.limits.monthlyOperations,
          dailyUsed: cr2DailyUsed,
          dailyLimit: plan.limits.maxOperationsPerDay,
          hourlyUsed: 0, // CR2 doesn't track hourly
          hourlyLimit: plan.limits.maxOperationsPerHour,
          isAnonymous: true,
          sessionId: finalSessionId,
        };
      }
      
      return {
        planId: forcePlanId || 'anonymous',
        planName: plan.displayName,
        monthlyUsed: session.monthlyOperationsUsed,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: session.dailyOperationsUsed || 0,
        dailyLimit: plan.limits.maxOperationsPerDay || null,
        hourlyUsed: session.hourlyOperationsUsed || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour || null,
        isAnonymous: true,
        sessionId: finalSessionId,
      };
    }
  }
}

// Convenience functions for easy integration with existing code
export async function checkOperationAllowed(context: OperationContext, requestedOperations: number = 1): Promise<OperationResult> {
  return UnifiedOperationCounter.checkOperationAllowed(context, requestedOperations);
}

export async function recordOperation(context: OperationContext): Promise<void> {
  return UnifiedOperationCounter.recordOperation(context);
}

export async function getUsageStats(userId?: string, sessionId?: string, req?: any, forcePlanId?: string) {
  return UnifiedOperationCounter.getUsageStats(userId, sessionId, req, forcePlanId);
}