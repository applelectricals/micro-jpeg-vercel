import React, { useState, useEffect } from "react";
import { X, FileImage, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompressionJob } from "@/lib/file-utils";

interface ThumbnailRibbonProps {
  jobs: CompressionJob[];
  onRemoveJob?: (jobId: string) => void;
}

interface ThumbnailItemProps {
  job: CompressionJob;
  onRemove?: (jobId: string) => void;
}

function ThumbnailItem({ job, onRemove }: ThumbnailItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/preview/original/${job.id}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
      }
    };
    
    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [job.id]);

  return (
    <div
      className="relative group bg-white rounded-md border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
      style={{ width: '60px', height: '60px' }}
      data-testid={`thumbnail-${job.id}`}
    >
      {/* Remove button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={() => onRemove(job.id)}
          data-testid={`button-remove-${job.id}`}
        >
          <X className="h-2 w-2" />
        </Button>
      )}
      
      {/* Image preview or placeholder */}
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={job.filename}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.error('Failed to load image preview for', job.filename);
              setImageLoaded(false);
            }}
          />
        ) : (
          <FileImage className="h-6 w-6 text-gray-400" />
        )}
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-0 right-0 p-0.5">
        <div className={`w-2 h-2 rounded-full ${
          job.status === 'uploaded' || job.status === 'pending' 
            ? 'bg-blue-500' 
            : job.status === 'completed' 
            ? 'bg-green-500'
            : 'bg-red-500'
        }`} />
      </div>
    </div>
  );
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'uploaded':
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'uploaded':
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'processing':
      return <div className="h-3 w-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-3 w-3" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <FileImage className="h-3 w-3" />;
  }
};

export default function ThumbnailRibbon({ jobs, onRemoveJob }: ThumbnailRibbonProps) {
  // Only show uploaded files that haven't been processed yet
  const uploadedJobs = jobs.filter(job => ['uploaded', 'pending'].includes(job.status));
  
  if (uploadedJobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
      
      <div className="flex flex-wrap gap-2">
        {uploadedJobs.map((job) => (
          <ThumbnailItem
            key={job.id}
            job={job}
            onRemove={onRemoveJob}
          />
        ))}
      </div>
    </div>
  );
}