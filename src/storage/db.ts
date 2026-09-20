import {
  Account,
  Category,
  Transaction,
  Reservation,
  Loan,
  PlannedPayment,
  DynamicBudgetConfig,
  AppSettings,
  AppNotification,
} from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'pocketmoney_accounts_v1',
  CATEGORIES: 'pocketmoney_categories_v1',
  TRANSACTIONS: 'pocketmoney_transactions_v1',
  RESERVATIONS: 'pocketmoney_reservations_v1',
  LOANS: 'pocketmoney_loans_v1',
  PLANNED: 'pocketmoney_planned_v1',
  BUDGET_CONFIG: 'pocketmoney_budget_config_v1',
  SETTINGS: 'pocketmoney_settings_v1',
  NOTIFICATIONS: 'pocketmoney_notifications_v1',
};

export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export function getDefaultConfig(): DynamicBudgetConfig {
  return {
    id: 'default-config',
    periodType: 'monthly',
    payday: 1,
    budgetLimit: 750,
    currencyCode: 'TND',
    includedAccountIds: [],
    includedCategoryIds: [],
    includeIncomeInBudget: false,
  };
}

export function getDefaultSettings(): AppSettings {
  return {
    theme: 'auto',
    currency: 'TND',
    currencyPosition: 'suffix',
    roundDecimals: 2,
    notifications: {
      enabled: true,
      budgetAlerts: true,
      categoryAlerts: true,
      dailyReminder: true,
      dailyReminderTime: '20:00',
    },
  };
}

export function getDefaultAccounts(): Account[] {
  return [
    {
      id: 'acc-cash',
      name: 'Cash Wallet',
      currency: 'TND',
      color: '#00BFA5',
      icon: 'Wallet',
      includeInBalance: true,
      initialBalance: 180,
    },
    {
      id: 'acc-bank',
      name: 'Main Bank Account',
      currency: 'TND',
      color: '#3193F5',
      icon: 'Landmark',
      includeInBalance: true,
      initialBalance: 1650,
    },
    {
      id: 'acc-savings',
      name: 'Emergency Savings',
      currency: 'TND',
      color: '#7C4DFF',
      icon: 'PiggyBank',
      includeInBalance: true,
      initialBalance: 3200,
    },
  ];
}

export function getDefaultCategories(): Category[] {
  return [
    { id: 'cat-groceries', name: 'Groceries', type: 'expense', color: '#00BFA5', icon: 'ShoppingCart', budgetLimit: 260 },
    { id: 'cat-dining', name: 'Dining & Cafes', type: 'expense', color: '#FF6E40', icon: 'Utensils', budgetLimit: 150 },
    { id: 'cat-transport', name: 'Transport & Fuel', type: 'expense', color: '#3193F5', icon: 'Car', budgetLimit: 100 },
    { id: 'cat-bills', name: 'Utilities & Bills', type: 'expense', color: '#7C4DFF', icon: 'Receipt', budgetLimit: 120 },
    { id: 'cat-shopping', name: 'Shopping & Clothes', type: 'expense', color: '#F5D018', icon: 'ShoppingBag', budgetLimit: 80 },
    { id: 'cat-entertainment', name: 'Leisure & Fun', type: 'expense', color: '#F53D99', icon: 'Film', budgetLimit: 60 },
    { id: 'cat-health', name: 'Health & Pharmacy', type: 'expense', color: '#FF5252', icon: 'HeartPulse', budgetLimit: 50 },
    { id: 'cat-salary', name: 'Primary Salary', type: 'income', color: '#00BFA5', icon: 'Briefcase' },
    { id: 'cat-freelance', name: 'Freelance & Side gigs', type: 'income', color: '#3193F5', icon: 'Laptop' },
    { id: 'cat-bonus', name: 'Investments & Dividends', type: 'income', color: '#7C4DFF', icon: 'TrendingUp' },
  ];
}

export function getDefaultTransactions(): Transaction[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 1);
  const d1Str = d1.toISOString().slice(0, 10);

  const d3 = new Date(today);
  d3.setDate(d3.getDate() - 3);
  const d3Str = d3.toISOString().slice(0, 10);

  const d5 = new Date(today);
  d5.setDate(d5.getDate() - 5);
  const d5Str = d5.toISOString().slice(0, 10);

  return [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 14.5,
      title: 'Morning Espresso & Croissant',
      note: 'Coffee break downtown',
      date: `${todayStr}T09:30:00`,
      accountId: 'acc-cash',
      categoryId: 'cat-dining',
      allocationMode: 'TODAY',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 68.0,
      title: 'Supermarket Weekly Restock',
      note: 'Fruits, veggies, dairy',
      date: `${d1Str}T17:45:00`,
      accountId: 'acc-bank',
      categoryId: 'cat-groceries',
      allocationMode: 'WEEK',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 25.0,
      title: 'Gas Station Refill',
      date: `${d3Str}T14:15:00`,
      accountId: 'acc-cash',
      categoryId: 'cat-transport',
      allocationMode: 'TODAY',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 120.0,
      title: 'Annual Gym Membership Fee',
      note: 'Allocated across this month to soften the impact',
      date: `${d5Str}T11:00:00`,
      accountId: 'acc-bank',
      categoryId: 'cat-health',
      allocationMode: 'MONTH',
    },
    {
      id: 'tx-5',
      type: 'income',
      amount: 2400.0,
      title: 'Monthly Salary Deposit',
      date: `${year}-${month}-01T08:00:00`,
      accountId: 'acc-bank',
      categoryId: 'cat-salary',
      allocationMode: 'TODAY',
      includeInBudget: false,
    },
  ];
}

