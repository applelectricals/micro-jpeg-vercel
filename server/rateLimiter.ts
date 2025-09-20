import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { API_PRICING_TIERS, getApiPricingTier } from './apiPricing';

interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  totalRequests: number;
}

// In-memory rate limit tracking (for production, use Redis)
const rateLimitStore = new Map<string, {
  requests: number;
  resetTime: Date;
}>();

export interface RateLimitedRequest extends Request {
  apiKey?: {
    id: string;
    userId: string;
    name: string;
    permissions: string[];
    rateLimit: number;
  };
  user?: {
    subscriptionPlan?: string;
  };
}

/**
 * Rate limiting middleware for API endpoints
 */
export function rateLimitMiddleware(req: RateLimitedRequest, res: Response, next: NextFunction) {
  const apiKey = req.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'API key is required for rate limiting'
    });
  }

  const now = new Date();
  const keyId = apiKey.id;
  const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  
  // Get or create rate limit entry
  let rateLimitEntry = rateLimitStore.get(keyId);
  
  // Reset if it's a new hour
  if (!rateLimitEntry || rateLimitEntry.resetTime <= now) {
    rateLimitEntry = {
      requests: 0,
      resetTime: new Date(currentHour.getTime() + 60 * 60 * 1000) // Next hour
    };
    rateLimitStore.set(keyId, rateLimitEntry);
  }
  
  // Check rate limit
  const rateLimit = apiKey.rateLimit || 1000;
  
  if (rateLimitEntry.requests >= rateLimit) {
    const resetIn = Math.ceil((rateLimitEntry.resetTime.getTime() - now.getTime()) / 1000);
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You have exceeded your rate limit of ${rateLimit} requests per hour`,
      rateLimit: {
        limit: rateLimit,
        remaining: 0,
        resetTime: rateLimitEntry.resetTime.toISOString(),
        resetIn: resetIn
      }
    });
  }
  
  // Increment request count
  rateLimitEntry.requests++;
  rateLimitStore.set(keyId, rateLimitEntry);
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': rateLimit.toString(),
    'X-RateLimit-Remaining': (rateLimit - rateLimitEntry.requests).toString(),
    'X-RateLimit-Reset': rateLimitEntry.resetTime.toISOString()
  });
  
  next();
}

/**
 * Get current rate limit status for an API key
 */
export function getRateLimitStatus(apiKeyId: string, rateLimit: number): RateLimitInfo {
  const now = new Date();
  const rateLimitEntry = rateLimitStore.get(apiKeyId);
  
  if (!rateLimitEntry || rateLimitEntry.resetTime <= now) {
    return {
      remaining: rateLimit,
      resetTime: new Date(now.getTime() + 60 * 60 * 1000),
      totalRequests: 0
    };
  }
  
  return {
    remaining: Math.max(0, rateLimit - rateLimitEntry.requests),
    resetTime: rateLimitEntry.resetTime,
    totalRequests: rateLimitEntry.requests
  };
}

/**
 * Clear rate limit data (for testing or admin purposes)
 */
export function clearRateLimit(apiKeyId: string): void {
  rateLimitStore.delete(apiKeyId);
}

/**
 * Get all rate limit data (for monitoring)
 */
export function getAllRateLimits(): Map<string, { requests: number; resetTime: Date }> {
  return new Map(rateLimitStore);
}