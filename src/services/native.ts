import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { Toast } from '@capacitor/toast';
import { Browser } from '@capacitor/browser';

export const isNative = Capacitor.isNativePlatform();

export const showToast = async (message: string) => {
  if (isNative) {
    await Toast.show({
      text: message,
      duration: 'short',
      position: 'bottom'
    });
  }
};

export const setupPushNotifications = async () => {
  if (!isNative) return;

  try {
    const permissionStatus = await PushNotifications.checkPermissions();
    if (permissionStatus.receive === 'prompt') {
      await PushNotifications.requestPermissions();
    }

    await PushNotifications.register();
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

export const openSecureBrowser = async (url: string) => {
  if (isNative) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};

export const secureStorage = {
  async set(key: string, value: string) {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async get(key: string) {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async remove(key: string) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear() {
    if (isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }
}; 