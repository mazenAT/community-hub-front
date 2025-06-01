import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { walletApi } from "@/services/api";
import { showToast } from "@/services/native";
import { formatCurrency } from "@/utils/format";

interface Transaction {
  id: number;
  title: string;
  time: string;
  amount: number;
  type: 'income' | 'expense';
}

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [balanceData, transactionsData] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(page)
      ]);

      setBalance(balanceData.balance);
      setTransactions(prev => 
        page === 1 ? transactionsData.data : [...prev, ...transactionsData.data]
      );
      setHasMore(transactionsData.data.length === 15); // Assuming 15 items per page
    } catch (err) {
      setError('Failed to load wallet data');
      showToast('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [page]);

  const handleRefund = async (transaction: Transaction) => {
    if (transaction.type === "expense") {
      try {
        await walletApi.withdraw(Math.abs(transaction.amount), {
          reason: `Refund for ${transaction.title}`,
          transaction_id: transaction.id
        });
        
        toast({
          title: "Refund Requested",
          description: `Refund request for ${transaction.title} (${formatCurrency(Math.abs(transaction.amount))}) has been submitted. It will be processed within 3-5 business days.`,
        });
        
        showToast('Refund request submitted successfully');
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to submit refund request. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Wallet</h1>
            <p className="text-xs sm:text-sm text-gray-500">Welcome back, Alex</p>
          </div>
          <button 
            onClick={() => navigate("/profile")}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full"
          >
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Balance Card */}
        <Card className="bg-blue-500 text-white p-4 sm:p-6 rounded-2xl border-0">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Total Balance</p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {loading ? 'Loading...' : formatCurrency(balance)}
              </h2>
            </div>
            <Button 
              onClick={() => navigate("/recharge")}
              className="bg-blue-400 hover:bg-blue-300 text-white border-0 rounded-xl text-sm sm:text-base"
              disabled={loading}
            >
              + Recharge
            </Button>
          </div>
        </Card>

        {/* Recent Transactions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
          
          {loading && transactions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-3 sm:p-4 rounded-xl border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900">{transaction.title}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{transaction.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <p className={`text-sm sm:text-base font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      {transaction.type === 'expense' && (
                        <Button
                          onClick={() => handleRefund(transaction)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 rounded-lg text-xs sm:text-sm px-2 sm:px-3"
                          disabled={loading}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {hasMore && (
            <Button
              onClick={loadMore}
              className="w-full mt-4 border border-gray-200 hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Wallet;
