// Frontend-only webhook handler for Fawry payment notifications
// This processes webhook data from URL redirects and updates transaction statuses
// Aligned with Fawry Server Notification V2 API documentation

import { frontendTransactionTracker, FrontendTransaction } from './frontendTransactionTracker';
import { api } from './api'; // Add API import for backend calls

// Fawry Server Notification V2 parameters (from official documentation)
export interface FawryWebhookData {
  // Core transaction identifiers
  requestId: string;                    // UUID generated Request id
  fawryRefNumber: string;              // Fawry's reference number
  merchantRefNumber: string;            // Merchant's reference number
  
  // Customer information
  customerName: string;
  customerMobile: string;
  customerMail: string;
  customerMerchantId: string;
  
  // Payment details
  paymentAmount: number;               // Amount paid by customer
  orderAmount: number;                 // Amount without fees
  paymentMethod: string;
  paymentStatus: string;               // Fawry's payment status
  
  // Order information
  orderStatus: string;                 // Fawry's order status
  orderExpiryDate: string;
  orderItems: string;
  
  // 3DS information (if applicable)
  threeDSInfo?: {
    eci: string;
    cavv: string;
    verStatus: string;
    xid: string;
  };
  
  // Additional fields
  merchantCode: string;
  signature: string;
  [key: string]: any;
}

export interface FawryCallbackData {
  merchantRefNum?: string;
  amount?: string;
  step?: string;
  customerProfileId?: string;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

// Fawry order status values (from official documentation)
export const FAWRY_ORDER_STATUSES = {
  CREATED: 'created',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  DECLINED: 'declined',
  PENDING: 'pending',
  PROCESSING: 'processing'
} as const;

// Fawry payment status values
export const FAWRY_PAYMENT_STATUSES = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  DECLINED: 'declined'
} as const;

// 3DS verification status values (from official documentation)
export const FAWRY_3DS_VER_STATUSES = {
  Y: 'Y', // Successfully authenticated
  E: 'E', // Not enrolled
  N: 'N', // Not verified
  U: 'U', // Unable to authenticate (system error)
  F: 'F', // Format error
  A: 'A', // Authentication failed
  D: 'D', // Directory server communication error
  C: 'C', // Card type not supported
  M: 'M', // Attempts processing used
  S: 'S', // Signature validation failed
  T: 'T', // ACS timeout
  P: 'P', // Parsing error
  I: 'I'  // Internal system error
} as const;

