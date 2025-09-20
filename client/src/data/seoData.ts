/**
 * SEO Data Configuration
 * Based on MicroJPEG SEO Keywords Strategy
 */

export const PRIMARY_KEYWORDS = {
  homepage: [
    'image compression',
    'image converter', 
    'compress images online',
    'image optimization',
    'RAW converter',
    'image optimization API'
  ],
  compression: [
    'compress images online',
    'image compression',
    'reduce image size',
    'photo compression',
    'lossless image compression',
    'bulk image compression'
  ],
  conversion: [
    'image converter',
    'JPG to PNG converter',
    'PNG to WEBP converter',
    'AVIF converter',
    'SVG to PNG converter',
    'RAW image converter'
  ],
  api: [
    'image processing API',
    'image compression API',
    'bulk image API',
    'developers image API',
    'automated image optimization'
  ]
};

export const LONG_TAIL_KEYWORDS = {
  specific: [
    'compress images for website free',
    'convert RAW files to JPG online',
    'reduce image size for email',
    'optimize images for WordPress',
    'compress photos for social media',
    'convert camera RAW files online',
    'bulk convert images to WEBP',
    'reduce PNG file size online'
  ],
  comparison: [
    'best image compression tool',
    'TinyPNG alternative',
    'free image converter online',
    'image compression API vs TinyPNG',
    'compress images better than Photoshop'
  ]
};

export const TECHNICAL_KEYWORDS = {
  formats: [
    'DNG converter online',
    'ARW to JPG converter', 
    'Canon RAW converter',
    'Nikon NEF converter',
    'Sony ARW converter',
    'ORF file converter',
    'RAF image converter'
  ],
  api: [
    'image compression API',
    'image processing REST API',
    'bulk image API',
    'WordPress image optimization plugin',
    'image converter API documentation',
    'programmatic image compression'
  ]
};

export const SEO_CONTENT = {
  homepage: {
    title: 'Image Compression & Converter Online - Compress Images Free | MicroJPEG',
    description: 'Compress images online for free with MicroJPEG. Convert RAW files, optimize photos for web, reduce file size without quality loss. Supports 13+ formats including JPG, PNG, WEBP, AVIF.',
    keywords: PRIMARY_KEYWORDS.homepage.join(', '),
    h1: 'Professional Image Compression & Conversion Online',
    h2: 'Compress Images Without Quality Loss - Support for 13+ Formats'
  },
  compression: {
    title: 'Free Image Compression Tool - Reduce Photo File Size Online | MicroJPEG',
    description: 'Compress JPG, PNG, WEBP images online for free. Reduce image file size up to 90% without quality loss. Bulk compression available. Perfect for websites and social media.',
    keywords: PRIMARY_KEYWORDS.compression.join(', ')
  },
  conversion: {
    title: 'Image Converter Online - Convert RAW, JPG, PNG, WEBP Free | MicroJPEG', 
    description: 'Convert images between 13+ formats online. RAW to JPG, PNG to WEBP, AVIF converter. Professional camera file support: CR2, NEF, ARW, DNG. Free and fast conversion.',
    keywords: PRIMARY_KEYWORDS.conversion.join(', ')
  },
  api: {
    title: 'Image Processing API - Bulk Compression & Conversion | MicroJPEG',
    description: 'Powerful image processing API for developers. Bulk compression, format conversion, automated optimization. WordPress plugin available. Free tier with 1000 operations/month.',
    keywords: PRIMARY_KEYWORDS.api.join(', ')
  }
};

export const STRUCTURED_DATA = {
  homepage: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MicroJPEG",
    "description": "Professional image compression and conversion tool supporting 13+ formats",
    "url": "https://microjpeg.com",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web Browser",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free image compression up to 10MB"
      },
      {
        "@type": "Offer", 
        "name": "Pro Plan",
        "price": "9.99",
        "priceCurrency": "USD",
        "description": "Unlimited compression, advanced features"
      }
    ],
    "featureList": [
      "Image compression",
      "Format conversion", 
      "RAW file support",
      "Bulk processing",
      "API access",
      "WordPress plugin"
    ]
  },
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MicroJPEG",
    "url": "https://microjpeg.com",
    "logo": "https://microjpeg.com/logo.png",
    "description": "Leading image compression and conversion service for photographers, developers, and businesses.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@microjpeg.com"
    }
  }
};

export const BLOG_KEYWORDS = {
  tutorials: [
    'how to compress images for web',
    'guide to image optimization',
    'RAW file conversion tutorial',
    'WordPress image optimization guide',
    'API integration tutorial'
  ],
  comparisons: [
    'JPEG vs PNG vs WEBP comparison',
    'lossless vs lossy compression',
    'best image formats 2025',
    'image compression tools comparison',
    'TinyPNG vs alternatives'
  ]
};