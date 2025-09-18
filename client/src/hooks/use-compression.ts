import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { sessionManager } from "@/lib/sessionManager";
import { getCurrentPageIdentifier } from "@/lib/pageIdentifier";
import type { CompressionJob } from "@shared/schema";
import type { CompressionSettings } from "@/pages/home";

interface UploadQueueItem {
  files: File[];
  id: string;
  retries: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
}

interface UploadProgress {
  overall: number;
  current: number;
  currentFileName?: string;
  queuePosition?: number;
  totalInQueue?: number;
  statusText?: string;
}

export function useCompression(settings: CompressionSettings) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CompressionJob[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    overall: 0,
    current: 0,
  });
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const currentXhrRef = useRef<XMLHttpRequest | null>(null);
  const queueProcessorRef = useRef<boolean>(false);
  
  const MAX_CONCURRENT_UPLOADS = 1; // Sequential processing to avoid issues
  const MAX_RETRIES = 1; // Minimal retries for faster processing
  const CHUNK_SIZE = 1; // Process files one at a time for UI feedback
  const NETWORK_TIMEOUT = 30000; // Increased timeout for large files

  // Query to get all jobs - no automatic polling
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["/api/jobs"],
    refetchInterval: false, // Disable automatic polling completely
    enabled: true,
    staleTime: 0, // Always refetch to get latest status
    cacheTime: 0, // Don't cache to avoid stale data
  });

  // Update local jobs state
  useEffect(() => {
    if (jobsData && Array.isArray(jobsData)) {
      setJobs(jobsData);
      
      // Check if we need to continue polling for active jobs
      const activeJobsExist = jobsData.some((job: CompressionJob) => 
        job.status === 'pending' || job.status === 'processing' || job.status === 'uploaded'
      );
      
      // If there are active jobs, schedule a refetch in 1 second (very fast polling)
      if (activeJobsExist) {
        const timer = setTimeout(() => {
          refetchJobs();
        }, 1000); // Reduced to 1000ms for immediate updates
        
        return () => clearTimeout(timer);
      }
    }
  }, [jobsData, refetchJobs]);

  // Enhanced upload with retry logic and network resilience
  const uploadWithProgress = async (
    files: File[], 
    queueItem: UploadQueueItem,
    onProgress?: (progress: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      // CRITICAL: Add pageIdentifier and sessionId for proper tracking
      const sessionId = sessionManager.getSessionId();
      const pageIdentifier = getCurrentPageIdentifier();
      formData.append('pageIdentifier', pageIdentifier);
      formData.append('sessionId', sessionId); // CRITICAL: Use exact field name as requested
      
      // ✅ Add page-aware settings with required tracking parameters
      const enhancedSettings = {
        ...settings,
        pageIdentifier: pageIdentifier, // CRITICAL: Include page identifier
        sessionId: sessionId            // CRITICAL: Include session ID
      };
      
      // Add compression settings
      formData.append('settings', JSON.stringify(enhancedSettings));

      const xhr = new XMLHttpRequest();
      currentXhrRef.current = xhr;
      
      // Set timeout for network resilience
      xhr.timeout = NETWORK_TIMEOUT;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        currentXhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        currentXhrRef.current = null;
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = () => {
        currentXhrRef.current = null;
        reject(new Error('Upload timeout - please check your connection'));
      };
      
      xhr.onabort = () => {
        currentXhrRef.current = null;
        reject(new Error('Upload cancelled'));
      };

      try {
        xhr.open('POST', '/api/compress');
        console.log('🔧 Compression Request:', { 
          files: files.length, 
          pageIdentifier: getCurrentPageIdentifier(),
          endpoint: '/api/compress' 
        });
        // Add session and page identifier headers for consistency with apiRequest
        xhr.setRequestHeader('X-Session-Id', sessionId);
        xhr.setRequestHeader('X-Page-Identifier', pageIdentifier);
        xhr.send(formData);
      } catch (error) {
        currentXhrRef.current = null;
        reject(new Error('Failed to start upload'));
      }
    });
  };
  
  // Retry logic with exponential backoff
  const retryUpload = async (queueItem: UploadQueueItem): Promise<any> => {
    const maxRetries = MAX_RETRIES;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (isPaused) {
        throw new Error('Upload paused');
      }
      
      try {
        // Exponential backoff: wait 1s, 2s, 4s between retries
        if (attempt > 0) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await uploadWithProgress(
          queueItem.files, 
          queueItem,
          (progress) => {
            updateCurrentProgress(progress, queueItem);
          }
        );
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Upload attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('cancelled')) {
            throw error;
          }
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  };
  
  // Update progress for current upload
  const updateCurrentProgress = (currentProgress: number, queueItem: UploadQueueItem) => {
    const currentItemIndex = uploadQueue.findIndex(item => item.id === queueItem.id);
    const queuePosition = currentItemIndex + 1;
    const totalInQueue = uploadQueue.length;
    
    // Calculate total files across all queue items
    const totalFiles = uploadQueue.reduce((sum, item) => sum + item.files.length, 0);
    const completedFiles = uploadQueue.slice(0, currentItemIndex).reduce((sum, item) => sum + item.files.length, 0);
    const currentBatchFiles = queueItem.files.length;
    
    // Calculate which file in the current batch is being processed
    const currentFileInBatch = Math.min(Math.floor((currentProgress / 100) * currentBatchFiles), currentBatchFiles - 1);
    const totalProcessedFiles = completedFiles + currentFileInBatch;
    const currentFileNumber = Math.min(totalProcessedFiles + 1, totalFiles);
    
    // Calculate overall progress more accurately
    const batchProgress = currentProgress / 100;
    const overallProgress = totalFiles > 0 ? 
      Math.round(((completedFiles + batchProgress * currentBatchFiles) / totalFiles) * 100) : 0;
    
    // Generate simple, clear status text
    const statusText = currentProgress === 100 
      ? `File ${currentFileNumber} of ${totalFiles} completed`
      : `File ${currentFileNumber} of ${totalFiles} in progress`;
    
    setUploadProgress({
      overall: Math.min(overallProgress, 100), // Cap at 100%
      current: currentProgress,
      currentFileName: queueItem.files[0]?.name,
      queuePosition,
      totalInQueue,
      statusText,
    });
  };
  
  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (queueProcessorRef.current || isPaused) return;
    
    queueProcessorRef.current = true;
    let currentQueue = uploadQueue; // Move to function scope
    
    try {
      
      while (currentQueue.length > 0 && !isPaused) {
        const pendingItems = currentQueue.filter(item => item.status === 'pending');
        if (pendingItems.length === 0) break;
        
        // Process items one by one (sequential processing)
        const queueItem = pendingItems[0]; // Take first pending item
        
        try {
          // Update status to uploading
          setUploadQueue(prev => 
            prev.map(item => 
              item.id === queueItem.id 
                ? { ...item, status: 'uploading' as const }
                : item
            )
          );
          
          const result = await retryUpload(queueItem);
          
          // Mark as completed and update progress
          setUploadQueue(prev => {
            const updated = prev.map(item => 
              item.id === queueItem.id 
                ? { ...item, status: 'completed' as const }
                : item
            );
            currentQueue = updated; // Update local reference
            
            // Update overall progress based on completed uploads
            const completedBatches = updated.filter(item => item.status === 'completed').length;
            const totalBatches = updated.length;
            const totalFiles = updated.reduce((sum, item) => sum + item.files.length, 0);
            const completedFiles = updated.slice(0, completedBatches).reduce((sum, item) => sum + item.files.length, 0);
            const overallProgress = Math.round((completedFiles / totalFiles) * 100);
            
            // Generate simple status text for completed state
            const statusText = completedBatches === totalBatches 
              ? `All ${totalFiles} files completed`
              : `File ${completedFiles} of ${totalFiles} completed`;
            
            setUploadProgress(prevProgress => ({
              ...prevProgress,
              overall: overallProgress,
              current: 100, // Current item is complete
              statusText,
            }));
            
            return updated;
          });
          
          toast({
            title: "Files uploaded successfully", 
            description: `${result.results ? result.results.length : queueItem.files.length} files are being compressed`,
          });
          
          // Trigger immediate job status check
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          
          // CRITICAL: Delayed refetch for usage stats (wait for backend operation recording)
          const currentPageIdentifier = getCurrentPageIdentifier();
          const usageStatsQueryKey = [`/api/usage-stats/${currentPageIdentifier}`];
          
          console.log('🔧 Compression Success - Triggering Usage Stats Invalidation:', {
            pageIdentifier: currentPageIdentifier,
            queryKey: [`/api/usage-stats/${currentPageIdentifier}`]
          });
          
          // Invalidate and then force refetch for immediate update
          await queryClient.invalidateQueries({ 
            queryKey: [`/api/usage-stats/${currentPageIdentifier}`], 
            exact: true 
          });
          
          // Force immediate refetch after small delay
          setTimeout(async () => {
            await queryClient.refetchQueries({ 
              queryKey: [`/api/usage-stats/${currentPageIdentifier}`], 
              exact: true 
            });
            console.log('🔧 Forced refetch complete');
          }, 500);
          
        } catch (error) {
          console.error('Upload failed for queue item:', queueItem.id, error);
          
          // Mark as failed or retry if retries available
          setUploadQueue(prev => {
            const updated = prev.map(item => {
              if (item.id === queueItem.id) {
                if (item.retries < MAX_RETRIES) {
                  return { ...item, retries: item.retries + 1, status: 'pending' as const };
                } else {
                  return { ...item, status: 'failed' as const };
                }
              }
              return item;
            });
            currentQueue = updated; // Update local reference
            return updated;
          });
          
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Unknown error occurred",
            variant: "destructive",
          });
        }
      }
    } finally {
      queueProcessorRef.current = false;
      
      // Check if all uploads are complete and refresh usage stats
      const remainingUploads = currentQueue.filter(
        (item: UploadQueueItem) => item.status === 'pending' || item.status === 'uploading'
      );
      
      if (remainingUploads.length === 0) {
        setIsUploading(false);
        setUploadProgress({ overall: 0, current: 0 });
        setUploadQueue([]);
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        
        // Final usage stats invalidation when all processing complete  
        const currentPageIdentifier = getCurrentPageIdentifier();
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/usage-stats', currentPageIdentifier], 
          exact: true 
        });
        console.log('🔧 Final invalidation complete - all processing done');
      }
    }
  }, [uploadQueue, isPaused, settings, toast]);
  
  // Start queue processing when queue changes - use ref to avoid infinite loop
  useEffect(() => {
    const hasValidQueue = uploadQueue.some(item => item.status === 'pending' || item.status === 'uploading');
    
    if (hasValidQueue && !isPaused && !queueProcessorRef.current) {
      processUploadQueue();
    }
  }, [uploadQueue.length, isPaused]); // Only depend on length and pause state

  // Enhanced file upload with smart batching for performance
  const uploadFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    
    // Prevent duplicate uploads by checking if upload is already in progress
    if (isUploading || uploadQueue.length > 0) {
      toast({
        title: "Upload in progress",
        description: "Please wait for current uploads to complete",
        variant: "destructive",
      });
      return;
    }
    
    // Simple sequential processing - no batching to avoid complexity
    const queueItems: UploadQueueItem[] = files.map((file, index) => ({
      files: [file],
      id: `upload-${Date.now()}-${index}`,
      retries: 0,
      status: 'pending',
    }));
    
    toast({
      title: "Upload started",
      description: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}`,
    });
    
    setUploadQueue(queueItems); // Replace instead of append to prevent duplicates
    setIsUploading(true);
  }, [toast, isUploading, uploadQueue.length]);
  
  // Pause/Resume functionality
  const pauseUploads = useCallback(() => {
    setIsPaused(true);
    if (currentXhrRef.current) {
      currentXhrRef.current.abort();
    }
    toast({
      title: "Uploads paused",
      description: "You can resume uploads anytime",
    });
  }, [toast]);
  
  const resumeUploads = useCallback(() => {
    setIsPaused(false);
    toast({
      title: "Uploads resumed",
      description: "Continuing with remaining files",
    });
  }, [toast]);
  
  // Cancel all uploads
  const cancelUploads = useCallback(() => {
    setIsPaused(false);
    setIsUploading(false);
    setUploadQueue([]);
    setUploadProgress({ overall: 0, current: 0 });
    
    if (currentXhrRef.current) {
      currentXhrRef.current.abort();
    }
    
    toast({
      title: "Uploads cancelled",
      description: "All pending uploads have been cancelled",
    });
  }, [toast]);

  // Delete job mutation
  const deletingJobsRef = useRef<Set<string>>(new Set());
  
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      // Prevent duplicate delete requests
      if (deletingJobsRef.current.has(jobId)) {
        throw new Error("Delete already in progress");
      }
      
      deletingJobsRef.current.add(jobId);
      try {
        await apiRequest("DELETE", `/api/jobs/${jobId}`);
      } finally {
        deletingJobsRef.current.delete(jobId);
      }
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The file has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error) => {
      if (error.message !== "Delete already in progress") {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const clearingAllRef = useRef<boolean>(false);
  
  // Clear all jobs mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Prevent duplicate clear all requests
      if (clearingAllRef.current) {
        throw new Error("Clear all already in progress");
      }
      
      clearingAllRef.current = true;
      try {
        await apiRequest("DELETE", "/api/jobs");
      } finally {
        clearingAllRef.current = false;
      }
    },
    onSuccess: () => {
      toast({
        title: "All files cleared",
        description: "All files have been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error) => {
      if (error.message !== "Clear all already in progress") {
        toast({
          title: "Clear failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Retry failed uploads
  const retryFailedUploads = useCallback(() => {
    setUploadQueue(prev => 
      prev.map(item => 
        item.status === 'failed' 
          ? { ...item, status: 'pending', retries: 0 }
          : item
      )
    );
  }, []);

  const deleteJob = (jobId: string) => {
    deleteMutation.mutate(jobId);
  };

  const clearAllJobs = () => {
    clearAllMutation.mutate();
  };

  const downloadFile = async (jobId: string) => {
    try {
      const response = await fetch(`/api/download/${jobId}`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const job = jobs.find(j => j.id === jobId);
      
      // Generate filename with correct extension based on output format
      let filename = "compressed_image.jpg"; // fallback
      if (job) {
        const baseName = job.originalFilename.replace(/\.[^/.]+$/, ""); // Remove original extension
        let extension = 'jpg'; // default
        
        // Use the job's output format to determine extension
        if (job.outputFormat === 'webp') extension = 'webp';
        else if (job.outputFormat === 'avif') extension = 'avif';
        else if (job.outputFormat === 'png') extension = 'png';
        else if (job.outputFormat === 'jpeg') extension = 'jpg';
        
        filename = `compressed_${baseName}.${extension}`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const downloadAllFiles = async () => {
    const completedJobs = jobs.filter(job => job.status === "completed");
    
    if (completedJobs.length === 0) {
      toast({
        title: "No files to download",
        description: "No completed files available",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/download-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: completedJobs.map(job => job.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Download all failed");
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "compressed_images.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Downloading ${completedJobs.length} compressed images as ZIP`,
      });
    } catch (error) {
      toast({
        title: "Download all failed",
        description: "Could not download the files",
        variant: "destructive",
      });
    }
  };

  // Process uploaded files with compression settings
  const processFiles = async (jobIds: string[], compressionSettings: any) => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/process", {
        jobIds,
        settings: compressionSettings
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Processing Started",
          description: result.message,
        });
        
        // Refresh jobs immediately to show updated status
        refetchJobs();
        
        // Schedule aggressive refetches to catch completion immediately
        setTimeout(() => refetchJobs(), 200);   // Check after 0.2 seconds
        setTimeout(() => refetchJobs(), 800);   // Check after 0.8 seconds  
        setTimeout(() => refetchJobs(), 2000);  // Check after 2 seconds
        setTimeout(() => refetchJobs(), 4000);  // Check after 4 seconds
        
        return result;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to process files");
      }
    } catch (error) {
      console.error("Process files error:", error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Could not process files",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    jobs,
    uploadFiles,
    processFiles,
    deleteJob,
    clearAllJobs,
    downloadFile,
    downloadAllFiles,
    isUploading,
    isProcessing,
    uploadProgress,
    uploadQueue,
    isPaused,
    pauseUploads,
    resumeUploads,
    cancelUploads,
    retryFailedUploads,
    refetchJobs,
  };
}
