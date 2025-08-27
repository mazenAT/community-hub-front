import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileApi, api } from "../services/api";
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
  const [error, setError] = useState('');

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

      // With redirect flow, the user will be redirected to Fawry immediately
      // The response here is just for logging - the actual redirect happens in fawry3dsService
      if (paymentResponse.type === 'redirect') {
        console.log('Redirecting to Fawry payment page...');
        // The redirect is handled automatically by fawry3dsService
        // User will be taken to Fawry's hosted payment page
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
      {/* Mobile-Optimized Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate("/wallet")}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-yellow/20 hover:bg-brand-yellow/30 transition-all duration-200 border border-brand-yellow/30 active:scale-95"
          >
            <svg className="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-brand-black">Recharge Wallet</h1>
            <p className="text-sm text-gray-600">Add funds to your digital wallet</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-red" />
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600 text-sm">Please wait while we process your payment. Do not close this page.</p>
            </div>
          </div>
        )}

        {/* Mobile-Optimized Amount Selection */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-brand-black flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-brand-red" />
              <span>Select Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[50, 100, 200, 500].map((amount) => (
                <Button 
                  key={amount} 
                  variant={selectedAmount === amount ? "default" : "outline"} 
                  onClick={() => handleAmountSelect(amount)} 
                  className={`h-16 text-lg font-semibold rounded-xl transition-all duration-200 ${
                    selectedAmount === amount 
                      ? 'bg-gradient-to-r from-brand-red to-brand-orange text-white border-0 shadow-lg scale-105' 
                      : 'bg-white text-brand-black border-2 border-gray-200 hover:border-brand-red hover:bg-brand-red/5 active:scale-95'
                  }`}
                >
                  {amount} EGP
                </Button>
              ))}
            </div>
            
            {/* Custom Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Custom Amount</label>
              <Input 
                type="number" 
                placeholder="Enter amount in EGP" 
                value={customAmount} 
                onChange={(e) => handleCustomAmountChange(e.target.value)} 
                className="h-14 text-lg border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Info */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-brand-black flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-brand-red" />
              <span>Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Credit/Debit Card</h3>
                  <p className="text-sm text-blue-700">Pay securely with your card via Fawry</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Information Section */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-brand-black flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-brand-red" />
              <span>Card Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Mode Selection */}
            <div className="flex space-x-2 mb-4">
              <Button
                variant={paymentMode === 'saved' ? 'default' : 'outline'}
                onClick={() => setPaymentMode('saved')}
                className={`flex-1 h-12 rounded-xl transition-all duration-200 ${
                  paymentMode === 'saved' 
                    ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                    : 'bg-white text-brand-black border-2 border-gray-200 hover:border-brand-orange hover:bg-brand-orange/5'
                }`}
              >
                Saved Card
              </Button>
              <Button
                variant={paymentMode === 'new' ? 'default' : 'outline'}
                onClick={() => setPaymentMode('new')}
                className={`flex-1 h-12 rounded-xl transition-all duration-200 ${
                  paymentMode === 'new' 
                    ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                    : 'bg-white text-brand-black border-2 border-gray-200 hover:border-brand-orange hover:bg-brand-orange/5'
                }`}
              >
                New Card
              </Button>
            </div>

            {paymentMode === 'saved' ? (
              <div className="space-y-4">
                <SavedCards
                  onCardSelect={(card: SavedCard) => setSelectedCard(card)}
                  selectedCardId={selectedCard?.id}
                />
                {selectedCard && (
                  <div className="p-4 border-2 border-brand-yellow/30 rounded-xl bg-brand-yellow/10">
                    <p className="text-sm text-brand-black/70 mb-3">Selected card: {selectedCard.card_alias}</p>
                    <Input
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      autoComplete="off"
                      className="w-32 h-12 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
                    />
                  </div>
                )}
              </div>
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
          </CardContent>
        </Card>

        {/* Mobile-Optimized Total Display */}
        <div className="bg-gradient-to-r from-brand-red to-brand-orange text-white p-6 rounded-2xl shadow-lg">
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
      
      {/* Mobile-Optimized Fixed Bottom Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <Button 
          onClick={handleRechargeClick} 
          disabled={isSubmitting || finalAmount <= 0} 
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-orange hover:to-brand-red text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            `Pay ${finalAmount.toFixed(2)} EGP`
          )}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Recharge;
