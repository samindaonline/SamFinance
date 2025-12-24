import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../constants';
import { Coins, Check, Trash2, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
  const { currency, setCurrency, resetData } = useFinance();

  const handleReset = () => {
    if (confirm("WARNING: This will delete ALL transactions and ALL accounts except the default Main Bank Account and Wallet. This action cannot be undone. Are you sure?")) {
        resetData();
        alert("Data has been reset.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Configure application preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                     <Coins className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Currency</h3>
             </div>
             <p className="text-slate-500 text-sm">Select the default currency for displaying monetary values across the application.</p>
        </div>
        
        <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {CURRENCIES.map((curr) => (
                     <button
                        key={curr.code}
                        onClick={() => setCurrency(curr.code)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            currency === curr.code 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                     >
                         <div className="flex items-center gap-3">
                             <span className="text-xl font-bold w-8 text-center">{curr.symbol}</span>
                             <div className="text-left">
                                 <div className="font-bold text-sm">{curr.code}</div>
                                 <div className="text-xs opacity-75">{curr.name}</div>
                             </div>
                         </div>
                         {currency === curr.code && <Check className="w-5 h-5 text-blue-600" />}
                     </button>
                 ))}
             </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-100 bg-rose-50/50">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                     <AlertTriangle className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-rose-800">Data Management</h3>
             </div>
             <p className="text-slate-500 text-sm">Manage your application data. Actions here are irreversible.</p>
        </div>
        
        <div className="p-6">
            <button 
                onClick={handleReset}
                className="flex items-center px-4 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all font-medium"
            >
                <Trash2 className="w-5 h-5 mr-3" />
                Reset Data (Keep Main Accounts)
            </button>
            <p className="mt-2 text-xs text-slate-400">
                This will delete all transactions and created accounts, but will preserve the default "Main Bank Account" and "Wallet".
            </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;