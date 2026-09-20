import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Trash2,
  Delete,
  CornerDownLeft,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  Transaction,
  Account,
  Category,
  AllocationMode,
  ThemeMode,
} from '../types';
import { formatMoney } from '../utils/format';
import { renderCategoryIcon } from '../utils/icons';
import { SearchableAccountPicker } from './SearchableAccountPicker';
import { SearchableCategoryPicker } from './SearchableCategoryPicker';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Partial<Transaction> & { id?: string }) => void;
  onDeleteTransaction?: (id: string) => void;
  editTransaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  currency: string;
  theme: ThemeMode;
  initialType?: 'expense' | 'income' | 'transfer' | 'reservation';
  hasActiveBudget?: boolean;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  onDeleteTransaction,
  editTransaction,
  accounts,
  categories,
  currency,
  theme,
  initialType = 'expense',
  hasActiveBudget = true,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(
    (editTransaction?.type as any) || (initialType === 'reservation' ? 'expense' : initialType)
  );
  const [amountStr, setAmountStr] = useState<string>(
    editTransaction ? editTransaction.amount.toString() : ''
  );
  const [title, setTitle] = useState<string>(editTransaction ? editTransaction.title : '');
  const [date, setDate] = useState<string>(
    editTransaction ? editTransaction.date.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [accountId, setAccountId] = useState<string>(
    editTransaction?.accountId || accounts[0]?.id || ''
  );
  const [toAccountId, setToAccountId] = useState<string>(
    editTransaction?.toAccountId || accounts[1]?.id || accounts[0]?.id || ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    editTransaction?.categoryId || categories[0]?.id || ''
  );
  const [allocationMode, setAllocationMode] = useState<AllocationMode>(
    editTransaction?.allocationMode || 'TODAY'
  );
  const [showKeypad, setShowKeypad] = useState(true);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0];
  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type as any);
      setAmountStr(editTransaction.amount.toString());
      setTitle(editTransaction.title);
      setDate(editTransaction.date.slice(0, 16));
      setAccountId(editTransaction.accountId);
      setToAccountId(editTransaction.toAccountId || accounts[1]?.id || accounts[0]?.id || '');
      setCategoryId(editTransaction.categoryId || categories[0]?.id || '');
      setAllocationMode(editTransaction.allocationMode || 'TODAY');
    } else {
      setType((initialType === 'reservation' ? 'expense' : initialType) as any);
      setAmountStr('');
      setTitle('');
      setDate(new Date().toISOString().slice(0, 16));
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
      setCategoryId(categories[0]?.id || '');
      setAllocationMode('TODAY');
    }
  }, [editTransaction, initialType, accounts, categories]);

  if (!isOpen) return null;

  // Keypad actions
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmountStr('');
      return;
    }
    if (val === 'backspace') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => (prev ? prev + '.' : '0.'));
      }
      return;
    }
    // Prevent typing more than 3 decimal places
    const parts = amountStr.split('.');
    if (parts[1] && parts[1].length >= 3) return;

    setAmountStr((prev) => prev + val);
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedAmount <= 0) return;

    const defaultTitle =
      title.trim() ||
      (type === 'expense'
        ? categories.find((c) => c.id === categoryId)?.name || 'Expense'
        : type === 'income'
        ? 'Income'
        : 'Transfer');

    const txData: Partial<Transaction> & { id?: string } = {
      ...(editTransaction ? { id: editTransaction.id } : {}),
      title: defaultTitle,
      amount: parsedAmount,
      type,
      date,
      accountId,
      ...(type === 'transfer' ? { toAccountId } : {}),
      ...(type !== 'transfer' ? { categoryId } : {}),
      allocationMode: type === 'expense' ? allocationMode : 'TODAY',
      includeInBudget: true,
    };

    onSaveTransaction(txData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Translucent blur backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-300 ${
          isDark ? 'bg-[#050508]/80' : 'bg-white/70'
        } backdrop-blur-xl animate-fadeIn`}
      />

      {/* Main Entry Sheet */}
      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-[32px] border p-6 sm:p-7 shadow-2xl transition-all duration-300 ${
          isDark
            ? 'border-white/10 bg-[#0E0E18]/95 text-white shadow-2xl'
            : 'border-white/80 bg-white/95 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
        } liquid-glass my-auto max-h-[95vh] overflow-y-auto`}
      >
        {/* Header: Dismiss button ( X ) and transaction type badge */}
        <div className="flex items-center justify-between pb-3">
          {/* Transaction Type Segmented Toggle */}
          <div
            className={`flex items-center rounded-full p-1 border ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                type === 'transfer'
                  ? 'bg-purple-500 text-white shadow-md'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          <button
            onClick={onClose}
            title="Dismiss"
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
              isDark
                ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Display Header */}
        <div className="mt-2 text-center">
          <div
            className={`font-numeric text-4xl sm:text-5xl font-black tracking-tight ${
              type === 'income'
                ? 'text-emerald-400'
                : type === 'expense'
                ? isDark
                  ? 'text-white'
                  : 'text-slate-900'
                : 'text-purple-400'
            }`}
          >
            {amountStr ? formatMoney(parsedAmount, currency) : `0.00 ${currency}`}
          </div>
        </div>

        {/* Title Input */}
        <div className="mt-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'expense'
                ? 'Expense title (e.g. Groceries, Coffee)'
                : type === 'income'
                ? 'Income title (e.g. Salary, Freelance)'
                : 'Transfer note'
            }
            className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-teal-500/40 text-center ${
              isDark
                ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
                : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* CRUCIAL POCKETMONEY DIFFERENTIATOR: Apply to Allowance Segmented Selector (Expenses Only) */}
        {type === 'expense' && hasActiveBudget && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                Apply to Allowance
              </span>
              <span className={`text-[10px] ${isDark ? 'text-cyan-300' : 'text-teal-600'}`}>
                {allocationMode === 'THIS_WEEK'
                  ? 'Amortized over 7 days smoothly'
                  : '100% charged on transaction date'}
              </span>
            </div>

            <div
              className={`grid grid-cols-2 rounded-2xl p-1 border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setAllocationMode('TODAY')}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  allocationMode === 'TODAY'
                    ? isDark
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-sm'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('THIS_WEEK')}
                className={`rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  allocationMode === 'THIS_WEEK'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                    : isDark
                    ? 'text-white/60 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={13} />
                This week (7 days)
              </button>
            </div>
          </div>
        )}

        {/* Searchable Pickers for Income & Expense */}
        {type !== 'transfer' ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {/* Account Picker Trigger */}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                {type === 'expense' ? 'Pay with Vault' : 'Deposit into'}
              </span>
              <button
                id="btn-open-account-picker"
                type="button"
                onClick={() => setIsAccountPickerOpen(true)}
                className={`w-full flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 shadow-sm ring-1 ring-black/20"
                    style={{ backgroundColor: selectedAccount?.color || '#00BFA5' }}
                  />
                  <span className="truncate">{selectedAccount?.name || 'Select Vault'}</span>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
              </button>
            </div>

            {/* Category Picker Trigger */}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                Category
              </span>
              <button
                id="btn-open-category-picker"
                type="button"
                onClick={() => setIsCategoryPickerOpen(true)}
                className={`w-full flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white text-[10px]"
                    style={{ backgroundColor: selectedCategory?.color || '#00BFA5' }}
                  >
                    {selectedCategory ? renderCategoryIcon(selectedCategory.icon, 13) : null}
                  </div>
                  <span className="truncate">{selectedCategory?.name || 'Select Category'}</span>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
              </button>
            </div>
          </div>
        ) : (
          /* Transfer flow kept as-is */
          <>
            <div className="mt-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                From Vault
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500/20 text-teal-300 ring-2 ring-teal-500/30'
                          : isDark
                          ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span>{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                To Vault
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {accounts.map((acc) => {
                  const isSelected = toAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setToAccountId(acc.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-purple-400 bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/30'
                          : isDark
                          ? 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span>{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Frosted Numeric Keypad (AmountModal.kt style) */}
        {showKeypad && (
          <div className="mt-4 rounded-3xl border border-white/10 p-2.5 bg-white/[0.03]">
            <div className="grid grid-cols-3 gap-2 text-center font-numeric">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`flex h-12 items-center justify-center rounded-2xl text-base font-bold transition active:scale-95 ${
                      isDark
                        ? 'bg-white/5 text-white hover:bg-white/10'
                        : 'bg-white text-slate-800 shadow-sm hover:bg-slate-100'
                    }`}
                  >
                    {key === 'backspace' ? <Delete size={18} /> : key}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Confirm Action Button */}
        <div className="mt-5 flex items-center gap-2">
          {editTransaction && onDeleteTransaction && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this transaction?')) {
                  onDeleteTransaction(editTransaction.id);
                  onClose();
                }
              }}
              title="Delete Transaction"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/20"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={parsedAmount <= 0}
            className={`flex-1 flex h-12 items-center justify-center gap-2 rounded-full font-bold text-sm text-white shadow-xl transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${
              type === 'expense'
                ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 shadow-rose-500/25'
                : type === 'income'
                ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 shadow-teal-500/25'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/25'
            }`}
          >
            <Check size={18} />
            <span>{editTransaction ? 'Save Changes' : '+ Add Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Searchable Account Sub-menu Picker */}
      <SearchableAccountPicker
        isOpen={isAccountPickerOpen}
        onClose={() => setIsAccountPickerOpen(false)}
        accounts={accounts}
        selectedId={accountId}
        onSelect={(id) => setAccountId(id)}
        title={type === 'expense' ? 'Pay with Vault' : 'Deposit into Vault'}
        currency={currency}
        theme={theme}
      />

      {/* Searchable Category Sub-menu Picker */}
      <SearchableCategoryPicker
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        categories={categories}
        selectedId={categoryId}
        onSelect={(id) => setCategoryId(id)}
        type={type === 'income' ? 'income' : 'expense'}
        currency={currency}
        title={type === 'income' ? 'Select Income Category' : 'Select Expense Category'}
        theme={theme}
      />
    </div>
  );
};
