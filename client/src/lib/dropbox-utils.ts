// Dropbox API utilities

// Extend the global Window interface to include Dropbox
declare global {
  interface Window {
    Dropbox: {
      save: (options: DropboxSaveOptions) => void;
    };
  }
}

// TypeScript interfaces for Dropbox API
interface DropboxFile {
  url: string;      // Must be a publicly accessible URL
  filename: string;
}

interface DropboxSaveOptions {
  files: DropboxFile[];
  success?: () => void;
  error?: (errorMessage: string) => void;
}

/**
 * Save files to Dropbox using the Dropbox Saver API
 * @param url - Publicly accessible URL of the file to save
 * @param filename - Name of the file to save in Dropbox
 */
export function saveToDropbox(url: string, filename: string): void {
  // Check if Dropbox API is available
  if (!window.Dropbox || !window.Dropbox.save) {
    console.error('Dropbox API not available. Make sure the Dropbox script is loaded.');
    return;
  }

  const options: DropboxSaveOptions = {
    files: [
      {
        url: url,        // Must be a publicly accessible URL
        filename: filename
      }
    ],
    success: function() {
      console.log("Success! File saved to Dropbox");
    },
    error: function(errorMessage: string) {
      console.error("Error: " + errorMessage);
    }
  };
  
  window.Dropbox.save(options);
}

/**
 * Save multiple files to Dropbox
 * @param files - Array of files with their URLs and filenames
 * @param onSuccess - Optional success callback
 * @param onError - Optional error callback
 */
export function saveMultipleToDropbox(
  files: DropboxFile[], 
  onSuccess?: () => void, 
  onError?: (errorMessage: string) => void
): void {
  // Check if Dropbox API is available
  if (!window.Dropbox || !window.Dropbox.save) {
    console.error('Dropbox API not available. Make sure the Dropbox script is loaded.');
    return;
  }

  const options: DropboxSaveOptions = {
    files: files,
    success: onSuccess || function() {
      console.log(`Success! ${files.length} file(s) saved to Dropbox`);
    },
    error: onError || function(errorMessage: string) {
      console.error("Error: " + errorMessage);
    }
  };
  
  window.Dropbox.save(options);
}