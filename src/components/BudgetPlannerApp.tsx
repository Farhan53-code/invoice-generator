import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchBudgets, 
  addBudget, 
  deleteBudget, 
  addAuditLog,
  type BudgetRecord
} from "../utils/db";
import { 
  Plus, 
  PieChart, 
  TrendingUp, 
  Trash2, 
  Edit, 
  ChevronRight, 
  DollarSign, 
  Percent, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";

export default function BudgetPlannerApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  
  // Modal toggle state
  const [showForm, setShowForm] = useState<boolean>(false);
  
  // Form fields state
  const [categoryName, setCategoryName] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<number>(0);

  // Load budgets records
  const loadData = async (uid: string) => {
    try {
      const list = await fetchBudgets(uid);
      setBudgets(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser.uid);
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const record: Omit<BudgetRecord, "id"> = {
      userId: user.uid,
      category: categoryName,
      limitAmount,
      spentAmount: 0, // initially zero
      period: "monthly",
      isDeleted: false,
      createdDate: new Date().toISOString()
    };

    try {
      await addBudget(record);
      await loadData(user.uid);
      
      // Reset
      setShowForm(false);
      setCategoryName("");
      setLimitAmount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (confirm(`Are you sure you want to delete the budget goal for "${name}"?`)) {
      try {
        await deleteBudget(id, user.uid);
        await loadData(user.uid);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 animate-pulse bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mb-6" />
        <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-6" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  // Calculate sum counts for analytics header
  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const remainingBudget = totalBudgeted - totalSpent;
  const globalRatio = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Personal Budget Planner</h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Establish modular spending targets. Automatic transaction links recalculate balances.
          </p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="h-9 px-4 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Set Spending Target</span>
        </button>
      </div>

      {/* METRICS INSIGHTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Overall progress visual block */}
        <div className="md:col-span-4 bg-neutral-950 dark:bg-neutral-900 border border-neutral-800 dark:border-neutral-850 p-6 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -z-10" />
          <div>
            <p className="text-[10px] font-mono tracking-widest text-neutral-400 font-bold uppercase">GLOBAL SPENDING INTENSITY</p>
            <p className="text-3xl font-black mt-2">{globalRatio}%</p>
            <p className="text-[10px] text-neutral-400 mt-1">Ratio of spent against aggregated targets.</p>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full" style={{ width: `${globalRatio}%` }} />
          </div>
        </div>

        {/* Breakdown parameters */}
        <div className="md:col-span-8 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xs">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Aggregated Target</span>
            <p className="text-2xl font-black text-neutral-800 dark:text-white mt-1.5">${totalBudgeted.toLocaleString()}</p>
          </div>
          <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-x border-neutral-100 dark:border-neutral-800/70 pt-4 sm:pt-0 sm:px-6">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Active Expenditure</span>
            <p className="text-2xl font-black text-neutral-800 dark:text-white mt-1.5">${totalSpent.toLocaleString()}</p>
          </div>
          <div className="flex flex-col justify-center pt-4 sm:pt-0">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Safe Envelope Buffer</span>
            <p className={`text-2xl font-black mt-1.5 ${remainingBudget < 0 ? "text-red-500" : "text-emerald-500"}`}>
              ${remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>

      </div>

      {/* DETAILED BUDGET LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length > 0 ? (
          budgets.map((b) => {
            const ratio = b.limitAmount > 0 ? Math.round((b.spentAmount / b.limitAmount) * 100) : 0;
            const remaining = b.limitAmount - b.spentAmount;
            
            let statusColor = "from-cyan-400 to-indigo-500";
            let textColor = "text-indigo-500";
            if (ratio >= 100) {
              statusColor = "from-red-500 to-rose-600";
              textColor = "text-red-500 font-extrabold animate-pulse";
            } else if (ratio >= 75) {
              statusColor = "from-amber-400 to-orange-500";
              textColor = "text-amber-500 font-bold";
            }

            return (
              <div 
                key={b.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs">{b.category}</h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Established {new Date(b.createdDate || "").toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(b.id!, b.category)}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] text-neutral-400 font-mono">Limit target: ${b.limitAmount}</span>
                    <span className={`text-xs font-mono font-bold ${textColor}`}>Spent: {ratio}%</span>
                  </div>

                  {/* Horizontal progress */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className={`bg-gradient-to-r ${statusColor} h-full`} style={{ width: `${Math.min(100, ratio)}%` }} />
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800/70 mt-4.5 pt-3.5 flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">Remaining Envelopes:</span>
                  <span className={`font-mono font-bold ${remaining < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-14 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <PieChart className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-xs font-semibold">No budget categories have been configured.</p>
            <p className="text-[10px] mt-1 text-neutral-400">Add spending limits to start managing your budget envelopes.</p>
          </div>
        )}
      </div>

      {/* CREATE NEW TARGET MODAL DIALOG */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/30 dark:bg-neutral-950/60 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">New Budget Category Limit</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName} 
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Server Infrastructure, AWS, Dining"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Monthly Spending Cap ($)</label>
                <input 
                  type="number" 
                  value={limitAmount} 
                  onChange={(e) => setLimitAmount(Number(e.target.value))}
                  placeholder="e.g. 1500"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                  min={1}
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-10 bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-all"
              >
                Establish Budget Target
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
