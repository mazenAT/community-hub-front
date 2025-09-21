import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract callback parameters from URL
        const transactionId = searchParams.get('transaction_id');
        const paymentStatus = searchParams.get('status');
        const errorMessage = searchParams.get('error');
        
        if (paymentStatus === 'success' && transactionId) {
          setStatus('success');
          setMessage('Payment completed successfully! Your wallet has been recharged.');
          
          // Refresh wallet balance by navigating to wallet page
          setTimeout(() => {
            navigate('/wallet');
          }, 3000);
        } else if (paymentStatus === 'failed' || errorMessage) {
          setStatus('error');
          setMessage(errorMessage || 'Payment failed. Please try again.');
        } else {
          setStatus('error');
          setMessage('Invalid payment response. Please contact support.');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment. Please contact support.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Processing Payment...</h2>
              <p className="text-gray-600">Please wait while we process your payment.</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600">Payment Successful!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to wallet in 3 seconds...</p>
              <Button
                onClick={() => navigate('/wallet')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Go to Wallet
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">Payment Failed</h2>
              <p className="text-gray-600">{message}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/recharge')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/wallet')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Wallet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;