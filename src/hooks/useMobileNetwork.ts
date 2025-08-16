import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastSeen: Date | null;
}

export const useMobileNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastSeen: navigator.onLine ? new Date() : null,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        lastSeen: new Date(),
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      lastSeen: navigator.onLine ? new Date() : prev.lastSeen,
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkStatus;
};

export default useMobileNetwork; 