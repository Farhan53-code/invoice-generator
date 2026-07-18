import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { generateVerifier } from "../utils/crypto";
import { saveUserMeta, addAuditLog } from "../utils/db";
import { FirebaseDomainHelp } from "./FirebaseDomainHelp";

export default function RegisterApp() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [masterPassword, setMasterPassword] = useState<string>("");
  const [masterPasswordConfirm, setMasterPasswordConfirm] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        window.location.href = "/dashboard";
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!mobileNumber) {
      setErrorMsg("Mobile Number is required. Please enter it below before signing up with Google.");
      setLoading(false);
      return;
    }

    if (masterPassword.length < 8) {
      setErrorMsg("Vault Master Password (at least 8 chars) is required. Please enter it below before signing up with Google.");
      setLoading(false);
      return;
    }

    if (masterPassword !== masterPasswordConfirm) {
      setErrorMsg("Vault Master Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(auth, provider);
      
      // Hash Master Password locally
      const verifier = await generateVerifier(masterPassword);
      
      // Save User Metadata securely with mobile number
      await saveUserMeta(credentials.user.uid, credentials.user.email || "", verifier, mobileNumber);
      await addAuditLog(credentials.user.uid, credentials.user.email || "", "Account Created", "Successfully registered new account via Google and zero-knowledge verifier");

      setSuccessMsg("Account successfully provisioned with Google! Accessing dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let cleanMessage = err.message || "An error occurred during Google registration.";
      if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
        cleanMessage = `Unauthorized Domain: Please authorize "${window.location.hostname}" in your Firebase Console (under Authentication > Settings > Authorized domains).`;
      }
      setErrorMsg(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!mobileNumber) {
      setErrorMsg("Mobile Number is required.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (masterPassword.length < 8) {
      setErrorMsg("Vault Master Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (masterPassword !== masterPasswordConfirm) {
      setErrorMsg("Vault Master Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth User
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Hash Master Password locally
      const verifier = await generateVerifier(masterPassword);
      
      // 3. Save User Metadata securely with mobile number
      await saveUserMeta(credentials.user.uid, email, verifier, mobileNumber);
      await addAuditLog(credentials.user.uid, email, "Account Created", "Successfully registered new account and zero-knowledge verifier with mobile number");

      setSuccessMsg("Account successfully provisioned! Accessing dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let cleanMessage = err.message;
      if (err.code === "auth/email-already-in-use") {
         cleanMessage = "This email is already linked to an existing account.";
      } else if (err.code === "auth/weak-password") {
         cleanMessage = "This password is too simple. Use a stronger value.";
      } else if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
         cleanMessage = `Unauthorized Domain: Please authorize "${window.location.hostname}" in your Firebase Console (under Authentication > Settings > Authorized domains).`;
      }
      setErrorMsg(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#fafafa] dark:bg-[#0a0a0a] relative transition-colors duration-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] -z-10" />

      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-xl transition-all">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-950 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-black font-black text-lg shadow-sm mb-3">
            S
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Create your Account</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">
            Start using the ultimate security & productivity suite.
          </p>
        </div>

        {errorMsg && <FirebaseDomainHelp errorMsg={errorMsg} />}

        {successMsg && (
          <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-lg flex items-center gap-2">
            <span className="shrink-0 font-bold">Info:</span>
            <p className="flex-1">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full h-10 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-neutral-800 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
              Mobile Number (Required) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full h-10 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-neutral-800 dark:text-neutral-100 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
              Sign In Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full h-10 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-neutral-800 dark:text-neutral-100 font-mono"
              required
              minLength={8}
            />
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800/80 my-2 pt-3">
            <div className="bg-neutral-50 dark:bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-850 mb-3">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Zero-Knowledge Vault</p>
              <p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">
                Set a Master Password. We do not store this password. It guarantees absolute, uncrackable encryption of your vault files.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Vault Master Password</label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Strong Master Password"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-neutral-800 dark:text-neutral-100 font-mono"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Confirm Master Password</label>
                <input
                  type="password"
                  value={masterPasswordConfirm}
                  onChange={(e) => setMasterPasswordConfirm(e.target.value)}
                  placeholder="Confirm Master Password"
                  className="w-full h-10 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-neutral-800 dark:text-neutral-100 font-mono"
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-neutral-950 dark:bg-white text-white dark:text-black font-semibold rounded-lg text-xs flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? "Provisioning Vault..." : "Register New Account"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-450 dark:text-neutral-500 font-bold">Or secure register</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full h-10 bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-850 disabled:opacity-50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">
          <span>Already have an account? </span>
          <a href="/login" className="font-semibold text-indigo-500 dark:text-indigo-400 hover:underline">Sign In</a>
        </div>
      </div>
    </div>
  );
}
