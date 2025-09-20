// PageIdentifier Operation Counter - Track by sessionId + pageIdentifier
// Provides granular isolation where each session gets separate limits per page visited

import { db } from './db';
import { 
  anonymousSessionPageIdentifiers, 
  userPageIdentifierCounters, 
  operationsLog, 
  users,
  type AnonymousSessionPageIdentifier, 
  type InsertAnonymousSessionPageIdentifier,
  type UserPageIdentifierCounter,
  type InsertUserPageIdentifierCounter,
  type InsertOperationLog 
} from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getUnifiedPlan, getUserPlan, checkOperationLimits } from './unifiedPlanConfig';
import crypto from 'crypto';

export interface PageIdentifierOperationContext {
  userId?: string;
  sessionId?: string;
  pageIdentifier: string; // '/', '/compress-free', '/compress-premium', etc.
  planId: string; // Determined from pageIdentifier and auth status
  operationType: 'compression' | 'conversion' | 'special_conversion';
  fileFormat: string;
  fileSizeMb: number;
  interface: 'web' | 'api';
  req?: any;
}

export interface PageIdentifierOperationResult {
  allowed: boolean;
  planId: string;
  pageIdentifier: string;
  limitType?: 'monthly' | 'daily' | 'hourly';
  remaining: number;
  message?: string;
}

export class PageIdentifierOperationCounter {
  
