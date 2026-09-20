import React, { useState } from 'react';
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Trash2,
  Calendar,
  X,
  Check,
  Building2,
  Percent,
  CalendarDays,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Loan, ThemeMode, Account } from '../types';
import { formatMoney } from '../utils/format';

interface LoansTabProps {
  loans: Loan[];
  accounts?: Account[];
  currency: string;
  theme: ThemeMode;
  onSaveLoan: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
}

export const LoansTab: React.FC<LoansTabProps> = ({
  loans,
  accounts = [],
  currency,
  theme,
  onSaveLoan,
  onDeleteLoan,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  const [tab, setTab] = useState<'lend' | 'borrow' | 'bank'>('lend');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalLoan, setPayModalLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Form state for new loan
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Bank loan specific form fields
  const [isBankLoan, setIsBankLoan] = useState(false);
  const [repaymentType, setRepaymentType] = useState<'fixed_installment' | 'variable_interest'>('fixed_installment');
  const [interestRate, setInterestRate] = useState('7.5');
  const [termMonths, setTermMonths] = useState('36');
  const [debitDayOfMonth, setDebitDayOfMonth] = useState('5');
  const [customInstallment, setCustomInstallment] = useState('');
  const [alreadyPaidPrincipal, setAlreadyPaidPrincipal] = useState('');
  const [autoDebitAccountId, setAutoDebitAccountId] = useState(accounts[0]?.id || '');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().slice(0, 10));

  // Compute calculated monthly installment preview when amount, interest, or term changes
  const computedFixedInstallment = React.useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const rateAnnual = parseFloat(interestRate) || 0;
    const months = parseInt(termMonths, 10) || 12;
    if (principal <= 0 || months <= 0) return 0;
    if (rateAnnual <= 0) return Math.round((principal / months) * 100) / 100;
    const monthlyRate = rateAnnual / 100 / 12;
    // Standard Annuity / Constant Periodic Payment (EMI) formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi * 100) / 100;
  }, [amount, interestRate, termMonths]);

  // For variable / principal-only payments: monthly principal amortization
  const monthlyPrincipalPortion = React.useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const months = parseInt(termMonths, 10) || 12;
    if (principal <= 0 || months <= 0) return 0;
    return Math.round((principal / months) * 100) / 100;
  }, [amount, termMonths]);

  const filteredLoans = loans.filter((l) => {
    if (tab === 'bank') return l.isBankLoan;
    if (tab === 'lend') return l.type === 'lend' && !l.isBankLoan;
    return l.type === 'borrow' && !l.isBankLoan;
  });

  const totalLentRemaining = loans
    .filter((l) => l.type === 'lend' && !l.isBankLoan)
    .reduce((sum, l) => sum + Math.max(0, l.amount - l.paidAmount), 0);

  const totalBorrowedRemaining = loans
    .filter((l) => l.type === 'borrow' && !l.isBankLoan)
    .reduce((sum, l) => sum + Math.max(0, l.amount - l.paidAmount), 0);

  const totalBankLoansRemaining = loans
    .filter((l) => l.isBankLoan)
    .reduce((sum, l) => sum + Math.max(0, l.amount - l.paidAmount), 0);

  const handleOpenAdd = (defaultBank = false) => {
    setPersonName('');
    setAmount('');
    setNote('');
    setDueDate('');
    setIsBankLoan(defaultBank || tab === 'bank');
    setRepaymentType('fixed_installment');
    setInterestRate('7.5');
    setTermMonths('36');
    setDebitDayOfMonth('5');
    setCustomInstallment('');
    setAlreadyPaidPrincipal('');
    setAutoDebitAccountId(accounts[0]?.id || '');
    setDisbursementDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!personName.trim() || !amt || amt <= 0) return;

    const rate = parseFloat(interestRate) || 0;
    const months = parseInt(termMonths, 10) || 12;
    const debitDay = parseInt(debitDayOfMonth, 10) || 1;
    const paidInitial = Math.max(0, parseFloat(alreadyPaidPrincipal) || 0);

    let finalInstallment: number | undefined;
    if (isBankLoan) {
      if (repaymentType === 'fixed_installment') {
        finalInstallment = parseFloat(customInstallment) || computedFixedInstallment;
      } else {
        finalInstallment = parseFloat(customInstallment) || monthlyPrincipalPortion;
      }
    }

    const records = paidInitial > 0 ? [
      {
        id: `initial-record-${Date.now()}`,
        amount: paidInitial,
        date: disbursementDate,
        note: 'Prior Paid Principal (Initial Balance)',
      },
    ] : [];

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      personName: personName.trim(),
      type: isBankLoan ? 'borrow' : tab === 'bank' ? 'borrow' : tab,
      amount: amt,
      paidAmount: paidInitial,
      initialPaidAmount: paidInitial,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
      records: records,
      isBankLoan: isBankLoan,
      bankName: isBankLoan ? personName.trim() : undefined,
      repaymentType: isBankLoan ? repaymentType : undefined,
      interestRate: isBankLoan ? rate : undefined,
      termMonths: isBankLoan ? months : undefined,
      monthlyInstallment: isBankLoan ? finalInstallment : undefined,
      debitDayOfMonth: isBankLoan ? debitDay : undefined,
      autoDebitAccountId: isBankLoan ? autoDebitAccountId : undefined,
      startDate: isBankLoan ? disbursementDate : undefined,
    };

    onSaveLoan(newLoan);
    setModalOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalLoan) return;
    const pAmt = parseFloat(payAmount);
    if (!pAmt || pAmt <= 0) return;

    const updatedLoan: Loan = {
      ...payModalLoan,
      paidAmount: Math.min(payModalLoan.amount, payModalLoan.paidAmount + pAmt),
      records: [
        ...payModalLoan.records,
        {
          id: `lr-${Date.now()}`,
          amount: pAmt,
          date: new Date().toISOString().slice(0, 10),
          note: payModalLoan.isBankLoan ? 'Bank installment payment' : 'Repayment record',
        },
      ],
    };

    onSaveLoan(updatedLoan);
    setPayModalLoan(null);
    setPayAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div
        className={`p-6 rounded-3xl border shadow-xl ${
          isDark
            ? 'bg-slate-900/70 border-white/10 text-white backdrop-blur-xl'
            : 'bg-white border-slate-200 text-slate-900 shadow-md backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Building2 size={20} className="text-[#007AFF]" />
              Debts & Bank Loans
            </h3>
            <p className="text-xs text-slate-400">Keep track of personal debts and bank loan installments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#007AFF] text-xs font-bold text-white shadow hover:bg-blue-600 transition"
            >
              <Plus size={14} />
              Bank Loan
            </button>
            <button
              onClick={() => handleOpenAdd(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-500 text-xs font-bold text-white shadow hover:bg-teal-600 transition"
            >
              <Plus size={14} />
              Personal Loan
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/5 pt-4">
          <div className="p-3 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20">
            <span className="text-[10px] font-semibold text-[#007AFF] uppercase tracking-wider block">
              Bank Loans Balance
            </span>
            <span className="font-numeric text-lg sm:text-xl font-extrabold text-[#007AFF] mt-1 block">
              {formatMoney(totalBankLoansRemaining, currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider block">
              You Lent (To Collect)
            </span>
            <span className="font-numeric text-lg sm:text-xl font-extrabold text-teal-400 mt-1 block">
              {formatMoney(totalLentRemaining, currency)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
              You Borrowed (To Repay)
            </span>
            <span className="font-numeric text-lg sm:text-xl font-extrabold text-rose-400 mt-1 block">
              {formatMoney(totalBorrowedRemaining, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Bank Loans vs Personal Lent vs Borrowed */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('bank')}
          className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            tab === 'bank'
              ? 'bg-[#007AFF] text-white border-[#007AFF] shadow'
              : isDark
              ? 'bg-slate-900/60 border-white/5 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <Building2 size={14} />
          Bank Loans ({loans.filter((l) => l.isBankLoan).length})
        </button>
        <button
          onClick={() => setTab('lend')}
          className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold transition ${
            tab === 'lend'
              ? 'bg-teal-500 text-white border-teal-500 shadow'
              : isDark
              ? 'bg-slate-900/60 border-white/5 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          People Who Owe Me ({loans.filter((l) => l.type === 'lend' && !l.isBankLoan).length})
        </button>
        <button
          onClick={() => setTab('borrow')}
          className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold transition ${
            tab === 'borrow'
              ? 'bg-rose-500 text-white border-rose-500 shadow'
              : isDark
              ? 'bg-slate-900/60 border-white/5 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          Personal Debts ({loans.filter((l) => l.type === 'borrow' && !l.isBankLoan).length})
        </button>
      </div>

      {/* Loans List */}
      <div className="space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="p-8 rounded-3xl border border-white/5 text-center text-xs text-slate-400">
            No active {tab === 'bank' ? 'bank loans' : tab === 'lend' ? 'lent loans' : 'borrowed personal loans'} recorded.
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const remaining = Math.max(0, loan.amount - loan.paidAmount);
            const isSettled = remaining <= 0;
            const progress = Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100));
            const debitAccount = accounts.find((a) => a.id === loan.autoDebitAccountId);

            return (
              <div
                key={loan.id}
                className={`p-4 rounded-3xl border transition ${
                  isDark
                    ? 'bg-slate-900/70 border-white/10 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow ${
                        isSettled
                          ? 'bg-emerald-500'
                          : loan.isBankLoan
                          ? 'bg-[#007AFF]'
                          : loan.type === 'lend'
                          ? 'bg-teal-500'
                          : 'bg-rose-500'
                      }`}
                    >
                      {isSettled ? (
                        <CheckCircle2 size={20} />
                      ) : loan.isBankLoan ? (
                        <Building2 size={20} />
                      ) : (
                        <Users size={20} />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm leading-tight">{loan.personName}</h4>
                        {loan.isBankLoan && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/30">
                            Bank Loan
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {loan.dueDate ? `Due by ${loan.dueDate}` : 'Ongoing loan'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-numeric text-base font-extrabold">
                      {formatMoney(loan.amount, currency)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {isSettled ? (
                        <span className="text-emerald-400 font-bold">Settled</span>
                      ) : (
                        `Remaining: ${formatMoney(remaining, currency)}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Bank Loan Details Specs (Interest, Period, Debit day, Repayment structure) */}
                {loan.isBankLoan && (
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Rate</span>
                      <span className="font-numeric font-bold text-[#007AFF]">
                        {loan.interestRate ? `${loan.interestRate}% APR` : '0%'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenure</span>
                      <span className={`font-numeric font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {loan.termMonths ? `${loan.termMonths} mos` : 'Flexible'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Debit Day</span>
                      <span className="font-numeric font-bold text-amber-400">
                        {loan.debitDayOfMonth ? `Day ${loan.debitDayOfMonth}` : 'Monthly'}
                      </span>
                    </div>
                  </div>
                )}

                {loan.isBankLoan && (
                  <div className="mt-2 flex items-center justify-between text-xs px-1 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={13} className="text-slate-400" />
                      {loan.repaymentType === 'fixed_installment' ? 'Fixed Monthly Annuity' : 'Principal Amortization'}:{' '}
                      <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                        {loan.monthlyInstallment ? formatMoney(loan.monthlyInstallment, currency) : 'N/A'}
                      </strong>
                    </span>
                    {loan.startDate && (
                      <span className="text-[10px] text-slate-400">
                        Disbursed: {loan.startDate}
                      </span>
                    )}
                  </div>
                )}

                {loan.isBankLoan && debitAccount && (
                  <div className="mt-1 px-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Auto-Debit Source:</span>
                    <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>{debitAccount.name}</span>
                  </div>
                )}

                {/* Repayment Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{progress}% paid</span>
                    <span>{formatMoney(loan.paidAmount, currency)} of {formatMoney(loan.amount, currency)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSettled
                          ? 'bg-emerald-400'
                          : loan.isBankLoan
                          ? 'bg-[#007AFF]'
                          : loan.type === 'lend'
                          ? 'bg-teal-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Repayment history logs if any */}
                {loan.records && loan.records.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                      Recent Installments:
                    </span>
                    {loan.records.slice(-2).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between">
                        <span>{rec.date} • {rec.note || 'Installment'}</span>
                        <span className="font-numeric font-bold text-emerald-400">
                          +{formatMoney(rec.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                  <button
                    onClick={() => onDeleteLoan(loan.id)}
                    className="text-slate-400 hover:text-rose-400 transition p-1"
                    title="Delete Loan"
                  >
                    <Trash2 size={14} />
                  </button>

                  {!isSettled && (
                    <button
                      onClick={() => {
                        setPayModalLoan(loan);
                        setPayAmount((loan.monthlyInstallment || remaining).toString());
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shadow transition ${
                        loan.isBankLoan ? 'bg-[#007AFF] hover:bg-blue-600' : 'bg-teal-500 hover:bg-teal-600'
                      }`}
                    >
                      {loan.isBankLoan ? 'Record Installment' : 'Record Payment'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {payModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-sm">
                Payment for {payModalLoan.personName}
              </h3>
              <button onClick={() => setPayModalLoan(null)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {payModalLoan.isBankLoan ? 'Installment Amount' : 'Amount Paid'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#007AFF] bg-slate-800 p-2.5 text-base font-numeric text-white"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalLoan(null)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#007AFF] text-xs font-bold text-white shadow"
                >
                  Save Installment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl my-8 ${
              isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-base flex items-center gap-2">
                {isBankLoan ? <Building2 size={18} className="text-[#007AFF]" /> : <Users size={18} className="text-teal-400" />}
                {isBankLoan ? 'New Bank Loan' : tab === 'lend' ? 'Lend Money to Someone' : 'Borrow Money from Someone'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="mt-4 space-y-3.5">
              {/* Toggle Bank Loan Option */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Is this a Bank Loan?</span>
                  <span className="text-[10px] text-slate-400">Set interest rate, period term, and monthly debit day</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBankLoan(!isBankLoan)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    isBankLoan ? 'bg-[#007AFF]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      isBankLoan ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {isBankLoan ? 'Bank / Financial Institution' : 'Contact / Person Name'}
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder={isBankLoan ? 'e.g. BIAT Bank, Attijari, Amen...' : 'e.g. Sarah, Omar...'}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {isBankLoan ? 'Total Principal Loan Amount' : 'Amount'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-numeric ${
                    isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              {/* Bank Loan Details: Repayment Structure, Interest, Period Term, Debit Day, Paid Principal */}
              {isBankLoan && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/25">
                  {/* Repayment Type Switcher */}
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Repayment Structure
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRepaymentType('fixed_installment')}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          repaymentType === 'fixed_installment'
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow'
                            : isDark
                            ? 'bg-slate-800/80 border-white/10 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Fixed Monthly Annuity
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepaymentType('variable_interest')}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          repaymentType === 'variable_interest'
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow'
                            : isDark
                            ? 'bg-slate-800/80 border-white/10 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Principal Amortization
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {repaymentType === 'fixed_installment'
                        ? 'Equal constant payments including principal + interest calculated via actuarial EMI.'
                        : 'Fixed principal repayment each month plus variable interest on remaining debt.'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Interest Rate (% APR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="7.5"
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-numeric ${
                          isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tenure (Months)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={termMonths}
                        onChange={(e) => setTermMonths(e.target.value)}
                        placeholder="36"
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-numeric ${
                          isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Monthly Debit Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={debitDayOfMonth}
                        onChange={(e) => setDebitDayOfMonth(e.target.value)}
                        placeholder="5"
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-numeric ${
                          isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {repaymentType === 'fixed_installment' ? 'Monthly Annuity Payment' : 'Base Monthly Payment'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={
                          customInstallment ||
                          (repaymentType === 'fixed_installment'
                            ? computedFixedInstallment > 0
                              ? computedFixedInstallment
                              : ''
                            : monthlyPrincipalPortion > 0
                            ? monthlyPrincipalPortion
                            : '')
                        }
                        onChange={(e) => setCustomInstallment(e.target.value)}
                        placeholder={
                          repaymentType === 'fixed_installment'
                            ? computedFixedInstallment ? computedFixedInstallment.toString() : 'Calculated automatically'
                            : monthlyPrincipalPortion ? monthlyPrincipalPortion.toString() : 'Calculated automatically'
                        }
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-numeric ${
                          isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Already Paid Principal Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Already Paid Principal (Prior Payments)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={alreadyPaidPrincipal}
                      onChange={(e) => setAlreadyPaidPrincipal(e.target.value)}
                      placeholder="e.g. 2500 (leave 0 if new loan)"
                      className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-numeric ${
                        isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Enter what you have already repaid towards this loan prior to tracking.
                    </span>
                  </div>

                  {accounts.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Auto Debit Account
                      </label>
                      <select
                        value={autoDebitAccountId}
                        onChange={(e) => setAutoDebitAccountId(e.target.value)}
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs ${
                          isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.currency})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {isBankLoan ? 'Loan Start Date (When Loan Was Taken)' : 'Due Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={isBankLoan ? disbursementDate : dueDate}
                  onChange={(e) => {
                    if (isBankLoan) {
                      setDisbursementDate(e.target.value);
                    } else {
                      setDueDate(e.target.value);
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-numeric ${
                    isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isBankLoan ? 'e.g. Car loan, Real estate, Renovation...' : 'e.g. Travel tickets, Lunch split...'}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${
                    isDark ? 'border-white/10 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] text-xs font-bold text-white shadow"
                >
                  {isBankLoan ? 'Save Bank Loan' : 'Add Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
