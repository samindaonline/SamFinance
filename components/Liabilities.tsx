import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Check, Clock, Calendar, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import DatePicker from './DatePicker';

const Liabilities: React.FC = () => {
  const { liabilities, accounts, addLiability, toggleLiabilityStatus, deleteLiability, formatCurrency } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAccountId) {
        addLiability({
            name,
            description,
            amount: Number(amount),
            dueDate,
            paymentAccountId
        });
        resetForm();
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAmount('');
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentAccountId('');
    setIsAdding(false);
  };

  const parseDate = (str: string) => {
      // Parses YYYY-MM-DD to local date
      if (str.length === 10) return new Date(str + 'T00:00:00');
      return new Date(str);
  };

  const pendingLiabilities = liabilities.filter(l => l.status === 'PENDING').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paidLiabilities = liabilities.filter(l => l.status === 'PAID').sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const getDueDateColor = (dateStr: string) => {
      const date = parseDate(dateStr);
      if (isPast(date) && !isToday(date)) return 'text-rose-600 bg-rose-50 border-rose-100';
      if (isToday(date)) return 'text-amber-600 bg-amber-50 border-amber-100';
      return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const getDueDateLabel = (dateStr: string) => {
      const date = parseDate(dateStr);
      if (isPast(date) && !isToday(date)) return 'Overdue';
      if (isToday(date)) return 'Due Today';
      return format(date, 'MMM dd');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Liabilities & Bills</h2>
           <p className="text-slate-500 text-sm">Track upcoming payments and debts without affecting your net worth.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Liability
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Liability</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Liability Name</label>
                          <input 
                            required
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Credit Card Bill"
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                          <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Details about this payment..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                          <input 
                            required
                            type="number" 
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <DatePicker 
                            label="Due Date"
                            value={dueDate}
                            onChange={setDueDate}
                            required
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Source (Account)</label>
                          <select 
                            required
                            value={paymentAccountId}
                            onChange={e => setPaymentAccountId(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          >
                              <option value="">Select Account...</option>
                              {accounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={resetForm}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
                      >
                          Save Liability
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* Pending List */}
      <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending
          </h3>
          <div className="space-y-3">
              {pendingLiabilities.length > 0 ? (
                  pendingLiabilities.map(liability => {
                      const account = accounts.find(a => a.id === liability.paymentAccountId);
                      const isOverdue = isPast(parseDate(liability.dueDate)) && !isToday(parseDate(liability.dueDate));
                      
                      return (
                        <div key={liability.id} className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md ${isOverdue ? 'border-rose-200 shadow-rose-100' : 'border-slate-200 shadow-sm'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${getDueDateColor(liability.dueDate)} flex-shrink-0`}>
                                        <span className="text-xs font-bold uppercase">{parseDate(liability.dueDate).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-bold">{parseDate(liability.dueDate).getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{liability.name}</h4>
                                        {liability.description && (
                                            <p className="text-sm text-slate-500 mb-1">{liability.description}</p>
                                        )}
                                        <div className="flex items-center text-sm text-slate-500 mt-1">
                                            <span>Pay via:</span>
                                            <span className="ml-1 font-medium text-slate-700 flex items-center">
                                                {account ? (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: account.color}} />
                                                        {account.name}
                                                    </>
                                                ) : 'Unknown Account'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-[72px] sm:pl-0">
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-800">{formatCurrency(liability.amount)}</div>
                                        <div className={`text-xs font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {getDueDateLabel(liability.dueDate)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => toggleLiabilityStatus(liability.id)}
                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Mark as Paid"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => { if(confirm('Delete this liability?')) deleteLiability(liability.id); }}
                                            className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                      );
                  })
              ) : (
                  <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">No pending liabilities. You're all clear!</p>
                  </div>
              )}
          </div>
      </div>

      {/* Paid List */}
      {paidLiabilities.length > 0 && (
          <div className="pt-6">
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2 opacity-75">
                  <Check className="w-5 h-5 text-emerald-500" />
                  Paid History
              </h3>
              <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                  {paidLiabilities.map(liability => {
                       const account = accounts.find(a => a.id === liability.paymentAccountId);
                       return (
                        <div key={liability.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 decoration-slate-400 line-through decoration-2">{liability.name}</h4>
                                    <div className="text-xs text-slate-400">
                                        Due: {format(parseDate(liability.dueDate), 'MMM dd, yyyy')} • {account?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-500">{formatCurrency(liability.amount)}</span>
                                <button 
                                    onClick={() => toggleLiabilityStatus(liability.id)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Undo
                                </button>
                                <button 
                                    onClick={() => deleteLiability(liability.id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                       );
                  })}
              </div>
          </div>
      )}
    </div>
  );
};

export default Liabilities;