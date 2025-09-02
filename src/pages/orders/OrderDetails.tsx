import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';

interface OrderItem {
  id: number;
  meal_id?: number;
  add_on_id?: number;
  meal?: {
    id: number;
    name: string;
    title?: string;
    description?: string;
    price: number;
  };
  add_on?: {
    id: number;
    name: string;
    description?: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  meal_date?: string;
}

interface Order {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  family_member?: {
    id: number;
    name: string;
    grade: string;
    class: string;
  };
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
      case 'processing':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Processing</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">{status}</span>;
    }
  };

  const renderOrderItem = (item: OrderItem, index: number) => {
    const isMeal = item.meal_id;
    const itemName = isMeal ? item.meal?.name || item.meal?.title : item.add_on?.name;
    const itemDescription = isMeal ? item.meal?.description : item.add_on?.description;
    
    return (
      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {isMeal ? '🍽️' : '➕'} {itemName}
            </h4>
            {itemDescription && (
              <p className="text-sm text-gray-600 mt-1">{itemDescription}</p>
            )}
            {isMeal && item.meal_date && (
              <p className="text-sm text-blue-600 mt-1">
                📅 {new Date(item.meal_date).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Unit Price: {formatCurrency(item.unit_price)}
          </span>
          <span className="font-semibold text-gray-900">
            Total: {formatCurrency(item.total_price)}
          </span>
        </div>
      </div>
    );
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
          &larr; Back to Orders
        </Button>
        
        <div className="bg-white rounded-lg shadow p-6">
          {/* Order Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
            {getStatusBadge(order.status)}
            <span className="text-gray-500 text-sm">Order #{order.id}</span>
          </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Order Date:</span>
                <p className="text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Last Updated:</span>
                <p className="text-gray-900">{new Date(order.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {order.family_member && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold text-blue-800">👨‍👩‍👧‍👦 Family Member:</span>
                <p className="text-blue-900">{order.family_member.name} - Grade {order.family_member.grade}, Class {order.family_member.class}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item, index) => renderOrderItem(item, index))}
          </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No items found in this order</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/orders')}
              variant="outline"
              className="flex-1"
            >
              View All Orders
            </Button>
            <Button 
              onClick={() => navigate('/planner')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 