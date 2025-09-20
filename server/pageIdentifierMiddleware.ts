import { Request, Response, NextFunction } from 'express';

// Map custom slugs to NEW canonical paths for internal logic
const CUSTOM_SLUG_TO_CANONICAL: Record<string, string> = {
  'free-no-auth': '/',
  'free-auth': '/compress/free',
  'test-1-dollar': '/test-premium',
  'premium-29': '/compress/pro',
  'enterprise-99': '/compress/enterprise'
  // Removed cr2-free and cr2-to-png mappings to prevent SEO conflicts
};

// Canonical page identifiers that are allowed
const ALLOWED_PAGE_IDENTIFIERS = [
  // Core compression pages - NEW SEO-friendly structure
  '/',
  '/compress',
  '/compress/free',
  '/compress/pro', 
  '/compress/enterprise',
  '/compress/bulk',
  '/compress/raw',
  
  // Legacy URLs - kept for backwards compatibility
  '/compress-free',
  '/compress-premium',
  '/test-premium',
  '/compress-enterprise',
  '/bulk-image-compression',
  '/compress-raw-files',
  '/convert/cr2-to-jpg',
  '/convert/cr2-to-png',
  
  // WordPress plugin pages - NEW consolidated structure
  '/wordpress-plugin',
  '/wordpress-plugin/install',
  '/wordpress-plugin/docs',
  '/wordpress-plugin/api',
  '/wordpress-plugin/download',
  
  // WordPress plugin pages - LEGACY for backwards compatibility
  '/wordpress/details',
  '/wordpress/installation',
  '/wordpress-installation',
  '/wordpress/development',
  '/wordpress-development',
  '/wordpress-image-plugin',
  
  // Tools pages - NEW professional hierarchy
  '/tools',
  '/tools/compress',
  '/tools/convert',
  '/tools/batch',
  '/tools/optimizer',
  
  // Web tools pages - LEGACY for backwards compatibility
  '/web/overview',
  '/web/compress',
  '/web/convert',
  
  // Legal pages - NEW professional hierarchy
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
  '/legal/cancellation',
  '/legal/payment-protection',
  
  // Legal pages - LEGACY for backwards compatibility
  '/terms-of-service',
  '/privacy-policy',
  '/cookie-policy',
  '/cancellation-policy',
  '/payment-protection',
  
  // API pages
  '/api-demo',
  '/api-docs',
  '/api-dashboard',
  
  // Other common pages
  '/features',
  '/simple-pricing',
  '/web/overview',
  '/web/compress',
  '/web/convert',
  
  // Common variations that should be normalized
  '/free',
  '/premium',
  '/enterprise',
  '/cr2-converter',
  '/pricing',
] as const;

/**
 * Normalize a page identifier to a canonical form
 * This matches the frontend normalization logic
 */
