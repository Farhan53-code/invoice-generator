import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Key,
  Database,
  Search as SearchIcon,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  TrendingUp,
  Sliders,
  FolderPlus,
  Heart,
  Settings as SettingsIcon,
  User,
  Power,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  CheckCircle2,
  FileDown,
  FileUp,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Menu,
  X,
  Users
} from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "../utils/firebase";
import { 
  saveUserMeta, 
  getUserMeta, 
  fetchPasswords, 
  addPassword, 
  updatePassword, 
  deletePassword, 
  fetchCustomCategories, 
  addCustomCategory, 
  deleteCustomCategory, 
  fetchAdminStats, 
  deleteUserAccountDocs
} from "../utils/db";
import type {
  PasswordRecord,
  CustomCategory,
  UserMeta,
  AdminStats
} from "../utils/db";
import { 
  encryptText, 
  decryptText, 
  generateVerifier, 
  verifyMasterPassword 
} from "../utils/crypto";
import { FirebaseDomainHelp } from "./FirebaseDomainHelp";

// Default pre-defined categories
const DEFAULT_CATEGORIES = [
  "Social Media",
  "Banking",
  "Shopping",
  "Email",
  "Work",
  "Education",
  "Entertainment",
  "Crypto",
  "Other"
];

// Notification interface
interface ToastNotification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function PasswordManagerApp() {
  // Navigation & Screen States
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authErrorMsg, setAuthErrorMsg] = useState<string>("");
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [masterPasswordForm, setMasterPasswordForm] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Zero-Knowledge Master Password Unlock States
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [sessionMasterPassword, setSessionMasterPassword] = useState<string>("");
  const [masterUnlockInput, setMasterUnlockInput] = useState<string>("");
  const [initMasterPass, setInitMasterPass] = useState<string>("");
  const [initMasterPassConfirm, setInitMasterPassConfirm] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Vault & Categories Data States
  const [vault, setVault] = useState<PasswordRecord[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState<boolean>(false);
  
  // Add/Edit Password Dialog State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    websiteName: "",
    websiteUrl: "",
    username: "",
    email: "",
    passwordRaw: "",
    notesRaw: "",
    category: "Social Media",
    tagsString: "",
    favoriteOption: false
  });

  // Password Generator State
  const [genLength, setGenLength] = useState<number>(16);
  const [genUpper, setGenUpper] = useState<boolean>(true);
  const [genLower, setGenLower] = useState<boolean>(true);
  const [genNumbers, setGenNumbers] = useState<boolean>(true);
  const [genSymbols, setGenSymbols] = useState<boolean>(true);
  const [genExcludeSimilar, setGenExcludeSimilar] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<string>("");

  // Custom Category State
  const [newCatName, setNewCatName] = useState<string>("");

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"date-new" | "date-old" | "name-asc" | "name-desc">("name-asc");

  // Admin Panel States
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);

  // Settings State
  const [newMasterPass, setNewMasterPass] = useState<string>("");
  const [confirmNewMasterPass, setConfirmNewMasterPass] = useState<string>("");
  const [newLoginPass, setNewLoginPass] = useState<string>("");
  const [confirmNewLoginPass, setConfirmNewLoginPass] = useState<string>("");

  // Visual & System states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [decryptedPasswordsMap, setDecryptedPasswordsMap] = useState<Record<string, string>>({});
  const [decryptedNotesMap, setDecryptedNotesMap] = useState<Record<string, string>>({});
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Inactivity Auto-Lock timer ref
  const lastActiveRef = useRef<number>(Date.now());

  // Show dynamic notification
  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // 1. Initialize Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const meta = await getUserMeta(currentUser.uid);
          setUserMeta(meta);
        } catch (e) {
          console.error("Error loading user meta", e);
        }
      } else {
        setUserMeta(null);
        setIsUnlocked(false);
        setSessionMasterPassword("");
        setVault([]);
        setCustomCategories([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch data once unlocked
  useEffect(() => {
    if (user && isUnlocked && sessionMasterPassword) {
      loadVaultData();
    }
  }, [user, isUnlocked]);

  const loadVaultData = async () => {
    if (!user) return;
    setIsVaultLoading(true);
    try {
      const pswds = await fetchPasswords(user.uid);
      setVault(pswds);
      const cats = await fetchCustomCategories(user.uid);
      setCustomCategories(cats);
    } catch (e: any) {
      addToast("error", "Failed to load vault: " + e.message);
    } finally {
      setIsVaultLoading(false);
    }
  };

  // 3. Auto-Lock & Activity Tracker
  useEffect(() => {
    const updateActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keypress", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("click", updateActivity);

    // Check for inactivity every 10 seconds
    const interval = setInterval(() => {
      if (isUnlocked && user) {
        const inactiveTime = Date.now() - lastActiveRef.current;
        const FIVE_MINUTES = 5 * 60 * 1000;
        if (inactiveTime >= FIVE_MINUTES) {
          // Auto-lock!
          setIsUnlocked(false);
          setSessionMasterPassword("");
          setDecryptedPasswordsMap({});
          setDecryptedNotesMap({});
          setVisiblePasswordIds({});
          addToast("info", "Session locked automatically due to inactivity.");
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keypress", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("click", updateActivity);
      clearInterval(interval);
    };
  }, [isUnlocked, user]);

  // Auth Operations
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !masterPasswordForm) {
      addToast("error", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      addToast("error", "Login passwords do not match.");
      return;
    }
    if (masterPasswordForm.length < 8) {
      addToast("error", "Master Password must be at least 8 characters.");
      return;
    }

    setAuthLoading(true);
    setAuthErrorMsg("");
    try {
      // 1. Create firebase auth user
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      // 2. Create the master password verifier
      const verifier = await generateVerifier(masterPasswordForm);
      // 3. Save to database
      await saveUserMeta(credentials.user.uid, email, verifier);
      
      // Update state manually to prevent onAuthStateChanged race condition from leaving us with null userMeta
      const isCurrentUserAdmin = email.toLowerCase() === "fa3327392@gmail.com";
      const meta: UserMeta = {
        userId: credentials.user.uid,
        email: email,
        masterPasswordVerifier: verifier,
        isAdmin: isCurrentUserAdmin,
        createdDate: new Date().toISOString()
      };
      setUserMeta(meta);

      // Auto unlock since they just typed it
      setSessionMasterPassword(masterPasswordForm);
      setIsUnlocked(true);
      
      addToast("success", "Account created successfully with zero-knowledge vault setup!");
      
      // Reset forms
      setPassword("");
      setConfirmPassword("");
      setMasterPasswordForm("");
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/unauthorized-domain" || (msg && msg.includes("unauthorized-domain"))) {
        msg = `Unauthorized Domain: Please authorize "${window.location.hostname}" in your Firebase Console (under Authentication > Settings > Authorized domains).`;
      }
      setAuthErrorMsg(msg);
      addToast("error", "Registration failed: " + msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("error", "Please fill in email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      addToast("success", "Welcome back! Unlock your vault to access your credentials.");
      // Reset forms
      setPassword("");
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/unauthorized-domain" || (msg && msg.includes("unauthorized-domain"))) {
        msg = `Unauthorized Domain: Please authorize "${window.location.hostname}" in your Firebase Console (under Authentication > Settings > Authorized domains).`;
      }
      setAuthErrorMsg(msg);
      addToast("error", "Login failed: " + msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast("error", "Please provide your email address.");
      return;
    }
    setAuthLoading(true);
    setAuthErrorMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      addToast("success", "Password reset instructions sent to your email.");
      setAuthMode("login");
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/unauthorized-domain" || (msg && msg.includes("unauthorized-domain"))) {
        msg = `Unauthorized Domain: Please authorize "${window.location.hostname}" in your Firebase Console (under Authentication > Settings > Authorized domains).`;
      }
      setAuthErrorMsg(msg);
      addToast("error", "Reset failed: " + msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast("info", "Logged out successfully.");
    } catch (e: any) {
      addToast("error", "Error logging out: " + e.message);
    }
  };

  // Master Password Unlock Operation
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentMeta = userMeta;

    // Retry fetching userMeta in case it failed during initial load or suffered a race condition
    if (!currentMeta && user) {
      try {
        addToast("info", "Verifying session metadata...");
        currentMeta = await getUserMeta(user.uid);
        if (currentMeta) {
          setUserMeta(currentMeta);
        }
      } catch (err: any) {
        console.error("Failed to fetch user meta on unlock retry:", err);
      }
    }

    if (!currentMeta) {
      addToast("error", "User session metadata not found. Your vault might be uninitialized.");
      return;
    }

    if (!masterUnlockInput) {
      addToast("error", "Please enter your master password.");
      return;
    }

    try {
      const isValid = await verifyMasterPassword(masterUnlockInput, currentMeta.masterPasswordVerifier);
      if (isValid) {
        setSessionMasterPassword(masterUnlockInput);
        setIsUnlocked(true);
        setMasterUnlockInput("");
        addToast("success", "Vault successfully decrypted and unlocked!");
      } else {
        addToast("error", "Incorrect Master Password. Please try again.");
      }
    } catch (e: any) {
      addToast("error", "Decryption failed: " + e.message);
    }
  };

  // Self-healing vault initialization if metadata was lost or uninitialized
  const handleInitializeVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast("error", "You must be logged in to initialize a vault.");
      return;
    }
    if (initMasterPass.length < 8) {
      addToast("error", "Master Password must be at least 8 characters.");
      return;
    }
    if (initMasterPass !== initMasterPassConfirm) {
      addToast("error", "Master Passwords do not match.");
      return;
    }

    setIsVaultLoading(true);
    try {
      const verifier = await generateVerifier(initMasterPass);
      await saveUserMeta(user.uid, user.email || "", verifier);
      
      const isCurrentUserAdmin = user.email?.toLowerCase() === "fa3327392@gmail.com";
      const meta: UserMeta = {
        userId: user.uid,
        email: user.email || "",
        masterPasswordVerifier: verifier,
        isAdmin: isCurrentUserAdmin,
        createdDate: new Date().toISOString()
      };
      setUserMeta(meta);
      
      setSessionMasterPassword(initMasterPass);
      setIsUnlocked(true);
      setInitMasterPass("");
      setInitMasterPassConfirm("");
      
      addToast("success", "Your zero-knowledge secure vault is now initialized and unlocked!");
    } catch (err: any) {
      addToast("error", "Failed to initialize vault: " + err.message);
    } finally {
      setIsVaultLoading(false);
    }
  };

  // Decryption Helpers on-demand or loaded in memory
  const decryptPasswordOnDemand = async (record: PasswordRecord) => {
    if (decryptedPasswordsMap[record.id!]) return;
    try {
      const plain = await decryptText(record.passwordEncrypted, sessionMasterPassword);
      setDecryptedPasswordsMap(prev => ({ ...prev, [record.id!]: plain }));
    } catch (e: any) {
      addToast("error", "Failed to decrypt password: " + e.message);
    }
  };

  const decryptNotesOnDemand = async (record: PasswordRecord) => {
    if (decryptedNotesMap[record.id!]) return;
    try {
      const plain = await decryptText(record.notesEncrypted, sessionMasterPassword);
      setDecryptedNotesMap(prev => ({ ...prev, [record.id!]: plain }));
    } catch (e: any) {
      addToast("error", "Failed to decrypt notes: " + e.message);
    }
  };

  const togglePasswordVisibility = async (record: PasswordRecord) => {
    const isNowVisible = !visiblePasswordIds[record.id!];
    if (isNowVisible) {
      await decryptPasswordOnDemand(record);
    }
    setVisiblePasswordIds(prev => ({ ...prev, [record.id!]: isNowVisible }));
  };

  // Copy helpers
  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("success", `${label} copied to clipboard!`);
    } catch (e) {
      addToast("error", "Clipboard copy failed");
    }
  };

  const copyPasswordDirectly = async (record: PasswordRecord) => {
    try {
      const plain = decryptedPasswordsMap[record.id!] || await decryptText(record.passwordEncrypted, sessionMasterPassword);
      if (!decryptedPasswordsMap[record.id!]) {
        setDecryptedPasswordsMap(prev => ({ ...prev, [record.id!]: plain }));
      }
      await handleCopyToClipboard(plain, "Password");
    } catch (e: any) {
      addToast("error", "Decryption failed: " + e.message);
    }
  };

  // Create or Update Password Record
  const openAddModal = () => {
    setModalMode("add");
    setCurrentRecordId(null);
    setFormData({
      websiteName: "",
      websiteUrl: "",
      username: "",
      email: "",
      passwordRaw: "",
      notesRaw: "",
      category: "Social Media",
      tagsString: "",
      favoriteOption: false
    });
    setShowPasswordModal(true);
  };

  const openEditModal = async (record: PasswordRecord) => {
    setModalMode("edit");
    setCurrentRecordId(record.id!);
    
    // Decrypt details first for editing
    let plainPass = decryptedPasswordsMap[record.id!] || "";
    let plainNotes = decryptedNotesMap[record.id!] || "";
    
    try {
      if (!plainPass) {
        plainPass = await decryptText(record.passwordEncrypted, sessionMasterPassword);
        setDecryptedPasswordsMap(prev => ({ ...prev, [record.id!]: plainPass }));
      }
      if (!plainNotes && record.notesEncrypted) {
        plainNotes = await decryptText(record.notesEncrypted, sessionMasterPassword);
        setDecryptedNotesMap(prev => ({ ...prev, [record.id!]: plainNotes }));
      }
    } catch (e) {
      addToast("error", "Failed to decrypt data for editing.");
      return;
    }

    setFormData({
      websiteName: record.websiteName,
      websiteUrl: record.websiteUrl,
      username: record.username,
      email: record.email,
      passwordRaw: plainPass,
      notesRaw: plainNotes,
      category: record.category,
      tagsString: record.tags.join(", "),
      favoriteOption: record.favoriteOption
    });
    setShowPasswordModal(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.websiteName || !formData.passwordRaw) {
      addToast("error", "Website Name and Password are required.");
      return;
    }

    setIsVaultLoading(true);
    try {
      // 1. Encrypt password and notes
      const encryptedPass = await encryptText(formData.passwordRaw, sessionMasterPassword);
      const encryptedNotes = formData.notesRaw ? await encryptText(formData.notesRaw, sessionMasterPassword) : "";
      
      const tags = formData.tagsString
        ? formData.tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const recordPayload = {
        websiteName: formData.websiteName,
        websiteUrl: formData.websiteUrl,
        username: formData.username,
        email: formData.email,
        passwordEncrypted: encryptedPass,
        notesEncrypted: encryptedNotes,
        category: formData.category,
        tags: tags,
        favoriteOption: formData.favoriteOption,
        userId: user!.uid
      };

      if (modalMode === "add") {
        const newId = await addPassword(recordPayload);
        
        // Cache decrypted passwords in state
        setDecryptedPasswordsMap(prev => ({ ...prev, [newId]: formData.passwordRaw }));
        if (formData.notesRaw) {
          setDecryptedNotesMap(prev => ({ ...prev, [newId]: formData.notesRaw }));
        }

        addToast("success", "Credentials successfully encrypted and saved to vault!");
      } else if (modalMode === "edit" && currentRecordId) {
        await updatePassword(currentRecordId, recordPayload);
        
        // Update cache
        setDecryptedPasswordsMap(prev => ({ ...prev, [currentRecordId]: formData.passwordRaw }));
        setDecryptedNotesMap(prev => ({ ...prev, [currentRecordId]: formData.notesRaw }));

        addToast("success", "Credentials successfully updated!");
      }

      setShowPasswordModal(false);
      await loadVaultData();
    } catch (e: any) {
      addToast("error", "Failed to save: " + e.message);
    } finally {
      setIsVaultLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action supports soft-delete recovery but hides it from vault.`)) {
      return;
    }
    try {
      await deletePassword(id);
      addToast("success", `${name} moved to trash/soft-deleted.`);
      await loadVaultData();
    } catch (e: any) {
      addToast("error", "Delete failed: " + e.message);
    }
  };

  const handleDuplicateRecord = async (record: PasswordRecord) => {
    setIsVaultLoading(true);
    try {
      const recordPayload = {
        websiteName: `${record.websiteName} (Copy)`,
        websiteUrl: record.websiteUrl,
        username: record.username,
        email: record.email,
        passwordEncrypted: record.passwordEncrypted,
        notesEncrypted: record.notesEncrypted,
        category: record.category,
        tags: [...record.tags],
        favoriteOption: false,
        userId: user!.uid
      };
      await addPassword(recordPayload);
      addToast("success", `Duplicated entry for ${record.websiteName}!`);
      await loadVaultData();
    } catch (e: any) {
      addToast("error", "Duplicate failed: " + e.message);
    } finally {
      setIsVaultLoading(false);
    }
  };

  const handleToggleFavorite = async (record: PasswordRecord) => {
    try {
      await updatePassword(record.id!, { favoriteOption: !record.favoriteOption });
      addToast("success", record.favoriteOption ? "Removed from favorites." : "Added to favorites.");
      await loadVaultData();
    } catch (e: any) {
      addToast("error", "Failed to toggle favorite: " + e.message);
    }
  };

  // Password Generator Core
  const generateSecurePassword = () => {
    let charset = "";
    if (genUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (genLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (genNumbers) charset += "0123456789";
    if (genSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (genExcludeSimilar) {
      // Remove similar characters like I, l, 1, O, 0, etc.
      const similarChars = /[Il1O0o|]/g;
      charset = charset.replace(similarChars, "");
    }

    if (!charset) {
      addToast("error", "Please select at least one character type.");
      return;
    }

    let passwordResult = "";
    const values = new Uint32Array(genLength);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < genLength; i++) {
      passwordResult += charset[values[i] % charset.length];
    }
    setGeneratedPass(passwordResult);
  };

  useEffect(() => {
    generateSecurePassword();
  }, [genLength, genUpper, genLower, genNumbers, genSymbols, genExcludeSimilar]);

  // Determine Password Strength
  const getPasswordStrength = (pass: string): { label: "Weak" | "Medium" | "Strong" | "Very Strong"; color: string; score: number } => {
    if (!pass) return { label: "Weak", color: "bg-red-500", score: 0 };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", score: 25 };
    if (score === 3) return { label: "Medium", color: "bg-amber-500", score: 50 };
    if (score === 4) return { label: "Strong", color: "bg-emerald-500", score: 75 };
    return { label: "Very Strong", color: "bg-indigo-500", score: 100 };
  };

  // Load Admin Stats on-demand
  const loadAdminStatsData = async () => {
    setIsAdminLoading(true);
    try {
      const stats = await fetchAdminStats();
      setAdminStats(stats);
    } catch (e: any) {
      addToast("error", "Failed to load admin logs.");
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && userMeta?.isAdmin) {
      loadAdminStatsData();
    }
  }, [activeTab, userMeta]);

  // Settings & Account Alterations
  const handleChangeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPass || !confirmNewMasterPass) {
      addToast("error", "Please complete all Master Password fields.");
      return;
    }
    if (newMasterPass !== confirmNewMasterPass) {
      addToast("error", "New Master Passwords do not match.");
      return;
    }
    if (newMasterPass.length < 8) {
      addToast("error", "Master Password must be at least 8 characters.");
      return;
    }

    setIsVaultLoading(true);
    try {
      // Re-encrypt all passwords and notes in the vault with the new master password
      const reEncryptedVault = [];
      for (const rec of vault) {
        const plainPass = decryptedPasswordsMap[rec.id!] || await decryptText(rec.passwordEncrypted, sessionMasterPassword);
        const plainNotes = rec.notesEncrypted 
          ? (decryptedNotesMap[rec.id!] || await decryptText(rec.notesEncrypted, sessionMasterPassword))
          : "";

        const newEncPass = await encryptText(plainPass, newMasterPass);
        const newEncNotes = plainNotes ? await encryptText(plainNotes, newMasterPass) : "";

        reEncryptedVault.push({
          id: rec.id!,
          passwordEncrypted: newEncPass,
          notesEncrypted: newEncNotes
        });
      }

      // Write re-encrypted fields to Firestore
      for (const item of reEncryptedVault) {
        await updatePassword(item.id, {
          passwordEncrypted: item.passwordEncrypted,
          notesEncrypted: item.notesEncrypted
        });
      }

      // Update the user metadata verifier
      const newVerifier = await generateVerifier(newMasterPass);
      await saveUserMeta(user!.uid, user!.email!, newVerifier);

      // Reset master sessions
      setSessionMasterPassword(newMasterPass);
      setNewMasterPass("");
      setConfirmNewMasterPass("");
      addToast("success", "Master password updated successfully! All vault credentials re-encrypted.");
    } catch (e: any) {
      addToast("error", "Failed to change master password: " + e.message);
    } finally {
      setIsVaultLoading(false);
    }
  };

  const handleChangeLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoginPass || !confirmNewLoginPass) {
      addToast("error", "Please provide the new login password.");
      return;
    }
    if (newLoginPass !== confirmNewLoginPass) {
      addToast("error", "Login passwords do not match.");
      return;
    }

    try {
      await firebaseUpdatePassword(auth.currentUser!, newLoginPass);
      setNewLoginPass("");
      setConfirmNewLoginPass("");
      addToast("success", "Login password successfully changed!");
    } catch (e: any) {
      addToast("error", "Failed to change login password: " + e.message);
    }
  };

  const handleExportData = async () => {
    try {
      const exportedItems = [];
      for (const rec of vault) {
        const plainPass = decryptedPasswordsMap[rec.id!] || await decryptText(rec.passwordEncrypted, sessionMasterPassword);
        const plainNotes = rec.notesEncrypted 
          ? (decryptedNotesMap[rec.id!] || await decryptText(rec.notesEncrypted, sessionMasterPassword))
          : "";

        exportedItems.push({
          websiteName: rec.websiteName,
          websiteUrl: rec.websiteUrl,
          username: rec.username,
          email: rec.email,
          password: plainPass,
          notes: plainNotes,
          category: rec.category,
          tags: rec.tags,
          createdDate: rec.createdDate,
          favorite: rec.favoriteOption
        });
      }

      const jsonStr = JSON.stringify(exportedItems, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `password_vault_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast("success", "Vault fully decrypted and exported to JSON.");
    } catch (e: any) {
      addToast("error", "Export failed: " + e.message);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target?.result as string);
        if (!Array.isArray(items)) throw new Error("Format must be an array of credentials.");

        setIsVaultLoading(true);
        let importedCount = 0;
        for (const item of items) {
          const encPass = await encryptText(item.password || "", sessionMasterPassword);
          const encNotes = item.notes ? await encryptText(item.notes, sessionMasterPassword) : "";

          await addPassword({
            websiteName: item.websiteName || "Imported Website",
            websiteUrl: item.websiteUrl || "",
            username: item.username || "",
            email: item.email || "",
            passwordEncrypted: encPass,
            notesEncrypted: encNotes,
            category: item.category || "Social Media",
            tags: Array.isArray(item.tags) ? item.tags : [],
            favoriteOption: !!item.favorite,
            userId: user!.uid,
            createdDate: item.createdDate || new Date().toISOString(),
            updatedDate: new Date().toISOString()
          });
          importedCount++;
        }

        addToast("success", `Successfully imported ${importedCount} passwords to your secure vault.`);
        await loadVaultData();
      } catch (err: any) {
        addToast("error", "Failed to import JSON: " + err.message);
      } finally {
        setIsVaultLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = async () => {
    const confirmation = confirm("CRITICAL WARNING: This will permanently delete your account, your master password verifier, and ALL your encrypted vault records! This action is irreversible. Proceed?");
    if (!confirmation) return;

    try {
      const currentUid = user!.uid;
      // 1. Delete all Firestore records first
      await deleteUserAccountDocs(currentUid);
      // 2. Delete firebase auth user account
      await firebaseDeleteUser(auth.currentUser!);
      addToast("success", "Your account and data have been fully deleted.");
    } catch (e: any) {
      addToast("error", "Failed to delete account. You might need to re-authenticate first: " + e.message);
    }
  };

  // Custom Categories Add/Remove
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    // Check if duplicate
    const allCats = [...DEFAULT_CATEGORIES, ...customCategories.map(c => c.name)];
    if (allCats.some(c => c.toLowerCase() === newCatName.trim().toLowerCase())) {
      addToast("error", "Category already exists.");
      return;
    }

    try {
      const newCat = await addCustomCategory(user!.uid, newCatName.trim());
      setCustomCategories(prev => [...prev, newCat]);
      setNewCatName("");
      addToast("success", `Custom category "${newCat.name}" created!`);
    } catch (e: any) {
      addToast("error", "Failed to create category: " + e.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" category? Passwords categorized under this will not be deleted but can be re-categorized.`)) {
      return;
    }
    try {
      await deleteCustomCategory(id);
      setCustomCategories(prev => prev.filter(c => c.id !== id));
      addToast("success", `Category "${name}" deleted.`);
    } catch (e: any) {
      addToast("error", "Failed to delete category: " + e.message);
    }
  };

  // Vault Filtering & Sorting logic
  const filteredVault = vault.filter((record) => {
    // 1. Tab / Favorite filtering
    if (activeTab === "favorites" && !record.favoriteOption) return false;
    
    // 2. Category selection filtering
    if (selectedCategoryFilter !== "All" && record.category !== selectedCategoryFilter) return false;

    // 3. Search text filtering
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.websiteName.toLowerCase().includes(searchLower) ||
      record.username.toLowerCase().includes(searchLower) ||
      record.email.toLowerCase().includes(searchLower) ||
      record.category.toLowerCase().includes(searchLower) ||
      record.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  });

  const sortedVault = [...filteredVault].sort((a, b) => {
    if (sortBy === "date-new") {
      return new Date(b.createdDate || "").getTime() - new Date(a.createdDate || "").getTime();
    }
    if (sortBy === "date-old") {
      return new Date(a.createdDate || "").getTime() - new Date(b.createdDate || "").getTime();
    }
    if (sortBy === "name-asc") {
      return a.websiteName.localeCompare(b.websiteName);
    }
    if (sortBy === "name-desc") {
      return b.websiteName.localeCompare(a.websiteName);
    }
    return 0;
  });

  // Calculate vault stats
  const totalPasswords = vault.length;
  const recentPasswords = [...vault]
    .sort((a, b) => new Date(b.createdDate || "").getTime() - new Date(a.createdDate || "").getTime())
    .slice(0, 5);

  const favoriteCount = vault.filter(r => r.favoriteOption).length;

  // Track password strengths
  let weakCount = 0;
  let mediumCount = 0;
  let strongCount = 0;
  
  vault.forEach((rec) => {
    const plain = decryptedPasswordsMap[rec.id!] || "";
    if (plain) {
      const { label } = getPasswordStrength(plain);
      if (label === "Weak") weakCount++;
      else if (label === "Medium") mediumCount++;
      else strongCount++; // Strong + Very Strong
    } else {
      // Estimate based on encrypted lengths as a fallback indicator before user loads it
      const length = rec.passwordEncrypted.length;
      if (length < 80) weakCount++;
      else if (length < 120) mediumCount++;
      else strongCount++;
    }
  });

  return (
    <div id="app-root" className={`${theme === "dark" ? "dark bg-[#0a0f1d] text-slate-100" : "bg-[#f8fafc] text-slate-800"} min-h-screen font-sans flex flex-col transition-colors duration-200 selection:bg-indigo-500 selection:text-white`}>
      
      {/* Dynamic Toast Notifications */}
      <div id="toasts-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`p-4 rounded-lg shadow-xl flex items-start gap-3 border animate-in slide-in-from-bottom duration-200 ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : toast.type === "error"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : toast.type === "error" ? (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <HelpCircle className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
            )}
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* 1. AUTHENTICATION BARRIERS */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="mt-4 text-sm font-medium text-slate-400">Loading secure environment...</p>
        </div>
      ) : !user ? (
        /* Sign-In / Register / Forgot Layout */
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px] -z-10" />

          <div id="auth-card" className="w-full max-w-md bg-white/5 dark:bg-[#131b2e]/60 backdrop-blur-xl border border-slate-200/10 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl transition-all">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Krypton Vault</h2>
              <p className="text-sm text-slate-400 mt-1">Zero-Knowledge Secure Credentials Manager</p>
            </div>

            {authErrorMsg && <div className="mb-4"><FirebaseDomainHelp errorMsg={authErrorMsg} /></div>}

            {authMode === "login" && (
              <form id="login-form" onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Login Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot")}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 accent-indigo-500"
                  />
                  <label htmlFor="remember-me" className="text-xs text-slate-400 select-none cursor-pointer">
                    Remember my email
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-4">
                  <span className="text-xs text-slate-400">New to Krypton Vault? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setEmail("");
                      setPassword("");
                    }}
                    className="text-xs text-indigo-400 font-semibold hover:underline"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {authMode === "register" && (
              <form id="register-form" onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Login Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Login Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <label className="block text-xs font-bold text-indigo-400 mb-1">MASTER PASSWORD (CRITICAL)</label>
                      <p className="text-[11px] text-slate-400 leading-normal mb-2">
                        Used to encrypt and decrypt your vault entries client-side. We never store this password on our servers. If you lose it, we cannot recover your credentials.
                      </p>
                      <input
                        type="password"
                        value={masterPasswordForm}
                        onChange={(e) => setMasterPasswordForm(e.target.value)}
                        placeholder="Choose a strong Master Password"
                        className="w-full h-9 bg-slate-900/60 border border-indigo-500/30 rounded px-3 text-xs outline-none focus:border-indigo-500 text-slate-100"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-2"
                >
                  <span>Register & Setup Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-3">
                  <span className="text-xs text-slate-400">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setEmail("");
                      setPassword("");
                    }}
                    className="text-xs text-indigo-400 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {authMode === "forgot" && (
              <form id="forgot-form" onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  Enter your email address and we'll send you instructions to reset your login password.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-2"
                >
                  <span>Reset Password</span>
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-xs text-indigo-400 font-semibold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : !isUnlocked ? (
        /* Vault Lock Screen */
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px] -z-10" />

          <div id="unlock-card" className="w-full max-w-md bg-white/5 dark:bg-[#131b2e]/60 backdrop-blur-xl border border-slate-200/10 dark:border-slate-800/80 rounded-2xl p-8 shadow-2xl transition-all">
            {!userMeta ? (
              /* Self-healing Initialize Vault UI if metadata doesn't exist */
              <>
                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                    <Database className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold">Initialize Your Vault</h2>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                    Welcome to Krypton Vault! Your zero-knowledge secure storage is not yet initialized. Please set a Master Password below to establish your secure space.
                  </p>
                </div>

                <form id="init-vault-form" onSubmit={handleInitializeVault} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Master Password (At least 8 chars)</label>
                    <input
                      type="password"
                      value={initMasterPass}
                      onChange={(e) => setInitMasterPass(e.target.value)}
                      placeholder="Enter a strong Master Password"
                      className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 font-mono"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Master Password</label>
                    <input
                      type="password"
                      value={initMasterPassConfirm}
                      onChange={(e) => setInitMasterPassConfirm(e.target.value)}
                      placeholder="Confirm Master Password"
                      className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 font-mono"
                      required
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVaultLoading}
                    className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-2 disabled:opacity-50"
                  >
                    {isVaultLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Initialize & Unlock Vault</span>
                  </button>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/5">
                    <span className="text-xs text-slate-400">Logged in as: <span className="text-slate-300 font-medium">{user.email}</span></span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs text-rose-400 font-medium hover:underline flex items-center gap-1"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Normal Lock Screen */
              <>
                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold">Krypton Vault is Locked</h2>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                    To decrypt and access your passwords, enter your Master Password below.
                  </p>
                </div>

                <form id="unlock-form" onSubmit={handleUnlockVault} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Master Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={masterUnlockInput}
                        onChange={(e) => setMasterUnlockInput(e.target.value)}
                        placeholder="Enter Master Password"
                        className="w-full h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-4 pr-10 text-sm outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 font-mono"
                        required
                        autoFocus
                      />
                      <div className="absolute right-3 top-3.5 text-slate-400">
                        <Key className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Decrypt & Open Vault</span>
                  </button>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/5">
                    <span className="text-xs text-slate-400">Logged in as: <span className="text-slate-300 font-medium">{user.email}</span></span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs text-rose-400 font-medium hover:underline flex items-center gap-1"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : (
        /* 2. MAIN APPLICATION INTERFACE (UNLOCKED & AUTHENTICATED) */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Mobile Header Bar */}
          <header className="md:hidden h-14 bg-white/5 border-b border-slate-200/10 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span className="font-bold tracking-tight text-sm">Krypton Vault</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>

          {/* Sidebar Navigation */}
          <aside className={`w-64 border-r border-slate-200/10 dark:border-slate-800/80 bg-white/5 dark:bg-[#0c1224] flex flex-col justify-between p-5 shrink-0 transition-all duration-200 md:static fixed inset-y-0 left-0 z-40 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex flex-col gap-6">
              {/* Logo Header */}
              <div className="hidden md:flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-sm block">Krypton Vault</span>
                  <span className="text-[10px] font-mono text-indigo-400 font-medium">ZERO-KNOWLEDGE • V1.0</span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
                  { id: "vault", label: "Password Vault", icon: Database },
                  { id: "categories", label: "Categories", icon: FolderPlus },
                  { id: "favorites", label: "Favorites", icon: Heart },
                  { id: "generator", label: "Generator", icon: Sliders },
                  { id: "settings", label: "Settings", icon: SettingsIcon },
                  { id: "profile", label: "Profile", icon: User }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`h-10 px-3.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{tab.label}</span>
                      {tab.id === "vault" && vault.length > 0 && (
                        <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                          {vault.length}
                        </span>
                      )}
                      {tab.id === "favorites" && favoriteCount > 0 && (
                        <span className="ml-auto bg-pink-500/10 text-pink-400 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                          {favoriteCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Admin Area (Conditionally visible) */}
                {userMeta?.isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab("admin");
                      setIsSidebarOpen(false);
                    }}
                    className={`h-10 px-3.5 mt-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-all cursor-pointer ${
                      activeTab === "admin"
                        ? "bg-purple-500/10 border-l-2 border-purple-500 text-purple-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4.5 h-4.5 text-purple-400" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/5">
              <div className="flex items-center gap-2 px-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400 font-mono">Vault Decrypted</span>
              </div>
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setSessionMasterPassword("");
                  addToast("info", "Vault locked successfully.");
                }}
                className="w-full h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 relative">
            
            {/* 2.1. DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <div id="tab-dashboard" className="max-w-6xl mx-auto flex flex-col gap-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Vault Dashboard</h1>
                  <p className="text-sm text-slate-400 mt-1">Real-time password security overview and metrics.</p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Passwords</span>
                    <span className="text-3xl font-bold mt-1 font-mono">{totalPasswords}</span>
                  </div>
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Weak Passwords</span>
                    <span className="text-3xl font-bold mt-1 font-mono text-rose-400">{weakCount}</span>
                  </div>
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Strong Passwords</span>
                    <span className="text-3xl font-bold mt-1 font-mono text-emerald-400">{strongCount}</span>
                  </div>
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Favorites</span>
                    <span className="text-3xl font-bold mt-1 font-mono text-pink-400">{favoriteCount}</span>
                  </div>
                </div>

                {/* Main Dashboard Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Recent Activity & Quick Add */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Recently Added Passwords */}
                    <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Recently Added</h2>
                        <button
                          onClick={openAddModal}
                          className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New</span>
                        </button>
                      </div>

                      {recentPasswords.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">
                          Your password vault is currently empty.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {recentPasswords.slice(0, 3).map((record) => (
                            <div
                              key={record.id}
                              className="bg-slate-900/40 border border-slate-200/5 hover:border-slate-800 rounded-lg p-3.5 flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                                  {record.websiteName[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{record.websiteName}</span>
                                  <span className="text-xs text-slate-400 mt-0.5">{record.username || record.email}</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => {
                                  setActiveTab("vault");
                                  setSearchTerm(record.websiteName);
                                }}
                                className="text-xs text-slate-400 hover:text-indigo-400 transition-all px-2.5 py-1.5 bg-white/5 rounded-md hover:bg-indigo-500/15"
                              >
                                View Entry
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Password Strength Analysis */}
                    <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-5">
                      <h2 className="text-lg font-bold">Security Analysis</h2>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                          <span>Overall Vault Score</span>
                          <span className="text-indigo-400 font-bold">
                            {totalPasswords > 0 ? Math.round((strongCount / totalPasswords) * 100) : 100}% Secure
                          </span>
                        </div>
                        {/* Custom progress bar */}
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                          <div 
                            style={{ width: `${totalPasswords > 0 ? (weakCount / totalPasswords) * 100 : 0}%` }} 
                            className="h-full bg-red-500" 
                          />
                          <div 
                            style={{ width: `${totalPasswords > 0 ? (mediumCount / totalPasswords) * 100 : 0}%` }} 
                            className="h-full bg-amber-500" 
                          />
                          <div 
                            style={{ width: `${totalPasswords > 0 ? ((totalPasswords - weakCount - mediumCount) / totalPasswords) * 100 : 100}%` }} 
                            className="h-full bg-indigo-500" 
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 text-center mt-2">
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="text-xs text-red-400 block font-mono font-bold">{weakCount}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">Weak</span>
                          </div>
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <span className="text-xs text-amber-400 block font-mono font-bold">{mediumCount}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">Medium</span>
                          </div>
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <span className="text-xs text-indigo-400 block font-mono font-bold">{strongCount}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">Strong</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Key Vault Instructions & Generator */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-base">Client-Side Zero Knowledge</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Every password is fully encrypted in your browser using AES-GCM prior to transmission. Krypton Vault never processes or knows your plain passwords or Master Passphrase.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <h3 className="font-bold text-base">Quick Password Generator</h3>
                      <div className="flex flex-col gap-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 font-mono text-sm text-center select-all tracking-wider font-semibold text-slate-200">
                          {generatedPass || "Krypton123!"}
                        </div>
                        <div className="flex justify-between gap-2.5">
                          <button
                            onClick={generateSecurePassword}
                            className="flex-1 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                          <button
                            onClick={() => handleCopyToClipboard(generatedPass, "Generated Password")}
                            className="h-9 w-9 bg-indigo-500 hover:opacity-95 text-white rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2.2. PASSWORD VAULT VIEW */}
            {(activeTab === "vault" || activeTab === "favorites") && (
              <div id="tab-vault" className="max-w-6xl mx-auto flex flex-col gap-6">
                
                {/* Vault Title and Add CTA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {activeTab === "favorites" ? "Favorite Credentials" : "Secure Password Vault"}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      {activeTab === "favorites" 
                        ? "Quick access to your most frequently used credentials." 
                        : "Manage, update, and deploy your secure encrypted passwords."}
                    </p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="h-10 px-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white font-medium rounded-full text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer shrink-0 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Password</span>
                  </button>
                </div>

                {/* Filters, Search, and Sorting Bar */}
                <div className="bg-white/5 border border-slate-200/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  
                  {/* Real-time search */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search by website, username, category or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
                    />
                    <div className="absolute left-3.5 top-3 text-slate-400">
                      <SearchIcon className="w-4.5 h-4.5" />
                    </div>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")} 
                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Category Filter */}
                    <div className="flex items-center bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg h-10 px-3">
                      <span className="text-xs text-slate-400 mr-2">Category:</span>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-transparent text-xs text-slate-300 outline-none border-none pr-2"
                      >
                        <option value="All">All Categories</option>
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        {customCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg h-10 px-3">
                      <span className="text-xs text-slate-400 mr-2">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-xs text-slate-300 outline-none border-none pr-2"
                      >
                        <option value="name-asc">Alphabetical (A-Z)</option>
                        <option value="name-desc">Alphabetical (Z-A)</option>
                        <option value="date-new">Created (Newest)</option>
                        <option value="date-old">Created (Oldest)</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Password Cards List */}
                {isVaultLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400 mt-3">Loading credentials...</p>
                  </div>
                ) : sortedVault.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-slate-200/15 rounded-xl py-20 px-4 text-center flex flex-col items-center justify-center gap-4">
                    <Database className="w-12 h-12 text-slate-500" />
                    <div>
                      <h3 className="font-bold text-lg">No Credentials Found</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                        We couldn't find any credentials matching your search or filters. Click "Add Password" above to create one.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedVault.map((record) => {
                      const isPassVisible = visiblePasswordIds[record.id!];
                      const plainPassword = decryptedPasswordsMap[record.id!] || "••••••••";
                      const plainNotes = decryptedNotesMap[record.id!] || "";
                      const { label, color } = getPasswordStrength(decryptedPasswordsMap[record.id!] || "fallback");

                      return (
                        <div
                          key={record.id}
                          id={`vault-card-${record.id}`}
                          className="bg-white/5 border border-slate-200/10 rounded-xl p-5 hover:border-slate-700/80 transition-all flex flex-col gap-4 relative group"
                        >
                          {/* Top Card Section: Web Name & Fav Toggle */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center">
                                {record.websiteName[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-base tracking-tight">{record.websiteName}</span>
                                {record.websiteUrl && (
                                  <a
                                    href={record.websiteUrl.startsWith("http") ? record.websiteUrl : `https://${record.websiteUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <span className="truncate max-w-[150px]">{record.websiteUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleFavorite(record)}
                                className={`p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer ${
                                  record.favoriteOption ? "text-pink-500" : "text-slate-400"
                                }`}
                                title="Favorite"
                              >
                                <Heart className="w-4.5 h-4.5" fill={record.favoriteOption ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>

                          {/* Credentials fields details */}
                          <div className="bg-slate-950/40 rounded-lg p-3.5 flex flex-col gap-2.5 text-xs">
                            {record.username && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-slate-400 font-mono">Username:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold">{record.username}</span>
                                  <button
                                    onClick={() => handleCopyToClipboard(record.username, "Username")}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                                    title="Copy Username"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {record.email && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-slate-400 font-mono">Email:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold">{record.email}</span>
                                  <button
                                    onClick={() => handleCopyToClipboard(record.email, "Email")}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                                    title="Copy Email"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-400 font-mono">Password:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-200 tracking-wider">
                                  {isPassVisible ? plainPassword : "••••••••"}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => togglePasswordVisibility(record)}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                                    title={isPassVisible ? "Hide Password" : "Show Password"}
                                  >
                                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => copyPasswordDirectly(record)}
                                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                                    title="Copy Password"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Password strength badge */}
                            {decryptedPasswordsMap[record.id!] && (
                              <div className="flex justify-between items-center border-t border-slate-900 pt-2 mt-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Strength</span>
                                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                  label === "Weak" ? "bg-red-500/10 text-red-400" :
                                  label === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {label}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Decrypted Notes preview on demand */}
                          {record.notesEncrypted && (
                            <div className="text-xs">
                              {plainNotes ? (
                                <div className="bg-slate-950/20 p-2.5 rounded border border-slate-900 text-slate-400 leading-normal">
                                  <span className="font-semibold text-slate-300 block mb-1">Secure Notes:</span>
                                  {plainNotes}
                                </div>
                              ) : (
                                <button
                                  onClick={() => decryptNotesOnDemand(record)}
                                  className="text-xs text-indigo-400 hover:underline font-medium"
                                >
                                  Unlock Secure Notes
                                </button>
                              )}
                            </div>
                          )}

                          {/* Meta & Tags Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 mt-1 pt-3 border-t border-slate-200/5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                                {record.category}
                              </span>
                              {record.tags.map((tag) => (
                                <span key={tag} className="text-[10px] text-indigo-400 font-mono border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            {/* Card control CTAs */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDuplicateRecord(record)}
                                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => openEditModal(record)}
                                className="text-xs text-indigo-400 hover:text-white px-2 py-1 bg-white/5 rounded hover:bg-indigo-500/20 transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id!, record.websiteName)}
                                className="text-xs text-rose-400 hover:text-white px-2 py-1 bg-white/5 rounded hover:bg-rose-500/25 transition-all cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2.3. CATEGORIES VIEW */}
            {activeTab === "categories" && (
              <div id="tab-categories" className="max-w-6xl mx-auto flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Category Organizers</h1>
                  <p className="text-sm text-slate-400 mt-1">Organize your secure vault credentials into segmented buckets.</p>
                </div>

                {/* Create Custom Category Card */}
                <form id="add-category-form" onSubmit={handleAddCategory} className="bg-white/5 border border-slate-200/10 rounded-xl p-5 shadow-sm max-w-md w-full">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Create Custom Category</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Subscriptions, Gaming"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 bg-indigo-500 hover:opacity-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create</span>
                    </button>
                  </div>
                </form>

                {/* Categories Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  
                  {/* Default Pre-Defined Categories */}
                  {DEFAULT_CATEGORIES.map((catName) => {
                    const count = vault.filter(r => r.category === catName).length;
                    return (
                      <div
                        key={catName}
                        onClick={() => {
                          setActiveTab("vault");
                          setSelectedCategoryFilter(catName);
                        }}
                        className="bg-white/5 border border-slate-200/5 rounded-xl p-5 hover:border-slate-700/80 transition-all cursor-pointer flex flex-col justify-between min-h-[110px]"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-base tracking-tight">{catName}</span>
                          <span className="text-xs text-slate-400">System Category</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                            {count} {count === 1 ? "entry" : "entries"}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}

                  {/* User-Custom Categories */}
                  {customCategories.map((cat) => {
                    const count = vault.filter(r => r.category === cat.name).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-white/5 border border-slate-200/5 hover:border-slate-700/80 rounded-xl p-5 transition-all flex flex-col justify-between min-h-[110px]"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div 
                            onClick={() => {
                              setActiveTab("vault");
                              setSelectedCategoryFilter(cat.name);
                            }}
                            className="flex flex-col gap-1 cursor-pointer flex-1"
                          >
                            <span className="font-bold text-base tracking-tight">{cat.name}</span>
                            <span className="text-xs text-slate-400">Custom Category</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                            title="Delete custom category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div 
                          onClick={() => {
                            setActiveTab("vault");
                            setSelectedCategoryFilter(cat.name);
                          }}
                          className="flex items-center justify-between mt-4 cursor-pointer"
                        >
                          <span className="text-xs font-mono text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded">
                            {count} {count === 1 ? "entry" : "entries"}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}

            {/* 2.4. PASSWORD GENERATOR VIEW */}
            {activeTab === "generator" && (
              <div id="tab-generator" className="max-w-2xl mx-auto flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Password Generator</h1>
                  <p className="text-sm text-slate-400 mt-1">Generate highly complex, cryptographically secure passwords.</p>
                </div>

                <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                  
                  {/* Generated pass canvas */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Password</label>
                    <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-4 flex items-center justify-between relative group">
                      <span className="font-mono text-lg md:text-xl font-bold text-slate-100 select-all tracking-wider break-all pr-4">
                        {generatedPass || "Select criteria..."}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={generateSecurePassword}
                          className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                          title="Generate New"
                        >
                          <RefreshCw className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleCopyToClipboard(generatedPass, "Generated Password")}
                          className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                          title="Copy Password"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength progress slider */}
                  {generatedPass && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400">Strength Rating</span>
                        <span className="font-bold text-indigo-400">{getPasswordStrength(generatedPass).label}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${getPasswordStrength(generatedPass).score}%` }} 
                          className={`h-full transition-all ${getPasswordStrength(generatedPass).color}`} 
                        />
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-200/5" />

                  {/* Generator parameter configurations */}
                  <div className="flex flex-col gap-5">
                    {/* Length Config */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Password Length</span>
                        <span className="text-sm font-mono font-bold text-indigo-400">{genLength} chars</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="64"
                        value={genLength}
                        onChange={(e) => setGenLength(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Character checklists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-200/5 select-none transition-all">
                        <input
                          type="checkbox"
                          checked={genUpper}
                          onChange={(e) => setGenUpper(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Uppercase Letters</span>
                          <span className="text-[11px] text-slate-400">ABC...</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-200/5 select-none transition-all">
                        <input
                          type="checkbox"
                          checked={genLower}
                          onChange={(e) => setGenLower(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Lowercase Letters</span>
                          <span className="text-[11px] text-slate-400">abc...</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-200/5 select-none transition-all">
                        <input
                          type="checkbox"
                          checked={genNumbers}
                          onChange={(e) => setGenNumbers(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Numbers</span>
                          <span className="text-[11px] text-slate-400">123...</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-200/5 select-none transition-all">
                        <input
                          type="checkbox"
                          checked={genSymbols}
                          onChange={(e) => setGenSymbols(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Symbols</span>
                          <span className="text-[11px] text-slate-400">!@#...</span>
                        </div>
                      </label>

                    </div>

                    {/* Exclude similar checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-slate-900/20 border border-slate-850/80 rounded-lg">
                      <input
                        type="checkbox"
                        checked={genExcludeSimilar}
                        onChange={(e) => setGenExcludeSimilar(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">Exclude Similar Characters</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Do not include similar-looking characters like (I, l, 1, o, 0, O)</span>
                      </div>
                    </label>

                  </div>

                </div>
              </div>
            )}

            {/* 2.5. SETTINGS VIEW */}
            {activeTab === "settings" && (
              <div id="tab-settings" className="max-w-3xl mx-auto flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Vault Settings</h1>
                  <p className="text-sm text-slate-400 mt-1">Configure security keys, themes, and manage data parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Change Master Password card */}
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Key className="w-5 h-5 text-indigo-400" />
                      <span>Change Master Password</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Updating your master password will fully decrypt and re-encrypt all existing credentials client-side using PBKDF2.
                    </p>
                    <form onSubmit={handleChangeMasterPassword} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Master Password</label>
                        <input
                          type="password"
                          value={newMasterPass}
                          onChange={(e) => setNewMasterPass(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg px-3.5 text-xs outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          required
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm New Master Password</label>
                        <input
                          type="password"
                          value={confirmNewMasterPass}
                          onChange={(e) => setConfirmNewMasterPass(e.target.value)}
                          placeholder="Re-type master password"
                          className="w-full h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg px-3.5 text-xs outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          required
                          minLength={8}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVaultLoading}
                        className="w-full h-10 bg-indigo-500 hover:opacity-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow mt-1"
                      >
                        {isVaultLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Re-encrypt Vault"}
                      </button>
                    </form>
                  </div>

                  {/* Change Login Password card */}
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      <span>Change Login Password</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Change the password used to authenticate your visual Krypton Vault account. This does not affect vault decryption.
                    </p>
                    <form onSubmit={handleChangeLoginPassword} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Login Password</label>
                        <input
                          type="password"
                          value={newLoginPass}
                          onChange={(e) => setNewLoginPass(e.target.value)}
                          placeholder="Choose password"
                          className="w-full h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg px-3.5 text-xs outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm New Login Password</label>
                        <input
                          type="password"
                          value={confirmNewLoginPass}
                          onChange={(e) => setConfirmNewLoginPass(e.target.value)}
                          placeholder="Re-type password"
                          className="w-full h-10 bg-slate-900/50 border border-slate-200/5 dark:border-slate-800 rounded-lg px-3.5 text-xs outline-none focus:border-indigo-500 text-slate-100 font-mono"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full h-10 bg-indigo-500 hover:opacity-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow mt-1"
                      >
                        Update Login Password
                      </button>
                    </form>
                  </div>

                  {/* Data Export / Import Card */}
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <span>Vault Data Control</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Backup or restore your passwords. Exported files will contain plain-text fields so handle them with strict confidentiality!
                    </p>
                    <div className="flex flex-col gap-2.5 mt-1">
                      <button
                        onClick={handleExportData}
                        className="w-full h-10 border border-slate-700 hover:bg-white/5 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Export Decrypted Vault (JSON)</span>
                      </button>
                      
                      <label className="w-full h-10 border border-slate-700 hover:bg-white/5 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer select-none">
                        <FileUp className="w-4 h-4" />
                        <span>Import JSON Backup File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Theme toggler and deletion */}
                  <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-400" />
                      <span>Visuals & Accounts</span>
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      {/* Theme Select */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase">App Theme Theme</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setTheme("light")}
                            className={`px-3 py-1.5 text-xs font-bold rounded ${
                              theme === "light" ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            Light Mode
                          </button>
                          <button
                            onClick={() => setTheme("dark")}
                            className={`px-3 py-1.5 text-xs font-bold rounded ${
                              theme === "dark" ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>

                      <hr className="border-slate-200/5" />

                      {/* Delete account */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-rose-400 uppercase">Danger Zone</span>
                        <button
                          onClick={handleDeleteAccount}
                          className="w-full h-10 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Vault & Account</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2.6. PROFILE VIEW */}
            {activeTab === "profile" && (
              <div id="tab-profile" className="max-w-2xl mx-auto flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Krypton Identity</h1>
                  <p className="text-sm text-slate-400 mt-1">Manage credentials associated with your vault instance.</p>
                </div>

                <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-2xl border border-indigo-500/20 shadow-inner">
                      {user.email ? user.email[0].toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">{user.email}</span>
                      <span className="text-xs text-indigo-400 font-mono font-medium">Free Tier Status</span>
                    </div>
                  </div>

                  <hr className="border-slate-200/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-slate-900/30 border border-slate-250/5 rounded-lg flex flex-col gap-1">
                      <span className="text-slate-400">Account ID:</span>
                      <span className="font-semibold text-slate-200 truncate">{user.uid}</span>
                    </div>
                    <div className="p-4 bg-slate-900/30 border border-slate-250/5 rounded-lg flex flex-col gap-1">
                      <span className="text-slate-400">Creation Date:</span>
                      <span className="font-semibold text-slate-200">
                        {userMeta?.createdDate ? new Date(userMeta.createdDate).toLocaleDateString() : "Today"}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-900/30 border border-slate-250/5 rounded-lg flex flex-col gap-1">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="font-semibold text-indigo-400">Google Cloud Firestore</span>
                    </div>
                    <div className="p-4 bg-slate-900/30 border border-slate-250/5 rounded-lg flex flex-col gap-1">
                      <span className="text-slate-400">Plan Rules:</span>
                      <span className="font-semibold text-emerald-400">Unlimited Vault Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2.7. ADMIN DASHBOARD VIEW */}
            {activeTab === "admin" && userMeta?.isAdmin && (
              <div id="tab-admin" className="max-w-6xl mx-auto flex flex-col gap-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-purple-400">Admin Control Panel</h1>
                  <p className="text-sm text-slate-400 mt-1">Superuser logs, counts, and aggregate usage statistics.</p>
                </div>

                {isAdminLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-sm text-slate-400 mt-3">Fetching admin data aggregates...</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Admin Aggregates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Total Active Users</span>
                        <span className="text-3xl font-bold mt-1 font-mono">{adminStats?.totalUsers}</span>
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Total Encrypted Passwords</span>
                        <span className="text-3xl font-bold mt-1 font-mono">{adminStats?.totalPasswords}</span>
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Estimated Firestore Storage</span>
                        <span className="text-3xl font-bold mt-1 font-mono">{adminStats?.storageUsageEstimateKb} KB</span>
                      </div>
                    </div>

                    {/* User Growth Log */}
                    <div className="bg-white/5 border border-slate-200/10 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <h3 className="font-bold text-base">User Registration Log</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm font-mono border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-xs text-slate-400">
                              <th className="py-3 font-semibold">Verification Date</th>
                              <th className="py-3 font-semibold text-right">Cumulative Registered Users</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminStats?.userGrowth.map((point, index) => (
                              <tr key={index} className="border-b border-slate-200/5 hover:bg-white/5 transition-all">
                                <td className="py-3.5 text-xs text-slate-300">{point.date}</td>
                                <td className="py-3.5 text-xs text-right font-semibold text-purple-400">{point.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </main>

          {/* 3. ADD/EDIT PASSWORD DIALOG MODAL */}
          {showPasswordModal && (
            <div id="password-dialog" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#0f1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                <div className="px-6 py-4.5 border-b border-slate-200/10 dark:border-slate-800/80 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {modalMode === "add" ? "Add Credentials" : "Edit Credentials"}
                  </h2>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePassword} className="p-6 flex flex-col gap-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Website Name (Required)</label>
                      <input
                        type="text"
                        value={formData.websiteName}
                        onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                        placeholder="Google, GitHub, Stripe"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Website URL</label>
                      <input
                        type="text"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://github.com"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username123"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@mail.com"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password (Required)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const result = getPasswordStrength(generatedPass); // Use a freshly generated secure password
                          setFormData({ ...formData, passwordRaw: generatedPass });
                          addToast("info", "Generated secure password autofilled.");
                        }}
                        className="text-[10px] text-indigo-400 font-semibold hover:underline"
                      >
                        Generate Secure Password
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.passwordRaw}
                      onChange={(e) => setFormData({ ...formData, passwordRaw: e.target.value })}
                      placeholder="Enter raw password"
                      className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      >
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        {customCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tags (Comma separated)</label>
                      <input
                        type="text"
                        value={formData.tagsString}
                        onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                        placeholder="personal, social, db"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Secure Notes / Additional Info</label>
                    <textarea
                      value={formData.notesRaw}
                      onChange={(e) => setFormData({ ...formData, notesRaw: e.target.value })}
                      rows={2.5}
                      placeholder="Bank secret keys, recovery tokens, etc."
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.favoriteOption}
                      onChange={(e) => setFormData({ ...formData, favoriteOption: e.target.checked })}
                      className="w-4.5 h-4.5 rounded text-indigo-500 border-slate-700 accent-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-400">Save directly to Favorites</span>
                  </label>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isVaultLoading}
                      className="h-10 px-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                    >
                      {isVaultLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Encrypt & Save"}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
