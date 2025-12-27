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

export interface Liability {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string YYYY-MM-DD
  paymentAccountId: string; // The account intended to pay this
  status: 'PENDING' | 'PAID';
}

export interface Receivable {
  id: string;
  name: string;
  description: string;
  amount: number;
  expectedDate: string; // ISO string YYYY-MM-DD
  targetAccountId: string; // The account intended to receive this
  status: 'PENDING' | 'RECEIVED';
  type: 'ONE_TIME' | 'RECURRING';
}

export interface BudgetInstallment {
  id: string;
  date: string;
  amount: number;
  accountId: string; // Account used for this specific installment
}

export interface BudgetItem {
  id: string;
  name: string;
  link?: string;
  totalPrice: number;
  installments: BudgetInstallment[];
}

export interface BudgetProject {
  id: string;
  name: string;
  createdAt: string;
  items: BudgetItem[];
}

export interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: string[];
  liabilities: Liability[];
  receivables: Receivable[];
  budgetProjects: BudgetProject[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addLiability: (liability: Omit<Liability, 'id' | 'status'>) => void;
  toggleLiabilityStatus: (id: string) => void;
  deleteLiability: (id: string) => void;
  addReceivable: (receivable: Omit<Receivable, 'id' | 'status'>) => void;
  updateReceivable: (id: string, receivable: Partial<Receivable>) => void;
  toggleReceivableStatus: (id: string) => void;
  deleteReceivable: (id: string) => void;
  addBudgetProject: (name: string) => void;
  updateBudgetProject: (project: BudgetProject) => void;
  deleteBudgetProject: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  totalNetWorth: number;
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (isOpen: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
  importData: (jsonString: string) => { success: boolean; message: string };
  resetData: () => void;
}