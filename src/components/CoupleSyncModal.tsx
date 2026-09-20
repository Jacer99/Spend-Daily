import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Share2,
  Copy,
  Check,
  LogIn,
  LogOut,
  Sparkles,
  Heart,
  ShieldCheck,
  RefreshCw,
  Mail,
  UserPlus,
  AlertCircle,
  Cloud,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SharedBudgetSpace } from '../storage/firebase';
import { ThemeMode } from '../types';

interface CoupleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  budgetSpace: SharedBudgetSpace | null;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onJoinBudget: (codeOrId: string) => Promise<boolean>;
  onAddPartnerEmail: (email: string) => Promise<boolean>;
  theme?: ThemeMode;
}

export const CoupleSyncModal: React.FC<CoupleSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  budgetSpace,
  isSyncing,
  isOnline,
  lastSyncedAt,
  onSignInWithGoogle,
  onSignOut,
  onJoinBudget,
  onAddPartnerEmail,
  theme = 'auto',
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [copied, setCopied] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCopyInviteCode = () => {
    if (!budgetSpace?.inviteCode) return;
    navigator.clipboard.writeText(budgetSpace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (!budgetSpace?.inviteCode) return;
    const url = `${window.location.origin}${window.location.pathname}?invite=${budgetSpace.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvitePartnerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const ok = await onAddPartnerEmail(partnerEmail.trim());
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: `Success! ${partnerEmail} was added to this shared household. When she logs in with Google using that email, she will immediately sync!`,
        });
        setPartnerEmail('');
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Could not add partner email. Please verify the address.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error adding partner email.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const ok = await onJoinBudget(joinCodeInput.trim());
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: 'Connected! Your device is now live synchronized with your shared household.',
        });
        setJoinCodeInput('');
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Invite code not found. Please double-check with your partner.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to join budget space.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await onSignInWithGoogle();
    } catch (err: any) {
      if (err?.message && (err.message.includes('cancelled') || err.message.includes('closed-by-user'))) {
        return;
      }
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Google Sign-in failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="couple-sync-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="couple-sync-modal-card"
        className={`w-full max-w-lg border rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6 transition ${
          isDark
            ? 'bg-zinc-900 border-zinc-700/80 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Couple & Family Sync
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold">
                  Free Cloud
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Real-time shared household expense manager for you and your family
              </p>
            </div>
          </div>
          <button
            id="btn-close-couple-modal"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            ✕
          </button>
        </div>

        {/* Status indicator bar */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs ${
          isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentUser ? (isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-zinc-500'
              }`}
            />
            <span className="font-medium">
              {currentUser
                ? isOnline
                  ? 'Cloud Synced (Live)'
                  : 'Offline (Changes cached locally)'
                : 'Local Only (Sign in to sync with family)'}
            </span>
          </div>
          {lastSyncedAt && (
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Auth Section */}
        {!currentUser ? (
          <div className={`p-5 rounded-2xl border text-center space-y-4 ${
            isDark ? 'bg-zinc-800/40 border-zinc-700/70' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sign in with Google</h3>
              <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Sign in with your Google account. Your partner will also sign in with theirs, so you both
                have full real-time access to update transactions and budgets simultaneously.
              </p>
            </div>
            <button
              id="btn-google-signin"
              disabled={isSubmitting}
              onClick={handleGoogleSignInClick}
              className={`w-full py-3 px-4 rounded-2xl border disabled:opacity-60 font-semibold flex items-center justify-center gap-3 shadow-sm transition active:scale-[0.99] ${
                isDark
                  ? 'bg-white hover:bg-zinc-100 text-zinc-900 border-white/20'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Profile info */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-zinc-600 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600/30 text-emerald-500 font-bold flex items-center justify-center border border-emerald-500/40">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser.displayName || 'Logged in User'}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{currentUser.email}</div>
                </div>
              </div>
              <button
                id="btn-signout"
                onClick={onSignOut}
                className={`text-xs py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 ${
                  isDark
                    ? 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200/70'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>

            {/* Shared Budget Space Card */}
            {budgetSpace && (
              <div className={`p-4 rounded-2xl border space-y-4 ${
                isDark
                  ? 'bg-gradient-to-b from-zinc-800/80 to-zinc-800/40 border-emerald-500/30'
                  : 'bg-gradient-to-b from-emerald-50/50 to-white border-emerald-300 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Active Shared Space
                    </div>
                    <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{budgetSpace.name}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-mono ${
                    isDark ? 'bg-zinc-700/70 text-zinc-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {budgetSpace.members.length} {budgetSpace.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {/* Invite Code & Share Button */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-zinc-900/90 border-zinc-700/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[11px] uppercase tracking-wider font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Household Invite Code
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-mono font-bold tracking-widest text-emerald-500">
                      {budgetSpace.inviteCode}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-copy-invite-code"
                        type="button"
                        onClick={handleCopyInviteCode}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600/70'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                      <button
                        id="btn-copy-share-link"
                        type="button"
                        onClick={handleCopyShareLink}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-medium text-emerald-600 border border-emerald-500/40 flex items-center gap-1.5 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Link</span>
                      </button>
                    </div>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Your family can enter this code in their device to link with your shared budget instantly.
                  </p>
                </div>

                {/* Add Partner by Email form */}
                <form onSubmit={handleInvitePartnerEmail} className="space-y-2">
                  <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    <Mail className="w-3.5 h-3.5 text-teal-500" />
                    Or grant access directly to your family member's Google Email:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="input-partner-email"
                      type="email"
                      placeholder="family.member@gmail.com"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/40 ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      id="btn-add-partner-email"
                      type="submit"
                      disabled={isSubmitting || !partnerEmail.trim()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  </div>
                </form>

                {/* Authorized Members list */}
                <div className="space-y-1.5 pt-1">
                  <div className={`text-[11px] uppercase tracking-wider font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Authorized Household Members:
                  </div>
                  <div className="space-y-1">
                    {budgetSpace.members
                      .filter((m) => m.includes('@'))
                      .map((memberEmail, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-xl border ${
                            isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {memberEmail}
                          </span>
                          {memberEmail.toLowerCase() === budgetSpace.ownerEmail?.toLowerCase() ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                              Creator
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 border border-emerald-500/40">
                              Partner
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Join another budget space */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Join an existing household
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                If your partner already created the household, enter their 6-letter invite code below:
              </p>
              <form onSubmit={handleJoinWithCode} className="flex items-center gap-2">
                <input
                  id="input-join-code"
                  type="text"
                  placeholder="e.g. 7K2M9P"
                  maxLength={10}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm font-mono tracking-widest uppercase outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  id="btn-submit-join-code"
                  type="submit"
                  disabled={isSubmitting || !joinCodeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Feedback message banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? isDark
                  ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : isDark
                ? 'bg-rose-950/60 border border-rose-700/50 text-rose-300'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* Footer info */}
        <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-500'
        }`}>
          <span>Powered by Google Cloud Firestore (Free tier)</span>
          <button
            id="btn-done-modal"
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
