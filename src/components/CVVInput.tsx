import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

interface CVVInputProps {
  selectedCard: {
    id: number;
    card_alias: string;
    last_four_digits: string;
    brand: string;
    expiry_month: string;
    expiry_year: string;
  };
  onCVVSubmit: (cvv: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CVVInput: React.FC<CVVInputProps> = ({
  selectedCard,
  onCVVSubmit,
  onCancel,
  isLoading = false
}) => {
  const [cvv, setCvv] = useState('');
  const [showCVV, setShowCVV] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateCVV = (cvvValue: string): string[] => {
    const errors: string[] = [];
    
    if (!cvvValue || cvvValue.length < 3 || cvvValue.length > 4) {
      errors.push('CVV must be 3-4 digits');
    }
    
    if (!/^\d+$/.test(cvvValue)) {
      errors.push('CVV must contain only numbers');
    }
    
    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validateCVV(cvv);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      onCVVSubmit(cvv);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Confirm Payment</h3>
          <p className="text-sm text-gray-600">Enter CVV for your saved card</p>
        </div>

        {/* Card Display */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">{selectedCard.card_alias}</div>
              <div className="text-lg font-semibold">
                •••• •••• •••• {selectedCard.last_four_digits}
              </div>
              <div className="text-xs opacity-90">
                Expires {selectedCard.expiry_month}/{selectedCard.expiry_year}
              </div>
            </div>
            <CreditCard className="w-8 h-8 opacity-80" />
          </div>
        </div>

        {/* CVV Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">CVV Code</label>
          <div className="relative">
            <Input
              type={showCVV ? 'text' : 'password'}
              placeholder="Enter CVV"
              value={cvv}
              onChange={(e) => {
                setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                setErrors([]);
              }}
              className="pr-10"
              maxLength={4}
            />
            <button
              type="button"
              onClick={() => setShowCVV(!showCVV)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {errors.length > 0 && (
            <div className="text-red-500 text-xs">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !cvv}
            className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange"
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CVVInput;