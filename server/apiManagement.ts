import { Router } from 'express';
import { isAuthenticated } from './auth';
import { ApiKeyManager } from './apiAuth';
import { createApiKeySchema } from '@shared/schema';
import { z } from 'zod';
import { db } from './db';
import { apiKeys } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/keys - List user's API keys
 */
router.get('/keys', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const userApiKeys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        usageCount: apiKeys.usageCount,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    const formattedKeys = userApiKeys.map(key => ({
      ...key,
      permissions: key.permissions as string[], // JSONB array stored directly
    }));

    res.json({
      success: true,
      apiKeys: formattedKeys
    });

  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      error: 'Failed to fetch API keys',
      message: error.message
    });
  }
});

/**
 * POST /api/keys - Create a new API key
 */
router.post('/keys', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const parseResult = createApiKeySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'API key creation data validation failed',
        details: parseResult.error.issues
      });
    }

    const { name, permissions, rateLimit, expiresAt } = parseResult.data;

    // Check if user already has too many API keys (limit to 5 per user)
    const existingKeys = await db
      .select({ count: apiKeys.id })
      .from(apiKeys)
      .where(and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.isActive, true)
      ));

    if (existingKeys.length >= 5) {
      return res.status(400).json({
        error: 'API key limit reached',
        message: 'You can have a maximum of 5 active API keys'
      });
    }

    // Create the API key
    const result = await ApiKeyManager.createApiKey(
      userId,
      name,
      permissions,
      rateLimit,
      expiresAt
    );

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        keyPrefix: result.apiKey.keyPrefix,
        permissions: result.apiKey.permissions,
        rateLimit: result.apiKey.rateLimit,
        expiresAt: result.apiKey.expiresAt,
        createdAt: result.apiKey.createdAt,
      },
      fullKey: result.fullKey // Only shown once!
    });

  } catch (error: any) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      message: error.message
    });
  }
});

/**
 * PUT /api/keys/:keyId - Update API key settings
 */
router.put('/keys/:keyId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;

    // Validate input
    const updateSchema = z.object({
      name: z.string().min(1).max(50).optional(),
      permissions: z.array(z.enum(["compress", "convert", "batch", "webhook"])).optional(),
      rateLimit: z.number().min(100).max(10000).optional(),
      isActive: z.boolean().optional(),
    });

    const parseResult = updateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Update data validation failed',
        details: parseResult.error.issues
      });
    }

    const updates = parseResult.data;
    
    // Store permissions directly as JSONB array
    const updateData: any = { ...updates };
    // No JSON.stringify needed for JSONB

    // Update the API key (only if it belongs to the user)
    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId)
      ))
      .returning();

    if (!updatedKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The specified API key does not exist or does not belong to you'
      });
    }

    res.json({
      success: true,
      message: 'API key updated successfully',
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        keyPrefix: updatedKey.keyPrefix,
        permissions: updatedKey.permissions as string[], // JSONB array
        rateLimit: updatedKey.rateLimit,
        expiresAt: updatedKey.expiresAt,
        isActive: updatedKey.isActive,
        updatedAt: updatedKey.updatedAt,
      }
    });

  } catch (error: any) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      error: 'Failed to update API key',
      message: error.message
    });
  }
});

/**
 * DELETE /api/keys/:keyId - Delete (deactivate) an API key
 */
router.delete('/keys/:keyId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;

    // Deactivate the API key (don't actually delete for audit purposes)
    const [deactivatedKey] = await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId)
      ))
      .returning();

    if (!deactivatedKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The specified API key does not exist or does not belong to you'
      });
    }

    res.json({
      success: true,
      message: 'API key deactivated successfully'
    });

  } catch (error: any) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({
      error: 'Failed to deactivate API key',
      message: error.message
    });
  }
});

/**
 * GET /api/keys/:keyId/usage - Get usage statistics for an API key
 */
router.get('/keys/:keyId/usage', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;

    // Verify the API key belongs to the user
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId)
      ));

    if (!apiKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'The specified API key does not exist or does not belong to you'
      });
    }

    // For now, return basic usage info
    // In a full implementation, you'd query the apiUsage table for detailed stats
    res.json({
      success: true,
      usage: {
        totalRequests: apiKey.usageCount || 0,
        rateLimit: apiKey.rateLimit || 1000,
        lastUsedAt: apiKey.lastUsedAt,
        currentPeriodStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
        currentPeriodEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString(),   // Next hour
        // These would be calculated from apiUsage table in real implementation
        currentPeriodRequests: 0,
        remainingRequests: apiKey.rateLimit || 1000,
      }
    });

  } catch (error: any) {
    console.error('Error fetching API key usage:', error);
    res.status(500).json({
      error: 'Failed to fetch API key usage',
      message: error.message
    });
  }
});

export { router as apiManagementRouter };