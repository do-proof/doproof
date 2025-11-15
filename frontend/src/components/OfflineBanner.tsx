import React, { useEffect, useState } from 'react';
import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { useNotifications } from '../context/NotificationContext';

const OfflineBanner: React.FC = () => {
  const { isOffline, wasOffline } = useOfflineDetection();
  const { showInfo, showSuccess } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowBanner(true);
      showInfo('You are currently offline. Some features may not be available.', 'Offline Mode', 0);
    } else if (wasOffline) {
      setShowBanner(false);
      showSuccess('Connection restored. Your data will sync automatically.', 'Back Online', 5000);
    }
  }, [isOffline, wasOffline, showInfo, showSuccess]);

  if (!showBanner || !isOffline) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-yellow-400 mr-2"
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
          <p className="text-sm text-yellow-800">
            <span className="font-medium">You're offline.</span>
            <span className="ml-1">Some features may not be available until you reconnect.</span>
          </p>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-yellow-400 hover:text-yellow-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;

