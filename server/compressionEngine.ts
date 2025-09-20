import sharp, { Sharp } from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dcraw = require('dcraw');

const execAsync = promisify(exec);

export interface CompressionAnalysis {
  originalSize: number;
  estimatedCompressedSize: number;
  recommendedQuality: number;
  compressionEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
  optimizationSuggestions: string[];
  colorSpaceInfo: {
    hasAlpha: boolean;
    colorSpace: string;
    channels: number;
  };
}

export interface AdvancedCompressionOptions {
  targetFileSize?: number; // Target size in bytes
  maxQuality?: number;
  minQuality?: number;
  adaptiveQuality?: boolean;
  webOptimized?: boolean;
  preserveAspectRatio?: boolean;
  compressionAlgorithm?: 'standard' | 'aggressive' | 'lossless' | 'mozjpeg' | 'progressive';
  resizeQuality?: 'lanczos' | 'bicubic' | 'bilinear' | 'nearest';
  progressive?: boolean;
  optimizeScans?: boolean;
  arithmeticCoding?: boolean;
}

export class CompressionEngine {

  /**
   * Process RAW files using dcraw.js - industry standard RAW processor
   */
  static async processRawWithDcraw(
    inputPath: string, 
    outputPath: string, 
    outputFormat: string,
    options: { quality?: number; width?: number; height?: number } = {}
  ): Promise<void> {
    const { quality = 75, width, height } = options;
    
    try {
      console.log(`Processing RAW file with dcraw: ${inputPath} -> ${outputPath}`);
      
      // Read the RAW file
      const rawBuffer = await fs.readFile(inputPath);
      
      // Process with dcraw - extract as TIFF for maximum quality
      let dcrawOptions: any = {
        exportAsTiff: true,
        use16BitLinearMode: false, // Use 8-bit for better compression
        useExportMode: true,
        verbose: false
      };
      
      // For RAW to RAW (same format), use light processing
      if (outputFormat.toLowerCase() === 'dng') {
        dcrawOptions = {
          exportAsTiff: true,
          use16BitLinearMode: true, // Preserve bit depth for RAW
          useExportMode: true,
          noAutoBrightness: true, // Preserve original exposure
          verbose: false
        };
      }
      
      const result = dcraw(rawBuffer, dcrawOptions);
      
      if (!result || result.length === 0) {
        throw new Error('dcraw processing returned empty result');
      }
      
      console.log(`dcraw processed ${rawBuffer.length} bytes -> ${result.length} bytes`);
      
      // Now use Sharp to convert the TIFF to the desired output format
      let sharpInstance = sharp(result);
      
      // Apply resizing if specified
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert to final format with quality settings
      switch (outputFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          await sharpInstance
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toFile(outputPath);
          break;
        case 'png':
          await sharpInstance
            .png({ quality, compressionLevel: 6, progressive: true })
            .toFile(outputPath);
          break;
        case 'webp':
          await sharpInstance
            .webp({ quality, effort: 4 })
            .toFile(outputPath);
          break;
        case 'avif':
          await sharpInstance
            .avif({ quality, effort: 4 })
            .toFile(outputPath);
          break;
        case 'tiff':
          await sharpInstance
            .tiff({ quality, compression: 'lzw' })
            .toFile(outputPath);
          break;
        case 'dng':
          // For DNG output, save the processed TIFF (closest to DNG)
          await sharpInstance
            .tiff({ quality: Math.max(quality, 85), compression: 'lzw' })
            .toFile(outputPath);
          break;
        default:
          // Default to JPEG
          await sharpInstance
            .jpeg({ quality, progressive: true })
            .toFile(outputPath);
      }
      
      console.log(`Successfully processed RAW file to ${outputFormat.toUpperCase()}`);
      
    } catch (error) {
      console.error(`dcraw processing failed:`, error);
      throw new Error(`RAW processing failed: ${error.message}`);
    }
  }

