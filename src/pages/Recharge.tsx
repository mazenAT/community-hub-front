import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { walletApi } from "@/services/api";
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("debit-card");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const paymentMethods = [
    {
      id: "debit-card",
      name: "Debit Card",
      description: "•••• 4242",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      bgColor: "bg-blue-100"
    },
    {
      id: "instapay",
      name: "InstaPay",
      description: "Instant transfer",
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      bgColor: "bg-purple-100"
    },
    {
      id: "bank-transfer",
      name: "Bank Transfer",
      description: "Direct transfer",
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bgColor: "bg-green-100"
    },
    {
      id: "fawry-pay",
      name: "Fawry Pay",
      description: "Pay with Fawry",
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2"/>
        </svg>
      ),
      bgColor: "bg-orange-100"
    }
  ];

  const rechargeMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string; paymentDetails: any }) =>
      walletApi.addFunds(data.amount, data.paymentMethod, data.paymentDetails),
    onSuccess: () => {
      toast.success("Wallet recharged successfully");
      navigate("/wallet");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to recharge wallet");
    },
  });

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
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const paymentDetails = {
      // Add payment-specific details based on selected method
      method: selectedPaymentMethod,
      timestamp: new Date().toISOString(),
    };

    rechargeMutation.mutate({
      amount,
      paymentMethod: selectedPaymentMethod,
      paymentDetails,
    });
    setShowConfirmation(false);
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;
  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={() => navigate("/wallet")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Recharge Wallet</h1>
            <p className="text-xs sm:text-sm text-gray-500">Add money to your wallet</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Quick Amount Selection */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Amount</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    selectedAmount === amount
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-sm sm:text-lg font-semibold">{amount} EGP</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Custom Amount */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Custom Amount</h3>
            
            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-lg font-medium">
                EGP
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Payment Method</h3>
            
            <div className="space-y-2 sm:space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${method.bgColor} rounded-xl flex items-center justify-center`}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm sm:text-base font-medium text-gray-900">{method.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{method.description}</p>
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
          <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-blue-100">Amount</span>
                <span className="text-sm sm:text-base font-semibold">{finalAmount.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-blue-100">Processing Fee</span>
                <span className="text-sm sm:text-base font-semibold">0.00 EGP</span>
              </div>
              <div className="border-t border-blue-400 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold">Total</span>
                  <span className="text-lg sm:text-xl font-bold">{finalAmount.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Recharge Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <Button
          onClick={handleRechargeClick}
          disabled={!finalAmount || rechargeMutation.isPending}
          className="w-full py-3 sm:py-4 text-base sm:text-lg font-medium"
        >
          {rechargeMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Recharge ${finalAmount} EGP`
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
              Confirm Recharge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base text-gray-500">
              You are about to recharge your wallet with {finalAmount.toFixed(2)} EGP using {selectedMethod?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRecharge}
              className="bg-blue-500 hover:bg-blue-600 rounded-xl w-full sm:w-auto"
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
