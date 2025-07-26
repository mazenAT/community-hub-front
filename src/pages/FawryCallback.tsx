import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { walletApi } from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const FawryCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cvv, setCvv] = useState('');
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);

  useEffect(() => {
    // Handle the callback from 3DS and extract the parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token'); // From Fawry 3DS callback
    const merchantRefNum = params.get('merchantRefNum'); // From our return URL
    const chargeAmount = params.get('amount'); // From our return URL
    
    if (token && merchantRefNum && chargeAmount) {
      setCardToken(token);
      setAmount(chargeAmount);
    } else {
      toast.error('Invalid callback from Fawry. Please try again.');
      navigate('/recharge');
    }
  }, [location, navigate]);

  const rechargeMutation = useMutation({
    mutationFn: (data: { cardToken: string; cvv: string; amount: string }) =>
      walletApi.rechargeFawry(data),
    onSuccess: () => {
      toast.success('Recharge successful!');
      navigate('/wallet');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete recharge.');
      navigate('/recharge');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardToken && cvv && amount) {
      // Step 5: Send token, cvv, and amount to backend for final charge
      rechargeMutation.mutate({ cardToken, cvv, amount });
    }
  };

  if (!cardToken) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Confirm Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p>Your card has been securely authorized. Please re-enter your CVV to complete the payment of <strong>{amount} EGP</strong>.</p>
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
              />
            </div>
            <Button type="submit" disabled={rechargeMutation.isPending} className="w-full h-14 text-xl">
              {rechargeMutation.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Confirm Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FawryCallback; 