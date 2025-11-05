import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useErrorHandler } from '../useErrorHandler';

// Types for notifications
export interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface NotificationsResponse {
  notifications: NotificationData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  unread_count: number;
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  type_counts: Record<string, number>;
  recent_count: number;
}

export interface NotificationFilters {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
  notification_type?: string;
}

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// Hook to get notifications
export const useNotifications = (filters: NotificationFilters = {}) => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.unread_only) params.append('unread_only', 'true');
      if (filters.notification_type) params.append('notification_type', filters.notification_type);

      const response = await api.get<NotificationsResponse>(`/api/notifications?${params.toString()}`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook to get notification statistics
export const useNotificationStats = () => {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: async (): Promise<NotificationStats> => {
      const response = await api.get<NotificationStats>('/api/notifications/stats');

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook to mark notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<NotificationData> => {
      const response = await api.patch<NotificationData>(`/api/notifications/${notificationId}/read`);

      if (!response.success) {
        throw response.error;
      }

      return response.data!;
    },
    onSuccess: (updatedNotification) => {
      // Update all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      // Update specific notification in cache
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map(notification =>
              notification.id === updatedNotification.id ? updatedNotification : notification
            ),
            unread_count: Math.max(0, oldData.unread_count - 1)
          };
        }
      );
    },
    onError: handleError,
  });
};

// Hook to mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.patch('/api/notifications/mark-all-read');

      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      // Update unread count to 0 in all cached data
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map(notification => ({
              ...notification,
              read: true,
              read_at: new Date().toISOString()
            })),
            unread_count: 0
          };
        }
      );
    },
    onError: handleError,
  });
};

// Hook to delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const response = await api.delete(`/api/notifications/${notificationId}`);

      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: (_, notificationId) => {
      // Remove notification from all cached queries
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          const deletedNotification = oldData.notifications.find(n => n.id === notificationId);
          const wasUnread = deletedNotification && !deletedNotification.read;
          
          return {
            ...oldData,
            notifications: oldData.notifications.filter(notification => notification.id !== notificationId),
            total: oldData.total - 1,
            unread_count: wasUnread ? Math.max(0, oldData.unread_count - 1) : oldData.unread_count
          };
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
    onError: handleError,
  });
};

// Hook to clear all notifications
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.delete('/api/notifications/clear-all');

      if (!response.success) {
        throw response.error;
      }
    },
    onSuccess: () => {
      // Clear all notification data
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: NotificationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: [],
            total: 0,
            unread_count: 0
          };
        }
      );
      
      // Update stats
      queryClient.setQueryData(notificationKeys.stats(), {
        total_count: 0,
        unread_count: 0,
        type_counts: {},
        recent_count: 0
      });
    },
    onError: handleError,
  });
};

// Hook for real-time notifications (WebSocket)
export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();
  const { showInfo, showSuccess, showWarning, showError } = useNotifications();

  // This would be implemented with WebSocket connection
  // For now, we'll use polling as a fallback
  const startPolling = () => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  };

  // Handle incoming real-time notification
  const handleRealtimeNotification = (notification: NotificationData) => {
    // Add to cache
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: NotificationsResponse | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications],
          total: oldData.total + 1,
          unread_count: oldData.unread_count + 1
        };
      }
    );

    // Show toast notification based on type
    switch (notification.type) {
      case 'deadline_reminder':
        showWarning(notification.message, notification.title, 0);
        break;
      case 'evaluation_result':
        showSuccess(notification.message, notification.title);
        break;
      case 'recruiter_update':
        showInfo(notification.message, notification.title);
        break;
      case 'new_recommendation':
        showInfo(notification.message, notification.title);
        break;
      default:
        showInfo(notification.message, notification.title);
    }
  };

  return {
    startPolling,
    handleRealtimeNotification
  };
};

// Utility functions
export const getNotificationTypeLabel = (type: string): string => {
  const labels = {
    deadline_reminder: 'Deadline Reminder',
    evaluation_result: 'Evaluation Result',
    recruiter_update: 'Recruiter Update',
    new_recommendation: 'New Recommendation',
    system_update: 'System Update',
  };
  return labels[type as keyof typeof labels] || 'Notification';
};

export const getNotificationPriority = (type: string, data: Record<string, any>): 'low' | 'medium' | 'high' => {
  switch (type) {
    case 'deadline_reminder':
      return data.urgency === 'urgent' ? 'high' : 'medium';
    case 'evaluation_result':
      return 'medium';
    case 'recruiter_update':
      return data.decision === 'shortlist' ? 'high' : 'medium';
    case 'new_recommendation':
      return data.match_score > 90 ? 'high' : 'low';
    default:
      return 'low';
  }
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Combined hook for notification management
export const useNotificationManager = (filters: NotificationFilters = {}) => {
  const notificationsQuery = useNotifications(filters);
  const statsQuery = useNotificationStats();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();
  const realtime = useRealtimeNotifications();

  return {
    // Data
    data: notificationsQuery.data,
    stats: statsQuery.data,
    isLoading: notificationsQuery.isLoading || statsQuery.isLoading,
    error: notificationsQuery.error || statsQuery.error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications: clearAll,
    
    // Real-time
    startPolling: realtime.startPolling,
    handleRealtimeNotification: realtime.handleRealtimeNotification,
    
    // Refetch
    refetch: () => {
      notificationsQuery.refetch();
      statsQuery.refetch();
    }
  };
};

export default useNotifications;