import React from 'react';
import { formatMoney } from '../utils/format';
import { ThemeMode } from '../types';

interface TwinCashflowCardsProps {
  incomeThisMonth: number;
  expensesThisMonth: number;
  currency: string;
  theme: ThemeMode;
  onSelectIncome: () => void;
  onSelectExpense: () => void;
}

export const TwinCashflowCards: React.FC<TwinCashflowCardsProps> = ({
  incomeThisMonth,
  expensesThisMonth,
  currency,
  theme,
  onSelectIncome,
  onSelectExpense,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';
  const netCashflow = incomeThisMonth - expensesThisMonth;
  const isNetPositive = netCashflow >= 0;

  return (
    <div className="space-y-3">
      {/* Twin Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Income Card (Tinted with 10% Apple Mint #34C759) */}
        <div
          onClick={onSelectIncome}
          role="button"
          tabIndex={0}
          className={`group relative cursor-pointer overflow-hidden rounded-[20px] p-4 sm:p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
            isDark
              ? 'specular-border-dark bg-[#34C759]/[0.08] text-white shadow-lg'
              : 'specular-border-light bg-[#34C759]/[0.06] text-black shadow-sm'
          } liquid-glass`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
              Income
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#34C759]/20 text-[#34C759] font-bold text-xs">
              ↓
            </span>
          </div>

          <div className={`mt-3 font-numeric text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            {formatMoney(incomeThisMonth, currency)}
          </div>

          <div className={`mt-1 flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
            <span>This Month</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#34C759]">View →</span>
          </div>
        </div>

        {/* Expenses Card (Tinted with 10% Apple Rose #FF2D55) */}
        <div
          onClick={onSelectExpense}
          role="button"
          tabIndex={0}
          className={`group relative cursor-pointer overflow-hidden rounded-[20px] p-4 sm:p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
            isDark
              ? 'specular-border-dark bg-[#FF2D55]/[0.08] text-white shadow-lg'
              : 'specular-border-light bg-[#FF2D55]/[0.06] text-black shadow-sm'
          } liquid-glass`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
              Expenses
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF2D55]/20 text-[#FF2D55] font-bold text-xs">
              ↑
            </span>
          </div>

          <div className={`mt-3 font-numeric text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            {formatMoney(expensesThisMonth, currency)}
          </div>

          <div className={`mt-1 flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
            <span>This Month</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#FF2D55]">View →</span>
          </div>
        </div>
      </div>

      {/* Minimalist Cashflow Net Indicator Pill */}
      <div className="flex justify-center pt-1">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition ${
            isDark
              ? 'border border-white/10 bg-white/[0.08] text-white/90'
              : 'border border-white/80 bg-white/80 text-black shadow-sm'
          } liquid-glass`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isNetPositive ? 'bg-[#34C759]' : 'bg-[#FF2D55]'
            }`}
          />
          <span className={`text-[11px] font-medium ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
            Net Cashflow:
          </span>
          <span className="font-numeric font-bold">
            {isNetPositive ? '+' : '-'}
            {formatMoney(Math.abs(netCashflow), currency)}
          </span>
        </div>
      </div>
    </div>
  );
};

