import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { 
  fetchAllAuditLogs, 
  getUserMeta, 
  deleteUserAccountDocs,
  type UserMeta
} from "../utils/db";
import { 
  Shield, 
  Activity, 
  Users, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Database,
  Lock,
  FileText,
  KeyRound,
  FileSpreadsheet
} from "lucide-react";

export default function AdminDashboardApp() {
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadLogs = async () => {
    try {
      const allLogs = await fetchAllAuditLogs();
      setLogs(allLogs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const meta = await getUserMeta(currentUser.uid);
          setUserMeta(meta);

          if (!meta || !meta.isAdmin) {
            alert("Administrative access required. Redirecting to user console...");
            window.location.href = "/dashboard";
            return;
          }

          await loadLogs();
        } catch (err) {
          console.error(err);
        }
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeepPurgeUser = async (targetUid: string, targetEmail: string) => {
    if (targetUid === user?.uid) {
      alert("Self-destruction of active session is disabled inside the console.");
      return;
    }

    const firstConfirm = confirm(`[CRITICAL ACTION] Are you absolutely sure you want to completely purge user account "${targetEmail}"? This will delete all encrypted credentials, invoices, budgets, and document records.`);
    if (!firstConfirm) return;

    const secondConfirm = prompt(`Please type "PURGE" to authorize zero-residue destruction:`);
    if (secondConfirm !== "PURGE") {
      alert("Purge authorization aborted.");
      return;
    }

    try {
      setLoading(true);
      await deleteUserAccountDocs(targetUid);
      alert(`User data for ${targetEmail} has been permanently purged with zero trace.`);
      await loadLogs();
    } catch (err: any) {
      alert(`Purge failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive unique active users logged in logs
  const activeUserEmails = Array.from(new Set(logs.map(log => log.userEmail)));

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
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">System Admin Console</h1>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Global compliance oversight. Inspect system transactions, track registrations, and purge user data securely.
          </p>
        </div>

        <button 
          onClick={loadLogs}
          className="h-9 px-4 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200/40 text-neutral-850 dark:text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Database Logs</span>
        </button>
      </div>

      {/* ADMIN PLATFORM SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/25 text-indigo-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Global Platform Registrations</span>
            <p className="text-xl font-black mt-1">{activeUserEmails.length} accounts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/25 text-blue-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Aggregated Secure Audits</span>
            <p className="text-xl font-black mt-1">{logs.length} operations</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/25 text-red-500 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Database Server Status</span>
            <p className="text-xl font-black mt-1 text-green-500">100% Operational</p>
          </div>
        </div>
      </div>

      {/* DYNAMIC USER DIRECTORY PURGE ROW */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">COMPLIANCE DEEP CLEANUP PURGE</h3>
        </div>
        <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed mb-6">
          Wipe accounts instantly. Invoking a deep purge removes every credential record, invoice document, reminder date and spending budget limit with zero residue, leaving the platform clean.
        </p>

        <div className="overflow-x-auto border border-neutral-100 dark:border-neutral-800 rounded-xl">
          <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-4">User Account Email</th>
                <th className="py-2.5 px-4">Audit Status</th>
                <th className="py-2.5 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {activeUserEmails.map((email, idx) => {
                // Find target uid associated with this email inside logs
                const firstLogEntry = logs.find(log => log.userEmail === email);
                const uid = firstLogEntry ? firstLogEntry.userId : "";
                
                return (
                  <tr key={idx} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10">
                    <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-neutral-100">{email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded text-[9px] font-mono font-bold">ACTIVE DEPLOYS</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => handleDeepPurgeUser(uid, email)}
                        disabled={uid === user?.uid}
                        className="h-8 px-3 bg-red-500/15 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ml-auto mr-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Force Deep Purge</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TRANSACTION LOGS STREAM */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-150 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">SECURA SYSTEM TRANSACTION STREAM</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Filter logs by subject or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-950/40 text-[10px] uppercase font-mono border-b border-neutral-100 dark:border-neutral-850">
                <tr>
                  <th className="py-2.5 px-3">Date / Timestamp</th>
                  <th className="py-2.5 px-3">Account Owner</th>
                  <th className="py-2.5 px-3">Transaction Subject</th>
                  <th className="py-2.5 px-3">Details Meta Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-850/10">
                    <td className="py-3 px-3 font-mono text-[10px] text-neutral-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-700 dark:text-neutral-200">{log.userEmail}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md font-mono text-[10px] font-bold uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300 max-w-sm truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-neutral-400">
              <Database className="w-8 h-8 mx-auto mb-2 text-neutral-300 animate-pulse" />
              <p className="text-xs">No matching transactions logged inside the database stream.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