export const frontendWebhookHandler = {
  // Process webhook data from Fawry redirect (aligned with Server Notification V2)
  processWebhookData: (webhookData: FawryWebhookData): boolean => {
    try {
      // Extract key information using official Fawry parameters
      const {
        requestId,
        fawryRefNumber,
        merchantRefNumber,
        customerName,
        customerMobile,
        customerMail,
        customerMerchantId,
        paymentAmount,
        orderAmount,
        paymentMethod,
        paymentStatus,
        orderStatus,
        threeDSInfo
      } = webhookData;

      // Find transaction by Fawry reference numbers
      const transactions = frontendTransactionTracker.getAllTransactions();
      const transaction = transactions.find(t => 
        t.fawry_reference === fawryRefNumber ||
        t.fawry_reference === merchantRefNumber ||
        t.fawry_reference === webhookData.merchantRefNum || // Fallback for legacy
        t.fawry_reference === webhookData.orderReference    // Fallback for legacy
      );

      if (!transaction) {
        // No transaction found - this might be a duplicate webhook
        return false;
      }

      // Update transaction based on Fawry's official order status
      switch (orderStatus?.toLowerCase()) {
        case FAWRY_ORDER_STATUSES.PAID:
        case FAWRY_ORDER_STATUSES.DELIVERED:
            frontendTransactionTracker.markTransactionCompleted(
              transaction.id,
              fawryRefNumber || merchantRefNumber
            );
            
            // **CRITICAL FIX**: Update wallet balance in backend
            frontendWebhookHandler.updateWalletBalance(transaction.amount, transaction.user_id, fawryRefNumber || merchantRefNumber, orderStatus);
            
            break;

        case FAWRY_ORDER_STATUSES.CANCELLED:
        case FAWRY_ORDER_STATUSES.EXPIRED:
        case FAWRY_ORDER_STATUSES.FAILED:
        case FAWRY_ORDER_STATUSES.DECLINED:
          frontendTransactionTracker.markTransactionFailed(
            transaction.id,
            webhookData.statusDescription || webhookData.message || `Payment ${orderStatus}`,
            `FAWRY_${orderStatus?.toUpperCase() || 'FAILED'}`
          );
          break;

        case FAWRY_ORDER_STATUSES.CREATED:
        case FAWRY_ORDER_STATUSES.PENDING:
        case FAWRY_ORDER_STATUSES.PROCESSING:
        case FAWRY_ORDER_STATUSES.SHIPPED:
          frontendTransactionTracker.updateTransaction(transaction.id, {
            fawry_status: orderStatus.toUpperCase(),
            fawry_ref_number: fawryRefNumber,
            merchant_ref_number: merchantRefNumber,
            payment_amount: paymentAmount,
            order_amount: orderAmount,
            three_ds_info: threeDSInfo,
            updated_at: new Date().toISOString()
          });
          break;

        default:
          // Unknown status - log for investigation
          return false;
      }

      // Process 3DS information if available
      if (threeDSInfo) {
        // 3DS authentication info processed silently
      }

      return true;
      
    } catch (error) {
      // Error processing webhook data - handled silently
      return false;
    }
  },

  // Get 3DS verification status description
  get3DSVerStatusDescription: (verStatus: string): string => {
    switch (verStatus) {
      case FAWRY_3DS_VER_STATUSES.Y:
        return 'Cardholder successfully authenticated';
      case FAWRY_3DS_VER_STATUSES.E:
        return 'Cardholder not enrolled in 3DS';
      case FAWRY_3DS_VER_STATUSES.N:
        return 'Cardholder not verified';
      case FAWRY_3DS_VER_STATUSES.U:
        return 'Unable to authenticate (issuer system error)';
      case FAWRY_3DS_VER_STATUSES.F:
        return 'Format error in request';
      case FAWRY_3DS_VER_STATUSES.A:
        return 'Authentication failed';
      case FAWRY_3DS_VER_STATUSES.D:
        return 'Directory server communication error';
      case FAWRY_3DS_VER_STATUSES.C:
        return 'Card type not supported for 3DS';
      case FAWRY_3DS_VER_STATUSES.M:
        return 'Attempts processing used';
      case FAWRY_3DS_VER_STATUSES.S:
        return 'Signature validation failed';
      case FAWRY_3DS_VER_STATUSES.T:
        return 'ACS timeout';
      case FAWRY_3DS_VER_STATUSES.P:
        return 'Parsing error from issuer';
      case FAWRY_3DS_VER_STATUSES.I:
        return 'Internal system error';
      default:
        return 'Unknown verification status';
    }
  },

  // Process callback data from Fawry redirects (legacy support)
  processCallbackData: (callbackData: FawryCallbackData): boolean => {
    try {
      const {
        merchantRefNum,
        amount,
        step,
        customerProfileId,
        status,
        message
      } = callbackData;

      if (step === 'token') {
        // This is from card token creation
        return true;
      }

      if (step === 'payment') {
        // This is from payment processing
        if (status === 'success' || status === 'completed') {
          // Find and update transaction
          const transactions = frontendTransactionTracker.getAllTransactions();
          const transaction = transactions.find(t => 
            t.fawry_reference === merchantRefNum ||
            t.amount === parseFloat(amount || '0')
          );

          if (transaction) {
            frontendTransactionTracker.markTransactionCompleted(
              transaction.id,
              merchantRefNum
            );
            
            // **CRITICAL FIX**: Update wallet balance in backend
            frontendWebhookHandler.updateWalletBalance(transaction.amount, transaction.user_id, merchantRefNum || undefined, 'paid');
            
            return true;
          }
        } else if (status === 'failed' || status === 'cancelled') {
          // Find and mark as failed
          const transactions = frontendTransactionTracker.getAllTransactions();
          const transaction = transactions.find(t => 
            t.fawry_reference === merchantRefNum ||
            t.amount === parseFloat(amount || '0')
          );

          if (transaction) {
            frontendTransactionTracker.markTransactionFailed(
              transaction.id,
              message || 'Payment failed',
              `CALLBACK_${status?.toUpperCase() || 'FAILED'}`
            );
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      // Error processing callback data - handled silently
      return false;
    }
  },

  // **NEW METHOD**: Update wallet balance in backend after successful recharge
  updateWalletBalance: async (amount: number, userId: number, fawryReference?: string, paymentStatus?: string): Promise<void> => {
    try {
      // Validate that we have valid data before making the API call
      if (!amount || amount <= 0) {
        return;
      }
      
      if (!fawryReference) {
        return;
      }
      
      // **CRITICAL FIX**: Only update wallet for successful payments
      if (paymentStatus) {
        const statusStr = String(paymentStatus).toLowerCase();
        if (statusStr !== '200' && statusStr !== 'paid' && statusStr !== 'delivered') {
          return;
        }
      }
      
      const response = await api.post('/wallet/update-balance', {
        amount: amount,
        type: 'top_up',
        note: `Fawry recharge - Reference: ${fawryReference}`
      });

      if (response.status === 200) {
        // Wallet balance updated successfully
      }
    } catch (error) {
      // Error updating wallet balance in backend - handled silently
      
      // Don't throw error to prevent breaking the callback flow
      // The frontend transaction is already marked as completed
      // Admin can manually reconcile failed balance updates
    }
  },

  // Extract webhook data from URL parameters (aligned with Fawry Server Notification V2)
  extractWebhookDataFromURL: (url: string): FawryWebhookData | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Extract all parameters using Fawry's official parameter names
      const webhookData: FawryWebhookData = {
        requestId: params.get('requestId') || '',
        fawryRefNumber: params.get('fawryRefNumber') || '',
        merchantRefNumber: params.get('merchantRefNumber') || '',
        customerName: params.get('customerName') || '',
        customerMobile: params.get('customerMobile') || '',
        customerMail: params.get('customerMail') || '',
        customerMerchantId: params.get('customerMerchantId') || '',
        paymentAmount: parseFloat(params.get('paymentAmount') || '0'),
        orderAmount: parseFloat(params.get('orderAmount') || '0'),
        paymentMethod: params.get('paymentMethod') || '',
        paymentStatus: params.get('paymentStatus') || '',
        orderStatus: params.get('orderStatus') || '',
        orderExpiryDate: params.get('orderExpiryDate') || '',
        orderItems: params.get('orderItems') || '',
        merchantCode: params.get('merchantCode') || '',
        signature: params.get('signature') || '',
      };

      // Add any additional parameters
      for (const [key, value] of params.entries()) {
        if (!webhookData.hasOwnProperty(key)) {
          webhookData[key] = value;
        }
      }

      return webhookData;
    } catch (error) {
      // Error extracting webhook data from URL - handled silently
      return null;
    }
  },

  // Extract callback data from URL parameters (legacy support)
  extractCallbackDataFromURL: (url: string): FawryCallbackData | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const callbackData: FawryCallbackData = {
        merchantRefNum: params.get('merchantRefNum') || undefined,
        amount: params.get('amount') || undefined,
        step: params.get('step') || undefined,
        customerProfileId: params.get('customerProfileId') || undefined,
        customerName: params.get('customerName') || undefined,
        customerMobile: params.get('customerMobile') || undefined,
        customerEmail: params.get('customerEmail') || undefined,
        status: params.get('status') || undefined,
        message: params.get('message') || undefined,
      };

      // Add any additional parameters
      for (const [key, value] of params.entries()) {
        if (!callbackData.hasOwnProperty(key)) {
          callbackData[key] = value;
        }
      }

      return callbackData;
    } catch (error) {
      // Error extracting callback data from URL - handled silently
      return null;
    }
  },

  // Handle page load to process any pending webhook data
  handlePageLoad: (): void => {
    try {
      const currentURL = window.location.href;
      
      // Check if this is a Fawry callback (both new and legacy formats)
      if (currentURL.includes('fawry-callback') || 
          currentURL.includes('merchantRefNum') || 
          currentURL.includes('orderStatus') ||
          currentURL.includes('fawryRefNumber') ||
          currentURL.includes('requestId')) {
        
        // Try to extract webhook data first (Server Notification V2 format)
        const webhookData = frontendWebhookHandler.extractWebhookDataFromURL(currentURL);
        if (webhookData && (webhookData.orderStatus || webhookData.fawryRefNumber)) {
          frontendWebhookHandler.processWebhookData(webhookData);
          return;
        }

        // Try to extract callback data (legacy format)
        const callbackData = frontendWebhookHandler.extractCallbackDataFromURL(currentURL);
        if (callbackData) {
          frontendWebhookHandler.processCallbackData(callbackData);
          return;
        }
      }
    } catch (error) {
      // Error handling page load webhook - handled silently
    }
  },

  // Listen for URL changes (for SPA navigation)
  setupURLChangeListener: (): void => {
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        frontendWebhookHandler.handlePageLoad();
      }, 100);
    });

    // Listen for pushstate events (programmatic navigation)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => {
        frontendWebhookHandler.handlePageLoad();
      }, 100);
    };
  },

  // Initialize webhook handling
  initialize: (): void => {
    // Handle current page load
    frontendWebhookHandler.handlePageLoad();
    
    // Setup listeners for future navigation
    frontendWebhookHandler.setupURLChangeListener();
    
    // Frontend webhook handler initialized (Fawry Server Notification V2 compatible)
  }
};

export default frontendWebhookHandler; 