import React, { useState } from "react";

interface FirebaseDomainHelpProps {
  errorMsg: string;
}

export const FirebaseDomainHelp: React.FC<FirebaseDomainHelpProps> = ({ errorMsg }) => {
  const [copied, setCopied] = useState(false);

  // Check if error is indeed an unauthorized domain error
  const isUnauthorizedDomain =
    errorMsg.toLowerCase().includes("unauthorized-domain") ||
    errorMsg.toLowerCase().includes("unauthorized domain");

  if (!isUnauthorizedDomain) {
    return (
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-start gap-2 animate-fade-in">
        <span className="shrink-0 font-bold mt-0.5">Error:</span>
        <p className="flex-1 leading-relaxed">{errorMsg}</p>
      </div>
    );
  }

  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy domain:", err);
    }
  };

  return (
    <div id="firebase-domain-warning" className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 text-xs rounded-xl shadow-sm space-y-3 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h4 className="font-semibold text-[13px] text-amber-800 dark:text-amber-300">Firebase Domain Authorization Required</h4>
          <p className="mt-1 text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            This domain must be authorized in your Firebase console before Firebase Authentication can accept credentials from this page.
          </p>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-black/30 rounded-lg p-2.5 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between gap-2">
        <code className="font-mono text-[11px] select-all truncate text-amber-950 dark:text-amber-100 flex-1">
          {currentDomain || "Loading domain..."}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[10px] flex items-center gap-1 transition-all active:scale-95 shadow-sm"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h5m-5 4h5m-1 4h1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="pt-1.5 border-t border-amber-200/40 dark:border-amber-900/20">
        <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1.5 uppercase tracking-wider text-[9px] font-mono">Quick Instructions</p>
        <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
          <li>
            Go to the{" "}
            <a
              href="https://console.firebase.google.com/project/invoice-generator-653a2/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-amber-900 dark:text-amber-100 hover:text-amber-700"
            >
              Firebase Console Settings
            </a>
            .
          </li>
          <li>
            Select the <strong className="font-medium">Authorized domains</strong> section under Settings.
          </li>
          <li>
            Click <strong className="font-medium">Add domain</strong>, paste the domain copied above, and click <strong className="font-medium">Add</strong>.
          </li>
          <li>Once added, refresh this page and try again!</li>
        </ol>
      </div>
    </div>
  );
};
