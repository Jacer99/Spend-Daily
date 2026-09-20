import { AllocationMode } from '../types';

export interface AllocationEntry {
  date: string; // YYYY-MM-DD
  amount: number;
}

export class ExpenseAllocationScheduler {
  /**
   * Schedules an expense over dates based on the AllocationMode.
   * Invariant: Sum of entry amounts equals original amount exactly.
   */
  static schedule(
    amount: number,
    transactionDateStr: string,
    mode: AllocationMode,
    periodEndStr: string
  ): AllocationEntry[] {
    if (amount <= 0) return [];

    const txDate = new Date(transactionDateStr + 'T00:00:00');
    const periodEnd = new Date(periodEndStr + 'T00:00:00');

    if (periodEnd < txDate) {
      // If beyond period end, assign all to transaction date
      return [{ date: transactionDateStr, amount }];
    }

    if (mode === 'TODAY') {
      return [{ date: transactionDateStr, amount }];
    }

    // Determine calendar end
    let calendarEnd: Date;
    if (mode === 'THIS_WEEK') {
      // Up to 7 consecutive days starting from txDate
      const maxEnd = new Date(txDate);
      maxEnd.setDate(txDate.getDate() + 6);
      calendarEnd = maxEnd;
    } else if (mode === 'WEEK') {
      // Next or same Sunday (0 is Sunday in JS, Monday is 1)
      const day = txDate.getDay();
      const daysUntilSunday = (7 - day) % 7;
      calendarEnd = new Date(txDate);
      calendarEnd.setDate(txDate.getDate() + daysUntilSunday);
    } else if (mode === 'SPREAD_PERIOD') {
      calendarEnd = new Date(periodEnd);
    } else if (mode === 'MONTH') {
      // Last day of calendar month
      const year = txDate.getFullYear();
      const month = txDate.getMonth();
      calendarEnd = new Date(year, month + 1, 0); // day 0 of next month is last day of current
    } else {
      calendarEnd = new Date(txDate);
    }

    const effectiveEnd = calendarEnd < periodEnd ? calendarEnd : periodEnd;

    const dates: string[] = [];
    const curr = new Date(txDate);
    while (curr <= effectiveEnd) {
      dates.push(curr.toISOString().slice(0, 10));
      curr.setDate(curr.getDate() + 1);
    }

    const n = dates.length;
    if (n === 0) {
      return [{ date: transactionDateStr, amount }];
    }

    // Compute in minor units (cents / millimes) to avoid fractional floating precision issues
    // Multiply by 1000 to safely support 2 or 3 decimal places (e.g. TND or USD)
    const multiplier = 1000;
    const amountMinor = Math.round(amount * multiplier);
    const baseMinor = Math.floor(amountMinor / n);
    const remainder = amountMinor % n;

    const entries: AllocationEntry[] = [];
    for (let i = 0; i < n; i++) {
      let currentMinor = baseMinor;
      if (i < remainder) {
        currentMinor += 1;
      }
      if (currentMinor > 0) {
        entries.push({
          date: dates[i],
          amount: currentMinor / multiplier,
        });
      }
    }

    return entries;
  }
}
