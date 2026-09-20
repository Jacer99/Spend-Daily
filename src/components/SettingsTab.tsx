import React, { useRef } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  FileSpreadsheet,
  Users,
  Heart,
  LogIn,
  LogOut,
  Share2,
  Bell,
  Clock,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, ThemeMode, Transaction, Account, Category, NotificationSettings } from '../types';
import { SharedBudgetSpace } from '../storage/firebase';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (json: string) => void;
  onResetData: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currentUser?: User | null;
  budgetSpace?: SharedBudgetSpace | null;
  onOpenCoupleSync?: () => void;
  onOpenOnboarding?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetData,
  transactions,
  accounts,
  categories,
  currentUser,
  budgetSpace,
  onOpenCoupleSync,
  onOpenOnboarding,
}) => {
  const isDark =
    settings.theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : settings.theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencies = [
    { code: 'TND', label: 'Tunisian Dinar (TND)' },
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'GBP', label: 'British Pound (£)' },
    { code: 'CAD', label: 'Canadian Dollar (CAD)' },
    { code: 'CHF', label: 'Swiss Franc (CHF)' },
    { code: 'AED', label: 'Emirati Dirham (AED)' },
    { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Title', 'Amount', 'Currency', 'Account', 'Category', 'Note', 'AllocationMode'];
    const rows = transactions.map((t) => {
      const acc = accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
      const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
      return [
        t.date,
        t.type,
        `"${t.title.replace(/"/g, '""')}"`,
        t.amount,
        settings.currency,
        `"${acc}"`,
        `"${cat}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        t.allocationMode || 'TODAY',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spend_daily_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div
        className={`p-6 rounded-3xl border shadow-xl ${
          isDark
            ? 'bg-slate-900/70 border-white/10 text-white backdrop-blur-xl'
            : 'bg-white border-slate-200 text-slate-900 shadow-md backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
            <Sparkles size={24} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Spend Daily</h2>
            <p className="text-xs text-slate-400">
              One number a day — money manager and dynamic daily budgeting
            </p>
          </div>
        </div>
      </div>

      {/* Cloud & Couple Sync (Online with Google Auth) */}
      <div
        id="settings-couple-sync-card"
        className={`p-6 rounded-3xl border ${
          isDark
            ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/30 border-emerald-500/30 text-white'
            : 'bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 border-emerald-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Heart size={18} />
              </span>
              <h3 className="font-bold text-sm">Online Couple & Family Sync</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Free
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Synchronize expenses in real-time between you and your wife. Both of you sign in with
              Google to edit transactions and view safe-to-spend allowances concurrently.
            </p>
          </div>
          <button
            id="btn-open-couple-sync-settings"
            onClick={onOpenCoupleSync}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 shrink-0"
          >
            <Users size={14} />
            <span>{currentUser ? 'Manage Sync' : 'Sign in with Google'}</span>
          </button>
        </div>

        {currentUser && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                Logged in as <strong className="text-white">{currentUser.email}</strong>
              </span>
            </div>
            {budgetSpace && (
              <div className="flex items-center gap-2 text-slate-400 font-mono bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                <span>Invite Code:</span>
                <span className="text-emerald-400 font-bold tracking-wider">
                  {budgetSpace.inviteCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theme Settings */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark
            ? 'bg-slate-900/60 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
          <Palette size={16} className="text-teal-400" />
          Color Theme
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Choose between System default (Auto), Light, and Dark.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { id: 'auto', label: 'System default (Auto)', sub: 'Follows device theme setting' },
              { id: 'light', label: 'Light', sub: 'Crisp porcelain & high contrast dark text' },
              { id: 'dark', label: 'Dark', sub: 'Deep obsidian #0A0A0E liquid glass' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => onUpdateSettings({ ...settings, theme: t.id })}
              className={`p-3.5 rounded-2xl border text-left transition ${
                settings.theme === t.id
                  ? 'border-teal-500 bg-teal-500/20 text-teal-300 font-bold shadow-md ring-1 ring-teal-500/30'
                  : isDark
                  ? 'border-white/5 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{t.label}</span>
                {settings.theme === t.id && <Check size={14} className="text-teal-400 shrink-0 ml-1" />}
              </div>
              <span className="text-[10px] opacity-75 mt-1 block leading-tight">{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Alerts & Reminders Settings */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark
            ? 'bg-slate-900/60 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#007AFF]" />
            <h3 className="font-bold text-sm">Notifications & Reminders</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              const current = settings.notifications || {
                enabled: true,
                budgetAlerts: true,
                categoryAlerts: true,
                dailyReminder: true,
                dailyReminderTime: '20:00',
              };
              onUpdateSettings({
                ...settings,
                notifications: {
                  ...current,
                  enabled: !current.enabled,
                },
              });
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
              settings.notifications?.enabled !== false ? 'bg-[#007AFF]' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                settings.notifications?.enabled !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Receive proactive alerts when exceeding daily safe-to-spend allowances, reaching category caps, or daily reminders to add expenses.
        </p>

        <div className="space-y-3 divide-y divide-white/5">
          {/* Daily Safe-to-Spend & Low Funds Alert */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">Safe-to-Spend & Low Funds Alerts</span>
              <span className="text-[11px] text-slate-400">
                Notifies if daily allowance is exceeded or funds drop below 50 TND weekly / 200 TND monthly
              </span>
            </div>
            <button
              type="button"
              disabled={settings.notifications?.enabled === false}
              onClick={() => {
                const current = settings.notifications || {
                  enabled: true,
                  budgetAlerts: true,
                  categoryAlerts: true,
                  dailyReminder: true,
                  dailyReminderTime: '20:00',
                };
                onUpdateSettings({
                  ...settings,
                  notifications: {
                    ...current,
                    budgetAlerts: !current.budgetAlerts,
                  },
                });
              }}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                settings.notifications?.enabled !== false && settings.notifications?.budgetAlerts !== false
                  ? 'bg-[#007AFF]'
                  : 'bg-slate-700 opacity-60'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  settings.notifications?.enabled !== false && settings.notifications?.budgetAlerts !== false
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Category Spending Limit Exceeded Alert */}
          <div className="pt-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">Category Spending Limit Alerts</span>
              <span className="text-[11px] text-slate-400">
                Trigger an alert when a category expense reaches or exceeds its assigned monthly limit
              </span>
            </div>
            <button
              type="button"
              disabled={settings.notifications?.enabled === false}
              onClick={() => {
                const current = settings.notifications || {
                  enabled: true,
                  budgetAlerts: true,
                  categoryAlerts: true,
                  dailyReminder: true,
                  dailyReminderTime: '20:00',
                };
                onUpdateSettings({
                  ...settings,
                  notifications: {
                    ...current,
                    categoryAlerts: !current.categoryAlerts,
                  },
                });
              }}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                settings.notifications?.enabled !== false && settings.notifications?.categoryAlerts !== false
                  ? 'bg-[#007AFF]'
                  : 'bg-slate-700 opacity-60'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  settings.notifications?.enabled !== false && settings.notifications?.categoryAlerts !== false
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Daily Expense Logging Reminder */}
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Daily Expense Logging Reminder</span>
                <span className="text-[11px] text-slate-400">
                  Daily evening prompt reminding you to enter today's receipts and cash purchases
                </span>
              </div>
              <button
                type="button"
                disabled={settings.notifications?.enabled === false}
                onClick={() => {
                  const current = settings.notifications || {
                    enabled: true,
                    budgetAlerts: true,
                    categoryAlerts: true,
                    dailyReminder: true,
                    dailyReminderTime: '20:00',
                  };
                  onUpdateSettings({
                    ...settings,
                    notifications: {
                      ...current,
                      dailyReminder: !current.dailyReminder,
                    },
                  });
                }}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                  settings.notifications?.enabled !== false && settings.notifications?.dailyReminder !== false
                    ? 'bg-[#007AFF]'
                    : 'bg-slate-700 opacity-60'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                    settings.notifications?.enabled !== false && settings.notifications?.dailyReminder !== false
                      ? 'translate-x-4'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Daily Reminder Time Picker */}
            {settings.notifications?.enabled !== false && settings.notifications?.dailyReminder !== false && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <Clock size={16} className="text-slate-400" />
                <span className="text-xs text-slate-300">Reminder Time:</span>
                <input
                  type="time"
                  value={settings.notifications?.dailyReminderTime || '20:00'}
                  onChange={(e) => {
                    const current = settings.notifications || {
                      enabled: true,
                      budgetAlerts: true,
                      categoryAlerts: true,
                      dailyReminder: true,
                      dailyReminderTime: '20:00',
                    };
                    onUpdateSettings({
                      ...settings,
                      notifications: {
                        ...current,
                        dailyReminderTime: e.target.value,
                      },
                    });
                  }}
                  className={`rounded-xl border px-3 py-1 text-xs font-numeric ${
                    isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark
            ? 'bg-slate-900/60 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <h3 className="font-bold text-sm mb-1">Default Currency</h3>
        <p className="text-xs text-slate-400 mb-3">
          Select primary currency for budget snapshots and account balances.
        </p>

        <select
          value={settings.currency}
          onChange={(e) => onUpdateSettings({ ...settings, currency: e.target.value })}
          className={`w-full max-w-sm rounded-xl border p-2.5 text-xs font-semibold ${
            isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Backup & Restore */}
      <div
        className={`p-6 rounded-3xl border ${
          isDark
            ? 'bg-slate-900/60 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <h3 className="font-bold text-sm mb-1">Data Management</h3>
        <p className="text-xs text-slate-400 mb-4">
          Export your financial data or restore a previous snapshot.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-bold hover:bg-teal-500/25 transition"
          >
            <Download size={14} />
            Export JSON Backup
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25 transition"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition ${
              isDark
                ? 'border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload size={14} />
            Import JSON Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition"
          >
            <RotateCcw size={14} />
            Reset to Sample Data
          </button>

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/25 transition"
            >
              <Sparkles size={14} />
              First-Launch Setup Wizard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
