// Fawry 3DS Payment Service - Redirect Flow
// Implements Fawry's redirect-based payment flow to avoid CORS issues
// Instead of direct API calls, users are redirected to Fawry's hosted payment page
// https://developer.fawrystaging.com/docs/server-apis/create-payment-3ds-apis

import { secureCredentials } from './secureCredentials';

// Fawry redirect payment URL (for hosted payment page)
// This URL is for redirecting users to Fawry's hosted payment page
// No CORS issues since the user goes directly to Fawry's domain
const FAWRY_PAYMENT_URL = 'https://atfawry.fawrystaging.com/ECommercePlugin/FawryPayment.aspx';

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
   * Create a 3DS payment request using Fawry's redirect flow
   * This redirects users to Fawry's hosted payment page (no CORS issues)
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
        (paymentData.customerProfileId || '') + 
        (paymentData.paymentMethod || 'CARD') + 
        formattedAmount + 
        cleanCardNumber + 
        cardExpiryYear + 
        cardExpiryMonth + 
        cvv + 
        (paymentData.returnUrl || window.location.href) + 
        credentials.securityKey;
      
      const signature = await generateSHA256(signatureString);
      
      // Build Fawry payment URL with all parameters
      const paymentUrl = new URL(FAWRY_PAYMENT_URL);
      
      // Add required parameters for redirect flow
      paymentUrl.searchParams.set('merchantCode', credentials.merchantCode);
      paymentUrl.searchParams.set('merchantRefNum', merchantRefNum);
      paymentUrl.searchParams.set('customerProfileId', paymentData.customerProfileId || '');
      paymentUrl.searchParams.set('customerName', paymentData.customerName || '');
      paymentUrl.searchParams.set('customerMobile', paymentData.customerMobile);
      paymentUrl.searchParams.set('customerEmail', paymentData.customerEmail);
      paymentUrl.searchParams.set('amount', formattedAmount);
      paymentUrl.searchParams.set('currencyCode', 'EGP');
      paymentUrl.searchParams.set('language', 'en-gb');
      paymentUrl.searchParams.set('paymentMethod', paymentData.paymentMethod || 'CARD');
      paymentUrl.searchParams.set('cardNumber', cleanCardNumber);
      paymentUrl.searchParams.set('cardExpiryYear', cardExpiryYear);
      paymentUrl.searchParams.set('cardExpiryMonth', cardExpiryMonth);
      paymentUrl.searchParams.set('cvv', cvv);
      paymentUrl.searchParams.set('returnUrl', paymentData.returnUrl || window.location.href);
      paymentUrl.searchParams.set('enable3DS', 'true');
      paymentUrl.searchParams.set('authCaptureModePayment', 'false');
      paymentUrl.searchParams.set('signature', signature);
      
      // Add charge items as JSON string
      if (paymentData.chargeItems && paymentData.chargeItems.length > 0) {
        paymentUrl.searchParams.set('chargeItems', JSON.stringify(paymentData.chargeItems));
      }
      
      console.log('Redirecting to Fawry payment page:', paymentUrl.toString());
      
      // Store transaction info for callback handling
      localStorage.setItem('pending_3ds_transaction', JSON.stringify({
        merchantRefNum,
        amount: paymentData.amount,
        customerProfileId: paymentData.customerProfileId,
        customerName: paymentData.customerName,
        customerMobile: paymentData.customerMobile,
        customerEmail: paymentData.customerEmail,
        step: 'redirect_to_fawry',
        signature: signature,
        returnUrl: paymentData.returnUrl || window.location.href
      }));
      
      // Redirect to Fawry's hosted payment page
      window.location.href = paymentUrl.toString();
      
      // Return a response indicating redirect (this won't be reached due to redirect)
      return {
        type: 'redirect',
        statusCode: 200,
        statusDescription: 'Redirecting to Fawry payment page',
        basketPayment: false,
        nextAction: {
          type: 'REDIRECT',
          redirectUrl: paymentUrl.toString()
        }
      };
      
    } catch (error) {
      console.error('Error creating 3DS payment redirect:', error);
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