import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions, accounts, deleteTransaction, setTransactionModalOpen, formatCurrency } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
           <p className="text-slate-500 text-sm">Record your expenses, income, and transfers.</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-10 md:static">
          <div className="flex items-center space-x-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm backdrop-blur-xl bg-white/90">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-slate-700 placeholder-slate-400 bg-transparent text-sm md:text-base"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-1 rounded-full bg-slate-100 text-slate-400">
                    <span className="sr-only">Clear</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
            <Filter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category / Tags</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(t => {
                        const acc = accounts.find(a => a.id === t.accountId);
                        const accParent = acc?.parentAccountId ? accounts.find(p => p.id === acc.parentAccountId) : null;
                        
                        const toAcc = accounts.find(a => a.id === t.toAccountId);
                        const toAccParent = toAcc?.parentAccountId ? accounts.find(p => p.id === toAcc.parentAccountId) : null;

                        const formatAccName = (a?: typeof acc, p?: typeof accParent) => {
                            if (!a) return 'Unknown';
                            return p ? `${p.name} / ${a.name}` : a.name;
                        };

                        return (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                    {format(new Date(t.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                            t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                                            t.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {t.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4"/> : 
                                             t.type === 'EXPENSE' ? <ArrowDownRight className="w-4 h-4"/> : 
                                             <ArrowRightLeft className="w-4 h-4"/>}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{t.description || (t.tags.length > 0 ? t.tags[0] : 'Uncategorized')}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {t.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {t.type === 'TRANSFER' ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">From: <span className="text-slate-600">{formatAccName(acc, accParent)}</span></span>
                                            <span className="text-xs text-slate-400">To: <span className="text-slate-600">{formatAccName(toAcc, toAccParent)}</span></span>
                                        </div>
                                    ) : (
                                        formatAccName(acc, accParent)
                                    )}
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right ${
                                    t.type === 'INCOME' ? 'text-emerald-600' : 
                                    t.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-700'
                                }`}>
                                    {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}
                                    {formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-100 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.map(t => {
            const acc = accounts.find(a => a.id === t.accountId);
            const toAcc = accounts.find(a => a.id === t.toAccountId);

            return (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                             <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                                t.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5"/> : 
                                 t.type === 'EXPENSE' ? <ArrowDownRight className="w-5 h-5"/> : 
                                 <ArrowRightLeft className="w-5 h-5"/>}
                            </span>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm line-clamp-1">{t.description || "No description"}</p>
                                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(t.date), 'MMM dd')}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-base font-bold ${
                                t.type === 'INCOME' ? 'text-emerald-600' : 
                                t.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-700'
                            }`}>
                                {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}
                                {formatCurrency(t.amount)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> Account</span>
                            <span className="font-medium text-slate-700 truncate max-w-[150px]">{acc?.name}</span>
                        </div>
                        {t.type === 'TRANSFER' && (
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3"/> To</span>
                                <span className="font-medium text-slate-700 truncate max-w-[150px]">{toAcc?.name}</span>
                            </div>
                        )}
                        {t.tags.length > 0 && (
                             <div className="flex justify-between items-start pt-1 border-t border-slate-100 mt-1">
                                <span className="text-slate-500 flex items-center gap-1 mt-0.5"><Tag className="w-3 h-3"/> Tags</span>
                                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                    {t.tags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button 
                            onClick={() => deleteTransaction(t.id)} 
                            className="flex items-center text-rose-500 text-xs font-medium px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Delete
                        </button>
                    </div>
                </div>
            );
        })}
        {filteredTransactions.length === 0 && (
             <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                 No transactions found.
             </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;