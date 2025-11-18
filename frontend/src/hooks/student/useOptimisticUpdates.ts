import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applicationKeys, StudentApplication } from './useApplications';
import { submissionKeys, TaskSubmission } from './useTaskSubmissions';
import { notificationKeys } from './useNotifications';

export interface OptimisticUpdate<T> {
  queryKey: any[];
  updater: (oldData: T | undefined) => T | undefined;
  rollback?: (oldData: T | undefined) => void;
}

export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  // Optimistically update application status
  const optimisticApplicationUpdate = useCallback((
    applicationId: string,
    updates: Partial<StudentApplication>
  ) => {
    const previousData = queryClient.getQueryData(applicationKeys.detail(applicationId));

    // Update detail cache
    queryClient.setQueryData(
      applicationKeys.detail(applicationId),
      (old: StudentApplication | undefined) => {
        if (!old) return old;
        return {
          ...old,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
    );

    // Update lists cache
    queryClient.setQueriesData(
      { queryKey: applicationKeys.lists() },
      (oldData: any) => {
        if (!oldData?.applications) return oldData;

        return {
          ...oldData,
          applications: oldData.applications.map((app: StudentApplication) =>
            app._id === applicationId
              ? { ...app, ...updates, updated_at: new Date().toISOString() }
              : app
          )
        };
      }
    );

    // Return rollback function
    return () => {
      queryClient.setQueryData(applicationKeys.detail(applicationId), previousData);
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    };
  }, [queryClient]);

  // Optimistically update submission
  const optimisticSubmissionUpdate = useCallback((
    submissionId: string,
    updates: Partial<TaskSubmission>
  ) => {
    const previousData = queryClient.getQueryData(submissionKeys.detail(submissionId));

    // Update detail cache
    queryClient.setQueryData(
      submissionKeys.detail(submissionId),
      (old: TaskSubmission | undefined) => {
        if (!old) return old;
        return {
          ...old,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
    );

    // Update lists cache
    queryClient.setQueriesData(
      { queryKey: submissionKeys.lists() },
      (oldData: any) => {
        if (!oldData?.submissions) return oldData;

        return {
          ...oldData,
          submissions: oldData.submissions.map((sub: TaskSubmission) =>
            sub._id === submissionId
              ? { ...sub, ...updates, updated_at: new Date().toISOString() }
              : sub
          )
        };
      }
    );

    // Return rollback function
    return () => {
      queryClient.setQueryData(submissionKeys.detail(submissionId), previousData);
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
    };
  }, [queryClient]);

  // Optimistically mark notification as read
  const optimisticMarkNotificationRead = useCallback((notificationId: string) => {
    // Update lists cache
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: any) => {
        if (!oldData?.notifications) return oldData;

        return {
          ...oldData,
          notifications: oldData.notifications.map((notif: any) =>
            notif._id === notificationId
              ? { ...notif, read: true, read_at: new Date().toISOString() }
              : notif
          ),
          unread_count: Math.max(0, oldData.unread_count - 1)
        };
      }
    );

    // Update stats cache
    queryClient.setQueryData(
      notificationKeys.stats(),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          unread_count: Math.max(0, old.unread_count - 1)
        };
      }
    );

    // Return rollback function
    return () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    };
  }, [queryClient]);

  // Optimistically add new notification
  const optimisticAddNotification = useCallback((notification: any) => {
    // Update lists cache
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications],
          total: oldData.total + 1,
          unread_count: oldData.unread_count + 1
        };
      }
    );

    // Update stats cache
    queryClient.setQueryData(
      notificationKeys.stats(),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          total_count: old.total_count + 1,
          unread_count: old.unread_count + 1
        };
      }
    );

    // Return rollback function
    return () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    };
  }, [queryClient]);

  // Optimistically update time tracking
  const optimisticTimeUpdate = useCallback((
    submissionId: string,
    applicationId: string,
    timeSpent: number
  ) => {
    const submissionRollback = optimisticSubmissionUpdate(submissionId, {
      time_spent: timeSpent
    });

    const applicationRollback = optimisticApplicationUpdate(applicationId, {
      time_spent: timeSpent,
      progress: {
        time_spent: timeSpent,
        last_activity: new Date().toISOString(),
        completion_percentage: 0 // This should be calculated
      }
    });

    // Return combined rollback function
    return () => {
      submissionRollback();
      applicationRollback();
    };
  }, [optimisticSubmissionUpdate, optimisticApplicationUpdate]);

  // Generic optimistic update
  const optimisticUpdate = useCallback(<T,>(
    queryKey: any[],
    updater: (oldData: T | undefined) => T | undefined
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey);

    queryClient.setQueryData<T>(queryKey, updater);

    // Return rollback function
    return () => {
      queryClient.setQueryData(queryKey, previousData);
    };
  }, [queryClient]);

  return {
    optimisticApplicationUpdate,
    optimisticSubmissionUpdate,
    optimisticMarkNotificationRead,
    optimisticAddNotification,
    optimisticTimeUpdate,
    optimisticUpdate
  };
};

export default useOptimisticUpdates;
