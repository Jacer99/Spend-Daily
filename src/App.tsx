import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Menu,
  ChevronDown,
  Calendar,
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Bookmark,
  ChevronRight,
  Sparkles,
  Bell,
} from 'lucide-react';

import {
  Account,
  Category,
  Transaction,
  Reservation,
  Loan,
  PlannedPayment,
  DynamicBudgetConfig,
  AppSettings,
  BudgetSnapshot,
  AppNotification,
} from './types';
import { db, getTodayDateString } from './storage/db';
import { BudgetPeriodResolver } from './domain/budgetPeriodResolver';
import { DynamicBudgetEngine } from './domain/dynamicBudgetEngine';

import { SafeToSpendCard } from './components/SafeToSpendCard';
import { TwinCashflowCards } from './components/TwinCashflowCards';
import { MainBottomBar } from './components/MainBottomBar';
import { AddTransactionSpeedDial } from './components/AddTransactionSpeedDial';
import { HomeMoreMenu } from './components/HomeMoreMenu';
import { ChoosePeriodModal } from './components/ChoosePeriodModal';
import { CategoriesScreen } from './components/CategoriesScreen';
import { DynamicBudgetConfigModal } from './components/DynamicBudgetConfigModal';
import { isDarkMode, getSystemPrefersDark } from './utils/theme';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionsTab } from './components/TransactionsTab';
import { AccountsTab } from './components/AccountsTab';
import { BudgetsTab } from './components/BudgetsTab';
import { ReportsTab } from './components/ReportsTab';
import { LoansTab } from './components/LoansTab';
import { SettingsTab } from './components/SettingsTab';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { formatMoney, formatDateDisplay } from './utils/format';
import { renderCategoryIcon } from './utils/icons';

import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  getOrCreateDefaultSharedBudget,
  joinBudgetWithInviteCode,
  addPartnerByEmail,
  syncBudgetDataToCloud,
  subscribeToBudgetData,
  subscribeToBudgetSpace,
  SharedBudgetSpace,
  CloudBudgetData,
} from './storage/firebase';
import { CoupleSyncModal } from './components/CoupleSyncModal';
import { FirstLaunchWizard } from './components/FirstLaunchWizard';

type NavigationTab =
  | 'home'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'reports'
  | 'loans'
  | 'categories'
  | 'settings';

