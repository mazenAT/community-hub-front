import React, { useState, useEffect } from 'react';
import { TransactionList } from '@/components/Wallet/TransactionList';
import { walletApi } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

const RechargeHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletApi.getTransactions();
      let transactionsData = [];
      if (Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        transactionsData = response.data.data;
      } else {
        console.error('Transactions API did not return an array:', response.data);
      }
      // Map and filter for credit type only
      const mapped = transactionsData.map((t: any) => ({
        id: t.id,
        type: t.type || t.transaction_type || 'unknown',
        amount: t.amount,
        status: t.status || 'completed',
        created_at: t.created_at,
        note: t.description || t.note || '',
        refunded_at: t.refunded_at || null,
      })).filter((tx: any) => tx.type === 'credit');
      setTransactions(mapped);
    } catch (err) {
      setError('Failed to fetch recharge history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  // Local TransactionList for RechargeHistory (no Action column)
  const RechargeTransactionList: React.FC<{ transactions: any[] }> = ({ transactions }) => {
    if (!transactions.length) {
      return (
        <div className="text-center text-gray-500 py-4">
          No transactions found
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleDateString()}</div>
              <div className="font-semibold text-base">{transaction.note || '-'}</div>
              <div className="text-sm mt-1">
                <span className="inline-block bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs font-medium mr-2">
                  {transaction.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{transaction.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-0 text-right">
              <div className="text-lg font-bold">{Number(transaction.amount).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Recharge History</h1>
        {transactions.length === 0 ? (
          <EmptyState icon={<AlertCircle />} message="No recharge transactions found" />
        ) : (
          <RechargeTransactionList transactions={transactions} />
        )}
      </div>
      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default RechargeHistory; 