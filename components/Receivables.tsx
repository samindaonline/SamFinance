import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Minus, Check, Clock, Edit2, X, Info, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import { format, isPast, isToday, addMonths } from 'date-fns';
import { Receivable } from '../types';
import DatePicker from './DatePicker';
import HelpModal from './HelpModal';

const Receivables: React.FC = () => {
  const { receivables, accounts, addReceivable, updateReceivable, receiveIncome, toggleReceivableStatus, deleteReceivable, formatCurrency } = useFinance();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Animation Handling
  useEffect(() => {
      if(isAdding) setIsModalVisible(true);
      else setTimeout(() => setIsModalVisible(false), 300);
  }, [isAdding]);

  // Form State
  const [type, setType] = useState<Receivable['type']>('ONE_TIME');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurringDay, setRecurringDay] = useState(1);
  const [targetAccountId, setTargetAccountId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAccountId) {
        
        // Calculate a valid 'expectedDate' for recurring items for backward compatibility with Dashboard/Forecasts
        let finalExpectedDate = expectedDate;
        if (type === 'RECURRING') {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0-11
            
            // Create a date for this month with the selected day
            let nextDate = new Date(currentYear, currentMonth, recurringDay);
            
            // If that date is in the past (e.g. today is 20th, recurring is 5th), move to next month
            if (isPast(nextDate) && !isToday(nextDate)) {
                 nextDate = addMonths(nextDate, 1);
            }
            finalExpectedDate = format(nextDate, 'yyyy-MM-dd');
        }

        const payload = {
            name,
            description,
            amount: Number(amount),
            type,
            targetAccountId,
            expectedDate: finalExpectedDate,
            recurringDay: type === 'RECURRING' ? Number(recurringDay) : undefined,
            recurringEndDate: undefined
        };

        if (editingId) {
             updateReceivable(editingId, payload);
        } else {
            addReceivable(payload);
        }
        resetForm();
    }
  };

  const handleEdit = (receivable: Receivable) => {
    setEditingId(receivable.id);
    setName(receivable.name);
    setDescription(receivable.description);
    setAmount(receivable.amount.toString());
    setTargetAccountId(receivable.targetAccountId);
    setType(receivable.type);
    
    if (receivable.type === 'RECURRING') {
        setRecurringDay(receivable.recurringDay || 1);
    } else {
        setExpectedDate(receivable.expectedDate);
    }
    
    setIsAdding(true);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          deleteReceivable(deleteId);
          setDeleteId(null);
      }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAmount('');
    setExpectedDate(format(new Date(), 'yyyy-MM-dd'));
    setRecurringDay(1);
    setTargetAccountId('');
    setType('ONE_TIME');
    setEditingId(null);
    setIsAdding(false);
  };

  const parseDate = (str: string) => {
      if (str.length === 10) return new Date(str + 'T00:00:00');
      return new Date(str);
  };

  const pendingReceivables = receivables.filter(r => r.status === 'PENDING').sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
  const receivedReceivables = receivables.filter(r => r.status === 'RECEIVED').sort((a, b) => new Date(b.expectedDate).getTime() - new Date(a.expectedDate).getTime());

  const getDateColor = (receivable: Receivable) => {
      if (receivable.type === 'RECURRING') {
          return 'text-blue-600 bg-blue-50 border-blue-100';
      }
      const date = parseDate(receivable.expectedDate);
      if (isPast(date) && !isToday(date)) return 'text-amber-600 bg-amber-50 border-amber-100';
      if (isToday(date)) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const getDateLabel = (receivable: Receivable) => {
      if (receivable.type === 'RECURRING') {
          return `${t('recurring_every')} ${receivable.recurringDay}`;
      }
      const date = parseDate(receivable.expectedDate);
      if (isPast(date) && !isToday(date)) return t('overdue');
      if (isToday(date)) return t('expected_today');
      return format(date, 'MMM dd');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div className="flex items-start gap-3">
           <div>
               <h2 className="text-2xl font-bold text-slate-800">{t('rec_title')}</h2>
               <p className="text-slate-500 text-sm">{t('rec_subtitle')}</p>
           </div>
           <button 
                onClick={() => setShowHelp(true)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mt-1"
                title="Help Guide"
            >
                <Info className="w-5 h-5" />
            </button>
        </div>
        <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
        >
            <Plus className="w-5 h-5 mr-2" />
            {t('add_rec')}
        </button>
      </div>

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        titleKey="help_rec_title"
        contentKey="help_rec_steps"
      />

      {/* Add/Edit Modal */}
      {(isModalVisible || isAdding) && createPortal(
          <div className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 transition-all duration-200`}>
              <div 
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isAdding ? 'opacity-100' : 'opacity-0'}`}
                onClick={resetForm}
              />
              
              <div className={`bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] z-10 relative transform transition-all duration-300 ease-out ${isAdding ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full md:translate-y-0 md:scale-95 opacity-0'}`}>
                  {/* Fixed Header */}
                  <div className="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
                      <h3 className="text-xl font-bold text-slate-800">{editingId ? t('edit_income') : t('add_income')}</h3>
                      <button onClick={resetForm} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors active:scale-90 duration-200">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Scrollable Body */}
                  <div className="overflow-y-auto custom-scrollbar p-5 md:p-6 flex-1">
                      <form onSubmit={handleSubmit} className="space-y-5">
                          {/* 1. Type Selection First */}
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('income_type')}</label>
                              <div className="flex bg-slate-100 p-1 rounded-xl">
                                  <button
                                      type="button"
                                      onClick={() => setType('ONE_TIME')}
                                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'ONE_TIME' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      {t('one_time')}
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => setType('RECURRING')}
                                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'RECURRING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      {t('recurring')}
                                  </button>
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('income_name')}</label>
                              <input 
                                required
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Salary, Dividend"
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('amount')}</label>
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

                          {/* Conditional Date Selection */}
                          {type === 'RECURRING' ? (
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('recurring_day')}</label>
                                  <div className="flex items-center gap-3">
                                      <button 
                                        type="button"
                                        onClick={() => setRecurringDay(prev => Math.max(1, prev - 1))}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors active:scale-95"
                                      >
                                          <Minus className="w-5 h-5" />
                                      </button>
                                      
                                      <div className="relative flex-1">
                                          <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={recurringDay}
                                            onChange={e => {
                                                const val = Math.min(31, Math.max(1, Number(e.target.value)));
                                                setRecurringDay(val);
                                            }}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-center"
                                            placeholder="Day"
                                          />
                                      </div>

                                      <button 
                                        type="button"
                                        onClick={() => setRecurringDay(prev => Math.min(31, prev + 1))}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors active:scale-95"
                                      >
                                          <Plus className="w-5 h-5" />
                                      </button>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <DatePicker 
                                    label={t('expected_date')}
                                    value={expectedDate}
                                    onChange={setExpectedDate}
                                    required
                                  />
                              </div>
                          )}

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('target_acc')}</label>
                              <select 
                                required
                                value={targetAccountId}
                                onChange={e => setTargetAccountId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                              >
                                  <option value="">{t('select_acc')}</option>
                                  {accounts.map(acc => (
                                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                                  ))}
                              </select>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">{t('desc')} <span className="text-slate-400 font-normal">(Optional)</span></label>
                              <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Details about this income..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                              />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                              <button 
                                type="button" 
                                onClick={resetForm}
                                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors active:scale-95 duration-200"
                              >
                                  {t('cancel')}
                              </button>
                              <button 
                                type="submit" 
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200 active:scale-95 duration-200"
                              >
                                  {editingId ? t('save_changes') : t('save_income')}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Pending List */}
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              {t('pending_income')}
          </h3>
          <div className="space-y-3">
              {pendingReceivables.length > 0 ? (
                  pendingReceivables.map(receivable => {
                      const account = accounts.find(a => a.id === receivable.targetAccountId);
                      const isOverdue = receivable.type === 'ONE_TIME' && isPast(parseDate(receivable.expectedDate)) && !isToday(parseDate(receivable.expectedDate));
                      
                      return (
                        <div key={receivable.id} className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md ${isOverdue ? 'border-amber-200 shadow-amber-100' : 'border-slate-200 shadow-sm'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${getDateColor(receivable)} flex-shrink-0`}>
                                        {receivable.type === 'RECURRING' ? (
                                             <RefreshCcw className="w-6 h-6" />
                                        ) : (
                                            <>
                                                <span className="text-xs font-bold uppercase">{parseDate(receivable.expectedDate).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-bold">{parseDate(receivable.expectedDate).getDate()}</span>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 text-lg">{receivable.name}</h4>
                                            {receivable.type === 'RECURRING' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 flex items-center">
                                                    {t('recurring')}
                                                </span>
                                            )}
                                        </div>
                                        {receivable.description && (
                                            <p className="text-sm text-slate-500 mb-1">{receivable.description}</p>
                                        )}
                                        <div className="flex items-center text-sm text-slate-500 mt-1">
                                            <span>{t('to')}</span>
                                            <span className="ml-1 font-medium text-slate-700 flex items-center">
                                                {account ? (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: account.color}} />
                                                        {account.name}
                                                    </>
                                                ) : t('unknown')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-[72px] sm:pl-0">
                                    <div className="text-right flex-1 sm:flex-initial min-w-0">
                                        <div className="text-lg sm:text-xl font-bold text-emerald-600 whitespace-nowrap truncate">+{formatCurrency(receivable.amount)}</div>
                                        <div className={`text-xs font-bold ${isOverdue ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {getDateLabel(receivable)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(receivable); }}
                                            className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Instant action - No confirm dialog
                                                receiveIncome(receivable.id);
                                            }}
                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                            title={t('mark_received')}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                handleDeleteClick(receivable.id);
                                            }}
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
                      <p className="text-slate-400 font-medium">{t('no_pending_rec')}</p>
                  </div>
              )}
          </div>
      </div>

      {/* Received List - Only shows One-Time items that were marked received */}
      {receivedReceivables.length > 0 && (
          <div className="pt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2 opacity-75">
                  <Check className="w-5 h-5 text-emerald-500" />
                  {t('received_history')}
              </h3>
              <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                  {receivedReceivables.map(receivable => {
                       const account = accounts.find(a => a.id === receivable.targetAccountId);
                       return (
                        <div key={receivable.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 decoration-slate-400 line-through decoration-2">{receivable.name}</h4>
                                    <div className="text-xs text-slate-400">
                                        Expected: {format(parseDate(receivable.expectedDate), 'MMM dd, yyyy')} • {account?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-emerald-600/70">+{formatCurrency(receivable.amount)}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleReceivableStatus(receivable.id); }}
                                    className="text-xs text-blue-600 hover:underline"
                                    title="Move back to pending (Note: Transaction created earlier remains)"
                                >
                                    {t('undo')}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(receivable.id); }}
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

      {/* Delete Confirmation Modal - Custom implementation to avoid native confirm issues */}
      {deleteId && createPortal(
         <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4`}>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteId(null)} />
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 z-10 relative animate-zoom-in">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Confirm Deletion</h3>
                    <p className="text-slate-600 mt-2">
                        Are you sure you want to remove this income record?
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold transition-colors shadow-lg shadow-rose-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
         </div>,
         document.body
      )}

    </div>
  );
};

export default Receivables;