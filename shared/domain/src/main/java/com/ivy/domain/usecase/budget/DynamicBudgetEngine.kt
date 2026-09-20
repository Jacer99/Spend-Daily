package com.ivy.domain.usecase.budget

import com.ivy.data.model.AllocationMode
import java.time.LocalDate

data class ExpenseAllocationEntry(
    val date: LocalDate,
    val amount: Long
)

interface ExpenseAllocationScheduler {
    fun schedule(
        amount: Long,
        transactionDate: LocalDate,
        mode: AllocationMode,
        periodEnd: LocalDate
    ): List<ExpenseAllocationEntry>
}

interface BudgetPeriod {
    val start: LocalDate
    val end: LocalDate
    fun daysRemaining(today: LocalDate): Int
}

data class BudgetExpenseInput(
    val transactionDate: LocalDate,
    val amount: Long,
    val mode: AllocationMode = AllocationMode.TODAY
)

data class BudgetEngineInput(
    val period: BudgetPeriod,
    val budgetLimit: Long,
    val includedIncome: Long = 0L,
    val reservationsTotal: Long = 0L,
    val expenses: List<BudgetExpenseInput> = emptyList(),
    val today: LocalDate
)

data class BudgetSnapshot(
    val capacity: Long,
    val periodSpentRaw: Long,
    val periodRemaining: Long,
    val daysRemaining: Int,
    val openingAllowance: Long,
    val todayCharges: Long,
    val remainingAllowance: Long,
    val tomorrowProjection: Long?
)

class DynamicBudgetEngine(
    private val scheduler: ExpenseAllocationScheduler
) {
    fun calculate(input: BudgetEngineInput): BudgetSnapshot {
        val period = input.period
        val today = input.today

        val daysRemaining = period.daysRemaining(today)
        val capacity = input.budgetLimit + input.includedIncome

        // Filter eligible expenses strictly within [period.start, period.end]
        val eligibleExpenses = input.expenses.filter { exp ->
            !exp.transactionDate.isBefore(period.start) && !exp.transactionDate.isAfter(period.end)
        }

        val periodSpentRaw = eligibleExpenses.sumOf { it.amount }
        val periodRemaining = capacity - periodSpentRaw - input.reservationsTotal

        // Build allocation map
        val allocationsMap = mutableMapOf<LocalDate, Long>()
        for (exp in eligibleExpenses) {
            val entries = scheduler.schedule(
                amount = exp.amount,
                transactionDate = exp.transactionDate,
                mode = exp.mode,
                periodEnd = period.end
            )
            for (entry in entries) {
                allocationsMap[entry.date] = (allocationsMap[entry.date] ?: 0L) + entry.amount
            }
        }

        // Charges strictly before today
        var chargesBeforeToday = 0L
        for ((date, amt) in allocationsMap) {
            if (date.isBefore(today)) {
                chargesBeforeToday += amt
            }
        }

        // Pool at start of today (00:00)
        val poolAtStartOfToday = capacity - input.reservationsTotal - chargesBeforeToday
        val openingAllowance = poolAtStartOfToday / maxOf(1, daysRemaining)

        val todayCharges = allocationsMap[today] ?: 0L
        val remainingAllowance = openingAllowance - todayCharges

        // Tomorrow projection: only when daysRemaining > 1 and today is before period.end
        val tomorrowProjection: Long? = if (daysRemaining > 1 && !today.isEqual(period.end)) {
            val daysFromTomorrow = daysRemaining - 1
            val effectiveTodayCharges = if (todayCharges < openingAllowance) openingAllowance else todayCharges
            val chargesBeforeTomorrow = chargesBeforeToday + effectiveTodayCharges
            val poolAtStartOfTomorrow = capacity - input.reservationsTotal - chargesBeforeTomorrow
            val tomorrowOpening = poolAtStartOfTomorrow / daysFromTomorrow

            val tomorrow = today.plusDays(1)
            val tomorrowCharges = allocationsMap[tomorrow] ?: 0L
            tomorrowOpening - tomorrowCharges
        } else {
            null
        }

        return BudgetSnapshot(
            capacity = capacity,
            periodSpentRaw = periodSpentRaw,
            periodRemaining = periodRemaining,
            daysRemaining = daysRemaining,
            openingAllowance = openingAllowance,
            todayCharges = todayCharges,
            remainingAllowance = remainingAllowance,
            tomorrowProjection = tomorrowProjection
        )
    }
}
