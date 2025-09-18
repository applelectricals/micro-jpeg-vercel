// SessionStorage-based usage tracking for free tier users
// Automatically resets daily at midnight - no database needed!

export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  compressions: number;
  conversions: number;
  lastReset: number; // timestamp
  hourlyData: HourlyUsage[]; // Array of hourly usage data
}

export interface HourlyUsage {
  hour: string; // YYYY-MM-DD-HH format
  operations: number; // Total operations this hour
}

const STORAGE_KEY = 'micro-jpeg-daily-usage';

// Get current hour in YYYY-MM-DD-HH format
function getCurrentHour(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Check if we need to reset (new day)
function shouldReset(usage: DailyUsage): boolean {
  const today = getTodayDate();
  return usage.date !== today;
}

// Get current usage stats from sessionStorage
export function getDailyUsage(): DailyUsage {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createFreshUsage();
    }

    const usage = JSON.parse(stored) as DailyUsage;
    
    // Migration: Add hourlyData field if it doesn't exist (for existing users)
    if (!usage.hourlyData) {
      usage.hourlyData = [];
    }
    
    // Reset if it's a new day
    if (shouldReset(usage)) {
      return createFreshUsage();
    }

    return usage;
  } catch (error) {
    console.warn('Failed to read usage from sessionStorage:', error);
    return createFreshUsage();
  }
}

// Create fresh usage stats for today
function createFreshUsage(): DailyUsage {
  const usage: DailyUsage = {
    date: getTodayDate(),
    compressions: 0,
    conversions: 0,
    lastReset: Date.now(),
    hourlyData: [],
  };
  
  saveUsage(usage);
  return usage;
}

// Save usage to sessionStorage
function saveUsage(usage: DailyUsage): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.warn('Failed to save usage to sessionStorage:', error);
  }
}

// Get current hour usage
function getCurrentHourUsage(usage: DailyUsage): number {
  const currentHour = getCurrentHour();
  // Ensure hourlyData exists (migration safety)
  if (!usage.hourlyData) {
    usage.hourlyData = [];
  }
  const hourlyEntry = usage.hourlyData.find(h => h.hour === currentHour);
  return hourlyEntry ? hourlyEntry.operations : 0;
}

// Record operation in current hour
function recordHourlyOperation(usage: DailyUsage, count: number = 1): void {
  const currentHour = getCurrentHour();
  
  // Ensure hourlyData exists (migration safety)
  if (!usage.hourlyData) {
    usage.hourlyData = [];
  }
  
  const existingEntry = usage.hourlyData.find(h => h.hour === currentHour);
  
  if (existingEntry) {
    existingEntry.operations += count;
  } else {
    usage.hourlyData.push({ hour: currentHour, operations: count });
  }
  
  // Clean up old hourly data (keep only last 24 hours)
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);
  const cutoffHour = `${cutoffTime.getFullYear()}-${String(cutoffTime.getMonth() + 1).padStart(2, '0')}-${String(cutoffTime.getDate()).padStart(2, '0')}-${String(cutoffTime.getHours()).padStart(2, '0')}`;
  
  usage.hourlyData = usage.hourlyData.filter(h => h.hour >= cutoffHour);
}

// Check hourly limit
export function canOperateHourly(requestCount: number = 1, hourlyLimit: number = 5): { allowed: boolean; remaining: number; message?: string } {
  const usage = getDailyUsage();
  const HOURLY_LIMIT = hourlyLimit; // Use provided hourly limit
  
  const currentHourUsage = getCurrentHourUsage(usage);
  const remaining = Math.max(0, HOURLY_LIMIT - currentHourUsage);
  
  if (currentHourUsage + requestCount > HOURLY_LIMIT) {
    return {
      allowed: false,
      remaining,
      message: `Hourly limit of ${HOURLY_LIMIT} operations reached. Try again next hour${hourlyLimit <= 5 ? ' or upgrade for unlimited access!' : '!'}`
    };
  }

  return { allowed: true, remaining: remaining - requestCount };
}

// Check if user can perform compression
export function canCompress(requestCount: number = 1): { allowed: boolean; remaining: number; message?: string } {
  const usage = getDailyUsage();
  const FREE_DAILY_LIMIT = 25; // Max 25 operations/day
  
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usage.compressions);
  
  if (usage.compressions + requestCount > FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      remaining,
      message: `Daily limit of ${FREE_DAILY_LIMIT} operations reached. Resets at midnight or upgrade for more!`
    };
  }

  return { allowed: true, remaining: remaining - requestCount };
}

// Check if user can perform format conversion
export function canConvert(requestCount: number = 1): { allowed: boolean; remaining: number; message?: string } {
  const usage = getDailyUsage();
  const FREE_CONVERSION_LIMIT = 3; // Max 3 conversions per day
  
  const remaining = Math.max(0, FREE_CONVERSION_LIMIT - usage.conversions);
  
  if (usage.conversions + requestCount > FREE_CONVERSION_LIMIT) {
    return {
      allowed: false,
      remaining,
      message: `Daily limit of ${FREE_CONVERSION_LIMIT} format conversions reached. Resets at midnight or upgrade for unlimited conversions!`
    };
  }

  return { allowed: true, remaining: remaining - requestCount };
}

// Record compression usage
export function recordCompression(count: number = 1): DailyUsage {
  const usage = getDailyUsage();
  usage.compressions += count;
  recordHourlyOperation(usage, count); // Also record hourly
  saveUsage(usage);
  return usage;
}

// Record conversion usage
export function recordConversion(count: number = 1): DailyUsage {
  const usage = getDailyUsage();
  usage.conversions += count;
  recordHourlyOperation(usage, count); // Also record hourly
  saveUsage(usage);
  return usage;
}

// Get usage stats for display
export function getUsageStats(): {
  compressions: { used: number; limit: number; remaining: number };
  conversions: { used: number; limit: number; remaining: number };
  hourly: { used: number; limit: number; remaining: number };
  resetsAt: string;
} {
  const usage = getDailyUsage();
  const FREE_DAILY_LIMIT = 25;
  const FREE_CONVERSION_LIMIT = 3;
  const HOURLY_LIMIT = 5;
  
  const currentHourUsage = getCurrentHourUsage(usage);
  
  // Calculate next midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    compressions: {
      used: usage.compressions,
      limit: FREE_DAILY_LIMIT,
      remaining: Math.max(0, FREE_DAILY_LIMIT - usage.compressions),
    },
    conversions: {
      used: usage.conversions,
      limit: FREE_CONVERSION_LIMIT,
      remaining: Math.max(0, FREE_CONVERSION_LIMIT - usage.conversions),
    },
    hourly: {
      used: currentHourUsage,
      limit: HOURLY_LIMIT,
      remaining: Math.max(0, HOURLY_LIMIT - currentHourUsage),
    },
    resetsAt: tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Manual reset (for testing)
export function resetUsage(): DailyUsage {
  return createFreshUsage();
}

// Check if it's a conversion request (format change)
export function isConversionRequest(originalFormat: string, outputFormat: string): boolean {
  if (!outputFormat || outputFormat === 'keep-original') {
    return false;
  }
  
  const normalizeFormat = (format: string) => format.toLowerCase().replace('jpg', 'jpeg');
  
  return normalizeFormat(originalFormat) !== normalizeFormat(outputFormat);
}