import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../services/api";
import { useNavigate } from "react-router-dom";

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
      returnUrl: `${window.location.origin}/fawry-callback?merchantRefNum=${Date.now()}&amount=${finalAmount}&step=token&customerProfileId=${profile.id}&customerName=${encodeURIComponent(profile.name)}&customerMobile=${mobile}&customerEmail=${encodeURIComponent(profile.email)}`,
    };

    try {
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
        // Token created successfully without 3DS, proceed to payment
        await processPaymentWithToken(tokenData.cardToken, finalAmount);
      } else {
        // Token creation failed
        toast.error(tokenData.statusDescription || "Failed to create card token. Please check card details.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error calling Fawry:', error);
      toast.error("An unexpected error occurred while creating card token. Please try again.");
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center space-x-3">
        <button 
          onClick={() => navigate("/wallet")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Recharge Wallet</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <Card>
          <CardHeader><CardTitle>Select Amount</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[50, 100, 200, 500].map((amount) => (
              <Button key={amount} variant={selectedAmount === amount ? "default" : "outline"} onClick={() => handleAmountSelect(amount)} className="h-16 text-lg">
                {amount} EGP
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Or Enter Custom Amount</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" placeholder="e.g., 150" value={customAmount} onChange={(e) => handleCustomAmountChange(e.target.value)} className="h-12 text-lg"/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Card Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Mobile Number (e.g. 01012345678)" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0,11))} maxLength={11} />
            <Input placeholder="Name on Card" value={cardAlias} onChange={(e) => setCardAlias(e.target.value)} />
            <Input placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="MM" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} />
              <Input placeholder="YY" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} />
            </div>
            <Input placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} />
          </CardContent>
        </Card>

        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>{finalAmount.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <Button onClick={handleRechargeClick} disabled={isSubmitting || finalAmount <= 0} className="w-full h-14 text-xl">
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : `Pay ${finalAmount.toFixed(2)} EGP`}
        </Button>
      </div>
    </div>
  );
};

export default Recharge;