export function getDefaultReservations(): Reservation[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  return [
    {
      id: 'res-1',
      title: 'Electric & Internet Utility Bill',
      amount: 45.0,
      date: tomorrowStr,
      categoryId: 'cat-bills',
      accountId: 'acc-bank',
      allocationMode: 'TODAY',
      status: 'active',
      note: 'Auto-debit scheduled for end of week',
    },
  ];
}

export function getDefaultPlannedPayments(): PlannedPayment[] {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);

  return [
    {
      id: 'plan-1',
      title: 'Home Fiber Internet',
      amount: 49.9,
      type: 'expense',
      recurrence: 'monthly',
      nextDate: nextMonth.toISOString().slice(0, 10),
      accountId: 'acc-bank',
      categoryId: 'cat-bills',
      allocationMode: 'TODAY',
    },
    {
      id: 'plan-2',
      title: 'Cloud Storage & Software',
      amount: 15.0,
      type: 'expense',
      recurrence: 'monthly',
      nextDate: nextMonth.toISOString().slice(0, 10),
      accountId: 'acc-bank',
      categoryId: 'cat-bills',
      allocationMode: 'MONTH',
    },
  ];
}

export function getDefaultLoans(): Loan[] {
  return [
    {
      id: 'loan-bank-1',
      personName: 'BIAT Bank (Auto Loan)',
      type: 'borrow',
      amount: 12000,
      paidAmount: 2400,
      dueDate: '2027-09-01',
      note: 'Auto vehicle financing',
      records: [
        { id: 'lr-bank-1', amount: 400, date: '2026-08-05', note: 'Monthly installment' },
        { id: 'lr-bank-2', amount: 400, date: '2026-09-05', note: 'Monthly installment' },
      ],
      isBankLoan: true,
      bankName: 'BIAT Bank',
      interestRate: 8.25,
      termMonths: 36,
      monthlyInstallment: 377.5,
      debitDayOfMonth: 5,
      autoDebitAccountId: 'acc-bank',
      startDate: '2026-03-01',
    },
    {
      id: 'loan-1',
      personName: 'Omar Ben Salem',
      type: 'lend',
      amount: 150,
      paidAmount: 50,
      dueDate: '2026-10-15',
      note: 'Weekend trip car rental advance',
      records: [
        { id: 'lr-1', amount: 50, date: '2026-09-10', note: 'First partial transfer' },
      ],
    },
    {
      id: 'loan-2',
      personName: 'Yassine K.',
      type: 'borrow',
      amount: 80,
      paidAmount: 80,
      dueDate: '2026-09-01',
      note: 'Concert ticket purchase',
      records: [
        { id: 'lr-2', amount: 80, date: '2026-09-02', note: 'Settled in cash' },
      ],
    },
  ];
}

// Storage helpers
export const db = {
  getAccounts(): Account[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) {
      const def = getDefaultAccounts();
      this.saveAccounts(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultAccounts();
    }
  },

  saveAccounts(accounts: Account[]) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      const def = getDefaultCategories();
      this.saveCategories(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultCategories();
    }
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      const def = getDefaultTransactions();
      this.saveTransactions(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultTransactions();
    }
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getReservations(): Reservation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!raw) {
      const def = getDefaultReservations();
      this.saveReservations(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultReservations();
    }
  },

  saveReservations(reservations: Reservation[]) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  },

  getLoans(): Loan[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (!raw) {
      const def = getDefaultLoans();
      this.saveLoans(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultLoans();
    }
  },

  saveLoans(loans: Loan[]) {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  },

  getPlannedPayments(): PlannedPayment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANNED);
    if (!raw) {
      const def = getDefaultPlannedPayments();
      this.savePlannedPayments(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultPlannedPayments();
    }
  },

  savePlannedPayments(planned: PlannedPayment[]) {
    localStorage.setItem(STORAGE_KEYS.PLANNED, JSON.stringify(planned));
  },

  getBudgetConfig(): DynamicBudgetConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET_CONFIG);
    if (!raw) {
      const def = getDefaultConfig();
      this.saveBudgetConfig(def);
      return def;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return getDefaultConfig();
    }
  },

  saveBudgetConfig(config: DynamicBudgetConfig) {
    localStorage.setItem(STORAGE_KEYS.BUDGET_CONFIG, JSON.stringify(config));
  },

  getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const def = getDefaultSettings();
      this.saveSettings(def);
      return def;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.theme || (parsed.theme !== 'auto' && parsed.theme !== 'light' && parsed.theme !== 'dark')) {
        parsed.theme = 'auto';
      }
      return parsed;
    } catch {
      return getDefaultSettings();
    }
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveNotifications(notifications: AppNotification[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.PLANNED);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },

  exportAll(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accounts: this.getAccounts(),
      categories: this.getCategories(),
      transactions: this.getTransactions(),
      reservations: this.getReservations(),
      loans: this.getLoans(),
      planned: this.getPlannedPayments(),
      budgetConfig: this.getBudgetConfig(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAll(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.accounts) this.saveAccounts(data.accounts);
      if (data.categories) this.saveCategories(data.categories);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.reservations) this.saveReservations(data.reservations);
      if (data.loans) this.saveLoans(data.loans);
      if (data.planned) this.savePlannedPayments(data.planned);
      if (data.budgetConfig) this.saveBudgetConfig(data.budgetConfig);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};
