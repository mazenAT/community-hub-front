// Fawry 3DS Payment Service
// Implements the correct 3DS payment flow according to Fawry documentation
// https://developer.fawrystaging.com/docs/server-apis/create-payment-3ds-apis

import { secureCredentials } from './secureCredentials';

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
  create3dsPayment: async (paymentData: {
    cardNumber: string;
    cardExpiryYear: string;
    cardExpiryMonth: string;
    cvv: string;
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
  }): Promise<Fawry3dsPaymentResponse> => {
    try {
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      // Generate unique merchant reference
      const merchantRefNum = `3DS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Generate signature according to Fawry 3DS documentation
      // merchantCode + merchantRefNum + customerProfileId (if exists, otherwise "") + paymentMethod + amount (in two decimal format 10.00) + cardNumber + cardExpiryYear + cardExpiryMonth + cvv + returnUrl + secureKey
      
      // Convert values to numbers BEFORE signature generation to ensure consistency
      const cardExpiryYearNum = parseInt(paymentData.cardExpiryYear);
      const cardExpiryMonthNum = parseInt(paymentData.cardExpiryMonth);
      const cvvNum = parseInt(paymentData.cvv);
      const amountNum = parseFloat(paymentData.amount.toString());
      
      // Format values exactly as Fawry expects
      const formattedAmount = amountNum.toFixed(2);           // "100.00" format
      const formattedExpiryYear = cardExpiryYearNum.toString().padStart(2, '0');  // "29" format
      const formattedExpiryMonth = cardExpiryMonthNum.toString().padStart(2, '0'); // "05" format
      const formattedCvv = cvvNum.toString();                 // "123" format
      
      // Clean card number (remove spaces) - MUST be used in BOTH signature and payload
      const cleanCardNumber = paymentData.cardNumber.replace(/\s/g, '');
      
      // Build returnUrl exactly as it will appear in payload
      const returnUrl = `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amountNum}&step=3ds_payment`;
      
      const signatureString = credentials.merchantCode +
        merchantRefNum +
        (paymentData.customerProfileId || "") +
        'CARD' +
        formattedAmount +
        cleanCardNumber +                    // Use clean card number (no spaces)
        formattedExpiryYear +
        formattedExpiryMonth +
        formattedCvv +
        returnUrl +
        credentials.securityKey;

      const signature = await generateSHA256(signatureString);
      
      console.log('Signature generation details:', {
        merchantCode: credentials.merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: paymentData.customerProfileId || "",
        paymentMethod: 'CARD',
        amount: formattedAmount,
        cardNumber: cleanCardNumber,           // Show clean card number
        cardNumberOriginal: paymentData.cardNumber, // Show original for comparison
        cardExpiryYear: formattedExpiryYear,
        cardExpiryMonth: formattedExpiryMonth,
        cvv: formattedCvv,
        returnUrl: returnUrl,
        signatureString: signatureString,
        generatedSignature: signature
      });

      // Verify signature string construction
      console.log('=== SIGNATURE VERIFICATION ===');
      console.log('Signature components:', {
        merchantCode: credentials.merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: paymentData.customerProfileId || "",
        paymentMethod: 'CARD',
        amount: formattedAmount,
        cardNumber: cleanCardNumber,
        cardExpiryYear: formattedExpiryYear,
        cardExpiryMonth: formattedExpiryMonth,
        cvv: formattedCvv,
        returnUrl: returnUrl,
        secureKey: credentials.securityKey ? '***HIDDEN***' : 'MISSING'
      });
      console.log('Full signature string:', signatureString);
      console.log('Generated signature:', signature);
      console.log('=== END SIGNATURE VERIFICATION ===');

      // Create 3DS payment payload according to Fawry documentation
      const paymentPayload: Fawry3dsPaymentRequest = {
        merchantCode: credentials.merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: paymentData.customerProfileId,
        paymentMethod: 'CARD',
        cardNumber: cleanCardNumber,           // Use the SAME clean card number from signature
        cardExpiryYear: formattedExpiryYear,    // Use the formatted string
        cardExpiryMonth: formattedExpiryMonth,  // Use the formatted string
        cvv: formattedCvv,                      // Use the formatted string
        customerName: paymentData.customerName,
        customerMobile: paymentData.customerMobile,
        customerEmail: paymentData.customerEmail,
        amount: amountNum,                       // Use the number
        description: paymentData.description,
        language: 'en-gb',
        currencyCode: 'EGP',
        chargeItems: paymentData.chargeItems,
        enable3DS: true,                    // Required: Enable 3DS authentication
        authCaptureModePayment: false,      // Required: Authentication capture mode
        returnUrl: returnUrl,               // Use the EXACT same returnUrl from signature
        orderWebHookUrl: `${window.location.origin}/api/fawry/webhook`, // Optional: Webhook for status updates
        saveCardInfo: false,                // Optional: Save card for future use
        signature: signature
      };

      // Pre-flight validation - check for common Fawry requirements
      const validationErrors = [];
      
      if (!paymentPayload.merchantCode || paymentPayload.merchantCode.trim() === '') {
        validationErrors.push('merchantCode is required');
      }
      
      if (!paymentPayload.merchantRefNum || paymentPayload.merchantRefNum.trim() === '') {
        validationErrors.push('merchantRefNum is required');
      }
      
      if (!paymentPayload.cardNumber || paymentPayload.cardNumber.length < 13) {
        validationErrors.push('cardNumber must be at least 13 digits');
      }
      
      if (!paymentPayload.cardExpiryYear || paymentPayload.cardExpiryYear.length !== 2) {
        validationErrors.push('cardExpiryYear must be 2 digits (YY)');
      }
      
      if (!paymentPayload.cardExpiryMonth || paymentPayload.cardExpiryMonth.length !== 2) {
        validationErrors.push('cardExpiryMonth must be 2 digits (MM)');
      }
      
      if (!paymentPayload.cvv || paymentPayload.cvv.length < 3) {
        validationErrors.push('cvv must be at least 3 digits');
      }
      
      if (!paymentPayload.amount || paymentPayload.amount <= 0) {
        validationErrors.push('amount must be greater than 0');
      }
      
      if (!paymentPayload.customerMobile || paymentPayload.customerMobile.trim() === '') {
        validationErrors.push('customerMobile is required');
      }
      
      if (!paymentPayload.customerEmail || paymentPayload.customerEmail.trim() === '') {
        validationErrors.push('customerEmail is required');
      }
      
      if (!Array.isArray(paymentPayload.chargeItems) || paymentPayload.chargeItems.length === 0) {
        validationErrors.push('chargeItems array is required and must not be empty');
      }
      
      if (validationErrors.length > 0) {
        console.error('Fawry payload validation failed:', validationErrors);
        throw new Error(`Payload validation failed: ${validationErrors.join(', ')}`);
      }

      console.log('Creating 3DS payment with payload:', paymentPayload);

      // Detailed payload inspection for debugging
      console.log('=== FULL PAYLOAD INSPECTION ===');
      console.log('Raw payload object:', JSON.stringify(paymentPayload, null, 2));
      console.log('Charge items structure:', paymentPayload.chargeItems.map(item => ({
        itemId: item.itemId,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        priceType: typeof item.price,
        quantityType: typeof item.quantity
      })));
      console.log('Card details:', {
        cardNumber: paymentPayload.cardNumber,
        cardNumberLength: paymentPayload.cardNumber.length,
        cardNumberClean: paymentPayload.cardNumber.replace(/\s/g, ''),
        cardNumberCleanLength: paymentPayload.cardNumber.replace(/\s/g, '').length,
        expiryYear: paymentPayload.cardExpiryYear,
        expiryMonth: paymentPayload.cardExpiryMonth,
        cvv: paymentPayload.cvv,
        cvvLength: paymentPayload.cvv.length
      });
      console.log('Customer details:', {
        name: paymentPayload.customerName,
        mobile: paymentPayload.customerMobile,
        email: paymentPayload.customerEmail,
        profileId: paymentPayload.customerProfileId
      });
      console.log('=== END PAYLOAD INSPECTION ===');

      // Call Fawry 3DS payment API
      const response = await fetch(endpoints.paymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fawry API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const paymentResponse: Fawry3dsPaymentResponse = await response.json();
      console.log('Fawry 3DS payment response:', paymentResponse);

      return paymentResponse;

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