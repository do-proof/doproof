import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { useUpdateApplicationProgress } from './useApplications';
import { useUpdateTaskSubmission } from './useTaskSubmissions';

export interface TimeTrackingSession {
  submissionId: string;
  applicationId: string;
  startTime: Date;
  elapsedTime: number; // in seconds
  isActive: boolean;
  lastSyncTime: Date;
}

interface UseTimeTrackingOptions {
  submissionId: string;
  applicationId: string;
  initialTimeSpent?: number; // in minutes
  autoSyncInterval?: number; // in milliseconds, default 60000 (1 minute)
  onSync?: (timeSpent: number) => void;
  onError?: (error: Error) => void;
}

export const useTimeTracking = ({
  submissionId,
  applicationId,
  initialTimeSpent = 0,
  autoSyncInterval = 60000, // 1 minute
  onSync,
  onError
}: UseTimeTrackingOptions) => {
  const [session, setSession] = useState<TimeTrackingSession>({
    submissionId,
    applicationId,
    startTime: new Date(),
    elapsedTime: initialTimeSpent * 60, // Convert minutes to seconds
    isActive: false,
    lastSyncTime: new Date()
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage } = useWebSocket();
  const updateApplicationProgress = useUpdateApplicationProgress();
  const updateTaskSubmission = useUpdateTaskSubmission();

  // Start tracking
  const start = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date()
    }));

    // Start interval to update elapsed time every second
    intervalRef.current = setInterval(() => {
      setSession(prev => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1
      }));
    }, 1000);

    // Start auto-sync interval
    syncIntervalRef.current = setInterval(() => {
      syncTimeToServer();
    }, autoSyncInterval);
  }, [autoSyncInterval]);

  // Pause tracking
  const pause = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isActive: false
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Sync when pausing
    syncTimeToServer();
  }, []);

  // Reset tracking
  const reset = useCallback(() => {
    setSession(prev => ({
      ...prev,
      elapsedTime: 0,
      isActive: false,
      startTime: new Date()
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Sync time to server
  const syncTimeToServer = useCallback(async () => {
    const timeSpentMinutes = Math.floor(session.elapsedTime / 60);

    try {
      // Update application progress
      await updateApplicationProgress.mutateAsync({
        applicationId: session.applicationId,
        timeSpent: timeSpentMinutes,
        completionPercentage: 0 // This should be calculated based on actual progress
      });

      // Update task submission
      await updateTaskSubmission.mutateAsync({
        submissionId: session.submissionId,
        data: {
          time_spent: timeSpentMinutes
        }
      });

      // Send real-time update via WebSocket
      sendMessage({
        type: 'time_tracking_update',
        data: {
          submission_id: session.submissionId,
          time_spent: timeSpentMinutes,
          last_activity: new Date().toISOString()
        }
      });

      setSession(prev => ({
        ...prev,
        lastSyncTime: new Date()
      }));

      if (onSync) {
        onSync(timeSpentMinutes);
      }
    } catch (error) {
      console.error('Failed to sync time tracking:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [session, updateApplicationProgress, updateTaskSubmission, sendMessage, onSync, onError]);

  // Manual sync
  const sync = useCallback(() => {
    syncTimeToServer();
  }, [syncTimeToServer]);

  // Format elapsed time as HH:MM:SS
  const getFormattedTime = useCallback(() => {
    const hours = Math.floor(session.elapsedTime / 3600);
    const minutes = Math.floor((session.elapsedTime % 3600) / 60);
    const seconds = session.elapsedTime % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [session.elapsedTime]);

  // Get time in minutes
  const getTimeInMinutes = useCallback(() => {
    return Math.floor(session.elapsedTime / 60);
  }, [session.elapsedTime]);

  // Get time in hours
  const getTimeInHours = useCallback(() => {
    return (session.elapsedTime / 3600).toFixed(2);
  }, [session.elapsedTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      // Final sync before unmount
      if (session.isActive) {
        syncTimeToServer();
      }
    };
  }, [session.isActive, syncTimeToServer]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && session.isActive) {
        pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session.isActive, pause]);

  return {
    session,
    isActive: session.isActive,
    elapsedTime: session.elapsedTime,
    formattedTime: getFormattedTime(),
    timeInMinutes: getTimeInMinutes(),
    timeInHours: getTimeInHours(),
    lastSyncTime: session.lastSyncTime,
    start,
    pause,
    reset,
    sync,
    isSyncing: updateApplicationProgress.isPending || updateTaskSubmission.isPending
  };
};

export default useTimeTracking;
