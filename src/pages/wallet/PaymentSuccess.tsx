import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle, ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentService from '@/services/paymentService';
import WalletService from '@/services/walletService';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        // Extract callback parameters from URL
        const intentionId = searchParams.get('intention_id');
        const paymentStatus = searchParams.get('status');
        const paymentAmount = searchParams.get('amount');
        const errorMessage = searchParams.get('error');
        
        setAmount(paymentAmount || '');

        if (paymentStatus === 'successful' && intentionId) {
          try {
            // Call the success endpoint to update wallet balance
            await WalletService.handleTopUpSuccess({
              intention_id: intentionId,
              status: paymentStatus,
              amount: paymentAmount
            });
            
            setStatus('success');
            setMessage(`Payment completed successfully! Your wallet has been recharged with ${paymentAmount ? `${paymentAmount} EGP` : 'the amount'}.`);
            
            // Show success toast
            toast.success('Payment completed successfully!');
            
            // Redirect to wallet page after 2 seconds
            setTimeout(() => {
              navigate('/wallet');
            }, 2000);
            
          } catch (error) {
            console.error('Payment success processing error:', error);
            setStatus('error');
            setMessage('Payment was successful but there was an error updating your wallet. Please contact support.');
          }
        } else if (paymentStatus === 'failed' || errorMessage) {
          try {
            // Call the failure endpoint
            await WalletService.handleTopUpFailure({
              intention_id: intentionId,
              status: paymentStatus,
              error: errorMessage
            });
          } catch (error) {
            console.error('Payment failure processing error:', error);
          }
          
          setStatus('error');
          setMessage(errorMessage || 'Payment failed. Please try again.');
        } else {
          setStatus('error');
          setMessage('Invalid payment response. Please contact support.');
        }
      } catch (error) {
        console.error('Payment result processing error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment. Please contact support.');
      }
    };

    handlePaymentResult();
  }, [searchParams]);

  const handleGoToWallet = () => {
    navigate('/wallet');
  };

  const handleTryAgain = () => {
    navigate('/recharge');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                <p className="text-gray-600">Please wait while we process your payment and update your wallet.</p>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful! 🎉</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                {amount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-semibold">
                      Amount: {amount} EGP
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 italic">Redirecting to wallet in 2 seconds...</p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleGoToWallet}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                >
                  Go to Wallet Now
                </Button>
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full"
                >
                  Make Another Payment
                </Button>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-4">{message}</p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleTryAgain}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleGoToWallet}
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

export default PaymentSuccess;