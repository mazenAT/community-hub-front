import PaymentService from './paymentService';
import { PaymentData } from './paymentService';
import PaymentErrorHandler from '@/utils/paymentErrorHandler';

export interface WalletTopUpRequest {
  amount: number;
  payment_method: 'paymob_card' | 'paymob_wallet';
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
    country?: string;
  };
  user_id: number;
}

export interface WalletTopUpResponse {
  success: boolean;
  checkout_url?: string;
  intention_id?: string;
  message?: string;
}

export class WalletService {
  /**
   * Top up wallet using the new Paymob Unified Intention API
   */
  static async topUpWallet(request: WalletTopUpRequest): Promise<WalletTopUpResponse> {
    try {
      // Validate billing data
      const validation = PaymentService.validateBillingData({
        first_name: request.billing_data.first_name,
        last_name: request.billing_data.last_name,
        email: request.billing_data.email,
        phone_number: request.billing_data.phone_number,
        city: request.billing_data.city
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Format phone number
      const formattedPhone = PaymentService.formatPhoneNumber(request.billing_data.phone_number);

      // Prepare payment data
      const paymentData: PaymentData = {
        amount: request.amount,
        payment_method: request.payment_method,
        first_name: request.billing_data.first_name,
        last_name: request.billing_data.last_name,
        email: request.billing_data.email,
        phone_number: formattedPhone,
        city: request.billing_data.city,
        country: request.billing_data.country || 'EG',
        userId: request.user_id
      };

      // Initiate payment
      const response = await PaymentService.initiatePayment(paymentData);

      return {
        success: response.success,
        checkout_url: response.data?.checkout_url,
        intention_id: response.data?.intention_id,
        message: response.message
      };
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Wallet Top Up');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Handle wallet top-up success
   */
  static async handleTopUpSuccess(params: {
    intention_id?: string;
    status?: string;
    amount?: string;
  }) {
    try {
      const response = await PaymentService.handlePaymentSuccess(params);
      return response;
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Wallet Top Up Success');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Handle wallet top-up failure
   */
  static async handleTopUpFailure(params: {
    intention_id?: string;
    status?: string;
    error?: string;
  }) {
    try {
      const response = await PaymentService.handlePaymentFailure(params);
      return response;
    } catch (error: any) {
      PaymentErrorHandler.logError(error, 'Wallet Top Up Failure');
      throw new Error(PaymentErrorHandler.getUserFriendlyMessage(error));
    }
  }

  /**
   * Validate top-up amount
   */
  static validateAmount(amount: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (amount < 1) {
      errors.push('Minimum top-up amount is 1 EGP');
    }

    if (amount > 10000) {
      errors.push('Maximum top-up amount is 10,000 EGP');
    }

    if (!Number.isFinite(amount)) {
      errors.push('Amount must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get payment method display info
   */
  static getPaymentMethodInfo(method: 'paymob_card' | 'paymob_wallet'): {
    name: string;
    description: string;
    icon: string;
  } {
    switch (method) {
      case 'paymob_card':
        return {
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard, American Express',
          icon: '💳'
        };
      case 'paymob_wallet':
        return {
          name: 'Mobile Wallet',
          description: 'Vodafone Cash, Orange Money, Etisalat Cash',
          icon: '📱'
        };
      default:
        return {
          name: 'Unknown Method',
          description: 'Please select a valid payment method',
          icon: '❓'
        };
    }
  }
}

export default WalletService;