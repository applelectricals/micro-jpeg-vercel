import { Request, Response, NextFunction } from "express";
import { getUserApiTier, validateApiAccess, trackApiUsage } from "./apiSubscriptions";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend Request type to include tier info
declare global {
  namespace Express {
    interface Request {
      apiTier?: {
        id: string;
        name: string;
        displayName: string;
        pricePerCompression: number;
        rateLimit: number;
        monthlyLimit: number;
        permissions: string[];
        features: string[];
        requiresPayment: boolean;
      };
      tierValidation?: {
        allowed: boolean;
        reason?: string;
        upgradeRequired?: string;
      };
    }
  }
}

/**
 * Middleware to validate and attach API tier information
 */
export const validateApiTier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key required for tier validation'
      });
    }

    // Get user information including subscription plan
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.apiKey.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'API key associated with invalid user'
      });
    }

    // Get user's API tier configuration
    const tierConfig = getUserApiTier(user.subscriptionPlan);

    if (!tierConfig) {
      return res.status(403).json({
        error: 'No API subscription',
        message: 'Please subscribe to an API plan to use this endpoint',
        upgradeRequired: 'starter'
      });
    }

    // TODO: Get actual monthly usage from usage tracking system
    const monthlyUsage = 0; // Placeholder - implement usage counting
    const currentRatePerMinute = 0; // Placeholder - implement rate tracking

    // Validate access based on tier limits
    const validation = validateApiAccess(tierConfig, monthlyUsage, currentRatePerMinute);

    if (!validation.allowed) {
      return res.status(429).json({
        error: 'Tier limit exceeded',
        message: validation.reason,
        upgradeRequired: validation.upgradeRequired,
        currentTier: tierConfig.displayName
      });
    }

    // Attach tier info to request
    req.apiTier = tierConfig;
    req.tierValidation = validation;

    next();

  } catch (error) {
    console.error('API tier validation error:', error);
    return res.status(500).json({
      error: 'Tier validation failed',
      message: 'An error occurred while validating your API subscription'
    });
  }
};

/**
 * Middleware to check if user has specific tier feature
 */
export const requireTierFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiTier) {
      return res.status(403).json({
        error: 'Tier validation required',
        message: 'API tier validation must run before feature check'
      });
    }

    const hasFeature = req.apiTier.permissions.includes(feature);

    if (!hasFeature) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `Your ${req.apiTier.displayName} plan does not include ${feature} functionality`,
        upgradeRequired: getUpgradeRecommendation(req.apiTier.id, feature)
      });
    }

    next();
  };
};

/**
 * Middleware to track API usage and bill accordingly
 */
export const trackUsageMiddleware = (compressionCount: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Only track usage on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (req.apiKey && req.apiTier) {
          // Track usage asynchronously (don't wait for it)
          trackApiUsage(
            req.apiKey.userId,
            req.apiKey.id,
            req.path,
            compressionCount
          ).catch(error => {
            console.error('Background usage tracking failed:', error);
          });
        }
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Get upgrade recommendation based on current tier and required feature
 */
function getUpgradeRecommendation(currentTier: string, requiredFeature: string): string {
  const featureTierMap: Record<string, string> = {
    'batch': 'professional',
    'priority': 'professional',
    'dedicated': 'enterprise',
    'custom': 'enterprise'
  };

  const recommendedTier = featureTierMap[requiredFeature];
  
  if (!recommendedTier) {
    return currentTier === 'starter' ? 'professional' : 'enterprise';
  }

  return recommendedTier;
}

/**
 * Middleware to add tier information to response headers
 */
export const addTierHeaders = (req: Request, res: Response, next: NextFunction) => {
  if (req.apiTier) {
    res.set({
      'X-API-Tier': req.apiTier.name,
      'X-API-Tier-Display': req.apiTier.displayName,
      'X-API-Rate-Limit': req.apiTier.rateLimit.toString(),
      'X-API-Monthly-Limit': req.apiTier.monthlyLimit.toString()
    });
  }

  next();
};