import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { frontendWebhookHandler } from '../services/frontendWebhookHandler';
import { frontendTransactionTracker } from '../services/frontendTransactionTracker';
import { toast } from 'sonner';

const FawryCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState<'processing' | 'completed' | 'failed' | 'unknown'>('processing');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      setProcessing(true);
      
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
      };

      console.log('Processing Fawry callback with data:', callbackData);

      // Try to process as webhook data first
      if (callbackData.orderStatus) {
        const webhookData = {
          merchantRefNum: callbackData.merchantRefNum || '',
          orderStatus: callbackData.orderStatus,
          paymentAmount: callbackData.paymentAmount || '',
          paymentMethod: callbackData.paymentMethod || '',
          merchantCode: callbackData.merchantCode || '',
          orderItems: '',
          customerMobile: callbackData.customerMobile || '',
          customerEmail: callbackData.customerEmail || '',
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
        const success = frontendWebhookHandler.processCallbackData(callbackData);
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

export default FawryCallback; 