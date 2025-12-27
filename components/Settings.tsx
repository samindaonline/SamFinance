import React, { useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../constants';
import { Coins, Check, Trash2, AlertTriangle, Download, Upload, FileJson } from 'lucide-react';
import { format } from 'date-fns';

const Settings: React.FC = () => {
  const { currency, setCurrency, resetData, accounts, transactions, categories, liabilities, receivables, importData } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (confirm("WARNING: This will delete ALL transactions and ALL accounts except the default Main Bank Account and Wallet. This action cannot be undone. Are you sure?")) {
        resetData();
        alert("Data has been reset.");
    }
  };

  const handleExport = () => {
    const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        currency,
        accounts,
        transactions,
        categories,
        liabilities,
        receivables
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SamFinance_Backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              if (confirm("This will overwrite your current data with the data from the file. Are you sure you want to proceed?")) {
                  const success = importData(content);
                  if (success) {
                      alert("Data imported successfully!");
                  } else {
                      alert("Failed to import data. The file might be corrupted or in an invalid format.");
                  }
              }
          }
      };
      reader.readAsText(file);
      // Reset input so the same file can be selected again if needed
      e.target.value = '';
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                     <FileJson className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Backup & Restore</h3>
             </div>
             <p className="text-slate-500 text-sm">Export your data to a JSON file or import a backup.</p>
        </div>
        
        <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm"
                >
                    <Download className="w-5 h-5 mr-2 text-blue-600" />
                    Export Data
                </button>
                
                <button 
                    onClick={handleImportClick}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm"
                >
                    <Upload className="w-5 h-5 mr-2 text-emerald-600" />
                    Import Data
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden" 
                />
            </div>
             <p className="mt-3 text-xs text-slate-400 text-center sm:text-left">
                Importing will overwrite your current data. Please ensure you export your current data first if you wish to keep it.
            </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-100 bg-rose-50/50">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                     <AlertTriangle className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-rose-800">Danger Zone</h3>
             </div>
             <p className="text-slate-500 text-sm">Manage your application data. Actions here are irreversible.</p>
        </div>
        
        <div className="p-6">
            <button 
                onClick={handleReset}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all font-medium"
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