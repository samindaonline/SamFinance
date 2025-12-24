import { Account } from './types';

export const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
  '#14b8a6', // teal
];

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Personal Care',
  'Entertainment',
  'Shopping',
  'Education',
  'Debt',
  'Savings',
  'Salary',
  'Business',
  'Gift',
  'Other'
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'Main Bank Account',
    type: 'BANK',
    initialBalance: 0,
    color: '#3b82f6',
    includeInNetWorth: true
  },
  {
    id: 'acc_2',
    name: 'Wallet',
    type: 'CASH',
    initialBalance: 0,
    color: '#10b981',
    includeInNetWorth: true
  }
];

export const CURRENCIES = [
  { code: 'LKR', symbol: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'United Arab Emirates Dirham' },
];