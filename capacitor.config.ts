
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3293f4f89e9543a3af1d0f4951f695a7',
  appName: 'A Lovable project',
  webDir: 'dist',
  server: {
    url: 'https://3293f4f8-9e95-43a3-af1d-0f4951f695a7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
