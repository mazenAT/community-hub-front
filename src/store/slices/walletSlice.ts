import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Transaction {
  id: number;
  type: 'credit' | 'debit' | 'top_up' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  note?: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  statistics: {
    total_deposited: number;
    total_withdrawn: number;
    pending_withdrawals: number;
  } | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
  statistics: null,
};

export const fetchWalletData = createAsyncThunk(
  'wallet/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/wallet');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet data');
    }
  }
);

export const fetchWalletStatistics = createAsyncThunk(
  'wallet/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/wallet/statistics');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet statistics');
    }
  }
);

export const topUpWallet = createAsyncThunk(
  'wallet/topUp',
  async (data: { amount: number; payment_method: string; payment_details: any }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/wallet/top-up', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to top up wallet');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wallet Data
      .addCase(fetchWalletData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions;
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Statistics
      .addCase(fetchWalletStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletStatistics.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchWalletStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Top Up
      .addCase(topUpWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(topUpWallet.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.transactions.unshift(action.payload.transaction);
      })
      .addCase(topUpWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWalletError } = walletSlice.actions;
export default walletSlice.reducer; 