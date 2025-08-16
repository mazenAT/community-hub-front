import React from 'react';
import { useMobileNetwork } from '@/hooks/useMobileNetwork';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const MobileNetworkStatus: React.FC = () => {
  const { isOnline, lastSeen } = useMobileNetwork();

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 flex items-center justify-center space-x-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline</span>
      {lastSeen && (
        <span className="text-xs opacity-80">
          Last seen: {new Date(lastSeen).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default MobileNetworkStatus; 