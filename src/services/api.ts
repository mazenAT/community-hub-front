import axios from 'axios';
import { secureStorage } from './native';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect immediately, let components handle it
      console.log('Authentication error - token may be invalid');
      // Only remove token if it's definitely invalid
      if (error.response?.data?.message === 'Unauthenticated') {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    school_id: number;
    phone?: string;
  }) => api.post('/auth/register', data),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: {
    email: string;
    password: string;
    password_confirmation: string;
    token: string;
  }) => api.post('/auth/reset-password', data),
};

export const walletApi = {
  getBalance: () => api.get('/wallet'),
  getTransactions: () => api.get('/transactions'),
  topUp: (data: { amount: number; payment_method: string }) =>
    api.post('/wallet/top-up', data),
  withdraw: (data: { amount: number; bank_details: any }) =>
    api.post('/wallet/withdraw', data),
};

export const profileApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data: any) => api.put('/profile', data),
  updatePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put('/profile/password', data),
};

export const plannerApi = {
  getMeals: (params: { date?: string; type?: string; category?: string; subcategory?: string }) =>
    api.get('/meals', { params }),
  preOrderMeal: (mealId: number) => api.post(`/meals/${mealId}/pre-order`),
  getWeeklyPlansBySchool: (schoolId: number) => api.get(`/schools/${schoolId}/weekly-plans`),
  getMealCategories: () => api.get('/meals/categories'),
  getMealSubcategories: () => api.get('/meals/subcategories'),
};

export const addOnApi = {
  getAddOns: () => api.get('/add-ons'),
};

export const schoolApi = {
  getSchools: () => api.get('/schools'),
};

export { api }; 