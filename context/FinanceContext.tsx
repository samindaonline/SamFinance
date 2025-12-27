import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Account, Transaction, Liability, Receivable, FinanceContextType } from '../types';
import { storage } from '../utils/storage';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, CURRENCIES } from '../constants';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [currency, setCurrencyState] = useState<string>('LKR');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  
  // Load initial data
  useEffect(() => {
    const loadedAccounts = storage.accounts.load(DEFAULT_ACCOUNTS);
    
    // Migration: Handle legacy transactions that might have 'category' instead of 'tags'
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
    
    setAccounts(loadedAccounts);
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
    setLiabilities(loadedLiabilities);
    setReceivables(loadedReceivables);
    setCurrencyState(loadedCurrency);
    setIsLoaded(true);
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) {
      storage.accounts.save(accounts);
      storage.transactions.save(transactions);
      storage.categories.save(categories);
      storage.currency.save(currency);
      storage.liabilities.save(liabilities);
      storage.receivables.save(receivables);
    }
  }, [accounts, transactions, categories, currency, liabilities, receivables, isLoaded]);

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

  const setCurrency = (c: string) => {
    setCurrencyState(c);
  };

  const resetData = useCallback(() => {
    // Deep copy defaults to ensure clean state
    const defaultAccounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
    const defaultCategories = [...DEFAULT_CATEGORIES];

    // Update State - this will trigger the useEffect to save to localStorage
    setAccounts(defaultAccounts);
    setTransactions([]);
    setCategories(defaultCategories);
    setLiabilities([]);
    setReceivables([]);
    
    // Explicitly save to storage as well to ensure persistence immediately
    // This is redundant with useEffect but adds a layer of safety against race conditions during rapid state changes
    storage.accounts.save(defaultAccounts);
    storage.transactions.save([]);
    storage.categories.save(defaultCategories);
    storage.liabilities.save([]);
    storage.receivables.save([]);
  }, []);

  const importData = useCallback((jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);
        
        // Basic validation
        if (!Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
            console.error("Invalid data format: Missing accounts or transactions array.");
            return false;
        }

        const newCategories = Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES;
        const newLiabilities = Array.isArray(data.liabilities) ? data.liabilities.map((l: any) => ({
            ...l,
            name: l.name || l.title || 'Untitled Liability',
            description: l.description || ''
        })) : [];
        const newReceivables = Array.isArray(data.receivables) ? data.receivables : [];

        // Update State
        setAccounts(data.accounts);
        setTransactions(data.transactions);
        setCategories(newCategories);
        setLiabilities(newLiabilities);
        setReceivables(newReceivables);
        
        if (data.currency) {
            setCurrencyState(data.currency);
        }

        // Explicit save
        storage.accounts.save(data.accounts);
        storage.transactions.save(data.transactions);
        storage.categories.save(newCategories);
        storage.liabilities.save(newLiabilities);
        storage.receivables.save(newReceivables);
        if (data.currency) storage.currency.save(data.currency);

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
    getAccountBalance,
    totalNetWorth,
    isTransactionModalOpen,
    setTransactionModalOpen,
    currency,
    setCurrency,
    formatCurrency,
    resetData,
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