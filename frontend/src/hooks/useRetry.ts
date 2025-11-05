import { useState, useCallback, useRef } from 'react';
import { ApiError } from '../utils/api';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: ApiError | Error) => boolean;
  onRetry?: (attempt: number, error: ApiError | Error) => void;
  onMaxAttemptsReached?: (error: ApiError | Error) => void;
}

interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: ApiError | Error | null;
  canRetry: boolean;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and server errors (5xx)
    if (error instanceof Error) return true;
    const apiError = error as ApiError;
    return apiError.code === 'NETWORK_ERROR' || 
           apiError.code === 'TIMEOUT' || 
           apiError.status >= 500;
  },
  onRetry: () => {},
  onMaxAttemptsReached: () => {}
};

export const useRetry = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) => {
  const opts = { ...defaultRetryOptions, ...options };
  
  const [retryState, setRetryState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
    canRetry: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const delay = useCallback((ms: number) => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);
      
      // Allow cancellation
      if (abortControllerRef.current) {
        abortControllerRef.current.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Retry cancelled'));
        });
      }
    });
  }, []);

  const calculateDelay = useCallback((attempt: number) => {
    const exponentialDelay = opts.delay * Math.pow(opts.backoffMultiplier, attempt - 1);
    return Math.min(exponentialDelay, opts.maxDelay);
  }, [opts.delay, opts.backoffMultiplier, opts.maxDelay]);

  const execute = useCallback(async (...args: T): Promise<R> => {
    // Create new abort controller for this execution
    abortControllerRef.current = new AbortController();
    
    setRetryState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      canRetry: false
    });

    let lastError: ApiError | Error;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          attempt,
          isRetrying: attempt > 1
        }));

        const result = await asyncFn(...args);
        
        // Success - reset state
        setRetryState({
          attempt: 0,
          isRetrying: false,
          lastError: null,
          canRetry: false
        });
        
        return result;
      } catch (error) {
        lastError = error as ApiError | Error;
        
        // Check if we should retry
        const shouldRetry = attempt < opts.maxAttempts && opts.retryCondition(lastError);
        
        setRetryState({
          attempt,
          isRetrying: false,
          lastError,
          canRetry: shouldRetry
        });

        if (shouldRetry) {
          opts.onRetry(attempt, lastError);
          
          // Wait before retrying
          const delayMs = calculateDelay(attempt);
          await delay(delayMs);
          
          // Check if cancelled during delay
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Retry cancelled');
          }
        } else {
          // Max attempts reached or shouldn't retry
          if (attempt >= opts.maxAttempts) {
            opts.onMaxAttemptsReached(lastError);
          }
          throw lastError;
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }, [asyncFn, opts, calculateDelay, delay]);

  const retry = useCallback(async (...args: T): Promise<R> => {
    if (!retryState.canRetry) {
      throw new Error('Cannot retry: no retryable error or max attempts reached');
    }
    
    return execute(...args);
  }, [execute, retryState.canRetry]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
      canRetry: false
    }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setRetryState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      canRetry: false
    });
  }, [cancel]);

  return {
    execute,
    retry,
    cancel,
    reset,
    state: retryState
  };
};

// Specialized retry hook for API calls
export const useApiRetry = <T extends any[], R>(
  apiCall: (...args: T) => Promise<R>,
  options: Omit<RetryOptions, 'retryCondition'> & {
    retryOn?: ('network' | 'timeout' | 'server' | 'auth')[];
  } = {}
) => {
  const { retryOn = ['network', 'timeout', 'server'], ...retryOptions } = options;
  
  const retryCondition = useCallback((error: ApiError | Error) => {
    if (error instanceof Error) {
      return retryOn.includes('network');
    }
    
    const apiError = error as ApiError;
    
    if (retryOn.includes('network') && apiError.code === 'NETWORK_ERROR') return true;
    if (retryOn.includes('timeout') && apiError.code === 'TIMEOUT') return true;
    if (retryOn.includes('server') && apiError.status >= 500) return true;
    if (retryOn.includes('auth') && (apiError.status === 401 || apiError.status === 403)) return true;
    
    return false;
  }, [retryOn]);

  return useRetry(apiCall, {
    ...retryOptions,
    retryCondition
  });
};

// Hook for exponential backoff with jitter
export const useRetryWithJitter = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: RetryOptions & { jitter?: boolean } = {}
) => {
  const { jitter = true, ...retryOptions } = options;
  
  const calculateDelayWithJitter = useCallback((attempt: number) => {
    const baseDelay = retryOptions.delay || 1000;
    const multiplier = retryOptions.backoffMultiplier || 2;
    const maxDelay = retryOptions.maxDelay || 10000;
    
    let delay = baseDelay * Math.pow(multiplier, attempt - 1);
    
    if (jitter) {
      // Add random jitter (±25% of the delay)
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.min(Math.max(delay, 0), maxDelay);
  }, [retryOptions.delay, retryOptions.backoffMultiplier, retryOptions.maxDelay, jitter]);

  return useRetry(asyncFn, {
    ...retryOptions,
    delay: 0, // We'll calculate our own delay
    backoffMultiplier: 1, // Disable built-in backoff
  });
};

export default useRetry;