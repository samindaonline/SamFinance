import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Account, Transaction, Liability, Receivable, BudgetProject, FinanceContextType } from '../types';
import { storage } from '../utils/storage';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, CURRENCIES } from '../constants';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [budgetProjects, setBudgetProjects] = useState<BudgetProject[]>([]);
  const [currency, setCurrencyState] = useState<string>('LKR');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  
  // Guard to prevent auto-save from overwriting reset/import actions during reload
  const isResetting = useRef(false);

  // Load initial data
  useEffect(() => {
    const loadedAccounts = storage.accounts.load(DEFAULT_ACCOUNTS);
    
    // Migration: Handle legacy transactions
    const rawTransactions = storage.transactions.load([]);
    const loadedTransactions = rawTransactions.map((t: any) => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : (t.category ? [t.category] : [])
    }));

    const loadedCategories = storage.categories.load(DEFAULT_CATEGORIES);
    const loadedCurrency = storage.currency.load('LKR');
    
    // Migration: Handle legacy liabilities
    const rawLiabilities = storage.liabilities.load([]);
    const loadedLiabilities = rawLiabilities.map((l: any) => ({
        ...l,
        name: l.name || l.title || 'Untitled Liability',
        description: l.description || '',
    }));

    const loadedReceivables = storage.receivables.load([]);
    const loadedBudgets = storage.budgets.load([]);
    
    setAccounts(loadedAccounts);
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
    setLiabilities(loadedLiabilities);
    setReceivables(loadedReceivables);
    setBudgetProjects(loadedBudgets);
    setCurrencyState(loadedCurrency);
    setIsLoaded(true);
  }, []);

  // Save changes - Only runs if NOT resetting
  useEffect(() => {
    if (isLoaded && !isResetting.current) {
      storage.accounts.save(accounts);
      storage.transactions.save(transactions);
      storage.categories.save(categories);
      storage.currency.save(currency);
      storage.liabilities.save(liabilities);
      storage.receivables.save(receivables);
      storage.budgets.save(budgetProjects);
    }
  }, [accounts, transactions, categories, currency, liabilities, receivables, budgetProjects, isLoaded]);

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID()
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => {
        const remaining = prev.filter(acc => acc.id !== id);
        return remaining.map(acc => acc.parentAccountId === id ? { ...acc, parentAccountId: undefined } : acc);
    });
    setTransactions(prev => prev.filter(t => t.accountId !== id && t.toAccountId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category].sort());
    }
  };

  const removeCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  const addLiability = (liability: Omit<Liability, 'id' | 'status'>) => {
    const newLiability: Liability = {
      ...liability,
      id: crypto.randomUUID(),
      status: 'PENDING'
    };
    setLiabilities(prev => [...prev, newLiability]);
  };

  const toggleLiabilityStatus = (id: string) => {
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, status: l.status === 'PENDING' ? 'PAID' : 'PENDING' } : l));
  };

  const deleteLiability = (id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  const addReceivable = (receivable: Omit<Receivable, 'id' | 'status'>) => {
    const newReceivable: Receivable = {
      ...receivable,
      id: crypto.randomUUID(),
      status: 'PENDING'
    };
    setReceivables(prev => [...prev, newReceivable]);
  };

  const toggleReceivableStatus = (id: string) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'PENDING' ? 'RECEIVED' : 'PENDING' } : r));
  };

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
  };

  const addBudgetProject = (name: string) => {
    const newProject: BudgetProject = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        items: []
    };
    setBudgetProjects(prev => [newProject, ...prev]);
  };

  const updateBudgetProject = (project: BudgetProject) => {
      setBudgetProjects(prev => prev.map(p => p.id === project.id ? project : p));
  };

  const deleteBudgetProject = (id: string) => {
      setBudgetProjects(prev => prev.filter(p => p.id !== id));
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
  };

  const importData = useCallback((jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);
        
        // Basic validation
        if (!data || typeof data !== 'object' || !Array.isArray(data.accounts)) {
            console.error("Invalid data format: Missing accounts array.");
            return false;
        }

        // 1. Lock the auto-save mechanism
        isResetting.current = true;

        // 2. Direct write to storage with fallback defaults
        storage.accounts.save(data.accounts);
        storage.transactions.save(Array.isArray(data.transactions) ? data.transactions : []);
        storage.categories.save(Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES);
        storage.liabilities.save(Array.isArray(data.liabilities) ? data.liabilities : []);
        storage.receivables.save(Array.isArray(data.receivables) ? data.receivables : []);
        storage.budgets.save(Array.isArray(data.budgetProjects) ? data.budgetProjects : []);
        
        if (data.currency) {
            storage.currency.save(data.currency);
        }

        // 3. Reload
        // Using a short timeout to ensure the storage write operation completes in the event loop (though localStorage is sync)
        setTimeout(() => {
            window.location.reload();
        }, 50);
        
        return true;
    } catch (error) {
        console.error("Failed to parse import data", error);
        return false;
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    const currObj = CURRENCIES.find(c => c.code === currency);
    const symbol = currObj ? currObj.symbol : currency;
    const separator = symbol.length > 1 ? ' ' : '';
    return `${symbol}${separator}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  const getDirectBalance = useCallback((accId: string) => {
        const account = accounts.find(a => a.id === accId);
        if (!account) return 0;
        
        let balance = account.initialBalance || 0;
        transactions.forEach(t => {
            if (t.accountId === accId) {
                if (t.type === 'INCOME') balance += t.amount;
                if (t.type === 'EXPENSE') balance -= t.amount;
                if (t.type === 'TRANSFER') balance -= t.amount;
            }
            if (t.toAccountId === accId && t.type === 'TRANSFER') {
                balance += t.amount;
            }
        });
        return balance;
  }, [accounts, transactions]);

  const getAccountBalance = useCallback((accountId: string) => {
    let total = getDirectBalance(accountId);
    const children = accounts.filter(a => a.parentAccountId === accountId);
    children.forEach(child => {
        total += getAccountBalance(child.id);
    });
    return total;
  }, [accounts, getDirectBalance]);

  const totalNetWorth = useMemo(() => {
    return accounts.reduce((total, acc) => {
        if (acc.includeInNetWorth === false) return total;
        
        const balance = getDirectBalance(acc.id);
        
        if (acc.type === 'LIABILITY') {
            return total - balance;
        }
        return total + balance;
    }, 0);
  }, [accounts, getDirectBalance]);

  const value = {
    accounts,
    transactions,
    categories,
    liabilities,
    receivables,
    budgetProjects,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    deleteTransaction,
    addCategory,
    removeCategory,
    addLiability,
    toggleLiabilityStatus,
    deleteLiability,
    addReceivable,
    toggleReceivableStatus,
    deleteReceivable,
    addBudgetProject,
    updateBudgetProject,
    deleteBudgetProject,
    getAccountBalance,
    totalNetWorth,
    isTransactionModalOpen,
    setTransactionModalOpen,
    currency,
    setCurrency,
    formatCurrency,
    importData
  };

  if (!isLoaded) return null;

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};