export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  type: TransactionType;
  accountId: string; // Source for Expense/Transfer, Target for Income
  toAccountId?: string; // Target for Transfer
  tags: string[]; // Changed from category: string to support multiple tags
  description: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'STAKEHOLDER' | 'ASSET' | 'LIABILITY' | 'OTHER';
  initialBalance: number;
  color: string;
  parentAccountId?: string;
  includeInNetWorth?: boolean;
  description?: string;
}

export interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: string[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  getAccountBalance: (accountId: string) => number;
  totalNetWorth: number;
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (isOpen: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  resetData: () => void;
}