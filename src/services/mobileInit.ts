import { Capacitor } from '@capacitor/core';
import { setupPushNotifications } from './native';
import { mobileApi } from './api';
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
    
    // Get device info for analytics
    const deviceInfo = mobileUtils.getDeviceInfo();
    
    // Track app launch event
    await mobileApi.trackMobileEvent({
      event: 'app_launch',
      properties: {
        platform: deviceInfo.platform,
        timestamp: new Date().toISOString(),
        version: '1.0.0', // You can get this from package.json
      },
    });

    // Set up app state change listener
    mobileUtils.onAppStateChange((state) => {
      console.log('App state changed:', state);
      // Track app state changes for analytics
      mobileApi.trackMobileEvent({
        event: 'app_state_change',
        properties: { state, timestamp: new Date().toISOString() },
      });
    });

    // Check network status
    const networkStatus = await mobileUtils.checkNetworkStatus();
    console.log('Network status:', networkStatus);

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mobile app:', error);
    
    // Report initialization failure
    try {
      await mobileApi.reportAppCrash({
        error: 'Mobile app initialization failed',
        stack: error instanceof Error ? error.stack : String(error),
        deviceInfo: mobileUtils.getDeviceInfo(),
      });
    } catch (reportError) {
      console.error('Failed to report initialization error:', reportError);
    }
  }
};

export default initializeMobileApp; 