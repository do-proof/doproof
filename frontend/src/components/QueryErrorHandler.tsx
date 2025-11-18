import React from 'react';
import ErrorMessage, { NetworkErrorMessage } from './ErrorMessage';
import { ApiError } from '../utils/api';

interface QueryErrorHandlerProps {
  error: Error | ApiError | unknown;
  onRetry?: () => void;
  fallbackMessage?: string;
  className?: string;
  showDetails?: boolean;
}

/**
 * Component to handle and display query errors with appropriate UI
 */
const QueryErrorHandler: React.FC<QueryErrorHandlerProps> = ({
  error,
  onRetry,
  fallbackMessage = 'An error occurred while loading data',
  className = '',
  showDetails = process.env.NODE_ENV === 'development'
}) => {
  // Convert error to ApiError if possible
  const apiError = error && typeof error === 'object' && 'status' in error
    ? (error as ApiError)
    : null;

  // Determine error type and appropriate message
  const getErrorInfo = () => {
    if (!error) {
      return {
        title: 'Unknown Error',
        message: fallbackMessage,
        type: 'error' as const
      };
    }

    // Network errors
    if (apiError?.code === 'NETWORK_ERROR' || apiError?.code === 'TIMEOUT') {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error' as const,
        isNetwork: true
      };
    }

    // Authentication errors
    if (apiError?.status === 401) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again.',
        type: 'warning' as const
      };
    }

    // Permission errors
    if (apiError?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        type: 'warning' as const
      };
    }

    // Not found errors
    if (apiError?.status === 404) {
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        type: 'warning' as const
      };
    }

    // Validation errors
    if (apiError?.status === 422 || apiError?.code === 'VALIDATION_ERROR') {
      return {
        title: 'Validation Error',
        message: apiError.message || 'The provided data is invalid. Please check your input and try again.',
        type: 'error' as const
      };
    }

    // Rate limit errors
    if (apiError?.status === 429) {
      return {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment and try again.',
        type: 'warning' as const
      };
    }

    // Server errors
    if (apiError?.status && apiError.status >= 500) {
      return {
        title: 'Server Error',
        message: 'The server encountered an error. Our team has been notified. Please try again later.',
        type: 'error' as const
      };
    }

    // Generic error
    return {
      title: 'Error',
      message: apiError?.message || (error instanceof Error ? error.message : fallbackMessage),
      type: 'error' as const
    };
  };

  const errorInfo = getErrorInfo();

  // Use specialized network error component for network errors
  if (errorInfo.isNetwork) {
    return (
      <NetworkErrorMessage
        onRetry={onRetry}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <ErrorMessage
        title={errorInfo.title}
        message={errorInfo.message}
        type={errorInfo.type}
        onRetry={onRetry}
        dismissible={false}
      />
      
      {showDetails && error && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Technical Details (Development Only)
          </summary>
          <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-64">
              {JSON.stringify(
                {
                  message: error instanceof Error ? error.message : 'Unknown error',
                  status: apiError?.status,
                  code: apiError?.code,
                  details: apiError?.details,
                  stack: error instanceof Error ? error.stack : undefined
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Full-page error display for critical errors
 */
export const FullPageError: React.FC<QueryErrorHandlerProps & { 
  actionLabel?: string;
  onAction?: () => void;
}> = ({ 
  error, 
  onRetry, 
  fallbackMessage,
  actionLabel = 'Go to Dashboard',
  onAction
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <QueryErrorHandler
          error={error}
          onRetry={onRetry}
          fallbackMessage={fallbackMessage}
        />
        
        {onAction && (
          <div className="mt-6 text-center">
            <button
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryErrorHandler;
