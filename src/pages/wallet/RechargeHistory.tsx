import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface RechargeTransaction {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  transaction_id: string;
}

const RechargeHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<RechargeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRechargeHistory();
  }, []);

  const fetchRechargeHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/recharge/history');
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recharge history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Recharge History</h1>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No recharge transactions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    Transaction #{transaction.transaction_id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {transaction.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                  <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RechargeHistory; 