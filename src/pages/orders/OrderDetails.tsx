import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '@/services/api';
import { Button } from '@/components/ui/button';

interface Order {
  id: number;
  meal_name: string;
  status: string;
  amount: number;
  created_at: string;
  details?: string;
  [key: string]: any;
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrder(Number(id));
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch order details');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">Completed</span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Approved</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold">Pending</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Order not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">&larr; Back to Orders</Button>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Order Details</h1>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getStatusBadge(order.status)}
            <span className="text-gray-500 text-sm">Order #{order.id}</span>
          </div>
          <div className="mb-1">
            <span className="font-semibold">Meal:</span> {order.meal_name}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Amount:</span> <span className="text-blue-600">{order.amount.toFixed(2)} EGP</span>
          </div>
          <div className="mb-1">
            <span className="font-semibold">Date:</span> {new Date(order.created_at).toLocaleString()}
          </div>
          {order.details && (
            <div className="mb-1">
              <span className="font-semibold">Details:</span> {order.details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 