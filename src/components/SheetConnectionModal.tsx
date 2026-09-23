import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  Code2,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { SheetConnectionConfig, APPS_SCRIPT_SOURCE } from '../services/sheetConnection';

interface SheetConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConnectionConfig | null;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  errorMessage?: string;
  onUpdateUrl: (url: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onClearLocalStorage: () => void;
}

export function SheetConnectionModal({
  isOpen,
  onClose,
  config,
  syncStatus,
  errorMessage,
  onUpdateUrl,
  onRefresh,
  onClearLocalStorage,
}: SheetConnectionModalProps) {
  const [urlInput, setUrlInput] = useState(config?.url || config?.rawInput || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'setup-guide' | 'credentials'>('connect');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    try {
      setIsSubmitting(true);
      setStatusFeedback(null);
      await onUpdateUrl(urlInput.trim());
      setStatusFeedback('Successfully connected and synced with Google Sheet!');
    } catch (err: any) {
      setStatusFeedback(`Error connecting: ${err?.message || 'Check your URL'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear local browser storage? The app will only fetch and store data directly in your connected Google Sheet.')) {
      onClearLocalStorage();
      setStatusFeedback('Local browser storage cleared! Working strictly in Sheet-Only mode.');
    }
  };

  const isConnected = !!config?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Google Sheets Storage Connection
              </h2>
              <p className="text-xs text-slate-500">
                Store and fetch all categories and expenses directly from Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection & Sync
          </button>
          <button
            onClick={() => setActiveTab('setup-guide')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'setup-guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>How to Connect (60 Secs)</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Required Credentials</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 text-sm">
          {activeTab === 'connect' && (
            <>
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isConnected 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}>
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span>
                      {isConnected 
                        ? 'Connected to Google Sheet' 
                        : 'Not Connected — Currently Storing Locally'}
                    </span>
                    {syncStatus === 'syncing' && (
                      <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Syncing...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isConnected
                      ? `All expenses and category tables are fetched from and saved to your Sheet automatically.`
                      : `Paste your Google Apps Script Web App URL or Google Sheet link below to activate 100% Sheet-Only storage.`}
                  </p>
                  {config?.lastSynced && isConnected && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Last synchronized: {new Date(config.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              {/* URL Input Form */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Target Google Sheet:</span>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                  >
                    <span>Open Sheet (1EAoW4Of...)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  ID: 1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E
                </p>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Google Apps Script Web App URL or Sheet URL:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec or https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-24"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !urlInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Save & Link</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Paste the Web App URL from your Google Sheet (see "How to Connect" tab for 60-second setup).
                </p>
              </form>

              {/* Status Feedback */}
              {statusFeedback && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs font-medium text-slate-700 border border-slate-200">
                  {statusFeedback}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions: Refresh & Purge Local Storage */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await onRefresh();
                      setStatusFeedback('Refreshed latest data from Google Sheet!');
                    } catch (err: any) {
                      setStatusFeedback(`Refresh failed: ${err?.message || 'Check connection'}`);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={!isConnected || isSubmitting}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Fetch Fresh from Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Purge local storage cache to ensure only sheet data is kept"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Local Storage (Force Sheet Only)</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'setup-guide' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">Zero-Login Google Sheet Connection</p>
                  <p>
                    Because this app is deployed on GitHub Pages, deploying a <strong>Google Apps Script Web App</strong> allows the app to store and fetch directly into your Sheet without asking users for Google logins or complex OAuth redirects!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Step-by-Step (Takes 60 seconds):
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600">
                  <li>
                    Open your Google Sheet (e.g., <strong>harsha-marriage</strong>).
                  </li>
                  <li>
                    Click <strong>Extensions</strong> → <strong>Apps Script</strong> in the top menu.
                  </li>
                  <li>
                    Delete any existing code in the script editor, and paste the code below.
                  </li>
                  <li>
                    Click <strong>Deploy</strong> (top right) → <strong>New deployment</strong>.
                  </li>
                  <li>
                    Select <strong>Web app</strong> (click the gear icon if needed):
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-700">
                      <li><strong>Execute as:</strong> Me</li>
                      <li><strong>Who has access:</strong> Anyone</li>
                    </ul>
                  </li>
                  <li>
                    Click <strong>Deploy</strong>, copy the resulting <strong>Web app URL</strong>, and paste it into the "Connection & Sync" tab!
                  </li>
                </ol>
              </div>

              {/* Copy Script Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Apps Script Code to Paste:</span>
                  <button
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 select-all border border-slate-800">
                  {APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Google Cloud Credentials Guide</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You asked: <em>"what are the credentials u need i will provide, tell me how to get the credentials also"</em>. Here is how Google credentials work for Google Sheets:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900">1. Why Apps Script Web App is Best (No Credentials Needed)</p>
                    <p className="text-slate-600 mt-1">
                      With the Apps Script Web App, Google handles all permissions internally under your Google account. You don't need to create a Google Cloud Project, generate private keys, or register OAuth consent screens. Anyone viewing the website can fetch and update expenses instantly.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900">2. If using Google Cloud Service Account (Server-Side)</p>
                    <p className="text-slate-600 mt-1">
                      A Service Account email (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">harsha-marriage@commanding-day-300706.iam.gserviceaccount.com</code>) requires a private key JSON. Because your site runs in client browsers on GitHub Pages (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">github.io</code>), storing a Google Cloud private key in frontend JavaScript is a critical security vulnerability that Google actively blocks.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900">3. If using Google OAuth 2.0 (Sign in with Google)</p>
                    <p className="text-slate-600 mt-1">
                      Requires:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 pl-2">
                      <li><strong>OAuth Client ID</strong> from Google Cloud Console</li>
                      <li>Adding <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://njharshavardhan.github.io</code> to "Authorized JavaScript Origins"</li>
                      <li>Scope: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://www.googleapis.com/auth/spreadsheets</code></li>
                      <li>Every person who opens your website must click "Sign in with Google" and authorize access.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target Sheet: <strong>harsha-marriage</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
