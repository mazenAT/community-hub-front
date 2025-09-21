import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BillingData } from '@/types/payment';
import React, { useState } from 'react';

interface PaymentFormProps {
  onSubmit: (billingData: BillingData) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit }) => {
  const [billingData, setBillingData] = useState<BillingData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    apartment: '',
    floor: '',
    street: '',
    building: '',
    city: '',
    country: 'Egypt',
    postal_code: '',
    state: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(billingData);
  };

  const handleInputChange = (field: keyof BillingData, value: string) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Billing Information</CardTitle>
        <p className="text-sm text-gray-600 text-center">Please provide your billing details for payment processing</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="First Name"
              value={billingData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Last Name"
              value={billingData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              required
            />
          </div>
          
          <Input
            type="email"
            placeholder="Email"
            value={billingData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
          
          <Input
            type="tel"
            placeholder="Phone Number"
            value={billingData.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Apartment"
              value={billingData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Floor"
              value={billingData.floor}
              onChange={(e) => handleInputChange('floor', e.target.value)}
              required
            />
          </div>
          
          <Input
            type="text"
            placeholder="Street"
            value={billingData.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
            required
          />
          
          <Input
            type="text"
            placeholder="Building"
            value={billingData.building}
            onChange={(e) => handleInputChange('building', e.target.value)}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="City"
              value={billingData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Postal Code"
              value={billingData.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              required
            />
          </div>
          
          <Input
            type="text"
            placeholder="State"
            value={billingData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            required
          />
          
          <Button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded">
            Continue to Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;