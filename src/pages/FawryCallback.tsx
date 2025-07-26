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
      // Call Fawry directly for payment
      const merchantRefNum = Date.now().toString();
      const merchantCode = '770000017341';
      const securityKey = '02b9d0e3-5088-4b6e-be41-111d4359fe10';
      
      // Generate signature for payment
      const signatureString = merchantCode + 
        merchantRefNum + 
        '777777' + // customerProfileId - you might want to get this from user profile
        'CARD' + 
        parseFloat(amount).toFixed(2) + 
        cardToken + 
        cvv + 
        securityKey;
      
      const signature = await generateSHA256(signatureString);
      console.log('Payment signature string:', signatureString);
      console.log('Payment signature:', signature);

      const paymentPayload = {
        merchantCode: merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: '777777', // You might want to get this from user profile
        customerName: 'Ahmed Ali', // You might want to get this from user profile
        customerMobile: '01234567891', // You might want to get this from user profile
        customerEmail: 'example@gmail.com', // You might want to get this from user profile
        cardToken: cardToken,
        cvv: cvv,
        amount: parseFloat(amount),
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Wallet Recharge',
        language: 'en-gb',
        chargeItems: [
          {
            itemId: 'wallet_recharge',
            description: 'Wallet Recharge',
            price: parseFloat(amount),
            quantity: 1
          }
        ],
        enable3DS: true,
        returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amount}&step=payment`,
        signature: signature
      };

      console.log('Calling Fawry payment endpoint directly:', paymentPayload);

      const paymentResponse = await fetch('https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();
      console.log('Fawry payment response:', paymentData);

      if (paymentData.statusCode === 200 && paymentData.nextAction?.redirectUrl) {
        // Payment requires 3DS, redirect to Fawry
        window.location.href = paymentData.nextAction.redirectUrl;
      } else if (paymentData.statusCode === 200) {
        // Payment successful without 3DS, update wallet balance
        await updateWalletBalance(parseFloat(amount));
        setSuccess(true);
        toast.success('Payment successful! Your wallet has been recharged.');
      } else {
        // Payment failed
        setError(paymentData.statusDescription || 'Failed to complete payment.');
        toast.error(paymentData.statusDescription || 'Failed to complete payment.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('An error occurred while completing payment.');
      toast.error('An error occurred while completing payment.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate SHA256 hash
  const generateSHA256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Helper function to update wallet balance via backend
  const updateWalletBalance = async (amount: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/wallet/update-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          type: 'recharge',
          note: 'Recharge via Fawry (Direct)'
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to update wallet balance:', data.error);
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
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