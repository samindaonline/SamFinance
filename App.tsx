import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Settings from './components/Settings';
import Liabilities from './components/Liabilities';
import Receivables from './components/Receivables';
import Budget from './components/Budget';

type View = 'dashboard' | 'accounts' | 'transactions' | 'liabilities' | 'receivables' | 'categories' | 'settings' | 'budget';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'liabilities':
        return <Liabilities />;
      case 'receivables':
        return <Receivables />;
      case 'categories':
        return <Categories />;
      case 'budget':
        return <Budget />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <FinanceProvider>
      <Layout currentView={currentView} setView={setCurrentView}>
        {renderView()}
      </Layout>
    </FinanceProvider>
  );
};

export default App;