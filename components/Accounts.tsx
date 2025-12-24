import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Wallet, User, Building, Edit2, CornerDownRight, Layers, Landmark, CreditCard, Check, AlertTriangle } from 'lucide-react';
import { COLORS, DEFAULT_ACCOUNTS } from '../constants';
import { Account } from '../types';

const getIcon = (type: string) => {
  switch (type) {
      case 'BANK': return <Building className="w-6 h-6" />;
      case 'CASH': return <Wallet className="w-6 h-6" />;
      case 'STAKEHOLDER': return <User className="w-6 h-6" />;
      case 'ASSET': return <Landmark className="w-6 h-6" />;
      case 'LIABILITY': return <CreditCard className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
  }
};

interface AccountCardProps {
  account: Account;
  isChild?: boolean;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, isChild = false, onEdit, onDelete }) => {
  const { accounts, getAccountBalance, formatCurrency } = useFinance();
  const currentBalance = getAccountBalance(account.id);
  const children = accounts.filter(a => a.parentAccountId === account.id);
  
  // Check if this is a default account (protected from deletion)
  const isDefaultAccount = DEFAULT_ACCOUNTS.some(da => da.id === account.id);

  // --- Sub-Account Layout ---
  if (isChild) {
      return (
        <div className="flex items-center justify-between p-3 mt-2 ml-4 bg-slate-50/80 border-l-4 border-slate-200 rounded-r-lg hover:bg-slate-100 transition-all group">
            <div className="flex items-center min-w-0">
                 <div className="flex items-center justify-center w-8 h-8 rounded-lg text-white shadow-sm flex-shrink-0" style={{ backgroundColor: account.color }}>
                     <User className="w-4 h-4" />
                 </div>
                 <div className="ml-3 truncate">
                     <h3 className="text-sm font-bold text-slate-700 truncate">{account.name}</h3>
                 </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-4">
                 <span className={`font-bold text-sm md:text-base whitespace-nowrap ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatCurrency(currentBalance)}
                 </span>
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Account"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    {!isDefaultAccount && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(account);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Account"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                 </div>
            </div>
        </div>
      );
  }

  // --- Parent Account Layout ---
  return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          {/* Action Buttons (Parent) */}
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(account); }} 
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                title="Edit Account"
              >
                  <Edit2 className="w-4 h-4" />
              </button>
              {!isDefaultAccount && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(account);
                    }} 
                    className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                    title="Delete Account"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
              )}
          </div>

          <div className="flex items-center mb-4 pr-16">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md flex-shrink-0" style={{ backgroundColor: account.color }}>
                  {getIcon(account.type)}
              </div>
              <div className="ml-4 overflow-hidden">
                  <h3 className="font-bold text-slate-800 text-base md:text-lg truncate">{account.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium uppercase tracking-wider">{account.type}</span>
                    {account.includeInNetWorth === false && (
                        <span className="text-xs text-rose-500 font-medium whitespace-nowrap">Excl. Net Worth</span>
                    )}
                  </div>
              </div>
          </div>
          
          <div>
              <p className="text-sm text-slate-500">
                  {children.length > 0 ? 'Total Balance' : 'Current Balance'}
              </p>
              <p className={`font-bold text-2xl ${currentBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {formatCurrency(currentBalance)}
              </p>
          </div>

          {/* Render Children */}
          {children.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center mb-2">
                      <CornerDownRight className="w-3 h-3 mr-1" /> Sub-accounts
                  </p>
                  <div className="flex flex-col">
                      {children.map(child => (
                          <AccountCard key={child.id} account={child} isChild={true} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                  </div>
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
  const [type, setType] = useState<Account['type']>('BANK');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [parentAccountId, setParentAccountId] = useState('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name,
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
      setType(acc.type);
      setInitialBalance(acc.initialBalance.toString());
      setColor(acc.color);
      setParentAccountId(acc.parentAccountId || '');
      setIncludeInNetWorth(acc.includeInNetWorth !== false); // Default true if undefined
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Accounts</h2>
           <p className="text-slate-500">Manage your bank accounts, cash wallets, assets, liabilities and stakeholders.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rootAccounts.map(account => (
             <AccountCard key={account.id} account={account} onEdit={openEdit} onDelete={openDelete} />
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Account' : 'New Account'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Chase Bank, Car Loan, House"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Account (Optional)</label>
                <div className="relative">
                    <Layers className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <select
                        value={parentAccountId}
                        onChange={(e) => setParentAccountId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">None (Top Level Account)</option>
                        {accounts
                            .filter(a => a.id !== editingId) // Prevent self-parenting
                            .map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                        value={type}
                        onChange={(e: any) => setType(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="BANK">Bank</option>
                        <option value="CASH">Cash/Wallet</option>
                        <option value="STAKEHOLDER">Stakeholder</option>
                        <option value="ASSET">Asset</option>
                        <option value="LIABILITY">Liability</option>
                        <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
                     <input
                        type="number"
                        step="0.01"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                    />
                  </div>
              </div>

              <div>
                <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${includeInNetWorth ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {includeInNetWorth && <Check className="w-3 h-3" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={includeInNetWorth} onChange={e => setIncludeInNetWorth(e.target.checked)} />
                    <span className="text-sm font-medium text-slate-700">Include in Net Worth</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-1">Uncheck for stakeholder accounts that don't belong to you.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color Tag</label>
                <div className="flex space-x-2 flex-wrap gap-y-2">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4 text-rose-600">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
                </div>
                
                <p className="text-slate-600 mb-2">
                    Are you sure you want to delete <span className="font-bold text-slate-800">{deleteConfirmation.account.name}</span>?
                </p>
                <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    This will permanently remove the account. Any associated transactions will be hidden or removed.
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setDeleteConfirmation({ isOpen: false, account: null })}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium transition-colors shadow-sm flex items-center"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
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