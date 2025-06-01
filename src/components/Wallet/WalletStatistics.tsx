import React from 'react';
import { formatCurrency } from '../../utils/format';

interface WalletStatisticsProps {
  statistics: {
    total_deposited: number;
    total_withdrawn: number;
    pending_withdrawals: number;
  };
}

export const WalletStatistics: React.FC<WalletStatisticsProps> = ({ statistics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Deposited</h3>
        <p className="text-2xl font-bold text-green-600">
          {formatCurrency(statistics.total_deposited)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Withdrawn</h3>
        <p className="text-2xl font-bold text-red-600">
          {formatCurrency(statistics.total_withdrawn)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Pending Withdrawals</h3>
        <p className="text-2xl font-bold text-yellow-600">
          {formatCurrency(statistics.pending_withdrawals)}
        </p>
      </div>
    </div>
  );
}; 