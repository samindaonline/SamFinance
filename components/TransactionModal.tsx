import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, Account } from '../types';
import { format } from 'date-fns';
import { X, Plus, ChevronDown, Search, Check, Building, Wallet, User, Landmark, CreditCard, Layers } from 'lucide-react';
import DatePicker from './DatePicker';

// --- Helper Components & Constants for Custom Select ---

const getAccountIcon = (type: string) => {
    switch (type) {
        case 'BANK': return <Building className="w-4 h-4" />;
        case 'CASH': return <Wallet className="w-4 h-4" />;
        case 'STAKEHOLDER': return <User className="w-4 h-4" />;
        case 'ASSET': return <Landmark className="w-4 h-4" />;
        case 'LIABILITY': return <CreditCard className="w-4 h-4" />;
        default: return <Wallet className="w-4 h-4" />;
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'BANK': return 'Bank Accounts';
        case 'CASH': return 'Cash & Wallets';
        case 'STAKEHOLDER': return 'Stakeholders';
        case 'ASSET': return 'Assets';
        case 'LIABILITY': return 'Liabilities';
        default: return 'Other Accounts';
    }
};

interface AccountSelectProps {
    label: string;
    accounts: Account[];
    selectedId: string;
    onChange: (id: string) => void;
    excludeId?: string;
}

const AccountSelect: React.FC<AccountSelectProps> = ({ label, accounts, selectedId, onChange, excludeId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedAccount = accounts.find(a => a.id === selectedId);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter and Group Accounts
    const groupedAccounts = useMemo(() => {
        const filtered = accounts.filter(a => 
            a.id !== excludeId && 
            a.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups: Record<string, Account[]> = {};
        const typeOrder = ['BANK', 'CASH', 'LIABILITY', 'ASSET', 'STAKEHOLDER', 'OTHER'];
        
        filtered.forEach(acc => {
            if (!groups[acc.type]) groups[acc.type] = [];
            groups[acc.type].push(acc);
        });

        return typeOrder
            .filter(type => groups[type] && groups[type].length > 0)
            .map(type => ({
                type,
                label: getTypeLabel(type),
                items: groups[type]
            }));
    }, [accounts, excludeId, searchTerm]);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl flex items-center justify-between transition-all outline-none active:scale-[0.99] duration-100 ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-300'}`}
            >
                {selectedAccount ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-transform duration-300" style={{ backgroundColor: selectedAccount.color }}>
                            {getAccountIcon(selectedAccount.type)}
                        </div>
                        <span className="text-slate-800 font-medium truncate">{selectedAccount.name}</span>
                        {selectedAccount.parentAccountId && (
                             <span className="text-xs text-slate-400 truncate hidden sm:inline">
                                (Sub-account)
                             </span>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-400">Select an account...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl animate-zoom-in overflow-hidden flex flex-col max-h-[300px]">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {groupedAccounts.length > 0 ? (
                            groupedAccounts.map(group => (
                                <div key={group.type}>
                                    <div className="px-3 py-1.5 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                        {group.label}
                                    </div>
                                    {group.items.map(acc => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(acc.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group ${
                                                selectedId === acc.id ? 'bg-blue-50/50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div 
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200" 
                                                    style={{ backgroundColor: acc.color }}
                                                >
                                                    {getAccountIcon(acc.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className={`text-sm font-medium truncate ${selectedId === acc.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                        {acc.name}
                                                    </div>
                                                    {acc.parentAccountId && (
                                                        <div className="text-[10px] text-slate-400 flex items-center">
                                                            <Layers className="w-3 h-3 mr-1" /> Sub-account
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedId === acc.id && (
                                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 animate-zoom-in" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                                <Search className="w-8 h-8 text-slate-300 mb-2" />
                                No accounts found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const TransactionModal: React.FC = () => {
  const { 
    isTransactionModalOpen, 
    setTransactionModalOpen, 
    addTransaction, 
    accounts, 
    categories,
    addCategory
  } = useFinance();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Animation State
  const [isVisible, setIsVisible] = useState(false);

  // Handle open/close animation lifecycle
  useEffect(() => {
    if (isTransactionModalOpen) {
      setIsVisible(true);
      // Reset form when opening
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAmount('');
      setDescription('');
      setSelectedTags([]);
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        const dest = accounts.find(a => a.id !== accounts[0].id);
        if (dest) setToAccountId(dest.id);
      }
    } else {
        // Delay hiding until animation completes
        const timer = setTimeout(() => setIsVisible(false), 200); 
        return () => clearTimeout(timer);
    }
  }, [isTransactionModalOpen, accounts]);

  if (!isVisible && !isTransactionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
        alert("Please select an account.");
        return;
    }

    if (type === 'TRANSFER' && !toAccountId) {
        alert("Please select a destination account for the transfer.");
        return;
    }

    addTransaction({
        date: new Date(date).toISOString(),
        amount: Number(amount),
        type,
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        tags: type === 'TRANSFER' ? ['Transfer'] : selectedTags,
        description
    });
    setTransactionModalOpen(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newTagInput.trim()) {
          addCategory(newTagInput.trim());
          toggleTag(newTagInput.trim());
          setNewTagInput('');
      }
  }

  const backdropClass = isTransactionModalOpen ? 'animate-fade-in' : 'animate-fade-out';
  const modalClass = isTransactionModalOpen ? 'animate-zoom-in' : 'animate-zoom-out';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6`}>
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm ${backdropClass}`} onClick={() => setTransactionModalOpen(false)} />
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] z-10 relative ${modalClass}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-xl font-bold text-slate-800">Record Transaction</h3>
            <button 
                onClick={() => setTransactionModalOpen(false)} 
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors active:scale-90 duration-200"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        {/* Scrollable Form Body */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex-1">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selector */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                    {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setType(tab)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                                type === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <DatePicker
                            label="Date"
                            value={date}
                            onChange={setDate}
                            required
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
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-300 focus:shadow-sm"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Custom Account Selector - Source */}
                <div className="animate-fade-in">
                    <AccountSelect 
                        label={type === 'INCOME' ? 'To Account' : 'From Account'}
                        accounts={accounts}
                        selectedId={accountId}
                        onChange={setAccountId}
                    />
                </div>

                {/* Custom Account Selector - Destination (Transfer only) */}
                {type === 'TRANSFER' && (
                    <div className="animate-fade-in">
                        <AccountSelect 
                            label="To Account"
                            accounts={accounts}
                            selectedId={toAccountId}
                            onChange={setToAccountId}
                            excludeId={accountId}
                        />
                    </div>
                )}

                {type !== 'TRANSFER' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Multiple)</label>
                        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[100px] flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleTag(cat)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                                            selectedTags.includes(cat)
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <input 
                                    type="text"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    placeholder="New tag..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white transition-colors"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddNewTag}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm transition-colors active:scale-95 duration-200"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-300 focus:shadow-sm"
                        placeholder="What was this for?"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setTransactionModalOpen(false)}
                        className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors active:scale-95 duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 duration-200"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;