import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const FawryCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [cvv, setCvv] = useState('');
  const [showCvvForm, setShowCvvForm] = useState(false);

  useEffect(() => {
    // Handle the callback from 3DS
    const params = new URLSearchParams(location.search);
    const merchantRefNum = params.get('merchantRefNum');
    const chargeAmount = params.get('amount');
    const callbackStep = params.get('step');
    const status = params.get('status') || params.get('statusCode'); // Check both status and statusCode
    const message = params.get('message') || params.get('statusDescription'); // Check both message and statusDescription
    const token = params.get('cardToken') || params.get('token'); // Check both cardToken and token
    
    if (merchantRefNum && chargeAmount) {
      setStep(callbackStep);
      setAmount(chargeAmount);
      
      if (callbackStep === 'token') {
        // This is callback from token creation step
        if (status === '200' || status === 'success') {
          // Token created successfully, now need CVV for payment
          if (token) {
            setCardToken(token);
            setShowCvvForm(true);
            toast.success('Card token created successfully. Please enter CVV to complete payment.');
          } else {
            setError('Card token not received. Please try again.');
            toast.error('Card token not received. Please try again.');
          }
        } else {
          setError(message || 'Card token creation failed. Please try again.');
          toast.error(message || 'Card token creation failed. Please try again.');
        }
      } else if (callbackStep === 'payment') {
        // This is callback from payment step
        if (status === '200' || status === 'success') {
          setSuccess(true);
          toast.success('Payment successful! Your wallet has been recharged.');
        } else {
          setError(message || 'Payment failed. Please try again.');
          toast.error(message || 'Payment failed. Please try again.');
        }
      } else {
        // Legacy callback handling
        if (status === '200' || status === 'success') {
          setSuccess(true);
          toast.success('Payment successful! Your wallet has been recharged.');
        } else {
          setError(message || 'Payment failed. Please try again.');
          toast.error(message || 'Payment failed. Please try again.');
        }
      }
    } else {
      setError('Invalid callback from Fawry. Please try again.');
      toast.error('Invalid callback from Fawry. Please try again.');
    }
    
    setLoading(false);
  }, [location]);

  const handleCvvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvv || !cardToken || !amount) {
      toast.error('Please enter CVV to continue.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/wallet/recharge-fawry`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cardToken: cardToken,
          cvv: cvv,
          amount: amount
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Payment requires 3DS, redirect to Fawry
        window.location.href = data.redirectUrl;
      } else if (data.message) {
        // Payment successful without 3DS
        setSuccess(true);
        toast.success('Payment successful! Your wallet has been recharged.');
      } else {
        setError(data.error || 'Failed to complete payment.');
        toast.error(data.error || 'Failed to complete payment.');
      }
    } catch (error) {
      setError('An error occurred while completing payment.');
      toast.error('An error occurred while completing payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/wallet');
  };

  const handleRetry = () => {
    navigate('/recharge');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (showCvvForm && cardToken) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Complete Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCvvSubmit} className="space-y-4">
              <p className="text-gray-600 text-center">
                Your card has been securely authorized. Please re-enter your CVV to complete the payment of <strong>{amount} EGP</strong>.
              </p>
              <div>
                <label htmlFor="cvv" className="sr-only">CVV</label>
                <Input
                  id="cvv"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                  required
                  className="h-12 text-lg"
                  maxLength={4}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 text-xl">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Complete Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {success ? (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-gray-600">
                Your wallet has been successfully recharged. You can now use your balance for purchases.
              </p>
              <Button onClick={handleContinue} className="w-full h-14 text-xl">
                Continue to Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-gray-600">
                {error || 'The payment could not be processed. Please try again.'}
              </p>
              <Button onClick={handleRetry} variant="outline" className="w-full h-14 text-xl">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FawryCallback; 