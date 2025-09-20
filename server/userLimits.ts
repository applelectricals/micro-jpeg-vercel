// User types and limits (parallel system to page-based tracking)
export const USER_LIMITS = {
  free: {
    monthly: { raw: 100, regular: 500, total: 500 },
    daily: { raw: 10, regular: 25, total: 25 },
    hourly: { raw: 5, regular: 5, total: 5 },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    concurrent: 1
  },
  premium: {
    monthly: { total: 10000 },
    daily: { total: 500 },
    hourly: { total: 100 },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    concurrent: 3
  },
  enterprise: {
    monthly: { total: 50000 },
    daily: { total: 5000 },
    hourly: { total: 1000 },
    maxFileSize: 200 * 1024 * 1024, // 200MB
    concurrent: 5
  }
};

// User type definitions for TypeScript
export type UserType = keyof typeof USER_LIMITS;

export interface UserLimits {
  monthly: { raw?: number; regular?: number; total: number };
  daily: { raw?: number; regular?: number; total: number };
  hourly: { raw?: number; regular?: number; total: number };
  maxFileSize: number;
  concurrent: number;
}

// Helper function to get limits for a user type
export function getUserLimits(userType: UserType): UserLimits {
  return USER_LIMITS[userType];
}

// Helper function to determine user type based on subscription
export function determineUserType(subscription?: { plan?: string }): UserType {
  if (!subscription || !subscription.plan) {
    return 'free';
  }
  
  const plan = subscription.plan.toLowerCase();
  if (plan.includes('premium') || plan.includes('pro')) {
    return 'premium';
  }
  if (plan.includes('enterprise') || plan.includes('business')) {
    return 'enterprise';
  }
  
  return 'free';
}