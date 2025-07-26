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

    const payload = {
      amount: finalAmount,
      cardNumber: cardNumber,
      cardExpiryYear: expiryYear,
      cardExpiryMonth: expiryMonth,
      cvv: cvv,
      customerMobile: mobile,
      customerName: cardAlias || profile.name,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/wallet/initiate-fawry-recharge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(data.error || "Failed to initiate payment. Please check card details.");
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
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
