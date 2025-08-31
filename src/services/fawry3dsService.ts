// Fawry 3DS Payment Service - Redirect Flow
// Implements Fawry's redirect-based payment flow to avoid CORS issues
// Instead of direct API calls, users are redirected to Fawry's hosted payment page
// https://developer.fawrystaging.com/docs/server-apis/create-payment-3ds-apis

import { secureCredentials } from './secureCredentials';

// Backend API endpoint for creating 3DS payments
// This follows Fawry's official 3DS API documentation
const BACKEND_3DS_API_URL = (import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api') + '/fawry/create-3ds-payment';

export interface Fawry3dsPaymentRequest {
  // Required fields for payment
  cardNumber: string;
  cardExpiryYear: string;      // Format: "29" (YY)
  cardExpiryMonth: string;     // Format: "05" (MM)
  cvv: string;                 // Format: "123"
  amount: number;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerProfileId?: string;
  description: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  
  // Optional fields (will be auto-filled)
  merchantCode?: string;        // Auto-filled from secureCredentials
  merchantRefNum?: string;      // Auto-generated
  paymentMethod?: string;       // Default: "CARD"
  language?: string;            // Default: "en-gb"
  currencyCode?: string;        // Default: "EGP"
  enable3DS?: boolean;         // Default: true
  authCaptureModePayment?: boolean; // Default: false
  returnUrl?: string;          // Auto-filled from current page
  orderWebHookUrl?: string;    // Optional webhook URL
  saveCardInfo?: boolean;      // Default: false
  signature?: string;          // Auto-generated
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
   * Create a 3DS payment request using our backend API
   * This follows Fawry's official 3DS API documentation
   */
  create3dsPayment: async (paymentData: Fawry3dsPaymentRequest): Promise<Fawry3dsPaymentResponse> => {
    try {
      // Prepare payment data for backend
      const paymentPayload = {
        cardNumber: paymentData.cardNumber,
        cardExpiryYear: paymentData.cardExpiryYear,
        cardExpiryMonth: paymentData.cardExpiryMonth,
        cvv: paymentData.cvv,
        amount: paymentData.amount,
        customerName: paymentData.customerName,
        customerMobile: paymentData.customerMobile,
        customerEmail: paymentData.customerEmail,
        customerProfileId: paymentData.customerProfileId,
        description: paymentData.description,
        chargeItems: paymentData.chargeItems,
        returnUrl: paymentData.returnUrl || window.location.href
      };

      console.log('Creating 3DS payment via backend:', paymentPayload);

      // Call our backend API
      const response = await fetch(BACKEND_3DS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      if (responseData.success && responseData.data.redirectUrl) {
        // Store transaction info for callback handling
        localStorage.setItem('pending_3ds_transaction', JSON.stringify({
          merchantRefNum: responseData.data.merchantRefNum,
          amount: paymentData.amount,
          customerProfileId: paymentData.customerProfileId,
          customerName: paymentData.customerName,
          customerMobile: paymentData.customerMobile,
          customerEmail: paymentData.customerEmail,
          step: 'backend_3ds_created',
          fawryResponse: responseData.data.fawryResponse
        }));

        console.log('3DS payment created successfully, redirecting to:', responseData.data.redirectUrl);

        // Redirect to Fawry's 3DS authentication page
        window.location.href = responseData.data.redirectUrl;

        // Return response indicating redirect
        return {
          type: 'redirect',
          statusCode: 200,
          statusDescription: 'Redirecting to 3DS authentication',
          basketPayment: false,
          nextAction: {
            type: 'THREE_D_SECURE',
            redirectUrl: responseData.data.redirectUrl
          }
        };
      } else {
        // Backend API error
        throw new Error(responseData.message || 'Failed to create 3DS payment');
      }
      
    } catch (error) {
      console.error('Error creating 3DS payment via backend:', error);
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