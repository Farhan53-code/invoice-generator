import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../utils/firebase";
import { getUserMeta, addAuditLog, type UserMeta } from "../utils/db";
import { 
  Lock, 
  Unlock, 
  Power, 
  Database, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Settings, 
  Shield, 
  Menu, 
  X, 
  ChevronRight, 
  CreditCard, 
  HelpCircle, 
  Keyboard, 
  Plus, 
  ArrowRight, 
  Home, 
  FileText, 
  PieChart, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  Check, 
  AlertCircle, 
  RefreshCw,
  LogOut,
  Sparkles,
  Info
} from "lucide-react";

interface SaaSLayoutProps {
  children: React.ReactNode;
  activeModule?: string; 
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  text: string;
}

export default function SaaSLayout({ 
  children, 
  activeModule = "Dashboard", 
  requireAuth = true,
  requireAdmin = false 
}: SaaSLayoutProps) {
  // Authentication & Profile states
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isThemeDark, setIsThemeDark] = useState<boolean>(false);

  // UI Control States
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<any[]>([
    { id: "1", text: "Welcome to Secura • LifeHub AI. Tap Ctrl+K to explore.", time: "Just now", read: false },
    { id: "2", text: "Your zero-knowledge secure storage is fully operational.", time: "10 mins ago", read: false },
    { id: "3", text: "Pro Plan offers unlimited templates and automatic invoice sending.", time: "1 hour ago", read: true }
  ]);
  
  // Global Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Trigger Helper
  const addToast = (type: "success" | "error" | "info" | "warning", text: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "?") {
        // Toggle shortcuts guide if not in inputs
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          setShortcutsOpen(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync / Initialize Theme
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
      setIsThemeDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsThemeDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme Toggle Handler
  const toggleTheme = () => {
    if (isThemeDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsThemeDark(false);
      addToast("info", "Switched to Light Mode.");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsThemeDark(true);
      addToast("info", "Switched to Dark Mode.");
    }
  };

  // Sync Firebase Authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const meta = await getUserMeta(currentUser.uid);
          setUserMeta(meta);
          
          if (requireAdmin && (!meta || !meta.isAdmin)) {
            addToast("error", "Access denied. Administrator privileges required.");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1500);
          }
        } catch (err: any) {
          console.error("Error loading user meta in layout:", err);
        }
      } else if (requireAuth) {
        // Not authenticated and auth required, redirect to login
        window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requireAuth, requireAdmin]);

  // Logout Operation
  const handleLogout = async () => {
    try {
      if (user) {
        await addAuditLog(user.uid, user.email || "", "User Logged Out", "SaaS session terminated");
      }
      await auth.signOut();
      addToast("success", "Successfully logged out. Redirecting...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err: any) {
      addToast("error", "Failed to sign out: " + err.message);
    }
  };

  // Navigation Links definition
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Password Manager", href: "/password-manager", icon: Lock },
    { name: "Invoice Generator", href: "/invoice-generator", icon: FileText },
    { name: "Budget Planner", href: "/budget-planner", icon: PieChart },
    { name: "Expense Tracker", href: "/expense-tracker", icon: DollarSign },
    { name: "Expiry Reminders", href: "/expiry-reminder", icon: Calendar },
  ];

  // Command palette search items
  const commandItems = [
    { name: "Go to Dashboard", description: "Overview of stats & status", action: () => { window.location.href = "/dashboard"; } },
    { name: "Go to Password Vault", description: "Zero-knowledge encryption vault", action: () => { window.location.href = "/password-manager"; } },
    { name: "Go to Invoice Generator", description: "Freelancer invoices & templates", action: () => { window.location.href = "/invoice-generator"; } },
    { name: "Go to Budget Planner", description: "Manage monthly spending limits", action: () => { window.location.href = "/budget-planner"; } },
    { name: "Go to Expense Tracker", description: "Log daily costs and payment methods", action: () => { window.location.href = "/expense-tracker"; } },
    { name: "Go to Document Expiry", description: "Visa, license and contract limits", action: () => { window.location.href = "/expiry-reminder"; } },
    { name: "Switch Visual Theme", description: "Toggle Dark/Light theme option", action: () => { toggleTheme(); setSearchOpen(false); } },
    { name: "Show Keyboard Shortcuts", description: "View helpful fast triggers", action: () => { setShortcutsOpen(true); setSearchOpen(false); } },
    { name: "View Pricing Plans", description: "Compare Free and Premium benefits", action: () => { window.location.href = "/pricing"; } },
    { name: "System Admin Panel", description: "Access platform analytics and logs", action: () => { window.location.href = "/admin"; } },
  ];

  const filteredCommands = commandItems.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Unread notifications count
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast("success", "All notifications marked as read.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin" />
          <p className="text-xs font-mono tracking-widest uppercase text-neutral-500">Securing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#f5f5f5] transition-colors duration-300 flex flex-col font-sans">
      
      {/* Dynamic Background Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-pink-500/5 blur-3xl -z-10 pointer-events-none" />

      {/* STICKY TOP NAV BAR */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 h-14 flex items-center justify-between px-4 lg:px-8 transition-colors duration-200">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-neutral-950 dark:bg-neutral-100 rounded-lg flex items-center justify-center text-white dark:text-black font-extrabold text-sm shadow-sm">
              S
            </div>
            <span className="font-semibold tracking-tight text-md">Secura <span className="text-neutral-400 dark:text-neutral-500 font-normal">AI</span></span>
          </a>

          {/* Breadcrumb / Section Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono uppercase tracking-wider text-[10px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md text-neutral-600 dark:text-neutral-400">
              {activeModule}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* SEARCH BUTTON (Trigger Cmd+K) */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-all cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search modules...</span>
            <kbd className="font-mono text-[9px] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.2 rounded shadow-2xs group-hover:bg-neutral-50 dark:group-hover:bg-neutral-900 transition-all">
              ⌘K
            </kbd>
          </button>

          {/* THEME SWITCH */}
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {isThemeDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* NOTIFICATION CENTER BUTTON */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              )}
            </button>
          </div>

          {/* PROFILE USER MENU */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/30 dark:border-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold">
                  {user.email?.slice(0, 2).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                          userMeta?.isAdmin 
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400" 
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}>
                          {userMeta?.isAdmin ? "Administrator" : "Free Plan User"}
                        </span>
                        
                        {!userMeta?.isAdmin && (
                          <a href="/pricing" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Upgrade
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <Home className="w-3.5 h-3.5" />
                      <span>Console Dashboard</span>
                    </a>

                    <a href="/pricing" className="flex items-center gap-2 px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Subscription Billing</span>
                    </a>

                    {userMeta?.isAdmin && (
                      <a href="/admin" className="flex items-center gap-2 px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium text-indigo-500 dark:text-indigo-400">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin Panel Console</span>
                      </a>
                    )}

                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login" className="px-3 py-1.5 text-xs font-semibold hover:text-indigo-500 transition-all">Log In</a>
              <a href="/register" className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-all">Sign Up</a>
            </div>
          )}

          {/* MOBILE HAMBURGER MENU */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* HORIZONTAL SECONDARY MODULES MENU BAR */}
      <nav className="hidden md:flex items-center justify-center bg-white dark:bg-[#0c0c0d] border-b border-neutral-200/50 dark:border-neutral-800/50 px-8 py-1.5 transition-all">
        <div className="flex items-center gap-1 text-xs">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isItemActive = activeModule === item.name;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:text-neutral-950 dark:hover:text-white ${
                  isItemActive 
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold shadow-xs" 
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* MOBILE EXPANDED MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-4 flex flex-col gap-2 z-30 transition-all">
          <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase mb-1 px-2">SaaS SUITE MODULES</p>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isItemActive = activeModule === item.name;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  isItemActive 
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black font-bold" 
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconComponent className="w-4 h-4" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      {/* UNIVERSAL REUSABLE FOOTER */}
      <footer className="bg-white dark:bg-[#070707] border-t border-neutral-200/50 dark:border-neutral-950/80 py-12 px-6 lg:px-16 text-neutral-500 dark:text-neutral-400 text-xs transition-all">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center text-white dark:text-black font-bold text-xs">S</div>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Secura • LifeHub AI</span>
            </div>
            <p className="text-neutral-400 dark:text-neutral-500 leading-relaxed max-w-xs">
              World-class zero-knowledge security meets seamless freelancer productivity tools in one unified stark dashboard. Built on Astro & Firestore.
            </p>
            <p className="font-mono text-[9px] text-neutral-400">Host: finsolve.io • Secura Core v1.0</p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Security Suite</h4>
            <ul className="flex flex-col gap-2">
              <li><a href="/password-manager" className="hover:text-indigo-500 transition-all">Password Manager</a></li>
              <li><a href="/expiry-reminder" className="hover:text-indigo-500 transition-all">Document Expiry</a></li>
              <li><a href="/dashboard" className="hover:text-indigo-500 transition-all">Access Activity Logs</a></li>
              <li><span className="text-neutral-300 dark:text-neutral-700 select-none">Encrypted Cloud Storage</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Productivity</h4>
            <ul className="flex flex-col gap-2">
              <li><a href="/invoice-generator" className="hover:text-indigo-500 transition-all">Invoice Generator</a></li>
              <li><a href="/budget-planner" className="hover:text-indigo-500 transition-all">Budget Planner</a></li>
              <li><a href="/expense-tracker" className="hover:text-indigo-500 transition-all">Expense Tracker</a></li>
              <li><a href="/pricing" className="hover:text-indigo-500 transition-all">Upgrade Membership</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Interactive</h4>
            <ul className="flex flex-col gap-2">
              <li><button onClick={() => setShortcutsOpen(true)} className="hover:text-indigo-500 transition-all text-left">Keyboard Shortcuts (?)</button></li>
              <li><button onClick={() => setSearchOpen(true)} className="hover:text-indigo-500 transition-all text-left">Command Console (⌘K)</button></li>
              <li><a href="/pricing" className="hover:text-indigo-500 transition-all">Help Center Support</a></li>
              <li><span className="text-neutral-300 dark:text-neutral-700 select-none">Status: 100% Operational</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-neutral-200/30 dark:border-neutral-800/30 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Secura Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Zero-Knowledge Guarantee</a>
          </div>
        </div>
      </footer>

      {/* COMMAND PALETTE OVERLAY (Cmd+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 px-4 h-12 border-b border-neutral-100 dark:border-neutral-800">
              <Search className="w-4 h-4 text-neutral-400" />
              <input 
                type="text"
                placeholder="Type a command or module name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full bg-transparent outline-none text-xs text-neutral-800 dark:text-neutral-100"
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-[10px] font-mono text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-3 py-1.5">Available Console Controls</p>
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.name}
                      onClick={() => {
                        cmd.action();
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-all cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cmd.name}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{cmd.description}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <AlertCircle className="w-6 h-6 mb-2 text-neutral-300" />
                  <p className="text-xs">No matching commands found.</p>
                </div>
              )}
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-100 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between text-[10px] text-neutral-400">
              <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-neutral-900 border px-1 rounded shadow-3xs">↑↓</kbd> to navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-neutral-900 border px-1 rounded shadow-3xs">Enter</kbd> to execute</span>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER PANEL */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-neutral-950/20 dark:bg-neutral-950/50 backdrop-blur-xs" onClick={() => setNotificationsOpen(false)} />
          <div className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 z-10 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Inbox Notifications</h3>
              </div>
              <button onClick={() => setNotificationsOpen(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    notif.read 
                      ? "bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-100 dark:border-neutral-800 text-neutral-500" 
                      : "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-950 text-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  <p className="leading-relaxed">{notif.text}</p>
                  <span className="text-[10px] text-neutral-400 mt-1.5 block font-mono">{notif.time}</span>
                </div>
              ))}
            </div>

            {unreadNotifications > 0 && (
              <button 
                onClick={markAllNotificationsRead}
                className="w-full h-9 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS INSTRUCTIONS MODAL (?) */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/70 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)} />
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold">Interactive Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setShortcutsOpen(false)} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-850 py-1.5">
                <span className="text-neutral-600 dark:text-neutral-400">Open Command Console</span>
                <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-950 border px-1.5 py-0.5 rounded shadow-3xs">⌘K / Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-850 py-1.5">
                <span className="text-neutral-600 dark:text-neutral-400">Show Shortcuts Guide</span>
                <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-950 border px-1.5 py-0.5 rounded shadow-3xs">?</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-850 py-1.5">
                <span className="text-neutral-600 dark:text-neutral-400">Toggle Theme Color</span>
                <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-950 border px-1.5 py-0.5 rounded shadow-3xs">⌘K &gt; Theme</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-850 py-1.5">
                <span className="text-neutral-600 dark:text-neutral-400">Cancel / Dismiss Dialog</span>
                <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-950 border px-1.5 py-0.5 rounded shadow-3xs">ESC</kbd>
              </div>
            </div>

            <button 
              onClick={() => setShortcutsOpen(false)}
              className="w-full h-9 mt-6 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL FLOATING INTERACTIVE TOASTS RENDERER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let typeStyles = "";
          let Icon = Info;
          if (toast.type === "success") {
            typeStyles = "bg-neutral-900 border-neutral-800 text-white dark:bg-white dark:border-neutral-200 dark:text-black";
            Icon = Check;
          } else if (toast.type === "error") {
            typeStyles = "bg-red-500 border-red-600 text-white dark:bg-red-950/90 dark:border-red-900/40 dark:text-red-300";
            Icon = AlertCircle;
          } else if (toast.type === "warning") {
            typeStyles = "bg-amber-500 border-amber-600 text-white dark:bg-amber-950/90 dark:border-amber-900/40 dark:text-amber-300";
            Icon = AlertCircle;
          } else {
            typeStyles = "bg-white border-neutral-200 text-neutral-800 dark:bg-neutral-900 dark:border-neutral-850 dark:text-neutral-200";
          }

          return (
            <div 
              key={toast.id}
              className={`flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg pointer-events-auto text-xs animate-in slide-in-from-bottom duration-250 ${typeStyles}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="flex-1 leading-relaxed">{toast.text}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
