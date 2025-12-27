import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, PieChart as PieIcon, Plus, Calendar, TrendingUp, ScrollText, X, ChevronRight, HandCoins } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, isAfter, endOfMonth, addMonths, isSameDay } from 'date-fns';

// Helper to replace parseISO for YYYY-MM-DD strings to ensure local midnight
const parseDate = (dateStr: string) => {
    if (dateStr.length === 10) return new Date(dateStr + 'T00:00:00');
    return new Date(dateStr);
};

const Dashboard: React.FC = () => {
  const { transactions, liabilities, receivables, totalNetWorth, getAccountBalance, accounts, setTransactionModalOpen, formatCurrency } = useFinance();
  
  const [netWorthRange, setNetWorthRange] = useState<'3M' | '6M' | '1Y'>('6M');
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showReceivableModal, setShowReceivableModal] = useState(false);

  // Animation States
  const [isLiabilityModalVisible, setIsLiabilityModalVisible] = useState(false);
  const [isReceivableModalVisible, setIsReceivableModalVisible] = useState(false);

  useEffect(() => {
      if(showLiabilityModal) setIsLiabilityModalVisible(true);
      else setTimeout(() => setIsLiabilityModalVisible(false), 200);
  }, [showLiabilityModal]);

  useEffect(() => {
      if(showReceivableModal) setIsReceivableModalVisible(true);
      else setTimeout(() => setIsReceivableModalVisible(false), 200);
  }, [showReceivableModal]);

  // --- Filter Logic (Fixed to 30 days, All tags) ---
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Transaction dates are full ISO strings
      const isDateValid = isAfter(new Date(t.date), cutoffDate);
      return isDateValid;
    });
  }, [transactions, cutoffDate]);

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

  // --- Liability Forecast Logic ---
  const liabilityForecast = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = endOfMonth(addMonths(today, 3)); // Current month + 3 months forward

    return liabilities
        .filter(l => {
            if (l.status !== 'PENDING') return false;
            const d = parseDate(l.dueDate);
            return d >= start && d <= end;
        })
        .sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime());
  }, [liabilities]);

  const totalForecastLiability = liabilityForecast.reduce((sum, l) => sum + l.amount, 0);

  // --- Receivable Forecast Logic ---
  const receivableForecast = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = endOfMonth(addMonths(today, 3)); // Current month + 3 months forward

    return receivables
        .filter(r => {
            if (r.status !== 'PENDING') return false;
            const d = parseDate(r.expectedDate);
            return d >= start && d <= end;
        })
        .sort((a, b) => parseDate(a.expectedDate).getTime() - parseDate(b.expectedDate).getTime());
  }, [receivables]);

  const totalForecastReceivable = receivableForecast.reduce((sum, r) => sum + r.amount, 0);


  // --- Chart 1: Activity (Area) based on Time Range (Fixed 30 days) ---
  const activityData = useMemo(() => {
    const days = 30;
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
  }, [filteredTransactions]);

  // --- Chart 2: Asset Distribution (Stacked Bar) ---
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
      const today = new Date();
      today.setHours(0,0,0,0);

      let startDate = addMonths(today, -6);
      if (netWorthRange === '3M') startDate = addMonths(today, -3);
      if (netWorthRange === '1Y') startDate = addMonths(today, -12);

      // 4. Generate daily points backwards from Today
      const dataPoints = [];
      let currentVal = totalNetWorth;
      let transIndex = 0;

      // Loop backwards from today to start date
      for (let d = new Date(today); d >= startDate; d.setDate(d.getDate() - 1)) {
          // Push current value for this day
          dataPoints.push({
              date: format(d, 'MMM dd'),
              value: currentVal,
              rawDate: new Date(d)
          });

          // Adjust currentVal to represent the state *before* this day's transactions
          // We are reversing the effects of transactions that happened on 'd'
          while(transIndex < sortedTrans.length) {
              const t = sortedTrans[transIndex];
              const tDate = new Date(t.date);
              tDate.setHours(0,0,0,0);

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
            const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
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
        <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
            <p className="text-slate-500 text-sm">Here is what's happening with your money.</p>
        </div>
        
        {/* Actions */}
        <div className="w-full xl:w-auto flex justify-end animate-slide-up" style={{ animationDelay: '50ms' }}>
            <button 
                onClick={() => setTransactionModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-200"
            >
                <Plus className="w-5 h-5 mr-2" />
                Add Transaction
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '100ms' }}>
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

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '150ms' }}>
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

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '200ms' }}>
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
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm animate-slide-up" style={{ animationDelay: '250ms' }}>
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
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
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
                    animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-slate-400" /> 
            Income vs Expenses (Last 30 Days)
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
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" animationDuration={1500} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Tag */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm animate-slide-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <PieIcon className="w-4 h-4 mr-2 text-slate-400" /> 
                Expenses by Tag (Last 30 Days)
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
                            animationDuration={1500}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receivables Forecast Widget */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <HandCoins className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-800">Upcoming Income</h3>
                          <p className="text-xs text-slate-500">Next 3 Months Forecast</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xl font-bold text-emerald-600">+{formatCurrency(totalForecastReceivable)}</div>
                      <div className="text-xs text-slate-500 font-medium">Total Expected</div>
                  </div>
              </div>
              
              <div className="p-5">
                  {receivableForecast.length > 0 ? (
                      <div className="space-y-3">
                          {receivableForecast.slice(0, 3).map((rec, idx) => (
                              <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 animate-slide-in-right" style={{ animationDelay: `${idx * 100}ms` }}>
                                  <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200 shadow-sm">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseDate(rec.expectedDate), 'MMM')}</span>
                                          <span className="text-sm font-bold text-slate-700">{format(parseDate(rec.expectedDate), 'dd')}</span>
                                      </div>
                                      <div>
                                          <div className="font-semibold text-sm text-slate-800">{rec.name}</div>
                                          <div className="text-xs text-slate-500 truncate max-w-[150px]">{rec.description || 'No description'}</div>
                                      </div>
                                  </div>
                                  <div className="font-bold text-emerald-600 text-sm">+{formatCurrency(rec.amount)}</div>
                              </div>
                          ))}
                          
                          {receivableForecast.length > 3 && (
                              <button 
                                  onClick={() => setShowReceivableModal(true)}
                                  className="w-full py-2 mt-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center active:scale-95 duration-200"
                              >
                                  Read More ({receivableForecast.length - 3} more)
                              </button>
                          )}
                          
                          {receivableForecast.length <= 3 && receivableForecast.length > 0 && (
                              <button 
                                onClick={() => setShowReceivableModal(true)}
                                className="w-full text-xs text-slate-400 hover:text-emerald-600 mt-1 flex items-center justify-center gap-1 transition-colors"
                              >
                                View All Details <ChevronRight className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  ) : (
                      <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No expected income in the next 3 months.
                      </div>
                  )}
              </div>
          </div>

          {/* Liabilities Forecast Widget */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '450ms' }}>
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-amber-50/30">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                          <ScrollText className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-800">Upcoming Liabilities</h3>
                          <p className="text-xs text-slate-500">Next 3 Months Forecast</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xl font-bold text-rose-600">-{formatCurrency(totalForecastLiability)}</div>
                      <div className="text-xs text-slate-500 font-medium">Total Pending</div>
                  </div>
              </div>
              
              <div className="p-5">
                  {liabilityForecast.length > 0 ? (
                      <div className="space-y-3">
                          {liabilityForecast.slice(0, 3).map((liab, idx) => (
                              <div key={liab.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 animate-slide-in-right" style={{ animationDelay: `${idx * 100}ms` }}>
                                  <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200 shadow-sm">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseDate(liab.dueDate), 'MMM')}</span>
                                          <span className="text-sm font-bold text-slate-700">{format(parseDate(liab.dueDate), 'dd')}</span>
                                      </div>
                                      <div>
                                          <div className="font-semibold text-sm text-slate-800">{liab.name}</div>
                                          <div className="text-xs text-slate-500 truncate max-w-[150px]">{liab.description || 'No description'}</div>
                                      </div>
                                  </div>
                                  <div className="font-bold text-rose-600 text-sm">-{formatCurrency(liab.amount)}</div>
                              </div>
                          ))}
                          
                          {liabilityForecast.length > 3 && (
                              <button 
                                  onClick={() => setShowLiabilityModal(true)}
                                  className="w-full py-2 mt-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center active:scale-95 duration-200"
                              >
                                  Read More ({liabilityForecast.length - 3} more)
                              </button>
                          )}
                          
                          {liabilityForecast.length <= 3 && liabilityForecast.length > 0 && (
                              <button 
                                onClick={() => setShowLiabilityModal(true)}
                                className="w-full text-xs text-slate-400 hover:text-blue-600 mt-1 flex items-center justify-center gap-1 transition-colors"
                              >
                                View All Details <ChevronRight className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  ) : (
                      <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No liabilities due in the next 3 months.
                      </div>
                  )}
              </div>
          </div>
      </div>

       {/* Detailed Expense List by Date */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-slate-500" />
                 <h3 className="text-lg font-bold text-slate-800">Expenses by Date (Last 30 Days)</h3>
             </div>
          </div>
          
          <div className="divide-y divide-slate-100">
             {groupedExpenses.length > 0 ? (
                 groupedExpenses.map(([date, group]) => (
                     <div key={date} className="group">
                         {/* Date Header */}
                         <div className="bg-slate-50 px-4 md:px-6 py-2 md:py-3 flex justify-between items-center">
                             <span className="font-semibold text-slate-700 text-sm">{format(new Date(date), 'MMM do')}</span>
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
                     No expenses found for the last 30 days.
                 </div>
             )}
          </div>
      </div>

      {/* Account Breakdown */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm animate-slide-up" style={{ animationDelay: '550ms' }}>
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
                      <Bar key={key} dataKey={key} stackId="a" fill={stringToColor(key)} radius={[4, 4, 0, 0]} animationDuration={1500} />
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

      {/* Liabilities Details Modal */}
      {(isLiabilityModalVisible || showLiabilityModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${showLiabilityModal ? 'animate-fade-in' : 'animate-fade-out'}`} onClick={() => setShowLiabilityModal(false)} />
              <div className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] z-10 relative ${showLiabilityModal ? 'animate-zoom-in' : 'animate-zoom-out'}`}>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Liabilities Forecast</h3>
                          <p className="text-sm text-slate-500">Upcoming payments for the next 3 months.</p>
                      </div>
                      <button onClick={() => setShowLiabilityModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors active:scale-90 duration-200">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {liabilityForecast.map(liab => {
                           const account = accounts.find(a => a.id === liab.paymentAccountId);
                           return (
                              <div key={liab.id} className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseDate(liab.dueDate), 'MMM')}</span>
                                              <span className="text-lg font-bold text-slate-700">{format(parseDate(liab.dueDate), 'dd')}</span>
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-800">{liab.name}</div>
                                              <div className="text-sm text-slate-500">{liab.description || 'No description'}</div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-lg font-bold text-rose-600">-{formatCurrency(liab.amount)}</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 mt-2">
                                      <span className="text-slate-500">Payment Source:</span>
                                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: account?.color || '#ccc'}} />
                                          {account?.name || 'Unknown Account'}
                                      </span>
                                  </div>
                              </div>
                           );
                      })}
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                      <span className="font-medium text-slate-500">Total Forecast</span>
                      <span className="text-xl font-bold text-rose-600">-{formatCurrency(totalForecastLiability)}</span>
                  </div>
              </div>
          </div>
      )}

      {/* Receivables Details Modal */}
      {(isReceivableModalVisible || showReceivableModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${showReceivableModal ? 'animate-fade-in' : 'animate-fade-out'}`} onClick={() => setShowReceivableModal(false)} />
              <div className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] z-10 relative ${showReceivableModal ? 'animate-zoom-in' : 'animate-zoom-out'}`}>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Income Forecast</h3>
                          <p className="text-sm text-slate-500">Upcoming expected income for the next 3 months.</p>
                      </div>
                      <button onClick={() => setShowReceivableModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors active:scale-90 duration-200">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {receivableForecast.map(rec => {
                           const account = accounts.find(a => a.id === rec.targetAccountId);
                           return (
                              <div key={rec.id} className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase">{format(parseDate(rec.expectedDate), 'MMM')}</span>
                                              <span className="text-lg font-bold text-slate-700">{format(parseDate(rec.expectedDate), 'dd')}</span>
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-800">{rec.name}</div>
                                              <div className="text-sm text-slate-500">{rec.description || 'No description'}</div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-lg font-bold text-emerald-600">+{formatCurrency(rec.amount)}</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 mt-2">
                                      <span className="text-slate-500">Target Account:</span>
                                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: account?.color || '#ccc'}} />
                                          {account?.name || 'Unknown Account'}
                                      </span>
                                  </div>
                              </div>
                           );
                      })}
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                      <span className="font-medium text-slate-500">Total Forecast</span>
                      <span className="text-xl font-bold text-emerald-600">+{formatCurrency(totalForecastReceivable)}</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const COLORS_PALETTE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default Dashboard;