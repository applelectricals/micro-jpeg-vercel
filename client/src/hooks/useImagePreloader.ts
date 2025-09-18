import { useEffect, useState } from 'react';

interface UseImagePreloaderProps {
  imageSources: string[];
  priority?: boolean;
}

export function useImagePreloader({ imageSources, priority = false }: UseImagePreloaderProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageSources.length === 0) {
      setIsLoading(false);
      return;
    }

    const preloadImages = async () => {
      const imagePromises = imageSources.map((src) => {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set(Array.from(prev).concat(src)));
            resolve(src);
          };
          img.onerror = () => reject(src);
          img.src = src;
          
          // High priority images should be loaded immediately
          if (priority) {
            img.loading = 'eager';
            img.fetchPriority = 'high';
          }
        });
      });

      try {
        await Promise.allSettled(imagePromises);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay non-priority image preloading to not block critical resources
    if (priority) {
      preloadImages();
    } else {
      const timer = setTimeout(preloadImages, 100);
      return () => clearTimeout(timer);
    }
  }, [imageSources, priority]);

  return {
    loadedImages,
    isLoading,
    isImageLoaded: (src: string) => loadedImages.has(src)
  };
}

// Hook for critical above-the-fold images
export function useCriticalImages(imageSources: string[]) {
  return useImagePreloader({ imageSources, priority: true });
}

// Hook for below-the-fold images
export function useLazyImages(imageSources: string[]) {
  return useImagePreloader({ imageSources, priority: false });
}