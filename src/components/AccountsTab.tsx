import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';
import { Account, Transaction, ThemeMode } from '../types';
import { formatMoney } from '../utils/format';
import { AVAILABLE_COLORS } from '../utils/icons';

interface AccountsTabProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: string;
  theme: ThemeMode;
  onSaveAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  transactions,
  currency,
  theme,
  onSaveAccount,
  onDeleteAccount,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [selectedAccDetails, setSelectedAccDetails] = useState<Account | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [includeInBalance, setIncludeInBalance] = useState(true);

  // Compute live balance for each account from initialBalance + transactions
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((acc) => {
      balances[acc.id] = acc.initialBalance || 0;
    });

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] += tx.amount;
        }
      } else if (tx.type === 'expense') {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amount;
        }
      } else if (tx.type === 'transfer') {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amount;
        }
        if (tx.toAccountId && balances[tx.toAccountId] !== undefined) {
          balances[tx.toAccountId] += tx.amount;
        }
      }
    });

    return balances;
  }, [accounts, transactions]);

  // Compute monthly sub-metrics (income vs expenses) for each account
  const now = new Date();
  const currentMonthPrefix = now.toISOString().slice(0, 7);

  const accountMonthlyMetrics = useMemo(() => {
    const metrics: Record<string, { income: number; expenses: number }> = {};
    accounts.forEach((acc) => {
      metrics[acc.id] = { income: 0, expenses: 0 };
    });

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentMonthPrefix)) {
        if (tx.type === 'income' && metrics[tx.accountId]) {
          metrics[tx.accountId].income += tx.amount;
        } else if (tx.type === 'expense' && metrics[tx.accountId]) {
          metrics[tx.accountId].expenses += tx.amount;
        }
      }
    });

    return metrics;
  }, [accounts, transactions, currentMonthPrefix]);

  // Total Balance (Active / Included in daily calculations)
  const totalActiveBalance = useMemo(() => {
    return accounts
      .filter((a) => a.includeInBalance)
      .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  }, [accounts, accountBalances]);

  // Total Balance Excluded (Savings, locked vaults, external)
  const totalExcludedBalance = useMemo(() => {
    return accounts
      .filter((a) => !a.includeInBalance)
      .reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  }, [accounts, accountBalances]);

  const handleOpenAdd = () => {
    setEditingAcc(null);
    setName('');
    setInitialBalance('0');
    setColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setIncludeInBalance(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: Account, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAcc(acc);
    setName(acc.name);
    setInitialBalance(acc.initialBalance.toString());
    setColor(acc.color);
    setIncludeInBalance(acc.includeInBalance);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const acc: Account = {
      id: editingAcc ? editingAcc.id : `acc-${Date.now()}`,
      name: name.trim(),
      currency,
      color,
      icon: 'Wallet',
      includeInBalance,
      initialBalance: parseFloat(initialBalance) || 0,
    };

    onSaveAccount(acc);
    setModalOpen(false);
  };

  // Helper to get account card background tint according to vault type
  const getVaultStyle = (acc: Account) => {
    const lower = acc.name.toLowerCase();
    if (lower.includes('cash')) {
      return {
        bg: isDark ? 'rgba(48, 209, 88, 0.14)' : 'rgba(48, 209, 88, 0.10)',
        border: 'border-emerald-500/20',
        badge: 'Cash Vault',
      };
    }
    if (lower.includes('bank') || lower.includes('checking')) {
      return {
        bg: isDark ? 'rgba(138, 107, 255, 0.16)' : 'rgba(138, 107, 255, 0.12)',
        border: 'border-purple-500/20',
        badge: 'Bank Vault',
      };
    }
    if (lower.includes('revolut') || lower.includes('digital') || lower.includes('card')) {
      return {
        bg: isDark ? 'rgba(64, 200, 255, 0.14)' : 'rgba(64, 200, 255, 0.10)',
        border: 'border-cyan-500/20',
        badge: 'Digital Vault',
      };
    }
    return {
      bg: isDark ? `${acc.color}20` : `${acc.color}15`,
      border: 'border-white/10',
      badge: 'Vault',
    };
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header: 32sp bold title "Accounts" */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Accounts</h1>
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Liquidity Pools & Physical Cash Reserves
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          title="Add Vault Account"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 transition hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Split Balance Summary Card */}
      <div
        className={`relative overflow-hidden rounded-[28px] border p-6 shadow-xl ${
          isDark
            ? 'border-white/10 bg-white/[0.08] text-white shadow-2xl'
            : 'border-white/80 bg-white/70 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
        } liquid-glass`}
      >
        <div className="grid grid-cols-2 divide-x divide-white/10 text-center">
          {/* Left Column: TOTAL BALANCE (active funds) */}
          <div className="pr-4 sm:pr-6">
            <span
              className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block ${
                isDark ? 'text-white/60' : 'text-slate-500'
              }`}
            >
              Total Balance
            </span>
            <div className="mt-1 font-numeric text-xl sm:text-3xl font-black tracking-tight text-teal-400">
              {formatMoney(totalActiveBalance, currency)}
            </div>
            <span className={`mt-1 block text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              Active in daily budget
            </span>
          </div>

          {/* Right Column: TOTAL BALANCE (EXCLUDED) */}
          <div className="pl-4 sm:pr-2">
            <span
              className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block ${
                isDark ? 'text-white/60' : 'text-slate-500'
              }`}
            >
              Total Balance (Excluded)
            </span>
            <div
              className={`mt-1 font-numeric text-xl sm:text-3xl font-black tracking-tight ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              {formatMoney(totalExcludedBalance, currency)}
            </div>
            <span className={`mt-1 block text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              Vaults & savings locked
            </span>
          </div>
        </div>
      </div>

      {/* Vault Account Cards (Large 32dp rounded cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/45' : 'text-slate-400'}`}>
            Vault Accounts ({accounts.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => {
            const currentBal = accountBalances[acc.id] ?? acc.initialBalance;
            const monthly = accountMonthlyMetrics[acc.id] || { income: 0, expenses: 0 };
            const vaultInfo = getVaultStyle(acc);

            // Vault status determination
            const statusPill = !acc.includeInBalance
              ? 'Excluded'
              : currentBal < 0
              ? 'Deficit'
              : vaultInfo.badge;

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccDetails(acc)}
                role="button"
                tabIndex={0}
                className={`relative cursor-pointer overflow-hidden rounded-[32px] border p-6 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
                  vaultInfo.border
                } ${isDark ? 'text-white' : 'text-slate-900'} liquid-glass`}
                style={{ backgroundColor: vaultInfo.bg }}
              >
                {/* Account Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.name.toLowerCase().includes('bank') ? (
                        <Landmark size={22} />
                      ) : acc.name.toLowerCase().includes('cash') ? (
                        <Wallet size={22} />
                      ) : (
                        <CreditCard size={22} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base font-extrabold tracking-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {acc.name}
                      </h3>
                      <span
                        className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          statusPill === 'Deficit'
                            ? 'bg-rose-500/20 text-rose-300'
                            : statusPill === 'Excluded'
                            ? isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                            : 'bg-teal-500/20 text-teal-300'
                        }`}
                      >
                        {statusPill}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleOpenEdit(acc, e)}
                      title="Edit Account"
                      className={`rounded-xl p-2 transition ${
                        isDark
                          ? 'text-white/60 hover:bg-white/10 hover:text-white'
                          : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'
                      }`}
                    >
                      <Edit2 size={16} />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAccount(acc.id);
                        }}
                        title="Delete Account"
                        className="rounded-xl p-2 text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Large Net Balance (34sp / font-black) */}
                <div className="mt-5">
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    Net Balance
                  </span>
                  <div
                    className={`font-numeric text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
                      currentBal < 0
                        ? isDark ? 'text-rose-400' : 'text-rose-600'
                        : isDark
                        ? 'text-white'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatMoney(currentBal, currency)}
                  </div>
                </div>

                {/* Split Monthly Sub-Metrics (INCOME vs EXPENSES) */}
                <div className={`mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs ${isDark ? 'border-white/10' : 'border-slate-200/80'}`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                      Income This Month
                    </span>
                    <p className={`font-numeric mt-0.5 font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                      +{formatMoney(monthly.income, currency)}
                    </p>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
                      Expenses This Month
                    </span>
                    <p className={`font-numeric mt-0.5 font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                      -{formatMoney(monthly.expenses, currency)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Details Modal (when tapping an account card) */}
      {selectedAccDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedAccDetails(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          <div
            className={`relative z-10 w-full max-w-lg rounded-[28px] border p-6 shadow-2xl ${
              isDark
                ? 'border-white/10 bg-[#0E0E18] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            } liquid-glass max-h-[85vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md"
                  style={{ backgroundColor: selectedAccDetails.color }}
                >
                  <Landmark size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedAccDetails.name}</h3>
                  <span className="text-xs text-teal-400 font-bold">
                    {formatMoney(accountBalances[selectedAccDetails.id] || 0, currency)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccDetails(null)}
                className="rounded-full p-1.5 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Transactions in this account
              </h4>
              <div className="space-y-2">
                {transactions
                  .filter(
                    (tx) =>
                      tx.accountId === selectedAccDetails.id ||
                      tx.toAccountId === selectedAccDetails.id
                  )
                  .slice(0, 10)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border ${
                        isDark ? 'border-white/5 bg-white/[0.04]' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.title}</p>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tx.date.slice(0, 10)}</span>
                      </div>
                      <span
                        className={`font-numeric text-xs font-bold ${
                          tx.type === 'income'
                            ? 'text-teal-400'
                            : tx.type === 'expense'
                            ? 'text-rose-400'
                            : 'text-purple-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄ '}
                        {formatMoney(tx.amount, currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${
              isDark
                ? 'border-white/10 bg-[#0E0E18] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            } liquid-glass`}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <h3 className="text-base font-extrabold">
                {editingAcc ? 'Edit Vault Account' : 'New Vault Account'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className={`rounded-full p-1 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Bank Vault, Cash Reserve, Revolut"
                  className={`mt-1.5 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2 focus:ring-teal-500/40 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Initial Balance ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className={`mt-1.5 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2 focus:ring-teal-500/40 font-numeric ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Vault Color Theme
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

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="includeBalance"
                  checked={includeInBalance}
                  onChange={(e) => setIncludeInBalance(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-500 focus:ring-teal-400"
                />
                <label htmlFor="includeBalance" className={`text-xs font-medium cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Include in active daily allowance calculations
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full border transition ${
                    isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 transition"
                >
                  Save Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
