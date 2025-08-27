import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { walletApi, profileApi, transactionApi } from "@/services/api";
import { showToast } from "@/services/native";
import { formatCurrency } from "@/utils/format";
import { User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import TutorialTrigger from "@/components/TutorialTrigger";

import CampaignSlider from '@/components/CampaignSlider';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  school_id: number | null;
  phone: string | null;
  profile_image: string | null;
  is_active: boolean;
  role: 'admin' | 'student';
  school?: {
    id: number;
    name: string;
  };
  wallet?: {
    id: number;
    user_id: number;
    balance: number;
    currency: string;
    is_active: boolean;
  };
}

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]); // Changed to any[] to match API response
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState<number | null>(null);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile first to get the user and wallet information
      const profileResponse = await profileApi.getProfile();
      const profile = profileResponse.data;
      setUserProfile(profile);

      // Set balance from the reliable profile data
      const newBalance = Number(profile?.wallet?.balance) || 0;
      setBalance(newBalance);

      // Fetch transactions - handle empty state gracefully
      try {
        const transactionsResponse = await walletApi.getTransactions();
        let transactionsData = [];
        if (Array.isArray(transactionsResponse.data)) {
          transactionsData = transactionsResponse.data;
        } else if (Array.isArray(transactionsResponse.data?.data)) {
          transactionsData = transactionsResponse.data.data;
        } else {
          // Handle unexpected response format - set empty array instead of error
          transactionsData = [];
        }
        setTransactions(transactionsData);
      } catch (transactionErr) {
        // If transactions fail, just set empty array instead of showing error
        console.warn('Failed to fetch transactions:', transactionErr);
        setTransactions([]);
      }

    } catch (err: any) {
      console.error('Failed to load wallet data:', err);
      // Only show error for critical failures (like profile loading)
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        setError('Wallet not found. Please contact support.');
      } else {
        setError('Failed to load wallet data. Please try again.');
      }
      showToast('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRefundRequest = async () => {
    if (!refundAmount || isNaN(Number(refundAmount)) || Number(refundAmount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid refund amount.", variant: "destructive" });
      return;
    }
    setRefundLoading(0);
    try {
      // Send the correct payload with amount and reason
      await walletApi.requestRefund({ 
        amount: Number(refundAmount), 
        reason: refundReason 
      });
      toast({ title: "Refund Requested", description: `Refund request for ${formatCurrency(Number(refundAmount))} has been submitted. It will be processed within 3-5 business days.` });
      setRefundModalOpen(false);
      setRefundAmount("");
      setRefundReason("");
      fetchWalletData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit refund request. Please try again.", variant: "destructive" });
    } finally {
      setRefundLoading(null);
    }
  };

  const handleRefundTransaction = async (id: number) => {
    setRefundLoading(id);
    try {
      await transactionApi.refundTransaction(id);
      fetchWalletData();
    } catch (e) {
      showToast('Refund failed.');
    } finally {
      setRefundLoading(null);
    }
  };

  const mappedTransactions = transactions.map((t: any) => ({
    id: t.id,
    type: t.type || t.transaction_type || 'unknown',
    amount: t.amount,
    status: t.status || 'completed',
    created_at: t.created_at,
    note: t.description || t.note || '',
    refunded_at: t.refunded_at || null,
    details: t.details || {},
    familyMemberName: t.details?.family_member_name || null,
    familyMemberId: t.details?.family_member_id || null,
    isFamilyMemberOrder: !!(t.details?.family_member_id),
  }));

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchWalletData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 pb-24">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-3 sm:py-4 border-b-2 border-brand-red"
        data-tutorial="wallet-header"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/Logo.jpg" alt="App Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded" />
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white">Wallet</h1>
              <p className="text-xs text-white/90 hidden sm:block">Welcome back, {userProfile?.name || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={() => navigate("/profile")}
              className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center overflow-hidden border border-brand-yellow/30"
            >
              {userProfile?.profile_image ? (
                <img src={userProfile.profile_image} alt={userProfile.name || 'User Avatar'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-brand-red" />
              )}
            </button>
            <div className="hidden sm:flex items-center space-x-2">
              <TutorialTrigger variant="inline" />
              <Button
                variant="outline"
                size="sm"
                className="border-brand-red text-brand-red hover:bg-brand-red/10 text-xs"
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Slider */}
      <div className="px-4 py-3 sm:py-4">
        <CampaignSlider />
      </div>

      <div className="px-4 py-2 space-y-4">
        {/* Balance Card */}
        <Card 
          className="wallet-balance bg-gradient-to-br from-brand-red to-brand-orange text-white p-4 sm:p-5 rounded-2xl border-0 w-full shadow-lg"
          data-tutorial="wallet-balance"
        >
          <div className="space-y-3">
            <p className="text-white/90 text-xs sm:text-sm font-medium">Total Balance</p>
            <h2 className="text-2xl sm:text-3xl font-bold">{loading ? <LoadingSpinner size={24} /> : formatCurrency(balance)}</h2>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <Button
                onClick={() => navigate("/recharge")}
                className="bg-white/20 hover:bg-white/30 backdrop-blur text-white border border-white/30 rounded-xl text-sm sm:text-base w-full sm:w-auto px-4 py-2"
                disabled={loading}
                data-tutorial="wallet-recharge"
              >
                + Recharge
              </Button>
              <Button
                onClick={() => setRefundModalOpen(true)}
                className="bg-white text-brand-red hover:bg-white/90 border-0 rounded-xl text-sm sm:text-base w-full sm:w-auto shadow px-4 py-2"
                disabled={loading}
                variant="outline"
              >
                Request Refund
              </Button>
            </div>
          </div>
        </Card>

        {/* Refund Modal */}
        <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
          <DialogContent>
            <DialogTitle>Request Refund</DialogTitle>
            <div className="space-y-4 mt-2">
              <Input
                type="number"
                min="1"
                placeholder="Amount"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                disabled={!!refundLoading}
              />
              <Textarea
                placeholder="Reason (optional)"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                disabled={!!refundLoading}
              />
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setRefundModalOpen(false)} variant="outline" disabled={!!refundLoading}>Cancel</Button>
                <Button onClick={handleRefundRequest} disabled={!!refundLoading}>
                  {!!refundLoading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Transactions */}
        <div className="transactions-section space-y-3" data-tutorial="wallet-transactions">
          <h3 className="text-base font-semibold text-gray-800">Recent Transactions</h3>
          {loading && transactions.length === 0 ? (
            <div className="text-center py-8">
              <LoadingSpinner size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {mappedTransactions.map((transaction) => {
                const isRefundable =
                  transaction.type === 'purchase' &&
                  transaction.status === 'completed' &&
                  !transaction.refunded_at;
                return (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-xl shadow-sm p-3 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</div>
                        <div className="font-medium text-sm sm:text-base text-gray-900 mt-1">{transaction.note || 'Transaction'}</div>
                        {transaction.isFamilyMemberOrder && transaction.familyMemberName && (
                          <div className="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                            👤 {transaction.familyMemberName}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            transaction.type === 'credit' ? 'bg-green-100 text-green-700' : 
                            transaction.type === 'debit' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{transaction.type}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                          {transaction.isFamilyMemberOrder && (
                            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                              Family
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base sm:text-lg font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 
                          transaction.type === 'debit' ? 'text-red-600' : 
                          'text-gray-900'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                        </div>
                        {isRefundable && (
                          <button
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            disabled={refundLoading === transaction.id}
                            onClick={() => handleRefundTransaction(transaction.id)}
                          >
                            {refundLoading === transaction.id ? 'Processing...' : 'Refund'}
                          </button>
                        )}
                        {transaction.refunded_at && (
                          <div className="mt-1 text-xs text-green-600 font-medium">Refunded</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && transactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation activeTab="wallet" />
      
      {/* Floating Tutorial Button */}
      <TutorialTrigger variant="floating" />
    </div>
  );
};

export default Wallet;
