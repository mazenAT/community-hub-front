// Frontend-only transaction tracker for Fawry integration
// This helps track transactions without backend dependencies

export interface FrontendTransaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: 'card';
  created_at: string;
  updated_at: string;
  fawry_reference?: string;
  fawry_status?: string;
  error_message?: string;
  card_details?: {
    last_four_digits: string;
    card_alias: string;
  };
  user_id: number;
  // Enhanced Fawry webhook data support
  fawry_ref_number?: string;
  merchant_ref_number?: string;
  payment_amount?: number;
  order_amount?: number;
  three_ds_info?: {
    eci: string;
    cavv: string;
    verStatus: string;
    xid: string;
  };
}

export const frontendTransactionTracker = {
  // Generate unique transaction ID
  generateTransactionId: (): string => {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  },

  // Create new transaction
  createTransaction: (data: {
    amount: number;
    user_id: number;
    card_details?: { last_four_digits: string; card_alias: string };
  }): FrontendTransaction => {
    const transaction: FrontendTransaction = {
      id: frontendTransactionTracker.generateTransactionId(),
      amount: data.amount,
      status: 'pending',
      payment_method: 'card',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: data.user_id,
      card_details: data.card_details,
    };

    // Store in localStorage
    const transactions = frontendTransactionTracker.getAllTransactions();
    transactions.push(transaction);
    localStorage.setItem('frontend_transactions', JSON.stringify(transactions));

    return transaction;
  },

  // Update transaction status
  updateTransaction: (transactionId: string, updates: Partial<FrontendTransaction>): FrontendTransaction | null => {
    const transactions = frontendTransactionTracker.getAllTransactions();
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex === -1) return null;

    const updatedTransaction = {
      ...transactions[transactionIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    transactions[transactionIndex] = updatedTransaction;
    localStorage.setItem('frontend_transactions', JSON.stringify(transactions));

    return updatedTransaction;
  },

  // Mark transaction as failed
  markTransactionFailed: (transactionId: string, errorMessage: string, fawryStatus?: string): FrontendTransaction | null => {
    return frontendTransactionTracker.updateTransaction(transactionId, {
      status: 'failed',
      error_message: errorMessage,
      fawry_status: fawryStatus,
      updated_at: new Date().toISOString()
    });
  },

  // Mark transaction as completed
  markTransactionCompleted: (transactionId: string, fawryReference?: string): FrontendTransaction | null => {
    return frontendTransactionTracker.updateTransaction(transactionId, {
      status: 'completed',
      fawry_reference: fawryReference,
      updated_at: new Date().toISOString()
    });
  },

  // Get all transactions
  getAllTransactions: (): FrontendTransaction[] => {
    try {
      const stored = localStorage.getItem('frontend_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading transactions from localStorage:', error);
      return [];
    }
  },

  // Get transactions by user
  getTransactionsByUser: (userId: number): FrontendTransaction[] => {
    return frontendTransactionTracker.getAllTransactions().filter(t => t.user_id === userId);
  },

  // Get transactions by status
  getTransactionsByStatus: (status: FrontendTransaction['status']): FrontendTransaction[] => {
    return frontendTransactionTracker.getAllTransactions().filter(t => t.status === status);
  },

  // Get failed transactions (for Fawry testing)
  getFailedTransactions: (): FrontendTransaction[] => {
    return frontendTransactionTracker.getTransactionsByStatus('failed');
  },

  // Get pending transactions
  getPendingTransactions: (): FrontendTransaction[] => {
    return frontendTransactionTracker.getTransactionsByStatus('pending');
  },

  // Get completed transactions
  getCompletedTransactions: (): FrontendTransaction[] => {
    return frontendTransactionTracker.getTransactionsByStatus('completed');
  },

  // Clear old transactions (older than 30 days)
  clearOldTransactions: (): void => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = frontendTransactionTracker.getAllTransactions();
    const filteredTransactions = transactions.filter(t => 
      new Date(t.created_at) > thirtyDaysAgo
    );

    localStorage.setItem('frontend_transactions', JSON.stringify(filteredTransactions));
  },

  // Export transactions for debugging
  exportTransactions: (): string => {
    const transactions = frontendTransactionTracker.getAllTransactions();
    return JSON.stringify(transactions, null, 2);
  },

  // Get transaction statistics
  getTransactionStats: (): {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    totalAmount: number;
    averageAmount: number;
  } => {
    const transactions = frontendTransactionTracker.getAllTransactions();
    
    const total = transactions.length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const completed = transactions.filter(t => t.status === 'completed').length;
    const failed = transactions.filter(t => t.status === 'failed').length;
    
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = total > 0 ? totalAmount / total : 0;

    return {
      total,
      pending,
      completed,
      failed,
      totalAmount,
      averageAmount
    };
  }
};

// Auto-cleanup old transactions every time the service is used
frontendTransactionTracker.clearOldTransactions();

export default frontendTransactionTracker; 