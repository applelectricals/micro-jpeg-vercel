import { lazy, Suspense } from 'react';

// Loading component for heavy image compression components
const ComponentLoader = () => (
  <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-sm text-gray-500">Loading image compressor...</p>
    </div>
  </div>
);

// Lazy load the heavy FullImageCompressor component
const FullImageCompressor = lazy(() => import('./FullImageCompressor').then(m => ({ default: m.FullImageCompressor })));

// Lazy load the heavy ImageComparisonViewer component  
const ImageComparisonViewer = lazy(() => import('./ImageComparisonViewer').then(m => ({ default: m.ImageComparisonViewer })));

interface LazyImageCompressorProps {
  sessionId?: string;
  onCompressionComplete?: () => void;
}

export function LazyImageCompressor(props: LazyImageCompressorProps) {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <FullImageCompressor {...props} />
    </Suspense>
  );
}

interface LazyImageComparisonViewerProps {
  job: any;
  originalImageUrl: string;
  compressedImageUrl: string;
  onDownload?: () => void;
}

export function LazyImageComparisonViewer(props: LazyImageComparisonViewerProps) {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <ImageComparisonViewer {...props} />
    </Suspense>
  );
}