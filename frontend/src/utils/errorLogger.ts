/**
 * Error logging utility for client-side error tracking
 */

interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  errorType: 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private enabled = process.env.NODE_ENV === 'production';

  /**
   * Log an error
   */
  logError(
    error: Error | string,
    context?: {
      componentStack?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' && error.stack ? error.stack : undefined,
      componentStack: context?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      errorType: 'error',
      metadata: context?.metadata
    };

    this.addLog(errorLog);

    // In production, send to error tracking service
    if (this.enabled) {
      this.sendToErrorTracking(errorLog);
    } else {
      // In development, log to console
      console.error('Error logged:', errorLog);
    }
  }

  /**
   * Log a warning
   */
  logWarning(
    message: string,
    context?: {
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const errorLog: ErrorLog = {
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      errorType: 'warning',
      metadata: context?.metadata
    };

    this.addLog(errorLog);

    if (this.enabled) {
      this.sendToErrorTracking(errorLog);
    } else {
      console.warn('Warning logged:', errorLog);
    }
  }

  /**
   * Log an info message
   */
  logInfo(
    message: string,
    context?: {
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const errorLog: ErrorLog = {
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      errorType: 'info',
      metadata: context?.metadata
    };

    this.addLog(errorLog);

    if (this.enabled) {
      this.sendToErrorTracking(errorLog);
    } else {
      console.info('Info logged:', errorLog);
    }
  }

  /**
   * Add log to in-memory storage
   */
  private addLog(log: ErrorLog): void {
    this.logs.push(log);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for persistence across sessions
    try {
      const storedLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      storedLogs.push(log);
      
      // Keep only last 50 logs in localStorage
      const recentLogs = storedLogs.slice(-50);
      localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
    } catch (error) {
      // localStorage might be full or unavailable
      console.warn('Failed to store error log:', error);
    }
  }

  /**
   * Send error to error tracking service (e.g., Sentry, LogRocket)
   */
  private sendToErrorTracking(log: ErrorLog): void {
    // Example integration with error tracking service
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(log.message), {
    //     contexts: {
    //       react: {
    //         componentStack: log.componentStack
    //       }
    //     },
    //     tags: {
    //       errorType: log.errorType
    //     },
    //     user: {
    //       id: log.userId
    //     },
    //     extra: log.metadata
    //   });
    // }

    // Or send to your own error tracking endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(log)
    // }).catch(() => {
    //   // Silently fail if error tracking is unavailable
    // });
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(limit: number = 10): ErrorLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('errorLogs');
    } catch (error) {
      console.warn('Failed to clear error logs:', error);
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();
export default errorLogger;

