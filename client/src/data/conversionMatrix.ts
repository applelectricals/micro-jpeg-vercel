// Conversion Matrix - Central configuration for all format conversions
// Based on the 80 combinations from the user's list

export interface FormatInfo {
  extensions: string[];
  mimeTypes: string[];
  category: 'raster' | 'raw' | 'vector';
  maxSizeBytes: number;
  supportsQuality?: boolean;
  supportsResize?: boolean;
  displayName: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface ConversionConfig {
  from: string;
  to: string;
  operation: 'convert' | 'compress';
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  features: string[];
  defaultQuality: number;
  defaultSize: number;
  endpoint: string;
  pageIdentifier: string;
}

// Format definitions
export const FORMATS: Record<string, FormatInfo> = {
  // Raster formats
  jpg: {
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg'],
    category: 'raster',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    supportsQuality: true,
    supportsResize: true,
    displayName: 'JPG',
    icon: '/assets/format-icons/jpeg.jpg',
    color: '#10B981',
    bgColor: '#D1FAE5',
    textColor: '#065F46'
  },
  png: {
    extensions: ['png'],
    mimeTypes: ['image/png'],
    category: 'raster',
    maxSizeBytes: 25 * 1024 * 1024,
    supportsQuality: false,
    supportsResize: true,
    displayName: 'PNG',
    icon: '/assets/format-icons/png.jpg',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF'
  },
  webp: {
    extensions: ['webp'],
    mimeTypes: ['image/webp'],
    category: 'raster',
    maxSizeBytes: 25 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'WEBP',
    icon: '/assets/format-icons/webp.jpg',
    color: '#F97316',
    bgColor: '#FED7AA',
    textColor: '#EA580C'
  },
  avif: {
    extensions: ['avif'],
    mimeTypes: ['image/avif'],
    category: 'raster',
    maxSizeBytes: 25 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'AVIF',
    icon: '/assets/format-icons/avif.jpg',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    textColor: '#92400E'
  },
  tiff: {
    extensions: ['tiff', 'tif'],
    mimeTypes: ['image/tiff'],
    category: 'raster',
    maxSizeBytes: 50 * 1024 * 1024, // 50MB for TIFF
    supportsQuality: true, // TIFF does support quality settings
    supportsResize: true,
    displayName: 'TIFF',
    icon: '/assets/format-icons/tiff.jpg',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    textColor: '#5B21B6'
  },
  svg: {
    extensions: ['svg'],
    mimeTypes: ['image/svg+xml'],
    category: 'vector',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB for SVG
    supportsQuality: false,
    supportsResize: true,
    displayName: 'SVG',
    icon: '/assets/format-icons/svg.jpg',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    textColor: '#BE185D'
  },
  // RAW formats
  cr2: {
    extensions: ['cr2', 'cr3'],
    mimeTypes: ['image/x-canon-cr2', 'image/x-canon-cr3'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024, // 100MB for RAW
    supportsQuality: true,
    supportsResize: true,
    displayName: 'CR2',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  arw: {
    extensions: ['arw'],
    mimeTypes: ['image/x-sony-arw'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Sony ARW',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  crw: {
    extensions: ['crw'],
    mimeTypes: ['image/x-canon-crw'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Canon CRW',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  dng: {
    extensions: ['dng'],
    mimeTypes: ['image/x-adobe-dng'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Adobe DNG',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  nef: {
    extensions: ['nef'],
    mimeTypes: ['image/x-nikon-nef'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Nikon NEF',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  orf: {
    extensions: ['orf'],
    mimeTypes: ['image/x-olympus-orf'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Olympus ORF',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  raf: {
    extensions: ['raf'],
    mimeTypes: ['image/x-fuji-raf'],
    category: 'raw',
    maxSizeBytes: 100 * 1024 * 1024,
    supportsQuality: true,
    supportsResize: true,
    displayName: 'Fuji RAF',
    icon: '/assets/format-icons/raw.jpg',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  }
};

// Generate all allowed conversion pairs from the user's list
const generateConversions = (): ConversionConfig[] => {
  const conversions: ConversionConfig[] = [];
  
  // Parse the conversion list from the attached file
  const conversionList = [
    'avif-to-jpg,convert', 'jpg-to-jpg,compress', 'png-to-jpg,convert', 'arw-to-jpg,convert',
    'cr2-to-jpg,convert', 'crw-to-jpg,convert', 'dng-to-jpg,convert', 'nef-to-jpg,convert',
    'orf-to-jpg,convert', 'raf-to-jpg,convert', 'tiff-to-jpg,convert', 'svg-to-jpg,convert',
    'webp-to-jpg,convert', 'avif-to-png,convert', 'jpg-to-png,convert', 'png-to-png,compress',
    'arw-to-png,convert', 'cr2-to-png,convert', 'crw-to-png,convert', 'dng-to-png,convert',
    'nef-to-png,convert', 'orf-to-png,convert', 'raf-to-png,convert', 'tiff-to-png,convert',
    'svg-to-png,convert', 'webp-to-png,convert', 'avif-to-tiff,convert', 'jpg-to-tiff,convert',
    'png-to-tiff,convert', 'arw-to-tiff,convert', 'cr2-to-tiff,convert', 'crw-to-tiff,convert',
    'dng-to-tiff,convert', 'nef-to-tiff,convert', 'orf-to-tiff,convert', 'raf-to-tiff,convert',
    'tiff-to-tiff,compress', 'svg-to-tiff,convert', 'webp-to-tiff,convert', 'avif-to-webp,convert',
    'jpg-to-webp,convert', 'png-to-webp,convert', 'arw-to-webp,convert', 'cr2-to-webp,convert',
    'crw-to-webp,convert', 'dng-to-webp,convert', 'nef-to-webp,convert', 'orf-to-webp,convert',
    'raf-to-webp,convert', 'tiff-to-webp,convert', 'svg-to-webp,convert', 'webp-to-webp,compress',
    'avif-to-avif,compress', 'jpg-to-avif,convert', 'png-to-avif,convert', 'arw-to-avif,convert',
    'cr2-to-avif,convert', 'crw-to-avif,convert', 'dng-to-avif,convert', 'nef-to-avif,convert',
    'orf-to-avif,convert', 'raf-to-avif,convert', 'tiff-to-avif,convert', 'svg-to-avif,convert',
    'webp-to-avif,convert', 'avif-to-svg,convert', 'jpg-to-svg,convert', 'png-to-svg,convert',
    'arw-to-svg,convert', 'cr2-to-svg,convert', 'crw-to-svg,convert', 'dng-to-svg,convert',
    'nef-to-svg,convert', 'orf-to-svg,convert', 'raf-to-svg,convert', 'tiff-to-svg,convert',
    'svg-to-svg,compress', 'webp-to-svg,convert'
  ];

  conversionList.forEach(item => {
    const [pair, operation] = item.split(',');
    const [from, to] = pair.split('-to-');
    
    if (!FORMATS[from] || !FORMATS[to]) return;
    
    const fromFormat = FORMATS[from];
    const toFormat = FORMATS[to];
    const isCompress = operation === 'compress';
    
    // Extract brand and format info for SEO formulas following user's exact specifications
    const formatName = from.toUpperCase();
    const outputName = to.toUpperCase(); // Use format key, not displayName
    const brand = fromFormat.category === 'raw' && from === 'cr2'
      ? 'Canon' // Brand for CR2 RAW files
      : fromFormat.displayName; // Use full display name for non-RAW
    
    const config: ConversionConfig = {
      from,
      to,
      operation: operation as 'convert' | 'compress',
      title: isCompress 
        ? `Compress ${formatName} Online - Free ${brand} Compressor | MicroJPEG`
        : fromFormat.category === 'raw'
          ? `Convert ${formatName} to ${outputName} Online - Free ${brand} RAW Converter | MicroJPEG`
          : `Convert ${formatName} to ${outputName} Online - Free ${brand} Converter | MicroJPEG`,
      description: isCompress
        ? `Compress ${brand} ${formatName} files instantly. Free up to 500 compressions/month. Preserve quality, batch process, API access available.`
        : fromFormat.category === 'raw'
          ? `Convert ${brand} ${formatName} RAW files to ${outputName} instantly. Free up to 500 conversions/month. Preserve quality, batch process, API access available.`
          : `Convert ${brand} ${formatName} files to ${outputName} instantly. Free up to 500 conversions/month. Preserve quality, batch process, API access available.`,
      keywords: isCompress
        ? [`${fromFormat.displayName} compress`, `${fromFormat.displayName} compressor`, 'image compress', `${from} compress`]
        : [`${fromFormat.displayName} to ${toFormat.displayName}`, `${from} to ${to}`, 'image converter', `${from} converter`],
      h1: isCompress
        ? `Compress ${fromFormat.displayName} Online`
        : `Convert ${fromFormat.displayName} to ${toFormat.displayName} Online`,
      features: isCompress
        ? [`${fromFormat.displayName} Compression`, 'Quality Control', 'Instant Processing', 'Size Reduction']
        : [`${fromFormat.displayName} Support`, `High Quality ${toFormat.displayName}`, 'Instant Processing', 'Format Conversion'],
      defaultQuality: toFormat.supportsQuality ? 85 : 100,
      defaultSize: 100,
      endpoint: fromFormat.category === 'raw' ? '/api/convert-special' : '/api/process',
      pageIdentifier: `${from}-to-${to}`
    };
    
    conversions.push(config);
  });

  return conversions;
};

// Export the conversion configurations
export const CONVERSIONS = generateConversions();

// Helper functions
export const getConversionByPair = (from: string, to: string): ConversionConfig | undefined => {
  return CONVERSIONS.find(c => c.from === from && c.to === to);
};

export const isValidConversion = (from: string, to: string): boolean => {
  return !!getConversionByPair(from, to);
};

export const getFormatInfo = (format: string): FormatInfo | undefined => {
  return FORMATS[format];
};

export const validateFile = (file: File, format: string): string | null => {
  const formatInfo = FORMATS[format];
  if (!formatInfo) return 'Unsupported format';
  
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!formatInfo.extensions.includes(extension)) {
    return `${file.name}: Only ${formatInfo.extensions.join(', ')} files are supported`;
  }
  
  if (file.size > formatInfo.maxSizeBytes) {
    const maxMB = Math.round(formatInfo.maxSizeBytes / (1024 * 1024));
    return `${file.name}: File too large. Maximum size is ${maxMB}MB`;
  }
  
  return null;
};