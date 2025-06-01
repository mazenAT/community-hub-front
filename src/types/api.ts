export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit' | 'top_up' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  note?: string;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  details?: Record<string, any>;
}

export interface WalletStatistics {
  current_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  recent_transactions: WalletTransaction[];
} 