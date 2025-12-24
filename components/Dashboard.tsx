import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, PieChart as PieIcon, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, totalNetWorth, getAccountBalance, accounts, setTransactionModalOpen, formatCurrency } = useFinance();

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  // --- Chart 1: 30 Day Activity (Area) ---
  const activityData = React.useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayTrans = transactions.filter(t => t.date.startsWith(dateStr));
      const inc = dayTrans.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const exp = dayTrans.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
      
      data.push({
        date: format(d, 'MMM dd'),
        income: inc,
        expense: exp
      });
    }
    return data;
  }, [transactions]);

  // --- Chart 2: Asset Distribution (Stacked Bar - Hierarchical) ---
  const assetData = React.useMemo(() => {
    // Get all root accounts (accounts with no parent)
    const roots = accounts.filter(a => !a.parentAccountId);
    
    return roots.map(root => {
        const children = accounts.filter(a => a.parentAccountId === root.id);
        const rootDirectBalance = getAccountBalance(root.id) - children.reduce((sum, child) => sum + getAccountBalance(child.id), 0);
        
        // Base object
        const dataPoint: any = {
            name: root.name,
            total: getAccountBalance(root.id),
            // We use 'self' for the root's own balance
            [root.name]: rootDirectBalance > 0 ? rootDirectBalance : 0, 
        };

        // Add children to the data point for stacking
        children.forEach(child => {
            const bal = getAccountBalance(child.id);
            if (bal > 0) {
                dataPoint[child.name] = bal;
            }
        });

        return dataPoint;
    }).filter(d => d.total > 0);
  }, [accounts, getAccountBalance]);

  // Helper to generate a consistent color based on string
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };
  
  // Custom X Axis Tick to show amount BELOW the name
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const dataItem = assetData.find((d: any) => d.name === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={11}>
          {payload.value}
        </text>
        <text x={0} y={0} dy={32} textAnchor="middle" fill="#334155" fontWeight="bold" fontSize={11}>
          {dataItem ? formatCurrency(dataItem.total) : ''}
        </text>
      </g>
    );
  };


  // --- Analytics Charts ---

  // Expense by Category (Pie)
  const categoryData = React.useMemo(() => {
      const expenseTrans = transactions.filter(t => t.type === 'EXPENSE');
      const catMap: Record<string, number> = {};
      
      expenseTrans.forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

      return Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categories
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
            <p className="text-slate-500">Here is what's happening with your money.</p>
        </div>
        <button 
            onClick={() => setTransactionModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Net Worth</p>
              <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(totalNetWorth)}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Income (This Month)</p>
              <h3 className="text-3xl font-bold text-emerald-600">+{formatCurrency(income)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Expenses (This Month)</p>
              <h3 className="text-3xl font-bold text-rose-600">-{formatCurrency(expenses)}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl">
              <ArrowDownRight className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Standard Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-slate-400" /> 
            30 Day Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Breakdown - Stacked */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <PieIcon className="w-4 h-4 mr-2 text-slate-400" />
            Assets Distribution
           </h3>
           <div className="h-64">
            {assetData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetData} margin={{bottom: 20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={<CustomXAxisTick />}
                    height={50}
                  />
                  <YAxis hide />
                  <Tooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  {/* Generate Bars dynamically for stacking. We need to find all unique keys across data that aren't 'name' or 'total' */}
                  {Array.from(new Set(assetData.flatMap((d: any) => Object.keys(d)).filter((k: any) => k !== 'name' && k !== 'total'))).map((key: string, index) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={stringToColor(key)} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No positive balances to display
              </div>
            )}
           </div>
        </div>
      </div>

      {/* Analytics Charts - Always Visible */}
      <div className="grid grid-cols-1 gap-6">
            {/* Category Pie */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto w-full">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <PieIcon className="w-4 h-4 mr-2 text-slate-400" /> 
                    Expense Categories (Top 8)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
      </div>

      {/* Recent Transactions Snippet */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100">
            {transactions.slice(0, 5).map(t => {
                const account = accounts.find(a => a.id === t.accountId);
                const parent = account?.parentAccountId ? accounts.find(p => p.id === account.parentAccountId) : null;
                const displayAccountName = parent ? `${parent.name} / ${account?.name}` : account?.name;

                return (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                                t.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                                {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : 
                                 t.type === 'EXPENSE' ? <ArrowDownRight className="w-5 h-5" /> :
                                 <Wallet className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">{t.description || t.category}</p>
                                <p className="text-xs text-slate-500">{format(new Date(t.date), 'MMM dd, yyyy')} • {displayAccountName}</p>
                            </div>
                        </div>
                        <div className={`font-bold ${
                             t.type === 'INCOME' ? 'text-emerald-600' :
                             t.type === 'EXPENSE' ? 'text-rose-600' :
                             'text-slate-700'
                        }`}>
                            {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''} {formatCurrency(t.amount)}
                        </div>
                    </div>
                );
            })}
            {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                    No transactions yet. Start by adding one!
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const COLORS_PALETTE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default Dashboard;