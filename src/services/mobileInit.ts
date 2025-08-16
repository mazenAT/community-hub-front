import { Capacitor } from '@capacitor/core';
import { setupPushNotifications } from './native';
import { mobileUtils } from './native';

export const initializeMobileApp = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Running in web mode');
    return;
  }

  console.log('Initializing mobile app...');

  try {
    // Initialize push notifications
    await setupPushNotifications();
    
    // Get device info for logging
    const deviceInfo = mobileUtils.getDeviceInfo();
    console.log('Device info:', deviceInfo);
    
    // Set up app state change listener
    mobileUtils.onAppStateChange((state) => {
      console.log('App state changed:', state);
    });

    // Check network status
    const networkStatus = await mobileUtils.checkNetworkStatus();
    console.log('Network status:', networkStatus);

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile app:', error);
  }
};

export default initializeMobileApp; 