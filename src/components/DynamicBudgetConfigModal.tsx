import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  DynamicBudgetConfig,
  BudgetPeriodType,
  Account,
  Category,
  ThemeMode,
} from '../types';

interface DynamicBudgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DynamicBudgetConfig;
  onSave: (newConfig: DynamicBudgetConfig) => void;
  accounts: Account[];
  categories: Category[];
  theme: ThemeMode;
}

export const DynamicBudgetConfigModal: React.FC<DynamicBudgetConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  accounts,
  categories,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [periodType, setPeriodType] = useState<BudgetPeriodType>(config.periodType);
  const [payday, setPayday] = useState<number>(config.payday || 25);
  const [customStart, setCustomStart] = useState<string>(
    config.customStart || new Date().toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    config.customEnd || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [budgetLimit, setBudgetLimit] = useState<string>(
    config.budgetLimit > 0 ? config.budgetLimit.toString() : '500'
  );
  const [includeIncome, setIncludeIncome] = useState<boolean>(config.includeIncomeInBudget);

  const handleSave = () => {
    const limitNum = parseFloat(budgetLimit) || 0;
    onSave({
      ...config,
      budgetLimit: limitNum,
      periodType,
      payday,
      customStart,
      customEnd,
      includeIncomeInBudget: includeIncome,
    });
    onClose();
  };

  const handleRemoveBudget = () => {
    if (confirm('Remove spending budget? Home will revert to standard transaction tracking.')) {
      onSave({
        ...config,
        budgetLimit: 0,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Translucent Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-300 ${
          isDark ? 'bg-[#050508]/80' : 'bg-white/70'
        } backdrop-blur-xl animate-fadeIn`}
      />

      {/* Screen Container */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-[32px] border p-6 sm:p-7 shadow-2xl transition-all duration-300 ${
          isDark
            ? 'border-white/10 bg-[#0E0E18]/95 text-white'
            : 'border-white/80 bg-white/95 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
        } liquid-glass my-auto max-h-[92vh] overflow-y-auto`}
      >
        {/* Header: ( <- ) Spending budget */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              title="Back"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Spending budget</h2>
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                Parameters governing the daily allowance engine
              </p>
            </div>
          </div>
        </div>

        {/* Budget Amount Card */}
        <div className="mt-5">
          <div
            className={`rounded-3xl border p-5 transition ${
              isDark ? 'border-white/10 bg-white/[0.05]' : 'border-slate-200 bg-slate-50 shadow-sm'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
              Budget Amount
            </span>
            <div className="mt-2 flex items-center justify-between gap-3">
              <input
                type="number"
                step="any"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                placeholder="500"
                className="w-full bg-transparent font-numeric text-4xl sm:text-5xl font-black tracking-tight outline-none"
              />
              <span className="flex h-10 items-center justify-center rounded-2xl bg-teal-500/20 px-3.5 text-sm font-bold text-teal-400 border border-teal-500/30">
                TND
              </span>
            </div>
          </div>
        </div>

        {/* Cycle Period Selector */}
        <div className="mt-6">
          <span className={`text-xs font-bold uppercase tracking-wider block mb-2 px-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Period
          </span>

          <div className="space-y-2.5">
            {/* 1. Weekly */}
            <div
              onClick={() => setPeriodType('weekly')}
              className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                periodType === 'weekly'
                  ? 'border-teal-400 bg-teal-500/15 ring-1 ring-teal-500/40'
                  : isDark
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    periodType === 'weekly'
                      ? 'border-teal-400 bg-teal-500 text-white'
                      : isDark
                      ? 'border-white/30'
                      : 'border-slate-300'
                  }`}
                >
                  {periodType === 'weekly' && <Check size={12} />}
                </div>
                <div>
                  <span className="text-sm font-bold block">Weekly</span>
                  <span className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Cycles every 7 days (resets every Monday)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Monthly */}
            <div
              onClick={() => setPeriodType('monthly')}
              className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                periodType === 'monthly'
                  ? 'border-teal-400 bg-teal-500/15 ring-1 ring-teal-500/40'
                  : isDark
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    periodType === 'monthly'
                      ? 'border-teal-400 bg-teal-500 text-white'
                      : isDark
                      ? 'border-white/30'
                      : 'border-slate-300'
                  }`}
                >
                  {periodType === 'monthly' && <Check size={12} />}
                </div>
                <div>
                  <span className="text-sm font-bold block">Monthly</span>
                  <span className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Resets on the 1st of every calendar month
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Salary Cycle */}
            <div
              onClick={() => setPeriodType('salary')}
              className={`rounded-2xl border p-4 cursor-pointer transition ${
                periodType === 'salary'
                  ? 'border-teal-400 bg-teal-500/15 ring-1 ring-teal-500/40'
                  : isDark
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      periodType === 'salary'
                        ? 'border-teal-400 bg-teal-500 text-white'
                        : isDark
                        ? 'border-white/30'
                        : 'border-slate-300'
                    }`}
                  >
                    {periodType === 'salary' && <Check size={12} />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block">Salary cycle</span>
                    <span className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      Resets on user-specified payday (displays countdown on Home)
                    </span>
                  </div>
                </div>
              </div>

              {periodType === 'salary' && (
                <div className="mt-3 pl-8 flex items-center gap-2">
                  <span className="text-xs font-semibold">Payday day of month:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={payday}
                    onChange={(e) => setPayday(parseInt(e.target.value) || 1)}
                    className={`w-16 rounded-xl border px-3 py-1.5 text-xs font-bold text-center outline-none ${
                      isDark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* 4. Custom */}
            <div
              onClick={() => setPeriodType('custom')}
              className={`rounded-2xl border p-4 cursor-pointer transition ${
                periodType === 'custom'
                  ? 'border-teal-400 bg-teal-500/15 ring-1 ring-teal-500/40'
                  : isDark
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    periodType === 'custom'
                      ? 'border-teal-400 bg-teal-500 text-white'
                      : isDark
                      ? 'border-white/30'
                      : 'border-slate-300'
                  }`}
                >
                  {periodType === 'custom' && <Check size={12} />}
                </div>
                <div>
                  <span className="text-sm font-bold block">Custom</span>
                  <span className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Arbitrary start and end dates
                  </span>
                </div>
              </div>

              {periodType === 'custom' && (
                <div className="mt-3 pl-8 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Start</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className={`w-full rounded-xl border p-2 text-xs outline-none ${
                        isDark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>End</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className={`w-full rounded-xl border p-2 text-xs outline-none ${
                        isDark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional Income Toggle */}
        <div className="mt-4 px-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={includeIncome}
              onChange={(e) => setIncludeIncome(e.target.checked)}
              className="h-4 w-4 rounded text-teal-500 focus:ring-teal-400"
            />
            <span className="font-medium">Automatically add received income to spending capacity</span>
          </label>
        </div>

        {/* Action Buttons: Save & Remove Budget */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 font-bold text-sm text-white shadow-xl shadow-teal-500/25 transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <Check size={18} />
            <span>Save</span>
          </button>

          {config.budgetLimit > 0 && (
            <button
              type="button"
              onClick={handleRemoveBudget}
              className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Trash2 size={14} />
              <span>Remove budget</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
