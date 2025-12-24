import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Settings from './components/Settings';

type View = 'dashboard' | 'accounts' | 'transactions' | 'categories' | 'settings';

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
      case 'categories':
        return <Categories />;
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
