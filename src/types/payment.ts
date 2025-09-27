// payment.ts
export interface PaymentMethod {
  id: 'paymob_card' | 'paymob_wallet' | 'card';
  name: string;
  description: string;
  icon: string;
  type: 'card' | 'wallet';
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
    checkout_url?: string;      // ← New unified intention API
    intention_id?: string;      // ← New unified intention API
  };
  message?: string;
}

// New unified intention API types
export interface CheckoutInitiateRequest {
  amount: number;
  currency: string;
  payment_method: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city: string;
  country: string;
  merchant_order_id: string;
  items: Array<{
    name: string;
    amount: number;
    description: string;
    quantity: number;
  }>;
}

export interface CheckoutInitiateResponse {
  success: boolean;
  data?: {
    checkout_url: string;
    intention_id: string;
    merchant_order_id: string;
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