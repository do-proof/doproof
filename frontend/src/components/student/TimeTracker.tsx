import React, { useState } from 'react';
import { useTimeTracking } from '../../hooks/student/useTimeTracking';
import { useNotifications } from '../../context/NotificationContext';

interface TimeTrackerProps {
  submissionId: string;
  applicationId: string;
  initialTimeSpent?: number;
  className?: string;
  showControls?: boolean;
  compact?: boolean;
  onSync?: (timeSpent: number) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  submissionId,
  applicationId,
  initialTimeSpent = 0,
  className = '',
  showControls = true,
  compact = false,
  onSync
}) => {
  const { showSuccess, showError } = useNotifications();
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);

  const {
    isActive,
    formattedTime,
    timeInMinutes,
    lastSyncTime,
    start,
    pause,
    reset,
    sync,
    isSyncing
  } = useTimeTracking({
    submissionId,
    applicationId,
    initialTimeSpent,
    autoSyncInterval: 60000, // Sync every minute
    onSync: (timeSpent) => {
      setLastSyncStatus('success');
      if (onSync) {
        onSync(timeSpent);
      }
      setTimeout(() => setLastSyncStatus(null), 3000);
    },
    onError: (error) => {
      setLastSyncStatus('error');
      showError('Failed to sync time tracking. Your progress may not be saved.', 'Sync Error');
      setTimeout(() => setLastSyncStatus(null), 5000);
    }
  });

  const handleStartPause = () => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the timer? This will clear all tracked time.')) {
      reset();
    }
  };

  const handleManualSync = () => {
    sync();
    showSuccess('Time tracking synced successfully', 'Synced');
  };

  const getTimeSinceLastSync = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{formattedTime}</span>
        </div>
        {isActive && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
        {isSyncing && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700">Time Tracker</h3>
        </div>
        {isActive && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 font-mono tracking-wider">
          {formattedTime}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {timeInMinutes} minutes tracked
        </div>
      </div>

      {showControls && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={handleStartPause}
              className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              aria-label={isActive ? 'Pause timer' : 'Start timer'}
            >
              {isActive ? (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start
                </span>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium text-sm transition-colors"
              aria-label="Reset timer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              {lastSyncStatus === 'success' && (
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {lastSyncStatus === 'error' && (
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-gray-500">
                Last sync: {getTimeSinceLastSync()}
              </span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sync now"
            >
              {isSyncing ? (
                <span className="flex items-center">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
                  Syncing...
                </span>
              ) : (
                'Sync now'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
