import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingStateHook {
  loading: LoadingState;
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
  setLoading: (key: string, loading: boolean) => void;
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>;
  clearAll: () => void;
}

export const useLoadingState = (initialState: LoadingState = {}): LoadingStateHook => {
  const [loading, setLoadingState] = useState<LoadingState>(initialState);
  const loadingRef = useRef<LoadingState>(initialState);

  // Update ref when state changes
  loadingRef.current = loading;

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return Boolean(loading[key]);
    }
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const withLoading = useCallback(async <T>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const clearAll = useCallback(() => {
    setLoadingState({});
  }, []);

  return {
    loading,
    isLoading,
    isAnyLoading,
    setLoading,
    withLoading,
    clearAll
  };
};

// Specialized loading hooks for common patterns
export const useAsyncOperation = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  key: string = 'default'
) => {
  const { loading, setLoading, withLoading } = useLoadingState();
  
  const execute = useCallback(async (...args: T): Promise<R> => {
    return withLoading(key, () => asyncFn(...args));
  }, [asyncFn, key, withLoading]);

  return {
    execute,
    loading: loading[key] || false,
    isLoading: loading[key] || false
  };
};

// Hook for managing multiple concurrent operations
export const useConcurrentLoading = () => {
  const { loading, setLoading, isAnyLoading, clearAll } = useLoadingState();
  const operationCounter = useRef(0);

  const startOperation = useCallback((key?: string) => {
    const operationKey = key || `operation_${++operationCounter.current}`;
    setLoading(operationKey, true);
    return operationKey;
  }, [setLoading]);

  const finishOperation = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const withOperation = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    key?: string
  ): Promise<T> => {
    const operationKey = startOperation(key);
    try {
      return await asyncFn();
    } finally {
      finishOperation(operationKey);
    }
  }, [startOperation, finishOperation]);

  return {
    loading,
    isAnyLoading,
    startOperation,
    finishOperation,
    withOperation,
    clearAll
  };
};

// Hook for debounced loading states (useful for search/filter operations)
export const useDebouncedLoading = (delay: number = 300) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setDebouncedLoading = useCallback((isLoading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      setLoading(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, delay);
    }
  }, [delay]);

  const withDebouncedLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setDebouncedLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setDebouncedLoading(false);
    }
  }, [setDebouncedLoading]);

  return {
    loading,
    setLoading: setDebouncedLoading,
    withLoading: withDebouncedLoading
  };
};

export default useLoadingState;