function normalizePageIdentifier(pageId: string): string {
  // Remove trailing slash for consistency (except root)
  const cleanPath = pageId === '/' ? '/' : pageId.replace(/\/$/, '');
  
  // Direct matches
  if (ALLOWED_PAGE_IDENTIFIERS.includes(cleanPath as any)) {
    return cleanPath;
  }
  
  // Normalize common variations and handle new SEO structure
  switch (cleanPath) {
    // Main/home variations - main landing page
    case '':
    case '/home':
    case '/landing':
      return '/';
      
    // Main compress page (shows all options)
    case '/compress':
      return '/compress';
      
    // Free tier variations - NEW: /compress/free is primary
    case '/compress/free':
      return '/compress/free';
    case '/free':
    case '/free-compress':
    case '/free-signed-compress':
    case '/compress-free': // Legacy URL - redirect to new structure internally
      return '/compress/free';
      
    // Premium variations - NEW: /compress/pro is primary  
    case '/compress/pro':
      return '/compress/pro';
    case '/premium':
    case '/pro':
    case '/compress-premium': // Legacy URL - redirect to new structure internally
      return '/compress/pro';
      
    // Test premium variations
    case '/test-pro':
    case '/trial':
    case '/test-premium': // Legacy URL
      return '/test-premium';
      
    // Enterprise variations - NEW: /compress/enterprise is primary
    case '/compress/enterprise':
      return '/compress/enterprise';
    case '/business':
    case '/enterprise':  
    case '/compress-enterprise': // Legacy URL - redirect to new structure internally
      return '/compress/enterprise';
      
    // Bulk processing - NEW: /compress/bulk is primary
    case '/compress/bulk':
      return '/compress/bulk';
    case '/bulk-image-compression': // Legacy URL
      return '/compress/bulk';
      
    // RAW processing - NEW: /compress/raw is primary
    case '/compress/raw':
      return '/compress/raw';
    case '/compress-raw-files': // Legacy URL
    case '/raw-converter':
      return '/compress/raw';
      
    // CR2/RAW conversion variations
    case '/cr2-converter':
    case '/convert-cr2':
      return '/convert/cr2-to-jpg';
    case '/cr2-to-png':
    case '/convert-cr2-to-png':
      return '/convert/cr2-to-png';
      
    // API variations
    case '/api':
      return '/api-docs';
      
    // Pricing variations
    case '/pricing':
    case '/plans':
      return '/simple-pricing';
      
    // WordPress plugin variations - NEW: /wordpress-plugin/* is primary structure
    case '/wordpress/details':
      return '/wordpress-plugin';
    case '/wordpress/installation':
    case '/wordpress-installation':
      return '/wordpress-plugin/install';
    case '/wordpress/development':
    case '/wordpress-development':
      return '/wordpress-plugin/api';
    case '/wordpress-image-plugin':
      return '/wordpress-plugin/docs';
      
    // Web tools variations - NEW: /tools/* is primary structure
    case '/web/overview':
      return '/tools';
    case '/web/compress':
      return '/tools/compress';
    case '/web/convert':
      return '/tools/convert';
      
    // Legal page variations - NEW: /legal/* is primary structure
    case '/terms-of-service':
      return '/legal/terms';
    case '/privacy-policy':
      return '/legal/privacy';
    case '/cookie-policy':
      return '/legal/cookies';
    case '/cancellation-policy':
      return '/legal/cancellation';
    case '/payment-protection':
      return '/legal/payment-protection';
      
    default:
      // For unknown paths, return as-is but ensure it's clean
      return cleanPath || '/';
  }
}

/**
 * Map page identifier to scope name used by the backend scope system
 */
function getPageScope(pageId: string): string {
  const normalized = normalizePageIdentifier(pageId);
  
  switch (normalized) {
    case '/':
      return 'main';
    case '/compress':
      return 'main'; // Main compress landing page uses main scope
    case '/compress/free':
      return 'free'; // Free tier gets its own scope  
    case '/compress/pro':
      return 'pro';
    case '/test-premium':
      return 'test_premium'; // Test premium gets its own scope
    case '/compress/enterprise':
      return 'enterprise'; // Enterprise gets its own scope
    case '/compress/bulk':
      return 'main'; // Bulk processing uses main scope for now
    case '/compress/raw':
      return 'main'; // RAW processing uses main scope for now
    // ALL conversion pages use main scope for unified dynamic system
    // WordPress plugin pages - all use main scope
    case '/wordpress-plugin':
    case '/wordpress-plugin/install':
    case '/wordpress-plugin/docs':
    case '/wordpress-plugin/api':
    case '/wordpress-plugin/download':
      return 'main';
    // Legacy URL support (in case normalization doesn't catch everything)
    case '/compress-free':
      return 'free';
    case '/compress-premium':
      return 'pro';
    case '/compress-enterprise':
      return 'enterprise';
    case '/wordpress/details':
    case '/wordpress/installation':
    case '/wordpress-installation':
    case '/wordpress/development':
    case '/wordpress-development':
    case '/wordpress-image-plugin':
      return 'main';
    // Tools pages - all use main scope
    case '/tools':
    case '/tools/compress':
    case '/tools/convert':
    case '/tools/batch':
    case '/tools/optimizer':
      return 'main';
    // Web tools pages - LEGACY (all use main scope)
    case '/web/overview':
    case '/web/compress':
    case '/web/convert':
      return 'main';
    // Legal pages - all use main scope
    case '/legal/terms':
    case '/legal/privacy':
    case '/legal/cookies':
    case '/legal/cancellation':
    case '/legal/payment-protection':
      return 'main';
    // Legacy legal pages - all use main scope  
    case '/terms-of-service':
    case '/privacy-policy':
    case '/cookie-policy':
    case '/cancellation-policy':
    case '/payment-protection':
      return 'main';
    default:
      return 'main'; // Default scope
  }
}

