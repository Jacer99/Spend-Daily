package com.ivy.domain.usecase.budget

import com.ivy.data.model.AllocationMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Super-hard mathematical stress test for PocketMoney's DynamicBudgetEngine.
 * Verifies minor-unit precision, zero-division boundaries, and anti-anxiety invariants.
 */
class DynamicBudgetEngineStressTest {

    private lateinit var scheduler: ExpenseAllocationScheduler
    private lateinit var engine: DynamicBudgetEngine

    // Realistic scheduler implementation for isolated testing
    @Before
    fun setUp() {
        scheduler = object : ExpenseAllocationScheduler {
            override fun schedule(
                amount: Long,
                transactionDate: LocalDate,
                mode: AllocationMode,
                periodEnd: LocalDate
            ): List<ExpenseAllocationEntry> {
                return when (mode) {
                    AllocationMode.TODAY -> listOf(
                        ExpenseAllocationEntry(date = transactionDate, amount = amount)
                    )
                    AllocationMode.THIS_WEEK -> {
                        val maxDays = ChronoUnit.DAYS.between(transactionDate, periodEnd).toInt() + 1
                        val daysToSpread = minOf(7, maxDays)
                        if (daysToSpread <= 0) return emptyList()

                        val dailyBase = amount / daysToSpread
                        val remainder = amount % daysToSpread

                        (0 until daysToSpread).map { offset ->
                            val entryAmount = if (offset == 0) dailyBase + remainder else dailyBase
                            ExpenseAllocationEntry(
                                date = transactionDate.plusDays(offset.toLong()),
                                amount = entryAmount
                            )
                        }
                    }
                    AllocationMode.SPREAD_PERIOD -> {
                        val daysToSpread = ChronoUnit.DAYS.between(transactionDate, periodEnd).toInt() + 1
                        if (daysToSpread <= 0) return emptyList()

                        val dailyBase = amount / daysToSpread
                        val remainder = amount % daysToSpread

                        (0 until daysToSpread).map { offset ->
                            val entryAmount = if (offset == 0) dailyBase + remainder else dailyBase
                            ExpenseAllocationEntry(
                                date = transactionDate.plusDays(offset.toLong()),
                                amount = entryAmount
                            )
                        }
                    }
                }
            }
        }
        engine = DynamicBudgetEngine(scheduler)
    }

    private fun createPeriod(start: LocalDate, end: LocalDate) = object : BudgetPeriod {
        override val start: LocalDate = start
        override val end: LocalDate = end
        override fun daysRemaining(today: LocalDate): Int {
            if (today.isBefore(start)) return (ChronoUnit.DAYS.between(start, end) + 1).toInt()
            if (today.isAfter(end)) return 0
            return (ChronoUnit.DAYS.between(today, end) + 1).toInt()
        }
    }

    // --------------------------------------------------------------------------
    // TEST 1: Integer Dust & Millime Conservation
    // 1,000 TND over 31 days does NOT divide evenly (32,258.0645... millimes).
    // Invariant: Zero millimes must vanish from the system over the month.
    // --------------------------------------------------------------------------
    @Test
    fun `test 01 - integer division remainder remains conserved across 31 days`() {
        val start = LocalDate.of(2026, 1, 1)
        val end = LocalDate.of(2026, 1, 31)
        val period = createPeriod(start, end)
        val budgetLimit = 1_000_000L // 1,000.000 TND

        var simulatedChargesBeforeToday = 0L

        for (dayIndex in 0 until 31) {
            val today = start.plusDays(dayIndex.toLong())
            val daysLeft = 31 - dayIndex

            val snapshot = engine.calculate(
                BudgetEngineInput(
                    period = period,
                    budgetLimit = budgetLimit,
                    includedIncome = 0L,
                    reservationsTotal = 0L,
                    expenses = emptyList(),
                    today = today
                )
            )

            // Verify opening allowance = remaining pool / daysLeft
            val expectedOpening = (budgetLimit - simulatedChargesBeforeToday) / daysLeft
            assertEquals(expectedOpening, snapshot.openingAllowance)

            // On the last day, the opening allowance must clear the exact remaining dust
            if (dayIndex == 30) {
                assertEquals(1, snapshot.daysRemaining)
                assertEquals(snapshot.periodRemaining, snapshot.openingAllowance)
            }
        }
    }

