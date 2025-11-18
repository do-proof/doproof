import React, { useEffect, useState } from 'react';
import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { useNotifications } from '../context/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';

interface NetworkStatusHandlerProps {
  onOnline?: () => void;
  onOffline?: () => void;
  showNotifications?: boolean;
  autoRefetch?: boolean;
}

/**
 * Component to handle network status changes and provide appropriate feedback
 */
const NetworkStatusHandler: React.FC<NetworkStatusHandlerProps> = ({
  onOnline,
  onOffline,
  showNotifications = true,
  autoRefetch = true
}) => {
  const { isOffline, wasOffline } = useOfflineDetection();
  const { showInfo, showSuccess, showWarning } = useNotifications();
  const queryClient = useQueryClient();
  const [hasShownOfflineNotification, setHasShownOfflineNotification] = useState(false);

  useEffect(() => {
    if (isOffline && !hasShownOfflineNotification) {
      // User went offline
      setHasShownOfflineNotification(true);
      
      if (showNotifications) {
        showWarning(
          'You are currently offline. Some features may not be available.',
          'Offline Mode',
          0 // Persistent notification
        );
      }
      
      if (onOffline) {
        onOffline();
      }
    } else if (!isOffline && wasOffline) {
      // User came back online
      setHasShownOfflineNotification(false);
      
      if (showNotifications) {
        showSuccess(
          'Connection restored. Your data will sync automatically.',
          'Back Online',
          5000
        );
      }
      
      // Refetch all queries to sync data
      if (autoRefetch) {
        queryClient.refetchQueries({ type: 'active' });
      }
      
      if (onOnline) {
        onOnline();
      }
    }
  }, [
    isOffline, 
    wasOffline, 
    hasShownOfflineNotification,
    showNotifications,
    showInfo,
    showSuccess,
    showWarning,
    onOnline,
    onOffline,
    autoRefetch,
    queryClient
  ]);

  // This component doesn't render anything
  return null;
};

/**
 * Hook to get network status and handlers
 */
export const useNetworkStatus = () => {
  const { isOnline, isOffline, wasOffline } = useOfflineDetection();
  const queryClient = useQueryClient();

  const refetchOnReconnect = () => {
    if (isOnline) {
      queryClient.refetchQueries({ type: 'active' });
    }
  };

  const invalidateOnReconnect = () => {
    if (isOnline) {
      queryClient.invalidateQueries();
    }
  };

  return {
    isOnline,
    isOffline,
    wasOffline,
    refetchOnReconnect,
    invalidateOnReconnect
  };
};

export default NetworkStatusHandler;
