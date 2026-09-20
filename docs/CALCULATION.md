# CALCULATION.md — Dynamic Safe-to-Spend Budget Engine

Authoritative math spec. If code disagrees, this document wins and the code is wrong.

## 1. Concepts
- Budget period: the active window (weekly / monthly / salary / custom).
- Period capacity: configured budget + included income.
- Eligible spending: completed expense transactions in the period that count.
- Reservation: a planned expense that reduces safe-to-spend but has not been paid.
- Actual period remaining: capacity − eligible spending − reservations.
- Opening allowance: snapshot of the day's daily allowance at 00:00 local time.
- Remaining allowance: opening − today's allowance charges.
- Allocation: guidance-only distribution of an expense across dates.
- Rollover: engine property; keeps unused capacity in-period; reduces future
  capacity after overspend.

## 2. Period definitions
- Weekly: Monday 00:00 → next Monday 00:00, local time.
- Monthly: 1st 00:00 → 1st of next month 00:00.
- Salary cycle: payday of current month → day before next payday.
    - Payday 31 in February → last valid day (28 or 29).
- Custom: user-defined start/end, inclusive.
- All arithmetic uses local timezone and local calendar dates.

## 3. Formulas
Let:
- P = current period
- D_remaining = calendar days from today (inclusive) to end of P (inclusive)
- budgetLimit = configured budget for P
- includedIncome = income flagged to increase budget
- capacity = budgetLimit + includedIncome
- spent = Σ eligible expense amounts in P
- reserved = Σ active reservation amounts in P
- periodRemaining = capacity − spent − reserved   (may be negative)
- openingAllowance(D) = day-D snapshot at 00:00
- remainingAllowance(D) = openingAllowance(D) − today'sCharges(D)

## 4. Opening allowance
At 00:00 on day D:
- daysFromD = days from D (inclusive) to end of P (inclusive)
- remainingPool(D) = capacity − spentThrough(D−1) − reservedThrough(D−1)
  − allocationCharges(D−1 and earlier within P)
- openingAllowance(D) = remainingPool(D) / daysFromD

Rounding: compute in minor units. base = floor(A/n); remainder distributed
1 unit at a time to earliest days until remainder = 0.

Opening allowance is a snapshot. It does not change when ordinary expenses
are added later the same day.

## 5. Remaining allowance
remainingAllowance(D) = openingAllowance(D) − today'sCharges(D)

Today's charges = direct TODAY allocations on D + shares of WEEK allocations
on D + shares of MONTH allocations on D.

Ordinary expenses added during D reduce remainingAllowance(D), not openingAllowance(D).

## 6. Rollover and overspend
- Underspend: unused capacity stays in remainingPool; raises future openings.
- Overspend: negative remainingAllowance reduces future openings.
- Rollover never creates transactions, never touches accounts, never changes analytics.

## 7. Allocation modes
- TODAY   — 100% on the transaction date.
- WEEK    — equal split across transaction date → Sunday same week, clipped to P.
- MONTH   — equal split across transaction date → last day of calendar month, clipped to P.

Allocation affects guidance only. Actual accounting:
- Account debited once for full amount.
- One transaction in history.
- Full amount in analytics.
- Full amount counted once in period spending.

## 8. Allocation rounding
For amount A (minor units) across n dates:
- base = floor(A / n)
- rem = A − base·n
- Assign base+1 to the first rem dates (earliest first)
- Assign base to the remaining dates
- Invariant: Σ shares = A exactly
- Never produce fractional minor units.

## 9. Reservations
- No account balance change.
- Reduce periodRemaining → reduce future openings.
- Paid conversion: atomic; create/connect real expense; remove reservation;
  apply allocation mode; never count both.

## 10. Income
- If flagged "Include in current spending budget", increases capacity.
- Otherwise only affects account + analytics.
- Mid-period income increases remaining capacity immediately; triggers recalc.

## 11. Transfers
- Between own accounts: not spending; do not affect capacity or periodRemaining.

## 12. Historical edits
On any of:
- expense add/edit/delete/restore
- amount/date/account/category change
- allocation-mode change
- income change (with/without inclusion flag)
- reservation add/edit/delete/pay
- budget edit, period change, payday change
- eligibility change
- import

…identify earliestAffectedDate inside P, rebuild allocation schedules, daily
ledger, today's opening/remaining, tomorrow's projection, and remaining period
state.

## 13. Missed midnight
Engine reconstructs state from source data without a live midnight timer.

## 14. Tomorrow projection
tomorrowProjection = openingAllowance(D+1) from the same engine.
- Do not display on the last day of P.
- Accounts for reservations, included income, future allocations, rollover, overspend.

## 15. Display rules
- Safe-to-spend today = max(0, remainingAllowance(today)) on the dashboard.
- Internal values may be negative. Never clamp internal state.
- Budget not configured → setup prompt, not 0.00.
- Period exhausted but today not exceeded → 0.00 + "period exhausted" message.
- Today exceeded but period has money → 0.00 + "over today's target" message.
- Last day of period → no tomorrow projection.