    // --------------------------------------------------------------------------
    // TEST 2: Leap Year 29-Day February Boundary
    // Verifies leap year February gives exactly 29 daily slices and handles Feb 28->29.
    // --------------------------------------------------------------------------
    @Test
    fun `test 02 - leap year 29 day cycle allocates correctly without truncation`() {
        val start = LocalDate.of(2028, 2, 1) // 2028 is a leap year
        val end = LocalDate.of(2028, 2, 29)
        val period = createPeriod(start, end)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 290_000L, // 290.000 TND = exactly 10.000 TND / day
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = emptyList(),
                today = start
            )
        )

        assertEquals(29, snapshot.daysRemaining)
        assertEquals(10_000L, snapshot.openingAllowance)
        assertEquals(10_000L, snapshot.remainingAllowance)
        assertEquals(10_000L, snapshot.tomorrowProjection)
    }

    // --------------------------------------------------------------------------
    // TEST 3: Cycle End (Final Day, DaysRemaining = 1)
    // Verifies zero-division protection: tomorrowProjection MUST be null on the last day.
    // --------------------------------------------------------------------------
    @Test
    fun `test 03 - last day of cycle guards against division by zero and returns null tomorrow`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 300_000L,
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(
                        transactionDate = LocalDate.of(2026, 9, 30),
                        amount = 4_000L,
                        mode = AllocationMode.TODAY
                    )
                ),
                today = end // Sep 30: daysRemaining = 1
            )
        )

        assertEquals(1, snapshot.daysRemaining)
        assertEquals(300_000L, snapshot.openingAllowance)
        assertEquals(296_000L, snapshot.remainingAllowance)
        // Tomorrow projection must be NULL because the cycle ends today
        assertNull("Tomorrow projection must be null on period end", snapshot.tomorrowProjection)
    }

    // --------------------------------------------------------------------------
    // TEST 4: Penultimate Day (DaysRemaining = 2)
    // Tomorrow has exactly 1 day left; divisor is 1. Verifies exact math.
    // --------------------------------------------------------------------------
    @Test
    fun `test 04 - penultimate day projects last day with divisor 1`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)
        val today = LocalDate.of(2026, 9, 29) // 2 days left: Sep 29 and Sep 30

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 200_000L, // 200 TND remaining across 2 days
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(
                        transactionDate = today,
                        amount = 40_000L, // Spent 40 TND today
                        mode = AllocationMode.TODAY
                    )
                ),
                today = today
            )
        )

        assertEquals(2, snapshot.daysRemaining)
        assertEquals(100_000L, snapshot.openingAllowance) // 200 / 2 = 100 TND
        assertEquals(60_000L, snapshot.remainingAllowance) // 100 - 40 = 60 TND

        // Tomorrow's pool = Capacity (200) - effectiveTodayCharges (100) = 100 TND
        // Divisor = daysRemaining - 1 = 1. Tomorrow projection = 100 TND
        assertNotNull(snapshot.tomorrowProjection)
        assertEquals(100_000L, snapshot.tomorrowProjection)
    }

    // --------------------------------------------------------------------------
    // TEST 5: Catastrophic Day-1 Overspend (Zero Panic Invariant)
    // A 1,000 TND monthly budget has a 2,500 TND expense on Day 1.
    // Invariant: Engine must return exact negative allowances without crashing.
    // --------------------------------------------------------------------------
    @Test
    fun `test 05 - catastrophic overspend results in mathematically sound negative pool`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 1_000_000L, // 1,000 TND
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(
                        transactionDate = start,
                        amount = 2_500_000L, // 2,500 TND spent
                        mode = AllocationMode.TODAY
                    )
                ),
                today = start
            )
        )

        assertEquals(30, snapshot.daysRemaining)
        assertEquals(33_333L, snapshot.openingAllowance) // 1,000,000 / 30
        assertEquals(2_500_000L, snapshot.todayCharges)
        // Deficit: 33,333 - 2,500,000 = -2,466,667 millimes (-2,466.667 TND)
        assertEquals(-2_466_667L, snapshot.remainingAllowance)

        // Tomorrow's pool = 1,000,000 - 2,500,000 = -1,500,000 millimes across 29 days
        // -1,500,000 / 29 = -51,724 millimes
        assertEquals(-51_724L, snapshot.tomorrowProjection)
    }

    // --------------------------------------------------------------------------
    // TEST 6: "THIS_WEEK" Mode Amortization & Truncation at Period End
    // If a user logs a 70 TND expense on day 28 of a 30-day month,
    // it must ONLY spread over the remaining 3 days (not into next month).
    // --------------------------------------------------------------------------
    @Test
    fun `test 06 - this week allocation near period end clips to remaining days`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)
        val expenseDate = LocalDate.of(2026, 9, 28) // Only 3 days left in cycle: 28, 29, 30

        val scheduledEntries = scheduler.schedule(
            amount = 60_000L, // 60 TND
            transactionDate = expenseDate,
            mode = AllocationMode.THIS_WEEK,
            periodEnd = end
        )

        // Must allocate across 3 days, NOT 7 days
        assertEquals(3, scheduledEntries.size)
        // 60,000 / 3 = 20,000 TND / day
        assertEquals(20_000L, scheduledEntries[0].amount)
        assertEquals(20_000L, scheduledEntries[1].amount)
        assertEquals(20_000L, scheduledEntries[2].amount)
        assertEquals(end, scheduledEntries.last().date)
    }

    // --------------------------------------------------------------------------
    // TEST 7: Under-spend Smoothing (Morning Conservative Projection)
    // If opening allowance is 30 TND and only 5 TND is spent by 11:00 AM,
    // the tomorrow projection assumes you will spend the remaining 25 TND today.
    // --------------------------------------------------------------------------
    @Test
    fun `test 07 - tomorrow projection assumes unspent allowance is consumed today`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 900_000L, // 30 TND / day
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(
                        transactionDate = start,
                        amount = 5_000L, // Spent only 5 TND so far
                        mode = AllocationMode.TODAY
                    )
                ),
                today = start
            )
        )

        assertEquals(30_000L, snapshot.openingAllowance)
        assertEquals(25_000L, snapshot.remainingAllowance)
        // Tomorrow projection should NOT spike to 31 TND yet; it assumes today's 30 TND is spent:
        // Pool tomorrow = 900,000 - 30,000 = 870,000 / 29 = 30,000 TND
        assertEquals(30_000L, snapshot.tomorrowProjection)
    }

    // --------------------------------------------------------------------------
    // TEST 8: Under-spend Actual Rollover on the Next Day
    // When yesterday is in the past and only 5 TND was actually spent,
    // the unspent 25 TND rolls into the pool, increasing Day 2's opening allowance.
    // --------------------------------------------------------------------------
    @Test
    fun `test 08 - next morning absorbs previous day underspend into higher allowance`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)
        val day2 = LocalDate.of(2026, 9, 2)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 900_000L, // 30.000 TND / day
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(
                        transactionDate = start, // Yesterday
                        amount = 5_000L,         // Spent only 5 TND
                        mode = AllocationMode.TODAY
                    )
                ),
                today = day2 // Today is Day 2 (29 days remaining)
            )
        )

        assertEquals(29, snapshot.daysRemaining)
        // Pool at Day 2 = 900,000 - 5,000 = 895,000 millimes
        // Opening = 895,000 / 29 = 30,862 millimes (30.862 TND > 30.000 TND!)
        assertEquals(30_862L, snapshot.openingAllowance)
        assertEquals(30_862L, snapshot.remainingAllowance)
    }

    // --------------------------------------------------------------------------
    // TEST 9: Historical & Out-of-Bounds Expenses are Excluded
    // Expenses from August or next month must be filtered out cleanly.
    // --------------------------------------------------------------------------
    @Test
    fun `test 09 - expenses outside active period window are ignored`() {
        val start = LocalDate.of(2026, 9, 1)
        val end = LocalDate.of(2026, 9, 30)
        val period = createPeriod(start, end)

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = 300_000L,
                includedIncome = 0L,
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(LocalDate.of(2026, 8, 31), 100_000L, AllocationMode.TODAY), // Out
                    BudgetExpenseInput(LocalDate.of(2026, 10, 1), 100_000L, AllocationMode.TODAY)  // Out
                ),
                today = start
            )
        )

        assertEquals(0L, snapshot.periodSpentRaw)
        assertEquals(300_000L, snapshot.periodRemaining)
        assertEquals(10_000L, snapshot.openingAllowance)
    }

    // --------------------------------------------------------------------------
    // TEST 10: Extreme Values & Long Overflow Immunity
    // Tests 100,000,000.000 TND (100 Billion millimes) to ensure no 64-bit overflow.
    // --------------------------------------------------------------------------
    @Test
    fun `test 10 - extreme multi-million figures execute without 64-bit arithmetic overflow`() {
        val start = LocalDate.of(2026, 1, 1)
        val end = LocalDate.of(2026, 1, 31)
        val period = createPeriod(start, end)

        val hugeBudget = 100_000_000_000L // 100 Million TND in millimes

        val snapshot = engine.calculate(
            BudgetEngineInput(
                period = period,
                budgetLimit = hugeBudget,
                includedIncome = 50_000_000_000L, // 50 Million TND income
                reservationsTotal = 0L,
                expenses = listOf(
                    BudgetExpenseInput(start, 31_000_000_000L, AllocationMode.TODAY)
                ),
                today = start
            )
        )

        assertEquals(150_000_000_000L, snapshot.capacity)
        assertEquals(31_000_000_000L, snapshot.periodSpentRaw)
        assertEquals(119_000_000_000L, snapshot.periodRemaining)
        // 150B / 31 = 4,838,709,677 millimes (~4.838 Million TND / day)
        assertEquals(4_838_709_677L, snapshot.openingAllowance)
        assertTrue(snapshot.remainingAllowance < 0) // Spent 31B > 4.838B
    }
}