/**
 * Sanitize and validate page identifier input
 */
function sanitizePageIdentifier(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // Length limit to prevent abuse
  if (input.length > 128) {
    return null;
  }
  
  // Basic character validation - allow alphanumeric, slashes, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9/_.-]+$/.test(input)) {
    return null;
  }
  
  return input;
}

/**
 * Page identifier middleware
 * Extracts pageIdentifier from headers or body, validates it, and attaches to request context
 */
export function pageIdentifierMiddleware(req: Request, res: Response, next: NextFunction) {
  // Initialize request context if not exists
  if (!req.context) {
    (req as any).context = {};
  }
  
  let pageIdentifier: string | null = null;
  
  // Try to get pageIdentifier from header first (preferred)
  const headerPageId = req.headers['x-page-identifier'];
  if (headerPageId && typeof headerPageId === 'string') {
    pageIdentifier = sanitizePageIdentifier(headerPageId);
  }
  
  // If not in headers, try to get from body (for multipart requests)
  if (!pageIdentifier && req.body && req.body.pageIdentifier) {
    pageIdentifier = sanitizePageIdentifier(req.body.pageIdentifier);
  }
  
  // If still no pageIdentifier, try to infer from referer as fallback
  if (!pageIdentifier) {
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        pageIdentifier = sanitizePageIdentifier(refererUrl.pathname);
      } catch (error) {
        // Invalid referer URL, ignore
      }
    }
  }
  
  // Implement dual-representation: preserve custom slugs and map to canonical paths
  const rawSlug = pageIdentifier; // Original slug from client
  
  // Map custom slug to canonical path, or normalize if not a custom slug
  let canonicalPath: string;
  if (rawSlug && CUSTOM_SLUG_TO_CANONICAL[rawSlug]) {
    // Custom slug found - map to canonical path
    canonicalPath = CUSTOM_SLUG_TO_CANONICAL[rawSlug];
  } else {
    // Not a custom slug - normalize as usual  
    canonicalPath = rawSlug ? normalizePageIdentifier(rawSlug) : '/';
  }
  
  const pageScope = getPageScope(canonicalPath);
  
  // Attach dual-representation to request context
  (req as any).context.pageIdentifierSlug = rawSlug; // Custom slug from client (null if none)
  (req as any).context.pageIdentifierCanonical = canonicalPath; // Always canonical path
  (req as any).context.pageIdentifier = rawSlug || canonicalPath; // Prefer slug, fallback to canonical
  (req as any).context.pageScope = pageScope;
  
  // Debug logging with both slug and canonical
  console.log(`🔧 Page Identifier Middleware:`, {
    original: rawSlug,
    slug: rawSlug,
    canonical: canonicalPath,
    final: rawSlug || canonicalPath,
    scope: pageScope,
    source: headerPageId ? 'header' : req.body?.pageIdentifier ? 'body' : 'referer'
  });
  
  next();
}

export { normalizePageIdentifier, getPageScope };