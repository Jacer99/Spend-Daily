package com.spenddaily.app.domain.engine

import com.spenddaily.app.domain.model.CycleType
import com.spenddaily.app.domain.model.DailyAllowanceCalculation
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.time.temporal.TemporalAdjusters
import kotlin.math.max

object AmortizationEngine {

    private val dateFormatter = DateTimeFormatter.ofPattern("MMM dd")

    /**
     * Calculates the safe-to-spend daily allowance, cycle metrics, and tomorrow's projection.
     *
     * @param totalCycleBudget Total allocated budget for the cycle.
     * @param expensesInCycle Total expenses accrued so far in this cycle (excluding today's expenses).
     * @param spentToday Total expenses accrued strictly today.
     * @param cycleType MONTHLY (salary cycle) or WEEKLY (calendar week).
     * @param salaryCycleDay User-defined day of the month when salary arrives / cycle ends (e.g. 1st or 25th).
     * @param today Reference date (defaults to LocalDate.now()).
     */
    fun calculateDailyAllowance(
        totalCycleBudget: Double,
        expensesInCycle: Double,
        spentToday: Double,
        cycleType: CycleType,
        salaryCycleDay: Int = 1,
        today: LocalDate = LocalDate.now()
    ): DailyAllowanceCalculation {
        if (totalCycleBudget <= 0.0) {
            return DailyAllowanceCalculation(
                safeToSpendToday = 0.0,
                remainingBudget = 0.0,
                totalBudget = 0.0,
                remainingDaysInCycle = 1,
                totalDaysInCycle = 1,
                tomorrowProjection = 0.0,
                spentToday = spentToday,
                cycleType = cycleType,
                isOverspent = false,
                cycleEndDateFormatted = today.format(dateFormatter)
            )
        }

        val (cycleStartDate, cycleEndDate, remainingDays, totalDays) = when (cycleType) {
            CycleType.WEEKLY -> calculateWeeklyCycleWindow(today)
            CycleType.MONTHLY -> calculateMonthlyCycleWindow(today, salaryCycleDay)
        }

        // Remaining budget before today's spending
        val budgetAvailableAtStartOfDay = totalCycleBudget - expensesInCycle
        val netRemainingBudget = budgetAvailableAtStartOfDay - spentToday

        // Safe-to-Spend formula: Daily Allowance = Remaining Budget / Remaining Days in Cycle
        val rawDailyAllowance = if (remainingDays > 0) {
            budgetAvailableAtStartOfDay / remainingDays
        } else {
            budgetAvailableAtStartOfDay
        }

        // Overspend check: calm state without negative crashing
        val isOverspent = rawDailyAllowance <= 0.0 || netRemainingBudget <= 0.0
        val safeToSpendToday = if (isOverspent) 0.0 else max(0.0, rawDailyAllowance - spentToday)

        // Tomorrow's projection:
        // If user finishes today without spending more, tomorrow will receive:
        // (netRemainingBudget) / (remainingDays - 1)
        val remainingDaysTomorrow = remainingDays - 1
        val tomorrowProjection = if (remainingDaysTomorrow > 0 && netRemainingBudget > 0.0) {
            max(0.0, netRemainingBudget / remainingDaysTomorrow)
        } else if (remainingDaysTomorrow <= 0 && netRemainingBudget > 0.0) {
            netRemainingBudget
        } else {
            0.0
        }

        return DailyAllowanceCalculation(
            safeToSpendToday = safeToSpendToday,
            remainingBudget = max(0.0, netRemainingBudget),
            totalBudget = totalCycleBudget,
            remainingDaysInCycle = remainingDays,
            totalDaysInCycle = totalDays,
            tomorrowProjection = tomorrowProjection,
            spentToday = spentToday,
            cycleType = cycleType,
            isOverspent = isOverspent,
            cycleEndDateFormatted = cycleEndDate.format(dateFormatter)
        )
    }

    /**
     * Weekly cycle: Strict calendar week starting Monday 00:00:00 and ending Sunday 23:59:59.
     * Remaining days strictly counted until Sunday inclusive. Resets every Monday.
     */
    private fun calculateWeeklyCycleWindow(today: LocalDate): CycleWindow {
        val monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
        // Days remaining includes today up to and including Sunday
        val remainingDays = (ChronoUnit.DAYS.between(today, sunday) + 1).toInt()
        val totalDays = 7

        return CycleWindow(
            startDate = monday,
            endDate = sunday,
            remainingDays = remainingDays,
            totalDays = totalDays
        )
    }

    /**
     * Monthly / Salary cycle: Amortizes over remaining days until user-defined payday.
     * e.g., if salary arrives on the 25th, the cycle runs from the 25th of last month to the 24th of this month.
     */
    private fun calculateMonthlyCycleWindow(today: LocalDate, salaryDay: Int): CycleWindow {
        val currentDay = today.dayOfMonth
        val clampedSalaryDay = salaryDay.coerceIn(1, 28)

        val (startDate, endDate) = if (currentDay >= clampedSalaryDay) {
            val start = today.withDayOfMonth(clampedSalaryDay)
            val nextMonth = today.plusMonths(1)
            val maxDayNextMonth = YearMonth.from(nextMonth).lengthOfMonth()
            val end = nextMonth.withDayOfMonth(clampedSalaryDay.coerceAtMost(maxDayNextMonth)).minusDays(1)
            Pair(start, end)
        } else {
            val prevMonth = today.minusMonths(1)
            val maxDayPrevMonth = YearMonth.from(prevMonth).lengthOfMonth()
            val start = prevMonth.withDayOfMonth(clampedSalaryDay.coerceAtMost(maxDayPrevMonth))
            val end = today.withDayOfMonth(clampedSalaryDay).minusDays(1)
            Pair(start, end)
        }

        val totalDays = (ChronoUnit.DAYS.between(startDate, endDate) + 1).toInt()
        val remainingDays = (ChronoUnit.DAYS.between(today, endDate) + 1).toInt().coerceAtLeast(1)

        return CycleWindow(
            startDate = startDate,
            endDate = endDate,
            remainingDays = remainingDays,
            totalDays = totalDays
        )
    }

    private data class CycleWindow(
        val startDate: LocalDate,
        val endDate: LocalDate,
        val remainingDays: Int,
        val totalDays: Int
    )
}
