import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { walletApi, profileApi } from "@/services/api";
import { showToast } from "@/services/native";
import { formatCurrency } from "@/utils/format";
import { User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import { TransactionList } from '@/components/Wallet/TransactionList';

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

      // Fetch transactions
      const transactionsResponse = await walletApi.getTransactions();
      let transactionsData = [];
      if (Array.isArray(transactionsResponse.data)) {
        transactionsData = transactionsResponse.data;
      } else if (Array.isArray(transactionsResponse.data?.data)) {
        transactionsData = transactionsResponse.data.data;
      } else {
        console.error("Transactions API did not return an array:", transactionsResponse.data);
      }
      setTransactions(transactionsData);

    } catch (err) {
      console.error('Wallet data fetch error:', err);
      setError('Failed to load wallet data');
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
    setRefundLoading(true);
    try {
      await walletApi.requestRefund({ amount: Number(refundAmount), reason: refundReason });
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
      await walletApi.refundTransaction(id);
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
    <div className="min-h-screen bg-brand-yellow/5 pb-20">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo.jpg" alt="App Logo" className="w-10 h-10 rounded" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-brand-black">Wallet</h1>
              <p className="text-xs sm:text-sm text-brand-black/70">Welcome back, {userProfile?.name || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button 
              onClick={() => navigate("/profile")}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center overflow-hidden border border-brand-yellow/30"
            >
              {userProfile?.profile_image ? (
                <img src={userProfile.profile_image} alt={userProfile.name || 'User Avatar'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red" />
              )}
            </button>
            <Button
              variant="outline"
              className="ml-2 border-brand-red text-brand-red hover:bg-brand-red/10"
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

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Balance Card */}
        <Card className="bg-brand-red text-white p-4 rounded-2xl border-0 w-full mb-4">
          <div className="space-y-2">
            <p className="text-white/80 text-xs">Total Balance</p>
            <h2 className="text-3xl font-bold">{loading ? <LoadingSpinner size={24} /> : formatCurrency(balance)}</h2>
            <div className="flex flex-col xs:flex-row gap-2 mt-2">
              <Button
                onClick={() => navigate("/recharge")}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white border-0 rounded-xl text-base w-full xs:w-auto"
                disabled={loading}
              >
                + Recharge
              </Button>
              <Button
                onClick={() => setRefundModalOpen(true)}
                className="bg-white text-brand-red border-0 rounded-xl text-base w-full xs:w-auto shadow"
                disabled={loading}
                variant="outline"
              >
                Request Refund
              </Button>
              <Button
                onClick={() => navigate("/wallet/history")}
                className="bg-white text-brand-red border-0 rounded-xl text-base w-full xs:w-auto shadow"
                variant="outline"
              >
                View History
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
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-brand-black">Recent Transactions</h3>
          {loading && transactions.length === 0 ? (
            <div className="text-center py-4">
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
                    className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleDateString()}</div>
                      <div className="font-semibold text-base">{transaction.note || '-'}</div>
                      <div className="text-sm mt-1 flex flex-wrap items-center gap-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : transaction.type === 'debit' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{transaction.type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{transaction.status.toUpperCase()}</span>
                        {isRefundable ? (
                          <button
                            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 text-xs"
                            disabled={refundLoading === transaction.id}
                            onClick={() => handleRefundTransaction(transaction.id)}
                          >
                            {refundLoading === transaction.id ? 'Refunding...' : 'Refund'}
                          </button>
                        ) : transaction.refunded_at ? (
                          <span className="ml-2 text-green-600 font-semibold text-xs">Refunded</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                      <div className="text-lg font-bold">{Number(transaction.amount).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && transactions.length === 0 && (
            <EmptyState icon={<AlertCircle />} message="No transactions found." />
          )}
        </div>
      </div>

      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Wallet;
