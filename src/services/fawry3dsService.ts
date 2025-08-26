// Fawry 3DS Payment Service
// Implements the correct 3DS payment flow according to Fawry documentation
// https://developer.fawrystaging.com/docs/server-apis/create-payment-3ds-apis

import { secureCredentials } from './secureCredentials';
import axios from 'axios'; // Added axios import

// Fawry API endpoints and configuration
const FAWRY_3DS_API_URL = 'https://atfawry.fawrystaging.com/ECommercePlugin/FawryPayment.aspx';

export interface Fawry3dsPaymentRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerProfileId?: string;
  paymentMethod: string;
  cardNumber: string;
  cardExpiryYear: string;      // Changed back to string (formatted as "29")
  cardExpiryMonth: string;     // Changed back to string (formatted as "05")
  cvv: string;                 // Changed back to string (formatted as "123")
  customerName?: string;
  customerMobile: string;
  customerEmail: string;
  amount: number;
  description: string;
  language: string;
  currencyCode: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  enable3DS: boolean;
  authCaptureModePayment: boolean;
  returnUrl: string;
  orderWebHookUrl?: string;
  saveCardInfo?: boolean;
  signature: string;
}

export interface Fawry3dsPaymentResponse {
  type: string;
  nextAction?: {
    type: string;
    redirectUrl: string;
  };
  statusCode: number;
  statusDescription: string;
  basketPayment: boolean;
}

export interface Fawry3dsCallbackResponse {
  type: string;
  referenceNumber: string;
  merchantRefNumber: string;
  orderAmount: number;
  paymentAmount: number;
  fawryFees: number;
  paymentMethod: string;
  orderStatus: string;
  paymentTime: number;
  customerMobile: string;
  customerMail: string;
  customerProfileId: string;
  signature: string;
  statusCode: string;
  statusDescription: string;
}

export const fawry3dsService = {
  /**
   * Create a 3DS payment request
   * This is the main 3DS payment API call according to Fawry documentation
   */
  create3dsPayment: async (paymentData: Fawry3dsPaymentRequest): Promise<Fawry3dsPaymentResponse> => {
    try {
      const credentials = secureCredentials.getCredentials();
      
      // Generate unique merchant reference number
      const merchantRefNum = `3DS_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Clean card number (remove spaces)
      const cleanCardNumber = paymentData.cardNumber.replace(/\s/g, '');
      
      // Format amount to 2 decimal places
      const formattedAmount = paymentData.amount.toFixed(2);
      
      // Format expiry and CVV as strings
      const cardExpiryYear = paymentData.cardExpiryYear.toString().slice(-2);
      const cardExpiryMonth = paymentData.cardExpiryMonth.toString().padStart(2, '0');
      const cvv = paymentData.cvv.toString().padStart(3, '0');
      
      // Generate signature
      const signatureString = 
        credentials.merchantCode + 
        merchantRefNum + 
        paymentData.customerProfileId + 
        paymentData.paymentMethod + 
        formattedAmount + 
        cleanCardNumber + 
        cardExpiryYear + 
        cardExpiryMonth + 
        cvv + 
        paymentData.returnUrl + 
        credentials.securityKey;
      
      const signature = await generateSHA256(signatureString);
      
      const payload = {
        merchantCode: credentials.merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: paymentData.customerProfileId,
        customerName: paymentData.customerName,
        customerMobile: paymentData.customerMobile,
        customerEmail: paymentData.customerEmail,
        amount: formattedAmount,
        currencyCode: 'EGP',
        language: 'en-gb',
        paymentMethod: paymentData.paymentMethod,
        cardNumber: cleanCardNumber,
        cardExpiryYear: cardExpiryYear,
        cardExpiryMonth: cardExpiryMonth,
        cvv: cvv,
        returnUrl: paymentData.returnUrl,
        chargeItems: paymentData.chargeItems,
        enable3DS: true,
        authCaptureModePayment: false,
        signature: signature
      };

      const response = await axios.post(FAWRY_3DS_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating 3DS payment:', error);
      throw error;
    }
  },

  /**
   * Process 3DS callback response
   * This handles the response when user returns from 3DS authentication
   */
  process3dsCallback: (callbackData: Fawry3dsCallbackResponse): {
    success: boolean;
    status: string;
    amount: number;
    referenceNumber: string;
    message: string;
  } => {
    try {
      // Verify the callback signature (you should implement this)
      // const isValidSignature = verifyCallbackSignature(callbackData);
      
      if (callbackData.statusCode === '200') {
        return {
          success: true,
          status: callbackData.orderStatus,
          amount: callbackData.paymentAmount,
          referenceNumber: callbackData.referenceNumber,
          message: 'Payment completed successfully'
        };
      } else {
        return {
          success: false,
          status: callbackData.orderStatus,
          amount: callbackData.paymentAmount,
          referenceNumber: callbackData.referenceNumber,
          message: callbackData.statusDescription || 'Payment failed'
        };
      }
    } catch (error) {
      console.error('Error processing 3DS callback:', error);
      return {
        success: false,
        status: 'error',
        amount: 0,
        referenceNumber: '',
        message: 'Error processing payment response'
      };
    }
  },

  /**
   * Validate 3DS payment request data
   */
  validate3dsPaymentData: (paymentData: {
    cardNumber: string;
    cardExpiryYear: string;
    cardExpiryMonth: string;
    cvv: string;
    amount: number;
    customerName: string;
    customerMobile: string;
    customerEmail: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!paymentData.cardNumber || paymentData.cardNumber.length < 13) {
      errors.push('Invalid card number');
    }

    if (!paymentData.cardExpiryYear || paymentData.cardExpiryYear.length !== 2) {
      errors.push('Invalid expiry year format (YY)');
    }

    if (!paymentData.cardExpiryMonth || paymentData.cardExpiryMonth.length !== 2) {
      errors.push('Invalid expiry month format (MM)');
    }

    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      errors.push('Invalid CVV');
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Invalid amount');
    }

    if (!paymentData.customerName || paymentData.customerName.trim().length === 0) {
      errors.push('Customer name is required');
    }

    if (!paymentData.customerMobile || paymentData.customerMobile.trim().length === 0) {
      errors.push('Customer mobile is required');
    }

    if (!paymentData.customerEmail || paymentData.customerEmail.trim().length === 0) {
      errors.push('Customer email is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Get 3DS payment status description
   */
  getPaymentStatusDescription: (status: string): string => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'Payment completed successfully';
      case 'PENDING':
        return 'Payment is being processed';
      case 'FAILED':
        return 'Payment failed';
      case 'CANCELLED':
        return 'Payment was cancelled';
      case 'EXPIRED':
        return 'Payment request expired';
      default:
        return `Payment status: ${status}`;
    }
  }
};

/**
 * Generate SHA256 hash for Fawry signature
 */
async function generateSHA256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default fawry3dsService; 