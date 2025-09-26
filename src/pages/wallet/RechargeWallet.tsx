import { walletApi, instaPayApi } from '@/services/api';
import { BillingData, PaymentMethod } from '@/types/payment';
import { ArrowLeft, Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const RechargeWallet: React.FC = () => {
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [billingData, setBillingData] = useState<BillingData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',  // Changed from phone_number
    apartment: '',
    floor: '',
    street: '',
    building: '',
    city: '',
    country: 'EG',
    postal_code: '',
    state: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'instapay',
      name: 'InstaPay',
      description: 'Bank transfer via InstaPay',
      icon: 'bank',
      type: 'instapay'
    },
    {
      id: 'paymob_card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: 'credit-card',
      type: 'card'
    },
    {
      id: 'paymob_wallet',
      name: 'Mobile Wallet',
      description: 'Vodafone Cash, Orange Money, Etisalat Cash',
      icon: 'wallet',
      type: 'wallet'
    }
  ];

  const handleContinue = () => {
    if (!customAmount || parseFloat(customAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!showPaymentMethods) {
      setShowPaymentMethods(true);
      return;
    }
    
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    // Process payment
    handlePayment();
  };

  const handlePayment = async () => {
    if (!customAmount || !selectedMethod) {
      toast.error('Please enter amount and select payment method');
      return;
    }

    const amount = parseFloat(customAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Process payment based on selected method
    switch (selectedMethod.id) {
      case 'instapay':
        await processInstaPayPayment(amount);
        break;
      case 'paymob_card':
        await processPaymobCardPayment(amount);
        break;
      case 'paymob_wallet':
        await processPaymobWalletPayment(amount);
        break;
    }
  };

  const processInstaPayPayment = async (amount: number) => {
    try {
      setIsSubmitting(true);
      const response = await instaPayApi.createTopupRequest(amount);
      
      if (response.data.success) {
        const { reference_code, bank_account, instructions } = response.data.data;
        // Store InstaPay data and redirect to InstaPay flow
        localStorage.setItem('instapay_data', JSON.stringify({
          reference_code,
          bank_account,
          instructions,
          amount,
          parent_name: 'Wallet Recharge'
        }));
        navigate('/recharge');
      } else {
        toast.error(response.data.message || 'Failed to create InstaPay request');
      }
    } catch (error: any) {
      console.error('InstaPay payment error:', error);
      toast.error(error.response?.data?.message || 'InstaPay payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processPaymobCardPayment = async (amount: number) => {
    try {
      setIsSubmitting(true);
      const response = await walletApi.recharge({
        amount,
        payment_method: 'paymob_card',
        payment_details: {
          order_id: `wallet_recharge_${Date.now()}`,
          item_name: 'Wallet Recharge',
          description: 'Recharge wallet balance',
          billing_data: {
            first_name: 'Wallet',
            last_name: 'User',
            email: 'wallet@example.com',
            phone: '+201234567890',  // Changed from phone_number
            apartment: '',
            floor: '',
            street: '',
            building: '',
            shipping_method: 'PKG',
            city: 'Cairo',
            state: 'Cairo',
            country: 'EG',
            postal_code: '12345'
          }
        }
      });

      if (response.data.success) {
        // Redirect to Paymob payment page
        window.location.href = response.data.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initiate card payment');
      }
    } catch (error: any) {
      console.error('Paymob card payment error:', error);
      toast.error(error.response?.data?.message || 'Paymob card payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processPaymobWalletPayment = async (amount: number) => {
    try {
      setIsSubmitting(true);
      const response = await walletApi.recharge({
        amount,
        payment_method: 'paymob_wallet',
        payment_details: {
          order_id: `wallet_recharge_${Date.now()}`,
          item_name: 'Wallet Recharge',
          description: 'Recharge wallet balance',
          billing_data: {
            first_name: 'Wallet',
            last_name: 'User',
            email: 'wallet@example.com',
            phone: '+201234567890',  // Changed from phone_number
            apartment: '',
            floor: '',
            street: '',
            building: '',
            shipping_method: 'PKG',
            city: 'Cairo',
            state: 'Cairo',
            country: 'EG',
            postal_code: '12345'
          }
        }
      });

      if (response.data.success) {
        // Redirect to Paymob payment page
        window.location.href = response.data.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initiate wallet payment');
      }
    } catch (error: any) {
      console.error('Paymob wallet payment error:', error);
      toast.error(error.response?.data?.message || 'Paymob wallet payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (showPaymentMethods) {
      setShowPaymentMethods(false);
      setSelectedMethod(null);
    } else {
      navigate('/wallet');
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'bank':
        return <Building2 className="w-6 h-6" />;
      case 'credit-card':
        return <CreditCard className="w-6 h-6" />;
      case 'wallet':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getAmountToSubmit = () => {
    return parseFloat(customAmount) || 0;
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
          {!showPaymentMethods ? 'Enter recharge amount' : 'Choose payment method'}
        </p>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Amount Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-center mb-6">Enter Recharge Amount</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Enter amount</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Section */}
          {showPaymentMethods && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-center mb-6">Select Payment Method</h3>
              
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedMethod?.id === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600">{getIcon(method.icon)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      {selectedMethod?.id === method.id && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!customAmount || parseFloat(customAmount) <= 0 || isSubmitting}
            className={`w-full h-12 text-lg font-semibold rounded-lg transition-colors ${
              !customAmount || parseFloat(customAmount) <= 0 || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </div>
            ) : showPaymentMethods ? (
              `Continue with ${customAmount} EGP`
            ) : (
              `Continue with ${customAmount || '0'} EGP`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RechargeWallet;