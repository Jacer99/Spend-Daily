import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  Trash2,
  Check,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import {
  Category,
  Transaction,
  Reservation,
  PlannedPayment,
  ThemeMode,
} from '../types';
import { formatMoney } from '../utils/format';
import { renderCategoryIcon } from '../utils/icons';

interface BudgetsTabProps {
  categories: Category[];
  transactions: Transaction[];
  reservations: Reservation[];
  plannedPayments: PlannedPayment[];
  currency: string;
  theme: ThemeMode;
  onUpdateCategoryBudget: (categoryId: string, limit: number) => void;
  onConvertReservation: (res: Reservation) => void;
  onDeleteReservation: (id: string) => void;
  onPayPlannedPayment: (plan: PlannedPayment) => void;
  onDeletePlannedPayment: (id: string) => void;
  onOpenAddModal: (type: 'expense' | 'income' | 'reservation') => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  categories,
  transactions,
  reservations,
  plannedPayments,
  currency,
  theme,
  onUpdateCategoryBudget,
  onConvertReservation,
  onDeleteReservation,
  onPayPlannedPayment,
  onDeletePlannedPayment,
  onOpenAddModal,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catBudgetVal, setCatBudgetVal] = useState<string>('');

  // Calculate current month's spending per category
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.categoryId && tx.date.startsWith(currentMonth)) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions, currentMonth]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status === 'active'),
    [reservations]
  );

  const handleEditBudget = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatBudgetVal((cat.budgetLimit || 0).toString());
  };

  const handleSaveBudget = (catId: string) => {
    const limit = parseFloat(catBudgetVal) || 0;
    onUpdateCategoryBudget(catId, limit);
    setEditingCatId(null);
  };

  const [viewSection, setViewSection] = useState<'categories' | 'reservations' | 'planned'>('categories');

  return (
    <div className="space-y-6">
      {/* Top Segmented Controller: Explicit separation of Category Limits vs Planned Reservations */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
        <button
          onClick={() => setViewSection('categories')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            viewSection === 'categories'
              ? 'bg-[#007AFF] text-white shadow'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-black'
          }`}
        >
          <TrendingUp size={14} />
          <span>Category Limits ({expenseCategories.length})</span>
        </button>

        <button
          onClick={() => setViewSection('reservations')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            viewSection === 'reservations'
              ? 'bg-purple-600 text-white shadow'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-black'
          }`}
        >
          <Bookmark size={14} />
          <span>Planned Reservations ({activeReservations.length})</span>
        </button>

        <button
          onClick={() => setViewSection('planned')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            viewSection === 'planned'
              ? 'bg-teal-600 text-white shadow'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-black'
          }`}
        >
          <Clock size={14} />
          <span>Recurring ({plannedPayments.length})</span>
        </button>
      </div>

      {/* 1. Category Budgets & Spending Limits */}
      {viewSection === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp size={16} className="text-[#007AFF]" />
                Category Spending Limits
              </h3>
              <p className="text-[11px] text-slate-400">
                Set monthly caps on specific categories to receive proactive alerts when exceeded.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {expenseCategories.map((cat) => {
              const spent = categorySpentMap[cat.id] || 0;
              const limit = cat.budgetLimit || 0;
              const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const remaining = limit > 0 ? limit - spent : 0;
              const isOver = limit > 0 && spent > limit;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-3xl border transition ${
                    isDark
                      ? 'bg-slate-900/60 border-white/10 text-white'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        {renderCategoryIcon(cat.icon, { size: 16 })}
                      </span>
                      <div>
                        <h4 className={`font-bold text-sm leading-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h4>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Spent this month:{' '}
                          <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatMoney(spent, currency)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Budget Limit setting / display */}
                    <div className="text-right">
                      {editingCatId === cat.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={catBudgetVal}
                            onChange={(e) => setCatBudgetVal(e.target.value)}
                            className="w-20 rounded-lg border border-teal-500 bg-slate-800 px-2 py-1 text-xs text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveBudget(cat.id)}
                            className="p-1 rounded bg-teal-500 text-white"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div>
                            <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Limit:</span>
                            <span className={`font-numeric text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                              {limit > 0 ? formatMoney(limit, currency) : 'No limit'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEditBudget(cat)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                            title="Edit Category Limit"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar if limit is set */}
                  {limit > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{percent}% of monthly limit</span>
                        <span className={isOver ? 'text-rose-400 font-bold' : ''}>
                          {isOver
                            ? `Exceeded by ${formatMoney(Math.abs(remaining), currency)}`
                            : `${formatMoney(remaining, currency)} remaining`}
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Planned Reservations (Separated) */}
      {viewSection === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bookmark size={16} className="text-purple-400" />
                Planned Reservations
              </h3>
              <p className="text-[11px] text-slate-400">
                Pledged funds held ahead of time. Reserves daily safe-to-spend allowance without debiting accounts yet.
              </p>
            </div>
            <button
              onClick={() => onOpenAddModal('reservation')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-600 text-xs font-bold text-white shadow hover:bg-purple-700 transition"
            >
              <Plus size={14} />
              New Reservation
            </button>
          </div>

          {activeReservations.length === 0 ? (
            <div
              className={`p-8 rounded-3xl border text-center text-xs text-slate-400 ${
                isDark ? 'border-white/5 bg-slate-900/40' : 'border-slate-200 bg-white'
              }`}
            >
              <Bookmark size={28} className="mx-auto text-purple-400 mb-2 opacity-60" />
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No active reservations.</p>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Plan ahead for an upcoming invoice, doctor visit, or trip so your Safe-to-Spend automatically adjusts!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeReservations.map((res) => {
                const cat = categories.find((c) => c.id === res.categoryId);
                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-3xl border transition ${
                      isDark
                        ? 'bg-slate-900/70 border-white/10 text-white shadow-lg'
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
                          <Bookmark size={18} />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm leading-tight">{res.title}</h4>
                          <span className="text-[11px] text-slate-400">
                            Planned for {res.date} • {cat?.name || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-numeric text-base font-bold text-purple-400">
                          {formatMoney(res.amount, currency)}
                        </span>
                      </div>
                    </div>

                    {res.note && (
                      <p className="mt-2 text-xs text-slate-400 bg-white/5 p-2 rounded-xl">
                        {res.note}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => onDeleteReservation(res.id)}
                        title="Cancel Reservation"
                        className="p-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => onConvertReservation(res)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-xs font-bold text-white shadow hover:bg-teal-600 transition"
                      >
                        <Check size={14} />
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Recurring Payments & Subscriptions */}
      {viewSection === 'planned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock size={16} className="text-teal-400" />
                Recurring Payments & Subscriptions
              </h3>
              <p className="text-[11px] text-slate-400">
                Scheduled recurring commitments and recurring subscriptions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plannedPayments.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-3xl border transition ${
                  isDark
                    ? 'bg-slate-900/70 border-white/10 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400">
                      <Clock size={18} />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{plan.title}</h4>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {plan.recurrence} • Next: {plan.nextDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-numeric text-base font-bold text-teal-400">
                      {formatMoney(plan.amount, currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-2.5">
                  <button
                    onClick={() => onDeletePlannedPayment(plan.id)}
                    title="Remove"
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => onPayPlannedPayment(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-xs font-bold text-white shadow hover:bg-teal-600 transition"
                  >
                    <ArrowUpRight size={14} />
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
