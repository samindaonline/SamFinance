import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions, accounts, deleteTransaction, setTransactionModalOpen, formatCurrency } = useFinance();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{t('tx_title')}</h2>
           <p className="text-slate-500 text-sm">{t('tx_subtitle')}</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('add_transaction')}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-10 md:static flex-shrink-0">
          <div className="flex items-center space-x-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm backdrop-blur-xl bg-white/90">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
                type="text" 
                placeholder={t('search_tx')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-slate-700 placeholder-slate-400 bg-transparent text-sm md:text-base"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                    <span className="sr-only">Clear</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
          </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t('date')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t('category_tags')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t('account')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">{t('amount')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">{t('action')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(tx => {
                        const acc = accounts.find(a => a.id === tx.accountId);
                        const accParent = acc?.parentAccountId ? accounts.find(p => p.id === acc.parentAccountId) : null;
                        
                        const toAcc = accounts.find(a => a.id === tx.toAccountId);
                        const toAccParent = toAcc?.parentAccountId ? accounts.find(p => p.id === toAcc.parentAccountId) : null;

                        const formatAccName = (a?: typeof acc, p?: typeof accParent) => {
                            if (!a) return t('unknown');
                            return p ? `${p.name} / ${a.name}` : a.name;
                        };

                        return (
                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                    {format(new Date(tx.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                            tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                                            tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4"/> : 
                                             tx.type === 'EXPENSE' ? <ArrowDownRight className="w-4 h-4"/> : 
                                             <ArrowRightLeft className="w-4 h-4"/>}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{tx.description || (tx.tags.length > 0 ? tx.tags[0] : t('uncategorized'))}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {tx.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {tx.type === 'TRANSFER' ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">{t('from')} <span className="text-slate-600 font-medium">{formatAccName(acc, accParent)}</span></span>
                                            <span className="text-xs text-slate-400">{t('to')} <span className="text-slate-600 font-medium">{formatAccName(toAcc, toAccParent)}</span></span>
                                        </div>
                                    ) : (
                                        <span className="font-medium">{formatAccName(acc, accParent)}</span>
                                    )}
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                                    tx.type === 'INCOME' ? 'text-emerald-600' : 
                                    tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-700'
                                }`}>
                                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                    {formatCurrency(tx.amount)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => { if(confirm('Are you sure?')) deleteTransaction(tx.id); }} 
                                        className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title={t('delete_tx')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                {t('no_tx_found')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 pb-safe">
        {filteredTransactions.map(tx => {
            const acc = accounts.find(a => a.id === tx.accountId);
            const toAcc = accounts.find(a => a.id === tx.toAccountId);

            return (
                <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                             <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                                tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {tx.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5"/> : 
                                 tx.type === 'EXPENSE' ? <ArrowDownRight className="w-5 h-5"/> : 
                                 <ArrowRightLeft className="w-5 h-5"/>}
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm line-clamp-1">{tx.description || "No description"}</p>
                                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(tx.date), 'MMM dd')}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                            <span className={`text-base font-bold whitespace-nowrap ${
                                tx.type === 'INCOME' ? 'text-emerald-600' : 
                                tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-700'
                            }`}>
                                {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                {formatCurrency(tx.amount)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> {t('account')}</span>
                            <span className="font-medium text-slate-700 truncate max-w-[150px]">{acc?.name}</span>
                        </div>
                        {tx.type === 'TRANSFER' && (
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3"/> {t('to')}</span>
                                <span className="font-medium text-slate-700 truncate max-w-[150px]">{toAcc?.name}</span>
                            </div>
                        )}
                        {tx.tags.length > 0 && (
                             <div className="flex justify-between items-start pt-1 border-t border-slate-100 mt-1">
                                <span className="text-slate-500 flex items-center gap-1 mt-0.5"><Tag className="w-3 h-3"/> Tags</span>
                                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                    {tx.tags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button 
                            onClick={() => { if(confirm('Delete transaction?')) deleteTransaction(tx.id); }} 
                            className="flex items-center text-rose-500 text-xs font-bold px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            {t('delete')}
                        </button>
                    </div>
                </div>
            );
        })}
        {filteredTransactions.length === 0 && (
             <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                 {t('no_tx_found')}
             </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;