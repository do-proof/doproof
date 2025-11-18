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

    // Send to your own error tracking endpoint
    if (this.enabled) {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(log),
        // Use keepalive to ensure the request completes even if the page is closing
        keepalive: true
      }).catch((error) => {
        // Silently fail if error tracking is unavailable
        console.warn('Failed to send error to tracking service:', error);
      });
    }
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(limit: number = 10): ErrorLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get all logs from localStorage
   */
  getAllStoredLogs(): ErrorLog[] {
    try {
      const storedLogs = localStorage.getItem('errorLogs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored error logs:', error);
      return [];
    }
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

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    const allLogs = this.getAllStoredLogs();
    return JSON.stringify(allLogs, null, 2);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    recentErrors: number;
  } {
    const allLogs = this.getAllStoredLogs();
    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);

    const byType: Record<string, number> = {};
    let recentErrors = 0;

    allLogs.forEach(log => {
      byType[log.errorType] = (byType[log.errorType] || 0) + 1;
      
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= oneHourAgo) {
        recentErrors++;
      }
    });

    return {
      total: allLogs.length,
      byType,
      recentErrors
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();
export default errorLogger;

