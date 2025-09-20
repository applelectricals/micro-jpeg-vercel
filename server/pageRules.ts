// ✅ COMPREHENSIVE PAGE-SPECIFIC RULES CONFIGURATION
// This configuration defines all limits and rules for each page identifier
// CRITICAL: Never share counters between pages - each page gets its own usage bucket

export interface PageLimits {
  pageIdentifier: string;
  displayName: string;
  
  // Operation Limits
  monthly: number;
  daily: number;
  hourly: number;
  
  // File Constraints
  maxFileSize: number; // in bytes
  maxConcurrentUploads: number;
  
  // Format Support
  inputFormats: string[];
  outputFormats: string[];
  autoConversionFormat: string;
  
  // Access Control
  requiresAuth: boolean;
  requiresPayment: boolean;
  paymentAmount?: number; // in dollars
  subscriptionDuration?: number; // in days
  
  // Special Rules
  specialRules?: string[];
}

// ✅ COMPLETE PAGE-SPECIFIC RULES IMPLEMENTATION
export const PAGE_RULES: Record<string, PageLimits> = {
  // 1. Free Plan (Without Sign in) - Main Landing Page
  'free-no-auth': {
    pageIdentifier: 'free-no-auth',
    displayName: 'Free Plan (No Sign-in)',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for returning users'
    ]
  },

  // 2. Free Plan (With Sign in) - /compress-free
  'free-auth': {
    pageIdentifier: 'free-auth',
    displayName: 'Free Plan (With Sign-in)',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: false,
    
    specialRules: [
      'Authentication required',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for authenticated user'
    ]
  },

  // 3. Test Premium Plan - $1/month - /test-premium  
  'test-1-dollar': {
    pageIdentifier: 'test-1-dollar',
    displayName: 'Test Premium Plan ($1)',
    
    monthly: 300, // Actually 300 operations for 1 day (24 hours)
    daily: 300,
    hourly: 20,
    
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxConcurrentUploads: 3,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: true,
    paymentAmount: 1,
    subscriptionDuration: 1, // 24 hours
    
    specialRules: [
      'Authentication and PayPal payment confirmation ($1) required',
      'Subscription expires after 24 hours',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for authenticated user'
    ]
  },

  // 4. Premium Plan - $29/month - /compress-premium
  'premium-29': {
    pageIdentifier: 'premium-29',
    displayName: 'Premium Plan ($29)',
    
    monthly: 10000,
    daily: 334, // Roughly 10000/30 days
    hourly: 100,
    
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxConcurrentUploads: 3,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: true,
    paymentAmount: 29,
    subscriptionDuration: 30, // 30 days
    
    specialRules: [
      'Authentication and PayPal payment confirmation ($29) required',
      'Subscription renews monthly',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality', 
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for authenticated user'
    ]
  },

  // 5. Enterprise Plan - $99/month - /compress-enterprise
  'enterprise-99': {
    pageIdentifier: 'enterprise-99',
    displayName: 'Enterprise Plan ($99)',
    
    monthly: 50000,
    daily: 1667, // Roughly 50000/30 days
    hourly: 999999, // No rate limits
    
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxConcurrentUploads: 5,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: true,
    paymentAmount: 99,
    subscriptionDuration: 30, // 30 days
    
    specialRules: [
      'Authentication and PayPal payment confirmation ($99) required',
      'No rate limits (unlimited hourly operations)',
      'Subscription renews monthly',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for authenticated user'
    ]
  },

  // 6. CR2 to JPG (Without Sign In) - /convert/cr2-to-jpg
  'cr2-free': {
    pageIdentifier: 'cr2-free',
    displayName: 'CR2 to JPG Converter (Free)',
    
    monthly: 100,
    daily: 10,
    hourly: 5, // Reasonable hourly limit
    
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['.cr2'], // Only CR2 files
    outputFormats: ['jpeg'], // Only JPG output
    autoConversionFormat: 'jpeg',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'CR2 files only',
      'Auto-converts to JPG on upload',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for returning users'
    ]
  },

  // 7. CR2 to PNG (Without Sign In) - /convert/cr2-to-png
  'cr2-to-png': {
    pageIdentifier: 'cr2-to-png',
    displayName: 'CR2 to PNG Converter (Free)',
    
    monthly: 100,
    daily: 10,
    hourly: 5, // Reasonable hourly limit
    
    maxFileSize: 25 * 1024 * 1024, // 25MB for RAW files
    maxConcurrentUploads: 1,
    
    inputFormats: ['.cr2', '.cr3'], // CR2 and CR3 files
    outputFormats: ['png'], // Only PNG output
    autoConversionFormat: 'png',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'CR2 and CR3 files only',
      'Auto-converts to PNG on upload',
      'No file duplicates in output modal',
      'Files persist in output modal until browser refresh/close',
      'Download All as ZIP functionality',
      'Individual file downloads',
      'Session ID constant during session',
      'Usage stats maintained for returning users'
    ]
  },

  // ✅ NEW SEO-FRIENDLY URL STRUCTURE PAGE RULES
  
  // Main compress landing page - /compress (shows all options)
  '/compress': {
    pageIdentifier: '/compress',
    displayName: 'Main Compress Landing',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'Landing page showing all compression options',
      'Same limits as main landing page'
    ]
  },

  // Free compression - /compress/free
  '/compress/free': {
    pageIdentifier: '/compress/free',
    displayName: 'Free Compression (New URL)',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: false,
    
    specialRules: [
      'Authentication required',
      'SEO-friendly URL structure',
      'Same features as /compress-free'
    ]
  },

  // Pro compression - /compress/pro  
  '/compress/pro': {
    pageIdentifier: '/compress/pro',
    displayName: 'Pro Compression (New URL)',
    
    monthly: 10000,
    daily: 334,
    hourly: 100,
    
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxConcurrentUploads: 3,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: true,
    paymentAmount: 29,
    subscriptionDuration: 30,
    
    specialRules: [
      'Authentication and payment required',
      'SEO-friendly URL structure',
      'Same features as /compress-premium'
    ]
  },

  // Enterprise compression - /compress/enterprise
  '/compress/enterprise': {
    pageIdentifier: '/compress/enterprise',
    displayName: 'Enterprise Compression (New URL)',
    
    monthly: 50000,
    daily: 1667,
    hourly: 999999,
    
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxConcurrentUploads: 5,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif',
                   '.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: true,
    requiresPayment: true,
    paymentAmount: 99,
    subscriptionDuration: 30,
    
    specialRules: [
      'Authentication and payment required',
      'SEO-friendly URL structure', 
      'Same features as /compress-enterprise'
    ]
  },

  // Bulk processing - /compress/bulk
  '/compress/bulk': {
    pageIdentifier: '/compress/bulk',
    displayName: 'Bulk Image Compression (New URL)',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxConcurrentUploads: 1,
    
    inputFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 
                   'image/svg+xml', 'image/tiff', 'image/tif'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'SEO-friendly URL structure',
      'Same features as /bulk-image-compression'
    ]
  },

  // RAW processing - /compress/raw
  '/compress/raw': {
    pageIdentifier: '/compress/raw',
    displayName: 'RAW File Compression (New URL)',
    
    monthly: 500,
    daily: 25,
    hourly: 5,
    
    maxFileSize: 25 * 1024 * 1024, // 25MB (larger for RAW files)
    maxConcurrentUploads: 1,
    
    inputFormats: ['.cr2', '.arw', '.dng', '.nef', '.orf', '.raf', '.rw2'],
    outputFormats: ['jpeg', 'png', 'webp', 'avif'],
    autoConversionFormat: 'jpeg',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'SEO-friendly URL structure',
      'Same features as /compress-raw-files',
      'Optimized for RAW file processing'
    ]
  },

  // CR2 to PNG conversion - /convert/cr2-to-png
  '/convert/cr2-to-png': {
    pageIdentifier: '/convert/cr2-to-png',
    displayName: 'CR2 to PNG Converter',
    
    monthly: 20,
    daily: 10,
    hourly: 5,
    
    maxFileSize: 25 * 1024 * 1024, // 25MB (larger for RAW files)
    maxConcurrentUploads: 1,
    
    inputFormats: ['.cr2', '.cr3'],
    outputFormats: ['png'],
    autoConversionFormat: 'png',
    
    requiresAuth: false,
    requiresPayment: false,
    
    specialRules: [
      'CR2/CR3 to PNG conversion only',
      'Quality and size controls available',
      'Uses dual-counter system for RAW operations'
    ]
  }
};

