import axios from 'axios';
import { secureStorage } from './native';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await secureStorage.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await secureStorage.get('refresh_token');
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { token } = response.data;
        await secureStorage.set('auth_token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (error) {
        await secureStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signIn: async (data: { email: string; password: string; school: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  signUp: async (data: { email: string; password: string; school: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};

export const walletApi = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getTransactions: async (page = 1) => {
    const response = await api.get('/wallet/transactions', {
      params: { page },
    });
    return response.data;
  },

  addFunds: async (amount: number, paymentMethod: string, paymentDetails: any) => {
    const response = await api.post('/wallet/top-up', {
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
    });
    return response.data;
  },

  withdraw: async (amount: number, bankDetails: any) => {
    const response = await api.post('/wallet/withdraw', {
      amount,
      bank_details: bankDetails,
    });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/wallet/statistics');
    return response.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    school?: string;
    phone?: string;
    avatar?: string;
  }) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },
};

export const plannerApi = {
  getMeals: async (params: { date: string; type?: "breakfast" | "lunch" | "dinner" }) => {
    const response = await api.get('/planner/meals', { params });
    return response.data;
  },

  preOrderMeal: async (mealId: number) => {
    const response = await api.post(`/planner/meals/${mealId}/pre-order`);
    return response.data;
  },
};

export default api; 