
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Recharge = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("credit-card");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const quickAmounts = [25, 50, 100, 200, 500];

  const paymentMethods = [
    {
      id: "credit-card",
      name: "Credit Card",
      description: "•••• 4242",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: "bg-blue-100"
    },
    {
      id: "vodafone-cash",
      name: "Vodafone Cash",
      description: "01xxxxxxxxx",
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.64 11.2c-.45-.34-4.93-4.02-5.27-4.3L15 4.59v6.81c0 .45-.37.82-.82.82s-.82-.37-.82-.82V4.59L9.99 6.9c-.34.28-4.82 3.96-5.27 4.3C4.28 11.54 4 12.22 4 12.95v8.23c0 .45.37.82.82.82h14.36c.45 0 .82-.37.82-.82v-8.23c0-.73-.28-1.41-.72-1.75z"/>
        </svg>
      ),
      bgColor: "bg-red-100"
    },
    {
      id: "etisalat-cash",
      name: "e& Cash",
      description: "01xxxxxxxxx",
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      bgColor: "bg-green-100"
    },
    {
      id: "orange-cash",
      name: "Orange Cash",
      description: "01xxxxxxxxx",
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2"/>
        </svg>
      ),
      bgColor: "bg-orange-100"
    }
  ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleRechargeClick = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmRecharge = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    console.log(`Recharging $${amount} using ${selectedPaymentMethod}`);
    setShowConfirmation(false);
    // For now, just navigate back to wallet
    navigate("/wallet");
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;
  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate("/wallet")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Recharge Wallet</h1>
            <p className="text-sm text-gray-500">Add money to your wallet</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quick Amount Selection */}
        <Card className="p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Amount</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedAmount === amount
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg font-semibold">${amount}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Custom Amount */}
        <Card className="p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Custom Amount</h3>
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                $
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full pl-8 pr-4 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${method.bgColor} rounded-xl flex items-center justify-center`}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    selectedPaymentMethod === method.id ? "bg-blue-500" : "border-2 border-gray-300"
                  }`}>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Summary */}
        {finalAmount > 0 && (
          <Card className="p-6 rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Amount</span>
                <span className="font-semibold">${finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Processing Fee</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="border-t border-blue-400 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold">${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <Button 
          onClick={handleRechargeClick}
          disabled={finalAmount <= 0}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {finalAmount > 0 ? `Recharge $${finalAmount.toFixed(2)}` : "Select Amount"}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              Confirm Recharge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              You are about to recharge your wallet with ${finalAmount.toFixed(2)} using {selectedMethod?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRecharge}
              className="bg-blue-500 hover:bg-blue-600 rounded-xl"
            >
              Confirm Recharge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recharge;