  /**
   * Generate anonymous session ID - prefer client-provided ID, fallback to IP+UserAgent
   */
  static generateAnonymousSessionId(req: any): string {
    const clientSessionId = req.headers['x-session-id'] || req.body?.clientSessionId;
    if (clientSessionId && typeof clientSessionId === 'string' && clientSessionId.startsWith('mj_client_')) {
      return clientSessionId;
    }
    
    // Fallback to IP + User Agent hash
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const identifier = `${ip}:${userAgent}`;
    const hash = crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 16);
    return `anon_${hash}`;
  }

  /**
   * Get or create anonymous session record for pageIdentifier tracking
   */
  static async getAnonymousSessionPageIdentifier(sessionId: string, pageIdentifier: string, req?: any): Promise<AnonymousSessionPageIdentifier> {
    console.log(`🔧 SESSION CHECK: sessionId=${sessionId}, pageIdentifier=${pageIdentifier}`);
    // Try to get existing record
    let [session] = await db
      .select()
      .from(anonymousSessionPageIdentifiers)
      .where(
        and(
          eq(anonymousSessionPageIdentifiers.sessionId, sessionId),
          eq(anonymousSessionPageIdentifiers.pageIdentifier, pageIdentifier)
        )
      );

    if (!session) {
      // Create new session page record with proper initial timestamps
      const ipHash = req ? crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex').substring(0, 16) : 'unknown';
      const now = new Date();
      
      [session] = await db
        .insert(anonymousSessionPageIdentifiers)
        .values({
          sessionId,
          pageIdentifier,
          ipHash,
          monthlyUsed: 0,
          dailyUsed: 0,
          hourlyUsed: 0,
          currentPeriodStart: now,
          lastDailyReset: now,
          lastHourlyReset: now,
        })
        .returning();
    }

    // Check if counters need reset (time-window management)
    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset (30 days)
    const currentPeriodStart = session.currentPeriodStart ? new Date(session.currentPeriodStart) : new Date();
    const monthsElapsed = Math.floor((now.getTime() - currentPeriodStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsElapsed >= 1) {
      updates.monthlyUsed = 0;
      updates.currentPeriodStart = now;
      needsUpdate = true;
    }

    // Daily reset
    const lastDailyReset = session.lastDailyReset ? new Date(session.lastDailyReset) : new Date(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDailyReset < today) {
      updates.dailyUsed = 0;
      updates.lastDailyReset = now;
      needsUpdate = true;
    }

    // Hourly reset  
    const lastHourlyReset = session.lastHourlyReset ? new Date(session.lastHourlyReset) : new Date(0);
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    if (lastHourlyReset < currentHour) {
      updates.hourlyUsed = 0;
      updates.lastHourlyReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      [session] = await db
        .update(anonymousSessionPageIdentifiers)
        .set(updates)
        .where(
          and(
            eq(anonymousSessionPageIdentifiers.sessionId, sessionId),
            eq(anonymousSessionPageIdentifiers.pageIdentifier, pageIdentifier)
          )
        )
        .returning();
    }

    console.log(`✅ SESSION RESULT: sessionId=${sessionId}, pageIdentifier=${pageIdentifier}, daily=${session.dailyUsed}/${session.dailyLimit || 'unlimited'}, monthly=${session.monthlyUsed}/${session.monthlyLimit || 'unlimited'}`);
    return session;
  }

  /**
   * Get or create user page identifier record
   */
  static async getUserPageIdentifierCounters(userId: string, pageIdentifier: string): Promise<UserPageIdentifierCounter> {
    // Try to get existing record
    let [counter] = await db
      .select()
      .from(userPageIdentifierCounters)
      .where(
        and(
          eq(userPageIdentifierCounters.userId, userId),
          eq(userPageIdentifierCounters.pageIdentifier, pageIdentifier)
        )
      );

    if (!counter) {
      // Create new user page counter with proper initial timestamps
      const now = new Date();
      [counter] = await db
        .insert(userPageIdentifierCounters)
        .values({
          userId,
          pageIdentifier,
          monthlyUsed: 0,
          dailyUsed: 0,
          hourlyUsed: 0,
          currentPeriodStart: now,
          lastDailyReset: now,
          lastHourlyReset: now,
        })
        .returning();
    }

    // Reset logic similar to anonymous sessions
    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset
    const currentPeriodStart = counter.currentPeriodStart ? new Date(counter.currentPeriodStart) : new Date();
    const monthsElapsed = Math.floor((now.getTime() - currentPeriodStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsElapsed >= 1) {
      updates.monthlyUsed = 0;
      updates.currentPeriodStart = now;
      needsUpdate = true;
    }

    // Daily reset
    const lastDailyReset = counter.lastDailyReset ? new Date(counter.lastDailyReset) : new Date(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDailyReset < today) {
      updates.dailyUsed = 0;
      updates.lastDailyReset = now;
      needsUpdate = true;
    }

    // Hourly reset
    const lastHourlyReset = counter.lastHourlyReset ? new Date(counter.lastHourlyReset) : new Date(0);
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    if (lastHourlyReset < currentHour) {
      updates.hourlyUsed = 0;
      updates.lastHourlyReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      [counter] = await db
        .update(userPageIdentifierCounters)
        .set(updates)
        .where(
          and(
            eq(userPageIdentifierCounters.userId, userId),
            eq(userPageIdentifierCounters.pageIdentifier, pageIdentifier)
          )
        )
        .returning();
    }

    return counter;
  }

  /**
   * Check if operation is allowed based on pageIdentifier-specific limits
   */
  static async checkPageIdentifierLimits(context: PageIdentifierOperationContext, requestedOperations: number = 1): Promise<PageIdentifierOperationResult> {
    const plan = getUnifiedPlan(context.planId);
    const limits = plan.limits;
    
    // For anonymous users
    if (!context.userId) {
      const finalSessionId = context.sessionId || this.generateAnonymousSessionId(context.req);
      const session = await this.getAnonymousSessionPageIdentifier(finalSessionId, context.pageIdentifier, context.req);
      
      const currentUsage = {
        monthly: session.monthlyUsed || 0,
        daily: session.dailyUsed || 0,
        hourly: session.hourlyUsed || 0
      };

      // Check limits
      const limitCheck = checkOperationLimits(context.planId, currentUsage.monthly, currentUsage.daily, currentUsage.hourly, requestedOperations);
      
      return {
        allowed: limitCheck.allowed,
        planId: context.planId,
        pageIdentifier: context.pageIdentifier,
        limitType: limitCheck.limitType,
        remaining: limitCheck.remaining,
        message: limitCheck.message
      };
    } else {
      // For authenticated users
      const counter = await this.getUserPageIdentifierCounters(context.userId, context.pageIdentifier);
      
      const currentUsage = {
        monthly: counter.monthlyUsed || 0,
        daily: counter.dailyUsed || 0,
        hourly: counter.hourlyUsed || 0
      };

      const limitCheck = checkOperationLimits(context.planId, currentUsage.monthly, currentUsage.daily, currentUsage.hourly, requestedOperations);
      
      return {
        allowed: limitCheck.allowed,
        planId: context.planId,
        pageIdentifier: context.pageIdentifier,
        limitType: limitCheck.limitType,
        remaining: limitCheck.remaining,
        message: limitCheck.message
      };
    }
  }

  /**
   * Record operation with pageIdentifier tracking
   */
  static async recordPageIdentifierOperation(context: PageIdentifierOperationContext): Promise<void> {
    // For anonymous users, ensure we have a sessionId
    let finalSessionId = context.sessionId;
    if (!context.userId && !finalSessionId) {
      finalSessionId = this.generateAnonymousSessionId(context.req);
    }
    
    // Log the operation
    const operationLog: InsertOperationLog = {
      userId: context.userId || null,
      sessionId: finalSessionId || null,
      operationType: context.operationType,
      fileFormat: context.fileFormat,
      fileSizeMb: Math.round(context.fileSizeMb),
      interface: context.interface,
      planId: context.planId,
    };
    
    await db.insert(operationsLog).values(operationLog);
    
    // Increment counters atomically
    if (context.userId) {
      // Update user page counter
      await db
        .update(userPageIdentifierCounters)
        .set({
          monthlyUsed: sql`${userPageIdentifierCounters.monthlyUsed} + 1`,
          dailyUsed: sql`${userPageIdentifierCounters.dailyUsed} + 1`, 
          hourlyUsed: sql`${userPageIdentifierCounters.hourlyUsed} + 1`,
          lastOperationAt: new Date()
        })
        .where(
          and(
            eq(userPageIdentifierCounters.userId, context.userId),
            eq(userPageIdentifierCounters.pageIdentifier, context.pageIdentifier)
          )
        );
    } else {
      // Update anonymous session page counter
      await db
        .update(anonymousSessionPageIdentifiers)
        .set({
          monthlyUsed: sql`${anonymousSessionPageIdentifiers.monthlyUsed} + 1`,
          dailyUsed: sql`${anonymousSessionPageIdentifiers.dailyUsed} + 1`,
          hourlyUsed: sql`${anonymousSessionPageIdentifiers.hourlyUsed} + 1`
        })
        .where(
          and(
            eq(anonymousSessionPageIdentifiers.sessionId, finalSessionId!),
            eq(anonymousSessionPageIdentifiers.pageIdentifier, context.pageIdentifier)
          )
        );
    }
  }

  /**
   * Get usage statistics for display
   */
  static async getPageIdentifierUsageStats(pageIdentifier: string, userId?: string, sessionId?: string, req?: any) {
    if (userId) {
      const counter = await this.getUserPageIdentifierCounters(userId, pageIdentifier);
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const plan = getUserPlan(user);
      
      return {
        planId: plan.id,
        planName: plan.displayName,
        pageIdentifier,
        monthlyUsed: counter.monthlyUsed || 0,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: counter.dailyUsed || 0,
        dailyLimit: plan.limits.maxOperationsPerDay,
        hourlyUsed: counter.hourlyUsed || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour,
        isAnonymous: false,
        userId
      };
    } else {
      const finalSessionId = sessionId || this.generateAnonymousSessionId(req);
      const session = await this.getAnonymousSessionPageIdentifier(finalSessionId, pageIdentifier, req);
      const plan = getUnifiedPlan('anonymous'); // Default plan for anonymous users
      
      return {
        planId: plan.id,
        planName: plan.displayName,
        pageIdentifier,
        monthlyUsed: session.monthlyUsed || 0,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: session.dailyUsed || 0,
        dailyLimit: plan.limits.maxOperationsPerDay,
        hourlyUsed: session.hourlyUsed || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour,
        isAnonymous: true,
        sessionId: finalSessionId
      };
    }
  }

  /**
   * Get aggregated usage stats across ALL page identifiers for a user/session
   * This is what the universal counter should use instead of fetching from only '/'
   */
  static async getAllUserUsageStats(userId?: string, sessionId?: string, req?: any): Promise<{
    monthlyUsed: number;
    dailyUsed: number; 
    hourlyUsed: number;
  }> {
    console.log(`🔧 AGGREGATING ALL PAGES: userId=${userId}, sessionId=${sessionId}`);
    
    let totalMonthly = 0;
    let totalDaily = 0; 
    let totalHourly = 0;

    if (userId) {
      // Authenticated user - aggregate all their page identifiers
      const userRecords = await db
        .select()
        .from(userPageIdentifierCounters)
        .where(eq(userPageIdentifierCounters.userId, userId));
      
      console.log(`📊 Found ${userRecords.length} user page records to aggregate`);
      
      for (const record of userRecords) {
        // Get current usage for each page identifier
        const pageUsage = await this.getPageIdentifierUsageStats(record.pageIdentifier, userId, sessionId, req);
        totalMonthly += pageUsage.monthlyUsed || 0;
        totalDaily += pageUsage.dailyUsed || 0;
        totalHourly += pageUsage.hourlyUsed || 0;
        
        console.log(`📊 Page ${record.pageIdentifier}: monthly=${pageUsage.monthlyUsed}, daily=${pageUsage.dailyUsed}, hourly=${pageUsage.hourlyUsed}`);
      }
    } else if (sessionId) {
      // Anonymous user - aggregate all their page identifiers
      const sessionRecords = await db
        .select()
        .from(anonymousSessionPageIdentifiers)
        .where(eq(anonymousSessionPageIdentifiers.sessionId, sessionId));
      
      console.log(`📊 Found ${sessionRecords.length} session page records to aggregate`);
      
      for (const record of sessionRecords) {
        // Get current usage for each page identifier
        const pageUsage = await this.getPageIdentifierUsageStats(record.pageIdentifier, userId, sessionId, req);
        totalMonthly += pageUsage.monthlyUsed || 0;
        totalDaily += pageUsage.dailyUsed || 0;
        totalHourly += pageUsage.hourlyUsed || 0;
        
        console.log(`📊 Page ${record.pageIdentifier}: monthly=${pageUsage.monthlyUsed}, daily=${pageUsage.dailyUsed}, hourly=${pageUsage.hourlyUsed}`);
      }
    }

    console.log(`📊 AGGREGATED TOTALS: monthly=${totalMonthly}, daily=${totalDaily}, hourly=${totalHourly}`);
    
    return {
      monthlyUsed: totalMonthly,
      dailyUsed: totalDaily,
      hourlyUsed: totalHourly
    };
  }
}

// Convenience functions for easy integration
export async function checkPageIdentifierOperationAllowed(context: PageIdentifierOperationContext, requestedOperations: number = 1): Promise<PageIdentifierOperationResult> {
  return PageIdentifierOperationCounter.checkPageIdentifierLimits(context, requestedOperations);
}

export async function recordPageIdentifierOperation(context: PageIdentifierOperationContext): Promise<void> {
  return PageIdentifierOperationCounter.recordPageIdentifierOperation(context);
}

export async function getPageIdentifierUsageStats(pageIdentifier: string, userId?: string, sessionId?: string, req?: any) {
  return PageIdentifierOperationCounter.getPageIdentifierUsageStats(pageIdentifier, userId, sessionId, req);
}