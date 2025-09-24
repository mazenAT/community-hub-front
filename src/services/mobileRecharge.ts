import { api } from './api';

export interface RechargeRequest {
  amount: number;
  payment_method: 'card' | 'instapay' | 'paymob_card' | 'paymob_wallet';
  payment_details: {
    card_token?: string;
    cvv?: string;
    card_number?: string;
    expiry_month?: string;
    expiry_year?: string;
    card_holder_name?: string;
    mobile_number?: string;
    save_card?: boolean;
    [key: string]: any;
  };
}

export interface RechargeResponse {
  id: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'succeeded';
  created_at: string;
  transaction_id?: string;
  payment_intent_id?: string;
  redirect_url?: string;
  message?: string;
}

export interface RechargeHistoryItem {
  id: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  transaction_id?: string;
  payment_details?: any;
}

export interface SavedCard {
  id: number;
  card_token: string;
  card_alias: string;
  last_four_digits: string;
  first_six_digits: string;
  brand: string;
  expiry_year: string;
  expiry_month: string;
  is_default: boolean;
  is_active: boolean;
}

export const mobileRechargeApi = {
  // Initiate wallet recharge
  recharge: async (data: RechargeRequest): Promise<RechargeResponse> => {
    const response = await api.post('/wallet/topup', data);
    return response.data;
  },

  // Get recharge history
  getRechargeHistory: async (params?: {
    status?: 'pending' | 'completed' | 'failed';
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: RechargeHistoryItem[]; pagination: any }> => {
    const response = await api.get('/wallet/recharge-history', { params });
    return response.data;
  },

  // Get saved cards
  getSavedCards: async (): Promise<SavedCard[]> => {
    const response = await api.get('/wallet/saved-cards');
    return response.data;
  },

  // Save new card
  saveCard: async (cardData: {
    card_token: string;
    card_alias: string;
    last_four_digits: string;
    first_six_digits: string;
    brand: string;
    expiry_year: string;
    expiry_month: string;
    is_default?: boolean;
  }): Promise<SavedCard> => {
    const response = await api.post('/wallet/save-card-token', cardData);
    return response.data;
  },

  // Delete saved card
  deleteCard: async (cardId: number): Promise<void> => {
    await api.delete(`/wallet/saved-cards/${cardId}`);
  },

  // Update card as default
  setDefaultCard: async (cardId: number): Promise<void> => {
    await api.put(`/wallet/saved-cards/${cardId}/default`);
  },

  // Get payment method info
  getPaymentMethodInfo: async (): Promise<{
    key: string;
    label: string;
    description: string;
    icon: string;
    is_available: boolean;
    min_amount?: number;
    max_amount?: number;
    fees?: number;
    provider: string;
  }> => {
    // Since we only have one payment method, return static info
    return {
      key: 'card',
      label: 'Credit/Debit Card',
      description: 'Pay securely with your card via Fawry',
      icon: '💳',
      is_available: true,
      min_amount: 10,
      max_amount: 10000,
      fees: 0,
      provider: 'Fawry'
    };
  },

  // Validate payment method
  validatePaymentMethod: async (amount: number): Promise<{
    is_valid: boolean;
    errors?: string[];
    fees?: number;
    total_amount?: number;
  }> => {
    const response = await api.post('/wallet/validate-payment', {
      payment_method: 'card',
      amount: amount
    });
    return response.data;
  },

  // Get recharge limits
  getRechargeLimits: async (): Promise<{
    min_amount: number;
    max_amount: number;
    daily_limit: number;
    monthly_limit: number;
    daily_used: number;
    monthly_used: number;
  }> => {
    const response = await api.get('/wallet/recharge-limits');
    return response.data;
  },

  // Check recharge status
  checkRechargeStatus: async (rechargeId: number): Promise<{
    status: 'pending' | 'completed' | 'failed';
    updated_at: string;
    payment_details?: any;
    error_message?: string;
  }> => {
    const response = await api.get(`/wallet/recharge-status/${rechargeId}`);
    return response.data;
  },

  // Cancel pending recharge
  cancelRecharge: async (rechargeId: number): Promise<void> => {
    await api.post(`/wallet/recharge/${rechargeId}/cancel`);
  },

  // Request refund
  requestRefund: async (rechargeId: number, reason: string): Promise<{
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    created_at: string;
  }> => {
    const response = await api.post(`/wallet/recharge/${rechargeId}/refund`, {
      reason: reason
    });
    return response.data;
  },

  // Get refund status
  getRefundStatus: async (refundId: number): Promise<{
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    amount: number;
    created_at: string;
    processed_at?: string;
    rejection_reason?: string;
  }> => {
    const response = await api.get(`/wallet/refund/${refundId}`);
    return response.data;
  },

  // Get recharge statistics
  getRechargeStats: async (period: 'day' | 'week' | 'month' | 'year'): Promise<{
    total_amount: number;
    total_count: number;
    successful_amount: number;
    successful_count: number;
    failed_amount: number;
    failed_count: number;
    pending_amount: number;
    pending_count: number;
    average_amount: number;
    payment_method: string;
  }> => {
    const response = await api.get('/wallet/recharge-stats', {
      params: { period }
    });
    return response.data;
  },

  // Send recharge receipt
  sendReceipt: async (rechargeId: number, email?: string): Promise<void> => {
    await api.post(`/wallet/recharge/${rechargeId}/receipt`, {
      email: email
    });
  },

  // Get recharge receipt
  getReceipt: async (rechargeId: number): Promise<{
    id: number;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    transaction_id: string;
    receipt_url: string;
  }> => {
    const response = await api.get(`/wallet/recharge/${rechargeId}/receipt`);
    return response.data;
  },

  // Process saved card payment
  processSavedCardPayment: async (data: {
    amount: number;
    card_token: string;
    cvv: string;
  }): Promise<RechargeResponse> => {
    const response = await api.post('/wallet/topup', {
      amount: data.amount,
      payment_method: 'card',
      payment_details: {
        card_token: data.card_token,
        cvv: data.cvv,
        save_card: false
      }
    });
    return response.data;
  }
};

// Mobile-specific recharge utilities
export const mobileRechargeUtils = {
  // Format amount for display
  formatAmount: (amount: number, currency: string = 'EGP'): string => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Validate amount
  validateAmount: (amount: number, limits: {
    min_amount: number;
    max_amount: number;
    daily_limit: number;
    monthly_limit: number;
    daily_used: number;
    monthly_used: number;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (amount < limits.min_amount) {
      errors.push(`Minimum recharge amount is ${mobileRechargeUtils.formatAmount(limits.min_amount)}`);
    }

    if (amount > limits.max_amount) {
      errors.push(`Maximum recharge amount is ${mobileRechargeUtils.formatAmount(limits.max_amount)}`);
    }

    if (amount + limits.daily_used > limits.daily_limit) {
      errors.push(`Daily limit exceeded. You can recharge up to ${mobileRechargeUtils.formatAmount(limits.daily_limit - limits.daily_used)} more today`);
    }

    if (amount + limits.monthly_used > limits.monthly_limit) {
      errors.push(`Monthly limit exceeded. You can recharge up to ${mobileRechargeUtils.formatAmount(limits.monthly_limit - limits.monthly_used)} more this month`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Get payment method display info
  getPaymentMethodInfo: (): {
    label: string;
    description: string;
    icon: string;
    color: string;
    provider: string;
  } => {
    return {
      label: 'Credit/Debit Card',
      description: 'Pay securely with your card via Fawry',
      icon: '💳',
      color: 'text-blue-600',
      provider: 'Fawry'
    };
  },

  // Calculate fees (Fawry typically has no fees for card payments)
  calculateFees: (amount: number): number => {
    // Fawry usually has no additional fees for card payments
    return 0;
  },

  // Generate transaction ID
  generateTransactionId: (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.round(diffInHours * 60);
        return `${diffInMinutes} minutes ago`;
      }
      return `${Math.round(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },

  // Validate card details
  validateCardDetails: (cardData: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    card_holder_name: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Card number validation (basic Luhn algorithm check)
    if (!cardData.card_number || cardData.card_number.length < 13 || cardData.card_number.length > 19) {
      errors.push('Please enter a valid card number');
    }

    // Expiry month validation
    const month = parseInt(cardData.expiry_month);
    if (month < 1 || month > 12) {
      errors.push('Please enter a valid expiry month (01-12)');
    }

    // Expiry year validation
    const currentYear = new Date().getFullYear();
    const year = parseInt(cardData.expiry_year);
    if (year < currentYear || year > currentYear + 20) {
      errors.push('Please enter a valid expiry year');
    }

    // CVV validation
    if (!cardData.cvv || cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      errors.push('Please enter a valid CVV');
    }

    // Card holder name validation
    if (!cardData.card_holder_name || cardData.card_holder_name.trim().length < 2) {
      errors.push('Please enter the card holder name');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};

export default mobileRechargeApi; 