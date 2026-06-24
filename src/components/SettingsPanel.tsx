import React, { useEffect, useState } from "react";
import { 
  Key, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  TrendingUp,
  FileText,
  Share2
} from "lucide-react";

interface SettingsPanelProps {
  isLive: boolean;
}

export default function SettingsPanel({ isLive }: SettingsPanelProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* API Key Status Banner */}
      <div className={`p-5 rounded-2xl border ${
        isLive 
          ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
          : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/30 text-amber-800 dark:text-amber-300"
      }`}>
        <div className="flex gap-3 items-start">
          <div className={`p-2 rounded-xl shrink-0 ${isLive ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-amber-100 dark:bg-amber-950 text-amber-600"}`}>
            <Key size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base">
              {isLive ? "Connected to Google Places API (Live Mode)" : "Running in Demo Mode (Simulated Data)"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isLive 
                ? "The application is successfully querying real-time local business directories directly from Google's Places database using your securely configured API Key."
                : "The application is currently running on our local high-fidelity simulation engine. Search any business category, city, and state to explore the full layout, CRM tracking, and Opportunity Scores immediately."}
            </p>
          </div>
        </div>

        {/* Setup Instructions if in Demo Mode */}
        {!isLive && (
          <div className="mt-4 pt-4 border-t border-amber-200/40 dark:border-slate-800/80 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Want to query real Google Places database live? Add your API Key:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  Get an API key from Google Cloud Console
                </a>
              </li>
              <li>
                Open the <b>Settings</b> menu (⚙️ gear icon, <b>top-right corner of AI Studio UI</b>)
              </li>
              <li>
                Select <b>Secrets</b>
              </li>
              <li>
                Add a secret named <code>GOOGLE_MAPS_PLATFORM_KEY</code>
              </li>
              <li>
                Paste your Google API Key as the value and press <b>Enter</b>
              </li>
            </ol>
            <div className="flex items-center gap-2 bg-amber-100/40 dark:bg-amber-950/20 p-2.5 rounded-xl text-[11px] text-amber-700 dark:text-amber-400">
              <Info size={14} className="shrink-0" />
              <span>Note: The container will rebuild and compile your app automatically with the new key injected safely at the backend. Do not manually refresh the page!</span>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Score Formula Documentation */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 rounded-2xl p-5 space-y-4 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            Opportunity Score Formulation
          </h4>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The Opportunity Score (0 to 100) indicates the likelihood and magnitude of a business needing agency services like website creation, local SEO, review generation, or profile optimization. It is computed as follows:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Website Status (Up to 50 pts)</span>
            <span className="text-xs leading-relaxed block">
              <b className="text-rose-500 font-semibold">+35 points</b> if no website exists. This is a primary indicator for high-intent design leads.
            </span>
            <span className="text-xs leading-relaxed block text-slate-400 dark:text-slate-600">
              <b className="font-semibold">-15 points</b> if a website already exists.
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Review Volume (Up to 15 pts)</span>
            <span className="text-xs leading-relaxed block">
              <b className="text-amber-500 font-semibold">+15 points</b> for 0 reviews.
            </span>
            <span className="text-xs leading-relaxed block">
              <b className="font-semibold">+10 points</b> for &lt; 15 reviews.
            </span>
            <span className="text-xs leading-relaxed block text-slate-400 dark:text-slate-600">
              Indicates opportunity for reputation management.
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Profile Rating (Up to 15 pts)</span>
            <span className="text-xs leading-relaxed block">
              <b className="text-indigo-500 font-semibold">+15 points</b> for ratings &lt; 3.8.
            </span>
            <span className="text-xs leading-relaxed block">
              <b className="font-semibold">+5 points</b> for ratings between 3.8 and 4.4.
            </span>
            <span className="text-xs leading-relaxed block text-slate-400 dark:text-slate-600">
              Indicates need for local SEO and review optimization.
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completeness (Up to 10 pts)</span>
            <span className="text-xs leading-relaxed block">
              <b className="font-semibold">+10 points</b> if phone number is missing.
            </span>
            <span className="text-xs leading-relaxed block text-slate-400 dark:text-slate-600">
              Indicates incomplete citations and listings directory optimization opportunity.
            </span>
          </div>
        </div>
      </div>

      {/* SEO & Share Tools */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900/60 rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
          Share Dashboard
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Share your custom filter results and leads list with team members or clients. Any saved CRM data remains local to your browser for safety.
        </p>
        <button
          onClick={copyUrlToClipboard}
          className="cursor-pointer text-xs font-bold py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <Share2 size={14} />
          {copiedLink ? "Copied Link!" : "Copy Application Link"}
        </button>
      </div>
    </div>
  );
}
