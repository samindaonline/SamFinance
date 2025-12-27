import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../constants';
import { Coins, Check, Download, Upload, FileJson, Trash2, AlertTriangle, Loader2, X, Terminal } from 'lucide-react';
import { format } from 'date-fns';

const Settings: React.FC = () => {
  const { currency, setCurrency, accounts, transactions, categories, liabilities, receivables, budgetProjects, importData, resetData } = useFinance();

  const [isExporting, setIsExporting] = useState(false);
  
  // Import State
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isResetting, setIsResetting] = useState(false);
  
  // Reset Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate delay for animation
    setTimeout(() => {
        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            currency,
            accounts,
            transactions,
            categories,
            liabilities,
            receivables,
            budgetProjects
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
        
        setIsExporting(false);
    }, 1000);
  };

  const handleImportSubmit = () => {
      if (!importJson.trim()) {
          setPasteError("Please paste the JSON data first.");
          return;
      }

      try {
          // Basic validation JSON before sending to context
          JSON.parse(importJson);
          setPasteError(null);
      } catch (e) {
          setPasteError("Invalid JSON format. Please check your data.");
          return;
      }

      setImportStatus('processing');

      // Add a small artificial delay to show the spinner/animation
      setTimeout(() => {
          const result = importData(importJson);
          
          if (result.success) {
              setImportStatus('success');
              // Auto close after showing success for a moment
              setTimeout(() => {
                  setShowImportModal(false);
                  setImportStatus('idle');
                  setImportJson('');
              }, 1500);
          } else {
              setImportStatus('idle');
              setPasteError(result.message || "Failed to process data.");
          }
      }, 800);
  };

  const handleReset = () => {
      setIsResetting(true);
      
      // Add artificial delay for animation
      setTimeout(() => {
          resetData();
          setIsResetting(false);
          setShowResetConfirm(false);
          alert("All data has been reset to defaults.");
      }, 1000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
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
             <p className="text-slate-500 text-sm">Export your data to a JSON file or paste a backup code to restore.</p>
        </div>
        
        <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm disabled:opacity-50"
                >
                    {isExporting ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                    ) : (
                        <Download className="w-5 h-5 mr-2 text-blue-600" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
                
                <button 
                    onClick={() => setShowImportModal(true)}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm disabled:opacity-50"
                >
                    <Upload className="w-5 h-5 mr-2 text-emerald-600" />
                    Import Data
                </button>
            </div>
             <p className="mt-3 text-xs text-slate-400 text-center sm:text-left">
                Use the Export button to save a local backup. Use Import to restore from a previously exported JSON string.
            </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-50 bg-rose-50/30">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                     <AlertTriangle className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Danger Zone</h3>
             </div>
             <p className="text-slate-500 text-sm">Irreversible actions regarding your data.</p>
        </div>
        
        <div className="p-6">
            {!showResetConfirm ? (
                <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm flex items-center justify-center"
                >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Reset All Data
                </button>
            ) : (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold text-rose-800 mb-2">Are you absolutely sure?</p>
                    <p className="text-sm text-rose-700 mb-4">This will delete all accounts, transactions, and settings. This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleReset}
                            disabled={isResetting}
                            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm shadow-sm flex items-center"
                        >
                            {isResetting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                            {isResetting ? 'Resetting...' : 'Yes, Delete Everything'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center p-5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Terminal className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Import Data</h3>
                            <p className="text-xs text-slate-500">Paste your JSON backup code below.</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => { setShowImportModal(false); setImportJson(''); setPasteError(null); }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col min-h-0">
                      <div className="relative flex-1">
                        <textarea
                            autoFocus
                            value={importJson}
                            onChange={(e) => {
                                setImportJson(e.target.value);
                                if(pasteError) setPasteError(null);
                            }}
                            placeholder='{ "version": 1, "accounts": [...], ... }'
                            className="w-full h-full min-h-[300px] p-4 bg-slate-800 text-slate-100 font-mono text-xs rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none resize-none custom-scrollbar leading-relaxed"
                            spellCheck="false"
                        />
                        {/* Paste Hint */}
                        {!importJson && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-slate-500 flex flex-col items-center">
                                    <FileJson className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-sm">Paste JSON here</span>
                                </div>
                            </div>
                        )}
                      </div>
                      
                      {pasteError && (
                          <div className="mt-3 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center font-medium animate-in slide-in-from-top-1">
                              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                              {pasteError}
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                        <button 
                            onClick={() => { setShowImportModal(false); setImportJson(''); setPasteError(null); }}
                            className="px-4 py-2 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleImportSubmit}
                            disabled={importStatus !== 'idle' || !importJson.trim()}
                            className={`px-6 py-2 rounded-xl font-medium transition-all shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                                importStatus === 'success' 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {importStatus === 'processing' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : importStatus === 'success' ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Done
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import & Merge
                                </>
                            )}
                        </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;