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
    // Handle CORS errors specifically
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network/CORS Error:', error);
      // This could be a CORS issue or network connectivity problem
      return Promise.reject(new Error('Network error - please check your connection or try again later.'));
    }
    
    if (error.response?.status === 401) {
      // Don't redirect immediately, let components handle it
      if (error.response?.data?.message === 'Unauthenticated') {
        localStorage.removeItem('token');
      }
    }
    
    // Handle CORS preflight failures
    if (error.response?.status === 0) {
      console.error('CORS Error - Request blocked:', error);
      return Promise.reject(new Error('Request blocked - this may be a CORS issue.'));
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

// Transaction API
export const transactionApi = {
  getTransactions: (params?: { type?: string; start_date?: string; end_date?: string }) =>
    api.get('/transactions', { params }),
  getTransaction: (id: number) => api.get(`/transactions/${id}`),
  // Refund a transaction
  refundTransaction: (id: number, data?: { amount?: number; reason?: string }) =>
    api.post(`/transactions/${id}/refund`, data),
};

// Notifications API
export const notificationApi = {
  getNotifications: (params?: { type?: string; is_read?: boolean }) =>
    api.get('/notifications', { params }),
  getNotification: (id: number) => api.get(`/notifications/${id}`),
  markAsRead: (id: number) => api.post('/notifications/mark-read', { notification_id: id }), // Use correct endpoint
  markAllAsRead: () => api.post('/notifications/mark-read'), // Use correct endpoint
  getUnreadCount: () => api.get('/notifications/stats'), // Use stats endpoint
  deleteNotification: (id: number) => api.delete('/notifications'), // Use correct endpoint
};

// Orders API
export const ordersApi = {
  getOrder: (id: number) => api.get(`/orders/${id}`),
  getMyOrders: () => api.get('/orders'),
  createOrder: (data: any) => api.post('/orders', data),
  updateOrder: (id: number, data: any) => api.put(`/orders/${id}`, data),
  cancelOrder: (id: number) => api.post(`/orders/${id}/cancel`),
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
  getGeneralPdf: (schoolId?: number) => pdfApi.getGeneralPdf(schoolId),
  getMealPlans: (params?: { start_date?: string; end_date?: string }) => api.get('/meal-plans', { params }),
  getMealPlan: (id: number) => api.get(`/meal-plans/${id}`),
};

export const dailyItemsApi = {
  getDailyItems: (schoolId?: number) => {
    const params = schoolId ? { school_id: schoolId } : {};
    return api.get('/add-ons', { params });
  },
  getCategoriesForSchool: (schoolId?: number) => {
    const params = schoolId ? { school_id: schoolId } : {};
    return api.get('/add-ons/categories/school', { params });
  },
};

export const dailyItemOrderApi = {
  createOrder: (daily_item_id: number, quantity: number, family_member_id?: number, delivery_date?: string, weekly_plan_id?: number) => 
    api.post('/add-on-orders', { add_on_id: daily_item_id, quantity, family_member_id, delivery_date, weekly_plan_id }),
  getMyOrders: () => api.get('/add-on-orders'),
  getOrder: (id: number) => api.get(`/add-on-orders/${id}`),
  getByDeliveryDate: (delivery_date: string, category?: string) => 
    api.get('/add-on-orders/by-delivery-date', { params: { delivery_date, category } }),
};

export const schoolApi = {
  getSchools: () => api.get('/schools'),
  getSchool: (id: number) => api.get(`/schools/${id}`),
};

export const studentPreOrdersApi = {
  getMyPreOrders: (params?: { family_member_id?: string }) => api.get('/student/pre-orders', { params }),
};

// Meal Order Refunds (Internal)
export const mealRefundApi = {
  refundMealOrder: (orderId: number, reason?: string) => 
    api.post(`/meal-orders/${orderId}/refund`, { reason }),
  getRefundableOrders: () => api.get('/meal-orders/refundable'),
};

// InstaPay API
export const instaPayApi = {
  createTopupRequest: (amount: number) => {
    return api.post('/instapay/create-topup', { amount });
  },
  uploadReceipt: (referenceCode: string, receiptImage: File, parentName?: string) => {
    const formData = new FormData();
    formData.append('reference_code', referenceCode);
    formData.append('receipt_image', receiptImage);
    if (parentName) {
      formData.append('parent_name', parentName);
    }
    return api.post('/instapay/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getTopupStatus: (referenceCode: string) =>
    api.get(`/instapay/status/${referenceCode}`),
  getTopupHistory: () => api.get('/instapay/history'),
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
  getCampaigns: (params?: { [key: string]: any }) => api.get('/campaigns', { params }),
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

// Wallet API
export const walletApi = {
  getTransactions: () => api.get('/transactions'),
  requestRefund: (data: { amount: number; reason?: string; transaction_id?: number }) => 
    api.post('/wallet/request-refund', data),
  topUp: (data: { amount: number; payment_method: string; payment_details: any }) => 
    api.post('/wallet/topup', data),
  getBalance: () => api.get('/wallet'),
  // Paymob integration
  recharge: (data: { 
    amount: number; 
    payment_method: string; 
    payment_details: {
      order_id: string;
      item_name: string;
      description: string;
      billing_data: any;
    }
  }) => api.post('/wallet/recharge', data),
};

export { api }; 