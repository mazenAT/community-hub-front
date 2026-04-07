export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Lite Bite Cafeteria System',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_APP_ENV || 'development',
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api',
    timeout: 30000,
    retryAttempts: 3,
  },
  pagination: {
    defaultPageSize: 15,
    maxPageSize: 100,
  },
  currency: {
    code: 'EGP',
    symbol: 'E£',
    locale: 'en-US',
  },
  dateTime: {
    format: 'MMM dd, yyyy HH:mm',
    locale: 'ar-EG',
  },
  cache: {
    authTokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'user_data',
  },
} as const; 