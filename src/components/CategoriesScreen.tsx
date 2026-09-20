import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowDownUp,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Category, Transaction, ThemeMode } from '../types';
import { formatMoney } from '../utils/format';
import { renderCategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from '../utils/icons';

interface CategoriesScreenProps {
  categories: Category[];
  transactions: Transaction[];
  currency: string;
  theme: ThemeMode;
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onBack: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  transactions,
  currency,
  theme,
  onSaveCategory,
  onDeleteCategory,
  onBack,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);

  // Compute monthly spending and income per category
  const now = new Date();
  const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM

  const categoryMetrics = useMemo(() => {
    const metrics: Record<
      string,
      { expenses: number; income: number; net: number; count: number }
    > = {};

    categories.forEach((cat) => {
      metrics[cat.id] = { expenses: 0, income: 0, net: 0, count: 0 };
    });

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentMonthPrefix) && tx.categoryId && metrics[tx.categoryId]) {
        metrics[tx.categoryId].count += 1;
        if (tx.type === 'expense') {
          metrics[tx.categoryId].expenses += tx.amount;
          metrics[tx.categoryId].net -= tx.amount;
        } else if (tx.type === 'income') {
          metrics[tx.categoryId].income += tx.amount;
          metrics[tx.categoryId].net += tx.amount;
        }
      }
    });

    return metrics;
  }, [categories, transactions, currentMonthPrefix]);

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let list = categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortAlphabetical) {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [categories, searchQuery, sortAlphabetical]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setIcon(AVAILABLE_ICONS[0]);
    setColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCategory({
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: name.trim(),
      type: editingCategory ? editingCategory.type : 'expense',
      icon,
      color,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            title="Go back"
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
              isDark
                ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Spending Classifications & Monthly Inflow/Outflow
            </p>
          </div>
        </div>

        {/* Sort & Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortAlphabetical(!sortAlphabetical)}
            title="Sort A-Z"
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              sortAlphabetical
                ? 'bg-teal-500 text-white border-teal-400'
                : isDark
                ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <ArrowDownUp size={16} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Frosted Search Bar */}
      <div
        className={`flex items-center rounded-full border px-4 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/40 ${
          isDark
            ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
            : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm'
        } liquid-glass`}
      >
        <Search size={16} className={isDark ? 'text-white/40 mr-2.5' : 'text-slate-400 mr-2.5'} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter categories..."
          className="w-full bg-transparent text-xs font-medium outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Cards (26dp rounded glass cards tinted with 15-20% alpha) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredCategories.map((cat) => {
          const stats = categoryMetrics[cat.id] || { expenses: 0, income: 0, net: 0, count: 0 };

          return (
            <div
              key={cat.id}
              className={`relative overflow-hidden rounded-[26px] border p-5 transition-all duration-300 hover:shadow-xl ${
                isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900 shadow-sm'
              } liquid-glass`}
              style={{
                backgroundColor: isDark
                  ? `${cat.color}22` // 14% alpha tint
                  : `${cat.color}18`, // 10% alpha tint in light
              }}
            >
              {/* Category Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Leading 44dp circular badge with category icon */}
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                    style={{ backgroundColor: cat.color }}
                  >
                    {renderCategoryIcon(cat.icon, 20)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-extrabold text-sm tracking-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {cat.name}
                    </h3>
                    <span className={`text-[11px] block truncate ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                      {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'} this month
                    </span>
                  </div>
                </div>

                {/* Net Balance & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Net
                    </span>
                    <span
                      className={`font-numeric text-sm font-bold ${
                        stats.net < 0
                          ? isDark ? 'text-amber-400' : 'text-amber-600'
                          : stats.net > 0
                          ? isDark ? 'text-teal-400' : 'text-teal-600'
                          : isDark
                          ? 'text-white/70'
                          : 'text-slate-700'
                      }`}
                    >
                      {formatMoney(stats.net, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      title="Edit Category"
                      className={`rounded-lg p-1.5 transition ${
                        isDark ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'
                      }`}
                    >
                      <Edit2 size={14} />
                    </button>
                    {categories.length > 1 && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        title="Delete Category"
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Translucent divider separating monthly sub-metrics */}
              <div className={`mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs ${isDark ? 'border-white/10' : 'border-slate-200/80'}`}>
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Expenses this month
                  </span>
                  <p className={`font-numeric mt-0.5 font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                    -{formatMoney(stats.expenses, currency)}
                  </p>
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Income this month
                  </span>
                  <p className={`font-numeric mt-0.5 font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    +{formatMoney(stats.income, currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Glass Pill Dock with CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div
          className={`flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-2xl ${
            isDark
              ? 'border-white/15 bg-black/60 text-white'
              : 'border-slate-300 bg-white/90 text-slate-900 shadow-xl'
          } liquid-glass`}
        >
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className={`h-5 w-px ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-teal-500/25 transition hover:scale-105 active:scale-95"
          >
            <Plus size={15} />
            Add category
          </button>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              isDark
                ? 'border-white/10 bg-[#0E0E18] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            } liquid-glass`}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <h3 className="text-base font-extrabold">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`rounded-full p-1 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Groceries, Cafes, Rent"
                  className={`mt-1.5 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2 focus:ring-teal-500/40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Select Color
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Select Icon
                </label>
                <div className="mt-2 grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                        icon === ic
                          ? 'border-teal-400 bg-teal-500/20 text-teal-400'
                          : isDark
                          ? 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {renderCategoryIcon(ic, 18)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition ${
                    isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
