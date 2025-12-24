import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const TransactionModal: React.FC = () => {
  const { 
    isTransactionModalOpen, 
    setTransactionModalOpen, 
    addTransaction, 
    accounts, 
    categories 
  } = useFinance();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Reset and set defaults when modal opens
  useEffect(() => {
    if (isTransactionModalOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAmount('');
      setDescription('');
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) setToAccountId(accounts[1].id);
      }
      if (categories.length > 0) {
        setCategory(categories[0]);
      }
    }
  }, [isTransactionModalOpen, accounts, categories]);

  if (!isTransactionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
        alert("Please create an account first.");
        return;
    }

    addTransaction({
        date: new Date(date).toISOString(),
        amount: Number(amount),
        type,
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        category: type === 'TRANSFER' ? 'Transfer' : category,
        description
    });
    setTransactionModalOpen(false);
  };

  // Helper to render account options with hierarchy
  const AccountOptions = ({ excludeId }: { excludeId?: string }) => {
    const roots = accounts.filter(a => !a.parentAccountId);
    const options: React.ReactNode[] = [];

    const renderOptions = (accs: typeof accounts, depth = 0) => {
        accs.forEach(acc => {
            if (acc.id !== excludeId) {
                options.push(
                    <option key={acc.id} value={acc.id}>
                        {'\u00A0'.repeat(depth * 4)}{acc.name}
                    </option>
                );
            }
            const children = accounts.filter(child => child.parentAccountId === acc.id);
            if (children.length > 0) {
                renderOptions(children, depth + 1);
            }
        });
    };
    renderOptions(roots);
    return <>{options}</>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Record Transaction</h3>
            <button onClick={() => setTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setType(tab)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            type === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {type !== 'TRANSFER' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {type === 'INCOME' ? 'To Account' : 'From Account'}
                </label>
                <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <AccountOptions />
                </select>
            </div>

            {type === 'TRANSFER' && (
                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To Account</label>
                    <select
                        value={toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                            <AccountOptions excludeId={accountId} />
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="What was this for?"
                />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={() => setTransactionModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                    Save
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
