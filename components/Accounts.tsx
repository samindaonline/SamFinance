import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Wallet, User, Building, Edit2, CreditCard, Landmark, Check, AlertTriangle, ChevronDown, Layers, X, AlignLeft } from 'lucide-react';
import { COLORS, DEFAULT_ACCOUNTS } from '../constants';
import { Account } from '../types';

const getIcon = (type: string) => {
  switch (type) {
      case 'BANK': return <Building className="w-5 h-5" />;
      case 'CASH': return <Wallet className="w-5 h-5" />;
      case 'STAKEHOLDER': return <User className="w-5 h-5" />;
      case 'ASSET': return <Landmark className="w-5 h-5" />;
      case 'LIABILITY': return <CreditCard className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
  }
};

interface AccountItemProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  level?: number;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, onEdit, onDelete, level = 0 }) => {
  const { accounts, getAccountBalance, formatCurrency } = useFinance();
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default for accordion effect
  
  const children = accounts.filter(a => a.parentAccountId === account.id);
  const currentBalance = getAccountBalance(account.id);
  const isDefaultAccount = DEFAULT_ACCOUNTS.some(da => da.id === account.id);
  const isRoot = level === 0;

  // --- Root Account Card Layout ---
  if (isRoot) {
     return (
        <div className="group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 mb-4 overflow-hidden">
            {/* Main Header Area */}
            <div 
                className={`flex items-center justify-between p-5 transition-colors ${children.length > 0 ? 'cursor-pointer hover:bg-slate-50' : ''}`} 
                onClick={() => children.length > 0 && setIsExpanded(!isExpanded)}
            >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                     <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: account.color }}
                    >
                        {React.cloneElement(getIcon(account.type), { className: "w-6 h-6" })}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-lg truncate">{account.name}</h3>
                        {account.description && (
                            <p className="text-sm text-slate-500 truncate mb-1">{account.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide border border-slate-200">
                                {account.type}
                            </span>
                            {account.includeInNetWorth === false && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 uppercase">
                                    Excluded
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Balance & Actions */}
                <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
                    <div className="text-right">
                         <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5 hidden sm:block">
                            {children.length > 0 ? 'Total Balance' : 'Current Balance'}
                        </p>
                        <p className={`text-xl md:text-2xl font-bold font-mono tracking-tight ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatCurrency(currentBalance)}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Actions: Visible on Mobile (default), Hidden on Desktop until Hover (group-hover) */}
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                            {!isDefaultAccount && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEdit(account); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Edit"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            )}
                            {!isDefaultAccount && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(account); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Accordion Chevron */}
                        {children.length > 0 && (
                            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-400 p-1`}>
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Children Section (Accordion Body) */}
            {children.length > 0 && (
                <div className={`bg-slate-50/80 border-t border-slate-100 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                     <div className="p-2 md:p-3 space-y-1">
                        {children.map(child => (
                             <AccountItem 
                                key={child.id} 
                                account={child} 
                                onEdit={onEdit} 
                                onDelete={onDelete} 
                                level={level + 1} 
                             />
                        ))}
                     </div>
                </div>
            )}
        </div>
     );
  }

  // --- Child Row Layout ---
  return (
    <div className="group relative pl-4 pr-3 py-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-200">
         {/* Tree Indentation Marker */}
         <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-300/50 rounded-full ml-1" />

         <div 
            className={`flex items-center justify-between ${children.length > 0 ? 'cursor-pointer' : ''}`} 
            onClick={() => children.length > 0 && setIsExpanded(!isExpanded)}
        >
             <div className="flex items-center gap-3 min-w-0 pr-4">
                {/* Expand Toggle for nested sub-children */}
                {children.length > 0 ? (
                     <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-400 p-0.5 hover:bg-slate-200 rounded`}>
                         <ChevronDown className="w-4 h-4" />
                     </div>
                ) : (
                    <div className="w-4 h-4" /> // Spacer
                )}

                <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                >
                     {React.cloneElement(getIcon(account.type), { className: "w-4 h-4" })}
                </div>

                <div className="min-w-0">
                     <div className="font-semibold text-slate-700 text-sm truncate">{account.name}</div>
                     {account.description && (
                         <div className="text-xs text-slate-400 truncate max-w-[200px]">{account.description}</div>
                     )}
                     {children.length > 0 && (
                         <div className="text-[10px] text-slate-400 font-medium">{children.length} sub-accounts</div>
                     )}
                </div>
             </div>

             <div className="flex items-center gap-4 flex-shrink-0">
                 <div className={`font-mono text-sm font-bold text-right ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatCurrency(currentBalance)}
                 </div>

                 {/* Actions: Hover Only on Desktop */}
                 <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    {!isDefaultAccount && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(account); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {!isDefaultAccount && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(account); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
             </div>
         </div>

         {/* Recursive Children for Child Row */}
         {children.length > 0 && isExpanded && (
             <div className="mt-2 ml-3 pl-3 border-l-2 border-slate-200 space-y-1">
                  {children.map(child => (
                        <AccountItem 
                            key={child.id} 
                            account={child} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            level={level + 1} 
                        />
                    ))}
             </div>
         )}
    </div>
  );
};

const Accounts: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, account: Account | null}>({
      isOpen: false,
      account: null
  });
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Account['type']>('BANK');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [parentAccountId, setParentAccountId] = useState('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name,
        description,
        type,
        color,
        initialBalance: Number(initialBalance),
        parentAccountId: parentAccountId || undefined,
        includeInNetWorth
    };

    if (editingId) {
        updateAccount(editingId, payload);
    } else {
        addAccount(payload);
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('BANK');
    setInitialBalance('');
    setColor(COLORS[0]);
    setParentAccountId('');
    setIncludeInNetWorth(true);
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openEdit = (acc: Account) => {
      setEditingId(acc.id);
      setName(acc.name);
      setDescription(acc.description || '');
      setType(acc.type);
      setInitialBalance(acc.initialBalance.toString());
      setColor(acc.color);
      setParentAccountId(acc.parentAccountId || '');
      setIncludeInNetWorth(acc.includeInNetWorth !== false); 
      setIsModalOpen(true);
  };

  const openDelete = (acc: Account) => {
      setDeleteConfirmation({ isOpen: true, account: acc });
  };

  const confirmDelete = () => {
      if (deleteConfirmation.account) {
          deleteAccount(deleteConfirmation.account.id);
          setDeleteConfirmation({ isOpen: false, account: null });
      }
  };

  const rootAccounts = accounts.filter(a => !a.parentAccountId);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Accounts</h2>
           <p className="text-slate-500 mt-1">Manage all your financial buckets in one place.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-semibold active:scale-95 duration-100"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>

      <div className="flex flex-col w-full">
        {rootAccounts.length > 0 ? (
            rootAccounts.map(account => (
                <AccountItem key={account.id} account={account} onEdit={openEdit} onDelete={openDelete} />
            ))
        ) : (
            <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Wallet className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-xl font-bold text-slate-600">No accounts yet</p>
                <p className="text-base mt-2 max-w-sm text-center">Start by adding your bank accounts, cash wallets, or any other assets you want to track.</p>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 text-blue-600 font-bold hover:underline"
                >
                    Create your first account
                </button>
            </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Account' : 'New Account'}</h3>
                <button onClick={resetForm} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white"
                  placeholder="e.g. Chase Checkings"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white resize-none h-20"
                  placeholder="What is this account for?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Account</label>
                <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <select
                        value={parentAccountId}
                        onChange={(e) => setParentAccountId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white appearance-none"
                    >
                        <option value="">No Parent (Top Level)</option>
                        {accounts
                            .filter(a => a.id !== editingId) // Prevent self-parenting
                            .map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Type</label>
                    <div className="relative">
                        <select
                            value={type}
                            onChange={(e: any) => setType(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white appearance-none"
                        >
                            <option value="BANK">Bank</option>
                            <option value="CASH">Cash</option>
                            <option value="STAKEHOLDER">Stakeholder</option>
                            <option value="ASSET">Asset</option>
                            <option value="LIABILITY">Liability</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Balance</label>
                     <input
                        type="number"
                        step="0.01"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white"
                        placeholder="0.00"
                    />
                  </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${includeInNetWorth ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {includeInNetWorth && <Check className="w-4 h-4" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={includeInNetWorth} onChange={e => setIncludeInNetWorth(e.target.checked)} />
                    <div>
                        <span className="text-sm font-bold text-slate-700 block">Include in Net Worth</span>
                        <span className="text-xs text-slate-500">Uncheck this if the money doesn't belong to you.</span>
                    </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Color Tag</label>
                <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-10 h-10 rounded-xl transition-all shadow-sm ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors shadow-lg shadow-blue-200 active:scale-95"
                >
                  {editingId ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.account && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
                    <p className="text-slate-600 mt-2">
                        Are you sure you want to delete <span className="font-bold text-slate-800">{deleteConfirmation.account.name}</span>?
                    </p>
                </div>
                
                <p className="text-xs text-center text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    This action cannot be undone. All transactions associated with this account will be lost.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteConfirmation({ isOpen: false, account: null })}
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
         </div>
      )}
    </div>
  );
};

export default Accounts;