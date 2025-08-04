import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';
import { studentPreOrdersApi, mealApi, addOnOrderApi } from '@/services/api';
import BottomNavigation from '@/components/BottomNavigation';

interface PreOrderItem {
  id: number;
  meal_id: number;
  meal_date: string;
  quantity: number;
  meal?: { name: string };
  add_ons?: Array<{
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface PreOrder {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items: PreOrderItem[];
}

interface MealDetails {
  id: number;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  image?: string;
}

interface AddOnOrder {
  id: number;
  add_on?: {
    id: number;
    name: string;
    description?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [addOnOrders, setAddOnOrders] = useState<AddOnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Record<number, MealDetails>>({});

  useEffect(() => {
    fetchOrders();
    fetchAddOnOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    // Collect all unique meal_ids
    const mealIds = Array.from(new Set(orders.flatMap(order => order.items.map(item => item.meal_id))));
    const fetchMeals = async () => {
      const mealDetails: Record<number, MealDetails> = {};
      await Promise.all(mealIds.map(async (id) => {
        try {
          const res = await mealApi.getMeal(id);
          mealDetails[id] = res.data.data;
        } catch (e) {
          // fallback: just id
          mealDetails[id] = { id, name: `Meal #${id}` };
        }
      }));
      setMeals(mealDetails);
    };
    fetchMeals();
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await studentPreOrdersApi.getMyPreOrders();
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pre-orders');
      toast({
        title: 'Error',
        description: 'Failed to fetch pre-orders',
        variant: 'destructive',
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddOnOrders = async () => {
    try {
      const response = await addOnOrderApi.getMyOrders();
      setAddOnOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch add-on orders:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">Delivered</span>;
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Confirmed</span>;

      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Cancelled</span>;
      case 'refunded':
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">Refunded</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return <LoadingSpinner size={48} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState icon={<AlertCircle />} message={error} />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        {orders.length === 0 && addOnOrders.length === 0 ? (
          <EmptyState icon={<AlertCircle />} message="No orders found" />
        ) : (
          <>
            {/* Pre-Orders Section */}
            {orders.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Pre-Orders</h2>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="w-full bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">Pre-Order #{order.id}</h3>
                      <p className="text-xs text-gray-400 mb-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      <ul className="mt-2 text-sm text-gray-700">
                        {order.items.map((item) => {
                          const meal = meals[item.meal_id] || {};
                          return (
                            <li key={item.id} className="mb-2">
                              <div className="font-semibold">{meal.name || `Meal #${item.meal_id}`}</div>
                              {meal.image && <img src={meal.image} alt={meal.name} className="w-16 h-16 object-cover rounded mb-1" />}
                              {meal.description && <div className="text-xs text-gray-500 mb-1">{meal.description}</div>}
                              <div className="text-xs text-gray-500">
                                {meal.category && <span>Category: {meal.category} </span>}
                                {meal.subcategory && <span>Subcategory: {meal.subcategory} </span>}
                              </div>
                              <div className="text-xs text-gray-500">
                                Price: {meal.price ? `${meal.price} EGP` : 'N/A'} | Qty: {item.quantity} | Date: {item.meal_date}
                              </div>
                              {item.add_ons && item.add_ons.length > 0 && (
                                <div className="text-xs text-gray-700 mt-1">
                                  <span className="font-semibold">Add-ons:</span>
                                  <ul className="list-disc list-inside ml-4">
                                    {item.add_ons.map(addon => (
                                      <li key={addon.id}>
                                        {addon.quantity}x {addon.name} ({addon.total_price} EGP)
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right space-y-1">
                      <p className="font-semibold text-blue-600">
                        {typeof order.total_amount === 'number'
                          ? order.total_amount.toFixed(2)
                          : !isNaN(Number(order.total_amount))
                            ? Number(order.total_amount).toFixed(2)
                            : 'N/A'} EGP
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Add-on Orders Section */}
            {addOnOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Add-on Orders</h2>
                {addOnOrders.map((addOnOrder) => (
                  <div
                    key={addOnOrder.id}
                    className="w-full bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">Add-on Order #{addOnOrder.id}</h3>
                      <p className="text-xs text-gray-400 mb-1">{new Date(addOnOrder.created_at).toLocaleDateString()}</p>
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="font-semibold">{addOnOrder.add_on?.name || 'N/A'}</div>
                        {addOnOrder.add_on?.description && (
                          <div className="text-xs text-gray-500 mb-1">{addOnOrder.add_on.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          Quantity: {addOnOrder.quantity} | Unit Price: {
                            typeof addOnOrder.unit_price === 'number' && !isNaN(addOnOrder.unit_price)
                              ? `${addOnOrder.unit_price.toFixed(2)} EGP`
                              : (addOnOrder.unit_price && !isNaN(Number(addOnOrder.unit_price)))
                                ? `${Number(addOnOrder.unit_price).toFixed(2)} EGP`
                                : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right space-y-1">
                      <p className="font-semibold text-blue-600">
                        {typeof addOnOrder.total_price === 'number'
                          ? addOnOrder.total_price.toFixed(2)
                          : !isNaN(Number(addOnOrder.total_price))
                            ? Number(addOnOrder.total_price).toFixed(2)
                            : 'N/A'} EGP
                      </p>
                      {getStatusBadge(addOnOrder.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNavigation activeTab="profile" />
    </>
  );
};

export default MyOrders; 