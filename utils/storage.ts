const STORAGE_KEY_ACCOUNTS = 'ls_accounts';
const STORAGE_KEY_TRANSACTIONS = 'ls_transactions';
const STORAGE_KEY_CATEGORIES = 'ls_categories';
const STORAGE_KEY_CURRENCY = 'ls_currency';
const STORAGE_KEY_LIABILITIES = 'ls_liabilities';
const STORAGE_KEY_RECEIVABLES = 'ls_receivables';

export const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to local storage', error);
  }
};

export const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from local storage', error);
    return defaultValue;
  }
};

export const storage = {
  accounts: {
    save: (data: any[]) => saveToStorage(STORAGE_KEY_ACCOUNTS, data),
    load: (defaultValue: any[]) => loadFromStorage(STORAGE_KEY_ACCOUNTS, defaultValue)
  },
  transactions: {
    save: (data: any[]) => saveToStorage(STORAGE_KEY_TRANSACTIONS, data),
    load: (defaultValue: any[]) => loadFromStorage(STORAGE_KEY_TRANSACTIONS, defaultValue)
  },
  categories: {
    save: (data: string[]) => saveToStorage(STORAGE_KEY_CATEGORIES, data),
    load: (defaultValue: string[]) => loadFromStorage(STORAGE_KEY_CATEGORIES, defaultValue)
  },
  currency: {
    save: (data: string) => saveToStorage(STORAGE_KEY_CURRENCY, data),
    load: (defaultValue: string) => loadFromStorage(STORAGE_KEY_CURRENCY, defaultValue)
  },
  liabilities: {
    save: (data: any[]) => saveToStorage(STORAGE_KEY_LIABILITIES, data),
    load: (defaultValue: any[]) => loadFromStorage(STORAGE_KEY_LIABILITIES, defaultValue)
  },
  receivables: {
    save: (data: any[]) => saveToStorage(STORAGE_KEY_RECEIVABLES, data),
    load: (defaultValue: any[]) => loadFromStorage(STORAGE_KEY_RECEIVABLES, defaultValue)
  }
};