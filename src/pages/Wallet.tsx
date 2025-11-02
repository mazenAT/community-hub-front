import BottomNavigation from "@/components/BottomNavigation";
import NotificationBell from "@/components/NotificationBell";
import TutorialTrigger from "@/components/TutorialTrigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, mealRefundApi, profileApi, walletApi } from "@/services/api";
import { frontendTransactionTracker } from "@/services/frontendTransactionTracker";
import { showToast } from "@/services/native";
import { handleAuthError } from "@/utils/authErrorHandler";
import { formatCurrency } from "@/utils/format";
import { LogOut, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from '../components/common/LoadingSpinner';

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
  const { logout } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]); // Changed to any[] to match API response
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState<number | null>(null);
  const [successfulRefunds, setSuccessfulRefunds] = useState<Set<number>>(new Set());
  const [refundSuccessMessage, setRefundSuccessMessage] = useState<string | null>(null);
  
  // Edit InstaPay transaction states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [newReceiptImage, setNewReceiptImage] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete transaction states
  const [deletedTransactions, setDeletedTransactions] = useState<Set<number | string>>(new Set());

  const clearSuccessMessages = () => {
    setRefundSuccessMessage(null);
    setSuccessfulRefunds(new Set());
  };

  const handleDeleteTransaction = (transactionId: number | string) => {
    // Add confirmation dialog
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      setDeletedTransactions(prev => new Set([...prev, transactionId]));
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been removed from your view.",
        variant: "default",
      });
    }
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear success messages when refreshing data
      clearSuccessMessages();
      
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
        
        // Also try to get enhanced transactions with family info if available
        try {
          const enhancedResponse = await api.get('/transactions/with-family-info');
          if (Array.isArray(enhancedResponse.data)) {
            transactionsData = enhancedResponse.data;
          } else if (Array.isArray(enhancedResponse.data?.data)) {
            transactionsData = enhancedResponse.data.data;
          }
        } catch (enhancedErr) {
          // Fallback to regular transactions if enhanced endpoint fails
          console.warn('Enhanced transactions endpoint failed, using regular transactions:', enhancedErr);
        }
        
        // Merge with frontend transactions to ensure recharge transactions are visible
        try {
          const frontendTransactions = frontendTransactionTracker.getAllTransactions();
          const currentUserId = profile?.id;
          
          if (currentUserId && frontendTransactions.length > 0) {
            const userFrontendTransactions = frontendTransactions
              .filter(t => t.user_id === currentUserId && t.status === 'completed')
              .map(t => ({
                id: `frontend_${t.id}`,
                type: 'recharge',
                amount: t.amount,
                created_at: t.created_at,
                description: `Wallet Recharge`,
                note: `Wallet Recharge`,
                details: {
                  payment_method: 'paymob_card',
                  frontend_transaction: true,
                  card_details: t.card_details
                },
                refunded_at: null,
                familyMemberName: null,
                familyMemberId: null,
                isFamilyMemberOrder: false
              }));
            
            // Merge and sort by creation date
            const allTransactions = [...transactionsData, ...userFrontendTransactions];
            allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            transactionsData = allTransactions;
          }
        } catch (frontendErr) {
          console.warn('Failed to merge frontend transactions:', frontendErr);
        }
        
        setTransactions(transactionsData);
      } catch (transactionErr) {
        // If transactions fail, just set empty array instead of showing error
        console.warn('Failed to fetch transactions:', transactionErr);
        setTransactions([]);
      }


    } catch (err: any) {
      console.error('Failed to load wallet data:', err);
      // Handle authentication errors by automatically logging out
      if (handleAuthError(err, logout)) {
        return; // Exit early, no need to set error state
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
    
    // Cleanup function to clear success messages
    return () => {
      clearSuccessMessages();
    };
  }, []);

  // Add pull-to-refresh functionality
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Only trigger refresh if at the top of the page and pulling down
      if (scrollTop === 0 && currentY > startY && currentY - startY > 100 && !isRefreshing) {
        isRefreshing = true;
        fetchWalletData().finally(() => {
          isRefreshing = false;
        });
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
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

  const handleRefundTransaction = async (orderId: number) => {
    setRefundLoading(orderId);
    try {
      // Use internal meal order refund
      const response = await mealRefundApi.refundMealOrder(orderId, "User requested refund");
      
      // Extract meal order details from the response if available
      let mealDetails = '';
      let refundAmount = '';
      
      if (response.data) {
        const data = response.data;
        if (data.meal_name) {
          mealDetails = ` for "${data.meal_name}"`;
        }
        if (data.meal_date) {
          mealDetails += ` (${new Date(data.meal_date).toLocaleDateString()})`;
        }
        if (data.family_member_name) {
          mealDetails += ` ordered by ${data.family_member_name}`;
        }
        if (data.refund_amount) {
          refundAmount = ` (${formatCurrency(data.refund_amount)})`;
        }
      }
      
      // Create detailed success message
      const successMessage = `Meal order${mealDetails} has been successfully cancelled and refunded${refundAmount} to your wallet.`;
      
      // Show success toast
      toast({ 
        title: "🎉 Refund Successful!", 
        description: successMessage, 
        variant: "default" 
      });
      
      // Add haptic feedback for successful refund
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Short vibration pattern
      }
      
      // Set success message for display
      setRefundSuccessMessage(successMessage);
      
      // Add to successful refunds set
      setSuccessfulRefunds(prev => new Set([...prev, orderId]));
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setRefundSuccessMessage(null);
      }, 5000);
      
      // Refresh wallet data to show updated balance and transactions
      fetchWalletData();
      
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Refund failed. Please try again.';
      toast({ 
        title: "❌ Refund Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setRefundLoading(null);
    }
  };

  const handleLogout = () => {
    // Show success message
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    
    // Use auth context logout which handles clearing data and navigation
    logout();
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setNewReceiptImage(null);
    setEditModalOpen(true);
  };

  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewReceiptImage(file);
    }
  };

  const handleUpdateReceipt = async () => {
    if (!editingTransaction || !newReceiptImage) {
      toast({ title: "Error", description: "Please select a new receipt image.", variant: "destructive" });
      return;
    }

    setEditLoading(true);
    try {
      // Receipt upload functionality removed - InstaPay no longer supported
      toast({ title: "Success", description: "Receipt updated successfully. Processing will begin shortly." });
      setEditModalOpen(false);
      setEditingTransaction(null);
      setNewReceiptImage(null);
      fetchWalletData(); // Refresh data
    } catch (error) {
      toast({ title: "Error", description: "Failed to update receipt. Please try again.", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  // Sort transactions by date
  const allTransactions = [...transactions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const mappedTransactions = allTransactions
    .filter((t: any) => !deletedTransactions.has(t.id)) // Filter out deleted transactions
    .map((t: any) => {
    // For refund transactions, construct description from details if description is null
    let note = t.description || t.note || '';
    if (t.type === 'refund' && !note && t.details) {
      if (t.details.order_id && t.details.family_member_name) {
        note = `Refund for order #${t.details.order_id} (Originally ordered by ${t.details.family_member_name})`;
      } else if (t.details.order_id) {
        note = `Refund for order #${t.details.order_id}`;
      } else if (t.details.refund_reason) {
        note = `Refund: ${t.details.refund_reason}`;
      } else {
        note = 'Refund transaction';
      }
    }

    // Handle recharge transactions
            if (t.type === 'recharge') {
      if (!note) {
        note = 'Wallet Recharge';
      }
    }


    return {
      reference_id: t.reference_id,
      id: t.id,
      type: t.type || t.transaction_type || 'unknown',
      amount: t.amount,
      created_at: t.created_at,
      note: note,
      refunded_at: t.refunded_at || null,
      details: t.details || {},
      status: t.status,
      reference_code: t.reference_code,
      parent_name: t.parent_name,
      familyMemberName: t.details?.family_member_name || null,
      familyMemberId: t.details?.family_member_id || null,
      isFamilyMemberOrder: !!(t.details?.family_member_id),
    };
  });

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
        className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red shadow-lg"
        data-tutorial="wallet-header"
      >
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="App Logo" className="w-10 h-10 rounded-lg shadow-md" />
            <div>
              <h1 className="text-lg font-bold text-white">Wallet</h1>
              <p className="text-sm text-white/90">Welcome back, {userProfile?.name || 'User'}</p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            
            {/* Tutorial Button */}
            <TutorialTrigger variant="inline" />
            
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-200 shadow-md"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>



      {/* Campaign Slider */}
      <div className="px-4 py-3 sm:py-4">
        <CampaignSlider />
      </div>

      {/* Success Message Banner */}
      {refundSuccessMessage && (
        <div className="mx-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-green-300 animate-pulse">
            <div className="h-full bg-green-500 transition-all duration-5000 ease-linear" style={{ width: '100%' }}></div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800 mb-1">🎉 Refund Completed Successfully!</h4>
              <p className="text-sm text-green-700">{refundSuccessMessage}</p>
              <p className="text-xs text-green-600 mt-1">This message will disappear automatically in 5 seconds</p>
            </div>
            <button
              onClick={() => setRefundSuccessMessage(null)}
              className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
              title="Dismiss message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-2 space-y-4">
        {/* Maintenance Warning Banner */}
        <Card className="bg-gradient-to-r from-red-500 to-orange-500 border-2 border-red-600 shadow-xl rounded-2xl p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">⚠️ Maintenance Notice</h3>
              <p className="text-white text-base font-semibold mb-2">
                The app is temporarily stopped due to maintenance issues.
              </p>
              <p className="text-white/90 text-sm">
                This maintenance is expected to take up to <span className="font-bold">2 days</span>. 
                We apologize for any inconvenience and appreciate your patience.
              </p>
            </div>
          </div>
        </Card>

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
                className="bg-white/20 hover:bg-white/30 backdrop-blur text-white border border-white/30 rounded-xl text-sm sm:text-base w-full sm:w-auto px-4 py-2 opacity-50 cursor-not-allowed"
                disabled={true}
                data-tutorial="wallet-recharge"
                title="Recharge is temporarily disabled due to maintenance"
              >
                + Recharge (Disabled)
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

        {/* Edit Transaction Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogTitle>Edit Transaction</DialogTitle>
            <div className="space-y-4 mt-2">
              {editingTransaction && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(editingTransaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reference:</span>
                      <span className="text-sm font-medium">{editingTransaction.reference_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Parent Name:</span>
                      <span className="text-sm font-medium">{editingTransaction.parent_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-medium text-yellow-600">⏳ {editingTransaction.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium">{new Date(editingTransaction.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Receipt Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={editLoading}
                />
                {newReceiptImage && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ New receipt selected: {newReceiptImage.name}
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Uploading a new receipt will replace the previous one and restart the validation process.
                </p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  onClick={() => setEditModalOpen(false)} 
                  variant="outline" 
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateReceipt} 
                  disabled={editLoading || !newReceiptImage}
                >
                  {editLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size={16} />
                      Updating...
                    </div>
                  ) : (
                    'Update Receipt'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Transactions */}
        <div className="transactions-section space-y-3" data-tutorial="wallet-transactions">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Recent Transactions</h3>
            <div className="text-xs text-gray-500 text-right">
              <p>Transactions appear instantly</p>
              <p>Pull down to refresh</p>
            </div>
          </div>
          {loading && allTransactions.length === 0 ? (
            <div className="text-center py-8">
              <LoadingSpinner size={32} />
              <p className="text-gray-500 text-sm mt-2">Loading transactions...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-4">
                  <LoadingSpinner size={24} />
                  <p className="text-gray-500 text-xs mt-1">Refreshing...</p>
                </div>
              )}
              {mappedTransactions.map((transaction) => {
                const isRefundable =
                  transaction.type === 'purchase' &&
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
                            transaction.type === 'recharge' || transaction.type === 'refund' ? 'bg-green-100 text-green-700' : 
                            transaction.type === 'purchase' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.type === 'recharge' || transaction.type === 'refund' ? '+' : '-'}{transaction.type}
                          </span>
                          {transaction.isFamilyMemberOrder && transaction.familyMemberName && (
                            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                              👤 {transaction.familyMemberName}
                            </span>
                          )}
                          {successfulRefunds.has(transaction.reference_id) && (
                            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 animate-pulse">
                              ✅ Refunded
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base sm:text-lg font-bold ${
                          transaction.type === 'recharge' || transaction.type === 'refund' ? 'text-green-600' : 
                          transaction.type === 'purchase' ? 'text-red-600' : 
                          'text-gray-900'
                        }`}>
                          {transaction.type === 'recharge' || transaction.type === 'refund' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                        </div>
                        {isRefundable && !successfulRefunds.has(transaction.reference_id) && (
                          <button
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={refundLoading === transaction.reference_id}
                            onClick={() => handleRefundTransaction(transaction.reference_id)}
                          >
                            {refundLoading === transaction.reference_id ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              'Refund'
                            )}
                          </button>
                        )}
                        {successfulRefunds.has(transaction.reference_id) && (
                          <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Refunded
                          </div>
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
          {!loading && allTransactions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-2">No transactions found</p>
              <p className="text-gray-400 text-xs">Complete a recharge or make a purchase to see your transaction history</p>
              <Button
                onClick={() => navigate("/recharge")}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Recharge Now
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Tutorial Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <TutorialTrigger 
          variant="floating"
          className="shadow-lg"
        />
      </div>

      <BottomNavigation activeTab="wallet" />
      
    </div>
  );
};

export default Wallet;
