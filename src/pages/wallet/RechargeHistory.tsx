import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Calendar, CreditCard, Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

interface RechargeRecord {
  id: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  transaction_id?: string;
  payment_details?: any;
}

const RechargeHistory = () => {
  const navigate = useNavigate();
  const [rechargeHistory, setRechargeHistory] = useState<RechargeRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<RechargeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData: RechargeRecord[] = [
      {
        id: 1,
        amount: 100,
        payment_method: 'card',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        transaction_id: 'TXN001',
      },
      {
        id: 2,
        amount: 200,
        payment_method: 'card',
        status: 'pending',
        created_at: '2024-01-14T15:45:00Z',
        transaction_id: 'TXN002',
      },
      {
        id: 3,
        amount: 150,
        payment_method: 'card',
        status: 'completed',
        created_at: '2024-01-13T09:20:00Z',
        transaction_id: 'TXN003',
      },
      {
        id: 4,
        amount: 300,
        payment_method: 'card',
        status: 'failed',
        created_at: '2024-01-12T14:15:00Z',
        transaction_id: 'TXN004',
      },
    ];

    setRechargeHistory(mockData);
    setFilteredHistory(mockData);
    setLoading(false);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = rechargeHistory;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount.toString().includes(searchTerm)
      );
    }

    setFilteredHistory(filtered);
  }, [searchTerm, statusFilter, rechargeHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recharge history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Mobile-Optimized Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate("/wallet")}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-yellow/20 hover:bg-brand-yellow/30 transition-all duration-200 border border-brand-yellow/30 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-brand-red" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-brand-black">Recharge History</h1>
            <p className="text-sm text-gray-600">View your wallet recharge transactions</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Payment Method Info */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Credit/Debit Card & Mobile Wallet</h3>
                  <p className="text-sm text-blue-700">All recharges are processed via Paymob payment gateway</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by transaction ID or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-10 border-2 border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 rounded-xl"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All', count: rechargeHistory.length },
                { key: 'completed', label: 'Completed', count: rechargeHistory.filter(item => item.status === 'completed').length },
                { key: 'pending', label: 'Pending', count: rechargeHistory.filter(item => item.status === 'pending').length },
                { key: 'failed', label: 'Failed', count: rechargeHistory.filter(item => item.status === 'failed').length }
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={statusFilter === filter.key ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(filter.key as any)}
                  className={`h-10 px-4 rounded-xl whitespace-nowrap transition-all duration-200 ${
                    statusFilter === filter.key 
                      ? 'bg-brand-red text-white border-0 shadow-md' 
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-brand-red hover:bg-brand-red/5'
                  }`}
                >
                  {filter.label}
                  <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                    {filter.count}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recharge History List */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-8 text-center">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No recharge history found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'You haven\'t made any recharge transactions yet'
                  }
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter('all');
                    }}
                    className="bg-brand-red hover:bg-brand-red/90 text-white rounded-xl"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/wallet/recharge")}
                    className="bg-brand-red hover:bg-brand-red/90 text-white rounded-xl"
                  >
                    Recharge Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredHistory.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm bg-white rounded-2xl hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.payment_method === 'paymob_card' ? 'Credit/Debit Card (Paymob)' : 
                           item.payment_method === 'paymob_wallet' ? 'Mobile Wallet (Paymob)' : 
                           'Credit/Debit Card'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.transaction_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-black">
                        {formatAmount(item.amount)}
                      </p>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-brand-red hover:text-brand-red/80 hover:bg-brand-red/5"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/wallet/recharge")}
                className="h-12 bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-orange hover:to-brand-red text-white rounded-xl font-medium"
              >
                Recharge Wallet
              </Button>
              <Button
                onClick={() => navigate("/wallet")}
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:border-brand-red hover:bg-brand-red/5 text-gray-700 rounded-xl font-medium"
              >
                Back to Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default RechargeHistory; 