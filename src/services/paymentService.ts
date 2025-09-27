import { checkoutApi } from './api';
import { CheckoutInitiateRequest, CheckoutInitiateResponse } from '@/types/payment';
import PaymentErrorHandler from '@/utils/paymentErrorHandler';

export interface PaymentData {
  amount: number;
  payment_method: 'paymob_card' | 'paymob_wallet';
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city: string;
  country?: string;
  userId: number;
}

export class PaymentService {
  /**
   * Initiate payment using the new Paymob Unified Intention API
   */
  static async initiatePayment(paymentData: PaymentData): Promise<CheckoutInitiateResponse> {
    try {
      const requestData: CheckoutInitiateRequest = {
        amount: paymentData.amount,
        currency: 'EGP',
        payment_method: paymentData.payment_method,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        email: paymentData.email,
        phone_number: paymentData.phone_number,
        city: paymentData.city || 'Cairo',
        country: paymentData.country || 'EG',
        merchant_order_id: `WALLET_${Date.now()}_${paymentData.userId}`,
        items: [{
          name: 'Wallet Recharge',
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          description: 'Digital wallet top-up',
          quantity: 1
        }]
      };

      const response = await checkoutApi.initiate(requestData);
      return response.data;
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Payment Initiation');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Handle payment success callback
   */
  static async handlePaymentSuccess(params: {
    intention_id?: string;
    status?: string;
    amount?: string;
  }) {
    try {
      const response = await checkoutApi.success(params);
      return response.data;
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Payment Success Handling');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Handle payment failure callback
   */
  static async handlePaymentFailure(params: {
    intention_id?: string;
    status?: string;
    error?: string;
  }) {
    try {
      const response = await checkoutApi.failure(params);
      return response.data;
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Payment Failure Handling');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Validate phone number format (01XXXXXXXXX)
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^01\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format phone number to required format
   */
  static formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 20, remove it
    if (cleaned.startsWith('20')) {
      return cleaned.substring(2);
    }
    
    // If it starts with +20, remove it
    if (cleaned.startsWith('+20')) {
      return cleaned.substring(3);
    }
    
    // If it doesn't start with 01, add it
    if (!cleaned.startsWith('01')) {
      return `01${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate required billing data
   */
  static validateBillingData(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.first_name.trim()) {
      errors.push('First name is required');
    }

    if (!data.last_name.trim()) {
      errors.push('Last name is required');
    }

    if (!data.email.trim()) {
      errors.push('Email is required');
    } else if (!this.validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.phone_number.trim()) {
      errors.push('Phone number is required');
    } else {
      const formattedPhone = this.formatPhoneNumber(data.phone_number);
      if (!this.validatePhoneNumber(formattedPhone)) {
        errors.push('Phone number must be in format 01XXXXXXXXX (11 digits starting with 01)');
      }
    }

    if (!data.city.trim()) {
      errors.push('City is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PaymentService;