  /**
   * Check if dcraw can handle the RAW format
   */
  static async canDcrawProcess(filePath: string): Promise<boolean> {
    try {
      const rawBuffer = await fs.readFile(filePath);
      
      // Try to get metadata to verify it's a valid RAW file
      const metadata = dcraw(rawBuffer, { verbose: true, identify: true });
      
      return metadata && metadata.length > 0 && !metadata.includes('not a raw file');
    } catch (error) {
      console.error(`dcraw identify failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process RAW files using ImageMagick as a fallback
   */
  static async processRawWithImageMagick(
    inputPath: string, 
    outputPath: string, 
    outputFormat: string,
    options: { quality?: number; width?: number; height?: number; useUncompressed?: boolean } = {}
  ): Promise<void> {
    const { quality = 80, width, height, useUncompressed = false } = options;
    console.log(`ImageMagick processing with quality: ${quality}${useUncompressed ? ' (uncompressed)' : ''}`);
    
    let magickCmd = `magick "${inputPath}"`;
    
    // Add resize if specified
    if (width && height) {
      magickCmd += ` -resize ${width}x${height}`;
    } else if (width) {
      magickCmd += ` -resize ${width}x`;
    } else if (height) {
      magickCmd += ` -resize x${height}`;
    }
    
    // Add format-specific options
    switch (outputFormat.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        magickCmd += ` -quality ${quality} -strip -sampling-factor 4:2:0`;
        break;
      case 'png':
        magickCmd += ` -quality ${quality} -strip -define png:compression-level=6`;
        break;
      case 'webp':
        magickCmd += ` -quality ${quality} -define webp:method=4`;
        break;
      case 'avif':
        magickCmd += ` -quality ${quality}`;
        break;
      case 'tiff':
        if (useUncompressed) {
          magickCmd += ` -compress none`; // Uncompressed for baseline
        } else {
          magickCmd += ` -quality ${quality} -compress jpeg`; // JPEG compression for size reduction
        }
        break;
    }
    
    magickCmd += ` "${outputPath}"`;
    
    console.log(`ImageMagick command: ${magickCmd}`);
    
    try {
      const { stdout, stderr } = await execAsync(magickCmd);
      if (stderr && !stderr.includes('consider using the `magick` tool')) {
        console.warn('ImageMagick stderr:', stderr);
      }
    } catch (error) {
      throw new Error(`ImageMagick processing failed: ${error.message}`);
    }
  }

  /**
   * Check if ImageMagick can handle the file format
   */
  static async canImageMagickProcess(filePath: string): Promise<boolean> {
    try {
      console.log(`Testing ImageMagick identify on: ${filePath}`);
      const { stdout, stderr } = await execAsync(`magick identify "${filePath}"`);
      console.log(`ImageMagick identify stdout: ${stdout}`);
      console.log(`ImageMagick identify stderr: ${stderr}`);
      return stdout.length > 0 && !stdout.includes('no decode delegate');
    } catch (error) {
      console.error(`ImageMagick identify failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Analyze image and provide compression recommendations
   */
  static async analyzeImage(imagePath: string): Promise<CompressionAnalysis> {
    const sharpInstance = sharp(imagePath);
    const metadata = await sharpInstance.metadata();
    const stats = await fs.stat(imagePath);
    
    const originalSize = stats.size;
    const { width = 0, height = 0, channels = 3, space = 'srgb', hasAlpha = false } = metadata;
    
    // Calculate recommended quality based on image characteristics
    let recommendedQuality = 75; // Default
    
    // High resolution images can use lower quality
    const pixelCount = width * height;
    if (pixelCount > 2000000) { // 2MP+
      recommendedQuality = 70;
    } else if (pixelCount > 500000) { // 0.5MP+
      recommendedQuality = 75;
    } else {
      recommendedQuality = 80; // Small images need higher quality
    }
    
    // Adjust based on color complexity
    if (channels >= 3 && !hasAlpha) {
      recommendedQuality += 5; // More complex color needs higher quality
    }
    
    // Estimate compressed size (rough approximation)
    const estimatedCompressedSize = Math.round(originalSize * (recommendedQuality / 100) * 0.3);
    
    // Determine compression efficiency
    const compressionRatio = (originalSize - estimatedCompressedSize) / originalSize;
    let compressionEfficiency: CompressionAnalysis['compressionEfficiency'] = 'good';
    
    if (compressionRatio > 0.7) compressionEfficiency = 'excellent';
    else if (compressionRatio > 0.5) compressionEfficiency = 'good';
    else if (compressionRatio > 0.3) compressionEfficiency = 'fair';
    else compressionEfficiency = 'poor';
    
    // Generate optimization suggestions
    const optimizationSuggestions: string[] = [];
    
    if (width > 2000 || height > 2000) {
      optimizationSuggestions.push('Consider resizing for web use (max 1920px width)');
    }
    
    if (originalSize > 1024 * 1024) { // > 1MB
      optimizationSuggestions.push('Image is large - progressive JPEG recommended');
    }
    
    if (hasAlpha) {
      optimizationSuggestions.push('Consider PNG or WebP for images with transparency');
    }
    
    if (space !== 'srgb') {
      optimizationSuggestions.push('Convert to sRGB color space for web compatibility');
    }
    
    if (recommendedQuality < 70) {
      optimizationSuggestions.push('High resolution detected - can use aggressive compression');
    }
    
    return {
      originalSize,
      estimatedCompressedSize,
      recommendedQuality,
      compressionEfficiency,
      optimizationSuggestions,
      colorSpaceInfo: {
        hasAlpha,
        colorSpace: space || 'unknown',
        channels
      }
    };
  }
  
  /**
   * Advanced compression with target file size
   */
  static async compressToTargetSize(
    inputPath: string,
    outputPath: string,
    targetSize: number,
    options: AdvancedCompressionOptions = {}
  ): Promise<{ finalSize: number; qualityUsed: number; iterations: number }> {
    const { maxQuality = 95, minQuality = 10, webOptimized = true } = options;
    
    let currentQuality = 75;
    let iterations = 0;
    const maxIterations = 4; // Reduced from 8 to 4 for speed
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Create Sharp instance with current quality
      let sharpInstance = sharp(inputPath);
      
      if (webOptimized) {
        sharpInstance = sharpInstance
          .withMetadata({})
          .normalize()
          .rotate();
      }
      
      // Apply JPEG compression with speed optimizations
      sharpInstance = sharpInstance.jpeg({
        quality: currentQuality,
        progressive: false, // Disabled for speed
        mozjpeg: false, // Disabled for speed - was slower
        optimiseScans: false, // Disabled for speed
        overshootDeringing: false, // Disabled for speed
        trellisQuantisation: false // Disabled for speed
      });
      
      // Save to temporary file to check size
      const tempPath = `${outputPath}.temp`;
      await sharpInstance.toFile(tempPath);
      
      const stats = await fs.stat(tempPath);
      const currentSize = stats.size;
      
      console.log(`Iteration ${iterations}: Quality ${currentQuality}% = ${currentSize} bytes (target: ${targetSize})`);
      
      // Check if we're within 10% of target size (relaxed for speed)
      if (Math.abs(currentSize - targetSize) / targetSize < 0.10) {
        // Close enough! Use this version
        await fs.rename(tempPath, outputPath);
        return { finalSize: currentSize, qualityUsed: currentQuality, iterations };
      }
      
      // Adjust quality for next iteration
      if (currentSize > targetSize) {
        // File too large, reduce quality
        const reductionFactor = Math.min(0.9, Math.sqrt(targetSize / currentSize));
        currentQuality = Math.max(minQuality, Math.round(currentQuality * reductionFactor));
      } else {
        // File too small, increase quality (but be conservative)
        const increaseFactor = Math.min(1.1, Math.sqrt(targetSize / currentSize));
        currentQuality = Math.min(maxQuality, Math.round(currentQuality * increaseFactor));
      }
      
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (error) {
        // Ignore cleanup errors
      }
      
      // Prevent infinite loops with minimal improvement (relaxed threshold)
      if (iterations > 1 && Math.abs(currentSize - targetSize) / targetSize < 0.15) {
        await fs.rename(tempPath, outputPath);
        return { finalSize: currentSize, qualityUsed: currentQuality, iterations };
      }
    }
    
    // If we can't hit target exactly, use the last attempt
    const stats = await fs.stat(`${outputPath}.temp`);
    await fs.rename(`${outputPath}.temp`, outputPath);
    
    return { 
      finalSize: stats.size, 
      qualityUsed: currentQuality, 
      iterations 
    };
  }
  
  /**
   * Enhanced compression with advanced settings and timeout
   */
  static async compressWithAdvancedSettings(
    inputPath: string,
    outputPath: string,
    quality: number,
    outputFormat: 'jpeg' | 'webp' | 'avif' | 'png' | 'tiff' | 'dng' | 'cr2' | 'nef' | 'arw' | 'orf' | 'raf' | 'rw2',
    options: AdvancedCompressionOptions = {},
    timeoutMs: number = 120000, // 2 minute default timeout
    originalFilename?: string // Add original filename to detect file type
  ): Promise<{ finalSize: number; qualityUsed: number }> {
    const {
      compressionAlgorithm = 'standard',
      resizeQuality = 'lanczos',
      progressive = false,
      optimizeScans = false,
      arithmeticCoding = false,
      webOptimized = true
    } = options;

    // Check if input file is a RAW format and handle specially
    // Use original filename if provided, otherwise fall back to input path
    const filenameToCheck = originalFilename || inputPath;
    const pathParts = filenameToCheck.toLowerCase().split('.');
    const inputExtension = pathParts.length > 1 ? pathParts[pathParts.length - 1] : '';
    const isRawFormat = ['dng', 'cr2', 'arw', 'nef', 'orf', 'raf', 'rw2'].includes(inputExtension);
    
    console.log(`Compression input: ${inputPath}, Extension: ${inputExtension}, Is RAW: ${isRawFormat}, Output format: ${outputFormat}`);
    
    if (isRawFormat) {
      // For RAW formats, use ImageMagick as primary processor
      console.log(`Processing RAW file ${inputExtension?.toUpperCase()} with ImageMagick...`);
      
      try {
        // Check if ImageMagick can handle this file
        const canProcess = await CompressionEngine.canImageMagickProcess(inputPath);
        if (!canProcess) {
          throw new Error(`❌ RAW format ${inputExtension?.toUpperCase()} processing is currently unavailable. RAW file support requires additional system components that are not installed. Please convert your RAW file to JPEG, PNG, or WEBP format first using your camera's software or photo editing tools, then upload the converted file for compression.`);
        }
        
        // For RAW files, first convert to uncompressed TIFF to get baseline, then compress from there
        console.log(`RAW file detected: ${inputExtension?.toUpperCase()}, performing two-stage compression...`);
        
        // Stage 1: Convert RAW to uncompressed TIFF to establish baseline
        const tempUncompressedPath = `${outputPath}.temp.tiff`;
        await CompressionEngine.processRawWithImageMagick(
          inputPath,
          tempUncompressedPath,
          'tiff',
          { quality: 100, useUncompressed: true } // Uncompressed for baseline
        );
        
        // Stage 2: Compress the uncompressed TIFF with desired quality
        const adjustedQuality = Math.min(95, Math.max(quality || 85, 75)); // Normal compression range
        console.log(`Two-stage compression: RAW -> uncompressed TIFF -> ${outputFormat} at ${adjustedQuality}% quality`);
        
        const resizeOptions: { quality?: number; width?: number; height?: number } = { 
          quality: adjustedQuality
        };
        
        // Process the uncompressed TIFF to final format
        await CompressionEngine.processRawWithImageMagick(
          tempUncompressedPath,
          outputPath,
          outputFormat,
          resizeOptions
        );
        
        // Clean up temp file and get proper compression stats
        const tempStats = await fs.stat(tempUncompressedPath);
        await fs.unlink(tempUncompressedPath);
        
        console.log(`RAW compression baseline: Original ${inputPath} -> Uncompressed: ${tempStats.size} bytes`);
        
        // Get file stats for compression results using temp file as baseline
        const outputStats = await fs.stat(outputPath);
        
        return {
          finalSize: outputStats.size,
          qualityUsed: adjustedQuality,
          baselineSize: tempStats.size // Use uncompressed TIFF size as baseline for ratio calculation
        };
      } catch (error) {
        throw new Error(`Failed to process RAW ${inputExtension?.toUpperCase()} file: ${error.message}`);
      }
    }
    
    // For non-RAW formats, use Sharp
    let sharpInstance: sharp.Sharp;
    
    try {
      sharpInstance = sharp(inputPath);
    } catch (error) {
      throw new Error(`Failed to process ${inputExtension?.toUpperCase()} file: ${error.message}`);
    }

    // Apply resize quality if specified
    const resizeKernel = this.getResizeKernel(resizeQuality);
    if (resizeKernel) {
      sharpInstance = sharpInstance.resize({ kernel: resizeKernel as keyof sharp.KernelEnum });
    }

    // Apply web optimization
    if (webOptimized) {
      sharpInstance = sharpInstance
        .withMetadata({})
        .normalize()
        .rotate();
    }

    // Apply format-specific settings
    switch (outputFormat) {
      case 'jpeg':
        sharpInstance = this.applyJpegSettings(sharpInstance, quality, compressionAlgorithm, progressive, optimizeScans, arithmeticCoding);
        break;
      case 'webp':
        sharpInstance = this.applyWebpSettings(sharpInstance, quality, compressionAlgorithm);
        break;
      case 'avif':
        sharpInstance = this.applyAvifSettings(sharpInstance, quality, compressionAlgorithm);
        break;
      case 'png':
        // Always use optimized PNG settings for fast processing
        sharpInstance = sharpInstance
          .png({
            palette: true,
            colours: 128, // Reduce colors for smaller file size when converting
            compressionLevel: 6, // Balanced compression for speed
            effort: 4 // Low effort for faster processing
          });
        break;
    }

    // Add timeout promise to prevent hanging
    const compressionPromise = sharpInstance.toFile(outputPath);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Compression timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    await Promise.race([compressionPromise, timeoutPromise]);
    const stats = await fs.stat(outputPath);
    
    return { finalSize: stats.size, qualityUsed: quality };
  }

  /**
   * Get Sharp resize kernel based on quality setting
   */
  private static getResizeKernel(resizeQuality: string): keyof sharp.KernelEnum | undefined {
    switch (resizeQuality) {
      case 'lanczos': return 'lanczos3';
      case 'bicubic': return 'cubic';
      case 'bilinear': return 'mitchell';
      case 'nearest': return 'nearest';
      default: return undefined;
    }
  }

  /**
   * Apply JPEG-specific compression settings
   */
  private static applyJpegSettings(
    sharpInstance: Sharp,
    quality: number,
    algorithm: string,
    progressive: boolean,
    optimizeScans: boolean,
    arithmeticCoding: boolean
  ): Sharp {
    const jpegOptions: sharp.JpegOptions = {
      quality,
      progressive,
      optimiseScans: optimizeScans
    };

    switch (algorithm) {
      case 'aggressive':
        return sharpInstance.jpeg({
          ...jpegOptions,
          quality: Math.max(quality - 10, 10), // More aggressive compression
          optimiseScans: true,
          overshootDeringing: false
        });
      case 'lossless':
        return sharpInstance.jpeg({
          ...jpegOptions,
          quality: 100,
          progressive: false
        });
      case 'mozjpeg':
        return sharpInstance.jpeg({
          ...jpegOptions,
          mozjpeg: true,
          optimiseScans: true
        });
      case 'progressive':
        return sharpInstance.jpeg({
          ...jpegOptions,
          progressive: true,
          optimiseScans: true
        });
      default:
        return sharpInstance.jpeg(jpegOptions);
    }
  }

  /**
   * Apply WebP-specific compression settings
   */
  private static applyWebpSettings(sharpInstance: Sharp, quality: number, algorithm: string): Sharp {
    const webpOptions: sharp.WebpOptions = { quality };

    switch (algorithm) {
      case 'aggressive':
        return sharpInstance.webp({
          ...webpOptions,
          quality: Math.max(quality - 5, 10),
          effort: 6, // Higher compression effort
          nearLossless: false
        });
      case 'lossless':
        return sharpInstance.webp({
          lossless: true,
          nearLossless: false
        });
      default:
        return sharpInstance.webp(webpOptions);
    }
  }

  /**
   * Apply AVIF-specific compression settings
   */
  private static applyAvifSettings(sharpInstance: Sharp, quality: number, algorithm: string): Sharp {
    const avifOptions: sharp.AvifOptions = { 
      quality,
      effort: 3 // Fast compression (1=fastest, 9=slowest) - reduced from default
    };

    switch (algorithm) {
      case 'aggressive':
        return sharpInstance.avif({
          ...avifOptions,
          quality: Math.max(quality - 5, 10),
          effort: 2, // Very fast compression for aggressive mode
          lossless: false
        });
      case 'lossless':
        return sharpInstance.avif({
          lossless: true,
          effort: 1 // Fastest possible for lossless
        });
      default:
        return sharpInstance.avif(avifOptions);
    }
  }

  /**
   * Apply PNG-specific compression settings
   */
  private static applyPngSettings(sharpInstance: Sharp, algorithm: string): Sharp {
    // Ultra-fast PNG processing for better performance
    switch (algorithm) {
      case 'aggressive':
        return sharpInstance.png({
          compressionLevel: 6, // Balanced compression for speed
          palette: true,
          colours: 64 // Aggressively reduce colors for smaller files
        });
      case 'lossless':
        return sharpInstance.png({
          compressionLevel: 3, // Very low compression for speed
          palette: false, // No palette for true lossless
        });
      default:
        // Ultra-fast defaults for quick processing
        return sharpInstance.png({
          compressionLevel: 4, // Low compression for speed
          palette: true,
          colours: 128 // Moderate color reduction
        });
    }
  }

  /**
   * Generate multiple responsive image sizes
   */
  static async generateResponsiveSizes(
    inputPath: string,
    outputDir: string,
    baseName: string,
    options: {
      sizes: number[]; // Array of widths
      quality: number;
      format: 'jpeg' | 'webp' | 'avif';
      webOptimized: boolean;
    }
  ): Promise<Array<{ width: number; path: string; size: number }>> {
    const results = [];
    
    for (const width of options.sizes) {
      const outputPath = path.join(outputDir, `${baseName}-${width}w.${options.format === 'jpeg' ? 'jpg' : options.format}`);
      
      let sharpInstance = sharp(inputPath);
      
      if (options.webOptimized) {
        sharpInstance = sharpInstance
          .withMetadata({})
          .normalize()
          .rotate();
      }
      
      // Resize with high-quality resampling
      sharpInstance = sharpInstance.resize(width, null, {
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: true
      });
      
      // Apply format-specific compression
      switch (options.format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: options.quality,
            effort: 6,
            smartSubsample: true
          });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: options.quality,
            effort: 3 // Fast compression for responsive images
          });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({
            quality: options.quality,
            progressive: true,
            mozjpeg: true,
            optimiseScans: true
          });
      }
      
      await sharpInstance.toFile(outputPath);
      
      const stats = await fs.stat(outputPath);
      results.push({
        width,
        path: outputPath,
        size: stats.size
      });
    }
    
    return results;
  }
  
  /**
   * Optimize color space for web
   */
  static async optimizeColorSpace(sharpInstance: Sharp, webOptimized: boolean): Promise<Sharp> {
    if (!webOptimized) return sharpInstance;
    
    return sharpInstance
      .toColorspace('srgb') // Ensure sRGB for web compatibility
      .removeAlpha() // Remove alpha channel if not needed
      .normalize(); // Normalize histogram for better compression
  }
  
  /**
   * Calculate optimal progressive scan script
   */
  static getProgressiveScanScript(quality: number, imageSize: { width: number; height: number }): string {
    const { width, height } = imageSize;
    const pixelCount = width * height;
    
    // For large images or lower quality, use more progressive scans
    if (pixelCount > 1000000 || quality < 70) {
      return 'progressive-optimized';
    } else if (pixelCount > 500000) {
      return 'progressive-standard';
    } else {
      return 'baseline';
    }
  }
}

export default CompressionEngine;