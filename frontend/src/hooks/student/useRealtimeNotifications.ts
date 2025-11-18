import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket, RealtimeNotification } from '../../context/WebSocketContext';
import { notificationKeys } from './useNotifications';

interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: RealtimeNotification) => void;
  autoMarkAsRead?: boolean;
}

export const useRealtimeNotifications = ({
  enabled = true,
  onNotification,
  autoMarkAsRead = false
}: UseRealtimeNotificationsOptions = {}) => {
  const queryClient = useQueryClient();
  const { setOnRealtimeNotification, markNotificationAsRead, isConnected } = useWebSocket();

  const handleRealtimeNotification = useCallback((notification: RealtimeNotification) => {
    console.log('Received real-time notification:', notification);

    // Update notification cache - add to the beginning of the list
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: any) => {
        if (!oldData) return oldData;

        const newNotification = {
          _id: notification.id,
          user_id: '', // Will be filled by the server
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false,
          read_at: null,
          created_at: notification.created_at,
          expires_at: null
        };

        return {
          ...oldData,
          notifications: [newNotification, ...oldData.notifications],
          total: oldData.total + 1,
          unread_count: oldData.unread_count + 1
        };
      }
    );

    // Invalidate notification stats to refresh counts
    queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });

    // Auto-mark as read if enabled
    if (autoMarkAsRead) {
      setTimeout(() => {
        markNotificationAsRead(notification.id);
      }, 3000); // Mark as read after 3 seconds
    }

    // Call custom handler if provided
    if (onNotification) {
      onNotification(notification);
    }
  }, [queryClient, markNotificationAsRead, autoMarkAsRead, onNotification]);

  // Register the handler with WebSocket context
  useEffect(() => {
    if (enabled) {
      setOnRealtimeNotification(handleRealtimeNotification);
    } else {
      setOnRealtimeNotification(undefined);
    }

    return () => {
      setOnRealtimeNotification(undefined);
    };
  }, [enabled, handleRealtimeNotification, setOnRealtimeNotification]);

  return {
    isConnected,
    isEnabled: enabled,
    markAsRead: markNotificationAsRead
  };
};

export default useRealtimeNotifications;
