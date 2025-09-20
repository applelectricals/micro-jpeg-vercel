// Scope Enforcement Middleware - SERVER-SIDE ROUTE-TO-SCOPE MAPPING
// Prevents client manipulation and ensures complete isolation between pages

import type { Request, Response, NextFunction } from 'express';
import { ScopedOperationCounter } from './scopedOperationCounter';

// Extend Express Request type to include scope/plan tracking
declare global {
  namespace Express {
    interface Request {
      trackingScope?: string;
      planId?: string;
      scopeEnforced?: boolean;
    }
  }
}

/**
 * Middleware to enforce scope based on the request route
 * CRITICAL: Never trust client-provided scope/planId values
 */
export function setScopeFromRoute(req: Request, res: Response, next: NextFunction) {
  // Get the current route path
  const pathname = req.path;
  
  // SERVER-SIDE ONLY: Map route to scope and plan
  const { scope, planId } = ScopedOperationCounter.getRouteScope(pathname);
  
  // Set scope and plan on request object for downstream use
  req.trackingScope = scope;
  req.planId = planId;
  req.scopeEnforced = true;
  
  // Debug logging
  console.log(`🔧 SCOPE MIDDLEWARE: ${pathname} → scope: ${scope}, planId: ${planId}`);
  
  next();
}

/**
 * SECURE middleware for API endpoints that need scope enforcement
 * Determines planId based on user authentication and subscription status, NOT Referer headers
 * CRITICAL: Never trust client-provided headers for plan determination
 */
export async function requireScopeFromAuth(req: Request, res: Response, next: NextFunction) {
  let scope = 'main'; // default
  let planId = 'anonymous'; // default for unauthenticated users
  
  try {
    // STEP 1: Determine scope from pageIdentifier (preferred), pageSource, or planId
    const pageIdentifier = (req as any).context?.pageIdentifier;
    const pageScope = (req as any).context?.pageScope;
    const pageSource = req.body?.pageSource || req.query?.pageSource;
    const clientPlanId = req.query?.planId; // Also check for planId query parameter
    
    if (pageIdentifier && pageScope) {
      console.log(`🔧 PAGE IDENTIFIER DETECTED: ${pageIdentifier} → scope: ${pageScope}`);
      
      // Use scope determined by pageIdentifierMiddleware
      scope = pageScope;
    } else if (pageSource) {
      console.log(`🔧 PAGE SOURCE DETECTED (fallback): ${pageSource}`);
      
      // Fallback: Map pageSource to scope
      switch (pageSource) {
        case 'premium':
          scope = 'pro';
          break;
        case 'enterprise':
          scope = 'enterprise';
          break;
        case 'test-premium':
          scope = 'test_premium';
          break;
        case 'cr2-converter':
          scope = 'cr2-free';
          break;
        case 'free':
        case 'free-signed':
          scope = 'free';
          break;
        default:
          scope = 'main'; // Default for main/root page
      }
    } else if (clientPlanId) {
      console.log(`🔧 PLAN ID DETECTED: ${clientPlanId}`);
      
      // Map planId directly to scope (standardize to 'pro' naming)
      switch (clientPlanId) {
        case 'pro':
          scope = 'pro';
          break;
        case 'enterprise':
          scope = 'enterprise';
          break;
        case 'test_premium':
          scope = 'test_premium';
          break;
        case 'cr2-free':
          scope = 'cr2-free';
          break;
        case 'free':
          scope = 'free';
          break;
        case 'anonymous':
          scope = 'main';
          break;
        default:
          scope = 'main'; // Default for main/root page
      }
    }
    
    // STEP 2: Determine planId from authentication and validate access
    const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
    let userId = isUserAuthenticated && req.user ? (req.user as any).claims?.sub : 
                 (req.session as any)?.userId || undefined;
    
    // Enhanced fallback for session authentication
    if (!userId && req.session && (req.session as any).userId) {
      userId = (req.session as any).userId;
    }
    
    if (userId) {
      // Authenticated user - get their actual subscription plan from database
      const { storage } = await import('./storage');
      const user = await storage.getUser(userId);
      
      if (user) {
        // Use getUserPlan to securely determine plan based on subscription
        const { getUserPlan } = await import('./unifiedPlanConfig');
        const userPlan = getUserPlan(user);
        planId = userPlan.id;
        
        // STEP 3: Validate that user can access the requested scope
        const scopeRequiresAuth = ['pro', 'enterprise', 'test_premium', 'free'].includes(scope);
        if (scopeRequiresAuth) {
          // Verify user has required subscription for premium scopes
          if (scope === 'pro' && planId !== 'pro') {
            console.warn(`🚨 ACCESS DENIED: User ${userId} tried to access pro scope without pro subscription`);
            return res.status(403).json({ error: 'Premium subscription required' });
          }
          if (scope === 'enterprise' && planId !== 'enterprise') {
            console.warn(`🚨 ACCESS DENIED: User ${userId} tried to access enterprise scope without enterprise subscription`);
            return res.status(403).json({ error: 'Enterprise subscription required' });
          }
          if (scope === 'test_premium' && planId !== 'test_premium') {
            console.warn(`🚨 ACCESS DENIED: User ${userId} tried to access test premium scope without test premium subscription`);
            return res.status(403).json({ error: 'Test premium subscription required' });
          }
        }
        
        console.log(`🔒 SECURE AUTH: ${req.path} → userId: ${userId}, scope: ${scope}, planId: ${planId}, pageId: ${pageIdentifier || 'none'}`);
      } else {
        console.warn(`🔒 User not found in database: ${userId}`);
        // User authenticated but not in DB - treat as anonymous, only allow public scopes
        if (['premium', 'enterprise', 'test_premium'].includes(scope)) {
          return res.status(403).json({ error: 'Authentication required' });
        }
        planId = 'anonymous';
      }
    } else {
      // Anonymous user - only allow public scopes
      const publicScopes = ['main', 'free', 'cr2-free'];
      if (!publicScopes.includes(scope)) {
        console.warn(`🚨 ACCESS DENIED: Anonymous user tried to access protected scope: ${scope}`);
        return res.status(403).json({ error: 'Authentication required' });
      }
      
      // Set appropriate planId for public scopes
      planId = scope === 'cr2-free' ? 'cr2-free' : 'anonymous';
      console.log(`🔒 ANONYMOUS: ${req.path} → scope: ${scope}, planId: ${planId}, pageId: ${pageIdentifier || 'none'}`);
    }
    
  } catch (error) {
    console.error('🔒 Auth check failed:', error);
    // On error, default to anonymous for security
    scope = 'main';
    planId = 'anonymous';
  }
  
  // SECURITY: Log any client attempts to override plan (for monitoring)
  const clientScope = req.query.scope || req.headers['x-usage-scope'];
  const clientPlan = req.query.planId || req.headers['x-plan-id'];
  if (clientScope || clientPlan) {
    console.warn(`🚨 SECURITY: Client attempted plan override - scope: ${clientScope}, planId: ${clientPlan} (IGNORED)`);
  }
  
  // Set secure scope and plan on request object
  req.trackingScope = scope;
  req.planId = planId;
  req.scopeEnforced = true;
  
  next();
}

