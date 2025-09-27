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
  // Card-specific fields (required for paymob_card)
  card_number?: string;
  expiry_month?: string;
  expiry_year?: string;
  cvv?: string;
  card_holder_name?: string;
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
        // Include card fields for paymob_card payment method
        ...(paymentData.payment_method === 'paymob_card' && {
          card_number: paymentData.card_number,
          expiry_month: paymentData.expiry_month,
          expiry_year: paymentData.expiry_year,
          cvv: paymentData.cvv,
          card_holder_name: paymentData.card_holder_name
        }),
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
   * Validate card data for paymob_card payments
   */
  static validateCardData(data: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    card_holder_name: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.card_number.trim()) {
      errors.push('Card number is required');
    } else if (!/^\d{16}$/.test(data.card_number.replace(/\s/g, ''))) {
      errors.push('Card number must be 16 digits');
    }

    if (!data.expiry_month.trim()) {
      errors.push('Expiry month is required');
    } else {
      const month = parseInt(data.expiry_month);
      if (month < 1 || month > 12) {
        errors.push('Expiry month must be between 01 and 12');
      }
    }

    if (!data.expiry_year.trim()) {
      errors.push('Expiry year is required');
    } else {
      const year = parseInt(data.expiry_year);
      const currentYear = new Date().getFullYear();
      if (year < currentYear || year > currentYear + 20) {
        errors.push('Expiry year must be valid');
      }
    }

    if (!data.cvv.trim()) {
      errors.push('CVV is required');
    } else if (!/^\d{3,4}$/.test(data.cvv)) {
      errors.push('CVV must be 3 or 4 digits');
    }

    if (!data.card_holder_name.trim()) {
      errors.push('Card holder name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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