import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { profileApi, instaPayApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";

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

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });
  const profile = profileData?.data;

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



        await handleInstaPayTopup(finalAmount);
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
        setShowTransferDetails(true);
        
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
      // Auto-upload after file selection
      setTimeout(() => {
        handleReceiptUpload();
      }, 100);
    }
  };

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
        {!showTransferDetails ? (
          <>
            {/* Amount Input */}
            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="recharge-amount">
          <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                Enter Amount
          </h3>
              <div className="relative">
              <Input 
                type="number" 
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-12 text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">EGP</span>
            </div>
        </div>



        {/* Payment Method */}
            <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="recharge-payment-method">
          <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
            Payment Method
          </h3>
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
          </div>
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">InstaPay</div>
                    <div className="text-sm text-blue-700">Bank transfer via InstaPay</div>
              </div>
            </div>
              </div>
        </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Recharge Button */}
            <Button
              onClick={handleRechargeClick}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="w-full h-12 bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow hover:opacity-90 text-white rounded-xl font-medium text-base shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Recharge ${amount || 0} EGP`
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Transfer Details */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
            <h3 className="text-sm font-semibold text-brand-black mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-orange rounded-full"></div>
                Send money to this account
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
                    When making the transfer in your InstaPay app, please use the parent name above as the <strong>"Reason for transfer"</strong> or <strong>"Transfer note"</strong>. This helps us validate and process your payment faster.
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
                  src="/receipt-example.jpg" 
                  alt="Receipt Example" 
                  className="max-w-full h-auto rounded-lg border border-gray-200 mx-auto"
                  style={{ maxHeight: '300px' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('/receipt-example.jpg', '_blank')}
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

      <BottomNavigation />
    </div>
  );
};

export default Recharge;
