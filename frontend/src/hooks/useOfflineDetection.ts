import { useState, useEffect } from 'react';

interface UseOfflineDetectionReturn {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean; // True if user was offline and just came back online
}

/**
 * Hook to detect online/offline status and network connectivity
 */
export const useOfflineDetection = (): UseOfflineDetectionReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      if (!isOnline) {
        setWasOffline(true);
        // Reset after a short delay
        setTimeout(() => setWasOffline(false), 3000);
      }
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check network status via fetch
    const checkNetworkStatus = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Check network status periodically
    const networkCheckInterval = setInterval(checkNetworkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  };
};

export default useOfflineDetection;

