import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  Wallet,
  Tags,
  DollarSign,
  Plus,
  Trash2,
  Users,
  HardDrive,
  Mail,
  UserPlus,
  LogOut,
  Calendar,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Account, Category, DynamicBudgetConfig, ThemeMode } from '../types';
import { isDarkMode } from '../utils/theme';
import { formatMoney } from '../utils/format';
import { renderCategoryIcon } from '../utils/icons';
import { getDefaultAccounts, getDefaultCategories, getDefaultConfig } from '../storage/db';

interface FirstLaunchWizardProps {
  isOpen: boolean;
  currentUser: User | null;
  onSignInWithGoogle: () => Promise<User | null>;
  onSignOut: () => Promise<void>;
  onComplete: (data: {
    accounts: Account[];
    categories: Category[];
    budgetConfig: DynamicBudgetConfig;
    enableCoupleSync: boolean;
    partnerEmail?: string;
  }) => void;
  theme?: ThemeMode;
  currency?: string;
}

export const FirstLaunchWizard: React.FC<FirstLaunchWizardProps> = ({
  isOpen,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  onComplete,
  theme = 'auto',
  currency = 'TND',
}) => {
  const isDark = isDarkMode(theme);

  // Wizard Step: 1 = Auth choice, 2 = Accounts, 3 = Categories, 4 = Allowance, 5 = Couple Sync Prompt
  const [step, setStep] = useState<number>(1);
  const [authChoice, setAuthChoice] = useState<'google' | 'offline' | null>(currentUser ? 'google' : null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Accounts state
  const [wizardAccounts, setWizardAccounts] = useState<Account[]>(() => getDefaultAccounts());
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');

  // Categories state
  const [wizardCategories, setWizardCategories] = useState<Category[]>(() => getDefaultCategories());
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Allowance & Budget config
  const [wizardBudget, setWizardBudget] = useState<DynamicBudgetConfig>(() => ({
    ...getDefaultConfig(),
    budgetLimit: 750,
    currencyCode: currency,
  }));

  // Couple Sync Prompt choice
  const [enableCoupleSync, setEnableCoupleSync] = useState<boolean | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const user = await onSignInWithGoogle();
      if (user) {
        setAuthChoice('google');
      }
    } catch (e: any) {
      if (e?.message && (e.message.includes('cancelled') || e.message.includes('closed-by-user'))) {
        return;
      }
      console.warn('Google sign in wizard notice:', e?.message || e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFinish = () => {
    confetti({ particleCount: 70, spread: 80 });
    onComplete({
      accounts: wizardAccounts,
      categories: wizardCategories,
      budgetConfig: wizardBudget,
      enableCoupleSync: !!enableCoupleSync,
      partnerEmail: partnerEmail.trim() || undefined,
    });
  };

  // Add account helper
  const handleAddAccount = () => {
    if (!newAccName.trim()) return;
    const colors = ['#00BFA5', '#3193F5', '#7C4DFF', '#FF6E40', '#F53D99', '#F5D018'];
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      currency: wizardBudget.currencyCode || currency,
      color: colors[wizardAccounts.length % colors.length],
      icon: 'Wallet',
      includeInBalance: true,
      initialBalance: parseFloat(newAccBalance) || 0,
    };
    setWizardAccounts([...wizardAccounts, newAcc]);
    setNewAccName('');
    setNewAccBalance('');
  };

  // Add category helper
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const colors = ['#00BFA5', '#FF6E40', '#3193F5', '#7C4DFF', '#F53D99', '#F5D018'];
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
      color: colors[wizardCategories.length % colors.length],
      icon: newCatType === 'income' ? 'Briefcase' : 'ShoppingCart',
      budgetLimit: newCatType === 'expense' ? 100 : undefined,
    };
    setWizardCategories([...wizardCategories, newCat]);
    setNewCatName('');
  };

  return (
    <div
      id="first-launch-wizard-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        id="first-launch-wizard-card"
        className={`w-full max-w-xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-zinc-900 border-zinc-700/80 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Progress Bar & Step Indicators */}
        <div className={`px-6 pt-5 pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                {step}/5
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {step === 1 && 'Welcome & Authentication'}
                {step === 2 && 'Step 1 of 4: Initial Vaults'}
                {step === 3 && 'Step 2 of 4: Categories'}
                {step === 4 && 'Step 3 of 4: Monthly Allowance'}
                {step === 5 && 'Step 4 of 4: Couple & Family Sync'}
              </span>
            </div>
            <span className={`text-xs font-semibold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              Spend Daily Setup
            </span>
          </div>

          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: WELCOME & AUTHENTICATION SELECTION */}
          {step === 1 && (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-teal-500/20">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Welcome to Spend Daily
                </h1>
                <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  The dynamic daily allowance manager that calculates your safe-to-spend target every single day, keeping your finances effortlessly on track.
                </p>
              </div>

              <div className="space-y-3 max-w-md mx-auto text-left pt-2">
                <div className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Choose how to start:
                </div>

                {/* Option A: Google Sign-In */}
                <div
                  onClick={() => !currentUser && handleGoogleSignIn()}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                    authChoice === 'google' || currentUser
                      ? isDark
                        ? 'bg-teal-500/15 border-teal-500/60 ring-2 ring-teal-500/30'
                        : 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-500/30'
                      : isDark
                      ? 'bg-zinc-800/50 border-zinc-700/80 hover:bg-zinc-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
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
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Sign in with Google
                        </span>
                        {(authChoice === 'google' || currentUser) && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                            <Check className="w-4 h-4" /> Connected
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Enables automatic cloud backup and real-time Couple/Family household sync across devices.
                      </p>

                      {currentUser ? (
                        <div className="mt-2 flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <span className="truncate">{currentUser.email}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSignOut();
                              setAuthChoice(null);
                            }}
                            className="underline hover:text-rose-400 ml-2"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isSigningIn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoogleSignIn();
                          }}
                          className="mt-2.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition"
                        >
                          {isSigningIn ? 'Connecting...' : 'Click to Sign in'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option B: Offline Account */}
                <div
                  onClick={() => {
                    setAuthChoice('offline');
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                    authChoice === 'offline' && !currentUser
                      ? isDark
                        ? 'bg-teal-500/15 border-teal-500/60 ring-2 ring-teal-500/30'
                        : 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-500/30'
                      : isDark
                      ? 'bg-zinc-800/50 border-zinc-700/80 hover:bg-zinc-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-zinc-800 text-teal-400' : 'bg-slate-100 text-teal-600'
                    }`}>
                      <HardDrive className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Use an offline account
                        </span>
                        {authChoice === 'offline' && !currentUser && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                            <Check className="w-4 h-4" /> Selected
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        All data stays 100% private in your browser/device storage. No login required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INITIAL ACCOUNTS (VAULTS) SETUP */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Set up your Initial Vaults / Accounts
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Where do you hold money? Customize your wallets and starting balances:
                </p>
              </div>

              {/* Accounts list */}
              <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                {wizardAccounts.map((acc, idx) => (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-zinc-800/50 border-zinc-700/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 ring-2 ring-black/10"
                        style={{ backgroundColor: acc.color }}
                      />
                      <input
                        type="text"
                        value={acc.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWizardAccounts((prev) =>
                            prev.map((a) => (a.id === acc.id ? { ...a, name: val } : a))
                          );
                        }}
                        className={`font-semibold text-sm bg-transparent outline-none flex-1 truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {acc.currency}:
                      </span>
                      <input
                        type="number"
                        value={acc.initialBalance}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setWizardAccounts((prev) =>
                            prev.map((a) => (a.id === acc.id ? { ...a, initialBalance: val } : a))
                          );
                        }}
                        className={`w-24 px-2.5 py-1 rounded-xl text-right text-xs font-mono font-bold border outline-none ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      {wizardAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setWizardAccounts((prev) => prev.filter((a) => a.id !== acc.id))}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Account Inline Form */}
              <div className={`p-3 rounded-2xl border space-y-2 ${
                isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
              }`}>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  + Add another Vault / Account
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Revolut, Joint Card"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Balance"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    className={`w-24 px-3 py-2 rounded-xl text-xs outline-none border text-right font-mono ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    disabled={!newAccName.trim()}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL CATEGORIES SETUP */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Configure Initial Categories
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Organize your expenses and income. You can customize target budgets:
                </p>
              </div>

              {/* Categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[38vh] overflow-y-auto pr-1">
                {wizardCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                      isDark ? 'bg-zinc-800/50 border-zinc-700/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                        style={{ backgroundColor: cat.color || '#00BFA5' }}
                      >
                        {renderCategoryIcon(cat.icon, 15)}
                      </div>
                      <div className="truncate">
                        <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cat.name}
                        </div>
                        <div className={`text-[10px] capitalize ${
                          cat.type === 'income' ? 'text-emerald-500' : isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}>
                          {cat.type} {cat.budgetLimit ? `• ${formatMoney(cat.budgetLimit, currency)}` : ''}
                        </div>
                      </div>
                    </div>

                    {wizardCategories.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setWizardCategories((prev) => prev.filter((c) => c.id !== cat.id))}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Category Form */}
              <div className={`p-3 rounded-2xl border space-y-2 ${
                isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
              }`}>
                <div className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  + Add Custom Category
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Coffee, Gym, Books"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className={`px-2.5 py-2 rounded-xl text-xs outline-none border ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ALLOWANCE & PAYDAY CONFIGURATION */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Set your Monthly Spending Allowance
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Spend Daily divides your available spending budget into a safe-to-spend allowance each day:
                </p>
              </div>

              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-zinc-800/40 border-zinc-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Allowance Limit Input */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Monthly Budget Target ({wizardBudget.currencyCode || currency})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={wizardBudget.budgetLimit}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setWizardBudget((prev) => ({ ...prev, budgetLimit: val }));
                      }}
                      className={`w-full text-2xl font-mono font-black px-4 py-3 rounded-xl border outline-none transition focus:ring-2 focus:ring-teal-500/40 ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-teal-400'
                          : 'bg-white border-slate-300 text-teal-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Payday Selector */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Monthly Reset Day (Payday)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={wizardBudget.payday}
                      onChange={(e) => {
                        const val = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                        setWizardBudget((prev) => ({ ...prev, payday: val }));
                      }}
                      className={`w-24 text-center font-mono font-bold text-base px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Allowance resets every month on Day {wizardBudget.payday}
                    </span>
                  </div>
                </div>

                {/* Live Daily Allowance Preview */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                    : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Calculated Daily Allowance
                    </div>
                    <div className="text-xl font-mono font-black">
                      ~ {formatMoney(Math.round(wizardBudget.budgetLimit / 30), wizardBudget.currencyCode || currency)} / day
                    </div>
                  </div>
                  <Sparkles className="w-6 h-6 text-teal-500 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ONE-TIME COUPLE / FAMILY SYNC PROMPT */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500/20 to-teal-400/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Heart className="w-7 h-7" />
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Would you like to set up Couple & Family Sync?
                </h2>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Collaborate in real time with your wife or family members. Both can view the shared budget, log expenses, and maintain your daily safe-to-spend targets together.
                </p>
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                {/* Choice 1: Yes, enable sync */}
                <div
                  onClick={() => setEnableCoupleSync(true)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    enableCoupleSync === true
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-500/60 ring-2 ring-emerald-500/30'
                        : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/30'
                      : isDark
                      ? 'bg-zinc-800/40 border-zinc-700/80 hover:bg-zinc-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0 mt-0.5">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Yes, enable Couple & Family Sync
                        </span>
                        {enableCoupleSync === true && (
                          <Check className="w-4 h-4 text-emerald-500 font-bold" />
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Creates a private shared household space for you and your partner.
                      </p>

                      {/* If chosen and signed in, offer partner email field */}
                      {enableCoupleSync === true && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-emerald-500/20" onClick={(e) => e.stopPropagation()}>
                          <label className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                            isDark ? 'text-zinc-300' : 'text-slate-700'
                          }`}>
                            <Mail className="w-3.5 h-3.5 text-teal-400" />
                            Partner's Google Email (optional):
                          </label>
                          <input
                            type="email"
                            placeholder="partner.email@gmail.com"
                            value={partnerEmail}
                            onChange={(e) => setPartnerEmail(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                              isDark
                                ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Choice 2: No, personal use */}
                <div
                  onClick={() => setEnableCoupleSync(false)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    enableCoupleSync === false
                      ? isDark
                        ? 'bg-teal-500/15 border-teal-500/60 ring-2 ring-teal-500/30'
                        : 'bg-teal-50 border-teal-400 ring-2 ring-teal-500/30'
                      : isDark
                      ? 'bg-zinc-800/40 border-zinc-700/80 hover:bg-zinc-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-zinc-500/20 text-zinc-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          No, personal use for now
                        </span>
                        {enableCoupleSync === false && (
                          <Check className="w-4 h-4 text-teal-500 font-bold" />
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Keep this budget solely for yourself. You can easily turn on sync anytime later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Bottom Navigation Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.99] flex items-center gap-2 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={enableCoupleSync === null}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg hover:brightness-105 active:scale-[0.99] flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Spend Daily</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
