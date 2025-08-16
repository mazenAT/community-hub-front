import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

interface DeepLinkData {
  token?: string;
  email?: string;
  screen?: string;
}

export const useDeepLinking = () => {
  const navigate = useNavigate();
  const [deepLinkData, setDeepLinkData] = useState<DeepLinkData | null>(null);

  useEffect(() => {
    // Handle deep links when app is opened
    const handleDeepLink = () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      // Check if app was opened via deep link
      const url = window.location.href;
      
      if (url.includes('smartcommunity://')) {
        try {
          // Parse the deep link URL
          const urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);
          
          const data: DeepLinkData = {
            token: params.get('token') || undefined,
            email: params.get('email') || undefined,
            screen: urlObj.pathname.replace('/', '') || undefined
          };

          setDeepLinkData(data);
          
          // Handle different deep link screens
          if (data.screen === 'reset-password' && data.token && data.email) {
            // Navigate to reset password screen with data
            navigate('/reset-password', { 
              state: { 
                token: data.token, 
                email: data.email 
              } 
            });
          } else if (data.screen === 'wallet') {
            // Navigate to wallet screen
            navigate('/wallet');
          } else if (data.screen === 'planner') {
            // Navigate to planner screen
            navigate('/planner');
          } else if (data.screen === 'profile') {
            // Navigate to profile screen
            navigate('/profile');
          }
          
          // Clear the deep link data after handling
          setDeepLinkData(null);
          
        } catch (error) {
          console.error('Error parsing deep link:', error);
        }
      }
    };

    // Handle deep links on app launch
    handleDeepLink();

    // Listen for deep link events when app is already running
    const handleUrlChange = () => {
      handleDeepLink();
    };

    // Add event listener for URL changes
    window.addEventListener('popstate', handleUrlChange);
    
    // For Android, listen to app state changes
    if (Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // App came to foreground, check for deep links
          setTimeout(handleDeepLink, 100);
        }
      });
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [navigate]);

  // Function to manually handle deep link data
  const handleDeepLinkData = (data: DeepLinkData) => {
    setDeepLinkData(data);
    
    if (data.screen === 'reset-password' && data.token && data.email) {
      navigate('/reset-password', { 
        state: { 
          token: data.token, 
          email: data.email 
        } 
      });
    }
  };

  return {
    deepLinkData,
    handleDeepLinkData
  };
};

export default useDeepLinking; 