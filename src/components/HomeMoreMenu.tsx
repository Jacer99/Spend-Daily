import React, { useState } from 'react';
import {
  X,
  Search,
  Settings as SettingsIcon,
  FolderTree,
  Sun,
  Moon,
  Smartphone,
  CalendarClock,
  SlidersHorizontal,
  PieChart,
  Target,
  Users,
  ShieldCheck,
  Heart,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ThemeMode, Transaction } from '../types';
import { formatMoney } from '../utils/format';
import { User } from 'firebase/auth';
import { SharedBudgetSpace } from '../storage/firebase';

interface HomeMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (screen: string) => void;
  currency: string;
  totalBalance: number;
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
  currentUser?: User | null;
  budgetSpace?: SharedBudgetSpace | null;
  onOpenCoupleSync?: () => void;
}

export const HomeMoreMenu: React.FC<HomeMoreMenuProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onNavigate,
  currency,
  totalBalance,
  transactions,
  onSelectTransaction,
  currentUser,
  budgetSpace,
  onOpenCoupleSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  if (!isOpen) return null;

  // Filter transactions when search query is entered
  const searchResults = searchQuery.trim()
    ? transactions
        .filter((tx) =>
          tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  // Theme label and icon (Cycles Auto -> Light -> Dark -> Auto)
  const getThemeDetails = () => {
    if (theme === 'auto') {
      return { label: 'Auto', icon: <Smartphone size={22} className="text-cyan-400" /> };
    }
    if (theme === 'light') {
      return { label: 'Light', icon: <Sun size={22} className="text-amber-400" /> };
    }
    return { label: 'Dark', icon: <Moon size={22} className="text-indigo-400" /> };
  };

  const currentTheme = getThemeDetails();

  // Savings Goal calculation (target: e.g. 5,000 TND or 3x buffer)
  const savingsTarget = 5000;
  const currentSavings = Math.max(0, totalBalance);
  const savingsPct = Math.min(100, Math.round((currentSavings / savingsTarget) * 100));

  // Emergency liquidity threshold (e.g. 800 TND)
  const emergencyThreshold = 800;
  const isBufferSafe = totalBalance >= emergencyThreshold;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Translucent Blur Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l p-6 shadow-2xl transition-transform duration-300 ${
          isDark
            ? 'bg-[#0E0E18]/95 border-white/10 text-white'
            : 'bg-[#FDFCFF]/95 border-slate-200/90 text-slate-900'
        } liquid-glass`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Quick Access</h2>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Spend Daily Command Center
            </p>
          </div>
          <button
            onClick={onClose}
            title="Close Drawer"
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
              isDark
                ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Couple Sync Quick Status Banner */}
        <div className="mb-3">
          <button
            id="btn-drawer-open-couple-sync"
            onClick={() => {
              onOpenCoupleSync?.();
              onClose();
            }}
            className={`w-full p-3.5 rounded-2xl border transition text-left flex items-center justify-between gap-3 ${
              currentUser
                ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50'
                : 'bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent border-blue-500/30 text-blue-300 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  currentUser
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                <Heart size={18} />
              </div>
              <div>
                <div className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser ? (budgetSpace?.name || 'Couple Budget') : 'Connect with Wife'}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                    Free Cloud
                  </span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {currentUser
                    ? `Live sync (${budgetSpace?.members.length || 1} members)`
                    : 'Sign in with Google to sync live'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className={`shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-2">
          <div
            className={`relative flex items-center rounded-full border px-4 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/40 ${
              isDark
                ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                : 'border-slate-200 bg-slate-100 text-slate-900 placeholder:text-slate-400'
            }`}
          >
            <Search size={16} className={isDark ? 'text-white/40 mr-2' : 'text-slate-500 mr-2'} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical transactions..."
              className="w-full bg-transparent text-xs font-medium outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Live Search Results if searching */}
          {searchQuery.trim() && (
            <div className={`mt-2 rounded-2xl border p-2 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
              {searchResults.length === 0 ? (
                <div className={`p-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No transactions found</div>
              ) : (
                searchResults.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      if (onSelectTransaction) onSelectTransaction(tx);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.title}</p>
                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        {tx.date.slice(0, 10)}
                      </span>
                    </div>
                    <span
                      className={`font-numeric font-bold ${
                        tx.type === 'income' ? 'text-teal-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatMoney(tx.amount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4x2 Action Grid */}
        <div className="mt-6">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
            Tools & Navigation
          </span>

          <div className="mt-3 grid grid-cols-4 gap-3 text-center">
            {/* 1. Settings */}
            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={22} className={isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'} />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Settings
              </span>
            </button>

            {/* 2. Categories */}
            <button
              onClick={() => {
                onNavigate('categories');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <FolderTree size={22} className="text-teal-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Categories
              </span>
            </button>

            {/* 3. Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                {currentTheme.icon}
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                {currentTheme.label}
              </span>
            </button>

            {/* 4. Planned Payments */}
            <button
              onClick={() => {
                onNavigate('planned');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <CalendarClock size={22} className="text-purple-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Planned
              </span>
            </button>

            {/* 5. Spending Budget */}
            <button
              onClick={() => {
                onNavigate('budget-config');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={22} className="text-cyan-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Allowance
              </span>
            </button>

            {/* 6. Reports */}
            <button
              onClick={() => {
                onNavigate('reports');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <PieChart size={22} className="text-emerald-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Reports
              </span>
            </button>

            {/* 7. Budgets */}
            <button
              onClick={() => {
                onNavigate('budgets');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <Target size={22} className="text-amber-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Budgets
              </span>
            </button>

            {/* 8. Loans */}
            <button
              onClick={() => {
                onNavigate('loans');
                onClose();
              }}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.07] text-white shadow-lg group-hover:bg-white/15'
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <Users size={22} className="text-rose-400" />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                Loans
              </span>
            </button>
          </div>
        </div>

        {/* Savings Goal Row */}
        <div className="mt-6">
          <div
            className={`rounded-3xl border p-4.5 transition ${
              isDark
                ? 'border-white/10 bg-white/[0.06] text-white'
                : 'border-slate-200/80 bg-white text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                  <TrendingUp size={15} />
                </span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Target Savings Goal</span>
              </div>
              <span className="font-numeric font-bold text-teal-400">{savingsPct}%</span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${savingsPct}%` }}
              />
            </div>

            <div className={`mt-2 flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              <span>Current: {formatMoney(currentSavings, currency)}</span>
              <span>Target: {formatMoney(savingsTarget, currency)}</span>
            </div>
          </div>
        </div>

        {/* Buffer Alert Card */}
        <div className="mt-3">
          <div
            className={`rounded-3xl border p-4 flex items-start gap-3 ${
              isBufferSafe
                ? isDark
                  ? 'border-teal-500/20 bg-teal-500/10 text-teal-200'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
                : isDark
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck size={16} />
            </span>
            <div className="text-xs">
              <span className="font-bold block">
                {isBufferSafe ? 'Emergency Liquidity Intact' : 'Liquidity Threshold Alert'}
              </span>
              <p className="mt-0.5 opacity-80 leading-relaxed text-[11px]">
                {isBufferSafe
                  ? `Your reserve buffer of ${formatMoney(totalBalance, currency)} is securely maintaining your liquidity comfort zone.`
                  : `Your current reserves are below the recommended ${formatMoney(emergencyThreshold, currency)} buffer threshold.`}
              </p>
            </div>
          </div>
        </div>

        {/* Dedication Card */}
        <div className="mt-auto pt-6">
          <div
            className={`rounded-2xl border p-3.5 text-center transition ${
              isDark
                ? 'border-white/5 bg-white/[0.03] text-white/70'
                : 'border-slate-200/60 bg-slate-100/70 text-slate-600'
            }`}
          >
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold">
              Built with love for my wife <Heart size={14} className="fill-rose-500 text-rose-500" />
            </p>
            <p className={`mt-0.5 text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              Spend Daily · Tunisian Dinar (TND) Edition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
