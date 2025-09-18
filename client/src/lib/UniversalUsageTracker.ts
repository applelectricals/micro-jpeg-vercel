import { USER_LIMITS, UserType } from '../../../server/userLimits';

// Universal Usage Tracker - parallel system to page-based tracking
class UniversalUsageTracker {
  static getUserType(): UserType {
    // Check authentication and subscription
    const user = this.getAuthUser(); // Your auth hook
    if (!user) return 'free';
    return user.subscriptionType || 'free';
  }

  static getAuthUser() {
    // TODO: Integrate with your existing auth system
    // For now, return null to default to free user
    return null;
  }

  static async canProcess(fileType: string = 'regular') {
    const userType = this.getUserType();
    const limits = USER_LIMITS[userType];
    
    // For authenticated users, check server
    if (userType !== 'free') {
      try {
        const response = await fetch('/api/usage');
        const usage = await response.json();
        return {
          allowed: usage.remaining > 0,
          remaining: usage.remaining,
          limit: limits.monthly.total
        };
      } catch (error) {
        console.error('Failed to fetch server usage:', error);
        return { allowed: false, remaining: 0, limit: limits.monthly.total };
      }
    }
    
    // For free users, use localStorage
    const usage = this.getLocalUsage();
    const isRaw = ['CR2', 'ARW', 'NEF'].includes(fileType.toUpperCase());
    
    return {
      allowed: isRaw ? 
        usage.rawToday < limits.daily.raw : 
        usage.regularToday < limits.daily.regular,
      remaining: isRaw ? 
        limits.daily.raw - usage.rawToday :
        limits.daily.regular - usage.regularToday
    };
  }

  static recordUsage(fileType: string) {
    const userType = this.getUserType();
    
    if (userType !== 'free') {
      // Server handles it
      return;
    }
    
    // Local tracking for free users
    const usage = this.getLocalUsage();
    const isRaw = ['CR2', 'ARW', 'NEF'].includes(fileType.toUpperCase());
    
    if (isRaw) {
      usage.rawToday++;
      usage.rawMonth++;
    } else {
      usage.regularToday++;
      usage.regularMonth++;
    }
    
    localStorage.setItem('usage', JSON.stringify(usage));
  }

  static getLocalUsage() {
    const today = new Date().toDateString();
    const month = new Date().getMonth();
    
    let usage = JSON.parse(localStorage.getItem('usage') || '{}');
    
    // Reset daily counters if day changed
    if (usage.lastDay !== today) {
      usage.rawToday = 0;
      usage.regularToday = 0;
      usage.lastDay = today;
    }
    
    // Reset monthly counters if month changed
    if (usage.lastMonth !== month) {
      usage.rawMonth = 0;
      usage.regularMonth = 0;
      usage.lastMonth = month;
    }
    
    // Initialize if first time
    if (!usage.rawToday) usage.rawToday = 0;
    if (!usage.regularToday) usage.regularToday = 0;
    if (!usage.rawMonth) usage.rawMonth = 0;
    if (!usage.regularMonth) usage.regularMonth = 0;
    
    return usage;
  }

  static resetUsage() {
    localStorage.removeItem('usage');
  }

  static getUsageStats() {
    const userType = this.getUserType();
    const limits = USER_LIMITS[userType];
    const usage = this.getLocalUsage();
    
    return {
      userType,
      limits,
      usage: {
        raw: {
          today: usage.rawToday,
          month: usage.rawMonth,
          dailyLimit: limits.daily.raw || 0,
          monthlyLimit: limits.monthly.raw || 0
        },
        regular: {
          today: usage.regularToday,
          month: usage.regularMonth,
          dailyLimit: limits.daily.regular || 0,
          monthlyLimit: limits.monthly.regular || 0
        }
      }
    };
  }
}

export default UniversalUsageTracker;