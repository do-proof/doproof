// Enhanced API utility with comprehensive error handling

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  field?: string; // For validation errors
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(baseURL: string = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.defaultTimeout = 10000; // 10 seconds
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkNetworkStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private parseError(error: any, status: number): ApiError {
    // Handle different error response formats
    if (error?.detail) {
      // FastAPI validation error format
      if (Array.isArray(error.detail)) {
        const validationErrors = error.detail.map((err: any) => ({
          field: err.loc?.join('.'),
          message: err.msg
        }));
        return {
          message: 'Validation failed',
          status,
          code: 'VALIDATION_ERROR',
          details: validationErrors
        };
      }
      
      // Simple detail message
      return {
        message: error.detail,
        status,
        code: error.code
      };
    }

    // Handle other error formats
    if (error?.message) {
      return {
        message: error.message,
        status,
        code: error.code
      };
    }

    // Default error messages based on status
    const defaultMessages: Record<number, string> = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'Conflict. The resource already exists or is in use.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Internal server error. Please try again later.',
      502: 'Service temporarily unavailable. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
      504: 'Request timeout. Please try again.'
    };

    return {
      message: defaultMessages[status] || 'An unexpected error occurred.',
      status,
      code: `HTTP_${status}`
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 3,
      retryDelay = 1000
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...headers
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle successful responses
        if (response.ok) {
          let data: T;
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text() as unknown as T;
          }

          return { data, success: true };
        }

        // Handle error responses
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const apiError = this.parseError(errorData, response.status);

        // Don't retry for client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return { error: apiError, success: false };
        }

        lastError = apiError;

        // Wait before retrying (with exponential backoff)
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }

      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = {
              message: 'Request timeout. Please check your connection and try again.',
              status: 408,
              code: 'TIMEOUT'
            };
          } else if (error.message.includes('Failed to fetch')) {
            lastError = {
              message: 'Network error. Please check your internet connection.',
              status: 0,
              code: 'NETWORK_ERROR'
            };
          } else {
            lastError = {
              message: error.message,
              status: 0,
              code: 'UNKNOWN_ERROR'
            };
          }
        } else {
          lastError = {
            message: 'An unexpected error occurred.',
            status: 0,
            code: 'UNKNOWN_ERROR'
          };
        }

        // Wait before retrying
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    return { error: lastError!, success: false };
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // File upload with progress
  async uploadFile<T>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ data, success: true });
          } catch {
            resolve({ data: xhr.responseText as unknown as T, success: true });
          }
        } else {
          let errorData: any;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = { message: xhr.statusText };
          }
          
          const error = this.parseError(errorData, xhr.status);
          resolve({ error, success: false });
        }
      });

      xhr.addEventListener('error', () => {
        const error: ApiError = {
          message: 'Upload failed. Please try again.',
          status: 0,
          code: 'UPLOAD_ERROR'
        };
        resolve({ error, success: false });
      });

      xhr.addEventListener('timeout', () => {
        const error: ApiError = {
          message: 'Upload timeout. Please try again.',
          status: 408,
          code: 'TIMEOUT'
        };
        resolve({ error, success: false });
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth header
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.timeout = 60000; // 60 seconds for file uploads
      xhr.send(formData);
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Convenience functions
export const api = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.get<T>(endpoint, config),
  
  post: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.post<T>(endpoint, body, config),
  
  put: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.put<T>(endpoint, body, config),
  
  patch: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.patch<T>(endpoint, body, config),
  
  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.delete<T>(endpoint, config),
  
  upload: <T>(endpoint: string, file: File, onProgress?: (progress: number) => void) => 
    apiClient.uploadFile<T>(endpoint, file, onProgress)
};

export default api;