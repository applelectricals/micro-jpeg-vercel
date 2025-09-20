// Unified Plan Configuration - Single Operation Counter System
// Replaces complex credit and tier systems with simple operation-based plans

export interface UnifiedPlanLimits {
  // Monthly limits
  monthlyOperations: number;
  
  // File size limits
  maxFileSize: number; // in bytes
  
  // Rate limits (abuse prevention)
  maxOperationsPerDay: number | null; // null = no limit
  maxOperationsPerHour: number | null; // null = no limit
  
  // Processing limits
  maxConcurrentUploads: number;
  processingTimeout: number; // in seconds
  
  // Format access
  allowedFormats: string[] | '*'; // '*' means all formats
  
  // Overage pricing
  overageRate: number; // in cents per operation
}

export interface UnifiedPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number; // in cents
  limits: UnifiedPlanLimits;
  features: string[];
  requiresSignup: boolean;
  stripePriceId?: string;
}

// Unified plan configurations matching the specification exactly
export const UNIFIED_PLANS: Record<string, UnifiedPlan> = {
  // Free Plan (Without Sign in) - Root page
  anonymous: {
    id: 'anonymous',
    name: 'anonymous',
    displayName: 'Free (No Signup)',
    description: '500 operations/month - no signup required!',
    monthlyPrice: 0,
    limits: {
      monthlyOperations: 500,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxOperationsPerDay: 25,
      maxOperationsPerHour: 5,
      maxConcurrentUploads: 1,
      processingTimeout: 30,
      allowedFormats: '*', // All image formats supported
      overageRate: 0,
    },
    features: [
      '500 operations/month',
      'All image formats supported',
      'Max 10MB file size',
      'Max 25 operations/day',
      'Max 5 operations/hour',
      '1 concurrent upload'
    ],
    requiresSignup: false,
  },

  // Free Plan (With Sign in) - /compress-free
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free (With Signup)',
    description: '500 operations/month with account benefits',
    monthlyPrice: 0,
    limits: {
      monthlyOperations: 500,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxOperationsPerDay: 25,
      maxOperationsPerHour: 5,
      maxConcurrentUploads: 1,
      processingTimeout: 30,
      allowedFormats: '*', // All image formats supported
      overageRate: 0,
    },
    features: [
      '500 operations/month',
      'All image formats supported',
      'Max 10MB file size',
      'Max 25 operations/day',
      'Max 5 operations/hour',
      '1 concurrent upload'
    ],
    requiresSignup: true,
  },

  // Test Premium Plan - $1/month - /test-premium
  test_premium: {
    id: 'test_premium',
    name: 'test_premium',
    displayName: 'Test Premium ($1/month)',
    description: '300 operations for 1 day',
    monthlyPrice: 100, // $1.00
    limits: {
      monthlyOperations: 300, // 300 operations for 1 day
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxOperationsPerDay: 300, // all 300 can be used in 1 day
      maxOperationsPerHour: 20,
      maxConcurrentUploads: 3,
      processingTimeout: 60,
      allowedFormats: '*', // All image formats supported
      overageRate: 0,
    },
    features: [
      '300 operations for 1 day',
      'All image formats supported',
      'Max 50MB file size',
      'Max 20 operations/hour',
      '3 concurrent uploads'
    ],
    requiresSignup: true,
    stripePriceId: 'price_test_premium',
  },

  // Premium Plan - $29/month - /compress-premium
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Premium ($29/month)',
    description: '10,000 operations/month with premium features',
    monthlyPrice: 2900, // $29.00
    limits: {
      monthlyOperations: 10000,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxOperationsPerDay: null, // no daily limit
      maxOperationsPerHour: 100,
      maxConcurrentUploads: 3,
      processingTimeout: 60,
      allowedFormats: '*', // All image formats supported
      overageRate: 0,
    },
    features: [
      '10,000 operations/month',
      'All image formats supported',
      'Max 50MB file size',
      'Max 100 operations/hour',
      '3 concurrent uploads'
    ],
    requiresSignup: true,
    stripePriceId: 'price_premium_monthly',
  },

  // Enterprise Plan - $99/month - /compress-enterprise
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise ($99/month)',
    description: '50,000 operations/month with SLA guarantee',
    monthlyPrice: 9900, // $99.00
    limits: {
      monthlyOperations: 50000,
      maxFileSize: 200 * 1024 * 1024, // 200MB
      maxOperationsPerDay: null, // no daily limit
      maxOperationsPerHour: null, // No rate limits
      maxConcurrentUploads: 5,
      processingTimeout: 120,
      allowedFormats: '*', // All image formats supported
      overageRate: 0,
    },
    features: [
      '50,000 operations/month',
      'All image formats supported',
      'Max 200MB file size',
      'No rate limits',
      '5 concurrent uploads'
    ],
    requiresSignup: true,
    stripePriceId: 'price_enterprise_monthly',
  },

  // CR2 to JPG (Without Sign In) - /convert/cr2-to-jpg
  'cr2-free': {
    id: 'cr2-free',
    name: 'cr2-free',
    displayName: 'CR2 to JPG (No Signup)',
    description: '100 operations/month - CR2 to JPG only',
    monthlyPrice: 0,
    limits: {
      monthlyOperations: 100,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      maxOperationsPerDay: 10,
      maxOperationsPerHour: null, // no hourly limit for CR2
      maxConcurrentUploads: 1,
      processingTimeout: 60,
      allowedFormats: ['cr2'], // Only CR2 to JPG
      overageRate: 0,
    },
    features: [
      '100 operations/month',
      'Only CR2 to JPG',
      'Max 25MB file size',
      'Max 10 operations/day',
      '1 concurrent upload'
    ],
    requiresSignup: false,
  },
};

