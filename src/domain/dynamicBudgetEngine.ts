import {
  BudgetSnapshot,
  DynamicBudgetConfig,
  BudgetPeriod,
  Transaction,
  Reservation,
} from '../types';
import { BudgetPeriodResolver } from './budgetPeriodResolver';
import { ExpenseAllocationScheduler } from './expenseAllocationScheduler';

export interface DynamicBudgetEngineInput {
  config: DynamicBudgetConfig;
  period: BudgetPeriod;
  transactions: Transaction[];
  reservations: Reservation[];
  todayStr: string; // YYYY-MM-DD
}

export class DynamicBudgetEngine {
  static calculate(input: DynamicBudgetEngineInput): BudgetSnapshot {
    const { config, period, transactions, reservations, todayStr } = input;

    if (config.budgetLimit <= 0) {
      return {
        periodStart: period.start,
        periodEnd: period.end,
        capacity: 0,
        periodSpentRaw: 0,
        periodReserved: 0,
        periodRemaining: 0,
        daysRemaining: BudgetPeriodResolver.daysRemaining(todayStr, period.end),
        openingAllowance: 0,
        todayCharges: 0,
        remainingAllowance: 0,
        tomorrowProjection: null,
        status: 'noBudget',
        overTodayAmount: 0,
      };
    }

    // Helper to check account and category eligibility
    const isAccountEligible = (accId?: string) => {
      if (!accId) return true;
      if (!config.includedAccountIds || config.includedAccountIds.length === 0) return true;
      return config.includedAccountIds.includes(accId);
    };

    const isCategoryEligible = (catId?: string) => {
      if (!catId) return true;
      if (!config.includedCategoryIds || config.includedCategoryIds.length === 0) return true;
      return config.includedCategoryIds.includes(catId);
    };

    // Calculate included income
    let includedIncome = 0;
    if (config.includeIncomeInBudget) {
      for (const tx of transactions) {
        if (
          tx.type === 'income' &&
          tx.includeInBudget &&
          tx.date.slice(0, 10) >= period.start &&
          tx.date.slice(0, 10) <= period.end &&
          isAccountEligible(tx.accountId) &&
          isCategoryEligible(tx.categoryId)
        ) {
          includedIncome += tx.amount;
        }
      }
    }

    const capacity = config.budgetLimit + includedIncome;

    // Filter active reservations in this period
    let periodReserved = 0;
    for (const res of reservations) {
      if (
        res.status === 'active' &&
        res.date >= period.start &&
        res.date <= period.end &&
        isAccountEligible(res.accountId) &&
        isCategoryEligible(res.categoryId)
      ) {
        periodReserved += res.amount;
      }
    }

    // Filter eligible expenses in this period
    const eligibleExpenses = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const txDate = tx.date.slice(0, 10);
      if (txDate < period.start || txDate > period.end) return false;
      return isAccountEligible(tx.accountId) && isCategoryEligible(tx.categoryId);
    });

    const periodSpentRaw = eligibleExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const periodRemaining = capacity - periodSpentRaw - periodReserved;

    const daysRemaining = BudgetPeriodResolver.daysRemaining(todayStr, period.end);

    // Build allocation map
    const allocationsMap: Record<string, number> = {};
    for (const exp of eligibleExpenses) {
      const txDate = exp.date.slice(0, 10);
      const entries = ExpenseAllocationScheduler.schedule(
        exp.amount,
        txDate,
        exp.allocationMode || 'TODAY',
        period.end
      );
      for (const entry of entries) {
        allocationsMap[entry.date] = (allocationsMap[entry.date] || 0) + entry.amount;
      }
    }

    // Charges strictly before today
    let chargesBeforeToday = 0;
    for (const [date, amt] of Object.entries(allocationsMap)) {
      if (date < todayStr) {
        chargesBeforeToday += amt;
      }
    }

    // Pool at start of today (00:00)
    const poolAtStartOfToday = capacity - periodReserved - chargesBeforeToday;
    const isIntegerMath = Number.isInteger(capacity) && Number.isInteger(poolAtStartOfToday);
    const openingAllowance = isIntegerMath
      ? Math.trunc(poolAtStartOfToday / Math.max(1, daysRemaining))
      : poolAtStartOfToday / Math.max(1, daysRemaining);

    const todayCharges = allocationsMap[todayStr] || 0;
    const remainingAllowance = openingAllowance - todayCharges;

    // Tomorrow projection
    let tomorrowProjection: number | null = null;
    if (todayStr < period.end && daysRemaining > 1) {
      const daysFromTomorrow = daysRemaining - 1;
      const effectiveTodayCharges =
        todayCharges < openingAllowance ? openingAllowance : todayCharges;
      const chargesBeforeTomorrow = chargesBeforeToday + effectiveTodayCharges;
      const poolAtStartOfTomorrow = capacity - periodReserved - chargesBeforeTomorrow;
      const tomorrowOpening = isIntegerMath
        ? Math.trunc(poolAtStartOfTomorrow / daysFromTomorrow)
        : poolAtStartOfTomorrow / daysFromTomorrow;

      const tomorrowDate = new Date(todayStr + 'T00:00:00');
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
      const tomorrowCharges = allocationsMap[tomorrowStr] || 0;

      tomorrowProjection = tomorrowOpening - tomorrowCharges;
    }

    // Determine status
    let status: 'active' | 'overToday' | 'periodExhausted' | 'noBudget' = 'active';
    let overTodayAmount = 0;

    if (periodRemaining <= 0) {
      status = 'periodExhausted';
    } else if (remainingAllowance < 0) {
      status = 'overToday';
      overTodayAmount = Math.abs(remainingAllowance);
    }

    return {
      periodStart: period.start,
      periodEnd: period.end,
      capacity,
      periodSpentRaw,
      periodReserved,
      periodRemaining,
      daysRemaining,
      openingAllowance,
      todayCharges,
      remainingAllowance,
      tomorrowProjection,
      status,
      overTodayAmount,
    };
  }
}
