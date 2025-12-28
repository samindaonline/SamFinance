import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Account, Transaction, Liability, Receivable, BudgetProject, FinanceContextType } from '../types';
import { storage } from '../utils/storage';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, CURRENCIES } from '../constants';
import { addMonths, format, getDaysInMonth, setDate, isValid } from 'date-fns';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Robust ID Generator Helper
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available (e.g. non-secure contexts)
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

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
  
  // Guard to prevent auto-save from overwriting reset/import actions during state transitions
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

  // Save changes - Only runs if NOT resetting/importing
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
      id: generateId()
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
      id: generateId()
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
      id: generateId(),
      status: 'PENDING'
    };
    setLiabilities(prev => [...prev, newLiability]);
  };

  const toggleLiabilityStatus = (id: string) => {
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, status: l.status === 'PENDING' ? 'PAID' : 'PENDING' } : l));
  };

  const payLiability = (id: string) => {
      const item = liabilities.find(l => l.id === id);
      if (!item) {
          console.error("Liability item not found:", id);
          return;
      }

      // 1. Create Transaction (Expense)
      const newTx: Transaction = {
          id: generateId(),
          date: new Date().toISOString(),
          amount: item.amount,
          type: 'EXPENSE',
          accountId: item.paymentAccountId,
          tags: ['Bill', 'Liability'],
          description: `Bill Payment: ${item.name}`
      };

      // Update transactions
      setTransactions(prev => [newTx, ...prev]);

      // 2. Mark as Paid
      setLiabilities(prev => prev.map(l => l.id === id ? { ...l, status: 'PAID' } : l));
  };

  const deleteLiability = (id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  const addReceivable = (receivable: Omit<Receivable, 'id' | 'status'>) => {
    const newReceivable: Receivable = {
      ...receivable,
      id: generateId(),
      status: 'PENDING'
    };
    setReceivables(prev => [...prev, newReceivable]);
  };

  const updateReceivable = (id: string, updates: Partial<Receivable>) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const toggleReceivableStatus = (id: string) => {
      // Legacy simple toggle - might still be used for undoing 'received' status in history
      setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'PENDING' ? 'RECEIVED' : 'PENDING' } : r));
  };

  const receiveIncome = (id: string) => {
      // Find the item within the current state to ensure valid reference
      const item = receivables.find(r => r.id === id);
      if (!item) {
          console.error("Receivable item not found:", id);
          return;
      }

      // 1. Create Transaction (For BOTH One-time and Recurring)
      const newTx: Transaction = {
          id: generateId(),
          date: new Date().toISOString(), // Current date/time
          amount: item.amount,
          type: 'INCOME',
          accountId: item.targetAccountId,
          tags: ['Income', item.type === 'RECURRING' ? 'Recurring' : 'One-time'],
          description: `Income: ${item.name}`
      };
      
      // Update transaction state
      setTransactions(prev => [newTx, ...prev]);

      // 2. Update Receivable Status logic
      if (item.type === 'ONE_TIME') {
          // One-time: Move to Received History
          setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: 'RECEIVED' } : r));
      } else {
          // Recurring: 
          // 1. Keep as PENDING (Do not move to received list).
          // 2. Advance the expectedDate to next month, preserving the Day of Month preference.
          
          let nextDate: Date;
          try {
              // Parse as local time to avoid timezone shifts
              const currentExpected = new Date(item.expectedDate + (item.expectedDate.length === 10 ? 'T00:00:00' : ''));
              
              if (!isValid(currentExpected)) {
                   console.error("Invalid expected date in receivable:", item.expectedDate);
                   // Fallback to today if corrupt
                   nextDate = addMonths(new Date(), 1); 
              } else {
                   nextDate = addMonths(currentExpected, 1);
              }

              // If we have a preferred recurring day, enforce it on the next month
              if (item.recurringDay) {
                  const daysInNextMonth = getDaysInMonth(nextDate);
                  // Clamp to the last day of the month if recurringDay (e.g. 31) exceeds it (e.g. Feb 28)
                  const targetDay = Math.min(item.recurringDay, daysInNextMonth);
                  nextDate = setDate(nextDate, targetDay);
              }
          } catch (error) {
              console.error("Error calculating next recurring date:", error);
              // Fallback for safety
              nextDate = addMonths(new Date(), 1);
          }
          
          const nextDateStr = format(nextDate, 'yyyy-MM-dd');

          setReceivables(prev => prev.map(r => r.id === id ? { 
              ...r, 
              status: 'PENDING', // Force pending
              expectedDate: nextDateStr 
          } : r));
      }
  };

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
  };

  const addBudgetProject = (name: string) => {
    const newProject: BudgetProject = {
        id: generateId(),
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

  const importData = useCallback((jsonString: string): { success: boolean, message: string } => {
    try {
        let data: any;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            return { success: false, message: "Invalid JSON format." };
        }
        
        if (!data || typeof data !== 'object') {
            return { success: false, message: "Data must be a JSON object." };
        }

        // 1. Lock the auto-save mechanism
        isResetting.current = true;

        const stats = {
            accounts: 0,
            transactions: 0,
            categories: 0,
            liabilities: 0,
            receivables: 0,
            projects: 0
        };

        // 2. Generic Merge Helper (UPSERT Strategy)
        // If item exists (by ID), it is UPDATED. If not, it is INSERTED.
        const mergeEntity = <T extends { id: string }>(
            current: T[], 
            incoming: any[], 
            entityName: keyof typeof stats, 
            validator: (item: any) => boolean, 
            migrator?: (item: any) => T
        ) => {
            if (!Array.isArray(incoming)) return current;
            
            // Map for O(1) access and updates
            const mergedMap = new Map<string, T>();
            
            // Populate with current items
            current.forEach(item => mergedMap.set(item.id, item));

            incoming.forEach(item => {
                if (!item || typeof item !== 'object') return;
                
                // Migrate if needed (e.g. legacy transactions)
                let processedItem = migrator ? migrator(item) : item as T;
                
                // If ID is missing, generate one (helps with manually created JSON)
                if (!processedItem.id) {
                    processedItem = { ...processedItem, id: generateId() };
                }
                
                // Validate required fields
                if (!validator(processedItem)) return;

                // Check if it's new for stats counting
                if (!mergedMap.has(processedItem.id)) {
                    stats[entityName]++;
                }
                
                // Set item (Upsert)
                mergedMap.set(processedItem.id, processedItem);
            });
            
            return Array.from(mergedMap.values());
        };

        // 3. Process Entities
        
        // Accounts
        const newAccounts = mergeEntity(
            accounts, 
            data.accounts, 
            'accounts', 
            (i) => !!i.name, // Validator
            undefined 
        );

        // Transactions (Handle legacy tags/category)
        const newTransactions = mergeEntity(
            transactions,
            data.transactions,
            'transactions',
            (i) => !!i.amount && !!i.date,
            (t: any) => ({
                ...t,
                tags: Array.isArray(t.tags) ? t.tags : (t.category ? [t.category] : [])
            })
        );

        // Categories (Simple string array merge)
        const currentCatSet = new Set<string>(categories);
        const incomingCats = Array.isArray(data.categories) ? data.categories : [];
        incomingCats.forEach((c: any) => {
            if (typeof c === 'string' && !currentCatSet.has(c)) {
                currentCatSet.add(c);
                stats.categories++;
            }
        });
        const newCategories = Array.from(currentCatSet).sort();

        // Liabilities
        const newLiabilities = mergeEntity(
            liabilities,
            data.liabilities,
            'liabilities',
            (i) => !!i.amount,
            (l: any) => ({
                ...l,
                name: l.name || l.title || 'Untitled',
                description: l.description || ''
            })
        );

        // Receivables
        const newReceivables = mergeEntity(
            receivables,
            data.receivables,
            'receivables',
            (i) => !!i.amount,
            undefined
        );

        // Budgets
        const newBudgets = mergeEntity(
            budgetProjects,
            data.budgetProjects,
            'projects',
            (i) => !!i.name,
            undefined
        );
        
        // Note: Currency setting is NOT overwritten to preserve user preference

        // 4. Update Storage IMMEDIATELY
        storage.accounts.save(newAccounts);
        storage.transactions.save(newTransactions);
        storage.categories.save(newCategories);
        storage.liabilities.save(newLiabilities);
        storage.receivables.save(newReceivables);
        storage.budgets.save(newBudgets);

        // 5. Update State (Soft Refresh)
        setAccounts(newAccounts);
        setTransactions(newTransactions);
        setCategories(newCategories);
        setLiabilities(newLiabilities);
        setReceivables(newReceivables);
        setBudgetProjects(newBudgets);

        // 6. Release lock after state settles
        setTimeout(() => {
            isResetting.current = false;
        }, 800);
        
        const successMessage = `Import completed.\n\nMerged:\n• ${stats.accounts} New Accounts\n• ${stats.transactions} New Transactions\n• ${stats.categories} New Categories\n• ${stats.liabilities} New Liabilities\n• ${stats.receivables} New Receivables\n• ${stats.projects} New Forecasts`;
        
        return { success: true, message: successMessage };
    } catch (error) {
        console.error("Failed to parse import data", error);
        return { success: false, message: "An unexpected error occurred during import." };
    }
  }, [accounts, transactions, categories, liabilities, receivables, budgetProjects]);

  const resetData = useCallback(() => {
    // 1. Lock the auto-save mechanism
    isResetting.current = true;
    
    // 2. Overwrite storage with Defaults
    storage.accounts.save(DEFAULT_ACCOUNTS);
    storage.transactions.save([]);
    storage.categories.save(DEFAULT_CATEGORIES);
    storage.liabilities.save([]);
    storage.receivables.save([]);
    storage.budgets.save([]);
    storage.currency.save('LKR');

    // 3. Update State (Soft Reset) - No Page Reload needed
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setLiabilities([]);
    setReceivables([]);
    setBudgetProjects([]);
    setCurrencyState('LKR');

    // 4. Release lock after state settles
    setTimeout(() => {
        isResetting.current = false;
    }, 500);
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
    payLiability,
    deleteLiability,
    addReceivable,
    updateReceivable,
    toggleReceivableStatus,
    receiveIncome,
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
    importData,
    resetData
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