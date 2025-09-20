export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishDate: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "How to Compress JPG Images Without Losing Quality: Complete Guide 2025",
    slug: "compress-jpg-images-without-losing-quality",
    excerpt: "Learn professional techniques to compress JPG images while maintaining visual quality. Discover the best tools, settings, and methods used by web developers and photographers.",
    publishDate: "2025-01-07",
    author: "MicroJPEG Team",
    category: "Tutorials",
    tags: ["JPG compression", "image optimization", "web development", "photography"],
    readTime: 8,
    seoTitle: "How to Compress JPG Images Without Losing Quality - 2025 Guide",
    seoDescription: "Complete guide to compressing JPG images without quality loss. Learn professional techniques, tools, and settings for optimal image compression results.",
    keywords: "compress JPG without losing quality, JPEG compression guide, optimize JPG images, reduce JPG file size, image compression tutorial",
    content: "# How to Compress JPG Images Without Losing Quality\n\nJPEG compression is a delicate balance between file size and image quality. This guide covers professional techniques for optimal compression.\n\n## Understanding JPEG Compression\n\nJPEG uses lossy compression, which means some image data is permanently removed to reduce file size. However, with the right techniques, you can achieve significant size reductions while maintaining visually acceptable quality.\n\n## Key Factors\n\n- Compression Quality Setting: The most important factor\n- Image Content: Photos with gradients compress better\n- Color Space: RGB vs CMYK affects compression\n- Image Dimensions: Larger images offer more flexibility\n\n## Best Practices\n\n1. Choose the right quality setting (80-90% for web)\n2. Resize to target dimensions first\n3. Use progressive JPEG for web\n4. Consider WebP for modern browsers\n\nReady to start compressing? Try our free online JPEG compressor with advanced quality optimization algorithms."
  },
  {
    id: "2", 
    title: "RAW to JPG Conversion: Professional Photographer's Complete Guide",
    slug: "raw-to-jpg-conversion-guide",
    excerpt: "Master RAW to JPG conversion with this comprehensive guide. Learn about color profiles, compression settings, and batch processing techniques for professional photography workflows.",
    publishDate: "2025-01-06",
    author: "Sarah Chen",
    category: "Photography",
    tags: ["RAW conversion", "professional photography", "image processing", "workflow"],
    readTime: 12,
    seoTitle: "RAW to JPG Conversion Guide - Professional Photography Tips",
    seoDescription: "Complete guide to converting RAW files to JPG for professional photographers. Learn best practices, color management, and batch processing techniques.",
    keywords: "RAW to JPG conversion, convert RAW files, RAW file processing, professional photography workflow, camera RAW conversion",
    content: "# RAW to JPG Conversion: Professional Guide\n\nConverting RAW files to JPG is a critical skill for modern photographers. This guide covers everything from basic conversion principles to advanced workflows.\n\n## Understanding RAW vs JPG\n\nRAW files contain unprocessed sensor data directly from your camera. JPGs are compressed, processed images ready for sharing.\n\n## Supported RAW Formats\n\n- Canon: CR2, CR3\n- Nikon: NEF\n- Sony: ARW\n- Adobe: DNG\n- Olympus: ORF\n- Fujifilm: RAF\n\n## Professional Workflow\n\n1. Choose RAW processing software\n2. Apply basic adjustments\n3. Set color management\n4. Configure JPG compression settings\n5. Batch process for efficiency\n\n## Quality Guidelines\n\n- Maximum Quality (90-100%): Client deliverables\n- High Quality (80-89%): Professional prints\n- Medium Quality (70-79%): Web galleries\n- Lower Quality (60-69%): Email attachments\n\nReady to streamline your RAW conversion workflow? Try our professional RAW processing service."
  },
  {
    id: "3",
    title: "WordPress Image Optimization: Speed Up Your Site in 2025",
    slug: "wordpress-image-optimization-guide",
    excerpt: "Complete guide to optimizing images for WordPress. Learn about plugins, CDNs, modern formats, and best practices to improve your site's loading speed and SEO.",
    publishDate: "2025-01-05",
    author: "Mike Rodriguez",
    category: "WordPress",
    tags: ["WordPress", "SEO", "page speed", "image optimization"],
    readTime: 10,
    seoTitle: "WordPress Image Optimization Guide - Improve Site Speed 2025",
    seoDescription: "Comprehensive WordPress image optimization guide. Learn to use plugins, CDNs, and modern formats to boost site speed and SEO rankings in 2025.",
    keywords: "WordPress image optimization, WordPress speed optimization, optimize WordPress images, WordPress image compression, improve WordPress performance",
    content: "# WordPress Image Optimization: Speed Up Your Site\n\nImages often account for 60-80% of a webpage's total size. Optimizing them properly can dramatically improve your WordPress site's performance and SEO.\n\n## Why It Matters\n\n- Page Load Speed: Compressed images load faster\n- SEO Benefits: Page speed is a ranking factor\n- User Experience: Faster sites have lower bounce rates\n- Mobile Performance: Critical for mobile users\n\n## WordPress Image Handling\n\nWordPress automatically creates multiple image sizes:\n- Thumbnail: 150x150px\n- Medium: 300x300px\n- Large: 1024x1024px\n- Full Size: Original uploaded image\n\n## Optimization Strategies\n\n1. Choose the right format (JPEG, PNG, WebP)\n2. Resize before upload\n3. Use compression plugins\n4. Implement lazy loading\n5. Consider CDN integration\n\n## Recommended Plugins\n\n- Smush: User-friendly, good compression\n- ShortPixel: Excellent algorithms\n- Optimole: Real-time optimization\n- EWWW: Local optimization\n\n## Best Practices\n\n- JPEG Quality: 80-85%\n- Enable WebP conversion\n- Use lazy loading\n- Optimize existing images\n\nReady to optimize your WordPress images? Try our WordPress plugin for automatic compression."
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getBlogPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter(post => post.tags.includes(tag));
}