import BottomNavigation from "@/components/BottomNavigation";
import SavedCardPayment from "@/components/SavedCardPayment";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { profileApi, walletApi } from "../services/api";

// Complete interface with all required fields
interface PaymobCardDetails {
  // Card information
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  card_holder_name: string;
  // Billing information
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment: string;
  floor: string;
  street: string;
  building: string;
  city: string;
  country: string;
  postal_code: string;
  state: string;
  save_card: boolean;
}

interface PaymobWalletDetails {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  save_wallet: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  name: string;
  maskedNumber?: string;
  lastUsed: string;
  data: PaymobCardDetails | PaymobWalletDetails;
}

const Recharge = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showSavedCards, setShowSavedCards] = useState(false);
  const [useSavedCard, setUseSavedCard] = useState(false);

  // Paymob popup states
  const [showCardModal, setShowCardModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSavedMethodsModal, setShowSavedMethodsModal] = useState(false);
  
  // Saved payment methods state
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  
  // Complete state with all required fields
  const [paymobCardDetails, setPaymobCardDetails] = useState<PaymobCardDetails>({
    // Card information
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_holder_name: '',
    // Billing information
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    apartment: '',
    floor: '',
    street: '',
    building: '',
    city: '',
    country: 'Egypt',
    postal_code: '',
    state: '',
    save_card: false
  });
  
  const [paymobWalletDetails, setPaymobWalletDetails] = useState<PaymobWalletDetails>({
    phone_number: '',
    first_name: '',
    last_name: '',
    email: '',
    save_wallet: false
  });

  const paymentMethods = [
    {
      id: 'saved_card',
      name: 'Saved Card',
      description: 'Use a previously saved card',
      icon: CreditCard,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'paymob_card',
      name: 'Card Payment',
      description: 'Credit/Debit card via Paymob',
      icon: Wallet,
      color: 'from-brand-orange to-brand-yellow'
    },
    {
      id: 'paymob_wallet',
      name: 'Mobile Wallet',
      description: 'Vodafone Cash, Orange Money, etc.',
      icon: Smartphone,
      color: 'from-brand-yellow to-brand-red'
    }
  ];

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });
  const profile = profileData?.data;

  // Load saved payment methods on component mount
  React.useEffect(() => {
    loadSavedPaymentMethods();
  }, []);

  // Load saved payment methods from localStorage
  const loadSavedPaymentMethods = () => {
    try {
      const saved = localStorage.getItem('savedPaymentMethods');
      if (saved) {
        const methods = JSON.parse(saved);
        setSavedPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
    }
  };

  // Save payment method to localStorage
  const savePaymentMethod = (type: 'card' | 'wallet', data: PaymobCardDetails | PaymobWalletDetails) => {
    try {
      const newMethod: SavedPaymentMethod = {
        id: `${type}_${Date.now()}`,
        type,
        name: type === 'card' 
          ? `**** **** **** ${(data as PaymobCardDetails).card_number.slice(-4)}`
          : `Wallet ${(data as PaymobWalletDetails).phone_number}`,
        maskedNumber: type === 'card' ? `**** **** **** ${(data as PaymobCardDetails).card_number.slice(-4)}` : undefined,
        lastUsed: new Date().toISOString(),
        data
      };

      const updatedMethods = [...savedPaymentMethods, newMethod];
      setSavedPaymentMethods(updatedMethods);
      localStorage.setItem('savedPaymentMethods', JSON.stringify(updatedMethods));
      toast.success('Payment method saved successfully!');
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    }
  };

  // Load a specific saved method into the form
  const loadSavedMethod = (methodId: string) => {
    const method = savedPaymentMethods.find(m => m.id === methodId);
    if (!method) return;

    // Update last used timestamp
    const updatedMethods = savedPaymentMethods.map((m: SavedPaymentMethod) => 
      m.id === methodId 
        ? { ...m, lastUsed: new Date().toISOString() }
        : m
    );
    setSavedPaymentMethods(updatedMethods);
    localStorage.setItem('savedPaymentMethods', JSON.stringify(updatedMethods));

    if (method.type === 'card') {
      setPaymobCardDetails(method.data as PaymobCardDetails);
      setShowCardModal(true);
    } else {
      setPaymobWalletDetails(method.data as PaymobWalletDetails);
      setShowWalletModal(true);
    }
    setShowSavedMethodsModal(false);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    if (methodId === 'saved_card') {
      setUseSavedCard(true);
      setShowSavedCards(true);
    } else if (methodId === 'paymob_card') {
      // Check if there are saved card methods
      const cardMethods = savedPaymentMethods.filter((m: SavedPaymentMethod) => m.type === 'card');
      if (cardMethods.length > 0) {
        setShowSavedMethodsModal(true);
      } else {
        setShowCardModal(true);
      }
    } else if (methodId === 'paymob_wallet') {
      // Check if there are saved wallet methods
      const walletMethods = savedPaymentMethods.filter((m: SavedPaymentMethod) => m.type === 'wallet');
      if (walletMethods.length > 0) {
        setShowSavedMethodsModal(true);
      } else {
        setShowWalletModal(true);
      }
    }
  };

  const handleRechargeClick = async () => {
    try {
      if (!profile || !profile.id) {
        toast.error("Profile data not loaded. Please refresh the page and try again.");
        return;
      }

      const finalAmount = parseFloat(amount) || 0;
      
      if (finalAmount <= 0) {
        toast.error("Please enter a valid amount.");
        return;
      }

      if (!showPaymentMethods) {
        setShowPaymentMethods(true);
        return;
      }

      if (!selectedPaymentMethod) {
        toast.error("Please select a payment method.");
        return;
      }

      setIsSubmitting(true);

      // Handle different payment methods
      if (selectedPaymentMethod === 'saved_card') {
        setUseSavedCard(true);
        setShowSavedCards(true);
        setIsSubmitting(false);
        return;
      } else {
        await handlePaymobPayment(finalAmount, selectedPaymentMethod);
      }
    } catch (error) {
      console.error('Recharge initialization error:', error);
      toast.error("Failed to start recharge process. Please try again.");
      setIsSubmitting(false);
    }
  };


  const handlePaymobCardPayment = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validate card data
      const cardRequiredFields = ['card_number', 'expiry_month', 'expiry_year', 'cvv', 'card_holder_name'];
      const billingRequiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'city'];
      
      const allRequiredFields = [...cardRequiredFields, ...billingRequiredFields];
      const missingFields = allRequiredFields.filter(field => !paymobCardDetails[field as keyof PaymobCardDetails]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate card number format
      const cardNumber = paymobCardDetails.card_number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        toast.error('Please enter a valid card number');
        return;
      }

      // Validate CVV
      if (paymobCardDetails.cvv.length < 3 || paymobCardDetails.cvv.length > 4) {
        toast.error('Please enter a valid CVV (3-4 digits)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paymobCardDetails.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      const finalAmount = parseFloat(amount) || 0;
      const paymentDetails = {
        ...paymobCardDetails,
        card_number: cardNumber, // Remove spaces for processing
        merchant_order_id: `recharge_${Date.now()}_${profile.id}`,
        currency: 'EGP'
      };

      const response = await walletApi.recharge({
        amount: finalAmount,
        payment_method: 'paymob_card',
        payment_details: {
          order_id: paymentDetails.merchant_order_id,
          item_name: 'Wallet Recharge',
          description: 'Digital wallet top-up',
          billing_data: paymentDetails
        }
      });

      if (response.data.success) {
        // Save payment method if user opted to save
        if (paymobCardDetails.save_card) {
          savePaymentMethod('card', paymobCardDetails);
        }

        if (response.data.data.payment_url) {
          window.open(response.data.data.payment_url, '_blank');
          toast.success('Payment initiated! Please complete payment in the new window.');
          setShowCardModal(false);
        }
      } else {
        toast.error(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Paymob card payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymobWalletPayment = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validate only required fields
      const requiredFields = ['phone_number', 'first_name', 'last_name', 'email'];
      const missingFields = requiredFields.filter(field => !paymobWalletDetails[field as keyof PaymobWalletDetails]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paymobWalletDetails.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      const finalAmount = parseFloat(amount) || 0;
      const paymentDetails = {
        ...paymobWalletDetails,
        merchant_order_id: `recharge_${Date.now()}_${profile.id}`,
        currency: 'EGP'
      };

      const response = await walletApi.recharge({
        amount: finalAmount,
        payment_method: 'paymob_wallet',
        payment_details: {
          order_id: paymentDetails.merchant_order_id,
          item_name: 'Wallet Recharge',
          description: 'Digital wallet top-up',
          billing_data: paymentDetails
        }
      });

      if (response.data.success) {
        // Save payment method if user opted to save
        if (paymobWalletDetails.save_wallet) {
          savePaymentMethod('wallet', paymobWalletDetails);
        }

        if (response.data.data.payment_url) {
          window.open(response.data.data.payment_url, '_blank');
          toast.success('Payment initiated! Please complete payment in the new window.');
          setShowWalletModal(false);
        }
      } else {
        toast.error(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Paymob wallet payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymobPayment = async (_amount: number, _paymentMethod: string) => {
    // This method is kept for backward compatibility but won't be used
  };


  // Payment success/error handlers for saved cards
  const handleSavedCardPaymentSuccess = (transactionId: string) => {
    toast.success('Payment completed successfully!');
    setUseSavedCard(false);
    setShowSavedCards(false);
    navigate('/wallet');
  };

  const handleSavedCardPaymentError = (error: string) => {
    toast.error(error);
    setUseSavedCard(false);
    setShowSavedCards(false);
  };

  const handleAddNewCard = () => {
    setUseSavedCard(false);
    setShowSavedCards(false);
    setSelectedPaymentMethod('paymob_card');
    // Continue with normal card payment flow
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/wallet")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Recharge Wallet</h1>
          <div className="w-6"></div>
        </div>
        <p className="text-white/90 text-sm mt-1">Add funds to your digital wallet</p>
      </div>

      <div className="px-4 py-4">
        {!showPaymentMethods ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-brand-black mb-4">Enter Amount</h2>
                  <Input
                    type="number"
                    placeholder="Enter amount in EGP"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg"
                    data-tutorial="recharge-amount"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-brand-black mb-4">Select Payment Method</h2>
                  <div className="space-y-3" data-tutorial="recharge-payment-methods">
                    {paymentMethods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => handlePaymentMethodSelect(method.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedPaymentMethod === method.id
                              ? 'border-brand-red bg-brand-red/5 shadow-md'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                          data-tutorial={method.id === 'saved_card' ? 'recharge-saved-card-option' : undefined}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="text-lg font-semibold text-brand-black">{method.name}</h3>
                              <p className="text-gray-600">{method.description}</p>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <div className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Saved Card Payment Flow */}
            {useSavedCard && showSavedCards && (
              <div className="space-y-4" data-tutorial="recharge-saved-card-flow">
                <SavedCardPayment
                  amount={parseFloat(amount) || 0}
                  onPaymentSuccess={handleSavedCardPaymentSuccess}
                  onPaymentError={handleSavedCardPaymentError}
                  onAddNewCard={handleAddNewCard}
                />
              </div>
            )}

            {/* Recharge Button */}
            <Button
              onClick={handleRechargeClick}
              disabled={isSubmitting || !amount}
              className="w-full bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white font-semibold py-3 rounded-xl shadow-lg"
              data-tutorial="recharge-continue-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                showPaymentMethods ? 'Process Payment' : 'Continue'
              )}
            </Button>
        )}
        </div>

      {/* Complete Card Payment Modal with All Fields */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Card Payment Details
            </DialogTitle>
            <DialogDescription>
              Please fill in your card and billing information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Card Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Card Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Card Number *</label>
                  <Input
                    value={paymobCardDetails.card_number}
                    onChange={(e) => {
                      // Format card number with spaces
                      const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setPaymobCardDetails(prev => ({ ...prev, card_number: value }));
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="card-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Month *</label>
                    <select
                      value={paymobCardDetails.expiry_month}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, expiry_month: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="text-sm font-medium text-gray-700">Year *</label>
                    <select
                      value={paymobCardDetails.expiry_year}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, expiry_year: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = String(new Date().getFullYear() + i).slice(-2);
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">CVV *</label>
                    <Input
                      value={paymobCardDetails.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPaymobCardDetails(prev => ({ ...prev, cvv: value }));
                      }}
                      placeholder="123"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Cardholder Name *</label>
                  <Input
                    value={paymobCardDetails.card_holder_name}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, card_holder_name: e.target.value }))}
                    placeholder="Enter cardholder name"
                  />
                </div>
              </div>
            </div>

            {/* Billing Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Billing Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name *</label>
                    <Input
                      value={paymobCardDetails.first_name}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name *</label>
                    <Input
                      value={paymobCardDetails.last_name}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <Input
                    type="email"
                    value={paymobCardDetails.email}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                  <Input
                    value={paymobCardDetails.phone_number}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Apartment</label>
                    <Input
                      value={paymobCardDetails.apartment}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, apartment: e.target.value }))}
                      placeholder="Apartment number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Floor</label>
                    <Input
                      value={paymobCardDetails.floor}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, floor: e.target.value }))}
                      placeholder="Floor number"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Street *</label>
                  <Input
                    value={paymobCardDetails.street}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Building</label>
                  <Input
                    value={paymobCardDetails.building}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="Building name/number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">City *</label>
                    <Input
                      value={paymobCardDetails.city}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <Input
                      value={paymobCardDetails.state}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Country *</label>
                    <Input
                      value={paymobCardDetails.country}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Postal Code</label>
                    <Input
                      value={paymobCardDetails.postal_code}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="save_card"
                    checked={paymobCardDetails.save_card}
                    onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, save_card: e.target.checked }))}
                    className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                  />
                  <label htmlFor="save_card" className="text-sm text-gray-700">
                    Save this card for future payments
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCardModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymobCardPayment}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Mobile Wallet Modal with Save Option */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Mobile Wallet Details
            </DialogTitle>
            <DialogDescription>
              Please fill in your details for mobile wallet payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number *</label>
              <Input
                value={paymobWalletDetails.phone_number}
                onChange={(e) => setPaymobWalletDetails(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name *</label>
                <Input
                  value={paymobWalletDetails.first_name}
                  onChange={(e) => setPaymobWalletDetails(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Name *</label>
                <Input
                  value={paymobWalletDetails.last_name}
                  onChange={(e) => setPaymobWalletDetails(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <Input
                type="email"
                value={paymobWalletDetails.email}
                onChange={(e) => setPaymobWalletDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="save_wallet"
                checked={paymobWalletDetails.save_wallet}
                onChange={(e) => setPaymobWalletDetails(prev => ({ ...prev, save_wallet: e.target.checked }))}
                className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
              />
              <label htmlFor="save_wallet" className="text-sm text-gray-700">
                Save this wallet for future payments
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowWalletModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymobWalletPayment}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Payment Methods Modal */}
      <Dialog open={showSavedMethodsModal} onOpenChange={setShowSavedMethodsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Saved Payment Methods
            </DialogTitle>
            <DialogDescription>
              Choose a saved payment method or add a new one
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {savedPaymentMethods
              .filter((method: SavedPaymentMethod) => 
                selectedPaymentMethod === 'paymob_card' ? method.type === 'card' : method.type === 'wallet'
              )
              .map((method: SavedPaymentMethod) => (
                <div
                  key={method.id}
                  onClick={() => loadSavedMethod(method.id)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center">
                        {method.type === 'card' ? (
                          <CreditCard className="w-5 h-5 text-white" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-500">
                          Last used: {new Date(method.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-brand-red">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowSavedMethodsModal(false);
                  if (selectedPaymentMethod === 'paymob_card') {
                    setShowCardModal(true);
                  } else {
                    setShowWalletModal(true);
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Add New {selectedPaymentMethod === 'paymob_card' ? 'Card' : 'Wallet'}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSavedMethodsModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <BottomNavigation />
    </div>
  );
};

export default Recharge;
