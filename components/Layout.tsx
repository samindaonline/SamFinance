import React, { useState } from 'react';
import { LayoutDashboard, Wallet, CreditCard, Menu, X, PiggyBank, Tags, Settings, ScrollText, ChevronRight, HandCoins } from 'lucide-react';
import TransactionModal from './TransactionModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'accounts' | 'transactions' | 'liabilities' | 'receivables' | 'categories' | 'settings';
  setView: (view: 'dashboard' | 'accounts' | 'transactions' | 'liabilities' | 'receivables' | 'categories' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'accounts', icon: Wallet, label: 'Accounts' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions' },
    { id: 'receivables', icon: HandCoins, label: 'Receivables' },
    { id: 'liabilities', icon: ScrollText, label: 'Liabilities' },
    { id: 'categories', icon: Tags, label: 'Categories' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  const handleNavClick = (view: typeof currentView) => {
    setView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shadow-sm relative">
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                aria-label="Open menu"
             >
                <Menu className="w-6 h-6" />
             </button>
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200">
                    <PiggyBank className="w-5 h-5" />
                 </div>
                 <h1 className="text-lg font-bold text-slate-800 tracking-tight hidden sm:block">SamFinance</h1>
             </div>
         </div>

         <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                Local Vault
            </span>
         </div>
      </header>

      {/* Slide-out Drawer / Sidebar */}
      <div 
        className={`fixed inset-0 z-40 transition-visibility duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}
      >
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar Content */}
          <div 
            className={`absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                  <span className="font-bold text-lg text-slate-800">Menu</span>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                  >
                      <X className="w-5 h-5" />
                  </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id as any)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                            currentView === item.id
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                          <div className="flex items-center">
                              <item.icon className={`w-5 h-5 mr-3 transition-colors ${currentView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                              {item.label}
                          </div>
                          {currentView === item.id && <ChevronRight className="w-4 h-4 text-blue-500" />}
                      </button>
                  ))}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-200">
                      <h4 className="font-bold text-sm mb-1">Secure & Local</h4>
                      <p className="text-xs text-blue-100 leading-relaxed">
                          Your financial data never leaves this device. 
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
      </main>

      {/* Global Transaction Modal */}
      <TransactionModal />
    </div>
  );
};

export default Layout;