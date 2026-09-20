import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Transaction,
  Category,
  ThemeMode,
  BudgetSnapshot,
} from '../types';
import { formatMoney } from '../utils/format';
import { renderCategoryIcon } from '../utils/icons';

interface ReportsTabProps {
  transactions: Transaction[];
  categories: Category[];
  snapshot: BudgetSnapshot;
  currency: string;
  theme: ThemeMode;
}

type ReportMode = 'expense' | 'balance' | 'income';
type TimeInterval = 'all' | 'year' | 'month' | 'week';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  categories,
  snapshot,
  currency,
  theme,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  // Mode Switcher: [ Expense | Balance | Income ]
  const [mode, setMode] = useState<ReportMode>('expense');

  // Time Interval Selector: [ All Time | Year | Month | Week ]
  const [interval, setInterval] = useState<TimeInterval>('month');

  // Selected Arc / Category filter for segment highlight
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Filter transactions by time interval
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const nowISO = now.toISOString().slice(0, 10);

    return transactions.filter((tx) => {
      const txDate = tx.date.slice(0, 10);
      if (interval === 'all') return true;
      if (interval === 'year') {
        return txDate.startsWith(now.getFullYear().toString());
      }
      if (interval === 'month') {
        const monthPrefix = now.toISOString().slice(0, 7);
        return txDate.startsWith(monthPrefix);
      }
      if (interval === 'week') {
        // Last 7 days
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        return txDate >= weekAgo && txDate <= nowISO;
      }
      return true;
    });
  }, [transactions, interval]);

  // Compute breakdown data according to Mode
  const { chartData, totalOutflow, totalInflow, netBalance } = useMemo(() => {
    let outflow = 0;
    let inflow = 0;

    const categoryStats: Record<string, { value: number; count: number }> = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        outflow += tx.amount;
        if (mode === 'expense' || mode === 'balance') {
          const catId = tx.categoryId || 'other';
          if (!categoryStats[catId]) categoryStats[catId] = { value: 0, count: 0 };
          categoryStats[catId].value += tx.amount;
          categoryStats[catId].count += 1;
        }
      } else if (tx.type === 'income') {
        inflow += tx.amount;
        if (mode === 'income') {
          const catId = tx.categoryId || 'other';
          if (!categoryStats[catId]) categoryStats[catId] = { value: 0, count: 0 };
          categoryStats[catId].value += tx.amount;
          categoryStats[catId].count += 1;
        }
      }
    });

    const list = Object.entries(categoryStats).map(([catId, stats]) => {
      const cat = categoryMap.get(catId);
      return {
        id: catId,
        name: cat?.name || 'Other',
        value: stats.value,
        count: stats.count,
        color: cat?.color || (mode === 'income' ? '#10B981' : '#F43F5E'),
        icon: cat?.icon || 'CircleDollarSign',
      };
    });

    list.sort((a, b) => b.value - a.value);

    return {
      chartData: list,
      totalOutflow: outflow,
      totalInflow: inflow,
      netBalance: inflow - outflow,
    };
  }, [filteredTransactions, mode, categoryMap]);

  const activeTotal = mode === 'income' ? totalInflow : totalOutflow;

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return chartData.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, chartData]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Analytics & Reports</h1>
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
          Visual Financial Flows & Category Breakdown
        </p>
      </div>

      {/* Mode Switcher: Elegant 3-segment pill dock: [ Expense | Balance | Income ] */}
      <div className="flex justify-center">
        <div
          className={`grid grid-cols-3 rounded-full border p-1 w-full max-w-sm ${
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-100'
          }`}
        >
          <button
            onClick={() => {
              setMode('expense');
              setSelectedCategoryId(null);
            }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === 'expense'
                ? 'bg-rose-500 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => {
              setMode('balance');
              setSelectedCategoryId(null);
            }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === 'balance'
                ? 'bg-purple-500 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balance
          </button>
          <button
            onClick={() => {
              setMode('income');
              setSelectedCategoryId(null);
            }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === 'income'
                ? 'bg-teal-500 text-white shadow-md'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Time Interval Selector */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'year', label: 'Year' },
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
            ] as const
          ).map((item) => {
            const isSelected = interval === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setInterval(item.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'border-teal-400 bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Donut Visualization with Central Hero Display */}
      <div
        className={`relative overflow-hidden rounded-[32px] border p-6 sm:p-8 shadow-2xl transition ${
          isDark
            ? 'border-white/10 bg-white/[0.07] text-white shadow-2xl'
            : 'border-white/80 bg-white/70 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
        } liquid-glass`}
      >
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No transactions found for this interval.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Donut Chart Container */}
            <div className="relative h-64 w-64 sm:h-72 sm:w-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={3}
                    onClick={(entry) => {
                      setSelectedCategoryId(selectedCategoryId === entry.id ? null : entry.id);
                    }}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        opacity={
                          selectedCategoryId === null || selectedCategoryId === entry.id ? 1 : 0.35
                        }
                        stroke={selectedCategoryId === entry.id ? '#ffffff' : 'transparent'}
                        strokeWidth={2}
                        className="cursor-pointer transition-all"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value, currency), 'Amount']}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: '16px',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Central Hero Display inside Donut */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                  {selectedCategory
                    ? selectedCategory.name
                    : mode === 'expense'
                    ? 'EXPENSES'
                    : mode === 'income'
                    ? 'INCOME'
                    : 'OUTFLOW'}
                </span>
                <span className="font-numeric text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                  {formatMoney(
                    selectedCategory ? selectedCategory.value : activeTotal,
                    currency
                  )}
                </span>
                {selectedCategory && activeTotal > 0 && (
                  <span className="text-[11px] font-bold text-teal-400 mt-0.5">
                    {Math.round((selectedCategory.value / activeTotal) * 100)}% of total
                  </span>
                )}
              </div>
            </div>

            {/* Hint */}
            <span className={`mt-2 text-[11px] ${isDark ? 'text-white/45' : 'text-slate-400'}`}>
              {selectedCategoryId ? 'Tap again to reset selection' : 'Tap an arc segment to inspect'}
            </span>
          </div>
        )}
      </div>

      {/* Breakdown List: Category breakdown sorted by percentage */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
          Breakdown by Category ({chartData.length})
        </h3>

        <div className="space-y-2.5">
          {chartData.map((item) => {
            const percent = activeTotal > 0 ? Math.round((item.value / activeTotal) * 100) : 0;
            const isSelected = selectedCategoryId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCategoryId(isSelected ? null : item.id)}
                className={`relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition ${
                  isSelected
                    ? 'border-teal-400 bg-teal-500/15 ring-2 ring-teal-500/30'
                    : isDark
                    ? 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    >
                      {renderCategoryIcon(item.icon, 18)}
                    </span>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                      <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-numeric text-sm font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatMoney(item.value, currency)}
                    </span>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{percent}%</span>
                  </div>
                </div>

                {/* Percentage progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
