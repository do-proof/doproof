import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { isConnected, connectionStatus } = useWebSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {connectionStatus === 'connected' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;

