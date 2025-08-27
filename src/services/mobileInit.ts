import { Capacitor } from '@capacitor/core';
import { setupPushNotifications } from './native';
import { mobileUtils } from './native';

export const initializeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Initialize push notifications
    await setupPushNotifications();
    
    // Get device info for logging
    const deviceInfo = mobileUtils.getDeviceInfo();
    
    // Set up app state change listener
    mobileUtils.onAppStateChange((state) => {
      // App state change handled silently
    });

    // Check network status
    const networkStatus = await mobileUtils.checkNetworkStatus();
    
    // Mobile app initialized successfully
  } catch (error) {
    // Silent fail for mobile features
  }
};

export default initializeMobileApp; 