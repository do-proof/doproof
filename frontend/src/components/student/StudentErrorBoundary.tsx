import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

interface StudentErrorBoundaryProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const StudentErrorBoundary: React.FC<StudentErrorBoundaryProps> = ({ 
  children, 
  pageTitle = 'Student Page' 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error for monitoring
    if (window.console && console.error) {
      console.error(`Error in ${pageTitle}:`, error, errorInfo);
    }
    
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { 
    //   tags: { page: pageTitle },
    //   contexts: { react: errorInfo }
    // });
  };

  const customFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We encountered an error while loading {pageTitle}. Don't worry, your data is safe.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reload Page
          </button>
          
          <button
            onClick={() => window.location.href = '/student-dashboard'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={customFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default StudentErrorBoundary;