// Helper functions for plan management
export function getUnifiedPlan(planId: string): UnifiedPlan {
  return UNIFIED_PLANS[planId] || UNIFIED_PLANS.anonymous;
}

export function getUserPlan(user: any): UnifiedPlan {
  if (!user) return UNIFIED_PLANS.anonymous;
  
  // Check user's subscription plan
  if (user.subscriptionPlan && UNIFIED_PLANS[user.subscriptionPlan]) {
    return UNIFIED_PLANS[user.subscriptionPlan];
  }
  
  // Default to free registered plan for logged-in users
  return UNIFIED_PLANS.free;
}

export function checkFormatAccess(planId: string, format: string): { allowed: boolean; message?: string } {
  const plan = getUnifiedPlan(planId);
  const premiumFormats = ['arw', 'cr2', 'dng', 'nef', 'orf', 'raf', 'rw2', 'srf', 'svg', 'tiff', 'tif'];
  
  // If plan allows all formats, grant access
  if (plan.limits.allowedFormats === '*') {
    return { allowed: true };
  }
  
  // Check if format is in allowed list
  const formatLower = format.toLowerCase();
  const allowedFormats = plan.limits.allowedFormats as string[];
  
  if (allowedFormats.includes(formatLower)) {
    return { allowed: true };
  }
  
  // Check if it's a premium format that requires upgrade
  if (premiumFormats.includes(formatLower)) {
    return {
      allowed: false,
      message: `${format.toUpperCase()} format requires Pro plan or higher`
    };
  }
  
  return {
    allowed: false,
    message: `Unsupported format: ${format.toUpperCase()}`
  };
}

export function checkFileSize(planId: string, fileSize: number): { allowed: boolean; limit: number; message?: string } {
  const plan = getUnifiedPlan(planId);
  const maxFileSize = plan.limits.maxFileSize;
  
  if (fileSize > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
    return {
      allowed: false,
      limit: maxFileSize,
      message: `File size exceeds ${maxSizeMB}MB limit for ${plan.displayName} plan`
    };
  }
  
  return { allowed: true, limit: maxFileSize };
}

export function checkOperationLimits(
  planId: string, 
  monthlyUsed: number, 
  dailyUsed: number, 
  hourlyUsed: number,
  requestedOperations: number = 1
): {
  allowed: boolean;
  limitType?: 'monthly' | 'daily' | 'hourly';
  remaining: number;
  message?: string;
} {
  const plan = getUnifiedPlan(planId);
  
  // Check monthly limit
  if (monthlyUsed + requestedOperations > plan.limits.monthlyOperations) {
    return {
      allowed: false,
      limitType: 'monthly',
      remaining: Math.max(0, plan.limits.monthlyOperations - monthlyUsed),
      message: `Monthly limit of ${plan.limits.monthlyOperations} operations reached`
    };
  }
  
  // Check daily limit (if set)
  if (plan.limits.maxOperationsPerDay !== null) {
    if (dailyUsed + requestedOperations > plan.limits.maxOperationsPerDay) {
      return {
        allowed: false,
        limitType: 'daily',
        remaining: Math.max(0, plan.limits.maxOperationsPerDay - dailyUsed),
        message: `Daily limit of ${plan.limits.maxOperationsPerDay} operations reached`
      };
    }
  }
  
  // Check hourly limit (if set)
  if (plan.limits.maxOperationsPerHour !== null) {
    if (hourlyUsed + requestedOperations > plan.limits.maxOperationsPerHour) {
      return {
        allowed: false,
        limitType: 'hourly',
        remaining: Math.max(0, plan.limits.maxOperationsPerHour - hourlyUsed),
        message: `Hourly limit of ${plan.limits.maxOperationsPerHour} operations reached`
      };
    }
  }
  
  return {
    allowed: true,
    remaining: plan.limits.monthlyOperations - monthlyUsed
  };
}

export default UNIFIED_PLANS;