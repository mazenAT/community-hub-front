import { Capacitor } from '@capacitor/core';
// import { setupPushNotifications } from './native'; // Disabled - not implemented yet
import { mobileUtils } from './native';

export const initializeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Push notifications disabled - not implemented yet
    // await setupPushNotifications();
    
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