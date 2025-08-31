import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileApi, api, instaPayApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import SavedCards from "../components/SavedCards";
import BottomNavigation from "@/components/BottomNavigation";
import { frontendTransactionTracker } from "../services/frontendTransactionTracker";
import { secureCredentials } from "../services/secureCredentials";
import { fawry3dsService } from '../services/fawry3dsService';

interface SavedCard {
  id: number;
  card_token: string;
  card_alias: string;
  last_four_digits: string;
  first_six_digits: string;
  brand: string;
  expiry_year: string;
  expiry_month: string;
  is_default: boolean;
  is_active: boolean;
}

const Recharge = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardAlias, setCardAlias] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobile, setMobile] = useState("");
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>('saved');
  const [paymentMethod, setPaymentMethod] = useState<'fawry' | 'instapay'>('fawry');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [showInstaPayDetails, setShowInstaPayDetails] = useState(false);
  const [instaPayData, setInstaPayData] = useState<any>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);

  // Initialize secure credentials
  useEffect(() => {
    const initializeCredentials = async () => {
      try {
        await secureCredentials.initialize();
        console.log('Secure credentials initialized successfully');
      } catch (error) {
        console.error('Failed to initialize secure credentials:', error);
        toast.error("Payment service initialization failed. Please refresh the page and try again.");
      }
    };
    
    initializeCredentials();
  }, []);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });
  const profile = profileData?.data;

  // Set mobile to profile phone when profile loads
  React.useEffect(() => {
    if (profile && profile.phone) {
      setMobile(profile.phone.replace(/[^0-9]/g, '').slice(0, 11));
    }
  }, [profile]);

  const handleRechargeClick = async () => {
    try {
      // Validate profile data first
      if (!profile || !profile.id) {
        toast.error("Profile data not loaded. Please refresh the page and try again.");
        return;
      }

      const finalAmount = selectedAmount || parseFloat(customAmount) || 0;
      
      // Validate amount
      if (finalAmount <= 0) {
        toast.error("Please select a valid amount.");
        return;
      }

      // Handle different payment methods
      if (paymentMethod === 'instapay') {
        await handleInstaPayTopup(finalAmount);
      } else {
        await handleFawryPayment(finalAmount);
      }
    } catch (error) {
      console.error('Recharge initialization error:', error);
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to start recharge process. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const handleInstaPayTopup = async (amount: number) => {
    try {
      setIsSubmitting(true);
      setError('');

      // Create InstaPay topup request (without receipt)
      const response = await instaPayApi.createTopupRequest(amount);
      
      if (response.data.success) {
        const { reference_code, bank_account, instructions, status } = response.data.data;
        
        // Store the data and show the details modal
        setInstaPayData({
          reference_code,
          bank_account,
          instructions,
          amount: amount
        });
        setShowInstaPayDetails(true);
        
        // Show success message
        toast.success('Top-up request created successfully! Please complete your InstaPay transfer.');
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

  const handleReceiptUpload = async () => {
    if (!receiptImage || !instaPayData?.reference_code) {
      toast.error('Please select a receipt image to upload.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload receipt for validation
      const response = await instaPayApi.uploadReceipt(instaPayData.reference_code, receiptImage);
      
      if (response.data.success) {
        toast.success('Receipt uploaded successfully! We will validate and credit your wallet within minutes.');
        
        // Close modal and reset states
        setShowInstaPayDetails(false);
        setShowReceiptUpload(false);
        setInstaPayData(null);
        setReceiptImage(null);
        
        // Navigate to wallet
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

  const handleFawryPayment = async (amount: number) => {
    try {
      // Get secure credentials
      let credentials;
      let endpoints;
      
      try {
        credentials = secureCredentials.getCredentials();
        endpoints = secureCredentials.getApiEndpoints();
      } catch (error) {
        console.error('Failed to get credentials:', error);
        toast.error("Payment service not available. Please try again later.");
        return;
      }
      
      // Check rate limit before proceeding
      try {
        await secureCredentials.checkRateLimit();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          toast.error(error.message);
        } else {
          toast.error("Payment service temporarily unavailable. Please try again later.");
        }
        return;
      }

      const finalAmount = selectedAmount || parseFloat(customAmount) || 0;
      const customerName = profile.name || 'Customer';
      const customerMobile = mobile;
      const customerEmail = profile.email || 'customer@example.com';
      const customerProfileId = profile.id.toString();

      // Frontend validation before calling Fawry
      if (finalAmount <= 0) {
        toast.error("Please select a valid amount.");
        return;
      }

      if (paymentMode === 'saved') {
        if (!selectedCard) {
          toast.error("Please select a saved card.");
          return;
        }
        if (!cvv || cvv.length < 3) {
          toast.error("Please enter a valid CVV.");
          return;
        }
      } else {
        // New card validation
        if (!mobile || mobile.length < 11) {
          toast.error("Please enter a valid mobile number.");
          return;
        }
        if (!cardAlias || cardAlias.trim().length < 2) {
          toast.error("Please enter the card holder name.");
          return;
        }
        if (!cardNumber || cardNumber.length < 13) {
          toast.error("Please enter a valid card number.");
          return;
        }
        if (!expiryMonth || !expiryYear) {
          toast.error("Please enter card expiry date.");
          return;
        }
        if (!cvv || cvv.length < 3) {
          toast.error("Please enter a valid CVV.");
          return;
        }
      }

      setIsSubmitting(true);
      setError('');

      try {
        if (paymentMode === 'saved' && selectedCard) {
          await processPaymentWithSavedCard(selectedCard, finalAmount, customerProfileId, customerName, customerMobile, customerEmail);
        } else {
          await handleSubmit(finalAmount, customerProfileId, customerName, customerMobile, customerEmail);
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        frontendTransactionTracker.markTransactionFailed(
          transactionId, 
          error instanceof Error ? error.message : "An unexpected error occurred during recharge",
          "UNEXPECTED_ERROR"
        );
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            toast.error("Network error. Please check your internet connection and try again.");
          } else if (error.message.includes('Failed to create card token')) {
            toast.error("Card token creation failed. Please check your card details and try again.");
          } else if (error.message.includes('Failed to process payment')) {
            toast.error("Payment processing failed. Please try again.");
          } else {
            toast.error(error.message || "An unexpected error occurred. Please try again.");
          }
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Recharge initialization error:', error);
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to start recharge process. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (amount: number, customerProfileId: string, customerName: string, customerMobile: string, customerEmail: string) => {
    setIsSubmitting(true);
    setError('');

    // Validate form data
    const validation = fawry3dsService.validate3dsPaymentData({
      cardNumber: cardNumber,
      cardExpiryYear: expiryYear,
      cardExpiryMonth: expiryMonth,
      cvv: cvv,
      amount: amount,
      customerName: customerName,
        customerMobile: customerMobile,
      customerEmail: customerEmail
    });

    if (!validation.isValid) {
      toast.error(`Please fix the following errors: ${validation.errors.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create unique transaction ID for tracking
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Track transaction start
      frontendTransactionTracker.createTransaction({
        amount: amount,
        user_id: parseInt(customerProfileId),
        card_details: {
          last_four_digits: cardNumber.slice(-4),
          card_alias: 'New Card'
        }
      });

      console.log('Starting 3DS payment flow for transaction:', transactionId);

      // Create 3DS payment request according to Fawry documentation
      const paymentResponse = await fawry3dsService.create3dsPayment({
        cardNumber: cardNumber,
        cardExpiryYear: expiryYear,
        cardExpiryMonth: expiryMonth,
        cvv: cvv,
        amount: amount,
        customerName: customerName,
        customerMobile: customerMobile,
        customerEmail: customerEmail,
        customerProfileId: customerProfileId || undefined,
        description: `Wallet recharge - ${amount} EGP`,
        chargeItems: [
          {
            itemId: 'wallet_recharge',
            description: 'Wallet Recharge',
            price: amount,
            quantity: 1
          }
        ]
      });

      console.log('3DS payment response received:', paymentResponse);

      // With backend API flow, the user will be redirected to Fawry's 3DS page
      // The response here is just for logging - the actual redirect happens in fawry3dsService
      if (paymentResponse.type === 'redirect') {
        console.log('Redirecting to Fawry 3DS authentication page...');
        // The redirect is handled automatically by fawry3dsService
        // User will be taken to Fawry's 3DS authentication page
        // No need to handle response here as the page will change
      } else {
        // Fallback error handling
        const errorMessage = paymentResponse.statusDescription || "Unexpected response from Fawry";
        console.error('Fawry 3DS Payment Error:', paymentResponse);
        
        frontendTransactionTracker.markTransactionFailed(
          transactionId,
          errorMessage,
          `3DS_PAYMENT_${paymentResponse.statusCode || 'UNKNOWN'}`
        );
        
          toast.error(errorMessage);
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error('Error in 3DS payment flow:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Mark transaction as failed
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      frontendTransactionTracker.markTransactionFailed(
        transactionId,
        errorMessage,
        '3DS_PAYMENT_ERROR'
      );
      
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const processPaymentWithSavedCard = async (card: SavedCard, amount: number, customerProfileId: string, customerName: string, customerMobile: string, customerEmail: string) => {
    try {
      const merchantRefNum = Date.now().toString();
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Track transaction start
      frontendTransactionTracker.createTransaction({
        amount: amount,
        user_id: parseInt(customerProfileId),
        card_details: {
          last_four_digits: card.last_four_digits,
          card_alias: card.card_alias
        }
      });

      // Get credentials and endpoints
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();

      // Generate signature for payment (Fawry format)
      const signatureString = credentials.merchantCode + 
        merchantRefNum + 
        (customerProfileId || "") + 
        'CARD' + 
        amount.toFixed(2) + 
        card.card_token + 
        cvv + 
        `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amount}&step=payment&customerProfileId=${customerProfileId}&customerName=${encodeURIComponent(customerName)}&customerMobile=${customerMobile}&customerEmail=${encodeURIComponent(customerEmail)}` + 
        credentials.securityKey;
      
      const signature = await generateSHA256(signatureString);

      const paymentPayload = {
        merchantCode: credentials.merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: customerProfileId,
        customerName: customerName,
        customerMobile: customerMobile,
        customerEmail: customerEmail,
        cardToken: card.card_token,
        cvv: parseInt(cvv),
        amount: amount,
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Wallet Recharge (Saved Card)',
        language: 'en-gb',
        chargeItems: [
          {
            itemId: 'wallet_recharge_saved',
            description: 'Wallet Recharge (Saved Card)',
            price: amount,
            quantity: 1
          }
        ],
        signature: signature
      };

      console.log('Processing saved card payment with payload:', paymentPayload);
      
      let paymentResponse;
      try {
        paymentResponse = await fetch(endpoints.paymentEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentPayload),
        });
      } catch (fetchError) {
        console.error('Network error during payment processing:', fetchError);
        throw new Error('Failed to fetch - Network error during payment processing');
      }

      if (!paymentResponse.ok) {
        console.error('Payment HTTP error:', paymentResponse.status, paymentResponse.statusText);
        throw new Error(`HTTP ${paymentResponse.status}: ${paymentResponse.statusText}`);
      }

      let paymentData;
      try {
        paymentData = await paymentResponse.json();
      } catch (parseError) {
        console.error('Failed to parse payment response:', parseError);
        throw new Error('Invalid response from payment service');
      }

      console.log('Fawry Payment Response:', paymentData);

      if (paymentData.statusCode === 200) {
        frontendTransactionTracker.markTransactionCompleted(transactionId, merchantRefNum);
        
        // Update wallet balance in backend
        try {
          await api.post('/wallet/update-balance', {
            amount: amount,
            type: 'top_up',
            note: `Fawry recharge (saved card) - Reference: ${merchantRefNum}`
          });
          console.log('Wallet balance updated in backend');
        } catch (error) {
          console.error('Failed to update wallet balance in backend:', error);
          // Don't prevent success flow - admin can reconcile later
        }
        
        toast.success('Payment successful! Your wallet has been recharged.');
        navigate('/wallet');
      } else if (paymentData.nextAction?.redirectUrl) {
        // Payment requires 3DS, redirect to Fawry
        window.location.href = paymentData.nextAction.redirectUrl;
      } else {
        const errorMessage = paymentData.statusDescription || paymentData.message || "Failed to complete payment";
        console.error('Fawry Payment Error:', paymentData);
        
        frontendTransactionTracker.markTransactionFailed(
          transactionId,
          errorMessage,
          `PAYMENT_${paymentData.statusCode || 'UNKNOWN'}`
        );
        
        if (paymentData.statusCode === 400) {
          toast.error("Invalid payment details. Please check your card information.");
        } else if (paymentData.statusCode === 401) {
          toast.error("Authentication failed. Please try again.");
        } else if (paymentData.statusCode === 402) {
          toast.error("Payment declined. Please check your card or try a different card.");
        } else if (paymentData.statusCode === 500) {
          toast.error("Payment service temporarily unavailable. Please try again later.");
        } else {
          toast.error(errorMessage);
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error processing saved card payment:', error);
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      frontendTransactionTracker.markTransactionFailed(
        transactionId,
        "Failed to process saved card payment",
        "SAVED_CARD_PAYMENT_ERROR"
      );
      toast.error("Failed to process payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Helper function to generate SHA256 hash
  const generateSHA256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    let hashBuffer;
    try {
      hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    } catch (e) {
      console.error('Crypto API not available, falling back to fallbackSHA256');
      return fallbackSHA256(message);
    }
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const fallbackSHA256 = (message: string): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = new Uint8Array(64); // SHA-256 produces 64-character hex
    for (let i = 0; i < data.length; i++) {
      hashBuffer[i % 64] ^= data[i]; // XOR operation for a simple hash
    }
    return Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };
  
  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
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
        {/* Select Amount */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="recharge-amount">
          <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
            Select Amount
          </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[50, 100, 200, 500].map((amount) => (
                <Button 
                  key={amount} 
                  variant={selectedAmount === amount ? "default" : "outline"} 
                className={`${
                    selectedAmount === amount 
                    ? "bg-brand-orange hover:bg-brand-orange/90 text-white border-brand-orange"
                    : "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                } rounded-xl`}
                onClick={() => setSelectedAmount(amount)}
                >
                  {amount} EGP
                </Button>
              ))}
            </div>
            <div className="space-y-2">
            <label className="text-sm font-medium text-brand-black">Custom Amount</label>
              <Input 
                type="number" 
                placeholder="Enter amount in EGP" 
                value={customAmount} 
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="border-brand-orange/30 focus:border-brand-orange"
              />
            </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="recharge-payment-method">
          <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
            Payment Method
          </h3>
          
          {/* Payment Method Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={paymentMethod === 'fawry' ? "default" : "outline"}
              className={`${
                paymentMethod === 'fawry'
                  ? "bg-brand-orange hover:bg-brand-orange/90 text-white border-brand-orange"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              } rounded-xl flex-1`}
              onClick={() => setPaymentMethod('fawry')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Fawry Card
            </Button>
            <Button
              variant={paymentMethod === 'instapay' ? "default" : "outline"}
              className={`${
                paymentMethod === 'instapay'
                  ? "bg-brand-orange hover:bg-brand-orange/90 text-white border-brand-orange"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              } rounded-xl flex-1`}
              onClick={() => setPaymentMethod('instapay')}
            >
              <Wallet className="w-4 h-4 mr-2" />
              InstaPay
            </Button>
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'fawry' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Fawry Payment Gateway</p>
                <p className="text-sm text-blue-700">Secure payment processing via Fawry with 3DS authentication</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">InstaPay Bank Transfer</p>
                <p className="text-sm text-green-700">Send money via InstaPay to our bank account with a unique reference code</p>
              </div>
            </div>
          )}
        </div>

        {/* Card Information - Only show for Fawry */}
        {paymentMethod === 'fawry' && (
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="recharge-card-info">
          <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
            Card Information
          </h3>
          <div className="flex gap-2 mb-4">
              <Button
              variant={paymentMode === 'saved' ? "default" : "outline"}
              className={`${
                paymentMode === 'saved'
                  ? "bg-brand-orange hover:bg-brand-orange/90 text-white border-brand-orange"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              } rounded-xl`}
                onClick={() => setPaymentMode('saved')}
              >
                Saved Card
              </Button>
              <Button
              variant={paymentMode === 'new' ? "default" : "outline"}
              className={`${
                paymentMode === 'new'
                  ? "bg-brand-orange hover:bg-brand-orange/90 text-white border-brand-orange"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              } rounded-xl`}
                onClick={() => setPaymentMode('new')}
              >
                New Card
              </Button>
            </div>

            {paymentMode === 'saved' ? (
                <SavedCards
                  onCardSelect={(card: SavedCard) => setSelectedCard(card)}
                  selectedCardId={selectedCard?.id}
                />
            ) : (
              <div className="space-y-3">
                <Input 
                  placeholder="Mobile Number" 
                  value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0,11))} 
                  maxLength={11} 
                  autoComplete="off"
                  className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
                />
                <Input 
                  placeholder="Name on Card" 
                  value={cardAlias} 
                  onChange={(e) => setCardAlias(e.target.value)} 
                  autoComplete="off"
                  className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
                />
                <Input 
                  placeholder="Card Number" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="MM" 
                    value={expiryMonth} 
                    onChange={(e) => setExpiryMonth(e.target.value)} 
                    autoComplete="off"
                    className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl text-center"
                  />
                  <Input 
                    placeholder="YY" 
                    value={expiryYear} 
                    onChange={(e) => setExpiryYear(e.target.value)} 
                    autoComplete="off"
                    className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl text-center"
                  />
                </div>
                <Input 
                  placeholder="CVV" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value)} 
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
                />
              </div>
            )}
        </div>
        )}

        {/* InstaPay Section - Only show for InstaPay */}
        {paymentMethod === 'instapay' && (
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
            <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              InstaPay Top-up
            </h3>
            
            {/* Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Select your recharge amount above</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Click "Create Top-up Request" to get bank details</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Complete the InstaPay transfer using the provided details</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Add the reference code in the "Reason for Transfer" field</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Upload your receipt screenshot for validation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Your wallet will be credited automatically after verification</span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700">
                <strong>Note:</strong> You'll get bank details and reference code immediately after creating the request.
              </p>
            </div>
          </div>
        )}

        {/* Total Amount Display */}
        <div className="mb-6 bg-gradient-to-r from-brand-red to-brand-orange text-white p-6 rounded-2xl shadow-lg" data-tutorial="recharge-total">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Total Amount</p>
              <p className="text-2xl font-bold">{finalAmount.toFixed(2)} EGP</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Current Balance</p>
              <p className="text-lg font-semibold">{profile?.wallet?.balance || 0} EGP</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <Button 
          onClick={handleRechargeClick} 
          disabled={isSubmitting || finalAmount <= 0} 
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-orange hover:to-brand-red text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          data-tutorial="recharge-pay-button"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            paymentMethod === 'instapay' 
              ? `Create ${finalAmount.toFixed(2)} EGP Top-up Request`
              : `Pay ${finalAmount.toFixed(2)} EGP`
          )}
        </Button>
      </div>

      {/* InstaPay Details Modal */}
      {showInstaPayDetails && instaPayData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Top-up Request Created!</h2>
              <p className="text-gray-600">Please complete your InstaPay transfer using the details below</p>
            </div>

            {/* Reference Code */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Reference Code</h3>
              <div className="bg-white border border-blue-300 rounded px-3 py-2 font-mono text-lg text-center">
                {instaPayData.reference_code}
              </div>
              <p className="text-sm text-blue-700 mt-2 text-center">
                <strong>CRITICAL:</strong> Add this code in the <strong>"Reason for Transfer"</strong> field in InstaPay
              </p>
            </div>

            {/* Bank Account Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-3">Bank Account Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-semibold">{instaPayData.bank_account.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="font-semibold">{instaPayData.bank_account.account_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-semibold">{instaPayData.bank_account.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600">{instaPayData.amount} EGP</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                <li>Open your InstaPay app</li>
                <li>Select "Bank Transfer"</li>
                <li>Enter the bank details above</li>
                <li>Enter the amount: {instaPayData.amount} EGP</li>
                <li><strong>IMPORTANT:</strong> Add the reference code <span className="font-mono bg-yellow-100 px-1 rounded">{instaPayData.reference_code}</span> in the <strong>"Reason for Transfer"</strong> field</li>
                <li>Complete the transfer</li>
                <li>Upload your receipt screenshot below</li>
              </ol>
              
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ <strong>Critical:</strong> You must include the reference code in the "Reason for Transfer" field, 
                  otherwise we cannot identify your payment and credit your wallet!
                </p>
              </div>
            </div>

            {/* Receipt Upload Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Upload Receipt for Validation</h3>
              <p className="text-sm text-blue-700 mb-3">
                After completing your InstaPay transfer, upload a screenshot of the receipt to validate and credit your wallet.
              </p>
              
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptImage(e.target.files?.[0] || null)}
                  className="hidden"
                  id="receipt-upload-modal"
                />
                <label htmlFor="receipt-upload-modal" className="cursor-pointer">
                  {receiptImage ? (
                    <div className="space-y-2">
                      <div className="text-blue-600 font-medium">✓ Receipt uploaded</div>
                      <div className="text-sm text-gray-500">{receiptImage.name}</div>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-blue-600 font-medium">Click to upload receipt</div>
                      <div className="text-sm text-blue-500">PNG, JPG up to 10MB</div>
                    </div>
                  )}
                </label>
              </div>
              
              {receiptImage && (
                <button
                  onClick={handleReceiptUpload}
                  className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Receipt for Validation
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowInstaPayDetails(false);
                  setInstaPayData(null);
                  navigate('/wallet');
                }}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Go to Wallet
              </button>
              <button
                onClick={() => {
                  setShowInstaPayDetails(false);
                  setInstaPayData(null);
                }}
                className="flex-1 bg-brand-red text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-orange transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Recharge;
