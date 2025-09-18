// Performance monitoring and optimization utilities

export const logPerformanceMetrics = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.fetchStart;
      console.log(`[Performance] TTFB: ${Math.round(ttfb)}ms`);
    }
    
    // Monitor CLS
    if ('LayoutShift' in window) {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        if (cls > 0) {
          console.log(`[Performance] CLS: ${Math.round(cls * 1000)}ms`);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }

    // Monitor LCP
    if ('LargestContentfulPaint' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`[Performance] LCP: ${Math.round(lastEntry.startTime)}ms`);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // Monitor FID
    if ('FirstInputDelay' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          console.log(`[Performance] FID: ${Math.round(fid)}ms`);
        }
      }).observe({ type: 'first-input', buffered: true });
    }
  }
};

// Preload critical resources
export const preloadImage = (src: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
};

// Lazy load images with intersection observer
export const useLazyImage = (src: string) => {
  if (typeof window === 'undefined') return src;
  
  const img = new Image();
  img.src = src;
  return src; // Simplified for immediate use
};