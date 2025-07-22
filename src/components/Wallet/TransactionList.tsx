import React from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { walletApi } from '../../services/api';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  note?: string;
  refunded_at?: string | null;
  description?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [refundedIds, setRefundedIds] = React.useState<number[]>([]);

  const handleRefund = async (id: number) => {
    const amountStr = window.prompt('Enter refund amount (leave blank for full refund):');
    const reason = window.prompt('Enter refund reason (optional):') || undefined;
    let amount: number | undefined = undefined;
    if (amountStr && !isNaN(Number(amountStr))) {
      amount = Number(amountStr);
    }
    setLoadingId(id);
    try {
      await walletApi.refundTransaction(id, { amount, reason });
      setRefundedIds((prev) => [...prev, id]);
    } catch (e) {
      alert('Refund failed.');
    } finally {
      setLoadingId(null);
    }
  };

  if (!transactions.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No transactions found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Note
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => {
            const isRefundable =
              transaction.type === 'purchase' &&
              transaction.status === 'completed' &&
              !transaction.refunded_at &&
              !refundedIds.includes(transaction.id);
            return (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === 'credit' || transaction.type === 'top_up'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.description || transaction.note || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {isRefundable ? (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      disabled={loadingId === transaction.id}
                      onClick={() => handleRefund(transaction.id)}
                    >
                      {loadingId === transaction.id ? 'Refunding...' : 'Refund'}
                    </button>
                  ) : transaction.refunded_at || refundedIds.includes(transaction.id) ? (
                    <span className="text-green-600 font-semibold">Refunded</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 