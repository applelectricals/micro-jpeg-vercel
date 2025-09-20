// Scoped Operation Counter - Isolated tracking per page/scope
// Ensures zero cross-contamination between different pages

import { db } from './db';
import { 
  anonymousSessionScopes, 
  userScopeCounters, 
  operationsLog, 
  type AnonymousSessionScope, 
  type InsertAnonymousSessionScope,
  type UserScopeCounter,
  type InsertUserScopeCounter,
  type InsertOperationLog 
} from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getUnifiedPlan, checkOperationLimits } from './unifiedPlanConfig';
import crypto from 'crypto';

export interface ScopedOperationContext {
  userId?: string;
  sessionId?: string;
  scope: string; // Enforced by middleware: 'main', 'free', 'test_premium', 'pro', 'enterprise', 'cr2_converter'
  planId: string; // Enforced by middleware mapping
  operationType: 'compression' | 'conversion' | 'special_conversion';
  fileFormat: string;
  fileSizeMb: number;
  interface: 'web' | 'api';
  req?: any;
}

export interface ScopedOperationResult {
  allowed: boolean;
  planId: string;
  scope: string;
  limitType?: 'monthly' | 'daily' | 'hourly';
  remaining: number;
  message?: string;
}

export class ScopedOperationCounter {
  
  /**
   * Route-to-scope mapping - SERVER-SIDE ENFORCEMENT ONLY
   * SECURITY: Maps frontend routes to their intended plan tiers
   * NOTE: This is used for scoping only - actual plan verification happens via authentication
   */
  static getRouteScope(pathname: string): { scope: string; planId: string } {
    // Exact route matching for security
    switch (pathname) {
      // Main landing pages (anonymous access)
      case '/':
      case '/landing':
      case '/landing-new':
      case '/landing-simple':
      case '/micro-jpeg-landing':
        return { scope: 'main', planId: 'anonymous' };
      
      // Free tier pages (require signup)
      case '/compress-free':
      case '/free-signed-compress':
        return { scope: 'free', planId: 'free' };
      
      // Test premium pages (temporary premium access)
      case '/test-premium':
      case '/test-premium-compress':
        return { scope: 'test_premium', planId: 'test_premium' };
      
      // Premium/Pro pages (paid subscription required)
      case '/compress-premium':
      case '/premium-compress':
        return { scope: 'pro', planId: 'pro' };
      
      // Enterprise pages (enterprise subscription required)
      case '/compress-enterprise':
      case '/enterprise-compress':
        return { scope: 'enterprise', planId: 'enterprise' };
      
      // CR2 converter (anonymous access)
      case '/convert/cr2-to-jpg':
      case '/convert/cr2-to-png':
      case '/cr2-converter':
        return { scope: 'cr2-free', planId: 'cr2-free' };
      
      // Special conversion tools
      case '/convert-cr2-to-jpg':
        return { scope: 'cr2-free', planId: 'cr2-free' };
      case '/compress-raw-files':
        return { scope: 'raw_converter', planId: 'cr2-free' };
      
      // Web tools (anonymous access with limited features)
      case '/web-compress':
      case '/web/compress':
      case '/web-convert':
      case '/web/convert':
      case '/web-overview':
      case '/web/overview':
        return { scope: 'web_tools', planId: 'anonymous' };
      
      // Bulk compression (premium feature)
      case '/bulk-image-compression':
        return { scope: 'bulk', planId: 'pro' };
      
      // API-related pages (anonymous access for docs)
      case '/api-docs':
      case '/api-demo':
      case '/api-dashboard':
      case '/image-api-developers':
        return { scope: 'api', planId: 'anonymous' };
      
      // User account pages (require authentication)
      case '/dashboard':
      case '/profile':
        return { scope: 'user_account', planId: 'free' }; // Default to free for auth users
      
      // Payment and subscription pages
      case '/subscribe':
      case '/simple-pricing':
      case '/subscription-success':
      case '/razorpay-checkout':
      case '/purchase-flow':
        return { scope: 'payment', planId: 'anonymous' };
      
      // Authentication pages
      case '/login':
      case '/signup':
      case '/email-verification':
        return { scope: 'auth', planId: 'anonymous' };
      
      // WordPress integration pages
      case '/wordpress-details':
      case '/wordpress-image-plugin':
      case '/wordpress-installation':
      case '/wordpress-development':
        return { scope: 'wordpress', planId: 'anonymous' };
      
      // Content and legal pages
      case '/about':
      case '/contact':
      case '/support':
      case '/features':
      case '/blog':
      case '/terms-of-service':
      case '/privacy-policy':
      case '/cookie-policy':
      case '/cancellation-policy':
      case '/payment-protection':
        return { scope: 'content', planId: 'anonymous' };
      
      // Blog posts (dynamic)
      default:
        if (pathname.startsWith('/blog/')) {
          return { scope: 'content', planId: 'anonymous' };
        }
        
        // API endpoints - determine from path structure
        if (pathname.startsWith('/api/')) {
          return { scope: 'api', planId: 'anonymous' };
        }
        
        // Default to main page scope for unknown routes
        return { scope: 'main', planId: 'anonymous' };
    }
  }

