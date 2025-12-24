import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, PieChart as PieIcon, Plus, Calendar, Filter, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { format, subDays, isAfter, parseISO, subMonths, isSameDay, startOfDay } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, totalNetWorth, getAccountBalance, accounts, setTransactionModalOpen, formatCurrency, categories } = useFinance();
  
  const [timeRange, setTimeRange] = useState<'30' | '90'>('30');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [netWorthRange, setNetWorthRange] = useState<'3M' | '6M' | '1Y'>('6M');

  // --- Filter Logic ---
  const cutoffDate = useMemo(() => {
    return subDays(new Date(), parseInt(timeRange));
  }, [timeRange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isDateValid = isAfter(parseISO(t.date), cutoffDate);
      const isTagValid = tagFilter === 'ALL' || t.tags.includes(tagFilter);
      return isDateValid && isTagValid;
    });
  }, [transactions, cutoffDate, tagFilter]);

  // Calculate monthly stats (based on current month regardless of filter, standard dashboard behavior)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = currentMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = currentMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  // --- Chart 1: Activity (Area) based on Time Range ---
  const activityData = useMemo(() => {
    const days = parseInt(timeRange);
    const data = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayTrans = filteredTransactions.filter(t => t.date.startsWith(dateStr));
      const inc = dayTrans.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const exp = dayTrans.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
      
      data.push({
        date: format(d, 'MMM dd'),
        income: inc,
        expense: exp
      });
    }
    return data;
  }, [filteredTransactions, timeRange]);

  // --- Chart 2: Asset Distribution (Stacked Bar) - Unaffected by filters usually ---
  const assetData = useMemo(() => {
    const roots = accounts.filter(a => !a.parentAccountId);
    return roots.map(root => {
        const children = accounts.filter(a => a.parentAccountId === root.id);
        const rootDirectBalance = getAccountBalance(root.id) - children.reduce((sum, child) => sum + getAccountBalance(child.id), 0);
        const dataPoint: any = {
            name: root.name,
            total: getAccountBalance(root.id),
            [root.name]: rootDirectBalance > 0 ? rootDirectBalance : 0, 
        };
        children.forEach(child => {
            const bal = getAccountBalance(child.id);
            if (bal > 0) {
                dataPoint[child.name] = bal;
            }
        });
        return dataPoint;
    }).filter(d => d.total > 0);
  }, [accounts, getAccountBalance]);

  // --- Chart 3: Tags/Categories Pie ---
  const categoryData = useMemo(() => {
      const expenseTrans = filteredTransactions.filter(t => t.type === 'EXPENSE');
      const catMap: Record<string, number> = {};
      
      expenseTrans.forEach(t => {
          if (t.tags.length === 0) {
              catMap['Uncategorized'] = (catMap['Uncategorized'] || 0) + t.amount;
          } else {
            t.tags.forEach(tag => {
                catMap[tag] = (catMap[tag] || 0) + t.amount;
            });
          }
      });

      return Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); 
  }, [filteredTransactions]);

  // --- Chart 4: Net Worth Trend ---
  const netWorthTrendData = useMemo(() => {
      // 1. Identify Net Worth Accounts (Set for O(1) lookup)
      const nwAccountIds = new Set(accounts.filter(a => a.includeInNetWorth !== false).map(a => a.id));

      // 2. Sort transactions descending (newest first)
      const sortedTrans = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 3. Determine Start Date
      const today = startOfDay(new Date());
      let startDate = subMonths(today, 6);
      if (netWorthRange === '3M') startDate = subMonths(today, 3);
      if (netWorthRange === '1Y') startDate = subMonths(today, 12);

      // 4. Generate daily points backwards from Today
      const dataPoints = [];
      let currentVal = totalNetWorth;
      let transIndex = 0;

      // Loop backwards from today to start date
      for (let d = today; d >= startDate; d = subDays(d, 1)) {
          // Push current value for this day
          dataPoints.push({
              date: format(d, 'MMM dd'),
              value: currentVal,
              rawDate: d
          });

          // Adjust currentVal to represent the state *before* this day's transactions
          // We are reversing the effects of transactions that happened on 'd'
          while(transIndex < sortedTrans.length) {
              const t = sortedTrans[transIndex];
              const tDate = startOfDay(parseISO(t.date));

              if (tDate > d) {
                  // Transaction is in the future relative to 'd', skip (should have been handled already)
                  transIndex++;
                  continue;
              }

              if (tDate < d) {
                  // Transaction is older than 'd', stop processing for this day
                  break;
              }

              // Transaction happened ON day 'd'. Reverse it.
              if (isSameDay(tDate, d)) {
                   const isSourceNW = nwAccountIds.has(t.accountId);
                   const isDestNW = t.toAccountId && nwAccountIds.has(t.toAccountId);

                   if (t.type === 'INCOME') {
                       // Income added to NW. Reverse: Subtract
                       if (isSourceNW) currentVal -= t.amount;
                   } else if (t.type === 'EXPENSE') {
                       // Expense removed from NW. Reverse: Add
                       if (isSourceNW) currentVal += t.amount;
                   } else if (t.type === 'TRANSFER') {
                       if (isSourceNW && !isDestNW) {
                           // Money left NW system. Reverse: Add back
                           currentVal += t.amount;
                       } else if (!isSourceNW && isDestNW) {
                           // Money entered NW system. Reverse: Subtract
                           currentVal -= t.amount;
                       }
                       // NW to NW transfer requires no change to total
                   }
                   transIndex++;
              }
          }
      }

      return dataPoints.reverse();
  }, [transactions, accounts, totalNetWorth, netWorthRange]);

  // --- Grouped Expense List by Date ---
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, { total: number, items: typeof transactions }> = {};
    
    filteredTransactions
        .filter(t => t.type === 'EXPENSE')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(t => {
            const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = { total: 0, items: [] };
            groups[dateKey].total += t.amount;
            groups[dateKey].items.push(t);
        });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const dataItem = assetData.find((d: any) => d.name === payload.value);
    // Don't render text if screen is small and many items
    if (window.innerWidth < 600 && assetData.length > 4) {
         if(payload.index % 2 !== 0) return null;
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={11}>
          {payload.value.substring(0, 8)}{payload.value.length > 8 ? '...' : ''}
        </text>
        <text x={0} y={0} dy={32} textAnchor="middle" fill="#334155" fontWeight="bold" fontSize={11}>
          {dataItem ? formatCurrency(dataItem.total) : ''}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
            <p className="text-slate-500 text-sm">Here is what's happening with your money.</p>
        </div>
        
        {/* Responsive Controls Container */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3">
             {/* Time & Filter Row */}
             <div className="flex flex-1 gap-3">
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
                    <button 
                        onClick={() => setTimeRange('30')}
                        className={`flex-1 sm:flex-none px-3 py-2 text-xs font-medium rounded-lg transition-colors ${timeRange === '30' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        30 Days
                    </button>
                    <button 
                        onClick={() => setTimeRange('90')}
                        className={`flex-1 sm:flex-none px-3 py-2 text-xs font-medium rounded-lg transition-colors ${timeRange === '90' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        3 Months
                    </button>
                </div>

                <div className="relative flex-1 sm:flex-none">
                    <select 
                        value={tagFilter} 
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 pl-9 pr-8 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm text-sm h-full truncate max-w-[150px] sm:max-w-none"
                    >
                        <option value="ALL">All Tags</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
             </div>

            <button 
                onClick={() => setTransactionModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
            >
                <Plus className="w-5 h-5 mr-2" />
                Add
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Net Worth</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 break-all">{formatCurrency(totalNetWorth)}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl shrink-0">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Income (Mo)</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-emerald-600 break-all">+{formatCurrency(income)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl shrink-0">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Expenses (Mo)</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-rose-600 break-all">-{formatCurrency(expenses)}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl shrink-0">
              <ArrowDownRight className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Net Worth Trend Chart */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-slate-400" /> 
                Net Worth Trend
            </h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
                {(['3M', '6M', '1Y'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setNetWorthRange(range)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            netWorthRange === range 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTrendData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval="preserveStartEnd" minTickGap={30} />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    width={45} 
                    tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value;
                    }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{color: '#64748b', marginBottom: '0.5rem', fontSize: '12px'}}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Net Worth"
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-slate-400" /> 
            Income vs Expenses
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={35} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Tag */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <PieIcon className="w-4 h-4 mr-2 text-slate-400" /> 
                Expenses by Tag
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
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '11px'}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

       {/* Detailed Expense List by Date */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-slate-500" />
                 <h3 className="text-lg font-bold text-slate-800">Expenses by Date</h3>
             </div>
             {tagFilter !== 'ALL' && (
                 <span className="text-[10px] sm:text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg whitespace-nowrap">
                     Filter: {tagFilter}
                 </span>
             )}
          </div>
          
          <div className="divide-y divide-slate-100">
             {groupedExpenses.length > 0 ? (
                 groupedExpenses.map(([date, group]) => (
                     <div key={date} className="group">
                         {/* Date Header */}
                         <div className="bg-slate-50 px-4 md:px-6 py-2 md:py-3 flex justify-between items-center">
                             <span className="font-semibold text-slate-700 text-sm">{format(parseISO(date), 'MMM do')}</span>
                             <span className="font-bold text-rose-600 text-sm">-{formatCurrency(group.total)}</span>
                         </div>
                         {/* Transactions for that date */}
                         <div className="divide-y divide-slate-50">
                             {group.items.map(t => {
                                const account = accounts.find(a => a.id === t.accountId);
                                return (
                                    <div key={t.id} className="px-4 md:px-6 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                                                <ArrowDownRight className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{t.description || "Expense"}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {t.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right pl-2 shrink-0">
                                            <span className="text-sm font-bold text-slate-700">{formatCurrency(t.amount)}</span>
                                            <p className="text-xs text-slate-400 truncate max-w-[80px] sm:max-w-none ml-auto">{account?.name}</p>
                                        </div>
                                    </div>
                                );
                             })}
                         </div>
                     </div>
                 ))
             ) : (
                 <div className="p-12 text-center text-slate-400 text-sm">
                     No expenses found for this period or filter.
                 </div>
             )}
          </div>
      </div>

      {/* Account Breakdown */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Wallet className="w-4 h-4 mr-2 text-slate-400" />
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
  );
};

const COLORS_PALETTE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default Dashboard;