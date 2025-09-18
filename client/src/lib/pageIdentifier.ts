/**
 * Page identifier utilities for consistent API request tracking
 * Maps current page paths to canonical identifiers used by the backend scope system
 */

// Canonical page identifiers that map to backend scopes
export const CANONICAL_PAGE_IDENTIFIERS = {
  // Core compression pages
  'main': '/',
  'free': '/compress-free', 
  'premium': '/compress-premium',
  'test-premium': '/test-premium',
  'enterprise': '/compress-enterprise',
  'cr2-converter': '/convert/cr2-to-jpg',
  
  // API pages
  'api-demo': '/api-demo',
  'api-docs': '/api-docs',
  'api-dashboard': '/api-dashboard',
  
  // Other pages
  'features': '/features',
  'pricing': '/simple-pricing',
  'web-overview': '/web/overview',
  'web-compress': '/web/compress',
  'web-convert': '/web/convert',
} as const;

/**
 * Get the current page identifier from window.location.pathname
 */
export function getPageIdentifier(): string {
  if (typeof window === 'undefined') {
    return '/'; // Default for SSR or non-browser environments
  }
  
  return window.location.pathname;
}

/**
 * Normalize a pathname to a canonical page identifier
 * Maps various route aliases and variations to standardized identifiers
 */
export function normalizePageIdentifier(pathname: string): string {
  // Remove trailing slash for consistency (except root)
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  
  // Direct matches for canonical paths
  const canonicalValues = Object.values(CANONICAL_PAGE_IDENTIFIERS);
  if (canonicalValues.includes(cleanPath as any)) {
    return cleanPath;
  }
  
  // Map common variations to canonical identifiers
  switch (cleanPath) {
    // Main/home variations
    case '':
    case '/home':
    case '/landing':
      return CANONICAL_PAGE_IDENTIFIERS.main;
      
    // Free tier variations
    case '/free':
    case '/free-compress':
    case '/free-signed-compress':
    case '/compress':
      return CANONICAL_PAGE_IDENTIFIERS.free;
      
    // Premium variations  
    case '/premium':
    case '/pro':
      return CANONICAL_PAGE_IDENTIFIERS.premium;
      
    // Test premium variations
    case '/test-pro':
    case '/trial':
      return CANONICAL_PAGE_IDENTIFIERS['test-premium'];
      
    // Enterprise variations
    case '/business':
    case '/enterprise':
      return CANONICAL_PAGE_IDENTIFIERS.enterprise;
      
    // CR2/RAW conversion variations
    case '/cr2-converter':
    case '/compress-raw-files':
    case '/raw-converter':
    case '/convert-cr2':
      return CANONICAL_PAGE_IDENTIFIERS['cr2-converter'];
      
    // API variations
    case '/api':
      return CANONICAL_PAGE_IDENTIFIERS['api-docs'];
      
    // Pricing variations
    case '/pricing':
    case '/plans':
      return CANONICAL_PAGE_IDENTIFIERS.pricing;
      
    default:
      // For unknown paths, return as-is but ensure it's clean
      return cleanPath || '/';
  }
}

/**
 * Map canonical page identifiers to user-requested custom slugs
 * These exact values are required for proper server-side tracking buckets
 */
function mapToCustomPageSlug(canonicalPath: string): string {
  switch (canonicalPath) {
    case '/':
      return 'free-no-auth'; // home page
    case '/compress-free':
      return 'free-auth'; // free tier with auth
    case '/test-premium':
      return 'test-1-dollar'; // $1 test premium  
    case '/compress-premium':
      return 'premium-29'; // $29 premium plan
    case '/compress-enterprise':
      return 'enterprise-99'; // $99 enterprise plan
    case '/convert/cr2-to-jpg':
      return 'cr2-to-jpg'; // CR2 to JPG converter
    default:
      // For other paths, use normalized canonical path
      return canonicalPath;
  }
}

/**
 * Get the canonical page identifier for the current page
 * Returns user-requested custom slugs for tracking buckets
 */
export function getCurrentPageIdentifier(): string {
  const currentPath = getPageIdentifier();
  const canonicalPath = normalizePageIdentifier(currentPath);
  return mapToCustomPageSlug(canonicalPath);
}

/**
 * Get the scope identifier that maps to backend configuration
 * Maps page identifiers to the scope names used in server middleware
 */
export function getPageScope(pageIdentifier: string): string {
  const normalizedId = normalizePageIdentifier(pageIdentifier);
  
  switch (normalizedId) {
    case CANONICAL_PAGE_IDENTIFIERS.main:
      return 'main';
    case CANONICAL_PAGE_IDENTIFIERS.free:
      return 'free'; // Free tier gets its own scope
    case CANONICAL_PAGE_IDENTIFIERS.premium:
      return 'pro';
    case CANONICAL_PAGE_IDENTIFIERS['test-premium']:
      return 'test_premium'; // Test premium gets its own scope
    case CANONICAL_PAGE_IDENTIFIERS.enterprise:
      return 'enterprise'; // Enterprise gets its own scope
    case CANONICAL_PAGE_IDENTIFIERS['cr2-converter']:
      return 'cr2_converter';
    default:
      return 'main'; // Default scope
  }
}