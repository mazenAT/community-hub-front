import PaymentService from './paymentService';
import { PaymentData } from './paymentService';
import PaymentErrorHandler from '@/utils/paymentErrorHandler';
import { walletApi } from './api';

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
  // Card-specific fields (required for paymob_card)
  card_data?: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    card_holder_name: string;
  };
}

export interface WalletTopUpResponse {
  success: boolean;
  payment_url?: string;
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

      // Validate card data for paymob_card payments
      if (request.payment_method === 'paymob_card' && request.card_data) {
        const cardValidation = PaymentService.validateCardData(request.card_data);
        if (!cardValidation.isValid) {
          throw new Error(cardValidation.errors.join(', '));
        }
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
        userId: request.user_id,
        // Include card data for paymob_card payment method
        ...(request.payment_method === 'paymob_card' && request.card_data && {
          card_number: request.card_data.card_number,
          expiry_month: request.card_data.expiry_month,
          expiry_year: request.card_data.expiry_year,
          cvv: request.card_data.cvv,
          card_holder_name: request.card_data.card_holder_name
        })
      };

      // Use wallet recharge API instead of checkout API
      const response = await walletApi.recharge({
        amount: request.amount,
        payment_method: request.payment_method,
        payment_details: {
          order_id: `wallet_recharge_${Date.now()}`,
          item_name: 'Wallet Recharge',
          description: 'Digital wallet top-up',
          merchant_order_id: `recharge_${Date.now()}_${request.user_id}`,
          currency: 'EGP',
          billing_data: {
            first_name: request.billing_data.first_name,
            last_name: request.billing_data.last_name,
            email: request.billing_data.email,
            phone_number: formattedPhone,
            apartment: '',
            floor: '',
            street: '',
            building: '',
            city: request.billing_data.city,
            state: 'Cairo',
            country: 'EG',
            postal_code: '12345'
          },
          // Include card data for paymob_card payment method
          ...(request.payment_method === 'paymob_card' && request.card_data && {
            card_number: request.card_data.card_number.replace(/\s/g, ''), // Remove spaces from card number
            expiry_month: request.card_data.expiry_month,
            expiry_year: request.card_data.expiry_year,
            cvv: request.card_data.cvv,
            card_holder_name: request.card_data.card_holder_name
          })
        }
      });

      return {
        success: response.data.success,
        payment_url: response.data.payment_url,
        intention_id: response.data.intention_id,
        message: response.data.message
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