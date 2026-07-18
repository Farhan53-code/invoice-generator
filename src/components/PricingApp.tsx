import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { getUserMeta, addAuditLog, type UserMeta } from "../utils/db";
import { 
  Check, 
  HelpCircle, 
  Sparkles, 
  CreditCard, 
  Lock, 
  ArrowRight,
  Shield,
  Info 
} from "lucide-react";

export default function PricingApp() {
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const meta = await getUserMeta(currentUser.uid);
          setUserMeta(meta);
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSimulateCheckout = async () => {
    if (!user) {
      alert("Please log in or register a free account before initiating upgrade sessions.");
      window.location.href = "/login";
      return;
    }

    const confirmUpgrade = confirm(`[STRIPE SIMULATED CHECKOUT] Setup secure payment subscription for Secura Premium (${billingCycle === "monthly" ? "$10/mo" : "$100/yr"})? This will authorize unlimited passwords, custom invoice templates, and active reminders.`);
    if (!confirmUpgrade) return;

    try {
      setLoading(true);
      await addAuditLog(user.uid, user.email, "Membership Upgraded", `Upgraded account subscription to Premium (${billingCycle} plan)`);
      alert("Stripe sandbox checkout session verified! Your account is now provisioned with unlimited Premium benefits.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const featuresList = [
    { name: "Zero-knowledge encrypted password storage", free: "Up to 15 items", premium: "Unlimited entries" },
    { name: "Freelance invoice creations & PDF print exports", free: "Up to 5 items", premium: "Unlimited entries" },
    { name: "Personal category budgets & envelope planner", free: "1 active category", premium: "Unlimited entries" },
    { name: "Document Expiry Alerts with Days Countdown", free: "Disabled", premium: "Unlimited entries" },
    { name: "Interactive Global Command Palette Console (⌘K)", free: "Basic controls", premium: "Complete control suite" },
    { name: "Secure activity log tracking audit logs", free: "Standard log", premium: "Deep audit log (180 days)" },
    { name: "Database server uptime SLA guarantee", free: "Standard support", premium: "Priority support SLA" }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-8 animate-pulse bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mb-6" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* HEADER TITLE */}
      <div className="text-center max-w-xl mx-auto mb-6">
        <p className="text-[10px] font-mono tracking-wider uppercase text-indigo-500 font-bold mb-2">UPGRADE MEMBERSHIP</p>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Fair, stark pricing for every digital worker.</h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed">
          Start for free to explore our zero-knowledge architecture. Lock in premium pricing whenever you need professional productivity levels.
        </p>
      </div>

      {/* BILLING CYCLE SELECTOR */}
      <div className="flex justify-center mb-4">
        <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-850 p-1 rounded-full flex gap-1 text-xs">
          <button 
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
              billingCycle === "monthly" 
                ? "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-xs" 
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            Bill Monthly
          </button>
          <button 
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
              billingCycle === "yearly" 
                ? "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-xs" 
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            <span>Bill Annually</span>
            <span className="text-[9px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-bold px-1.5 py-0.2 rounded-full font-mono">SAVE 15%</span>
          </button>
        </div>
      </div>

      {/* TIERED CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch mb-10">
        
        {/* Free plan */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">Starter Tier</h3>
              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[9px] font-mono text-neutral-500 font-bold">FREE PLAN</span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-neutral-900 dark:text-white">$0</span>
              <span className="text-neutral-400 text-xs">/ forever free</span>
            </div>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Explore our core zero-knowledge encryption engine. Lock down vital credentials and draft simple freelance invoices.
            </p>
            <div className="border-t border-neutral-100 dark:border-neutral-850/80 pt-5 flex flex-col gap-3">
              <div className="flex gap-2.5 items-start text-xs text-neutral-600 dark:text-neutral-300">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Up to 15 credentials in local vault</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs text-neutral-600 dark:text-neutral-300">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Up to 5 freelance invoice items</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs text-neutral-600 dark:text-neutral-300">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>1 Category budget goal tracker</span>
              </div>
            </div>
          </div>
          <a 
            href="/dashboard" 
            className="w-full h-10 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all cursor-pointer mt-8"
          >
            Access Active Workspace
          </a>
        </div>

        {/* Premium plan */}
        <div className="bg-neutral-950 text-white dark:bg-white dark:text-black border border-indigo-500 p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-xl hover:scale-[1.01] transition-all">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-mono uppercase tracking-widest px-4 py-1 font-bold rounded-bl-xl shadow-xs">
            RECOMMENDED
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">Premium Suite</h3>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 dark:text-indigo-600 rounded text-[9px] font-mono font-bold">UNLIMITED</span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white dark:text-neutral-950">
                {billingCycle === "monthly" ? "$10" : "$8"}
              </span>
              <span className="text-neutral-400 text-xs">/ month, billed {billingCycle}</span>
            </div>
            <p className="text-xs text-neutral-350 dark:text-neutral-600 mb-6 leading-relaxed">
              Dismantle operational limits. Lock down infinite passwords, generate high-fidelity freelancer client billings, and setup document countdown alerts.
            </p>
            <div className="border-t border-neutral-800 dark:border-neutral-100/80 pt-5 flex flex-col gap-3">
              <div className="flex gap-2.5 items-start text-xs text-neutral-200 dark:text-neutral-700">
                <Check className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0 mt-0.5" />
                <span className="font-bold text-white dark:text-black">Infinite encrypted passwords records</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs text-neutral-200 dark:text-neutral-700">
                <Check className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0 mt-0.5" />
                <span>Infinite freelance invoices & print exports</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs text-neutral-200 dark:text-neutral-700">
                <Check className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0 mt-0.5" />
                <span>Infinite envelope category budget targets</span>
              </div>
              <div className="flex gap-2.5 items-start text-xs text-neutral-200 dark:text-neutral-700">
                <Check className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0 mt-0.5" />
                <span>Live Expiry Countdown alerts active</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSimulateCheckout}
            className="w-full h-10 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white font-bold rounded-lg text-xs flex items-center justify-center hover:opacity-95 transition-all cursor-pointer mt-8 shadow-md"
          >
            Upgrade Account Premium
          </button>
        </div>

      </div>

      {/* COMPREHENSIVE TIER FEATURE MATRIX */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>Feature Matrix Comparison</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-4">Feature Segment</th>
                <th className="py-2.5 px-4">Starter (Free)</th>
                <th className="py-2.5 px-4 font-bold text-neutral-800 dark:text-neutral-200">Premium Upgrade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {featuresList.map((f, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10">
                  <td className="py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-350">{f.name}</td>
                  <td className="py-3 px-4 text-neutral-400">{f.free}</td>
                  <td className="py-3 px-4 font-bold text-indigo-500">{f.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
