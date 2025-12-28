import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  
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
            <h2 className="text-2xl font-bold text-slate-800">{t('dash_title')}</h2>
            <p className="text-slate-500 text-sm">{t('dash_subtitle')}</p>
        </div>
        
        {/* Actions */}
        <div className="w-full xl:w-auto flex justify-end animate-slide-up" style={{ animationDelay: '50ms' }}>
            <button 
                onClick={() => setTransactionModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-200"
            >
                <Plus className="w-5 h-5 mr-2" />
                {t('add_transaction')}
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('net_worth')}</p>
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
              <p className="text-sm font-medium text-slate-500 mb-1">{t('income_mo')}</p>
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
              <p className="text-sm font-medium text-slate-500 mb-1">{t('expense_mo')}</p>
              <h3 className="text-2xl lg:text-3xl font-bold text-rose-600 break-all">-{formatCurrency(expenses)}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl shrink-0">
              <ArrowDownRight className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Net Worth Trend Chart */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up" style={{ animationDelay: '250ms' }}>
         <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 flex items-center">
                 <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                 {t('net_worth_trend')}
             </h3>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                 {(['3M', '6M', '1Y'] as const).map(range => (
                     <button
                        key={range}
                        onClick={() => setNetWorthRange(range)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${netWorthRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         {range}
                     </button>
                 ))}
             </div>
         </div>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrendData}>
                    <defs>
                        <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}} 
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}}
                        tickFormatter={(value) => {
                             if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
                             return value;
                        }}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: number) => [formatCurrency(value), t('net_worth')]}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorNetWorth)" 
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                 <Activity className="w-5 h-5 mr-2 text-slate-500" />
                 {t('activity_chart')}
             </h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#64748b'}}
                            interval={6}
                        />
                         <YAxis 
                            hide
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
        
        {/* Asset Allocation */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up" style={{ animationDelay: '350ms' }}>
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                 <Wallet className="w-5 h-5 mr-2 text-slate-500" />
                 {t('asset_dist')}
             </h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetData} layout="vertical" margin={{ left: 0, right: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12, fill: '#475569', fontWeight: 600}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={32}>
                             {assetData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={stringToColor(entry.name)} />
                             ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Categories Pie */}
           <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up lg:col-span-1" style={{ animationDelay: '400ms' }}>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <PieIcon className="w-5 h-5 mr-2 text-slate-500" />
                    {t('expense_tags')}
                </h3>
                <div className="h-64 w-full flex items-center justify-center">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={stringToColor(entry.name)} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-slate-400 text-sm">No expense data</div>
                    )}
                </div>
           </div>

           {/* Forecasts */}
           <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up lg:col-span-2 flex flex-col md:flex-row gap-6" style={{ animationDelay: '450ms' }}>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t('upcoming_income')}</h4>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{t('total_expected')}: {formatCurrency(totalForecastReceivable)}</span>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                         {receivableForecast.length > 0 ? (
                             receivableForecast.map(r => (
                                 <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                     <div>
                                         <div className="font-bold text-slate-700 text-sm">{r.name}</div>
                                         <div className="text-xs text-slate-500">{format(parseDate(r.expectedDate), 'MMM dd')}</div>
                                     </div>
                                     <div className="font-bold text-emerald-600">+{formatCurrency(r.amount)}</div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">No upcoming income</div>
                         )}
                    </div>
                </div>

                <div className="w-px bg-slate-100 hidden md:block" />

                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t('upcoming_liabilities')}</h4>
                        <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-bold">{t('total_pending')}: {formatCurrency(totalForecastLiability)}</span>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                         {liabilityForecast.length > 0 ? (
                             liabilityForecast.map(l => (
                                 <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                     <div>
                                         <div className="font-bold text-slate-700 text-sm">{l.name}</div>
                                         <div className="text-xs text-slate-500">{format(parseDate(l.dueDate), 'MMM dd')}</div>
                                     </div>
                                     <div className="font-bold text-rose-600">-{formatCurrency(l.amount)}</div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">No pending liabilities</div>
                         )}
                    </div>
                </div>
           </div>
      </div>
      
      {/* Recent Transactions List */}
       <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up" style={{ animationDelay: '500ms' }}>
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
               <ScrollText className="w-5 h-5 mr-2 text-slate-500" />
               {t('expense_list')}
           </h3>
           <div className="space-y-6">
                {groupedExpenses.length > 0 ? (
                    groupedExpenses.slice(0, 5).map(([date, { total, items }]) => (
                        <div key={date}>
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-sm font-bold text-slate-500 uppercase">{format(parseDate(date), 'MMMM dd, yyyy')}</span>
                                <span className="text-sm font-bold text-slate-800">Total: -{formatCurrency(total)}</span>
                            </div>
                            <div className="space-y-2">
                                {items.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-rose-400" />
                                            <div>
                                                <div className="font-medium text-slate-700 text-sm">{t.description || t.tags[0] || 'Uncategorized'}</div>
                                                <div className="flex gap-1 mt-0.5">
                                                    {t.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] bg-white border border-slate-200 px-1.5 rounded text-slate-500">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-mono text-sm font-bold text-rose-600">
                                            -{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-400">{t('no_data')}</div>
                )}
           </div>
       </div>
    </div>
  );
};

export default Dashboard;