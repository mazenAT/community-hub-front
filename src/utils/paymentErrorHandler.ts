/**
 * Payment Error Handler Utility
 * Provides consistent error handling for payment-related operations
 */

export interface PaymentError {
  message: string;
  code?: string;
  details?: any;
}

export class PaymentErrorHandler {
  /**
   * Extract error message from various error formats
   */
  static extractErrorMessage(error: any): string {
    // Handle axios response errors
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.response?.data?.errors) {
      // Handle validation errors array
      if (Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.join(', ');
      }
      return String(error.response.data.errors);
    }
    
    // Handle direct error messages
    if (error.message) {
      return error.message;
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    
    // Handle CORS errors
    if (error.response?.status === 0) {
      return 'Request blocked. Please try again or contact support.';
    }
    
    // Handle HTTP status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Authentication required. Please log in and try again.';
        case 403:
          return 'Access denied. You do not have permission to perform this action.';
        case 404:
          return 'Service not found. Please contact support.';
        case 422:
          return 'Validation error. Please check your input and try again.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later or contact support.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `Request failed with status ${error.response.status}. Please try again.`;
      }
    }
    
    // Fallback error message
    return 'An unexpected error occurred. Please try again or contact support.';
  }

  /**
   * Extract error code from error response
   */
  static extractErrorCode(error: any): string | undefined {
    return error.response?.data?.code || error.code;
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: any): boolean {
    return error.code === 'ERR_NETWORK' || 
           error.message === 'Network Error' ||
           error.response?.status === 0;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): boolean {
    return error.response?.status === 422 || 
           error.response?.status === 400;
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: any): boolean {
    return error.response?.status === 401 || 
           error.response?.status === 403;
  }

  /**
   * Format error for display to user
   */
  static formatErrorForUser(error: any): PaymentError {
    return {
      message: this.extractErrorMessage(error),
      code: this.extractErrorCode(error),
      details: error.response?.data
    };
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getUserFriendlyMessage(error: any): string {
    const errorInfo = this.formatErrorForUser(error);
    
    // Handle specific payment errors
    if (errorInfo.code) {
      switch (errorInfo.code) {
        case 'INSUFFICIENT_FUNDS':
          return 'Insufficient funds. Please check your account balance.';
        case 'CARD_DECLINED':
          return 'Your card was declined. Please try a different payment method.';
        case 'INVALID_CARD':
          return 'Invalid card details. Please check your card information.';
        case 'EXPIRED_CARD':
          return 'Your card has expired. Please use a different card.';
        case 'INVALID_PHONE':
          return 'Invalid phone number format. Please use format 01XXXXXXXXX.';
        case 'INVALID_EMAIL':
          return 'Invalid email address. Please check your email format.';
        case 'PAYMENT_TIMEOUT':
          return 'Payment timed out. Please try again.';
        case 'PAYMENT_CANCELLED':
          return 'Payment was cancelled. Please try again if you want to complete the payment.';
        default:
          return errorInfo.message;
      }
    }
    
    return errorInfo.message;
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    const errorInfo = this.formatErrorForUser(error);
    
    console.error(`Payment Error${context ? ` (${context})` : ''}:`, {
      message: errorInfo.message,
      code: errorInfo.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      details: errorInfo.details
    });
  }
}

export default PaymentErrorHandler;