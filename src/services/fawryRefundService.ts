// Fawry Refund Service for handling refunds via Fawry API
// This service processes refunds for failed transactions and handles refund status updates

import { secureCredentials } from './secureCredentials';

export interface FawryRefundRequest {
  merchantCode: string;
  merchantRefNumber: string;
  fawryRefNumber: string;
  refundAmount: number;
  reason: string;
  signature: string;
}

export interface FawryRefundResponse {
  statusCode: number;
  statusDescription: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundDate?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface RefundStatusResponse {
  statusCode: number;
  statusDescription: string;
  refundStatus: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  refundAmount: number;
  refundDate: string;
  reason: string;
  adminNotes?: string;
}

export const fawryRefundService = {
  /**
   * Process refund for a failed transaction
   */
  processRefund: async (refundData: {
    merchantRefNumber: string;
    fawryRefNumber: string;
    refundAmount: number;
    reason: string;
  }): Promise<FawryRefundResponse> => {
    try {
      // Get Fawry credentials
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      // Generate refund signature
      const signatureString = credentials.merchantCode +
        refundData.merchantRefNumber +
        refundData.fawryRefNumber +
        refundData.refundAmount.toFixed(2) +
        refundData.reason +
        credentials.securityKey;

      const signature = await generateSHA256(signatureString);

      const refundPayload: FawryRefundRequest = {
        merchantCode: credentials.merchantCode,
        merchantRefNumber: refundData.merchantRefNumber,
        fawryRefNumber: refundData.fawryRefNumber,
        refundAmount: refundData.refundAmount,
        reason: refundData.reason,
        signature: signature
      };

      console.log('Processing Fawry refund with payload:', refundPayload);

      // Call Fawry refund API
      const response = await fetch(`${endpoints.baseUrl}/fawrypay-api/api/refunds/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.merchantCode}`
        },
        body: JSON.stringify(refundPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const refundResponse: FawryRefundResponse = await response.json();
      console.log('Fawry refund response:', refundResponse);

      return refundResponse;

    } catch (error) {
      console.error('Error processing Fawry refund:', error);
      throw error;
    }
  },

  /**
   * Check refund status
   */
  checkRefundStatus: async (refundId: string): Promise<RefundStatusResponse> => {
    try {
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      const response = await fetch(`${endpoints.baseUrl}/fawrypay-api/api/refunds/status/${refundId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.merchantCode}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const statusResponse: RefundStatusResponse = await response.json();
      return statusResponse;

    } catch (error) {
      console.error('Error checking refund status:', error);
      throw error;
    }
  },

  /**
   * Get refund history for a transaction
   */
  getRefundHistory: async (merchantRefNumber: string): Promise<RefundStatusResponse[]> => {
    try {
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      const response = await fetch(`${endpoints.baseUrl}/fawrypay-api/api/refunds/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.merchantCode}`
        },
        body: JSON.stringify({
          merchantCode: credentials.merchantCode,
          merchantRefNumber: merchantRefNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const historyResponse = await response.json();
      return historyResponse.refunds || [];

    } catch (error) {
      console.error('Error getting refund history:', error);
      throw error;
    }
  },

  /**
   * Cancel pending refund
   */
  cancelRefund: async (refundId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      const response = await fetch(`${endpoints.baseUrl}/fawrypay-api/api/refunds/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.merchantCode}`
        },
        body: JSON.stringify({
          merchantCode: credentials.merchantCode,
          refundId: refundId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const cancelResponse = await response.json();
      return {
        success: cancelResponse.statusCode === 200,
        message: cancelResponse.statusDescription || 'Refund cancelled successfully'
      };

    } catch (error) {
      console.error('Error cancelling refund:', error);
      throw error;
    }
  },

  /**
   * Validate refund request
   */
  validateRefundRequest: (refundData: {
    merchantRefNumber: string;
    fawryRefNumber: string;
    refundAmount: number;
    reason: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!refundData.merchantRefNumber || refundData.merchantRefNumber.trim().length === 0) {
      errors.push('Merchant reference number is required');
    }

    if (!refundData.fawryRefNumber || refundData.fawryRefNumber.trim().length === 0) {
      errors.push('Fawry reference number is required');
    }

    if (!refundData.refundAmount || refundData.refundAmount <= 0) {
      errors.push('Refund amount must be greater than 0');
    }

    if (!refundData.reason || refundData.reason.trim().length === 0) {
      errors.push('Refund reason is required');
    }

    if (refundData.reason && refundData.reason.length > 500) {
      errors.push('Refund reason must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Get refund reasons (standard Fawry reasons)
   */
  getStandardRefundReasons: (): string[] => {
    return [
      'Customer requested refund',
      'Duplicate transaction',
      'Technical error',
      'Service not provided',
      'Quality issue',
      'Customer dissatisfaction',
      'Fraudulent transaction',
      'System error',
      'Other'
    ];
  },

  /**
   * Format refund amount for display
   */
  formatRefundAmount: (amount: number, currency: string = 'EGP'): string => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Get refund status description
   */
  getRefundStatusDescription: (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Refund request is being processed';
      case 'approved':
        return 'Refund has been approved and is being processed';
      case 'rejected':
        return 'Refund request has been rejected';
      case 'completed':
        return 'Refund has been completed successfully';
      case 'failed':
        return 'Refund processing failed';
      default:
        return 'Unknown refund status';
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

export default fawryRefundService; 