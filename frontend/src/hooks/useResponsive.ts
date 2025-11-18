import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint values matching Tailwind CSS defaults
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
}

/**
 * Hook for responsive design utilities
 * Provides information about current viewport and device capabilities
 */
export const useResponsive = () => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        width: 1024,
        height: 768,
        orientation: 'landscape' as const,
        isTouchDevice: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isLargeDesktop: width >= breakpoints.xl,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setState({
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isLargeDesktop: width >= breakpoints.xl,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debounce resize events for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  /**
   * Check if viewport is at or above a specific breakpoint
   */
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint) => {
      return state.width >= breakpoints[breakpoint];
    },
    [state.width]
  );

  /**
   * Check if viewport is below a specific breakpoint
   */
  const isBelowBreakpoint = useCallback(
    (breakpoint: Breakpoint) => {
      return state.width < breakpoints[breakpoint];
    },
    [state.width]
  );

  /**
   * Check if viewport is between two breakpoints
   */
  const isBetweenBreakpoints = useCallback(
    (min: Breakpoint, max: Breakpoint) => {
      return state.width >= breakpoints[min] && state.width < breakpoints[max];
    },
    [state.width]
  );

  /**
   * Get responsive value based on current breakpoint
   */
  const getResponsiveValue = useCallback(
    <T,>(values: {
      base: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
      '2xl'?: T;
    }): T => {
      if (state.width >= breakpoints['2xl'] && values['2xl'] !== undefined) {
        return values['2xl'];
      }
      if (state.width >= breakpoints.xl && values.xl !== undefined) {
        return values.xl;
      }
      if (state.width >= breakpoints.lg && values.lg !== undefined) {
        return values.lg;
      }
      if (state.width >= breakpoints.md && values.md !== undefined) {
        return values.md;
      }
      if (state.width >= breakpoints.sm && values.sm !== undefined) {
        return values.sm;
      }
      return values.base;
    },
    [state.width]
  );

  return {
    ...state,
    isBreakpoint,
    isBelowBreakpoint,
    isBetweenBreakpoints,
    getResponsiveValue,
  };
};

/**
 * Hook for media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * Hook for checking if user prefers reduced motion
 */
export const usePrefersReducedMotion = (): boolean => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Hook for checking if user prefers dark mode
 */
export const usePrefersDarkMode = (): boolean => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};

/**
 * Hook for checking if user prefers high contrast
 */
export const usePrefersHighContrast = (): boolean => {
  return useMediaQuery('(prefers-contrast: high)');
};

export default useResponsive;
