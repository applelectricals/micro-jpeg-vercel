// Performance monitoring utilities for Google Core Web Vitals

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay  
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
          this.sendMetrics('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.sendMetrics('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          this.metrics.cls = cls;
          this.sendMetrics('cls', cls);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Time to First Byte (using Navigation Timing API)
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        const navigationTiming = performance.timing;
        const ttfb = navigationTiming.responseStart - navigationTiming.navigationStart;
        this.metrics.ttfb = ttfb;
        this.sendMetrics('ttfb', ttfb);
      });
    }
  }

  private sendMetrics(metric: string, value: number) {
    // Send metrics to analytics (Google Analytics 4 example)
    if (typeof gtag !== 'undefined') {
      gtag('event', metric, {
        event_category: 'Web Vitals',
        value: Math.round(value),
        non_interaction: true,
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.toUpperCase()}: ${Math.round(value)}ms`);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public reportPageLoad(pageName: string) {
    // Track page-specific loading performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.sendMetrics(`page_load_${pageName}`, loadTime);
      });
    }
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (duration > 50) { // Only report slow operations
      console.warn(`[Performance] Slow operation ${name}: ${Math.round(duration)}ms`);
    }
    
    return result;
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components to track performance  
import { useEffect } from 'react';

export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const mountTime = performance.now() - startTime;
      if (mountTime > 100) { // Only report slow component mounts
        console.log(`[Performance] ${componentName} mount time: ${Math.round(mountTime)}ms`);
      }
    };
  }, [componentName]);
}

// Utility to preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

// Utility to prefetch resources for next page
export function prefetchResource(href: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}