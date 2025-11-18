import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

interface RealtimeStatusBannerProps {
  className?: string;
  showWhenConnected?: boolean;
}

const RealtimeStatusBanner: React.FC<RealtimeStatusBannerProps> = ({
  className = '',
  showWhenConnected = false
}) => {
  const { isConnected, connectionStatus } = useWebSocket();

  // Don't show banner when connected unless explicitly requested
  if (connectionStatus === 'connected' && !showWhenConnected) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-500',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          title: 'Real-time updates active',
          message: 'You will receive instant notifications for application updates and evaluations.'
        };
      case 'connecting':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          icon: (
            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          ),
          title: 'Connecting to real-time updates...',
          message: 'Establishing connection for live notifications.'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          title: 'Connection error',
          message: 'Unable to connect to real-time updates. Please refresh the page or check your connection.'
        };
      default: // disconnected
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-500',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          title: 'Real-time updates disconnected',
          message: 'You may not receive instant notifications. Refresh the page to reconnect.'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>
            {config.title}
          </h3>
          <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeStatusBanner;
