import AmountSelector from '@/components/AmountSelector';
import PaymentForm from '@/components/PaymentForm';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { walletApi } from '@/services/api';
import { BillingData, PaymentMethod } from '@/types/payment';
import { ArrowLeft, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const RechargeWallet: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'amount' | 'method' | 'billing' | 'payment'>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmountSubmit = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setStep('method');
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('billing');
  };

  const handleBillingSubmit = (data: BillingData) => {
    setBillingData(data);
    setStep('payment');
    initiatePayment(data);
  };

  const initiatePayment = async (billingData: BillingData) => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await walletApi.recharge({
        amount,
        payment_method: selectedMethod.id,
        payment_details: {
          order_id: `wallet_recharge_${Date.now()}`,
          item_name: 'Wallet Recharge',
          description: 'Recharge wallet balance',
          billing_data: billingData
        }
      });

      if (response.data.success) {
        // Redirect to Paymob payment page
        window.location.href = response.data.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initiate payment');
        setStep('billing');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setStep('billing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'method':
        setStep('amount');
        break;
      case 'billing':
        setStep('method');
        break;
      case 'payment':
        setStep('billing');
        break;
      default:
        navigate('/wallet');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'amount':
        return <AmountSelector onSubmit={handleAmountSubmit} />;
      case 'method':
        return <PaymentMethodSelector onSelect={handleMethodSelect} />;
      case 'billing':
        return <PaymentForm onSubmit={handleBillingSubmit} />;
      case 'payment':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold">Redirecting to Payment...</h2>
            <p className="text-gray-600">Please complete your payment in the new window.</p>
            <p className="text-sm text-gray-500">
              Amount: {amount} EGP via {selectedMethod?.name}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Recharge Wallet</h1>
          <div className="w-6"></div>
        </div>
        <p className="text-white/90 text-sm mt-1">
          {step === 'amount' && 'Select recharge amount'}
          {step === 'method' && 'Choose payment method'}
          {step === 'billing' && 'Enter billing details'}
          {step === 'payment' && 'Processing payment...'}
        </p>
      </div>

      <div className="px-4 py-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default RechargeWallet;