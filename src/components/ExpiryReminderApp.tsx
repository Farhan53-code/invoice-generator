import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchReminders, 
  addReminder, 
  deleteReminder, 
  addAuditLog,
  type ReminderRecord
} from "../utils/db";
import { 
  Plus, 
  Calendar, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  X 
} from "lucide-react";

export default function ExpiryReminderApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  
  // Create Modal state
  const [showForm, setShowForm] = useState<boolean>(false);

  // Fields state
  const [documentName, setDocumentName] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("Passport");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState<string>("");

  // Load reminders
  const loadData = async (uid: string) => {
    try {
      const list = await fetchReminders(uid);
      setReminders(list);
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

    const record: Omit<ReminderRecord, "id"> = {
      userId: user.uid,
      documentName,
      category: documentType,
      expiryDate,
      documentNumber,
      isDeleted: false,
      createdDate: new Date().toISOString()
    };

    try {
      await addReminder(record);
      await loadData(user.uid);

      // Reset
      setShowForm(false);
      setDocumentName("");
      setDocumentType("Passport");
      setExpiryDate("");
      setDocumentNumber("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (confirm(`Remove the expiry tracker for "${name}"?`)) {
      try {
        await deleteReminder(id, user.uid);
        await loadData(user.uid);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRenew = async (id: string, name: string) => {
    if (!user) return;
    const newDate = prompt(`Verify document renewal. Enter the new Expiration Date (YYYY-MM-DD) for "${name}":`);
    if (!newDate) return;

    try {
      // For renewals, simply delete the old and save a new updated record to maintain database consistency
      await deleteReminder(id, user.uid);
      
      const record: Omit<ReminderRecord, "id"> = {
        userId: user.uid,
        documentName: `${name} (Renewed)`,
        category: documentType,
        expiryDate: newDate,
        documentNumber,
        isDeleted: false,
        createdDate: new Date().toISOString()
      };

      await addReminder(record);
      await loadData(user.uid);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (expStr: string) => {
    const expDate = new Date(expStr);
    const today = new Date();
    // Zero out hours
    expDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 animate-pulse bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mb-6" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  // Segmenting countdowns
  const urgentCount = reminders.filter(r => getDaysRemaining(r.expiryDate) <= 14).length;
  const warningCount = reminders.filter(r => {
    const days = getDaysRemaining(r.expiryDate);
    return days > 14 && days <= 30;
  }).length;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Document Expiry Reminders</h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Track expirations for critical visas, driver's licenses, and service agreements safely.
          </p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="h-9 px-4 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Monitor Document</span>
        </button>
      </div>

      {/* SEGMENT METRICS HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/25 text-red-500 flex items-center justify-center shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Urgent (≤ 14 Days)</span>
            <p className="text-xl font-black mt-1 text-red-500">{urgentCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-150 dark:bg-amber-950/25 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Warning (≤ 30 Days)</span>
            <p className="text-xl font-black mt-1 text-amber-500">{warningCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/25 text-green-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Safe Tracking</span>
            <p className="text-xl font-black mt-1 text-green-500">{reminders.length - urgentCount - warningCount}</p>
          </div>
        </div>
      </div>

      {/* DETAILED CARDS VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.length > 0 ? (
          reminders.map((r) => {
            const daysLeft = getDaysRemaining(r.expiryDate);
            
            let cardBorder = "border-neutral-200/60 dark:border-neutral-800/60";
            let daysLabel = `${daysLeft} days remaining`;
            let statusBadge = (
              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded text-[9px] font-mono font-bold uppercase">Active</span>
            );

            if (daysLeft < 0) {
              cardBorder = "border-red-500";
              daysLabel = `EXPIRED (${Math.abs(daysLeft)} days ago)`;
              statusBadge = (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded text-[9px] font-mono font-bold uppercase animate-pulse">EXPIRED</span>
              );
            } else if (daysLeft <= 14) {
              cardBorder = "border-red-500 shadow-md";
              daysLabel = `${daysLeft} days remaining!`;
              statusBadge = (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded text-[9px] font-mono font-bold uppercase animate-pulse">Critical</span>
              );
            } else if (daysLeft <= 30) {
              cardBorder = "border-amber-400";
              statusBadge = (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded text-[9px] font-mono font-bold uppercase">Warning</span>
              );
            }

            return (
              <div 
                key={r.id} 
                className={`bg-white dark:bg-neutral-900 border ${cardBorder} p-5 rounded-xl shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs">{r.documentName}</h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{r.category} • {r.documentNumber || "No reference ID"}</p>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-850 p-3 rounded-lg flex items-center justify-between text-xs my-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-mono">EXPIRATION DATE</p>
                        <p className="font-bold text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{r.expiryDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-3 flex justify-between items-center text-[10px]">
                  <span className={`font-semibold ${daysLeft <= 14 ? "text-red-500 font-bold" : "text-neutral-500"}`}>{daysLabel}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRenew(r.id!, r.documentName)}
                      className="text-indigo-500 hover:underline font-bold"
                    >
                      Renew
                    </button>
                    <span className="text-neutral-300 dark:text-neutral-750">|</span>
                    <button 
                      onClick={() => handleDelete(r.id!, r.documentName)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-14 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-xs font-semibold">No active document expiries are being tracked.</p>
            <p className="text-[10px] mt-1 text-neutral-400">Add passports or commercial visa records to setup alerts.</p>
          </div>
        )}
      </div>

      {/* CREATE NEW MONITOR MODAL OVERLAY */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/30 dark:bg-neutral-950/60 backdrop-blur-xs" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Monitor Document Expiry</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Document Name / Title</label>
                <input 
                  type="text" 
                  value={documentName} 
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. EU Business Visa, Schengen Visa"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  required 
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Document Type</label>
                  <select 
                    value={documentType} 
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 outline-none"
                  >
                    <option value="Passport">Passport</option>
                    <option value="Visa">SaaS Visa</option>
                    <option value="License">Driver's License</option>
                    <option value="Contract">Contract/Agreement</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Document Reference #</label>
                  <input 
                    type="text" 
                    value={documentNumber} 
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. E9283120"
                    className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Expiration Date</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-3 outline-none text-xs" 
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-10 bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-all"
              >
                Track Expiration Date
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
