export type AllocationMode = 'TODAY' | 'WEEK' | 'THIS_WEEK' | 'MONTH' | 'SPREAD_PERIOD';

export type BudgetPeriodType = 'weekly' | 'monthly' | 'salary' | 'custom';

export interface BudgetPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  type: BudgetPeriodType;
  payday?: number;
}

export interface DynamicBudgetConfig {
  id: string;
  periodType: BudgetPeriodType;
  payday: number; // 1-31 for salary cycle
  customStart?: string;
  customEnd?: string;
  budgetLimit: number; // In currency units (e.g. 500.00)
  currencyCode: string; // e.g. "TND", "USD", "EUR"
  includedAccountIds: string[]; // empty = all accounts
  includedCategoryIds: string[]; // empty = all categories
  includeIncomeInBudget: boolean;
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  color: string;
  icon: string;
  includeInBalance: boolean;
  initialBalance: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  budgetLimit?: number; // Monthly/period budget for this specific category
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number; // positive number
  title: string;
  note?: string;
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD
  accountId: string;
  toAccountId?: string; // only for transfer
  categoryId?: string;
  allocationMode: AllocationMode;
  includeInBudget?: boolean; // For income: if true, adds to dynamic budget capacity
}

export interface Reservation {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId?: string;
  accountId?: string;
  allocationMode: AllocationMode;
  status: 'active' | 'paid' | 'cancelled';
  note?: string;
}

export interface LoanRecord {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Loan {
  id: string;
  personName: string;
  type: 'lend' | 'borrow'; // lend = I gave money (they owe me); borrow = I received money (I owe them)
  amount: number;
  paidAmount: number;
  dueDate?: string;
  note?: string;
  records: LoanRecord[];
  // Bank loan specifications
  isBankLoan?: boolean;
  bankName?: string;
  repaymentType?: 'fixed_installment' | 'variable_interest'; // Fixed Monthly Installment (Annuity) vs Variable/Principal Only
  interestRate?: number; // Annual interest percentage e.g. 8.5%
  termMonths?: number; // Loan period in months (e.g. 12, 24, 36, 60)
  monthlyInstallment?: number; // Calculated or fixed periodic installment
  debitDayOfMonth?: number; // Day of month when debit occurs (1-31)
  autoDebitAccountId?: string; // Account to debit from
  startDate?: string; // Date loan was disbursed / taken (YYYY-MM-DD)
  initialPaidAmount?: number; // Already paid principal prior to tracking
}

export interface PlannedPayment {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';
  nextDate: string; // YYYY-MM-DD
  accountId: string;
  categoryId?: string;
  allocationMode: AllocationMode;
}

export interface BudgetSnapshot {
  periodStart: string;
  periodEnd: string;
  capacity: number;
  periodSpentRaw: number;
  periodReserved: number;
  periodRemaining: number;
  daysRemaining: number;
  openingAllowance: number;
  todayCharges: number;
  remainingAllowance: number;
  tomorrowProjection: number | null;
  status: 'active' | 'overToday' | 'periodExhausted' | 'noBudget';
  overTodayAmount: number;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface NotificationSettings {
  enabled: boolean;
  budgetAlerts: boolean; // Exceeding daily safe-to-spend, low funds, or period exhaustion
  categoryAlerts: boolean; // Exceeding category spending limits
  dailyReminder: boolean; // Daily reminder to log daily charges/expenses
  dailyReminderTime: string; // e.g. "20:00"
  lastDailyReminderDate?: string; // YYYY-MM-DD
}

export interface AppNotification {
  id: string;
  type: 'budget_exceeded' | 'category_limit' | 'daily_reminder' | 'bank_loan_due';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionScreen?: string; // Tab to navigate to, e.g. 'budgets', 'loans', 'home'
}

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  currencyPosition: 'prefix' | 'suffix';
  roundDecimals: number;
  notifications?: NotificationSettings;
}
