import React, { useState } from 'react';
import { useRetry } from '../hooks/useRetry';
import { ButtonLoading } from './LoadingStates';
import ErrorMessage from './ErrorMessage';

interface RetryHandlerProps<T extends any[], R> {
  asyncFn: (...args: T) => Promise<R>;
  args: T;
  maxAttempts?: number;
  delay?: number;
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
  renderSuccess?: (result: R) => React.ReactNode;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  autoExecute?: boolean;
  children?: (state: {
    execute: () => Promise<void>;
    retry: () => Promise<void>;
    isRetrying: boolean;
    attempt: number;
    error: Error | null;
    result: R | null;
  }) => React.ReactNode;
}

/**
 * Component that handles retrying async operations with exponential backoff
 */
function RetryHandler<T extends any[], R>({
  asyncFn,
  args,
  maxAttempts = 3,
  delay = 1000,
  onSuccess,
  onError,
  renderSuccess,
  renderError,
  renderLoading,
  autoExecute = false,
  children
}: RetryHandlerProps<T, R>) {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { execute, retry, state } = useRetry(
    asyncFn,
    {
      maxAttempts,
      delay,
      onRetry: (attempt, err) => {
        console.log(`Retry attempt ${attempt}:`, err);
      },
      onMaxAttemptsReached: (err) => {
        setError(err as Error);
        if (onError) {
          onError(err as Error);
        }
      }
    }
  );

  const handleExecute = async () => {
    try {
      setError(null);
      const res = await execute(...args);
      setResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err as Error);
      if (onError) {
        onError(err as Error);
      }
    }
  };

  const handleRetry = async () => {
    try {
      setError(null);
      const res = await retry(...args);
      setResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err as Error);
      if (onError) {
        onError(err as Error);
      }
    }
  };

  // Auto-execute on mount if enabled
  React.useEffect(() => {
    if (autoExecute) {
      handleExecute();
    }
  }, [autoExecute]);

  // If children render prop is provided, use it
  if (children) {
    return (
      <>
        {children({
          execute: handleExecute,
          retry: handleRetry,
          isRetrying: state.isRetrying,
          attempt: state.attempt,
          error: error || state.lastError,
          result
        })}
      </>
    );
  }

  // Default rendering logic
  if (state.isRetrying || (autoExecute && !result && !error)) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {state.attempt > 1 ? `Retrying... (Attempt ${state.attempt}/${maxAttempts})` : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || state.lastError) {
    const displayError = error || state.lastError!;
    if (renderError) {
      return <>{renderError(displayError, handleRetry)}</>;
    }
    return (
      <ErrorMessage
        title="Operation Failed"
        message={displayError.message}
        onRetry={state.canRetry ? handleRetry : undefined}
        type="error"
      />
    );
  }

  if (result && renderSuccess) {
    return <>{renderSuccess(result)}</>;
  }

  return null;
}

interface SimpleRetryButtonProps {
  onRetry: () => Promise<void>;
  isRetrying?: boolean;
  label?: string;
  retryingLabel?: string;
  className?: string;
}

/**
 * Simple retry button component
 */
export const SimpleRetryButton: React.FC<SimpleRetryButtonProps> = ({
  onRetry,
  isRetrying = false,
  label = 'Try Again',
  retryingLabel = 'Retrying...',
  className = ''
}) => {
  return (
    <ButtonLoading
      loading={isRetrying}
      loadingText={retryingLabel}
      onClick={onRetry}
      className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    >
      {label}
    </ButtonLoading>
  );
};

interface RetryWithCountdownProps {
  onRetry: () => Promise<void>;
  countdown: number; // seconds
  autoRetry?: boolean;
  onCountdownComplete?: () => void;
}

/**
 * Retry button with countdown timer
 */
export const RetryWithCountdown: React.FC<RetryWithCountdownProps> = ({
  onRetry,
  countdown,
  autoRetry = false,
  onCountdownComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (autoRetry && !isRetrying) {
        handleRetry();
      }
      if (onCountdownComplete) {
        onCountdownComplete();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, autoRetry, isRetrying, onCountdownComplete]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="text-center">
      <ButtonLoading
        loading={isRetrying}
        onClick={handleRetry}
        disabled={timeLeft > 0 && !isRetrying}
        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRetrying ? 'Retrying...' : timeLeft > 0 ? `Retry in ${timeLeft}s` : 'Retry Now'}
      </ButtonLoading>
      {autoRetry && timeLeft > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          Auto-retrying in {timeLeft} seconds...
        </p>
      )}
    </div>
  );
};

export default RetryHandler;
