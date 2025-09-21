import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

interface AmountSelectorProps {
  onSubmit: (amount: number) => void;
}

const AmountSelector: React.FC<AmountSelectorProps> = ({ onSubmit }) => {
  const [customAmount, setCustomAmount] = useState('');

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
  };

  const handleSubmit = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount > 0) {
      onSubmit(amount);
    }
  };

  const getAmountToSubmit = () => {
    return parseFloat(customAmount) || 0;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Enter Recharge Amount</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Enter amount</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="pr-12 text-lg"
              min="1"
              required
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