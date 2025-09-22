import BottomNavigation from "@/components/BottomNavigation";
import InstaPayModal from "@/components/InstaPayModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Copy, CreditCard, Loader2, Smartphone } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { instaPayApi, profileApi, walletApi } from "../services/api";

// Updated interface with card data fields
interface PaymobCardDetails {
  // Billing information
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city: string;
  country: string;
  // Card information
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  card_holder_name: string;
}

interface PaymobWalletDetails {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
}

const Recharge = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [instaPayData, setInstaPayData] = useState<any>(null);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [copiedParentName, setCopiedParentName] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showInstaPayModal, setShowInstaPayModal] = useState(false);
  const [instaPayDetails, setInstaPayDetails] = useState({
    referenceCode: '',
    bankDetails: null,
    amount: 0,
    userName: ''
  });

  // Paymob popup states
  const [showCardModal, setShowCardModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Updated state with card data fields
  const [paymobCardDetails, setPaymobCardDetails] = useState<PaymobCardDetails>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    city: '',
    country: 'Egypt',
    // Card data
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_holder_name: ''
  });
  
  const [paymobWalletDetails, setPaymobWalletDetails] = useState<PaymobWalletDetails>({
    phone_number: '',
    first_name: '',
    last_name: '',
    email: ''
  });

  const paymentMethods = [
    {
      id: 'instapay',
      name: 'InstaPay',
      description: 'Bank transfer via InstaPay',
      icon: Building2,
      color: 'from-brand-red to-brand-orange'
    },
    {
      id: 'paymob_card',
      name: 'Card Payment',
      description: 'Credit/Debit card via Paymob',
      icon: CreditCard,
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

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    if (methodId === 'instapay') {
      handleRechargeClick();
    } else if (methodId === 'paymob_card') {
      setShowCardModal(true);
    } else if (methodId === 'paymob_wallet') {
      setShowWalletModal(true);
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

      if (selectedPaymentMethod === 'instapay') {
        await handleInstaPayTopup(finalAmount);
      } else {
        await handlePaymobPayment(finalAmount, selectedPaymentMethod);
      }
    } catch (error) {
      console.error('Recharge initialization error:', error);
      toast.error("Failed to start recharge process. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleInstaPayTopup = async (amount: number) => {
    try {
      setIsSubmitting(true);
      setError('');

      const response = await instaPayApi.createTopupRequest(amount);
      
      if (response.data.success) {
        const { reference_code, bank_account, instructions } = response.data.data;
        setInstaPayData({
          reference_code,
          bank_account,
          instructions,
          amount: amount,
          parent_name: profile?.name || 'Parent Name'
        });
        
        setInstaPayDetails({
          referenceCode: reference_code,
          bankDetails: bank_account,
          amount: amount,
          userName: profile?.name || 'N/A'
        });
        setShowInstaPayModal(true);
        
        toast.success('Transfer details generated! Please complete your transfer.');
      } else {
        toast.error(response.data.message || 'Failed to create top-up request');
      }
    } catch (error) {
      console.error('InstaPay topup error:', error);
      toast.error('Failed to create top-up request. Please try again.');
    } finally {
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
      if (paymobCardDetails.cvv.length < 3) {
        toast.error('Please enter a valid CVV');
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

  const handlePaymobPayment = async (amount: number, paymentMethod: string) => {
    // This method is kept for backward compatibility but won't be used
  };

  const copyToClipboard = async (text: string, type: 'account' | 'parent') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'account') {
        setCopiedAccountNumber(true);
        toast.success('Account number copied to clipboard!');
        setTimeout(() => setCopiedAccountNumber(false), 2000);
      } else {
        setCopiedParentName(true);
        toast.success('Parent name copied to clipboard!');
        setTimeout(() => setCopiedParentName(false), 2000);
      }
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptImage || !instaPayData?.parent_name) {
      toast.error('Please select a receipt image to upload.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await instaPayApi.uploadReceipt(
        instaPayData.reference_code,
        receiptImage
      );
      if (response.data.success) {
        toast.success('Receipt uploaded successfully! We will validate and credit your wallet within minutes.');
        
        setShowTransferDetails(false);
        setInstaPayData(null);
        setReceiptImage(null);
        
        navigate('/wallet');
      } else {
        toast.error(response.data.message || 'Failed to upload receipt. Please try again.');
      }
    } catch (error) {
      console.error('Receipt upload error:', error);
      toast.error('Failed to upload receipt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      toast.success('Receipt image selected! Please click "Upload Receipt" to submit.');
    }
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
        {!showTransferDetails ? (
          <>
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
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-bold text-brand-black mb-4">Select Payment Method</h2>
                  <div className="space-y-3">
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

            {/* Recharge Button */}
            <Button
              onClick={handleRechargeClick}
              disabled={isSubmitting || !amount}
              className="w-full bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white font-semibold py-3 rounded-xl shadow-lg"
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
          </>
        ) : (
          <>
            {/* Transfer Details */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
            <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                <Building2 className="w-4 h-4 text-blue-600" />
                Send money to this Bank account
            </h3>
            
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{instaPayData.amount} EGP</div>
                  <div className="text-sm text-gray-600">Amount to transfer</div>
            </div>
            
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Bank</div>
                    <div className="text-lg font-semibold">CIB</div>
          </div>

            <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Account Name</div>
                    <div className="text-lg font-semibold">Lite Bite For Food Services</div>
      </div>
      
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Account Number</div>
        <Button 
                      onClick={() => copyToClipboard("100054480207", "account")}
                      variant="outline"
                      className="w-full justify-center gap-2"
                    >
                      {copiedAccountNumber ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Account Number
                        </>
          )}
        </Button>
      </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Parent Name</div>
                    <div className="text-lg font-semibold bg-white p-2 rounded border mb-2">{instaPayData.parent_name}</div>
                    <Button
                      onClick={() => copyToClipboard(instaPayData.parent_name, "parent")}
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2"
                    >
                      {copiedParentName ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Parent Name
                        </>
                      )}
                    </Button>
              </div>


            </div>
              </div>
            </div>

            {/* Upload Receipt */}

            {/* Important Note */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Important</h4>
                  <p className="text-sm text-blue-700">
                    When making the transfer in your InstaPay app, please paste the parent name above as the <strong>"Reason for transfer"</strong>. This helps us validate and process your payment faster.
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Example */}
            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
              <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                Receipt Example
              </h3>
              
              <div className="text-center mb-4">
                <img 
                  src="/insta-example.jpeg" 
                  alt="Receipt Example" 
                  className="max-w-full h-auto rounded-lg border border-gray-200 mx-auto"
                  style={{ maxHeight: '300px' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('/insta-example.jpeg', '_blank')}
                >
                  View Example
                </Button>
              </div>
            </div>

            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
              <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                Upload Receipt
              </h3>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 transition-colors"
                disabled={isSubmitting}
              />
              
              {receiptImage && !isSubmitting && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
                    <Check className="w-4 h-4" />
                    <span>Selected: {receiptImage.name}</span>
                  </div>
                  <Button
                    onClick={handleReceiptUpload}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting}
                  >
                    Upload Receipt
                  </Button>
                </div>
              )}
              
              {isSubmitting && (
                <div className="mt-3 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Uploading receipt...</p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <Button
              onClick={() => setShowTransferDetails(false)}
              variant="outline"
              className="w-full h-12"
            >
              Back to Amount
            </Button>
          </>
        )}
        </div>

      {/* Card Payment Modal with Card Input Fields */}
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
                    <label className="text-sm font-medium text-gray-700">City *</label>
                    <Input
                      value={paymobCardDetails.city}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <Input
                      value={paymobCardDetails.country}
                      onChange={(e) => setPaymobCardDetails(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter country"
                    />
                  </div>
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

      {/* Simplified Mobile Wallet Modal - Only Required Fields */}
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

      <InstaPayModal
        open={showInstaPayModal}
        onOpenChange={setShowInstaPayModal}
        referenceCode={instaPayDetails.referenceCode}
        bankDetails={instaPayDetails.bankDetails}
        amount={instaPayDetails.amount}
        userName={instaPayDetails.userName}
      />

      <BottomNavigation />
    </div>
  );
};

export default Recharge;
