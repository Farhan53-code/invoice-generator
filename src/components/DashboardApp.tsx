import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchPasswords, 
  fetchInvoices, 
  fetchBudgets, 
  fetchExpenses, 
  fetchReminders,
  fetchAllAuditLogs,
  getUserMeta,
  type UserMeta,
  type InvoiceRecord,
  type ExpenseRecord,
  type ReminderRecord,
  type BudgetRecord
} from "../utils/db";
import { 
  Lock, 
  FileText, 
  PieChart, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Activity, 
  Bell, 
  ShieldAlert, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  User,
  Plus
} from "lucide-react";

export default function DashboardApp() {
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Stats Counters
  const [passwordsCount, setPasswordsCount] = useState<number>(0);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const meta = await getUserMeta(currentUser.uid);
          setUserMeta(meta);

          // Fetch metrics concurrently
          const [pList, iList, bList, eList, rList, logList] = await Promise.all([
            fetchPasswords(currentUser.uid),
            fetchInvoices(currentUser.uid),
            fetchBudgets(currentUser.uid),
            fetchExpenses(currentUser.uid),
            fetchReminders(currentUser.uid),
            fetchAllAuditLogs()
          ]);

          setPasswordsCount(pList.length);
          setInvoices(iList);
          setBudgets(bList);
          setExpenses(eList);
          setReminders(rList);
          
          // Filter logs to show only current user
          const userLogs = logList.filter(log => log.userId === currentUser.uid).slice(0, 5);
          setAuditLogs(userLogs);
        } catch (err) {
          console.error("Failed to load dashboard statistics:", err);
        }
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Compute calculated metrics
  const totalPaidRevenue = invoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const totalMonthlyExpenses = expenses
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const activeBudgetsSpentSum = budgets
    .reduce((sum, b) => sum + (b.spentAmount || 0), 0);

  const activeBudgetsLimitSum = budgets
    .reduce((sum, b) => sum + (b.limitAmount || 0), 0);

  const budgetRatio = activeBudgetsLimitSum > 0 
    ? Math.min(100, Math.round((activeBudgetsSpentSum / activeBudgetsLimitSum) * 100))
    : 0;

  // Find urgent expirations (expiring in less than 30 days)
  const urgentReminders = reminders.filter(r => {
    const expDate = new Date(r.expiryDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-8 gap-6 animate-pulse bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
          <div className="md:col-span-8 h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="md:col-span-4 h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* 1. GREETING HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400 font-black">{user?.email?.split("@")[0]}</span>.
          </h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            System status is operational. All local cryptography operations are fully loaded.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200/50 dark:border-neutral-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            UTC: {new Date().toISOString().slice(11, 16)}
          </span>
          <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200/50 dark:border-neutral-800/80 px-2.5 py-1 rounded-full uppercase">
            {userMeta?.isAdmin ? "Admin Role" : "Free Plan Account"}
          </span>
        </div>
      </div>

      {/* 2. DYNAMIC ANALYTICS STATS METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Passwords Metric */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Passwords Saved</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-neutral-950 dark:text-white leading-none">{passwordsCount}</p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-knowledge client encrypted</span>
            </p>
          </div>
        </div>

        {/* Invoice revenue metric */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Invoiced Earnings</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-neutral-950 dark:text-white leading-none">
              ${totalPaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1">
              <span>{invoices.length} invoices generated in total</span>
            </p>
          </div>
        </div>

        {/* Budget spend metric */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Monthly Budgets</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-500 dark:text-pink-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-baseline leading-none">
              <p className="text-2xl font-black text-neutral-950 dark:text-white">{budgetRatio}%</p>
              <span className="text-[10px] text-neutral-400">${activeBudgetsSpentSum}/${activeBudgetsLimitSum}</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full" style={{ width: `${budgetRatio}%` }} />
            </div>
          </div>
        </div>

        {/* Expiry alerts metric */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Expiry Reminders</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-neutral-950 dark:text-white leading-none">{reminders.length}</p>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>{urgentReminders.length} documents expiring soon</span>
            </p>
          </div>
        </div>

      </div>

      {/* 3. DUAL COLUMN DETAILS (WIDGET LAYOUTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Module fast-actions and audit logs */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* FAVORITE MODULE WORKSPACES */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest mb-4">LAUNCH ACTIVE TOOLS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/password-manager"
                className="group p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/30 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-500 transition-colors">Credential Manager</h4>
                    <p className="text-[10px] text-neutral-400">Zero-knowledge local vault</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              <a 
                href="/invoice-generator"
                className="group p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/30 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-500 transition-colors">Freelancer Invoices</h4>
                    <p className="text-[10px] text-neutral-400">Print client billing receipts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              <a 
                href="/budget-planner"
                className="group p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/30 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center rounded-lg">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-500 transition-colors">Personal Budget Planner</h4>
                    <p className="text-[10px] text-neutral-400">Manage category limits</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              <a 
                href="/expiry-reminder"
                className="group p-4 rounded-xl border border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/30 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-500 transition-colors">Document Expirations</h4>
                    <p className="text-[10px] text-neutral-400">Track passport countdowns</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>

          {/* DYNAMIC AUDIT LOGS / RECENT ACTIVITY TABLE */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Recent Audit Activity Logs</span>
              </h3>
              <span className="text-[10px] text-neutral-400">Secure Audit active</span>
            </div>

            <div className="overflow-x-auto">
              {auditLogs.length > 0 ? (
                <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
                  <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-150 dark:border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Subject / Event</th>
                      <th className="py-2.5 px-3">Details Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/85">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10">
                        <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <p className="text-xs">No activity has been logged inside this workspace yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Checklist, Uptime stats, Premium upgrade card */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* SECURA SETUP CHECKLIST */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest mb-4">SETUP CHECKLIST</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-through decoration-neutral-400/50">Establish master vault</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Zero-knowledge verifier generated.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  passwordsCount > 0 
                    ? "bg-indigo-500/20 text-indigo-500" 
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${passwordsCount > 0 ? "line-through text-neutral-500 decoration-neutral-400/50" : "text-neutral-800 dark:text-neutral-200"}`}>Store first encrypted credential</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Add an item inside the Password Manager.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  invoices.length > 0 
                    ? "bg-indigo-500/20 text-indigo-500" 
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${invoices.length > 0 ? "line-through text-neutral-500 decoration-neutral-400/50" : "text-neutral-800 dark:text-neutral-200"}`}>Generate freelance invoice</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Create and download client receipt billing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC EXPIRY REMINDERS SUMMARY WARNING */}
          {urgentReminders.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/25 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                <span className="text-xs uppercase tracking-wider font-mono">CRITICAL DOCUMENT ALERT</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                You have {urgentReminders.length} document{urgentReminders.length > 1 ? "s" : ""} expiring inside the next 30 days! Immediate renewal requested.
              </p>
              <div className="flex flex-col gap-2 bg-white/50 dark:bg-neutral-900/40 p-3 rounded-lg border border-red-500/10">
                {urgentReminders.slice(0, 2).map(r => (
                  <div key={r.id} className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{r.documentName}</span>
                    <span className="font-mono text-red-500">{r.expiryDate}</span>
                  </div>
                ))}
              </div>
              <a href="/expiry-reminder" className="text-xs text-red-600 dark:text-red-400 hover:underline font-bold flex items-center gap-1 mt-1 self-start">
                <span>Access Reminders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* UPGRADE PREMIUM CTA BANNER (Linear themed) */}
          <div className="bg-gradient-to-br from-indigo-900 via-neutral-950 to-neutral-900 border border-indigo-500/30 p-6 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -z-10" />
            
            <div>
              <div className="inline-flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3 h-3 text-indigo-400" /> PRO ACCESS
              </div>
              <h4 className="text-sm font-black leading-snug">Power up with absolute zero-knowledge freedom.</h4>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Unlock unlimited passwords, dynamic budget aggregators, print invoice PDFs, and infinite expiry reminders.
              </p>
            </div>

            <a 
              href="/pricing"
              className="h-9 mt-6 bg-white text-black font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-md"
            >
              <span>Upgrade Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
