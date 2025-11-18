import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
  className?: string;
}

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  transparent = false,
  className = ''
}) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent ? 'bg-black bg-opacity-30' : 'bg-white bg-opacity-90'
      } ${className}`}
    >
      <div className="text-center">
        <LoadingSpinner size="xl" />
        {message && (
          <p className="mt-4 text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Inline loading indicator
 */
export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message,
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <LoadingSpinner size={size} text={message} />
    </div>
  );
};

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Button with loading state
 */
export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
  loadingText,
  disabled,
  className = '',
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center ${className} ${
        loading || disabled ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

interface SectionLoadingProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Loading state for a section of the page
 */
export const SectionLoading: React.FC<SectionLoadingProps> = ({
  title = 'Loading',
  message,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

/**
 * Progress bar component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{clampedProgress.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

interface PulsingDotProps {
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Pulsing dot indicator for live/active states
 */
export const PulsingDot: React.FC<PulsingDotProps> = ({
  color = 'green',
  size = 'md',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <span className={`relative flex ${sizeClasses[size]} ${className}`}>
      <span 
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`}
      />
      <span 
        className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      />
    </span>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for when there's no data
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="text-6xl mb-4">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default {
  LoadingOverlay,
  InlineLoading,
  ButtonLoading,
  SectionLoading,
  ProgressBar,
  PulsingDot,
  EmptyState
};
