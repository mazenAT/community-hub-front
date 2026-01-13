import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { walletApi } from '@/services/api';
import { toast } from 'sonner';

interface WalletInfo {
  balance: number;
  previousBalance: number;
}

type PaymentStatus = 'loading' | 'processing' | 'success' | 'error' | 'timeout';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef<number | null>(null);
  const maxPolls = 30; // Max 30 polls = ~60 seconds
  const pollInterval = 2000; // Poll every 2 seconds

  // Extract payment info from URL
  const transactionId = searchParams.get('id');
  const isSuccess = searchParams.get('success') === 'true';
  const amountCents = searchParams.get('amount_cents');
  const merchantOrderId = searchParams.get('merchant_order_id');
  const amountEGP = amountCents ? (parseInt(amountCents) / 100).toString() : '';

  /**
   * Fetch current wallet balance
   */
  const fetchWalletBalance = useCallback(async (): Promise<number | null> => {
    try {
      const response = await walletApi.getBalance();
      return response.data?.balance ?? response.data?.data?.balance ?? null;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return null;
    }
  }, []);

  /**
   * Check if wallet has been credited by comparing with initial balance
   */
  const checkWalletCredited = useCallback(async (): Promise<boolean> => {
    const currentBalance = await fetchWalletBalance();
    
    if (currentBalance === null) {
      return false;
    }

    setWalletBalance(currentBalance);

    // If we have an initial balance reference, check if it increased
    if (initialBalanceRef.current !== null) {
      const expectedAmount = amountCents ? parseFloat(amountCents) / 100 : 0;
      const balanceIncrease = currentBalance - initialBalanceRef.current;
      
      // Check if balance increased by approximately the expected amount (with small tolerance)
      if (balanceIncrease >= expectedAmount * 0.99) {
        return true;
      }
    }

    return false;
  }, [fetchWalletBalance, amountCents]);

  /**
   * Start polling for wallet balance updates
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      setPollCount(prev => {
        const newCount = prev + 1;
        
        if (newCount >= maxPolls) {
          // Timeout - stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setStatus('timeout');
          setMessage('Payment is still being processed. Your wallet will be updated shortly. Please check your wallet balance in a few minutes.');
          return newCount;
        }

        return newCount;
      });

      const credited = await checkWalletCredited();
      
      if (credited) {
        // Success! Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setStatus('success');
        setMessage(`Payment completed successfully! Your wallet has been recharged with ${amountEGP ? `${amountEGP} EGP` : 'the amount'}.`);
        toast.success('Payment completed successfully!');
        
        // Redirect to wallet after 3 seconds
        setTimeout(() => {
          navigate('/wallet');
        }, 3000);
      }
    }, pollInterval);
  }, [checkWalletCredited, amountEGP, navigate]);

  /**
   * Handle initial payment result
   */
  useEffect(() => {
    const handlePaymentResult = async () => {
      console.log('PaymentSuccess: Processing payment result', {
        transactionId,
        isSuccess,
        amountCents,
        merchantOrderId
      });

      // Get initial wallet balance
      const initialBalance = await fetchWalletBalance();
      initialBalanceRef.current = initialBalance;
      setWalletBalance(initialBalance);

      if (!isSuccess) {
        // Payment failed
        setStatus('error');
        setMessage(searchParams.get('error') || 'Payment failed. Please try again.');
        return;
      }

      if (!merchantOrderId) {
        setStatus('error');
        setMessage('Invalid payment response. Please contact support.');
        return;
      }

      // Set amount for display
      setAmount(amountEGP);
      
      // Check if already credited
      const alreadyCredited = await checkWalletCredited();
      
      if (alreadyCredited) {
        setStatus('success');
        setMessage(`Payment completed successfully! Your wallet has been recharged with ${amountEGP ? `${amountEGP} EGP` : 'the amount'}.`);
        toast.success('Payment completed successfully!');
        
        setTimeout(() => {
          navigate('/wallet');
        }, 3000);
      } else {
        // Payment successful but wallet not yet credited - start polling
        setStatus('processing');
        setMessage('Payment successful! Updating your wallet...');
        startPolling();
      }
    };

    handlePaymentResult();

    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [searchParams, isSuccess, merchantOrderId, amountEGP, transactionId, amountCents, checkWalletCredited, fetchWalletBalance, navigate, startPolling]);

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
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
                <p className="text-gray-600">Checking payment status...</p>
              </div>
            </div>
          )}

          {/* Processing State - Polling for wallet update */}
          {status === 'processing' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-600 mb-2">Processing Payment...</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                {amount && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-semibold">
                      Amount: {amount} EGP
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating wallet balance... ({pollCount}/{maxPolls})</span>
                </div>
              </div>
              <Button
                onClick={handleGoToWallet}
                variant="outline"
                className="w-full"
              >
                Check Wallet Balance
              </Button>
            </div>
          )}
          
          {/* Success State */}
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
                    {walletBalance !== null && (
                      <p className="text-green-700 text-sm mt-1">
                        New Balance: {walletBalance.toFixed(2)} EGP
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-500 italic">Redirecting to wallet in 3 seconds...</p>
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

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-600 mb-2">Still Processing</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                {amount && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-semibold">
                      Amount: {amount} EGP
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleGoToWallet}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 text-lg font-semibold"
                >
                  Check Wallet Balance
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          )}
          
          {/* Error State */}
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
