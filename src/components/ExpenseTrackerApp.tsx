import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchExpenses, 
  addExpense, 
  deleteExpense, 
  fetchBudgets, 
  addAuditLog,
  type ExpenseRecord,
  type BudgetRecord
} from "../utils/db";
import { 
  Plus, 
  DollarSign, 
  Trash2, 
  ChevronRight, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  PieChart,
  X 
} from "lucide-react";

export default function ExpenseTrackerApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  
  // Create Modal state
  const [showForm, setShowForm] = useState<boolean>(false);
  
  // Fields state
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card");
  const [merchant, setMerchant] = useState<string>("");
  const [date, setDate] = useState<string>("");

  // Load datasets
  const loadData = async (uid: string) => {
    try {
      const [eList, bList] = await Promise.all([
        fetchExpenses(uid),
        fetchBudgets(uid)
      ]);
      setExpenses(eList);
      setBudgets(bList);
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

    const record: Omit<ExpenseRecord, "id"> = {
      userId: user.uid,
      description,
      amount,
      category,
      paymentMethod,
      merchant,
      date: date || new Date().toISOString().slice(0, 10),
      isDeleted: false,
      createdDate: new Date().toISOString()
    };

    try {
      // Save expense (auto-triggers category recalibration in db.ts)
      await addExpense(record);

      await loadData(user.uid);

      // Reset
      setShowForm(false);
      setDescription("");
      setAmount(0);
      setCategory("");
      setMerchant("");
      setDate("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string, expAmount: number, expCategory: string, desc: string) => {
    if (!user) return;
    if (confirm(`Delete the transaction record for "${desc}"?`)) {
      try {
        await deleteExpense(id, user.uid);
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
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  const totalSpentAllTime = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Expense Tracker</h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Log raw transactions. Linked budget cards dynamically recalculate spending metrics.
          </p>
        </div>

        <button 
          onClick={() => {
            if (budgets.length === 0) {
              alert("Please establish at least one budget category in the Budget Planner before logging expenses.");
              return;
            }
            setCategory(budgets[0].category);
            setShowForm(true);
          }}
          className="h-9 px-4 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Track Transaction</span>
        </button>
      </div>

      {/* QUICK INSIGHTS SUMMARY PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/25 text-red-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Aggregate Spent</span>
            <p className="text-xl font-black mt-1 text-red-500">${totalSpentAllTime.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/25 text-blue-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Transactions Logged</span>
            <p className="text-xl font-black mt-1">{expenses.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/25 text-indigo-500 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Active Budgets Linked</span>
            <p className="text-xl font-black mt-1">{budgets.length}</p>
          </div>
        </div>
      </div>

      {/* EXPENSES HISTORIC LOG LIST */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">TRANSACTION HISTORY</h3>
          <span className="text-[10px] text-neutral-400">Chronological transaction stream</span>
        </div>

        <div className="overflow-x-auto">
          {expenses.length > 0 ? (
            <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Merchant Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10 transition-all">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-150">{exp.merchant}</p>
                        <p className="text-[10px] text-neutral-400">{exp.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">{exp.date}</td>
                    <td className="py-3 px-4">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-500 font-mono text-sm">
                      -${exp.amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => handleDeleteExpense(exp.id!, exp.amount, exp.category, exp.merchant || "")}
                        className="w-7 h-7 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-lg flex items-center justify-center cursor-pointer transition-all mx-auto mr-0"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-neutral-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-xs font-semibold">No transactions logged yet.</p>
              <p className="text-[10px] text-neutral-400 mt-1">Tap "Track Transaction" to start recording expenses.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TRANSACTION MODAL OVERLAY */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/30 dark:bg-neutral-950/60 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Track Outflow Transaction</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Merchant / Recipient Name</label>
                <input 
                  type="text" 
                  value={merchant} 
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Description / Notes</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly server hosting ingress charges"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Outflow Amount ($)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                    required 
                    min={0.01}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Transaction Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Relational Budget Link</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 outline-none"
                    required
                  >
                    {budgets.map(b => (
                      <option key={b.id} value={b.category}>{b.category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Wire</option>
                    <option value="PayPal">PayPal Account</option>
                    <option value="Crypto">Crypto Wallet</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full h-10 bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-all"
              >
                Log Outflow Record
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
