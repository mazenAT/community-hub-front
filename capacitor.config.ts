import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartcommunity.app',
  appName: 'Smart Community',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#999999"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // Add deep linking plugin configuration
    DeepLinks: {
      appLinks: {
        android: {
          scheme: 'smartcommunity',
          host: 'smartcommunity.com'
        },
        ios: {
          scheme: 'smartcommunity',
          host: 'smartcommunity.com'
        }
      }
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined
    }
  },
  ios: {
    contentInset: "always"
  }
};

export default config;
