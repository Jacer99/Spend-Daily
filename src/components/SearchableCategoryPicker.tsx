import React, { useState, useMemo } from 'react';
import { Search, X, Check, Tags } from 'lucide-react';
import { Category, ThemeMode } from '../types';
import { isDarkMode } from '../utils/theme';
import { renderCategoryIcon } from '../utils/icons';
import { formatMoney } from '../utils/format';

interface SearchableCategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  type?: 'expense' | 'income';
  currency?: string;
  title?: string;
  theme?: ThemeMode;
}

export const SearchableCategoryPicker: React.FC<SearchableCategoryPickerProps> = ({
  isOpen,
  onClose,
  categories,
  selectedId,
  onSelect,
  type = 'expense',
  currency = 'TND',
  title = 'Select Category',
  theme = 'auto',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = isDarkMode(theme);

  // Filter categories matching current transaction type first, then by search query
  const availableCategories = useMemo(() => {
    return categories.filter((c) => (type ? c.type === type : true));
  }, [categories, type]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableCategories;
    return availableCategories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [availableCategories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="searchable-category-picker-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="searchable-category-picker-sheet"
        className={`w-full sm:max-w-md max-h-[85vh] sm:rounded-3xl rounded-t-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-zinc-900 border-zinc-700/80 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${
          isDark ? 'border-zinc-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              type === 'income'
                ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                : isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'
            }`}>
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {availableCategories.length} {type} {availableCategories.length === 1 ? 'category' : 'categories'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-3.5 border-b ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-medium outline-none transition border ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-teal-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1 min-h-[160px] max-h-[50vh]">
          {filteredCategories.length === 0 ? (
            <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              No categories match "{searchQuery}"
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelect(cat.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition border ${
                    isSelected
                      ? isDark
                        ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 ring-1 ring-teal-500/40'
                        : 'bg-teal-50 border-teal-300 text-teal-900 ring-1 ring-teal-500/30'
                      : isDark
                      ? 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
                      style={{ backgroundColor: cat.color || '#00BFA5' }}
                    >
                      {renderCategoryIcon(cat.icon, 18)}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold truncate">{cat.name}</div>
                      {cat.budgetLimit && cat.budgetLimit > 0 ? (
                        <div className={`text-xs ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                          Budget: {formatMoney(cat.budgetLimit, currency)}
                        </div>
                      ) : (
                        <div className={`text-xs capitalize ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {cat.type}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-teal-400 text-zinc-950 font-bold' : 'bg-teal-600 text-white font-bold'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-center text-xs ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'
        }`}>
          Tap a category to select
        </div>
      </div>
    </div>
  );
};
