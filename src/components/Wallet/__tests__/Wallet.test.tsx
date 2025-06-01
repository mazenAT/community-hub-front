import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import walletReducer from '../../../store/slices/walletSlice';
import { Wallet } from '../Wallet';

const mockStore = configureStore({
  reducer: {
    wallet: walletReducer,
  },
});

describe('Wallet Component', () => {
  const mockWalletData = {
    balance: 1000,
    transactions: [
      {
        id: 1,
        type: 'credit',
        amount: 500,
        status: 'completed',
        created_at: '2024-03-21T10:00:00Z',
        note: 'Test credit',
      },
    ],
  };

  const mockStatistics = {
    total_deposited: 2000,
    total_withdrawn: 1000,
    pending_withdrawals: 500,
  };

  beforeEach(() => {
    // Mock fetch calls
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWalletData),
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatistics),
      }));
  });

  it('renders loading state initially', () => {
    render(
      <Provider store={mockStore}>
        <Wallet />
      </Provider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders wallet data after loading', async () => {
    render(
      <Provider store={mockStore}>
        <Wallet />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('Test credit')).toBeInTheDocument();
    });
  });

  it('renders statistics after loading', async () => {
    render(
      <Provider store={mockStore}>
        <Wallet />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Deposited')).toBeInTheDocument();
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
      expect(screen.getByText('Total Withdrawn')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('Pending Withdrawals')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });
  });

  it('renders error state when API fails', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));

    render(
      <Provider store={mockStore}>
        <Wallet />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
}); 