// ✅ ALLOWED PAGE IDENTIFIERS FOR VALIDATION
export const ALLOWED_PAGE_IDENTIFIERS = Object.keys(PAGE_RULES);

// ✅ UTILITY FUNCTIONS
export function getPageLimits(pageIdentifier: string): PageLimits | null {
  return PAGE_RULES[pageIdentifier] || null;
}

export function isValidPageIdentifier(pageIdentifier: string): boolean {
  return ALLOWED_PAGE_IDENTIFIERS.includes(pageIdentifier);
}

export function validateFileSize(file: { size: number }, pageIdentifier: string): { valid: boolean; error?: string } {
  const limits = getPageLimits(pageIdentifier);
  if (!limits) {
    return { valid: false, error: 'Invalid page identifier' };
  }
  
  if (file.size > limits.maxFileSize) {
    const maxMB = Math.round(limits.maxFileSize / (1024 * 1024));
    return { 
      valid: false, 
      error: `File size exceeds ${maxMB}MB limit for ${limits.displayName}` 
    };
  }
  
  return { valid: true };
}

export function validateFileFormat(filename: string, pageIdentifier: string): { valid: boolean; error?: string } {
  const limits = getPageLimits(pageIdentifier);
  if (!limits) {
    return { valid: false, error: 'Invalid page identifier' };
  }
  
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  const mimeType = filename.toLowerCase().includes('jpeg') || filename.toLowerCase().includes('jpg') ? 'image/jpeg' : 
                   filename.toLowerCase().includes('png') ? 'image/png' :
                   filename.toLowerCase().includes('webp') ? 'image/webp' :
                   filename.toLowerCase().includes('avif') ? 'image/avif' :
                   filename.toLowerCase().includes('svg') ? 'image/svg+xml' :
                   filename.toLowerCase().includes('tiff') || filename.toLowerCase().includes('tif') ? 'image/tiff' :
                   extension;
  
  const isSupported = limits.inputFormats.includes(mimeType) || limits.inputFormats.includes(extension);
  
  if (!isSupported) {
    return { 
      valid: false, 
      error: `File format not supported for ${limits.displayName}. Supported formats: ${limits.inputFormats.join(', ')}` 
    };
  }
  
  return { valid: true };
}

// ✅ USAGE VALIDATION FUNCTIONS
export function validateUsageLimits(
  currentUsage: { daily: number; hourly: number; monthly: number }, 
  pageIdentifier: string
): { canOperate: boolean; error?: string; limit?: string } {
  const limits = getPageLimits(pageIdentifier);
  if (!limits) {
    return { canOperate: false, error: 'Invalid page identifier' };
  }
  
  if (currentUsage.monthly >= limits.monthly) {
    return { canOperate: false, error: 'Monthly limit reached', limit: 'monthly' };
  }
  
  if (currentUsage.daily >= limits.daily) {
    return { canOperate: false, error: 'Daily limit reached', limit: 'daily' };
  }
  
  if (currentUsage.hourly >= limits.hourly) {
    return { canOperate: false, error: 'Hourly limit reached', limit: 'hourly' };
  }
  
  return { canOperate: true };
}