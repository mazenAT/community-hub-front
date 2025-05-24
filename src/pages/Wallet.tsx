
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";

const Wallet = () => {
  const navigate = useNavigate();
  const [balance] = useState(2459.50);
  
  const transactions = [
    {
      id: 1,
      title: "Starbucks Coffee",
      time: "Today, 10:30 AM",
      amount: -4.50,
      type: "expense"
    },
    {
      id: 2,
      title: "Salary Deposit",
      time: "Today, 9:00 AM",
      amount: 2850.00,
      type: "income"
    },
    {
      id: 3,
      title: "Amazon.com",
      time: "Yesterday, 3:45 PM",
      amount: -85.99,
      type: "expense"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">Welcome back, Alex</p>
          </div>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-blue-500 text-white p-6 rounded-2xl border-0">
          <div className="space-y-4">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <h2 className="text-3xl font-bold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <Button 
              onClick={() => navigate("/recharge")}
              className="bg-blue-400 hover:bg-blue-300 text-white border-0 rounded-xl"
            >
              + Recharge
            </Button>
          </div>
        </Card>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="p-4 rounded-xl border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.title}</p>
                      <p className="text-sm text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Wallet;