  /**
   * Get or create scoped anonymous session record with atomic upserts
   */
  static async getScopedAnonymousSession(sessionId: string, scope: string, req?: any): Promise<AnonymousSessionScope> {
    // Try to get existing record
    let [session] = await db
      .select()
      .from(anonymousSessionScopes)
      .where(
        and(
          eq(anonymousSessionScopes.sessionId, sessionId),
          eq(anonymousSessionScopes.scope, scope)
        )
      );

    if (!session) {
      // Create new scoped session record
      const ipHash = req ? crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex').substring(0, 16) : 'unknown';
      
      [session] = await db
        .insert(anonymousSessionScopes)
        .values({
          sessionId,
          scope,
          ipHash,
          monthlyUsed: 0,
          dailyUsed: 0,
          hourlyUsed: 0,
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
        .update(anonymousSessionScopes)
        .set(updates)
        .where(
          and(
            eq(anonymousSessionScopes.sessionId, sessionId),
            eq(anonymousSessionScopes.scope, scope)
          )
        )
        .returning();
    }

    return session;
  }

  /**
   * Get or create scoped user counter record with atomic upserts
   */
  static async getScopedUserCounter(userId: string, scope: string): Promise<UserScopeCounter> {
    // Try to get existing record
    let [counter] = await db
      .select()
      .from(userScopeCounters)
      .where(
        and(
          eq(userScopeCounters.userId, userId),
          eq(userScopeCounters.scope, scope)
        )
      );

    if (!counter) {
      // Create new scoped user counter
      [counter] = await db
        .insert(userScopeCounters)
        .values({
          userId,
          scope,
          monthlyUsed: 0,
          dailyUsed: 0,
          hourlyUsed: 0,
        })
        .returning();
    }

    // Check if counters need reset (same logic as anonymous sessions)
    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset (30 days)
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
        .update(userScopeCounters)
        .set({
          ...updates,
          updatedAt: now,
        })
        .where(
          and(
            eq(userScopeCounters.userId, userId),
            eq(userScopeCounters.scope, scope)
          )
        )
        .returning();
    }

    return counter;
  }

  /**
   * Check scoped operation limits before processing
   */
  static async checkScopedLimits(context: ScopedOperationContext, requestedOperations: number = 1): Promise<ScopedOperationResult> {
    let monthlyUsed: number;
    let dailyUsed: number; 
    let hourlyUsed: number;

    if (context.userId) {
      // Registered user - get scoped counter
      const counter = await this.getScopedUserCounter(context.userId, context.scope);
      monthlyUsed = counter.monthlyUsed || 0;
      dailyUsed = counter.dailyUsed || 0;
      hourlyUsed = counter.hourlyUsed || 0;
    } else {
      // Anonymous user - get scoped session
      const sessionId = context.sessionId || 'fallback_session';
      const session = await this.getScopedAnonymousSession(sessionId, context.scope, context.req);
      monthlyUsed = session.monthlyUsed || 0;
      dailyUsed = session.dailyUsed || 0;
      hourlyUsed = session.hourlyUsed || 0;
    }

    // Check all limits using unified plan configuration
    const limitCheck = checkOperationLimits(context.planId, monthlyUsed, dailyUsed, hourlyUsed, requestedOperations);
    
    return {
      allowed: limitCheck.allowed,
      planId: context.planId,
      scope: context.scope,
      limitType: limitCheck.limitType,
      remaining: limitCheck.remaining,
      message: limitCheck.message,
    };
  }

  /**
   * Record scoped operation with atomic increments
   */
  static async recordScopedOperation(context: ScopedOperationContext): Promise<void> {
    // Log the operation with scope
    const operationLog: InsertOperationLog = {
      userId: context.userId || null,
      sessionId: context.sessionId || null,
      operationType: context.operationType,
      fileFormat: context.fileFormat,
      fileSizeMb: Math.round(context.fileSizeMb),
      interface: context.interface,
      planId: context.planId,
      scope: context.scope, // CRITICAL: Include scope in operation log
    };
    
    await db.insert(operationsLog).values(operationLog);

    // Increment scoped counters atomically
    if (context.userId) {
      // Increment registered user scoped counter
      await db
        .update(userScopeCounters)
        .set({
          monthlyUsed: sql`${userScopeCounters.monthlyUsed} + 1`,
          dailyUsed: sql`${userScopeCounters.dailyUsed} + 1`,
          hourlyUsed: sql`${userScopeCounters.hourlyUsed} + 1`,
          lastOperationAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userScopeCounters.userId, context.userId),
            eq(userScopeCounters.scope, context.scope)
          )
        );
    } else {
      // Increment anonymous session scoped counter
      const sessionId = context.sessionId || 'fallback_session';
      await db
        .update(anonymousSessionScopes)
        .set({
          monthlyUsed: sql`${anonymousSessionScopes.monthlyUsed} + 1`,
          dailyUsed: sql`${anonymousSessionScopes.dailyUsed} + 1`,
          hourlyUsed: sql`${anonymousSessionScopes.hourlyUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(anonymousSessionScopes.sessionId, sessionId),
            eq(anonymousSessionScopes.scope, context.scope)
          )
        );
    }
  }

  /**
   * Get scoped usage statistics for display
   */
  static async getScopedUsageStats(scope: string, userId?: string, sessionId?: string, req?: any) {
    const plan = getUnifiedPlan(this.getRouteScope('/' + scope).planId);
    
    if (userId) {
      const counter = await this.getScopedUserCounter(userId, scope);
      return {
        planId: plan.id,
        planName: plan.displayName,
        scope: scope,
        monthlyUsed: counter.monthlyUsed || 0,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: counter.dailyUsed || 0,
        dailyLimit: plan.limits.maxOperationsPerDay,
        hourlyUsed: counter.hourlyUsed || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour,
        isAnonymous: false,
      };
    } else {
      const finalSessionId = sessionId || 'fallback_session';
      const session = await this.getScopedAnonymousSession(finalSessionId, scope, req);
      return {
        planId: plan.id,
        planName: plan.displayName,
        scope: scope,
        monthlyUsed: session.monthlyUsed || 0,
        monthlyLimit: plan.limits.monthlyOperations,
        dailyUsed: session.dailyUsed || 0,
        dailyLimit: plan.limits.maxOperationsPerDay,
        hourlyUsed: session.hourlyUsed || 0,
        hourlyLimit: plan.limits.maxOperationsPerHour,
        isAnonymous: true,
      };
    }
  }
}