import { Card, CardContent } from '@/components/ui/card';
import { PaymentMethod } from '@/types/payment';
import { CreditCard, Smartphone } from 'lucide-react';
import React from 'react';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ onSelect }) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paymob_card',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card via Paymob',
      icon: 'credit-card',
      type: 'card'
    },
    {
      id: 'paymob_wallet',
      name: 'Mobile Wallet',
      description: 'Pay with Vodafone Cash, Orange Money, etc.',
      icon: 'wallet',
      type: 'wallet'
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="w-6 h-6" />;
      case 'wallet':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Select Payment Method</h3>
      {paymentMethods.map((method) => (
        <Card
          key={method.id}
          onClick={() => onSelect(method)}
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 hover:border-blue-300"
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">{getIcon(method.icon)}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;