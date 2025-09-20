// SEO optimization utilities

interface MetaTagConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

export function updateMetaTags(config: MetaTagConfig) {
  // Skip if authoritative SEO system is active (ConversionPage, etc.)
  if ((window as any).__seo_authoritative) {
    return;
  }

  // Skip on dynamic conversion/compression routes to avoid conflicts
  if (window.location.pathname.match(/^\/(convert|compress)\//)) {
    return;
  }

  // Update page title
  if (config.title) {
    document.title = config.title;
  }

  // Helper function to update or create meta tag
  const updateMetaTag = (name: string, content: string, property = false) => {
    const attr = property ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.appendChild(tag);
    }
    
    tag.setAttribute('content', content);
  };

  // Update standard meta tags
  if (config.description) {
    updateMetaTag('description', config.description);
  }
  
  if (config.keywords) {
    updateMetaTag('keywords', config.keywords);
  }

  // Update Open Graph tags
  if (config.ogTitle) {
    updateMetaTag('og:title', config.ogTitle, true);
  }
  
  if (config.ogDescription) {
    updateMetaTag('og:description', config.ogDescription, true);
  }
  
  if (config.ogImage) {
    updateMetaTag('og:image', config.ogImage, true);
  }
  
  if (config.ogType) {
    updateMetaTag('og:type', config.ogType, true);
  }

  // Update Twitter Card tags
  if (config.twitterCard) {
    updateMetaTag('twitter:card', config.twitterCard);
  }
  
  if (config.twitterTitle) {
    updateMetaTag('twitter:title', config.twitterTitle);
  }
  
  if (config.twitterDescription) {
    updateMetaTag('twitter:description', config.twitterDescription);
  }
  
  if (config.twitterImage) {
    updateMetaTag('twitter:image', config.twitterImage);
  }

  // Update canonical URL
  if (config.canonical) {
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', config.canonical);
  }
}

// Predefined SEO configurations for different pages
export const SEO_CONFIGS = {
  landing: {
    title: 'MicroJPEG - Fast Image Compression | Reduce JPEG File Size by 90%',
    description: 'Compress JPEG, PNG, WebP & AVIF images up to 90% smaller while maintaining quality. Free online image optimizer with advanced compression algorithms.',
    keywords: 'image compression, JPEG optimizer, reduce file size, image compressor, photo compression, online tool',
    ogTitle: 'MicroJPEG - Smart Image Compression Tool',
    ogDescription: 'Compress images up to 90% smaller while maintaining quality. Free, fast, and secure.',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    canonical: window.location.origin + '/'
  },
  pricing: {
    title: 'MicroJPEG Pricing - Affordable Image Compression Plans',
    description: 'Choose the perfect plan for your image compression needs. Free tier available with premium options for professionals and enterprises.',
    keywords: 'image compression pricing, photo optimizer cost, bulk image compression',
    ogTitle: 'MicroJPEG Pricing Plans',
    ogDescription: 'Affordable image compression plans for every need.',
    canonical: window.location.origin + '/pricing'
  },
  subscribe: {
    title: 'Subscribe to MicroJPEG Premium - Enhanced Image Compression',
    description: 'Upgrade to MicroJPEG Premium for unlimited compressions, larger file sizes, and priority support. Start your subscription today.',
    keywords: 'image compression subscription, premium photo optimizer, bulk image processing',
    ogTitle: 'MicroJPEG Premium Subscription',
    ogDescription: 'Upgrade to premium for unlimited image compression and advanced features.',
    canonical: window.location.origin + '/subscribe'
  }
};

// Apply SEO configuration based on page
export function applySEOConfig(pageKey: keyof typeof SEO_CONFIGS) {
  const config = SEO_CONFIGS[pageKey];
  if (config) {
    updateMetaTags(config);
  }
}