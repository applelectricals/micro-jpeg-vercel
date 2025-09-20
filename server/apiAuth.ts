import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { apiKeys, apiUsage, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { checkOutstandingDebt } from './paymentProtection';

// Extend Express Request to include API key info
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        userId: string;
        name: string;
        permissions: string[];
        rateLimit: number;
      };
    }
  }
}

export class ApiKeyManager {
  /**
   * Generate a new API key with proper formatting
   */
  static generateApiKey(): { fullKey: string; keyHash: string; keyPrefix: string } {
    // Format: sk_test_1234567890abcdef (production would be sk_live_)
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const fullKey = `sk_test_${randomBytes}`;
    const keyHash = bcrypt.hashSync(fullKey, 10);
    const keyPrefix = fullKey.substring(0, 15); // sk_test_1234567
    
    return { fullKey, keyHash, keyPrefix };
  }

  /**
   * Create a new API key for a user
   */
  static async createApiKey(
    userId: string,
    name: string,
    permissions: string[] = ['compress', 'convert'],
    rateLimit: number = 1000,
    expiresAt?: Date
  ) {
    const { fullKey, keyHash, keyPrefix } = this.generateApiKey();

    const [apiKey] = await db.insert(apiKeys).values({
      userId,
      name,
      keyHash,
      keyPrefix,
      permissions: permissions, // Store array directly in JSONB
      rateLimit,
      expiresAt,
    }).returning();

    return {
      apiKey: {
        ...apiKey,
        permissions: apiKey.permissions as string[], // Cast directly as array
      },
      fullKey, // Only return the full key once during creation
    };
  }

  /**
   * Validate an API key and return key info
   */
  static async validateApiKey(providedKey: string) {
    if (!providedKey || !providedKey.startsWith('sk_')) {
      return null;
    }

    // Get all active API keys to check against
    const activeKeys = await db
      .select()
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(
        eq(apiKeys.isActive, true),
        // Check if key hasn't expired
      ));

    // Check each key hash (this is necessary for security)
    for (const { api_keys: key, users: user } of activeKeys) {
      if (bcrypt.compareSync(providedKey, key.keyHash)) {
        // Check if key has expired
        if (key.expiresAt && new Date() > key.expiresAt) {
          return null;
        }

        // Update last used timestamp
        await db
          .update(apiKeys)
          .set({ 
            lastUsedAt: new Date(),
            usageCount: (key.usageCount || 0) + 1
          })
          .where(eq(apiKeys.id, key.id));

        return {
          id: key.id,
          userId: key.userId,
          name: key.name,
          permissions: key.permissions as string[], // JSONB array stored directly
          rateLimit: key.rateLimit || 1000,
          user: {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
            isPremium: user.isPremium,
            purchasedCredits: user.purchasedCredits,
            monthlyOperations: user.monthlyOperations
          }
        };
      }
    }

    return null;
  }

  /**
   * Check rate limit for API key
   */
  static async checkRateLimit(apiKeyId: string, rateLimit: number): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentUsage = await db
      .select()
      .from(apiUsage)
      .where(and(
        eq(apiUsage.apiKeyId, apiKeyId),
        // Use >= for timestamp comparison
      ));

    return recentUsage.length < rateLimit;
  }

  /**
   * Log API usage for analytics and rate limiting
   */
  static async logUsage(
    apiKeyId: string,
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    bytesProcessed?: number,
    bytesReturned?: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    await db.insert(apiUsage).values({
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode,
      responseTime,
      bytesProcessed,
      bytesReturned,
      ipAddress,
      userAgent,
    });
  }
}

/**
 * Express middleware for API authentication
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    const apiKeyFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Also check for API key in query parameter (less secure, for testing)
    const apiKeyFromQuery = req.query.api_key as string;
    
    const providedKey = apiKeyFromHeader || apiKeyFromQuery;

    if (!providedKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide your API key in the Authorization header as "Bearer sk_test_..." or as api_key query parameter'
      });
    }

    // Validate the API key
    const keyInfo = await ApiKeyManager.validateApiKey(providedKey);
    
    if (!keyInfo) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or inactive'
      });
    }

    // Check if user has outstanding debt or suspended account
    const debtStatus = await checkOutstandingDebt(keyInfo.userId);
    
    if (debtStatus.hasDebt && debtStatus.daysPastDue > 7) {
      return res.status(402).json({
        error: 'Payment Required',
        message: `Your API access is suspended due to outstanding payment of $${debtStatus.amount.toFixed(2)}. Please update your payment method to restore service.`,
        paymentRequired: true,
        amountDue: debtStatus.amount,
        daysPastDue: debtStatus.daysPastDue
      });
    }

    // Check rate limit
    const withinRateLimit = await ApiKeyManager.checkRateLimit(keyInfo.id, keyInfo.rateLimit);
    
    if (!withinRateLimit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded your rate limit of ${keyInfo.rateLimit} requests per hour`
      });
    }

    // Attach API key info to request
    req.apiKey = keyInfo;

    // Continue to next middleware
    next();

    // Log successful API usage after response
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      ApiKeyManager.logUsage(
        keyInfo.id,
        keyInfo.userId,
        req.path,
        req.method,
        res.statusCode,
        responseTime,
        req.get('content-length') ? parseInt(req.get('content-length')!) : undefined,
        res.get('content-length') ? parseInt(res.get('content-length')!) : undefined,
        req.ip,
        req.get('user-agent')
      ).catch(console.error);
    });

  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred while authenticating your API key'
    });
  }
};

/**
 * Middleware to check if API key has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires API authentication'
      });
    }

    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Your API key does not have the required permission: ${permission}`
      });
    }

    next();
  };
};