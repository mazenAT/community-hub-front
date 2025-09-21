import { formatCurrency } from '@/utils/format';
import React from 'react';

interface Transaction {
  id: string | number;
  type: string;
  amount: number;
  created_at: string;
  description?: string;
  note?: string;
  status?: string;
  details?: any;
  payment_method?: string;
  isInstaPayTransaction?: boolean;
  isFamilyMemberOrder?: boolean;
  familyMemberName?: string;
  refunded_at?: string | null;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getPaymentMethodDisplay = (transaction: Transaction) => {
    switch (transaction.payment_method) {
      case 'paymob_card':
        return 'Credit/Debit Card (Paymob)';
      case 'paymob_wallet':
        return 'Mobile Wallet (Paymob)';
      case 'instapay':
        return 'InstaPay Transfer';
      default:
        return transaction.payment_method || 'Unknown';
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.details?.payment_method === 'paymob_card') {
      return 'Paymob Card Payment';
    } else if (transaction.details?.payment_method === 'paymob_wallet') {
      return 'Paymob Wallet Payment';
    } else if (transaction.type === 'recharge' || transaction.type === 'instapay_recharge') {
      return 'Wallet Recharge';
    } else if (transaction.type === 'refund') {
      return 'Refund';
    } else if (transaction.type === 'purchase') {
      return 'Purchase';
    }
    return transaction.description || transaction.note || 'Transaction';
  };

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.isInstaPayTransaction && transaction.status) {
      const statusColors = {
        completed: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700'
      };
      
      const statusIcons = {
        completed: '✅',
        pending: '⏳',
        failed: '❌'
      };

      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[transaction.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
          {statusIcons[transaction.status as keyof typeof statusIcons] || '❓'} {transaction.status}
        </span>
      );
    }

    if (transaction.refunded_at) {
      return (
        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
          ✅ Refunded
        </span>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{getTransactionDescription(transaction)}</h4>
              <p className="text-sm text-gray-600">
                {getPaymentMethodDisplay(transaction)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(transaction.created_at).toLocaleDateString()}
              </p>
              
              {/* Family member info */}
              {transaction.isFamilyMemberOrder && transaction.familyMemberName && (
                <div className="text-xs text-blue-600 font-medium mt-1">
                  👤 {transaction.familyMemberName}
                </div>
              )}

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  transaction.type === 'recharge' || transaction.type === 'refund' || transaction.type === 'instapay_recharge' ? 'bg-green-100 text-green-700' : 
                  transaction.type === 'purchase' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {transaction.type === 'recharge' || transaction.type === 'refund' || transaction.type === 'instapay_recharge' ? '+' : '-'}{transaction.type}
                </span>
                
                {getStatusBadge(transaction)}
              </div>

              {/* Additional details for InstaPay transactions */}
              {transaction.isInstaPayTransaction && transaction.details && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {transaction.details.reference_code && (
                    <div>Reference: {transaction.details.reference_code}</div>
                  )}
                  {transaction.details.parent_name && (
                    <div>Parent: {transaction.details.parent_name}</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {transaction.status || 'completed'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;