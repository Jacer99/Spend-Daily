import React from 'react';
import {
  Clock,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { BudgetSnapshot, DynamicBudgetConfig, ThemeMode } from '../types';
import { formatMoney } from '../utils/format';

interface SafeToSpendCardProps {
  snapshot: BudgetSnapshot;
  config: DynamicBudgetConfig;
  currency: string;
  theme: ThemeMode;
  onOpenConfig: () => void;
  onAddExpense: () => void;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({
  snapshot,
  config,
  currency,
  theme,
  onOpenConfig,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  if (snapshot.status === 'noBudget' || config.budgetLimit <= 0) {
    return (
      <div
        id="safe-to-spend-no-budget"
        className={`relative overflow-hidden rounded-[26px] p-6 transition-all duration-300 ${
          isDark
            ? 'specular-border-dark bg-[#1C1C1E]/55 text-white'
            : 'specular-border-light bg-white/75 text-black'
        } liquid-glass`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#007AFF]/15 text-[#007AFF]">
              <Sparkles size={18} />
            </span>
            <div>
              <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
                Dynamic Daily Budget
              </span>
              <h2 className="text-base font-extrabold tracking-tight">One Number a Day</h2>
            </div>
          </div>
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105 active:scale-95"
          >
            <SlidersHorizontal size={13} />
            Configure
          </button>
        </div>

        <div className={`mt-5 rounded-2xl border border-dashed p-5 text-center ${
          isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-300/80 bg-slate-50/50'
        }`}>
          <p className="text-sm font-semibold">No daily budget active</p>
          <p className={`mt-1 text-xs leading-relaxed max-w-md mx-auto ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
            Set your monthly or weekly spending capacity, and Spend Daily will automatically calculate your daily safe-to-spend allowance without judgment.
          </p>
        </div>
      </div>
    );
  }

  // Safe to spend value: if overspent, rests calmly at 0.00 TND!
  const isOverspent = snapshot.remainingAllowance <= 0;
  const displayAmount = isOverspent ? 0 : snapshot.remainingAllowance;

  // Tomorrow projection formatted
  const tomorrowFormatted =
    snapshot.tomorrowProjection !== null
      ? (snapshot.tomorrowProjection > 0 ? '+' : '') +
        formatMoney(Math.max(0, snapshot.tomorrowProjection), currency)
      : '+0.00 ' + currency;

  // Payday / Cycle progress label
  const cycleDaysLabel =
    config.periodType === 'salary'
      ? `${snapshot.daysRemaining} ${snapshot.daysRemaining === 1 ? 'day' : 'days'} until next payday cycle`
      : `${snapshot.daysRemaining} ${snapshot.daysRemaining === 1 ? 'day' : 'days'} remaining in cycle`;

  // Low funds detection:
  // - If weekly period has periodRemaining <= 50 TND
  // - If monthly (or salary) period has periodRemaining <= 200 TND
  const isWeekly = config.periodType === 'weekly';
  const isLowFunds = isWeekly ? snapshot.periodRemaining <= 50 : snapshot.periodRemaining <= 200;
  const lowFundsThreshold = isWeekly ? 50 : 200;

  return (
    <div
      id="safe-to-spend-card"
      className={`relative overflow-hidden rounded-[26px] p-6 sm:p-7 transition-all duration-300 ${
        isDark
          ? 'specular-border-dark bg-[#1C1C1E]/55 text-white'
          : 'specular-border-light bg-white/75 text-black'
      } liquid-glass`}
    >
      {/* Top Specular Rim Reflection Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'
          }`}
        >
          Safe to spend today
        </span>

        <button
          onClick={onOpenConfig}
          title="Adjust Budget"
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-105 active:scale-95 ${
            isDark
              ? 'border-white/10 bg-white/5 text-[#98989D] hover:bg-white/10 hover:text-white'
              : 'border-black/5 bg-black/5 text-[#8E8E93] hover:bg-black/10 hover:text-black'
          }`}
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* Hero Number: 48sp ExtraBold */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="flex items-baseline justify-center gap-1.5">
          <span
            className={`font-numeric text-5xl sm:text-6xl font-extrabold tracking-tight leading-none ${
              isDark
                ? 'bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm'
                : 'text-black'
            }`}
          >
            {formatMoney(displayAmount, '').trim()}
          </span>
          <span
            className={`text-lg sm:text-xl font-bold ${
              isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'
            }`}
          >
            {currency}
          </span>
        </div>

        {/* Tomorrow Target Capsule Pill */}
        <div
          className={`mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm transition ${
            isDark
              ? 'border border-white/15 bg-white/10 text-[#F2F2F7]'
              : 'border border-white/80 bg-white/80 text-[#1C1C1E]'
          }`}
        >
          <Clock size={12} className={isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'} />
          <span>Tomorrow: {tomorrowFormatted}</span>
        </div>

        {/* Subtext: Payday label or calm non-punitive overspend guidance */}
        {isOverspent ? (
          <div
            className={`mt-3 max-w-sm rounded-2xl px-3.5 py-2 text-center text-xs leading-relaxed ${
              isDark
                ? 'border border-white/10 bg-white/[0.04] text-[#98989D]'
                : 'border border-black/5 bg-black/[0.03] text-[#8E8E93]'
            }`}
          >
            You are {formatMoney(snapshot.overTodayAmount, currency)} over today's target. Future allowances will adjust automatically.
          </div>
        ) : (
          <p
            className={`mt-2 text-xs font-medium tracking-wide ${
              isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'
            }`}
          >
            {cycleDaysLabel}
          </p>
        )}

        {/* Low Funds Red Alert Banner */}
        {isLowFunds && (
          <div
            id="low-funds-alert"
            className="mt-3.5 flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-[#FF3B30]/40 bg-[#FF3B30]/15 px-4 py-2.5 text-center text-xs font-bold text-[#FF3B30] shadow-sm animate-pulse"
          >
            <AlertCircle size={16} className="shrink-0 text-[#FF3B30]" />
            <span>
              Low Funds Alert: {formatMoney(snapshot.periodRemaining, currency)} remaining in this {isWeekly ? 'week' : 'month'} (threshold: ≤ {lowFundsThreshold} {currency})
            </span>
          </div>
        )}
      </div>

      {/* Subtle Metrics Footer: Keep only Today's Charges and Period Remaining (money hidden unless alert is necessary) */}
      <div className={`mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-center ${
        isDark ? 'border-white/10' : 'border-black/5'
      }`}>
        <div>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#98989D]/70' : 'text-[#8E8E93]'}`}>
            Today's Charges
          </span>
          <p className="font-numeric mt-0.5 text-xs font-bold">
            {formatMoney(snapshot.todayCharges, currency)}
          </p>
        </div>
        <div>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#98989D]/70' : 'text-[#8E8E93]'}`}>
            Period Remaining
          </span>
          {isLowFunds ? (
            <p className="font-numeric mt-0.5 text-xs font-extrabold text-[#FF3B30] animate-pulse">
              {formatMoney(snapshot.periodRemaining, currency)}
            </p>
          ) : (
            <p className={`mt-0.5 text-xs font-medium ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
              {snapshot.daysRemaining} {snapshot.daysRemaining === 1 ? 'day' : 'days'} left
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

