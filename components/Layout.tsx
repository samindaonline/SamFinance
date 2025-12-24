import React, { useState } from 'react';
import { LayoutDashboard, Wallet, CreditCard, Menu, X, PiggyBank, Tags, Settings } from 'lucide-react';
import TransactionModal from './TransactionModal';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'accounts' | 'transactions' | 'categories' | 'settings';
  setView: (view: 'dashboard' | 'accounts' | 'transactions' | 'categories' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: 'dashboard' | 'accounts' | 'transactions' | 'categories' | 'settings', icon: any, label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="flex items-center px-6 py-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
            <PiggyBank className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">SamFinance</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="accounts" icon={Wallet} label="Accounts" />
          <NavItem view="transactions" icon={CreditCard} label="Transactions" />
          <NavItem view="categories" icon={Tags} label="Categories" />
          <div className="pt-4 mt-4 border-t border-slate-100">
             <NavItem view="settings" icon={Settings} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">Local Data Only</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20">
           <div className="flex items-center">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
               <PiggyBank className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-slate-800">SamFinance</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
             {isMobileMenuOpen ? <X /> : <Menu />}
           </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-slate-200 shadow-xl z-30 p-4 space-y-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="accounts" icon={Wallet} label="Accounts" />
            <NavItem view="transactions" icon={CreditCard} label="Transactions" />
            <NavItem view="categories" icon={Tags} label="Categories" />
            <NavItem view="settings" icon={Settings} label="Settings" />
          </div>
        )}

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Transaction Modal */}
      <TransactionModal />
    </div>
  );
};

export default Layout;