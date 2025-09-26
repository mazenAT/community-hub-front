// payment.ts
export interface PaymentMethod {
  id: 'instapay' | 'paymob_card' | 'paymob_wallet';
  name: string;
  description: string;
  icon: string;
  type: 'instapay' | 'card' | 'wallet';
}

export interface BillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;  // Changed from phone to phone_number
  apartment: string;
  floor: string;
  street: string;
  building: string;
  city: string;
  country: string;
  postal_code: string;
  state: string;
}

export interface PaymentRequest {
  amount: number;
  payment_method: string;
  payment_details: {
    order_id: string;
    item_name: string;
    description: string;
    billing_data: BillingData;
  };
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    transaction: any;
    payment_url: string;        // ← This stays the same ✅
    payment_intent_id?: string; // ← Add this for new API
    transaction_id?: string;    // ← Add this for new API
  };
  message?: string;
}

export interface RechargeRecord {
  id: number;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  transaction_id?: string;
  payment_details?: any;
}