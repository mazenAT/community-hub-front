import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PaymentMethod {
  id: number;
  type: string;
  last_four: string;
  is_default: boolean;
  expiry_date: string;
}

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/payment-methods');
      setPaymentMethods(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/wallet/payment-methods/${id}/default`);
      fetchPaymentMethods();
    } catch (err) {
      console.error('Failed to set default payment method');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await api.delete(`/wallet/payment-methods/${id}`);
      fetchPaymentMethods();
    } catch (err) {
      console.error('Failed to delete payment method');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No payment methods found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {method.type} ending in {method.last_four}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Expires: {method.expiry_date}
                  </p>
                  {method.is_default && (
                    <span className="text-sm text-green-600">Default</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
            {/* Add payment form will go here */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods; 