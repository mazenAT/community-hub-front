import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchWalletData, fetchWalletStatistics } from '../../store/slices/walletSlice';
import { formatCurrency } from '../../utils/format';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { TransactionList } from './TransactionList';
import { WalletStatistics } from './WalletStatistics';

export const Wallet: React.FC = () => {
  const dispatch = useAppDispatch();
  const { balance, transactions, loading, error, statistics } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(fetchWalletData());
    dispatch(fetchWalletStatistics());
  }, [dispatch]);

  if (loading && !transactions.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">Wallet</h1>
        <div className="text-3xl font-bold text-green-600 mb-4">
          {formatCurrency(balance)}
        </div>
        <p className="text-gray-600">Available Balance</p>
      </div>

      {statistics && <WalletStatistics statistics={statistics} />}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}; 