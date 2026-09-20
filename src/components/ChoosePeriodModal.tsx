import React from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { ThemeMode } from '../types';

interface ChoosePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriod: string; // e.g. "2026-09"
  onSelectPeriod: (period: string) => void;
  theme: ThemeMode;
}

export const ChoosePeriodModal: React.FC<ChoosePeriodModalProps> = ({
  isOpen,
  onClose,
  selectedPeriod,
  onSelectPeriod,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  // Generate last 6 months list using local year and month without UTC ISO shifting
  const months = [];
  const curr = new Date();
  for (let i = 0; i < 6; i++) {
    const targetDate = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    const label = targetDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" />
      <div
        className={`relative z-10 w-full max-w-sm rounded-[28px] border p-6 shadow-2xl transition-all ${
          isDark ? 'border-white/10 bg-[#0E0E18] text-white' : 'border-slate-200 bg-white text-slate-900'
        } liquid-glass`}
      >
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#007AFF]" />
            <h3 className="text-base font-extrabold">Choose Period</h3>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {months.map((m) => {
            const isSelected = selectedPeriod === m.value;
            return (
              <button
                key={m.value}
                onClick={() => {
                  onSelectPeriod(m.value);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-xs font-bold transition ${
                  isSelected
                    ? 'border-[#007AFF] bg-[#007AFF]/15 text-[#007AFF]'
                    : isDark
                    ? 'border-white/5 bg-white/[0.04] text-white/80 hover:bg-white/10'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{m.label}</span>
                {isSelected && <Check size={16} className="text-[#007AFF]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
