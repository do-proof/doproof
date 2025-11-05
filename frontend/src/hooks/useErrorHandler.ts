import { useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { ApiError } from '../utils/api';

interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  customMessage?: string;
  onError?: (error: ApiError) => void;
}

export const useErrorHandler = () => {
  const { showError, showWarning } = useNotifications();

  const handleError = useCallback((
    error: ApiError | Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showNotification = true,
      logError = true,
      customMessage,
      onError
    } = options;

    let apiError: ApiError;

    // Convert different error types to ApiError
    if (error && typeof error === 'object' && 'status' in error) {
      apiError = error as ApiError;
    } else if (error instanceof Error) {
      apiError = {
        message: error.message,
        status: 0,
        code: 'CLIENT_ERROR'
      };
    } else {
      apiError = {
        message: 'An unexpected error occurred',
        status: 0,
        code: 'UNKNOWN_ERROR'
      };
    }

    // Log error in development
    if (logError && process.env.NODE_ENV === 'development') {
      console.error('Error handled:', apiError, error);
    }

    // Show notification if enabled
    if (showNotification) {
      const message = customMessage || apiError.message;
      const title = getErrorTitle(apiError);

      if (apiError.status >= 500 || apiError.code === 'NETWORK_ERROR') {
        showWarning(message, title);
      } else {
        showError(message, title);
      }
    }

    // Call custom error handler
    if (onError) {
      onError(apiError);
    }

    return apiError;
  }, [showError, showWarning]);

  const handleValidationError = useCallback((
    error: ApiError,
    options: Omit<ErrorHandlerOptions, 'customMessage'> = {}
  ) => {
    if (error.code === 'VALIDATION_ERROR' && error.details) {
      const validationErrors = error.details.map((err: any) => 
        err.field ? `${err.field}: ${err.message}` : err.message
      ).join('\n');
      
      return handleError(error, {
        ...options,
        customMessage: `Validation failed:\n${validationErrors}`
      });
    }
    
    return handleError(error, options);
  }, [handleError]);

  const handleNetworkError = useCallback((
    error: ApiError,
    retryAction?: () => void,
    options: ErrorHandlerOptions = {}
  ) => {
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      showWarning(
        error.message,
        'Connection Problem',
        0, // Persistent notification
        retryAction ? {
          label: 'Retry',
          onClick: retryAction
        } : undefined
      );
      
      return handleError(error, { ...options, showNotification: false });
    }
    
    return handleError(error, options);
  }, [handleError, showWarning]);

  const handleAuthError = useCallback((
    error: ApiError,
    options: ErrorHandlerOptions = {}
  ) => {
    if (error.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      showError(
        'Your session has expired. Please log in again.',
        'Authentication Required'
      );
      
      // Redirect to auth page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
      return handleError(error, { ...options, showNotification: false });
    }
    
    if (error.status === 403) {
      return handleError(error, {
        ...options,
        customMessage: 'You do not have permission to perform this action.'
      });
    }
    
    return handleError(error, options);
  }, [handleError, showError]);

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
    handleAuthError
  };
};

// Helper function to get appropriate error title
const getErrorTitle = (error: ApiError): string => {
  switch (error.status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Authentication Required';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 429:
      return 'Rate Limited';
    case 500:
      return 'Server Error';
    case 502:
    case 503:
    case 504:
      return 'Service Unavailable';
    default:
      if (error.code === 'NETWORK_ERROR') return 'Network Error';
      if (error.code === 'TIMEOUT') return 'Request Timeout';
      if (error.code === 'VALIDATION_ERROR') return 'Validation Error';
      return 'Error';
  }
};

export default useErrorHandler;