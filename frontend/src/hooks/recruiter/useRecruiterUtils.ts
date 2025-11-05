import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
}

export const useRecruiterUtils = () => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { user } = useAuth();

  const defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    delay: 1000,
    backoff: true
  };

  const handleApiError = useCallback((error: any): ApiError => {
    if (error instanceof Error) {
      return {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      status: 500
    };
  }, []);

  const makeAuthenticatedRequest = useCallback(async (
    url: string,
    options: RequestInit = {},
    retryConfig: RetryConfig = defaultRetryConfig
  ): Promise<Response> => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to perform this action.');
          }
          if (response.status >= 500 && attempt < retryConfig.maxAttempts) {
            throw new Error('RETRY_NEEDED');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (lastError.message === 'RETRY_NEEDED' && attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.backoff 
            ? retryConfig.delay * Math.pow(2, attempt)
            : retryConfig.delay;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (attempt === retryConfig.maxAttempts) {
          throw lastError;
        }
      }
    }
    
    throw lastError!;
  }, [user, defaultRetryConfig]);

  const formatDate = useCallback((dateString: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(dateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  }, []);

  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString, { month: 'short', day: 'numeric' });
  }, [formatDate]);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);

  const formatScore = useCallback((score: number, decimals: number = 1) => {
    return score.toFixed(decimals);
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const statusColors: Record<string, string> = {
      // Job statuses
      'draft': 'text-gray-600',
      'active': 'text-green-600',
      'paused': 'text-yellow-600',
      'closed': 'text-red-600',
      
      // Submission statuses
      'in_progress': 'text-blue-600',
      'submitted': 'text-purple-600',
      'evaluated': 'text-indigo-600',
      'reviewed': 'text-teal-600',
      'shortlisted': 'text-green-600',
      'rejected': 'text-red-600',
      
      // Interview statuses
      'scheduled': 'text-blue-600',
      'completed': 'text-green-600',
      'cancelled': 'text-red-600',
      'rescheduled': 'text-yellow-600',
      'no_show': 'text-orange-600',
    };
    
    return statusColors[status] || 'text-gray-600';
  }, []);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }, []);

  return {
    globalLoading,
    globalError,
    setGlobalLoading,
    setGlobalError,
    handleApiError,
    makeAuthenticatedRequest,
    formatDate,
    formatRelativeTime,
    formatDuration,
    formatScore,
    getScoreColor,
    getStatusColor,
    downloadFile,
    copyToClipboard,
    debounce,
    throttle,
    clearGlobalError: () => setGlobalError(null)
  };
};

export default useRecruiterUtils;