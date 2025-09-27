import { walletApi } from '@/services/api';
import PaymentService from '@/services/paymentService';
import WalletService from '@/services/walletService';
import { BillingData, PaymentMethod } from '@/types/payment';
import { ArrowLeft, Loader2, CreditCard, Smartphone } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const RechargeWallet: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [billingData, setBillingData] = useState<BillingData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',  // Changed from phone to phone_number
    apartment: '',
    floor: '',
    street: '',
    building: '',
    city: 'Cairo', // Default to Cairo
    country: 'EG',
    postal_code: '',
    state: ''
  });
  const [cardData, setCardData] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_holder_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods: PaymentMethod[] = [
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
    
    if (!showBillingForm) {
      setShowBillingForm(true);
      return;
    }
    
    // For paymob_card, check if card data is filled
    if (selectedMethod.id === 'paymob_card') {
      const cardValidation = PaymentService.validateCardData(cardData);
      if (!cardValidation.isValid) {
        toast.error(cardValidation.errors.join(', '));
        return;
      }
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
      case 'paymob_card':
        await processPaymobCardPayment(amount);
        break;
      case 'paymob_wallet':
        await processPaymobWalletPayment(amount);
        break;
    }
  };


  const processPaymobCardPayment = async (amount: number) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Validate amount
      const amountValidation = WalletService.validateAmount(amount);
      if (!amountValidation.isValid) {
        toast.error(amountValidation.errors.join(', '));
        return;
      }

      // Validate card data
      const cardValidation = PaymentService.validateCardData(cardData);
      if (!cardValidation.isValid) {
        toast.error(cardValidation.errors.join(', '));
        return;
      }

      const response = await WalletService.topUpWallet({
        amount,
        payment_method: 'paymob_card',
        billing_data: {
          first_name: billingData.first_name,
          last_name: billingData.last_name,
          email: billingData.email,
          phone_number: billingData.phone_number,
          city: billingData.city,
          country: billingData.country
        },
        user_id: user.id,
        card_data: {
          card_number: cardData.card_number,
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          cvv: cardData.cvv,
          card_holder_name: cardData.card_holder_name
        }
      });

      if (response.success && response.checkout_url) {
        // Redirect to Paymob checkout page
        window.location.href = response.checkout_url;
      } else {
        toast.error(response.message || 'Failed to initiate card payment');
      }
    } catch (error: any) {
      console.error('Paymob card payment error:', error);
      toast.error(error.message || 'Paymob card payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processPaymobWalletPayment = async (amount: number) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Validate amount
      const amountValidation = WalletService.validateAmount(amount);
      if (!amountValidation.isValid) {
        toast.error(amountValidation.errors.join(', '));
        return;
      }

      const response = await WalletService.topUpWallet({
        amount,
        payment_method: 'paymob_wallet',
        billing_data: {
          first_name: billingData.first_name,
          last_name: billingData.last_name,
          email: billingData.email,
          phone_number: billingData.phone_number,
          city: billingData.city,
          country: billingData.country
        },
        user_id: user.id
      });

      if (response.success && response.checkout_url) {
        // Redirect to Paymob checkout page
        window.location.href = response.checkout_url;
      } else {
        toast.error(response.message || 'Failed to initiate wallet payment');
      }
    } catch (error: any) {
      console.error('Paymob wallet payment error:', error);
      toast.error(error.message || 'Paymob wallet payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (showBillingForm) {
      setShowBillingForm(false);
    } else if (showPaymentMethods) {
      setShowPaymentMethods(false);
      setSelectedMethod(null);
    } else {
      navigate('/wallet');
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
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
          {!showPaymentMethods ? 'Enter recharge amount' : 
           !showBillingForm ? 'Choose payment method' : 'Enter billing information'}
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
          {showPaymentMethods && !showBillingForm && (
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

          {/* Billing Information Section */}
          {showBillingForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-center mb-6">Billing Information</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Please provide your billing details for payment processing
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={billingData.first_name}
                      onChange={(e) => setBillingData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={billingData.last_name}
                      onChange={(e) => setBillingData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={billingData.email}
                    onChange={(e) => setBillingData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={billingData.phone_number}
                    onChange={(e) => setBillingData(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="01XXXXXXXXX"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 01XXXXXXXXX (11 digits starting with 01)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={billingData.city}
                    onChange={(e) => setBillingData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card Information Section - Only show for paymob_card */}
          {showBillingForm && selectedMethod?.id === 'paymob_card' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-center mb-6">Card Information</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Please enter your card details for payment processing
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                  <input
                    type="text"
                    value={cardData.card_number}
                    onChange={(e) => {
                      // Format card number with spaces every 4 digits
                      const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardData(prev => ({ ...prev, card_number: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 16-digit card number</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Month *</label>
                    <select
                      value={cardData.expiry_month}
                      onChange={(e) => setCardData(prev => ({ ...prev, expiry_month: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = String(i + 1).padStart(2, '0');
                        return (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Year *</label>
                    <select
                      value={cardData.expiry_year}
                      onChange={(e) => setCardData(prev => ({ ...prev, expiry_year: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 20 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardData(prev => ({ ...prev, cvv: value }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name *</label>
                  <input
                    type="text"
                    value={cardData.card_holder_name}
                    onChange={(e) => setCardData(prev => ({ ...prev, card_holder_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name as it appears on card"
                    required
                  />
                </div>
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
            ) : showBillingForm ? (
              `Pay ${customAmount} EGP`
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