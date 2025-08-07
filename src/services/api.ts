import axios from 'axios';
import { secureStorage } from './native';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // List of public endpoints that should NOT send the Authorization header
    const publicEndpoints = ['/schools', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
    const isPublic = publicEndpoints.some((url) => config.url?.includes(url));
    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
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
      if (error.response?.data?.message === 'Unauthenticated') {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
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
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: {
    email: string;
    password: string;
    password_confirmation: string;
    token: string;
  }) => api.post('/auth/reset-password', data),
};

// Utility function to get user data from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

export const walletApi = {
  getBalance: () => api.get('/wallet'),
  getTransactions: () => api.get('/transactions'),
  topUp: (data: { amount: number; payment_method: string }) =>
    api.post('/wallet/topup', data),
  // Remove withdraw as it's not implemented in backend
  // withdraw: (data: { amount: number; bank_details: any }) =>
  //   api.post('/wallet/withdraw', data),
  // Remove Fawry specific routes as they're not implemented
  // rechargeFawry: (data: { cardToken: string; cvv: string }) =>
  //   api.post('/wallet/recharge-fawry', data),
  // New: Request refund
  requestRefund: (data: { amount: number; reason?: string }) =>
    api.post('/wallet/request-refund', data),
  // Remove Fawry specific routes as they're not implemented
  // initiateFawryRecharge: (data: { amount: number }) =>
  //   api.post('/wallet/initiate-fawry-recharge', data),
  // Remove history routes as they're not implemented
  // getRechargeHistory: () => api.get('/wallet/recharge-history'),
  // getRefunds: () => api.get('/wallet/refunds'),
  // Refund a transaction
  refundTransaction: (id: number, data?: { amount?: number; reason?: string }) =>
    api.post(`/transactions/${id}/refund`, data),
};

// Notifications API
export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
};

// Orders API
export const ordersApi = {
  getOrders: (params?: { status?: string }) => api.get('/orders/my-orders', { params }),
  getOrder: (id: number) => api.get(`/orders/${id}`),
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
  preOrderMeal: (payload: any) => api.post('/student/pre-orders', payload),
  getWeeklyPlansBySchool: (schoolId?: number) => {
    // If no schoolId provided, use the user's school_id
    const user = getCurrentUser();
    const finalSchoolId = schoolId || user?.school_id;
    if (!finalSchoolId) {
      throw new Error('No school ID available for fetching weekly plans');
    }
    return api.get(`/schools/${finalSchoolId}/weekly-plans`);
  },
  getMealCategories: () => api.get('/meals/categories'),
  getMealSubcategories: () => api.get('/meals/subcategories'),
  getMealPdf: (mealId: number) => api.get(`/meals/${mealId}/pdf`),
  getMealPlanPdf: (mealPlanId: number) => api.get(`/meal-plans/${mealPlanId}/pdf`),
  getGeneralPdf: () => api.get('/admin/general-pdfs'),
  getMealPlans: (params?: { start_date?: string; end_date?: string }) => api.get('/meal-plans', { params }),
  getMealPlan: (id: number) => api.get(`/meal-plans/${id}`),
};

export const addOnApi = {
  getAddOns: () => api.get('/add-ons'),
};

export const addOnOrderApi = {
  createOrder: (add_on_id: number, quantity: number) => api.post('/add-on-orders', { add_on_id, quantity }),
  getMyOrders: () => api.get('/add-on-orders'),
  getOrder: (id: number) => api.get(`/add-on-orders/${id}`),
};

export const schoolApi = {
  getSchools: () => api.get('/schools'),
};

export const studentPreOrdersApi = {
  getMyPreOrders: (params?: { family_member_id?: string }) => api.get('/student/pre-orders', { params }),
};

export const mealApi = {
  getMeal: (id: number) => api.get(`/meals/${id}`),
};

// Family Members API
export const familyMembersApi = {
  getFamilyMembers: () => api.get('/family-members'),
  createFamilyMember: (data: {
    name: string;
    grade: string;
    class: string;
    allergies: string[];
  }) => api.post('/family-members', data),
  updateFamilyMember: (id: number, data: {
    name: string;
    grade: string;
    class: string;
    allergies: string[];
  }) => api.put(`/family-members/${id}`, data),
  deleteFamilyMember: (id: number) => api.delete(`/family-members/${id}`),
};

// Campaigns API
export const campaignApi = {
  getCampaigns: (params?: any) => api.get('/campaigns', { params }),
  getFeatured: () => api.get('/campaigns/featured'),
  getCampaign: (id: number) => api.get(`/campaigns/${id}`),
};

// Contact API
export const contactApi = {
  submitContact: (data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) => api.post('/contact', data),
  getUserNotes: () => api.get('/contact/notes'),
};

// PDF API
export const pdfApi = {
  getGeneralPdf: (schoolId?: number) => {
    // If no schoolId provided, try to get it from the logged-in user
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      const user = getCurrentUser();
      finalSchoolId = user?.school_id;
    }
    
    const params = finalSchoolId ? { school_id: finalSchoolId } : {};
    return api.get('/general-pdfs', { params });
  },
};

export { api }; 