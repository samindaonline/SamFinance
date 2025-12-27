import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BudgetProject, BudgetItem, BudgetInstallment, Account, Receivable } from '../types';
import { Plus, Trash2, ArrowLeft, ExternalLink, Calendar, Calculator, Save, AlertTriangle, TrendingDown, TrendingUp, DollarSign, ArrowRight, ArrowDownRight, ArrowUpRight, RefreshCcw, ScrollText, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isBefore, isSameMonth, startOfDay, isAfter, getDate, setDate, isWithinInterval, endOfDay, isSameDay } from 'date-fns';

// --- Sub-components for better organization ---

const ProjectCard: React.FC<{ project: BudgetProject; onClick: () => void; onDelete: (e: React.MouseEvent) => void; formatCurrency: (n: number) => string }> = ({ project, onClick, onDelete, formatCurrency }) => {
    const totalCost = project.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = project.items.length;

    return (
        <div onClick={onClick} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative">
            <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Calculator className="w-6 h-6" />
                </div>
                <button 
                    onClick={onDelete}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{project.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Created {format(parseISO(project.createdAt), 'MMM dd, yyyy')}</p>
            
            <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Est.</span>
                    <div className="font-bold text-slate-800 text-lg">{formatCurrency(totalCost)}</div>
                </div>
                <div className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                    {itemCount} Items
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const Budget: React.FC = () => {
  const { 
    budgetProjects, 
    addBudgetProject, 
    updateBudgetProject, 
    deleteBudgetProject, 
    accounts, 
    liabilities, 
    receivables, 
    getAccountBalance,
    formatCurrency 
  } = useFinance();

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeProject, setActiveProject] = useState<BudgetProject | null>(null);
  
  // Creation Modal State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Editor State
  const [items, setItems] = useState<BudgetItem[]>([]);
  
  // Date Filter State
  const [filterStartDate, setFilterStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState(format(endOfMonth(addMonths(new Date(), 6)), 'yyyy-MM-dd'));

  // Temporary State for Adding a new Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  // Temporary State for Installment Builder
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // Which item's payments are we editing?
  
  // State for toggling item details
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const toggleItemExpansion = (id: string) => {
      const newSet = new Set(expandedItemIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedItemIds(newSet);
  };

  const handleCreateProject = (e: React.FormEvent) => {
      e.preventDefault();
      if(newProjectName.trim()) {
          addBudgetProject(newProjectName.trim());
          setNewProjectName('');
          setCreateModalOpen(false);
      }
  };

  const openProject = (project: BudgetProject) => {
      setActiveProject(project);
      setItems(JSON.parse(JSON.stringify(project.items))); // Deep copy to avoid direct mutation
      // Reset date filters to defaults when opening
      setFilterStartDate(format(startOfDay(new Date()), 'yyyy-MM-dd'));
      setFilterEndDate(format(endOfMonth(addMonths(new Date(), 6)), 'yyyy-MM-dd'));
      setView('detail');
  };

  const handleSaveProject = () => {
      if(activeProject) {
          updateBudgetProject({
              ...activeProject,
              items: items
          });
          alert('Project saved successfully!');
      }
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this forecast?')) {
          deleteBudgetProject(id);
      }
  };

  const addItemToProject = () => {
      if(!newItemName || !newItemPrice) return;
      const price = Number(newItemPrice);
      
      const newItem: BudgetItem = {
          id: crypto.randomUUID(),
          name: newItemName,
          link: newItemLink,
          totalPrice: price,
          installments: [] // Start empty, user must configure
      };
      
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemLink('');
      setNewItemPrice('');
  };

  const deleteItem = (itemId: string) => {
      setItems(items.filter(i => i.id !== itemId));
  };

  const updateItemInstallments = (itemId: string, installments: BudgetInstallment[]) => {
      setItems(items.map(item => item.id === itemId ? { ...item, installments } : item));
  };

  // --- Helper: recurring date logic ---
  const getRecurringDateInMonth = (baseDate: Date, targetMonth: Date) => {
    const dayOfBase = getDate(baseDate); // e.g., 30
    const targetMonthStart = startOfMonth(targetMonth);
    const lastDayOfTarget = getDate(endOfMonth(targetMonthStart)); // e.g., 28 (Feb)
    
    // If base is 30th, but Feb only has 28, use 28.
    const dayToSet = Math.min(dayOfBase, lastDayOfTarget);
    
    const result = new Date(targetMonthStart);
    result.setDate(dayToSet);
    return result;
  };

  // --- Projection Engine & Event List Generation ---
  const { projectionData, timelineEvents } = useMemo(() => {
      if (!activeProject) return { projectionData: null, timelineEvents: [] };

      // Simulation starts strictly from the filtered start date.
      // We assume the "Current Balance" in the app represents the balance at the start of this date 
      // (or rather, we ignore any back-dated events and assume they are settled).
      const simulationStart = startOfDay(parseISO(filterStartDate)); 
      const simulationEnd = endOfDay(parseISO(filterEndDate));

      // 1. Build Unified Event List (From FilterStartDate -> EndDate)
      const events: Array<{
          id: string;
          date: Date;
          amount: number;
          type: 'PROJECT' | 'LIABILITY' | 'RECEIVABLE';
          name: string;
          accountId: string;
          isRecurring?: boolean;
          runningBalance?: number; // Will be calculated
      }> = [];

      // A. Add Project Installments
      items.forEach(item => {
          item.installments.forEach(inst => {
             const d = parseISO(inst.date);
             // STRICT CHECK: Must be >= simulationStart
             if ((isAfter(d, simulationStart) || isSameDay(d, simulationStart)) && isBefore(d, simulationEnd)) {
                 events.push({
                     id: inst.id,
                     date: d,
                     amount: inst.amount,
                     type: 'PROJECT',
                     name: `${item.name}`,
                     accountId: inst.accountId
                 });
             }
          });
      });

      // B. Add Liabilities
      liabilities.forEach(l => {
          if(l.status === 'PENDING') {
              const d = parseISO(l.dueDate);
               // STRICT CHECK: Must be >= simulationStart
               if ((isAfter(d, simulationStart) || isSameDay(d, simulationStart)) && isBefore(d, simulationEnd)) {
                   events.push({
                       id: l.id,
                       date: d,
                       amount: l.amount,
                       type: 'LIABILITY',
                       name: l.name,
                       accountId: l.paymentAccountId
                   });
               }
          }
      });

      // C. Add Receivables
      receivables.forEach(r => {
          if (r.status === 'PENDING') {
              if (r.type === 'ONE_TIME') {
                  const d = parseISO(r.expectedDate);
                  // STRICT CHECK: Must be >= simulationStart
                  if ((isAfter(d, simulationStart) || isSameDay(d, simulationStart)) && isBefore(d, simulationEnd)) {
                      events.push({
                          id: r.id,
                          date: d,
                          amount: r.amount,
                          type: 'RECEIVABLE',
                          name: r.name,
                          accountId: r.targetAccountId
                      });
                  }
              } else if (r.type === 'RECURRING') {
                  // Generate occurrences
                  let iterDate = startOfMonth(simulationStart);
                  const baseDate = parseISO(r.expectedDate);
                  
                  while (isBefore(iterDate, simulationEnd)) {
                       const recurrenceDate = getRecurringDateInMonth(baseDate, iterDate);
                       
                       // STRICT CHECK: Must be >= simulationStart
                       if ((isAfter(recurrenceDate, simulationStart) || isSameDay(recurrenceDate, simulationStart)) && isBefore(recurrenceDate, simulationEnd)) {
                           events.push({
                               id: `${r.id}-${format(recurrenceDate, 'yyyy-MM')}`,
                               date: recurrenceDate,
                               amount: r.amount,
                               type: 'RECEIVABLE',
                               name: r.name,
                               accountId: r.targetAccountId,
                               isRecurring: true
                           });
                       }
                       iterDate = addMonths(iterDate, 1);
                  }
              }
          }
      });

      // Sort Events Chronologically
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      // 2. Simulate Balances
      const accountBalances: Record<string, number> = {};
      // Initialize with current actual balances
      accounts.forEach(acc => {
          accountBalances[acc.id] = getAccountBalance(acc.id);
      });

      // Identify accounts involved in the *Project* specifically (for compatibility view filtering)
      const projectAccountIds = new Set<string>();
      items.forEach(item => {
          item.installments.forEach(inst => projectAccountIds.add(inst.accountId));
      });

      // Structures for output
      const monthlyProjections: Record<string, Record<string, { start: number, end: number, min: number }>> = {};

      // Initialize Monthly Projection Structure for involved accounts
      let monIter = startOfMonth(simulationStart);
      while (isBefore(monIter, simulationEnd)) {
          const mKey = format(monIter, 'MMM yyyy');
          accounts.forEach(acc => {
              if (!monthlyProjections[acc.id]) monthlyProjections[acc.id] = {};
              monthlyProjections[acc.id][mKey] = {
                  start: 0, 
                  end: 0,
                  min: 0
              };
          });
          monIter = addMonths(monIter, 1);
      }

      // Clone balances for simulation
      const currentSimBalances = { ...accountBalances };

      // Helper to update monthly data
      const updateMonthData = (date: Date, accId: string, newBal: number) => {
          const mKey = format(date, 'MMM yyyy');
          if (monthlyProjections[accId] && monthlyProjections[accId][mKey]) {
              const rec = monthlyProjections[accId][mKey];
              rec.end = newBal;
              if (newBal < rec.min) rec.min = newBal;
          }
      };

      // Set initial monthly start/min/end for the first month based on current balance
      const startMKey = format(simulationStart, 'MMM yyyy');
      accounts.forEach(acc => {
           if (monthlyProjections[acc.id] && monthlyProjections[acc.id][startMKey]) {
               const b = currentSimBalances[acc.id];
               monthlyProjections[acc.id][startMKey] = { start: b, end: b, min: b };
           }
      });

      events.forEach(event => {
          const accId = event.accountId;
          if (currentSimBalances[accId] === undefined) currentSimBalances[accId] = 0;

          // Update Balance
          if (event.type === 'RECEIVABLE') {
              currentSimBalances[accId] += event.amount;
          } else {
              currentSimBalances[accId] -= event.amount; // Liability or Project
          }

          // Attach to event
          event.runningBalance = currentSimBalances[accId];

          // Update Monthly Record
          updateMonthData(event.date, accId, currentSimBalances[accId]);
      });

      // Post-process Monthly Projections
      const monthKeys: string[] = [];
      let m = startOfMonth(simulationStart);
      while (isBefore(m, simulationEnd)) {
          monthKeys.push(format(m, 'MMM yyyy'));
          m = addMonths(m, 1);
      }

      const finalProjectionData: Record<string, { month: string; startBalance: number; endBalance: number; minBalance: number }[]> = {};
      
      Array.from(projectAccountIds).forEach(accId => {
          const accData: any[] = [];
          let lastBalance = accountBalances[accId]; // Start with actual current balance

          monthKeys.forEach(mKey => {
              const recorded = monthlyProjections[accId][mKey];
              let start = lastBalance;
              let end = lastBalance;
              let min = lastBalance;

              // Filter events for this month/account from the main list to find true min/end
              const monthEvents = events.filter(e => e.accountId === accId && format(e.date, 'MMM yyyy') === mKey);
              
              if (monthEvents.length > 0) {
                  let running = start;
                  monthEvents.forEach(e => {
                      if (e.type === 'RECEIVABLE') running += e.amount;
                      else running -= e.amount;
                      if (running < min) min = running;
                  });
                  end = running;
              }

              accData.push({
                  month: mKey,
                  startBalance: start,
                  endBalance: end,
                  minBalance: min
              });

              lastBalance = end;
          });
          
          finalProjectionData[accId] = accData;
      });

      return { projectionData: finalProjectionData, timelineEvents: events };
  }, [items, accounts, liabilities, receivables, getAccountBalance, activeProject, filterStartDate, filterEndDate]);


  // --- Render Views ---

  if (view === 'list') {
      return (
          <div className="space-y-6 pb-20 md:pb-0">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Budget Estimations</h2>
                        <p className="text-slate-500 text-sm">Plan big purchases and check affordability.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium w-full sm:w-auto active:scale-95 duration-100"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Forecast
                    </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgetProjects.map(project => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onClick={() => openProject(project)} 
                            onDelete={(e) => deleteProject(project.id, e)}
                            formatCurrency={formatCurrency}
                        />
                    ))}
                    {budgetProjects.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="font-bold text-slate-600">No forecasts yet</p>
                            <p className="text-sm">Create a new project to start estimating costs.</p>
                        </div>
                    )}
               </div>

               {/* Create Modal */}
               {isCreateModalOpen && (
                   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                       <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                           <h3 className="text-lg font-bold text-slate-800 mb-4">New Forecast Project</h3>
                           <form onSubmit={handleCreateProject}>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                               <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-6"
                                    placeholder="e.g. New Gaming PC"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    required
                               />
                               <div className="flex justify-end gap-3">
                                   <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                                   <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium">Create</button>
                               </div>
                           </form>
                       </div>
                   </div>
               )}
          </div>
      );
  }

  // --- Detail View ---
  return (
      <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                  <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800">{activeProject?.name}</h2>
                      <p className="text-slate-500 text-xs">Edit items and payment plans to see impact.</p>
                  </div>
              </div>
              <button 
                onClick={handleSaveProject}
                className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-sm"
              >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
              </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Items & Configuration */}
              <div className="flex-1 space-y-8">
                  
                  {/* Item List */}
                  <div className="space-y-4">
                      {items.map((item) => {
                          const configuredAmount = item.installments.reduce((sum, i) => sum + i.amount, 0);
                          const isFullyConfigured = Math.abs(configuredAmount - item.totalPrice) < 0.01;
                          const isExpanded = expandedItemIds.has(item.id);

                          return (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 flex justify-between items-start bg-slate-50/50 border-b border-slate-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800">{item.name}</h4>
                                            {item.link && (
                                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-sm font-bold text-slate-600 mt-1">
                                            {formatCurrency(item.totalPrice)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => deleteItem(item.id)} 
                                            className="text-slate-400 hover:text-rose-500 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => toggleItemExpansion(item.id)}
                                            className="text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Configuration Area */}
                                <div className="p-4">
                                    {editingItemId === item.id ? (
                                        <div className="bg-indigo-50 rounded-xl p-4 animate-in fade-in">
                                            <h5 className="font-bold text-indigo-900 text-sm mb-3">Configure Payments</h5>
                                            <PaymentBuilder 
                                                totalPrice={item.totalPrice} 
                                                existingInstallments={item.installments}
                                                accounts={accounts}
                                                onSave={(newInstallments) => {
                                                    updateItemInstallments(item.id, newInstallments);
                                                    setEditingItemId(null);
                                                    // Auto-expand after saving to show results
                                                    const newSet = new Set(expandedItemIds);
                                                    newSet.add(item.id);
                                                    setExpandedItemIds(newSet);
                                                }}
                                                onCancel={() => setEditingItemId(null)}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            {item.installments.length > 0 ? (
                                                <>
                                                    {isExpanded ? (
                                                        <div className="space-y-2 mb-3">
                                                            {item.installments.map(inst => {
                                                                const acc = accounts.find(a => a.id === inst.accountId);
                                                                return (
                                                                    <div key={inst.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 last:border-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                                            <span className="text-slate-600">{format(parseISO(inst.date), 'MMM dd, yyyy')}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{acc?.name}</span>
                                                                            <span className="font-bold text-slate-700">{formatCurrency(inst.amount)}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 mb-3 italic">
                                                            {item.installments.length} installments configured. Expand to view.
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                                                        <div className={`text-xs font-bold ${isFullyConfigured ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                            {isFullyConfigured ? 'Fully Allocation' : `Remaining: ${formatCurrency(item.totalPrice - configuredAmount)}`}
                                                        </div>
                                                        <button 
                                                            onClick={() => setEditingItemId(item.id)}
                                                            className="text-xs font-semibold text-indigo-600 hover:underline"
                                                        >
                                                            Edit Plan
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => setEditingItemId(item.id)}
                                                    className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                                                >
                                                    Configure Payment Plan
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                          );
                      })}
                  </div>

                  {/* Add Item Form */}
                  <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-3 text-sm">Add Product / Service</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <input 
                            className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500"
                            placeholder="Product Name"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                          />
                          <input 
                            className="px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500"
                            placeholder="Price"
                            type="number"
                            value={newItemPrice}
                            onChange={e => setNewItemPrice(e.target.value)}
                          />
                           <input 
                            className="px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500"
                            placeholder="Link (Optional)"
                            value={newItemLink}
                            onChange={e => setNewItemLink(e.target.value)}
                          />
                      </div>
                      <button 
                        onClick={addItemToProject}
                        disabled={!newItemName || !newItemPrice}
                        className="w-full py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-white hover:text-indigo-600 hover:border-indigo-300 transition-colors disabled:opacity-50"
                      >
                          Add Item
                      </button>
                  </div>

                  {/* Projected Cash Flow Timeline */}
                  {timelineEvents.length > 0 && (
                      <div className="mt-8">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-slate-800 flex items-center">
                                 <Calendar className="w-5 h-5 mr-2 text-slate-500" />
                                 Projected Cash Flow
                              </h3>
                              <div className="flex gap-2">
                                  <input 
                                    type="date" 
                                    value={filterStartDate}
                                    onChange={e => setFilterStartDate(e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                                  <span className="text-slate-400 self-center">-</span>
                                  <input 
                                    type="date" 
                                    value={filterEndDate}
                                    onChange={e => setFilterEndDate(e.target.value)}
                                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                              </div>
                          </div>
                          
                          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-50 border-b border-slate-100">
                                          <tr>
                                              <th className="px-4 py-3 font-semibold text-slate-500">Date</th>
                                              <th className="px-4 py-3 font-semibold text-slate-500">Item</th>
                                              <th className="px-4 py-3 font-semibold text-slate-500">Account</th>
                                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Amount</th>
                                              <th className="px-4 py-3 font-semibold text-slate-500 text-right">Balance</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {timelineEvents.map((event, idx) => {
                                              const acc = accounts.find(a => a.id === event.accountId);
                                              const isIncome = event.type === 'RECEIVABLE';
                                              const isProject = event.type === 'PROJECT';
                                              
                                              return (
                                                  <tr key={`${event.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                          {format(event.date, 'MMM dd, yyyy')}
                                                          {event.isRecurring && (
                                                              <span className="ml-2 inline-flex items-center text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100" title="Recurring">
                                                                  <RefreshCcw className="w-3 h-3" />
                                                              </span>
                                                          )}
                                                      </td>
                                                      <td className="px-4 py-3">
                                                          <div className="flex items-center gap-2">
                                                              {isProject ? (
                                                                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                                                      <Calculator className="w-3 h-3" />
                                                                  </div>
                                                              ) : isIncome ? (
                                                                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                                                                      <ArrowDownRight className="w-3 h-3" />
                                                                  </div>
                                                              ) : (
                                                                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded">
                                                                      <ScrollText className="w-3 h-3" />
                                                                  </div>
                                                              )}
                                                              <span className="font-medium text-slate-700">{event.name}</span>
                                                          </div>
                                                      </td>
                                                      <td className="px-4 py-3 text-slate-500">
                                                          {acc ? (
                                                              <div className="flex items-center gap-1.5">
                                                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: acc.color}} />
                                                                  {acc.name}
                                                              </div>
                                                          ) : '-'}
                                                      </td>
                                                      <td className={`px-4 py-3 font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                          {isIncome ? '+' : '-'}{formatCurrency(event.amount)}
                                                      </td>
                                                      <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">
                                                          {event.runningBalance !== undefined ? formatCurrency(event.runningBalance) : '-'}
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Right Column: Compatibility Overview */}
              <div className="lg:w-96 flex-shrink-0">
                  <div className="sticky top-6 space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          Compatibility Check
                      </h3>
                      
                      {projectionData && Object.keys(projectionData).length > 0 ? (
                          Object.entries(projectionData).map(([accId, months]) => {
                              const account = accounts.find(a => a.id === accId);
                              if(!account) return null;

                              return (
                                  <div key={accId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                      <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: account.color}} />
                                          {account.name}
                                      </div>
                                      <div className="divide-y divide-slate-50">
                                          {(months as any[]).map(m => {
                                              const isLow = m.minBalance < 0;
                                              return (
                                                  <div key={m.month} className="p-3 flex justify-between items-center">
                                                      <div>
                                                          <div className="text-xs font-bold text-slate-500 uppercase">{m.month}</div>
                                                          <div className={`text-xs ${isLow ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                                              Min: {formatCurrency(m.minBalance)}
                                                          </div>
                                                      </div>
                                                      <div className="text-right">
                                                          <div className="font-bold text-slate-700 text-sm">{formatCurrency(m.endBalance)}</div>
                                                          <span className="text-[10px] text-slate-400">Closing</span>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              );
                          })
                      ) : (
                          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-sm">
                              Add items and configure payment plans to see projected account balances.
                          </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-xs leading-relaxed border border-blue-100">
                          <AlertTriangle className="w-4 h-4 mb-2 inline-block mr-1" />
                          <strong>Note:</strong> Projections include all current recurring income and pending bills, plus the installments defined here.
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};

// --- Helper: Payment Builder Component ---

const PaymentBuilder: React.FC<{ 
    totalPrice: number; 
    existingInstallments: BudgetInstallment[]; 
    accounts: Account[];
    onSave: (i: BudgetInstallment[]) => void;
    onCancel: () => void;
}> = ({ totalPrice, existingInstallments, accounts, onSave, onCancel }) => {
    // Determine initial count. If 0 existing, default to 1.
    const initialCount = existingInstallments.length > 0 ? existingInstallments.length : 1;
    const [installmentsCount, setInstallmentsCount] = useState<number>(initialCount);

    const [installments, setInstallments] = useState<BudgetInstallment[]>(
        existingInstallments.length > 0 ? existingInstallments : [{
            id: crypto.randomUUID(),
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: totalPrice,
            accountId: accounts[0]?.id || ''
        }]
    );

    // Auto-calculate splits when count changes
    const handleCountChange = (newCount: number) => {
        if (newCount < 1) newCount = 1;
        setInstallmentsCount(newCount);

        const newInstallments: BudgetInstallment[] = [];
        const baseAmount = Math.floor((totalPrice / newCount) * 100) / 100;
        let remainder = totalPrice - (baseAmount * newCount);
        // Fix floating point issues
        remainder = Math.round(remainder * 100) / 100;

        for (let i = 0; i < newCount; i++) {
            // Distribute remainder pennies to the first few installments
            let amount = baseAmount;
            if (remainder > 0) {
                amount += 0.01;
                remainder -= 0.01;
            }

            newInstallments.push({
                id: crypto.randomUUID(),
                date: format(addMonths(new Date(), i), 'yyyy-MM-dd'), // Consecutive months
                amount: Number(amount.toFixed(2)),
                accountId: accounts[0]?.id || '' // Default to first account
            });
        }
        setInstallments(newInstallments);
    };

    const allocated = installments.reduce((sum, i) => sum + i.amount, 0);
    const remaining = totalPrice - allocated;
    const isValid = Math.abs(remaining) < 0.01 && installments.every(i => i.amount > 0 && i.accountId && i.date);

    const updateRow = (id: string, field: keyof BudgetInstallment, value: any) => {
        setInstallments(installments.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeRow = (id: string) => {
        const newInst = installments.filter(i => i.id !== id);
        setInstallments(newInst);
        setInstallmentsCount(newInst.length);
    };

    return (
        <div className="space-y-4">
            {/* Auto-Split Control */}
            <div className="bg-white p-3 rounded-lg border border-indigo-100 flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-indigo-900">Number of Installments:</label>
                <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={installmentsCount}
                    onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 border border-indigo-200 rounded-md text-center font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="space-y-3">
                {installments.map((inst, idx) => (
                    <div key={inst.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                         <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                        <input 
                            type="date" 
                            value={inst.date}
                            onChange={e => updateRow(inst.id, 'date', e.target.value)}
                            className="w-full md:w-auto px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                        />
                        <select
                            value={inst.accountId}
                            onChange={e => updateRow(inst.id, 'accountId', e.target.value)}
                            className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                        >
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <div className="relative w-full md:w-32">
                            <input 
                                type="number" 
                                value={inst.amount}
                                onChange={e => updateRow(inst.id, 'amount', Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                            />
                            <DollarSign className="w-3 h-3 absolute left-2 top-2.5 text-slate-400" />
                        </div>
                        {installments.length > 1 && (
                            <button onClick={() => removeRow(inst.id)} className="text-slate-400 hover:text-rose-500">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-indigo-100">
                <span className={remaining !== 0 ? 'text-rose-500' : 'text-emerald-600'}>
                    Remaining: {remaining.toFixed(2)}
                </span>
                <span className="text-slate-400">
                    Total: {totalPrice.toFixed(2)}
                </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button 
                    onClick={() => onSave(installments)} 
                    disabled={!isValid}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    Confirm Plan
                </button>
            </div>
        </div>
    );
};

// Simple X icon for helper component
const X: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Budget;