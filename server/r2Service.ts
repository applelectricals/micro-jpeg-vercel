// Cloudflare R2 CDN service for image storage and delivery
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucketName: string;
  region?: string;
}

interface UploadResult {
  key: string;
  url: string;
  cdnUrl: string;
  size: number;
  etag?: string;
}

export class R2Service {
  private s3Client: S3Client;
  private bucketName: string;
  private accountId: string;
  private baseUrl: string;
  private cdnUrl: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.accountId = config.accountId;
    this.baseUrl = `https://${config.accountId}.r2.cloudflarestorage.com`;
    this.cdnUrl = `https://pub-${config.accountId}.r2.dev`; // Public R2 URL
    
    // Initialize S3 client for R2
    this.s3Client = new S3Client({
      region: config.region || 'auto',
      endpoint: this.baseUrl,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // R2 specific configuration
      forcePathStyle: true,
    });

    console.log(`🌐 R2 Service initialized for bucket: ${this.bucketName}`);
  }

  /**
   * Upload file to R2 with optimized key structure
   */
  async uploadFile(
    filePath: string, 
    fileName: string, 
    options: {
      folder?: string;
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'compressed',
        contentType = 'image/jpeg',
        cacheControl = 'public, max-age=31536000', // 1 year cache
        metadata = {}
      } = options;

      // Generate optimized key structure: folder/date/hash_filename
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileHash = crypto.createHash('md5').update(fileName + Date.now()).digest('hex').substring(0, 8);
      const key = `${folder}/${date}/${fileHash}_${fileName}`;

      // Read file and get stats
      const fileContent = await fs.promises.readFile(filePath);
      const stats = await fs.promises.stat(filePath);

      console.log(`📤 Uploading to R2: ${key} (${stats.size} bytes)`);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          size: stats.size.toString()
        }
      });

      const result = await this.s3Client.send(uploadCommand);

      const uploadResult: UploadResult = {
        key,
        url: `${this.baseUrl}/${this.bucketName}/${key}`,
        cdnUrl: `${this.cdnUrl}/${key}`,
        size: stats.size,
        etag: result.ETag?.replace(/"/g, '')
      };

      console.log(`✅ Successfully uploaded to R2: ${uploadResult.cdnUrl}`);
      return uploadResult;

    } catch (error) {
      console.error(`❌ R2 upload failed for ${fileName}:`, error);
      throw new Error(`Failed to upload ${fileName} to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload buffer to R2 (for in-memory files)
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    options: {
      folder?: string;
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'compressed',
        contentType = 'image/jpeg',
        cacheControl = 'public, max-age=31536000',
        metadata = {}
      } = options;

      const date = new Date().toISOString().split('T')[0];
      const fileHash = crypto.createHash('md5').update(fileName + Date.now()).digest('hex').substring(0, 8);
      const key = `${folder}/${date}/${fileHash}_${fileName}`;

      console.log(`📤 Uploading buffer to R2: ${key} (${buffer.length} bytes)`);

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          size: buffer.length.toString()
        }
      });

      const result = await this.s3Client.send(uploadCommand);

      const uploadResult: UploadResult = {
        key,
        url: `${this.baseUrl}/${this.bucketName}/${key}`,
        cdnUrl: `${this.cdnUrl}/${key}`,
        size: buffer.length,
        etag: result.ETag?.replace(/"/g, '')
      };

      console.log(`✅ Successfully uploaded buffer to R2: ${uploadResult.cdnUrl}`);
      return uploadResult;

    } catch (error) {
      console.error(`❌ R2 buffer upload failed for ${fileName}:`, error);
      throw new Error(`Failed to upload ${fileName} buffer to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata from R2
   */
  async getFileInfo(key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      return {
        key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag?.replace(/"/g, ''),
        metadata: result.Metadata
      };
    } catch (error) {
      console.error(`❌ Failed to get file info for ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`🗑️ Deleted from R2: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete ${key} from R2:`, error);
      return false;
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      console.error(`❌ Failed to generate presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get CDN URL for public access
   */
  getCdnUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Health check for R2 service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Try to list objects to verify connection
      const testKey = 'health-check-' + Date.now();
      const testContent = Buffer.from('health check');
      
      // Upload test file
      await this.uploadBuffer(testContent, 'health-check.txt', {
        folder: 'system',
        contentType: 'text/plain',
        metadata: { type: 'health-check' }
      });

      // Delete test file
      await this.deleteFile(`system/${new Date().toISOString().split('T')[0]}/${testKey.substring(0, 8)}_health-check.txt`);

      return {
        status: 'healthy',
        details: {
          bucket: this.bucketName,
          cdnUrl: this.cdnUrl,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ R2 health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          bucket: this.bucketName,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Batch upload multiple files
   */
  async uploadBatch(files: Array<{ path: string; name: string; options?: any }>): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const errors: any[] = [];

    console.log(`📦 Starting batch upload of ${files.length} files to R2`);

    for (const file of files) {
      try {
        const result = await this.uploadFile(file.path, file.name, file.options);
        results.push(result);
      } catch (error) {
        console.error(`❌ Batch upload failed for ${file.name}:`, error);
        errors.push({ file: file.name, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    console.log(`✅ Batch upload completed: ${results.length} successful, ${errors.length} failed`);

    if (errors.length > 0) {
      console.warn('Batch upload errors:', errors);
    }

    return results;
  }
}

// Initialize R2 service with environment variables
const r2Config: R2Config = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  accountId: process.env.R2_ACCOUNT_ID!,
  bucketName: process.env.R2_BUCKET_NAME!,
};

// Validate required environment variables
const requiredEnvVars = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID', 'R2_BUCKET_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required R2 environment variables: ${missingVars.join(', ')}`);
}

// Create singleton R2 service instance
export const r2Service = new R2Service(r2Config);

// Export utilities
export const R2_FOLDERS = {
  COMPRESSED: 'compressed',
  ORIGINALS: 'originals',
  THUMBNAILS: 'thumbnails',
  BULK: 'bulk',
  RAW: 'raw',
  SYSTEM: 'system'
} as const;

export default r2Service;