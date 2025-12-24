import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

const Transactions: React.FC = () => {
  const { transactions, accounts, deleteTransaction, setTransactionModalOpen, formatCurrency } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
           <p className="text-slate-500">Record your expenses, income, and transfers.</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-slate-700 placeholder-slate-400"
        />
        <Filter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
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
                                            <p className="text-sm font-medium text-slate-800">{t.description || t.category}</p>
                                            <p className="text-xs text-slate-500">{t.category}</p>
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
                                    <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                No transactions found matching your criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
