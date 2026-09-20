import { BudgetPeriod, BudgetPeriodType } from '../types';

export class BudgetPeriodResolver {
  /**
   * Resolves the active start and end date for a given period type and reference date.
   */
  static resolve(
    type: BudgetPeriodType,
    todayStr: string,
    options?: { payday?: number; customStart?: string; customEnd?: string }
  ): BudgetPeriod {
    const today = new Date(todayStr + 'T00:00:00');

    if (type === 'weekly') {
      // Monday of current week to Sunday
      const day = today.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
        type: 'weekly',
      };
    }

    if (type === 'monthly') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      return {
        start: firstDay.toISOString().slice(0, 10),
        end: lastDay.toISOString().slice(0, 10),
        type: 'monthly',
      };
    }

    if (type === 'salary') {
      const payday = Math.max(1, Math.min(31, options?.payday ?? 1));
      const year = today.getFullYear();
      const month = today.getMonth();

      // Last day of current month
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
      const targetDayCurrent = Math.min(payday, daysInCurrentMonth);
      const effectivePaydayCurrent = new Date(year, month, targetDayCurrent);

      if (today >= effectivePaydayCurrent) {
        // Current cycle started this month on payday
        const start = effectivePaydayCurrent;
        // Next payday is next month
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonth = (month + 1) % 12;
        const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
        const targetDayNext = Math.min(payday, daysInNextMonth);
        const nextEffectivePayday = new Date(nextMonthYear, nextMonth, targetDayNext);
        const end = new Date(nextEffectivePayday);
        end.setDate(end.getDate() - 1);

        return {
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
          type: 'salary',
          payday,
        };
      } else {
        // Current cycle started last month
        const end = new Date(effectivePaydayCurrent);
        end.setDate(end.getDate() - 1);

        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
        const targetDayPrev = Math.min(payday, daysInPrevMonth);
        const start = new Date(prevMonthYear, prevMonth, targetDayPrev);

        return {
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
          type: 'salary',
          payday,
        };
      }
    }

    if (type === 'custom') {
      const start = options?.customStart || todayStr;
      const end = options?.customEnd || todayStr;
      return {
        start: start <= end ? start : end,
        end: start <= end ? end : start,
        type: 'custom',
      };
    }

    return {
      start: todayStr,
      end: todayStr,
      type: 'monthly',
    };
  }

  /**
   * Calendar days from today (inclusive) to period end (inclusive).
   */
  static daysRemaining(todayStr: string, periodEndStr: string): number {
    const today = new Date(todayStr + 'T00:00:00');
    const end = new Date(periodEndStr + 'T00:00:00');
    if (today > end) return 0;
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  }
}
