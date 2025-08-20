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

  // Initialize secure credentials
  useEffect(() => {
    secureCredentials.initialize().catch(console.error);
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
      // Get secure credentials
      const credentials = secureCredentials.getCredentials();
      const endpoints = secureCredentials.getApiEndpoints();
      
      // Check rate limit before proceeding
      await secureCredentials.checkRateLimit();

      const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

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

      // Create transaction record for tracking
      const transaction = frontendTransactionTracker.createTransaction({
        amount: finalAmount,
        user_id: profile.id,
        card_details: paymentMode === 'saved' && selectedCard ? {
          last_four_digits: selectedCard.last_four_digits,
          card_alias: selectedCard.card_alias
        } : undefined
      });

      try {
        if (paymentMode === 'saved' && selectedCard) {
          await processPaymentWithSavedCard(selectedCard, finalAmount, transaction.id, credentials, endpoints);
        } else {
          await createNewCardToken(finalAmount, transaction.id, credentials, endpoints);
        }
      } catch (error) {
        frontendTransactionTracker.markTransactionFailed(
          transaction.id, 
          "An unexpected error occurred during recharge",
          "UNEXPECTED_ERROR"
        );
        toast.error("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to start recharge process. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const createNewCardToken = async (amount: number, transactionId: string, credentials: any, endpoints: any) => {
    try {
      const merchantRefNum = Date.now().toString();
      const customerProfileId = profile.id.toString();
      const customerName = profile.name || 'Customer';
      const customerMobile = mobile;
      const customerEmail = profile.email || 'customer@example.com';

      const tokenPayload = {
        merchantCode: credentials.merchantCode,
        customerProfileId: customerProfileId,
        customerMobile: customerMobile,
        customerEmail: customerEmail,
        cardNumber: cardNumber,
        cardAlias: cardAlias, // REQUIRED by Fawry
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: cvv,
        isDefault: true, // REQUIRED by Fawry
        enable3ds: true, // REQUIRED by Fawry
        returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amount}&step=token&customerProfileId=${customerProfileId}&customerName=${encodeURIComponent(customerName)}&customerMobile=${customerMobile}&customerEmail=${encodeURIComponent(customerEmail)}`
      };

      console.log('Creating Fawry card token with payload:', tokenPayload);
      
      const tokenResponse = await fetch(endpoints.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload),
      });

      const tokenData = await tokenResponse.json();
      console.log('Fawry Token Response:', tokenData);

      if (tokenData.statusCode === 200 && tokenData.cardToken) {
        // Card token created successfully, now process payment
        await processPaymentWithToken(tokenData.cardToken, amount, transactionId, credentials, endpoints);
      } else {
        const errorMessage = tokenData.statusDescription || tokenData.message || "Failed to create card token";
        console.error('Fawry Token Creation Error:', tokenData);
        
        frontendTransactionTracker.markTransactionFailed(
          transactionId,
          errorMessage,
          `TOKEN_CREATION_${tokenData.statusCode || 'UNKNOWN'}`
        );
        
        if (tokenData.statusCode === 400) {
          toast.error("Invalid card details. Please check your card information.");
        } else if (tokenData.statusCode === 401) {
          toast.error("Authentication failed. Please try again.");
        } else if (tokenData.statusCode === 500) {
          toast.error("Payment service temporarily unavailable. Please try again later.");
        } else {
          toast.error(errorMessage);
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating card token:', error);
      frontendTransactionTracker.markTransactionFailed(
        transactionId,
        "Failed to create card token",
        "TOKEN_CREATION_ERROR"
      );
      toast.error("Failed to create card token. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processPaymentWithSavedCard = async (card: SavedCard, amount: number, transactionId: string, credentials: any, endpoints: any) => {
    try {
      const merchantRefNum = Date.now().toString();
      const customerProfileId = profile.id.toString();
      const customerName = profile.name || 'Customer';
      const customerMobile = profile.mobile || '01234567891';
      const customerEmail = profile.email || 'customer@example.com';

      // Generate signature for payment with saved card (Fawry format)
      // According to Fawry docs: merchantCode + merchantRefNum + customerProfileId (if exists, otherwise "") + paymentMethod + amount + cardToken + cvv + returnUrl + secureKey
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
        cvv: cvv,
        amount: amount,
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Wallet Recharge',
        language: 'en-gb',
        chargeItems: [
          {
            itemId: 'wallet_recharge',
            description: 'Wallet Recharge',
            price: amount,
            quantity: 1
          }
        ],
        signature: signature
      };

      console.log('Processing Fawry payment with saved card payload:', paymentPayload);
      
      const paymentResponse = await fetch(endpoints.paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();
      console.log('Fawry Payment Response (Saved Card):', paymentData);

      if (paymentData.statusCode === 200) {
        frontendTransactionTracker.markTransactionCompleted(transactionId, merchantRefNum);
        
        // Update wallet balance in backend
        try {
          await api.post('/wallet/update-balance', {
            amount: amount,
            type: 'top_up',
            note: `Fawry recharge - Reference: ${merchantRefNum}`
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
        console.error('Fawry Payment Error (Saved Card):', paymentData);
        
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
      console.error('Error processing payment with saved card:', error);
      frontendTransactionTracker.markTransactionFailed(
        transactionId,
        "Failed to process payment with saved card",
        "PAYMENT_ERROR"
      );
      toast.error("Failed to process payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processPaymentWithToken = async (cardToken: string, amount: number, transactionId: string, credentials: any, endpoints: any) => {
    try {
      const merchantRefNum = Date.now().toString();
      const customerProfileId = profile.id.toString();
      const customerName = profile.name || 'Customer';
      const customerMobile = mobile;
      const customerEmail = profile.email || 'customer@example.com';

      // Generate signature for payment (Fawry format)
      // According to Fawry docs: merchantCode + merchantRefNum + customerProfileId (if exists, otherwise "") + paymentMethod + amount + cardToken + cvv + returnUrl + secureKey
      const signatureString = credentials.merchantCode + 
        merchantRefNum + 
        (customerProfileId || "") + 
        'CARD' + 
        amount.toFixed(2) + 
        cardToken + 
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
        cardToken: cardToken,
        cvv: cvv,
        amount: amount,
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Wallet Recharge',
        language: 'en-gb',
        chargeItems: [
          {
            itemId: 'wallet_recharge',
            description: 'Wallet Recharge',
            price: amount,
            quantity: 1
          }
        ],
        signature: signature
      };

      console.log('Processing Fawry payment with payload:', paymentPayload);
      
      const paymentResponse = await fetch(endpoints.paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();
      console.log('Fawry Payment Response:', paymentData);

      if (paymentData.statusCode === 200) {
        frontendTransactionTracker.markTransactionCompleted(transactionId, merchantRefNum);
        
        // Update wallet balance in backend
        try {
          await api.post('/wallet/update-balance', {
            amount: amount,
            type: 'top_up',
            note: `Fawry recharge - Reference: ${merchantRefNum}`
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
      console.error('Error processing payment:', error);
      frontendTransactionTracker.markTransactionFailed(
        transactionId,
        "Failed to process payment",
        "PAYMENT_ERROR"
      );
      toast.error("Failed to process payment. Please try again.");
      setIsSubmitting(false);
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
