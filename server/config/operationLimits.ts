// server/config/operationLimits.ts

export const OPERATION_CONFIG = {
  // File format classifications
  formats: {
    regular: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'],
    raw: ['cr2', 'cr3', 'arw', 'nef', 'nrw', 'dng', 'orf', 'raf', 'rw2', 'pef', 'srw'],
    video: ['mp4', 'avi', 'mov', 'wmv'], // Future expansion
  },
  
  // Size limits by type
  maxFileSize: {
    regular: {
      anonymous: 10 * 1024 * 1024,     // 10MB
      free: 10 * 1024 * 1024,          // 10MB
      premium: 50 * 1024 * 1024,       // 50MB
      enterprise: 200 * 1024 * 1024,   // 200MB
    },
    raw: {
      anonymous: 25 * 1024 * 1024,     // 25MB
      free: 50 * 1024 * 1024,          // 50MB
      premium: 100 * 1024 * 1024,     // 100MB
      enterprise: 500 * 1024 * 1024,   // 500MB
    }
  },
  
  // Operation limits by user type
  limits: {
    anonymous: {
      regular: { monthly: 500, daily: 25, hourly: 5 },
      raw: { monthly: 20, daily: 10, hourly: 5 },
      totalBandwidthMB: 1000, // 1GB monthly
    },
    free: {
      regular: { monthly: 500, daily: 50, hourly: 10 },
      raw: { monthly: 100, daily: 25, hourly: 10 },
      totalBandwidthMB: 2000, // 2GB monthly
    },
    premium: {
      regular: { monthly: 10000, daily: 1000, hourly: 100 },
      raw: { monthly: 500, daily: 50, hourly: 10 },
      totalBandwidthMB: 50000, // 50GB monthly
    },
    enterprise: {
      regular: { monthly: 50000, daily: 5000, hourly: 500 },
      raw: { monthly: 5000, daily: 500, hourly: 50 },
      totalBandwidthMB: 500000, // 500GB monthly
    }
  },
  
  // Special page overrides (optional)
  pageOverrides: {
    '/convert/cr2-to-jpg': {
      anonymous: { monthly: 10, daily: 3 },
      free: { monthly: 20, daily: 5 }
    }
  }
};

// Helper function to determine file type
export function getFileType(filename: string): 'regular' | 'raw' | 'unknown' {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (OPERATION_CONFIG.formats.regular.includes(extension)) {
    return 'regular';
  }
  if (OPERATION_CONFIG.formats.raw.includes(extension)) {
    return 'raw';
  }
  return 'unknown';
}