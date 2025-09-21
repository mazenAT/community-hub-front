import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

interface AmountSelectorProps {
  onSubmit: (amount: number) => void;
}

const AmountSelector: React.FC<AmountSelectorProps> = ({ onSubmit }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const predefinedAmounts = [50, 100, 200, 500, 1000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleSubmit = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      onSubmit(amount);
    }
  };

  const getAmountToSubmit = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Select Recharge Amount</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predefined amounts */}
        <div className="grid grid-cols-2 gap-3">
          {predefinedAmounts.map((amount) => (
            <Button
              key={amount}
              variant={selectedAmount === amount ? 'default' : 'outline'}
              onClick={() => handleAmountSelect(amount)}
              className="h-12 text-lg font-semibold"
            >
              {amount} EGP
            </Button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Or enter custom amount</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="pr-12 text-lg"
              min="1"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">EGP</span>
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={getAmountToSubmit() <= 0}
          className="w-full h-12 text-lg font-semibold"
        >
          Continue with {getAmountToSubmit()} EGP
        </Button>
      </CardContent>
    </Card>
  );
};

export default AmountSelector;