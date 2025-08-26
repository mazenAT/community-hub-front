import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { frontendWebhookHandler } from '../services/frontendWebhookHandler';
import { frontendTransactionTracker } from '../services/frontendTransactionTracker';
import { toast } from 'sonner';
import { fawry3dsService } from '../services/fawry3dsService';

const FawryCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState<'processing' | 'completed' | 'failed' | 'unknown'>('processing');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  // Complete 3DS payment flow after authentication
  const complete3dsPaymentFlow = async (pendingTransaction: any) => {
    try {
      console.log('Completing 3DS payment flow for transaction:', pendingTransaction);
      
      // Initialize secure credentials first
      const { secureCredentials } = await import('../services/secureCredentials');
      await secureCredentials.initialize();
      
      // Get Fawry credentials
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();
      
      // Generate signature for payment
      const signatureString = credentials.merchantCode + 
        pendingTransaction.merchantRefNum + 
        (pendingTransaction.customerProfileId || "") + 
        'CARD' + 
        pendingTransaction.amount.toFixed(2) + 
        (pendingTransaction.cardToken || '') + 
        '123' + // CVV from stored transaction (assuming a default or retrieving from storage)
        `${window.location.origin}/fawry-callback?merchantRefNum=${pendingTransaction.merchantRefNum}&amount=${pendingTransaction.amount}&step=payment&customerProfileId=${pendingTransaction.customerProfileId}&customerName=${encodeURIComponent(pendingTransaction.customerName)}&customerMobile=${pendingTransaction.customerMobile}&customerEmail=${encodeURIComponent(pendingTransaction.customerEmail)}` + 
        credentials.securityKey;
      
      const signature = await generateSHA256(signatureString);
      
      // Create payment payload
      const paymentPayload = {
        merchantCode: credentials.merchantCode,
        merchantRefNum: pendingTransaction.merchantRefNum,
        customerProfileId: pendingTransaction.customerProfileId,
        customerName: pendingTransaction.customerName,
        customerMobile: pendingTransaction.customerMobile,
        customerEmail: pendingTransaction.customerEmail,
        cardToken: pendingTransaction.cardToken,
        cvv: 123, // Assuming CVV is stored or a default for testing
        amount: pendingTransaction.amount,
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Wallet Recharge (3DS Authenticated)',
        language: 'en-gb',
        chargeItems: [
          {
            itemId: 'wallet_recharge_3ds',
            description: 'Wallet Recharge (3DS Authenticated)',
            price: pendingTransaction.amount,
            quantity: 1
          }
        ],
        returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${pendingTransaction.merchantRefNum}&amount=${pendingTransaction.amount}&step=payment&customerProfileId=${pendingTransaction.customerProfileId}&customerName=${encodeURIComponent(pendingTransaction.customerName)}&customerMobile=${pendingTransaction.customerMobile}&customerEmail=${encodeURIComponent(pendingTransaction.customerEmail)}`,
        signature: signature
      };
      
      console.log('Processing 3DS authenticated payment:', paymentPayload);
      
      // Call Fawry payment API
      const response = await fetch(endpoints.paymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Payment API error: ${response.status}`);
      }
      
      const paymentData = await response.json();
      console.log('3DS payment response:', paymentData);
      
      if (paymentData.statusCode === 200) {
        // Payment successful
        frontendTransactionTracker.markTransactionCompleted(pendingTransaction.transactionId, pendingTransaction.merchantRefNum);
        
        // Update wallet balance in backend with better error handling
        try {
          const { api } = await import('../services/api');
          console.log('Updating wallet balance in backend:', {
            amount: pendingTransaction.amount,
            userId: pendingTransaction.customerProfileId,
            fawryReference: pendingTransaction.merchantRefNum
          });
          
          const balanceResponse = await api.post('/wallet/update-balance', {
            amount: pendingTransaction.amount,
            type: 'top_up',
            note: `Fawry recharge (3DS) - Reference: ${pendingTransaction.merchantRefNum}`
          });
          
          console.log('Wallet balance updated successfully:', balanceResponse.data);
        } catch (error) {
          console.error('Failed to update wallet balance in backend:', error);
          // Don't fail the entire flow - user can contact support
          toast.warning('Payment successful but wallet update failed. Please contact support.');
        }
        
        // Clear pending transaction
        localStorage.removeItem('pending_3ds_transaction');
        
        // Set success status
        setTransactionStatus('completed');
        setTransactionDetails({
          amount: pendingTransaction.amount,
          status: 'completed',
          fawry_reference: pendingTransaction.merchantRefNum,
          updated_at: new Date().toISOString()
        });
        
        toast.success('Payment successful! Your wallet has been recharged.');
      } else {
        // Payment failed
        frontendTransactionTracker.markTransactionFailed(
          pendingTransaction.transactionId,
          paymentData.statusDescription || '3DS payment failed',
          `3DS_PAYMENT_${paymentData.statusCode || 'FAILED'}`
        );
        
        // Clear pending transaction
        localStorage.removeItem('pending_3ds_transaction');
        
        setTransactionStatus('failed');
        toast.error('Payment failed after 3DS authentication');
      }
      
    } catch (error) {
      console.error('Error completing 3DS payment flow:', error);
      
      // Clear pending transaction
      localStorage.removeItem('pending_3ds_transaction');
      
      setTransactionStatus('failed');
      toast.error('Failed to complete payment after 3DS authentication');
    }
  };

  // Process 3DS callback response
  const process3dsCallbackResponse = (callbackData: any) => {
    try {
      // Check if this is a 3DS callback response from Fawry
      if (callbackData.type === 'ChargeResponse') {
        const statusCode = callbackData.statusCode;
        const isSuccess = statusCode === '200' || statusCode === 200;
        
        if (isSuccess) {
          // Payment successful
          setTransactionStatus('completed');
          setTransactionDetails({
            amount: callbackData.paymentAmount || callbackData.amount,
            status: 'completed',
            fawry_reference: callbackData.referenceNumber || callbackData.merchantRefNumber,
            updated_at: new Date().toISOString()
          });
          
          toast.success('Payment completed successfully!');
          
          // Only update wallet balance if payment succeeded
          if (callbackData.paymentAmount || callbackData.amount) {
            updateWalletBalance(
              parseFloat(callbackData.paymentAmount || callbackData.amount), 
              callbackData.referenceNumber || callbackData.merchantRefNumber
            );
          }
        } else {
          // Payment failed - handle all failure cases
          setTransactionStatus('failed');
          setTransactionDetails({
            amount: callbackData.paymentAmount || callbackData.amount || 0,
            status: 'failed',
            fawry_reference: callbackData.referenceNumber || callbackData.merchantRefNumber,
            error_code: callbackData.statusCode,
            error_message: callbackData.statusDescription,
            updated_at: new Date().toISOString()
          });
          
          toast.error(`Payment failed: ${callbackData.statusDescription || 'Unknown error'}`);
        }
        
        // Return true to prevent fallthrough to webhook processing
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing 3DS callback response:', error);
      return false;
    }
  };

  // Update wallet balance in backend
  const updateWalletBalance = async (amount: number, reference: string) => {
    try {
      const { api } = await import('../services/api');
      
      console.log('Updating wallet balance via 3DS callback:', {
        amount: amount,
        reference: reference,
        timestamp: new Date().toISOString()
      });
      
      const balanceResponse = await api.post('/wallet/update-balance', {
        amount: amount,
        type: 'top_up',
        note: `Fawry recharge (3DS callback) - Reference: ${reference}`
      });
      
      console.log('Wallet balance updated successfully via callback:', balanceResponse.data);
      return true;
      
    } catch (error) {
      console.error('Failed to update wallet balance via callback:', error);
      
      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Backend response error:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        });
      } else if (error && typeof error === 'object' && 'request' in error) {
        const axiosError = error as any;
        console.error('Backend request error:', {
          request: axiosError.request,
          message: axiosError.message
        });
      } else {
        console.error('Backend error:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      
      // Show user-friendly error message
      toast.error('Payment successful but wallet update failed. Please contact support.');
      return false;
    }
  };

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      setProcessing(true);
      
      // Check if this is a 3DS callback (returning from 3DS authentication)
      const pending3dsTransaction = localStorage.getItem('pending_3ds_transaction');
      if (pending3dsTransaction) {
        await complete3dsPaymentFlow(JSON.parse(pending3dsTransaction));
        return;
      }
      
      // Extract callback data from URL parameters
      const callbackData = {
        merchantRefNum: searchParams.get('merchantRefNum'),
        amount: searchParams.get('amount'),
        step: searchParams.get('step'),
        customerProfileId: searchParams.get('customerProfileId'),
        customerName: searchParams.get('customerName'),
        customerMobile: searchParams.get('customerMobile'),
        customerEmail: searchParams.get('customerEmail'),
        status: searchParams.get('status'),
        message: searchParams.get('message'),
        orderStatus: searchParams.get('orderStatus'),
        paymentAmount: searchParams.get('paymentAmount'),
        paymentMethod: searchParams.get('paymentMethod'),
        merchantCode: searchParams.get('merchantCode'),
        signature: searchParams.get('signature'),
        // 3DS callback specific parameters
        type: searchParams.get('type'),
        referenceNumber: searchParams.get('referenceNumber'),
        orderAmount: searchParams.get('orderAmount'),
        fawryFees: searchParams.get('fawryFees'),
        paymentTime: searchParams.get('paymentTime')
      };

      // Try to process as 3DS callback response first
      if (callbackData.type === 'ChargeResponse') {
        const success = process3dsCallbackResponse(callbackData);
        if (success) {
          return;
        }
      }
      
      // Try to process as webhook data
      if (callbackData.orderStatus) {
        const webhookData = {
          requestId: callbackData.merchantRefNum || '',
          fawryRefNumber: callbackData.merchantRefNum || '',
          merchantRefNumber: callbackData.merchantRefNum || '',
          customerName: callbackData.customerName || '',
          customerMobile: callbackData.customerMobile || '',
          customerEmail: callbackData.customerEmail || '',
          customerMail: callbackData.customerEmail || '',
          customerMerchantId: callbackData.customerProfileId || '',
          paymentAmount: parseFloat(callbackData.paymentAmount || '0'),
          orderAmount: parseFloat(callbackData.amount || '0'),
          orderStatus: callbackData.orderStatus,
          paymentStatus: callbackData.orderStatus,
          paymentMethod: callbackData.paymentMethod || '',
          merchantCode: callbackData.merchantCode || '',
          orderExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          orderItems: '',
          signature: callbackData.signature || '',
        };

        const success = frontendWebhookHandler.processWebhookData(webhookData);
        if (success) {
          // Find the updated transaction
          const transactions = frontendTransactionTracker.getAllTransactions();
          const transaction = transactions.find(t => 
            t.fawry_reference === callbackData.merchantRefNum ||
            t.amount === parseFloat(callbackData.amount || '0')
          );

          if (transaction) {
            setTransactionDetails(transaction);
            setTransactionStatus(transaction.status === 'completed' ? 'completed' : 'failed');
          }
        }
      } else {
        // Process as regular callback data
        const callbackDataProcessed = {
          merchantRefNum: callbackData.merchantRefNum || undefined,
          amount: callbackData.amount || undefined,
          step: callbackData.step || undefined,
          customerProfileId: callbackData.customerProfileId || undefined,
          customerName: callbackData.customerName || undefined,
          customerMobile: callbackData.customerMobile || undefined,
          customerEmail: callbackData.customerEmail || undefined,
          status: callbackData.status || undefined,
          message: callbackData.message || undefined,
          orderStatus: callbackData.orderStatus || undefined,
          paymentAmount: callbackData.paymentAmount || undefined,
          paymentMethod: callbackData.paymentMethod || undefined,
          merchantCode: callbackData.merchantCode || undefined,
          signature: callbackData.signature || undefined,
          type: callbackData.type || undefined,
          referenceNumber: callbackData.referenceNumber || undefined,
          orderAmount: callbackData.orderAmount || undefined,
          fawryFees: callbackData.fawryFees || undefined,
          paymentTime: callbackData.paymentTime || undefined
        };
        
        const success = frontendWebhookHandler.processCallbackData(callbackDataProcessed);
        if (success) {
          // Find the updated transaction
          const transactions = frontendTransactionTracker.getAllTransactions();
          const transaction = transactions.find(t => 
            t.fawry_reference === callbackData.merchantRefNum ||
            t.amount === parseFloat(callbackData.amount || '0')
          );

          if (transaction) {
            setTransactionDetails(transaction);
            setTransactionStatus(transaction.status === 'completed' ? 'completed' : 'failed');
          }
        }
      }

      // If no transaction found, mark as unknown
      if (!transactionDetails) {
        setTransactionStatus('unknown');
      }

    } catch (error) {
      console.error('Error processing callback:', error);
      setTransactionStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (transactionStatus) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'processing':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (transactionStatus) {
      case 'completed':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'processing':
        return 'Processing Payment...';
      default:
        return 'Payment Status Unknown';
    }
  };

  const getStatusMessage = () => {
    switch (transactionStatus) {
      case 'completed':
        return 'Your wallet has been recharged successfully. You can now use the funds for meal purchases.';
      case 'failed':
        return 'The payment could not be completed. Please try again or contact support if the issue persists.';
      case 'processing':
        return 'We are processing your payment. This may take a few moments.';
      default:
        return 'We could not determine the status of your payment. Please check your wallet or contact support.';
    }
  };

  const getStatusColor = () => {
    switch (transactionStatus) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-brand-red animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white rounded-2xl">
        <CardContent className="p-8 text-center">
          {getStatusIcon()}
          
          <h1 className={`text-2xl font-bold mt-4 mb-2 ${getStatusColor()}`}>
            {getStatusTitle()}
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {getStatusMessage()}
          </p>

          {transactionDetails && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Transaction Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Amount: <span className="font-medium">{transactionDetails.amount} EGP</span></div>
                <div>Status: <span className="font-medium capitalize">{transactionDetails.status}</span></div>
                {transactionDetails.fawry_reference && (
                  <div>Reference: <span className="font-medium">{transactionDetails.fawry_reference}</span></div>
                )}
                <div>Date: <span className="font-medium">
                  {new Date(transactionDetails.updated_at).toLocaleString()}
                </span></div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/wallet')}
              className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl font-medium"
            >
              Back to Wallet
            </Button>
            
            {transactionStatus === 'failed' && (
              <Button
                onClick={() => navigate('/recharge')}
                variant="outline"
                className="w-full h-12 border-2 border-gray-200 hover:border-brand-red hover:bg-brand-red/5 text-gray-700 rounded-xl font-medium"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
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

export default FawryCallback; 