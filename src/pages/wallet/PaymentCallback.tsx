import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { walletApi } from '@/services/api';
import { toast } from 'sonner';

type PaymentStatus = 'loading' | 'processing' | 'success' | 'error' | 'timeout';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef<number | null>(null);
  const maxPolls = 30; // Max 30 polls = ~60 seconds
  const pollInterval = 2000; // Poll every 2 seconds

  // Extract callback parameters from URL
  const intentionId = searchParams.get('intention_id');
  const paymentStatus = searchParams.get('status');
  const amount = searchParams.get('amount');
  const amountCents = searchParams.get('amount_cents');
  const errorMessage = searchParams.get('error');
  
  // Calculate amount in EGP
  const amountValue = amountCents 
    ? parseFloat(amountCents) / 100 
    : (amount ? parseFloat(amount) : null);

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
    if (initialBalanceRef.current !== null && amountValue !== null) {
      const balanceIncrease = currentBalance - initialBalanceRef.current;
      
      // Check if balance increased by approximately the expected amount (with small tolerance)
      if (balanceIncrease >= amountValue * 0.99) {
        return true;
      }
    }

    return false;
  }, [fetchWalletBalance, amountValue]);

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
          setMessage('Payment is still being processed. Your wallet will be updated shortly. Please check your balance in a few minutes.');
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
        setMessage(`Payment completed successfully! Your wallet has been recharged${amountValue ? ` with ${amountValue.toFixed(2)} EGP` : ''}.`);
        toast.success('Payment completed successfully!');
        
        // Redirect to wallet after 3 seconds
        setTimeout(() => {
          navigate('/wallet');
        }, 3000);
      }
    }, pollInterval);
  }, [checkWalletCredited, amountValue, navigate]);

  /**
   * Handle callback processing
   */
  useEffect(() => {
    const handleCallback = async () => {
      console.log('PaymentCallback: Processing callback', {
        intentionId,
        paymentStatus,
        amount,
        amountCents,
        errorMessage
      });

      // Get initial wallet balance
      const initialBalance = await fetchWalletBalance();
      initialBalanceRef.current = initialBalance;
      setWalletBalance(initialBalance);

      // Check if payment failed
      if (paymentStatus === 'failed' || errorMessage) {
        setStatus('error');
        setMessage(errorMessage || 'Payment failed. Please try again.');
        return;
      }

      // Check if payment was successful
      if (paymentStatus === 'successful' && intentionId) {
        // Check if already credited
        const alreadyCredited = await checkWalletCredited();
        
        if (alreadyCredited) {
          setStatus('success');
          setMessage(`Payment completed successfully!${amountValue ? ` Your wallet has been recharged with ${amountValue.toFixed(2)} EGP` : ''}`);
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
      } else {
        // Unknown status
        setStatus('error');
        setMessage('Invalid payment response. Please contact support.');
      }
    };

    handleCallback();

    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [searchParams, intentionId, paymentStatus, amount, amountCents, errorMessage, amountValue, checkWalletCredited, fetchWalletBalance, navigate, startPolling]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
              <p className="text-gray-600">Checking payment status...</p>
            </div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-600">Processing Payment...</h2>
              <p className="text-gray-600">{message}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating wallet... ({pollCount}/{maxPolls})</span>
              </div>
              <Button
                onClick={() => navigate('/wallet')}
                variant="outline"
                className="w-full mt-4"
              >
                Check Wallet Balance
              </Button>
            </div>
          )}
          
          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600">Payment Successful!</h2>
              <p className="text-gray-600">{message}</p>
              {walletBalance !== null && (
                <p className="text-sm text-green-700">
                  New Balance: {walletBalance.toFixed(2)} EGP
                </p>
              )}
              <p className="text-sm text-gray-500">Redirecting to wallet in 3 seconds...</p>
              <Button
                onClick={() => navigate('/wallet')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Go to Wallet
              </Button>
            </div>
          )}

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-600">Still Processing</h2>
              <p className="text-gray-600">{message}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/wallet')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
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
