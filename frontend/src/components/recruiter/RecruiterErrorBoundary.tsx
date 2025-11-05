import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import RecruiterLayout from './RecruiterLayout';

interface RecruiterErrorBoundaryProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const RecruiterErrorFallback: React.FC<{ pageTitle?: string }> = ({ pageTitle }) => (
  <RecruiterLayout pageTitle={pageTitle || 'Error'}>
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
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
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Page Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This page encountered an error. Please try refreshing or navigate to another page.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="btn-outline"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  </RecruiterLayout>
);

const RecruiterErrorBoundary: React.FC<RecruiterErrorBoundaryProps> = ({ 
  children, 
  pageTitle 
}) => {
  return (
    <ErrorBoundary
      fallback={<RecruiterErrorFallback pageTitle={pageTitle} />}
      onError={(error, errorInfo) => {
        // Log recruiter-specific errors
        console.error('Recruiter page error:', error, errorInfo);
        
        // In production, send to error tracking service
        // Example: trackRecruiterError(error, errorInfo, pageTitle);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RecruiterErrorBoundary;