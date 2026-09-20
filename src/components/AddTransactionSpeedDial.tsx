import React from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CalendarClock,
  Plus,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface AddTransactionSpeedDialProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'expense' | 'income' | 'transfer' | 'reservation') => void;
  onOpenPlannedPayment: () => void;
  theme: ThemeMode;
}

export const AddTransactionSpeedDial: React.FC<AddTransactionSpeedDialProps> = ({
  isOpen,
  onClose,
  onSelectType,
  onOpenPlannedPayment,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme !== 'light';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-12 sm:pb-16">
      {/* Translucent Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-300 ${
          isDark ? 'bg-[#050508]/80' : 'bg-white/75'
        } backdrop-blur-xl animate-fadeIn`}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Planned Payment Floating Glass Pill */}
        <button
          onClick={() => {
            onOpenPlannedPayment();
            onClose();
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-lg transition hover:scale-105 active:scale-95 ${
            isDark
              ? 'specular-border-dark bg-[#1C1C1E]/70 text-white hover:bg-[#1C1C1E]'
              : 'specular-border-light bg-white/85 text-black hover:bg-white'
          } liquid-glass`}
        >
          <CalendarClock size={15} className="text-[#5856D6]" />
          <span>Add planned payment</span>
        </button>

        {/* Action Triad (Three 62dp circular buttons) */}
        <div className="flex items-end justify-center gap-6 sm:gap-10">
          {/* Left: Add Income (62dp circular, Apple Mint #34C759) */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                onSelectType('income');
                onClose();
              }}
              title="Add Income"
              className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#34C759] text-white shadow-xl shadow-[#34C759]/30 border border-white/40 transition hover:scale-110 active:scale-95"
            >
              <ArrowDownLeft size={28} />
            </button>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
              Income
            </span>
          </div>

          {/* Center: Add Expense (68dp elevated FAB with Apple Blue to Indigo #007AFF -> #5856D6) */}
          <div className="flex flex-col items-center gap-2 -translate-y-3">
            <button
              onClick={() => {
                onSelectType('expense');
                onClose();
              }}
              title="Add Expense"
              className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white shadow-2xl shadow-[#007AFF]/35 border border-white/50 transition hover:scale-110 active:scale-95 ring-4 ring-black/5"
            >
              <ArrowUpRight size={32} />
            </button>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
              Expense
            </span>
          </div>

          {/* Right: Transfer (62dp circular, Apple Indigo #5856D6) */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                onSelectType('transfer');
                onClose();
              }}
              title="Account Transfer"
              className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#5856D6] text-white shadow-xl shadow-[#5856D6]/30 border border-white/40 transition hover:scale-110 active:scale-95"
            >
              <ArrowRightLeft size={26} />
            </button>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
              Transfer
            </span>
          </div>
        </div>

        {/* Dismiss Button: 48dp circular frosted button ( X ) */}
        <button
          onClick={onClose}
          title="Close"
          className={`mt-2 flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 active:scale-95 ${
            isDark
              ? 'specular-border-dark bg-[#1C1C1E]/70 text-white hover:bg-[#1C1C1E]'
              : 'specular-border-light bg-white/85 text-black hover:bg-white shadow-md'
          } liquid-glass`}
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );
};