## 16. Money representation
- Persisted: integer minor units (or Ivy's exact type).
- Never Float/Double.
- Rounding only in the allocation algorithm; source total preserved.

## 17. Determinism
Same inputs → same outputs. No dependence on UI state, recomposition, query
ordering, or thread timing.

## 18. Worked examples

1. Basic daily
   Weekly Mon→Sun, budget 700, Wednesday, no spend.
   Days remaining: 5. Opening: 700/5 = 140.00.

2. Same-day spend
   Opening 60.00, TODAY spend 23.00 → remaining 37.00.
   Opening stays 60.00 (secondary). Dashboard shows 37.00.

3. Weekly allocation
   Friday, 90.00, WEEK → Fri/Sat/Sun = 30/30/30.
   Account debited 90.00 once. One transaction. One analytics entry.

4. Week clipped by period end
   P ends Saturday. Friday, 90.00, WEEK → Fri/Sat = 45/45.

5. Monthly allocation
   28th of 31-day month, 100.00, MONTH → 28/29/30/31 = 25/25/25/25.

6. Monthly rounding
   28th of 30-day month, 100.00, MONTH → 28/29/30 = 34/33/33.

7. Reservation
   Capacity 450, spent 100, reserved 100 → distributable 250.
   Dashboard uses 250, not 350.

8. Overspend
   Opening 60, TODAY spend 75 → remaining −15 → displayed 0.00.
   Future openings reduced by 15 across remaining days.

9. Salary cycle crossing February
   Payday 31 → period 31 Jan → 27 Feb (next payday = 28 Feb). 28 days.

10. Historical edit
    Tuesday expense 20→50 on Thursday. Rebuild from Tuesday forward.
    Today's opening and remaining update accordingly.

11. Reservation becomes paid
    Reservation 100 removed; expense 100 TODAY created. Account debited 100 once.
    Period spending increases 100 once. No double count.

12. Transfer
    Move 200 A→B. Budget and analytics unchanged.

13. Included income
    Budget 700 + included income 300 → capacity 1000. Safe-to-spend recomputed.

14. Missed midnight
    Closed Sunday 22:00, opened Wednesday 09:00. Engine reconstructs
    Sun/Mon/Tue/Wed openings; today's remaining correct.

15. Last day
    Sunday of weekly budget. Show today's safe-to-spend; no tomorrow projection.

## 19. Test invariants
- Σ allocation entries == source amount (minor units, exact)
- Allocations never create account transactions
- Actual spending never multiplied by allocation count
- Deleting an expense removes its allocation
- Changing allocation mode replaces schedule atomically
- Transfers never change spending capacity
- Displayed safe-to-spend >= 0
- Internal may be negative
- Recalculation idempotent
- Deterministic for identical source data
- Historical changes propagate forward to all affected dates



## 20. Repository-specific decisions (verified 2026-09-14)

- Uncategorized transactions: INCLUDED in budget by default. Exclusion is
  opt-in via category rules only.
- Account eligibility: NOT `AccountEntity.includeInBalance`. New config field
  `includedAccountIds` in `DynamicBudgetConfigEntity`. Empty list = all accounts.
- Reservation paid late: converted expense uses the ACTUAL payment date. No
  backdating. Allocation mode is chosen at conversion time.
- Salary cycle month-end: period is always payday-of-current-month → day before
  payday-of-next-month. Feb 31 → clipped to Feb 28/29 for that cycle only.
- Do NOT extend `BudgetEntity` (per-category budget, different concept).
- Do NOT extend `PlannedPaymentRuleEntity` (periodic rules, different concept).
- Reactive updates for new code: hook `DataObserver.writeEvents: Flow<DataWriteEvent>`,
  not `LaunchedEffect(reload())`.
- New entities use `Long` minor units for money. Do not use `Double`.



## 21. Clarification — pool calculation (2026-09-14)

The daily pool at the start of day D is:

    poolAtStartOf(D) =
        capacity
        − reservationsTotal
        − sum(allocation entries with date < D)

It does NOT subtract raw transaction amounts. Raw amounts are only used for
period-level displays like "spent this month". The daily ledger works
exclusively in allocation entries.

Consequence: for a 90.00 WEEK expense on Friday (allocation 30/30/30 to
Fri/Sat/Sun):

- On Saturday's opening, only Friday's 30.00 has been deducted from the pool,
  not the full 90.00.
- This matches the user's mental model: the weekly expense "costs" 30 today,
  not 90.

`periodRemaining` (the value shown on the dashboard summary card) still uses
raw period spent:

    periodRemaining = capacity − periodSpentRaw − periodReserved

Both numbers coexist. The daily engine uses allocations; the summary card uses
raw amounts. They total to the same figure at period end because all
allocations are clipped to the period.



## 22. Ivy boundary decisions (2026-09-14)

- Money conversion: Ivy stores `Double`; the engine uses `Long` minor units.
  Conversion happens only in the mapper. Ivy's schema is not modified.

- Currency exponent is per-currency:
  3 → TND, BHD, IQD, JOD, KWD, OMR, LYD
  2 → USD, EUR, GBP, MAD, EGP, SAR, AED, and most others
  0 → JPY, KRW, VND
  Each transaction's currency comes from its `asset.code`.
  Cross-currency conversion is out of scope for v1; the mapper filters to the
  configured currency only.

- Date extraction: `Instant` → `LocalDate` uses the user's timezone. The
  ZoneId is a parameter of the mapper, never a global constant.

- `settled` field:
  settled = true  → real expense, included in the engine
  settled = false → planned/upcoming, not counted as spent

- Transaction repository:
  Ivy's `TransactionRepository` is used for reads. It is not replaced.
  The engine is called via a mapper from Ivy's `Transaction` domain objects.