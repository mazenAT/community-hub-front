import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import SavedCards from "../components/SavedCards";

interface SavedCard {
  id: number;
  card_token: string; // <-- added
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
    if (!profile) {
      toast.error("Could not load user profile. Please try again.");
      return;
    }

    setIsSubmitting(true);
    const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

    try {
      if (paymentMode === 'saved' && selectedCard) {
        // Use saved card - just need CVV
        await processPaymentWithSavedCard(selectedCard, finalAmount);
      } else {
        // Create new card token
        await createNewCardToken(finalAmount);
      }
    } catch (error) {
      console.error('Error in recharge:', error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const createNewCardToken = async (amount: number) => {
    // Step 1: Call Fawry directly for card token creation
    const tokenPayload = {
      merchantCode: '770000017341', // Your merchant code
      customerProfileId: profile.id.toString(),
      customerMobile: mobile,
      customerEmail: profile.email,
      cardNumber: cardNumber,
      cardAlias: cardAlias || profile.name,
      expiryYear: expiryYear.length === 4 ? expiryYear.slice(-2) : expiryYear, // Convert 4-digit to 2-digit if needed
      expiryMonth: expiryMonth,
      cvv: cvv,
      isDefault: true,
      enable3ds: true,
      returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${Date.now()}&amount=${amount}&step=token&customerProfileId=${profile.id}&customerName=${encodeURIComponent(profile.name)}&customerMobile=${mobile}&customerEmail=${encodeURIComponent(profile.email)}`,
    };

    console.log('Calling Fawry card token endpoint directly:', tokenPayload);
    
    const tokenResponse = await fetch('https://atfawry.fawrystaging.com/fawrypay-api/api/cards/cardToken', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenPayload),
    });

    const tokenData = await tokenResponse.json();
    console.log('Fawry token response:', tokenData);

    if (tokenData.statusCode === 200 && tokenData.nextAction?.redirectUrl) {
      // Token creation requires 3DS, redirect to Fawry
      window.location.href = tokenData.nextAction.redirectUrl;
    } else if (tokenData.cardToken) {
      // Token created successfully without 3DS, save it and proceed with payment
      await saveCardToken(tokenData);
      await processPaymentWithToken(tokenData.cardToken, amount);
    } else {
      // Token creation failed
      toast.error(tokenData.statusDescription || "Failed to create card token. Please check card details.");
      setIsSubmitting(false);
    }
  };

  const processPaymentWithSavedCard = async (savedCard: SavedCard, amount: number) => {
    // Use saved card token for payment
    await processPaymentWithToken(savedCard.card_token, amount); // use the real token
  };

  const saveCardToken = async (tokenData: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/wallet/save-card-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          card_token: tokenData.token,
          card_alias: cardAlias || profile.name,
          last_four_digits: tokenData.lastFourDigits,
          first_six_digits: tokenData.firstSixDigits,
          brand: tokenData.brand,
          expiry_year: expiryYear.length === 4 ? expiryYear.slice(-2) : expiryYear,
          expiry_month: expiryMonth,
          is_default: true,
          fawry_response: tokenData
        }),
      });

      if (response.ok) {
        console.log('Card token saved successfully');
      } else {
        console.error('Failed to save card token');
      }
    } catch (error) {
      console.error('Error saving card token:', error);
    }
  };

  // Helper function to process payment with token directly with Fawry
  const processPaymentWithToken = async (cardToken: string, amount: number) => {
    try {
      const merchantRefNum = Date.now().toString();
      const merchantCode = '770000017341';
      const securityKey = '02b9d0e3-5088-4b6e-be41-111d4359fe10'; // Your security key
      
      // Generate signature for payment
      const signatureString = merchantCode + 
        merchantRefNum + 
        profile.id.toString() + 
        'CARD' + 
        amount.toFixed(2) + 
        cardToken + 
        cvv + 
        `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amount}&step=payment&customerProfileId=${profile.id}&customerName=${encodeURIComponent(profile.name)}&customerMobile=${profile.phone}&customerEmail=${encodeURIComponent(profile.email)}` + // returnUrl
        securityKey;
      
      const signature = await generateSHA256(signatureString);
      console.log('Payment signature string:', signatureString);
      console.log('Payment signature:', signature);

      const paymentPayload = {
        merchantCode: merchantCode,
        merchantRefNum: merchantRefNum,
        customerProfileId: profile.id.toString(),
        customerName: profile.name,
        customerMobile: profile.phone,
        customerEmail: profile.email,
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
        enable3DS: true,
        returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${merchantRefNum}&amount=${amount}&step=payment&customerProfileId=${profile.id}&customerName=${encodeURIComponent(profile.name)}&customerMobile=${profile.phone}&customerEmail=${encodeURIComponent(profile.email)}`,
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
        // Payment successful without 3DS
        toast.success('Payment successful! Your wallet has been recharged.');
        navigate('/wallet');
      } else {
        // Payment failed
        toast.error(paymentData.statusDescription || "Failed to complete payment. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("An error occurred while completing payment. Please try again.");
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
    <div className="min-h-screen bg-brand-yellow/5 pb-24">
      <div className="bg-white px-4 sm:px-6 py-4 border-b-2 border-brand-red flex items-center space-x-3">
        <button 
          onClick={() => navigate("/wallet")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-yellow/20 hover:bg-brand-yellow/30 transition border border-brand-yellow/30"
        >
          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-brand-black">Recharge Wallet</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <Card className="border border-brand-yellow/30 bg-brand-yellow/10">
          <CardHeader><CardTitle className="text-brand-black">Select Amount</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[50, 100, 200, 500].map((amount) => (
              <Button 
                key={amount} 
                variant={selectedAmount === amount ? "default" : "outline"} 
                onClick={() => handleAmountSelect(amount)} 
                className={`h-16 text-lg ${
                  selectedAmount === amount 
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                }`}
              >
                {amount} EGP
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-brand-yellow/30 bg-brand-yellow/10">
          <CardHeader><CardTitle className="text-brand-black">Or Enter Custom Amount</CardTitle></CardHeader>
          <CardContent>
            <Input 
              type="number" 
              placeholder="e.g., 150" 
              value={customAmount} 
              onChange={(e) => handleCustomAmountChange(e.target.value)} 
              className="h-12 text-lg border-brand-yellow/30 focus:border-brand-red"
            />
          </CardContent>
        </Card>

        <Card className="border border-brand-yellow/30 bg-brand-yellow/10">
          <CardHeader><CardTitle className="text-brand-black">Card Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Mode Selection */}
            <div className="flex space-x-4 mb-4">
              <Button
                variant={paymentMode === 'saved' ? 'default' : 'outline'}
                onClick={() => setPaymentMode('saved')}
                className={`${
                  paymentMode === 'saved' 
                    ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                    : 'bg-white text-brand-black border-brand-orange hover:bg-brand-orange/10'
                }`}
              >
                Use Saved Card
              </Button>
              <Button
                variant={paymentMode === 'new' ? 'default' : 'outline'}
                onClick={() => setPaymentMode('new')}
                className={`${
                  paymentMode === 'new' 
                    ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                    : 'bg-white text-brand-black border-brand-orange hover:bg-brand-orange/10'
                }`}
              >
                Add New Card
              </Button>
            </div>

            {paymentMode === 'saved' ? (
              <div className="space-y-4">
                <SavedCards
                  onCardSelect={(card: SavedCard) => setSelectedCard(card)}
                  selectedCardId={selectedCard?.id}
                />
                {selectedCard && (
                  <div className="p-4 border border-brand-yellow/30 rounded-lg bg-brand-yellow/20">
                    <p className="text-sm text-brand-black/70 mb-2">Selected card: {selectedCard.card_alias}</p>
                    <Input
                      placeholder="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      className="w-32 border-brand-yellow/30 focus:border-brand-red"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input 
                  placeholder="Mobile Number (e.g. 01012345678)" 
                  value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0,11))} 
                  maxLength={11} 
                  className="border-brand-yellow/30 focus:border-brand-red"
                />
                <Input 
                  placeholder="Name on Card" 
                  value={cardAlias} 
                  onChange={(e) => setCardAlias(e.target.value)} 
                  className="border-brand-yellow/30 focus:border-brand-red"
                />
                <Input 
                  placeholder="Card Number" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  className="border-brand-yellow/30 focus:border-brand-red"
                />
                <div className="flex gap-2">
                  <Input 
                    placeholder="MM" 
                    value={expiryMonth} 
                    onChange={(e) => setExpiryMonth(e.target.value)} 
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                  <Input 
                    placeholder="YY" 
                    value={expiryYear} 
                    onChange={(e) => setExpiryYear(e.target.value)} 
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                </div>
                <Input 
                  placeholder="CVV" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value)} 
                  className="border-brand-yellow/30 focus:border-brand-red"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-brand-red text-white p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>{finalAmount.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-brand-red px-4 sm:px-6 py-4">
        <Button 
          onClick={handleRechargeClick} 
          disabled={isSubmitting || finalAmount <= 0} 
          className="w-full h-14 text-xl bg-brand-red hover:bg-brand-red/90 text-white"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : `Pay ${finalAmount.toFixed(2)} EGP`}
        </Button>
      </div>
    </div>
  );
};

export default Recharge;