export const App: React.FC = () => {
  // Database state
  const [accounts, setAccounts] = useState<Account[]>(() => db.getAccounts());
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [transactions, setTransactions] = useState<Transaction[]>(() => db.getTransactions());
  const [reservations, setReservations] = useState<Reservation[]>(() => db.getReservations());
  const [loans, setLoans] = useState<Loan[]>(() => db.getLoans());
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>(() => db.getPlannedPayments());
  const [budgetConfig, setBudgetConfig] = useState<DynamicBudgetConfig>(() => db.getBudgetConfig());
  const [settings, setSettings] = useState<AppSettings>(() => db.getSettings());

  // UI state
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<
    'expense' | 'income' | 'transfer' | 'reservation'
  >('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Speed Dial & Drawer & Period Picker state
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChoosePeriodOpen, setIsChoosePeriodOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => db.getNotifications());

  const todayDate = new Date();
  const defaultPeriodStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriodStr);

  // Today reference string
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Firebase Auth & Real-Time Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [budgetSpace, setBudgetSpace] = useState<SharedBudgetSpace | null>(null);
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isIncomingCloudUpdate = React.useRef(false);

  // First-Launch Onboarding State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('spenddaily_onboarded_v1') !== 'true';
  });

  const handleCompleteOnboarding = async (data: {
    accounts: Account[];
    categories: Category[];
    budgetConfig: DynamicBudgetConfig;
    enableCoupleSync: boolean;
    partnerEmail?: string;
  }) => {
    db.saveAccounts(data.accounts);
    setAccounts(data.accounts);

    db.saveCategories(data.categories);
    setCategories(data.categories);

    db.saveBudgetConfig(data.budgetConfig);
    setBudgetConfig(data.budgetConfig);

    if (data.budgetConfig.currencyCode && data.budgetConfig.currencyCode !== settings.currency) {
      const updated = { ...settings, currency: data.budgetConfig.currencyCode };
      db.saveSettings(updated);
      setSettings(updated);
    }

    localStorage.setItem('spenddaily_onboarded_v1', 'true');
    setIsOnboardingOpen(false);

    if (data.enableCoupleSync) {
      if (currentUser) {
        try {
          setIsSyncing(true);
          const space = await getOrCreateDefaultSharedBudget(currentUser, {
            accounts: data.accounts,
            categories: data.categories,
            transactions: db.getTransactions(),
            reservations: db.getReservations(),
            loans: db.getLoans(),
            plannedPayments: db.getPlannedPayments(),
            budgetConfig: data.budgetConfig,
            settings: db.getSettings(),
          });
          setBudgetSpace(space);

          if (data.partnerEmail) {
            await addPartnerByEmail(space.id, data.partnerEmail);
          }
        } catch (err) {
          console.error('Failed to initialize shared space from wizard:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setIsCoupleModalOpen(true);
      }
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          setIsSyncing(true);
          const space = await getOrCreateDefaultSharedBudget(user, {
            accounts: db.getAccounts(),
            categories: db.getCategories(),
            transactions: db.getTransactions(),
            reservations: db.getReservations(),
            loans: db.getLoans(),
            plannedPayments: db.getPlannedPayments(),
            budgetConfig: db.getBudgetConfig(),
            settings: db.getSettings(),
          });
          setBudgetSpace(space);
        } catch (err) {
          console.error('Failed to initialize shared space:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setBudgetSpace(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check URL params for invite code e.g. ?invite=XXXXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite');
    if (inviteParam && currentUser) {
      joinBudgetWithInviteCode(currentUser, inviteParam).then((space) => {
        if (space) {
          setBudgetSpace(space);
          confetti({ particleCount: 60, spread: 80 });
          // Clean URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [currentUser]);

  // Subscribe to real-time changes from Firestore when budgetSpace is active
  useEffect(() => {
    if (!budgetSpace?.id) return;

    // 1. Subscribe to Space metadata (members, name)
    const unsubSpace = subscribeToBudgetSpace(budgetSpace.id, (updatedSpace) => {
      setBudgetSpace(updatedSpace);
    });

    // 2. Subscribe to Budget Data payload
    const unsubData = subscribeToBudgetData(budgetSpace.id, (cloudData) => {
      if (!cloudData) return;
      isIncomingCloudUpdate.current = true;

      if (cloudData.accounts) {
        setAccounts(cloudData.accounts);
        db.saveAccounts(cloudData.accounts);
      }
      if (cloudData.categories) {
        setCategories(cloudData.categories);
        db.saveCategories(cloudData.categories);
      }
      if (cloudData.transactions) {
        setTransactions(cloudData.transactions);
        db.saveTransactions(cloudData.transactions);
      }
      if (cloudData.reservations) {
        setReservations(cloudData.reservations);
        db.saveReservations(cloudData.reservations);
      }
      if (cloudData.loans) {
        setLoans(cloudData.loans);
        db.saveLoans(cloudData.loans);
      }
      if (cloudData.plannedPayments) {
        setPlannedPayments(cloudData.plannedPayments);
        db.savePlannedPayments(cloudData.plannedPayments);
      }
      if (cloudData.budgetConfig) {
        setBudgetConfig(cloudData.budgetConfig);
        db.saveBudgetConfig(cloudData.budgetConfig);
      }
      if (cloudData.settings) {
        setSettings(cloudData.settings);
        db.saveSettings(cloudData.settings);
      }

      setLastSyncedAt(new Date());

      setTimeout(() => {
        isIncomingCloudUpdate.current = false;
      }, 500);
    });

    return () => {
      unsubSpace();
      unsubData();
    };
  }, [budgetSpace?.id]);

  // Push local updates to Cloud Firestore if user is authenticated
  useEffect(() => {
    if (!budgetSpace?.id || !currentUser || isIncomingCloudUpdate.current) return;

    const timer = setTimeout(() => {
      setIsSyncing(true);
      syncBudgetDataToCloud(budgetSpace.id, {
        accounts,
        categories,
        transactions,
        reservations,
        loans,
        plannedPayments,
        budgetConfig,
        settings,
        updatedBy: currentUser.email || currentUser.uid,
      })
        .then(() => {
          setLastSyncedAt(new Date());
        })
        .catch((err) => {
          console.error('Error syncing to cloud:', err);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    accounts,
    categories,
    transactions,
    reservations,
    loans,
    plannedPayments,
    budgetConfig,
    settings,
    budgetSpace?.id,
    currentUser,
  ]);

  // Compute Active Budget Period
  const activePeriod = useMemo(() => {
    return BudgetPeriodResolver.resolve(budgetConfig.periodType, todayStr, {
      payday: budgetConfig.payday,
      customStart: budgetConfig.customStart,
      customEnd: budgetConfig.customEnd,
    });
  }, [budgetConfig, todayStr]);

  // Calculate Dynamic Safe-to-Spend Snapshot in real-time
  const budgetSnapshot: BudgetSnapshot = useMemo(() => {
    return DynamicBudgetEngine.calculate({
      config: budgetConfig,
      period: activePeriod,
      transactions,
      reservations,
      todayStr,
    });
  }, [budgetConfig, activePeriod, transactions, reservations, todayStr]);

  // Synchronize state changes to DB
  useEffect(() => {
    db.saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    db.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    db.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    db.saveReservations(reservations);
  }, [reservations]);

  useEffect(() => {
    db.saveLoans(loans);
  }, [loans]);

  useEffect(() => {
    db.savePlannedPayments(plannedPayments);
  }, [plannedPayments]);

  useEffect(() => {
    db.saveBudgetConfig(budgetConfig);
  }, [budgetConfig]);

  useEffect(() => {
    db.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    db.saveNotifications(notifications);
  }, [notifications]);

  // Proactive Alert & Notification Generator
  useEffect(() => {
    const notifyConfig = settings.notifications;
    if (notifyConfig?.enabled === false) return;

    const newAlerts: AppNotification[] = [];
    const now = new Date();
    const timestampStr = now.toISOString();

    // 1. Budget Alerts: Exceeded Daily Safe-to-Spend or Low Funds Alert
    if (notifyConfig?.budgetAlerts !== false) {
      if (budgetSnapshot.status === 'overToday' || budgetSnapshot.status === 'periodExhausted') {
        const id = `alert-budget-exceeded-${todayStr}`;
        if (!notifications.some((n) => n.id === id)) {
          newAlerts.push({
            id,
            type: 'budget_exceeded',
            title: 'Daily Safe-to-Spend Exceeded',
            message: `You have exhausted your daily allowance for today (${formatMoney(budgetSnapshot.todayCharges, settings.currency)} spent today). Subsequent expenses will be drawn from tomorrow!`,
            timestamp: timestampStr,
            read: false,
            actionScreen: 'home',
          });
        }
      }

      // Check low funds rule (period week <= 50 TND, period month <= 200 TND)
      const isPeriodLowFunds =
        (budgetConfig.periodType === 'weekly' && budgetSnapshot.periodRemaining <= 50) ||
        (budgetConfig.periodType === 'monthly' && budgetSnapshot.periodRemaining <= 200);

      if (isPeriodLowFunds && budgetSnapshot.periodRemaining > 0) {
        const id = `alert-low-funds-${todayStr}`;
        if (!notifications.some((n) => n.id === id)) {
          newAlerts.push({
            id,
            type: 'budget_exceeded',
            title: 'Critical Low Funds Alert',
            message: `Only ${formatMoney(budgetSnapshot.periodRemaining, settings.currency)} remaining for this ${budgetConfig.periodType} period. Please monitor spending closely.`,
            timestamp: timestampStr,
            read: false,
            actionScreen: 'home',
          });
        }
      }
    }

    // 2. Category Spending Limit Alerts
    if (notifyConfig?.categoryAlerts !== false) {
      const currentMonth = todayStr.slice(0, 7);
      const categorySpentMap: Record<string, number> = {};
      transactions.forEach((tx) => {
        if (tx.type === 'expense' && tx.categoryId && tx.date.startsWith(currentMonth)) {
          categorySpentMap[tx.categoryId] = (categorySpentMap[tx.categoryId] || 0) + tx.amount;
        }
      });

      categories.forEach((cat) => {
        if (cat.budgetLimit && cat.budgetLimit > 0) {
          const spent = categorySpentMap[cat.id] || 0;
          if (spent >= cat.budgetLimit) {
            const id = `alert-cat-limit-${cat.id}-${currentMonth}`;
            if (!notifications.some((n) => n.id === id)) {
              newAlerts.push({
                id,
                type: 'category_limit',
                title: `${cat.name} Limit Reached`,
                message: `You spent ${formatMoney(spent, settings.currency)} of your ${formatMoney(cat.budgetLimit, settings.currency)} monthly limit on ${cat.name}.`,
                timestamp: timestampStr,
                read: false,
                actionScreen: 'budgets',
              });
            }
          }
        }
      });
    }

    // 3. Daily Expense Logging Reminder
    if (notifyConfig?.dailyReminder !== false) {
      const reminderTime = notifyConfig?.dailyReminderTime || '20:00';
      const [remHour, remMinute] = reminderTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // If current time is past or equal to reminder time
      if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
        const id = `alert-daily-reminder-${todayStr}`;
        if (!notifications.some((n) => n.id === id)) {
          newAlerts.push({
            id,
            type: 'daily_reminder',
            title: 'Daily Expense Reminder',
            message: "Don't forget to log your daily cash expenses, coffee, and receipts to keep your safe-to-spend on track!",
            timestamp: timestampStr,
            read: false,
            actionScreen: 'home',
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      setNotifications((prev) => [...newAlerts, ...prev]);
    }
  }, [
    budgetSnapshot,
    transactions,
    categories,
    budgetConfig,
    settings.notifications,
    settings.currency,
    todayStr,
  ]);

  // System theme preference listener
  const [systemDark, setSystemDark] = useState(() => getSystemPrefersDark());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Theme styling (Liquid Glass atmospheric canvases)
  const isDark = isDarkMode(settings.theme, systemDark);
  const themeCanvasBg = isDark ? 'pocket-canvas-dark' : 'pocket-canvas-light';

  // Compute monthly income & expenses for selected period (Twin Cashflow Cards)
  const { monthlyIncome, monthlyExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach((tx) => {
      if (tx.date.startsWith(selectedPeriod)) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expenses += tx.amount;
      }
    });
    return { monthlyIncome: income, monthlyExpenses: expenses };
  }, [transactions, selectedPeriod]);

  // Period label (e.g., "September")
  const periodDisplayLabel = useMemo(() => {
    const parts = selectedPeriod.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const d = new Date(year, month, 1);
      return d.toLocaleDateString(undefined, { month: 'long' });
    }
    return 'Current Month';
  }, [selectedPeriod]);

  // Group transactions chronologically with uppercase date divider rows for Home feed
  const groupedHomeFeed = useMemo(() => {
    const list = [...transactions]
      .filter((tx) => tx.date.startsWith(selectedPeriod))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groups: { label: string; items: Transaction[]; totalDaySpend: number }[] = [];
    const map = new Map<string, Transaction[]>();

    list.forEach((tx) => {
      const dateKey = tx.date.slice(0, 10);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(tx);
    });

    const todayDateObj = new Date();
    const yesterdayDateObj = new Date(Date.now() - 86400000);
    const todayYMD = todayDateObj.toISOString().slice(0, 10);
    const yesterdayYMD = yesterdayDateObj.toISOString().slice(0, 10);

    map.forEach((items, dateKey) => {
      let label = '';
      if (dateKey === todayYMD) {
        label = 'TODAY';
      } else if (dateKey === yesterdayYMD) {
        label = 'YESTERDAY';
      } else {
        const d = new Date(dateKey + 'T12:00:00');
        const monthName = d.toLocaleDateString(undefined, { month: 'long' }).toUpperCase();
        label = `${monthName} ${d.getDate()}.`;
      }

      const totalDaySpend = items
        .filter((i) => i.type === 'expense')
        .reduce((sum, i) => sum + i.amount, 0);

      groups.push({ label, items, totalDaySpend });
    });

    return groups;
  }, [transactions, selectedPeriod]);

  // Modal Triggers
  const handleOpenAdd = (
    type: 'expense' | 'income' | 'transfer' | 'reservation' = 'expense'
  ) => {
    setEditingTransaction(null);
    setAddModalInitialType(type);
    setIsAddModalOpen(true);
    setIsSpeedDialOpen(false);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  // CRUD Handlers
  const handleSaveTransaction = (txData: Partial<Transaction> & { id?: string }) => {
    if (txData.id) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txData.id ? ({ ...t, ...txData } as Transaction) : t))
      );
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: txData.type || 'expense',
        amount: txData.amount || 0,
        title: txData.title || 'Transaction',
        note: txData.note,
        date: txData.date || new Date().toISOString(),
        accountId: txData.accountId || accounts[0]?.id || '',
        toAccountId: txData.toAccountId,
        categoryId: txData.categoryId,
        allocationMode: txData.allocationMode || 'TODAY',
        includeInBudget: txData.includeInBudget ?? true,
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (newTx.type === 'income') {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveAccount = (acc: Account) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === acc.id);
      return exists ? prev.map((a) => (a.id === acc.id ? acc : a)) : [...prev, acc];
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveCategory = (cat: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      return exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCategoryBudget = (catId: string, limit: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, budgetLimit: limit } : c))
    );
  };

  const handleConvertReservation = (res: Reservation) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: 'paid' as const } : r))
    );
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'expense',
      amount: res.amount,
      title: res.title,
      note: res.note ? `Converted from reservation: ${res.note}` : 'Converted from reservation',
      date: new Date().toISOString(),
      accountId: res.accountId || accounts[0]?.id || '',
      categoryId: res.categoryId,
      allocationMode: res.allocationMode,
    };
    setTransactions((prev) => [newTx, ...prev]);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
  };

  const handleDeleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const handlePayPlannedPayment = (plan: PlannedPayment) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: plan.type,
      amount: plan.amount,
      title: plan.title,
      note: `Planned payment: ${plan.recurrence}`,
      date: new Date().toISOString(),
      accountId: plan.accountId,
      categoryId: plan.categoryId,
      allocationMode: plan.allocationMode,
    };
    setTransactions((prev) => [newTx, ...prev]);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  const handleDeletePlannedPayment = (id: string) => {
    setPlannedPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveLoan = (loan: Loan) => {
    setLoans((prev) => {
      const exists = prev.some((l) => l.id === loan.id);
      return exists ? prev.map((l) => (l.id === loan.id ? loan : l)) : [loan, ...prev];
    });
    if (loan.paidAmount >= loan.amount) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    }
  };

  const handleDeleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExportData = () => {
    const json = db.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pocketmoney_backup_${todayStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    const success = db.importAll(jsonStr);
    if (success) {
      setAccounts(db.getAccounts());
      setCategories(db.getCategories());
      setTransactions(db.getTransactions());
      setReservations(db.getReservations());
      setLoans(db.getLoans());
      setPlannedPayments(db.getPlannedPayments());
      setBudgetConfig(db.getBudgetConfig());
      setSettings(db.getSettings());
      confetti({ particleCount: 50, spread: 70 });
    } else {
      alert('Failed to import backup file. Please check format.');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to initial sample defaults?')) {
      db.resetAll();
      setAccounts(db.getAccounts());
      setCategories(db.getCategories());
      setTransactions(db.getTransactions());
      setReservations(db.getReservations());
      setLoans(db.getLoans());
      setPlannedPayments(db.getPlannedPayments());
      setBudgetConfig(db.getBudgetConfig());
      setSettings(db.getSettings());
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeCanvasBg} pb-36 sm:pb-40`}>
      {/* Top Application Header Row (Authentic Apple iOS Frosted Header) */}
      <header className={`sticky top-0 z-40 transition-all ${
        isDark
          ? 'border-b border-white/10 bg-[#0A0A0E]/70 text-white'
          : 'border-b border-black/5 bg-white/75 text-black'
      } liquid-glass`}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Personalized greeting & Couple Sync Pill */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {currentUser?.displayName ? `Hi, ${currentUser.displayName.split(' ')[0]}` : 'Hi, Jacer'}
              </h1>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-[#98989D]' : 'text-[#8E8E93]'}`}>
                Spend Daily
              </span>
            </div>

            {/* Couple Sync status pill button in header */}
            <button
              id="btn-header-couple-sync"
              onClick={() => setIsCoupleModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                currentUser
                  ? 'bg-[#34C759]/15 border-[#34C759]/30 text-[#34C759] hover:bg-[#34C759]/25'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-[#98989D] hover:bg-white/10 hover:text-white'
                  : 'bg-black/5 border-black/5 text-[#8E8E93] hover:bg-black/10 hover:text-black'
              }`}
              title={currentUser ? 'Synchronized with cloud' : 'Connect with wife via Google'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser
                    ? isOnline
                      ? isSyncing
                        ? 'bg-amber-400 animate-spin'
                        : 'bg-[#34C759] animate-pulse'
                      : 'bg-zinc-400'
                    : 'bg-[#007AFF]'
                }`}
              />
              <span className="font-semibold text-[11px] hidden sm:inline">
                {currentUser ? (budgetSpace?.name || 'Synced') : 'Sync with Wife'}
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links (for wide screens) */}
          <nav className={`hidden md:flex items-center gap-1 rounded-full p-1 border text-xs ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'
          }`}>
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'home'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'transactions'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'accounts'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'categories'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'reports'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                activeTab === 'loans'
                  ? 'bg-[#007AFF] text-white shadow-sm'
                  : isDark
                  ? 'text-[#98989D] hover:text-white'
                  : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              Loans
            </button>
          </nav>

          {/* Center-Right: Period selector button & Notification Bell button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChoosePeriodOpen(true)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                isDark
                  ? 'specular-border-dark bg-[#1C1C1E]/60 text-white hover:bg-[#1C1C1E]'
                  : 'specular-border-light bg-white/85 text-black hover:bg-white shadow-sm'
              } liquid-glass`}
            >
              <Calendar size={13} className="text-[#007AFF]" />
              <span>{periodDisplayLabel}</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              title="Notifications & Alerts"
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95 ${
                isDark
                  ? 'specular-border-dark bg-[#1C1C1E]/60 text-white hover:bg-[#1C1C1E]'
                  : 'specular-border-light bg-white/85 text-black hover:bg-white shadow-sm'
              } liquid-glass`}
            >
              <Bell size={15} className={notifications.some((n) => !n.read) ? 'text-[#007AFF]' : 'opacity-70'} />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-black">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 pt-5 sm:px-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Screen 1 Hero: The Signature Dynamic Safe-to-Spend Card */}
            <SafeToSpendCard
              snapshot={budgetSnapshot}
              config={budgetConfig}
              currency={settings.currency}
              theme={settings.theme}
              onOpenConfig={() => setIsConfigModalOpen(true)}
              onAddExpense={() => handleOpenAdd('expense')}
            />

            {/* Screen 1 Twin Cashflow Cards & Sub-Indicator Pill */}
            <TwinCashflowCards
              incomeThisMonth={monthlyIncome}
              expensesThisMonth={monthlyExpenses}
              currency={settings.currency}
              theme={settings.theme}
              onSelectIncome={() => setActiveTab('reports')}
              onSelectExpense={() => setActiveTab('reports')}
            />

            {/* Screen 1 Feed & Transaction List: Grouped chronologically with uppercase date dividers */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                  Activity Feed
                </h2>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"
                >
                  All transactions ({transactions.length})
                  <ChevronRight size={14} />
                </button>
              </div>

              {groupedHomeFeed.length === 0 ? (
                <div
                  className={`rounded-3xl border border-dashed p-8 text-center ${
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-300 bg-white/60'
                  }`}
                >
                  <p className="text-sm font-semibold">No transactions in {periodDisplayLabel}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                    Tap the elevated + button on the dock to log an expense or income.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedHomeFeed.slice(0, 3).map((group) => (
                    <div key={group.label} className="space-y-2">
                      {/* Uppercase date divider row ("SEPTEMBER 18.", "YESTERDAY") */}
                      <div className="flex items-center justify-between px-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                        <span>{group.label}</span>
                        {group.totalDaySpend > 0 && (
                          <span className="font-numeric text-rose-400/90 font-bold">
                            -{formatMoney(group.totalDaySpend, settings.currency)}
                          </span>
                        )}
                      </div>

                      {/* Frosted Transaction Cards with 20dp corners */}
                      <div className="space-y-2">
                        {group.items.map((tx) => {
                          const cat = categories.find((c) => c.id === tx.categoryId);
                          const acc = accounts.find((a) => a.id === tx.accountId);
                          const timeStr = tx.date.slice(11, 16) || '12:00';

                          return (
                            <div
                              key={tx.id}
                              onClick={() => handleEditTx(tx)}
                              className={`flex items-center justify-between p-4 rounded-[20px] border cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                                isDark
                                  ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.09]'
                                  : 'border-slate-200/80 bg-white/80 text-slate-900 shadow-sm hover:bg-white'
                              } liquid-glass`}
                            >
                              <div className="flex items-center gap-3.5">
                                {/* Category Icon Badge */}
                                <span
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                                  style={{
                                    backgroundColor:
                                      tx.type === 'transfer'
                                        ? '#8B5CF6'
                                        : cat?.color || (tx.type === 'income' ? '#10B981' : '#F43F5E'),
                                  }}
                                >
                                  {tx.type === 'transfer' ? (
                                    <ArrowRightLeft size={18} />
                                  ) : cat ? (
                                    renderCategoryIcon(cat.icon, 18)
                                  ) : tx.type === 'income' ? (
                                    <ArrowDownLeft size={18} />
                                  ) : (
                                    <ArrowUpRight size={18} />
                                  )}
                                </span>

                                <div>
                                  <h4 className="text-sm font-extrabold tracking-tight leading-snug">
                                    {tx.title}
                                  </h4>
                                  <span className={`text-[11px] ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                                    {acc?.name || 'Vault'} · {timeStr}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`font-numeric text-sm font-extrabold tracking-tight ${
                                    tx.type === 'expense'
                                      ? 'text-rose-400'
                                      : tx.type === 'income'
                                      ? 'text-teal-400'
                                      : 'text-purple-400'
                                  }`}
                                >
                                  {tx.type === 'expense'
                                    ? `-${formatMoney(tx.amount, settings.currency)}`
                                    : tx.type === 'income'
                                    ? `+${formatMoney(tx.amount, settings.currency)}`
                                    : formatMoney(tx.amount, settings.currency)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            reservations={reservations}
            accounts={accounts}
            categories={categories}
            currency={settings.currency}
            theme={settings.theme}
            onEditTransaction={handleEditTx}
            onAddNew={() => handleOpenAdd('expense')}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            transactions={transactions}
            currency={settings.currency}
            theme={settings.theme}
            onSaveAccount={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesScreen
            categories={categories}
            transactions={transactions}
            currency={settings.currency}
            theme={settings.theme}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsTab
            categories={categories}
            transactions={transactions}
            reservations={reservations}
            plannedPayments={plannedPayments}
            currency={settings.currency}
            theme={settings.theme}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onConvertReservation={handleConvertReservation}
            onDeleteReservation={handleDeleteReservation}
            onPayPlannedPayment={handlePayPlannedPayment}
            onDeletePlannedPayment={handleDeletePlannedPayment}
            onOpenAddModal={(type) => handleOpenAdd(type)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            transactions={transactions}
            categories={categories}
            snapshot={budgetSnapshot}
            currency={settings.currency}
            theme={settings.theme}
          />
        )}

        {activeTab === 'loans' && (
          <LoansTab
            loans={loans}
            accounts={accounts}
            currency={settings.currency}
            theme={settings.theme}
            onSaveLoan={handleSaveLoan}
            onDeleteLoan={handleDeleteLoan}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={setSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            currentUser={currentUser}
            budgetSpace={budgetSpace}
            onOpenCoupleSync={() => setIsCoupleModalOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Screen 1 Bottom Floating Dock (MainBottomBar.kt) */}
      <MainBottomBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenSpeedDial={() => setIsSpeedDialOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        theme={settings.theme}
      />

      {/* Screen 2: Speed Dial Transaction Launcher (AddTransactionSpeedDial.kt) */}
      <AddTransactionSpeedDial
        isOpen={isSpeedDialOpen}
        onClose={() => setIsSpeedDialOpen(false)}
        onSelectType={(type) => handleOpenAdd(type)}
        onOpenPlannedPayment={() => {
          setActiveTab('budgets');
        }}
        theme={settings.theme}
      />

      {/* Screen 7: Quick Access Drawer (HomeMoreMenu.kt) */}
      <HomeMoreMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        theme={settings.theme}
        onToggleTheme={() => {
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }));
        }}
        currency={settings.currency}
        totalBalance={accounts.filter((a) => a.includeInBalance).reduce((s, a) => s + (a.initialBalance || 0), 0)}
        transactions={transactions}
        onSelectTransaction={(tx) => handleEditTx(tx)}
        currentUser={currentUser}
        budgetSpace={budgetSpace}
        onOpenCoupleSync={() => setIsCoupleModalOpen(true)}
        onNavigate={(screen) => {
          if (screen === 'budget-config' || screen === 'allowance') {
            setIsConfigModalOpen(true);
          } else if (screen === 'planned') {
            setActiveTab('budgets');
          } else if (
            screen === 'home' ||
            screen === 'transactions' ||
            screen === 'accounts' ||
            screen === 'budgets' ||
            screen === 'reports' ||
            screen === 'loans' ||
            screen === 'categories' ||
            screen === 'settings'
          ) {
            setActiveTab(screen as NavigationTab);
          }
          setIsDrawerOpen(false);
        }}
      />

      {/* Couple & Household Sync Modal (Firebase & Google Auth) */}
      <CoupleSyncModal
        isOpen={isCoupleModalOpen}
        onClose={() => setIsCoupleModalOpen(false)}
        currentUser={currentUser}
        budgetSpace={budgetSpace}
        isSyncing={isSyncing}
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        onSignInWithGoogle={async () => {
          await signInWithGoogle();
        }}
        onSignOut={async () => {
          await logOut();
        }}
        onJoinBudget={async (codeOrId: string) => {
          if (!currentUser) return false;
          const space = await joinBudgetWithInviteCode(currentUser, codeOrId);
          if (space) {
            setBudgetSpace(space);
            confetti({ particleCount: 50, spread: 70 });
            return true;
          }
          return false;
        }}
        onAddPartnerEmail={async (email: string) => {
          if (!budgetSpace?.id) return false;
          const ok = await addPartnerByEmail(budgetSpace.id, email);
          if (ok) {
            confetti({ particleCount: 40, spread: 60 });
          }
          return ok;
        }}
        theme={settings.theme}
      />

      {/* Period Selector Modal (ChoosePeriodModal.kt) */}
      <ChoosePeriodModal
        isOpen={isChoosePeriodOpen}
        onClose={() => setIsChoosePeriodOpen(false)}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={(period) => setSelectedPeriod(period)}
        theme={settings.theme}
      />

      {/* Screen 6: Spending Budget Configuration (DynamicBudgetConfigScreen.kt) */}
      <DynamicBudgetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={budgetConfig}
        onSave={(newCfg) => setBudgetConfig(newCfg)}
        accounts={accounts}
        categories={categories}
        theme={settings.theme}
      />

      {/* Screen 3: Transaction Entry & Edit Flow (EditTransactionScreen.kt) */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        editTransaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        currency={settings.currency}
        theme={settings.theme}
        initialType={addModalInitialType}
        hasActiveBudget={budgetConfig.budgetLimit > 0}
      />

      {/* Notification Center & Alert Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearAll={() => {
          setNotifications([]);
        }}
        onNavigate={(tab) => {
          if (
            tab === 'home' ||
            tab === 'transactions' ||
            tab === 'accounts' ||
            tab === 'budgets' ||
            tab === 'reports' ||
            tab === 'loans' ||
            tab === 'categories' ||
            tab === 'settings'
          ) {
            setActiveTab(tab as NavigationTab);
          }
        }}
        theme={settings.theme}
      />

      {/* First-Launch & Initial Account Setup Wizard */}
      <FirstLaunchWizard
        isOpen={isOnboardingOpen}
        currentUser={currentUser}
        onSignInWithGoogle={async () => {
          try {
            const user = await signInWithGoogle();
            if (user) {
              setCurrentUser(user);
              confetti({ particleCount: 50, spread: 60 });
            }
            return user;
          } catch (e: any) {
            if (e?.message && (e.message.includes('cancelled') || e.message.includes('closed-by-user'))) {
              return null;
            }
            console.warn('Google sign in notice:', e?.message || e);
            return null;
          }
        }}
        onSignOut={async () => {
          await logOut();
          setCurrentUser(null);
          setBudgetSpace(null);
        }}
        onComplete={handleCompleteOnboarding}
        theme={settings.theme}
        currency={settings.currency}
      />
    </div>
  );
};
export default App;
