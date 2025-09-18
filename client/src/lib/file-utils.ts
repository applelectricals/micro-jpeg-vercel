import UniversalUsageTracker from './UniversalUsageTracker';

const FREE_USER_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for free users
const PREPAID_USER_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for prepaid users
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

export async function validateFiles(files: File[]): Promise<File[]> {
  const validFiles: File[] = [];
  
  for (const file of files) {
    // Check usage limits using UniversalUsageTracker
    const validation = await UniversalUsageTracker.canProcess(file.type);
    if (!validation.allowed) {
      console.warn(`Limit reached. ${validation.remaining} remaining.`);
      continue;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`File ${file.name} is not a supported image format (JPEG, PNG, WebP, AVIF)`);
      continue;
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      console.warn(`File ${file.name} does not have a valid image extension (.jpg, .jpeg, .png, .webp, .avif)`);
      continue;
    }

    // Check if file is empty
    if (file.size === 0) {
      console.warn(`File ${file.name} is empty`);
      continue;
    }

    validFiles.push(file);
  }

  return validFiles;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

export async function isValidImageFile(file: File): Promise<boolean> {
  // Check usage limits using UniversalUsageTracker
  const validation = await UniversalUsageTracker.canProcess(file.type);
  if (!validation.allowed) {
    return false;
  }

  return ALLOWED_TYPES.includes(file.type) && file.size > 0;
}

// Legacy alias for backwards compatibility
export async function isValidJpegFile(file: File): Promise<boolean> {
  return await isValidImageFile(file);
}

// Backward compatibility with old isPremium parameter
export function validateFilesLegacy(files: File[], isPremium: boolean = false): File[] {
  return validateFiles(files, isPremium ? 'prepaid' : 'free');
}

export function isValidImageFileLegacy(file: File, isPremium: boolean = false): boolean {
  return isValidImageFile(file, isPremium ? 'prepaid' : 'free');
}
