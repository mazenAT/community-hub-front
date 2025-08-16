import { useState, useEffect } from 'react';
import { mobileUtils } from '../services/native';

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
    const updateNetworkStatus = async () => {
      try {
        const status = await mobileUtils.checkNetworkStatus();
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: status.isOnline,
          lastSeen: status.isOnline ? new Date() : prev.lastSeen,
        }));
      } catch (error) {
        console.error('Error checking network status:', error);
      }
    };

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

    // Initial check
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for mobile devices
    const interval = setInterval(updateNetworkStatus, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return networkStatus;
};

export default useMobileNetwork; 