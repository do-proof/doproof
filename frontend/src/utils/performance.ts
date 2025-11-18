/**
 * Performance monitoring and optimization utilities
 */

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName: string, callback: () => void) => {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
  }
  
  // Log slow renders (> 16ms for 60fps)
  if (renderTime > 16) {
    console.warn(`[Performance] Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
  }
  
  return renderTime;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoize expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(
  func: T
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

/**
 * Batch API calls to reduce network requests
 */
export class APIBatcher {
  private queue: Array<{
    endpoint: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number = 50; // ms
  
  add<T>(endpoint: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, resolve, reject });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }
  
  private async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    this.batchTimeout = null;
    
    // Group by endpoint prefix for batch requests
    const grouped = batch.reduce((acc, item) => {
      const prefix = item.endpoint.split('/')[0];
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push(item);
      return acc;
    }, {} as Record<string, typeof batch>);
    
    // Process each group
    for (const [prefix, items] of Object.entries(grouped)) {
      try {
        // Make batch request (implementation depends on API)
        const endpoints = items.map(item => item.endpoint);
        const response = await fetch(`/api/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoints }),
        });
        
        const results = await response.json();
        
        // Resolve individual promises
        items.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        // Reject all promises in this batch
        items.forEach(item => item.reject(error));
      }
    }
  }
}

/**
 * Image optimization utilities
 */
export const optimizeImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string => {
  // If using a CDN or image service, add optimization parameters
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  
  const separator = url.includes('?') ? '&' : '?';
  return params.toString() ? `${url}${separator}${params.toString()}` : url;
};

/**
 * Preload critical resources
 */
export const preloadResource = (url: string, type: 'script' | 'style' | 'image' | 'font') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  
  if (type === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
};

/**
 * Lazy load modules
 */
export const lazyLoadModule = async <T>(
  importFunc: () => Promise<{ default: T }>
): Promise<T> => {
  try {
    const module = await importFunc();
    return module.default;
  } catch (error) {
    console.error('Error lazy loading module:', error);
    throw error;
  }
};

/**
 * Monitor Core Web Vitals
 */
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Optimize bundle size by removing unused code
 */
export const treeShake = <T extends Record<string, any>>(
  obj: T,
  usedKeys: Array<keyof T>
): Partial<T> => {
  return usedKeys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Partial<T>);
};

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private budgets = {
    renderTime: 16, // ms (60fps)
    apiCallTime: 1000, // ms
    bundleSize: 250 * 1024, // 250KB
    imageSize: 100 * 1024, // 100KB
  };
  
  checkRenderTime(componentName: string, time: number): boolean {
    if (time > this.budgets.renderTime) {
      console.warn(
        `[Performance Budget] ${componentName} exceeded render time budget: ` +
        `${time.toFixed(2)}ms > ${this.budgets.renderTime}ms`
      );
      return false;
    }
    return true;
  }
  
  checkAPICallTime(endpoint: string, time: number): boolean {
    if (time > this.budgets.apiCallTime) {
      console.warn(
        `[Performance Budget] ${endpoint} exceeded API call time budget: ` +
        `${time.toFixed(2)}ms > ${this.budgets.apiCallTime}ms`
      );
      return false;
    }
    return true;
  }
  
  checkBundleSize(size: number): boolean {
    if (size > this.budgets.bundleSize) {
      console.warn(
        `[Performance Budget] Bundle exceeded size budget: ` +
        `${(size / 1024).toFixed(2)}KB > ${(this.budgets.bundleSize / 1024).toFixed(2)}KB`
      );
      return false;
    }
    return true;
  }
}

export const performanceBudget = new PerformanceBudget();