/**
 * Middleware to ensure scope was properly set
 * Use this as a safety check after scope middleware
 */
export function ensureScopeSet(req: Request, res: Response, next: NextFunction) {
  if (!req.scopeEnforced || !req.trackingScope || !req.planId) {
    console.error('SCOPE ENFORCEMENT FAILED:', {
      path: req.path,
      trackingScope: req.trackingScope,
      planId: req.planId,
      scopeEnforced: req.scopeEnforced
    });
    return res.status(500).json({ error: 'Scope enforcement failed' });
  }
  
  next();
}

/**
 * DEPRECATED: Use requireScopeFromAuth instead
 * This function is vulnerable to header spoofing attacks
 */
export function requireScopeFromReferer(req: Request, res: Response, next: NextFunction) {
  console.error('🚨 SECURITY WARNING: Using deprecated requireScopeFromReferer - vulnerable to header spoofing!');
  console.error('🚨 Please migrate to requireScopeFromAuth for secure authentication-based scope detection');
  
  // For now, fallback to secure method
  return requireScopeFromAuth(req, res, next);
}

/**
 * Extract session ID from request headers with fallback
 */
export function getSessionIdFromRequest(req: Request): string {
  // Prefer client-provided stable session ID
  const clientSessionId = req.headers['x-session-id'] || req.body?.clientSessionId;
  if (clientSessionId && typeof clientSessionId === 'string' && clientSessionId.startsWith('mj_client_')) {
    return clientSessionId;
  }
  
  // Fallback to Express session ID if available
  if (req.session?.id) {
    return req.session.id;
  }
  
  // Final fallback
  return 'fallback_session';
}