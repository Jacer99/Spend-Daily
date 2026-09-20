import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Bookmark,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  Transaction,
  Account,
  Category,
  Reservation,
  ThemeMode,
} from '../types';
import { formatMoney, formatDateDisplay, formatTimeDisplay } from '../utils/format';
import { renderCategoryIcon } from '../utils/icons';

interface TransactionsTabProps {
  transactions: Transaction[];
  reservations: Reservation[];
  accounts: Account[];
  categories: Category[];
  currency: string;
  theme: ThemeMode;
  onEditTransaction: (tx: Transaction) => void;
  onAddNew: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  reservations,
  accounts,
  categories,
  currency,
  theme,
  onEditTransaction,
  onAddNew,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer' | 'reservation'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Combined and filtered list
  const filteredList = useMemo(() => {
    const query = search.toLowerCase().trim();

    let list = [...transactions];

    if (typeFilter !== 'all' && typeFilter !== 'reservation') {
      list = list.filter((tx) => tx.type === typeFilter);
    }

    if (accountFilter !== 'all') {
      list = list.filter(
        (tx) => tx.accountId === accountFilter || tx.toAccountId === accountFilter
      );
    }

    if (query) {
      list = list.filter((tx) => {
        const cat = tx.categoryId ? categoryMap.get(tx.categoryId)?.name : '';
        const acc = accountMap.get(tx.accountId)?.name || '';
        return (
          tx.title.toLowerCase().includes(query) ||
          (tx.note && tx.note.toLowerCase().includes(query)) ||
          (cat && cat.toLowerCase().includes(query)) ||
          acc.toLowerCase().includes(query)
        );
      });
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [transactions, typeFilter, accountFilter, search, categoryMap, accountMap]);

  // Group by Date string (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredList.forEach((tx) => {
      const d = tx.date.slice(0, 10);
      if (!map.has(d)) {
        map.set(d, []);
        groups.push({ date: d, items: map.get(d)! });
      }
      map.get(d)!.push(tx);
    });

    return groups;
  }, [filteredList]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search transactions, notes, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDark
                ? 'border-white/10 bg-slate-900/60 text-white placeholder-slate-500'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Account Filter dropdown */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className={`rounded-2xl border px-3 py-2 text-xs ${
            isDark
              ? 'border-white/10 bg-slate-900/60 text-white'
              : 'border-slate-200 bg-white text-slate-900 shadow-sm'
          }`}
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'expense', label: 'Expenses' },
            { id: 'income', label: 'Income' },
            { id: 'transfer', label: 'Transfers' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
              typeFilter === tab.id
                ? 'bg-teal-500 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {groupedTransactions.length === 0 ? (
        <div
          className={`rounded-3xl border p-12 text-center ${
            isDark ? 'border-white/5 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          <p className="font-medium text-sm">No transactions found</p>
          <p className="text-xs mt-1">Try tweaking your search or record a new transaction.</p>
          <button
            onClick={onAddNew}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-xs font-bold text-white shadow hover:bg-teal-600 transition"
          >
            <Plus size={14} />
            Record Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group) => {
            const dateDisplay = formatDateDisplay(group.date);
            const totalForDay = group.items.reduce((sum, tx) => {
              if (tx.type === 'expense') return sum - tx.amount;
              if (tx.type === 'income') return sum + tx.amount;
              return sum;
            }, 0);

            return (
              <div key={group.date} className="space-y-2">
                {/* Date Header with Day Net */}
                <div className={`flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{dateDisplay}</span>
                  <span className="font-numeric font-semibold text-[11px]">
                    {totalForDay < 0 ? (
                      <span className={isDark ? 'text-rose-400' : 'text-rose-600'}>
                        -{formatMoney(Math.abs(totalForDay), currency)}
                      </span>
                    ) : totalForDay > 0 ? (
                      <span className={isDark ? 'text-teal-400' : 'text-teal-600'}>
                        +{formatMoney(totalForDay, currency)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                {/* Group Items */}
                <div
                  className={`divide-y rounded-3xl border overflow-hidden ${
                    isDark
                      ? 'bg-slate-900/70 border-white/10 divide-white/5 shadow-xl'
                      : 'bg-white border-slate-200 divide-slate-100 shadow-md'
                  }`}
                >
                  {group.items.map((tx) => {
                    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                    const acc = accountMap.get(tx.accountId);
                    const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onEditTransaction(tx)}
                        className={`group flex items-center justify-between p-3.5 cursor-pointer transition gap-3 ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Left: Icon and Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                            style={{
                              backgroundColor:
                                tx.type === 'transfer'
                                  ? '#3193F5'
                                  : cat?.color || (tx.type === 'income' ? '#00BFA5' : '#FF5252'),
                            }}
                          >
                            {tx.type === 'transfer' ? (
                              <ArrowRightLeft size={18} />
                            ) : cat ? (
                              renderCategoryIcon(cat.icon, { size: 18 })
                            ) : tx.type === 'income' ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-bold transition break-words ${
                                isDark
                                  ? 'text-white group-hover:text-teal-400'
                                  : 'text-slate-900 group-hover:text-teal-600'
                              }`}>
                                {tx.title}
                              </span>

                              {/* Allocation Mode Badge */}
                              {tx.type === 'expense' && tx.allocationMode !== 'TODAY' && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  isDark
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/20'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}>
                                  <Zap size={10} />
                                  {tx.allocationMode === 'WEEK' ? 'Week Split' : 'Month Split'}
                                </span>
                              )}

                              {tx.type === 'income' && tx.includeInBudget && (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  isDark
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/20'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}>
                                  In Budget
                                </span>
                              )}
                            </div>

                            <div className={`flex flex-wrap items-center gap-1.5 text-[11px] mt-0.5 ${
                              isDark ? 'text-white/60' : 'text-slate-600'
                            }`}>
                              <span className="truncate">
                                {tx.type === 'transfer'
                                  ? `${acc?.name || 'Account'} → ${toAcc?.name || 'Account'}`
                                  : `${acc?.name || 'Account'} • ${cat?.name || 'General'}`}
                              </span>
                              <span>•</span>
                              <span>{formatTimeDisplay(tx.date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-numeric text-sm font-bold ${
                              tx.type === 'expense'
                                ? isDark ? 'text-rose-400' : 'text-rose-600'
                                : tx.type === 'income'
                                ? isDark ? 'text-teal-400' : 'text-teal-600'
                                : isDark ? 'text-blue-400' : 'text-blue-600'
                            }`}
                          >
                            {tx.type === 'expense'
                              ? `-${formatMoney(tx.amount, currency)}`
                              : tx.type === 'income'
                              ? `+${formatMoney(tx.amount, currency)}`
                              : formatMoney(tx.amount, currency)}
                          </span>

                          {tx.note && (
                            <p className={`text-[10px] truncate max-w-[120px] sm:max-w-[200px] ${
                              isDark ? 'text-white/60' : 'text-slate-600'
                            }`}>
                              {tx.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
