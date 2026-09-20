# MASTER PRODUCT + ENGINEERING SPECIFICATION
## Ivy Wallet — Dynamic Safe-to-Spend Budgeting

You are an expert Android product engineer, Kotlin architect, Jetpack Compose developer, financial-domain engineer, database architect, UX designer, and test engineer.

You are helping me create a personal finance application by forking and extending the open-source Ivy Wallet Android application.

The goal is NOT to create a new finance app from scratch.

The goal is:

> **Ivy Wallet with a dynamic "safe to spend today" brain.**

The application should preserve Ivy Wallet's strengths while adding one major capability:

> When I open the app, it should immediately tell me how much money I can safely spend for the rest of today without breaking my configured budget.

Example:

> **57.40 TND**
>
> Safe to spend today

This number must be trustworthy.

It must be calculated from the actual state of the user's budget, transactions, reservations, income, dates, rollover, and remaining time in the active budget period.

The user should never need to manually perform budgeting calculations every morning.

---

# 0. VERY IMPORTANT: DO NOT BUILD YET

For the first phase, **do not modify the repository and do not start implementation**.

Do not write production code.

Do not create migrations.

Do not create new screens.

Do not modify existing screens.

Do not change the database.

Do not add dependencies.

Do not refactor Ivy.

Do not begin implementation until I explicitly tell you to start building.

The first response after receiving this specification must be an analysis of the existing repository and a proposed implementation plan.

The analysis must be based on the actual repository.

Do not invent classes, modules, package names, database entities, APIs, navigation routes, ViewModels, repositories, or architectural patterns.

---

# 1. WHAT YOU MUST DO FIRST

Before changing anything:

1. Inspect the complete repository structure.

2. Identify:

    - Android application modules
    - Feature modules
    - Core modules
    - Dashboard/Home implementation
    - Transaction implementation
    - Expense entry
    - Income entry
    - Account system
    - Category system
    - Existing budgets
    - Recurring transactions
    - Planned payments
    - Database entities
    - DAOs
    - Room database
    - Room migrations
    - DataStore usage
    - Repositories
    - Use cases
    - Domain models
    - ViewModels
    - ViewState models
    - Kotlin Flow streams
    - Dependency injection
    - Navigation
    - Compose components
    - Design system
    - Theme
    - Typography
    - Color system
    - Icons
    - Bottom sheets
    - Dialogs
    - Animations
    - Localization
    - Accessibility
    - Existing tests
    - Import/export
    - Backup/restore
    - Crash reporting
    - Logging

3. Read the existing Ivy architecture documentation.

4. Identify where financial calculations currently live.

5. Identify how Ivy calculates:

    - account balances
    - income
    - expenses
    - transfers
    - categories
    - analytics
    - existing budget values

6. Identify existing components that can be reused.

7. Identify existing components that should NOT be duplicated.

8. Identify all relevant database changes that would eventually be required.

9. Explain the current architecture before proposing changes.

10. Produce a file-by-file implementation plan.

11. Identify risks and architectural conflicts.

12. Identify which requirements are already supported by Ivy.

13. Identify which requirements require new functionality.

14. Do not silently adapt the specification because something is inconvenient to implement.

If the repository differs from this specification, adapt implementation details to the actual repository while preserving the intended product behavior.

---

# 2. CORE PRODUCT IDEA

This product exists to answer one question:

> **How much can I safely spend today?**

Not:

- How much did I spend this month?
- How much is in my bank account?
- How much did I spend this week?
- How much do I have in total?

Those remain available through Ivy Wallet.

But the **primary dashboard question is today's safe spending capacity**.

The main number should therefore be the most important number on the screen.

Example:

> **57.40 TND**
>
> Safe to spend today

The user should immediately understand that this means:

> Based on my configured budget, actual spending, reservations, included income, today's spending, remaining days, and current allocation rules, I can spend approximately 57.40 TND more today while remaining within my budget.

---

# 3. PRODUCT PHILOSOPHY

The app should feel:

- calm
- simple
- trustworthy
- lightweight
- predictable
- financially conservative
- fast
- local-first
- privacy-respecting

The application should quietly do the mathematics in the background.

The user should not have to understand the budgeting engine.

The user should see one clear answer.

The complexity belongs inside the calculation engine, not on the dashboard.

---

# 4. IVY WALLET MUST REMAIN THE FOUNDATION

This is an extension of Ivy Wallet.

It is NOT:

- a redesign of Ivy Wallet
- a replacement for Ivy Wallet
- a second transaction tracker
- a second account system
- a second category system
- a separate analytics system

Preserve Ivy Wallet wherever possible.

Preserve:

- accounts
- balances
- expenses
- income
- categories
- transaction history
- analytics
- import
- export
- backup mechanisms
- navigation
- transaction entry
- account selection
- category selection
- date selection
- dark mode
- light mode
- localization
- accessibility
- animations
- existing UI conventions

Reuse existing implementations whenever technically appropriate.

Do not recreate existing Ivy Wallet functionality simply because it is easier than understanding the existing code.

---

# 5. DESIGN INSPIRATION

Spendaily is a conceptual reference for the budgeting experience.

Use it only as inspiration for principles such as:

- one prominent safe-to-spend number
- automatic daily adjustment
- rollover
- payday-oriented budgeting
- simple daily spending guidance
- calm presentation
- quick expense recording

Do NOT copy:

- its branding
- its logo
- its icons
- its colors
- its typography
- its exact wording
- its layouts
- its navigation
- its screens
- its illustrations
- its animations
- its visual identity
- its proprietary implementation

The resulting product must be an original Ivy Wallet evolution.

The desired design principle is:

> **Ivy Wallet's visual identity + Spendaily-like daily budgeting clarity.**

Spendaily currently describes the same general philosophy of showing one clear amount that can safely be spent today and adjusting it as spending changes, including payday-to-payday budgeting and overspending/rollover behavior.

---

# 6. DASHBOARD PRIORITY

The dashboard hierarchy must be:

1. Safe to spend today
2. Add Expense
3. Add Income
4. Current budget-period progress
5. Tomorrow's projected allowance
6. Recent transactions
7. Existing Ivy Wallet information

The safe-to-spend number and quick actions must be visible without scrolling on a normal phone.

Do not bury the daily number inside a card several screens down.

Do not prioritize charts over it.

Do not make the user navigate to a dedicated budget page just to discover today's amount.

---

# 7. PRIMARY DASHBOARD EXPERIENCE

The primary dashboard area should communicate something similar to:

> SAFE TO SPEND TODAY
>
> **57.40 TND**
>
> Available for the rest of today

Secondary information may include:

- Opening allowance: 80.40 TND
- Charged to today: 23.00 TND
- Tomorrow: approximately 62.00 TND
- Budget: 450.00 TND
- Spent: 163.00 TND
- Reserved: 100.00 TND
- Available: 187.00 TND
- Days remaining: 5

However, today's remaining amount must always have the greatest visual hierarchy.

---

# 8. OPENING ALLOWANCE VS REMAINING ALLOWANCE

The application must distinguish between:

## A. Opening allowance

How much the user could safely spend at the beginning of the day.

Example:

> Opening allowance: 60.00 TND

## B. Remaining allowance

How much the user can still safely spend right now.

Example:

> Spent today: 23.00 TND
>
> Remaining today: 37.00 TND

The dashboard's large number must be:

> **37.00 TND**

not 60.00 TND.

The opening allowance is historical/reference information.

The remaining allowance is the primary actionable value.

---

# 9. BUDGET PERIODS

The budgeting engine must support:

## Weekly

- Monday → Sunday
- Weeks always start Monday
- Local timezone
- Calendar-day based

Display:

> Left this week

## Monthly

- First calendar day → last calendar day
- Correct handling of 28/29/30/31-day months
- Correct leap years

Display:

> Left this month

## Salary / payday cycle

User chooses a payday.

The period is:

> current payday → day before next payday

Example:

Payday = 25

Period:

25 August → 24 September

If the selected payday does not exist in a month:

Use the final valid day of that month.

Example:

Payday 31

February → use February 28/29.

Display:

> Left until payday

## Custom

User chooses:

- start date
- end date

Both dates are inclusive.

Display:

> Left in this period

All calculations must use the user's local timezone and local calendar date.

---

# 10. BUDGET CONFIGURATION

The user should configure:

- budget amount
- currency
- period type
- period boundaries/rules
- payday if applicable
- included income behavior
- eligible categories
- eligible accounts if supported by Ivy's architecture
- transfer treatment
- reservations
- rollover behavior

Defaults:

- Ivy's existing currency
- weekly starts Monday
- transfers excluded from spending
- income excluded from spending pool unless explicitly enabled
- deleted transactions excluded
- excluded categories excluded
- unused money remains within the active period
- new expenses default to "Today"

---

# 11. MOST IMPORTANT FINANCIAL RULE

Separate:

## Actual financial accounting

from:

## Daily allowance attribution

A transaction must never be counted twice.

For example:

A 90 TND transaction entered on Friday with:

> Apply to allowance → This week

must:

- immediately reduce the selected account by 90 TND
- appear as ONE transaction
- appear as 90 TND in transaction history
- appear as 90 TND in analytics
- count as 90 TND of actual period spending

But for daily guidance it should generate:

- Friday allocation
- Saturday allocation
- Sunday allocation

whose sum is exactly 90 TND.

The allocation schedule is **budget-guidance metadata**, not separate financial transactions.

Never create fake transactions for the allocation shares.

Never debit the account three times.

Never add the allocation shares to actual period spending again.

---

# 12. CANONICAL BUDGET ENGINE

There must be exactly one authoritative budget-calculation engine.

All screens must use it.

Do NOT duplicate the financial formulas inside:

- Compose
- ViewModels
- Activities
- Fragments
- repositories
- dashboard helpers
- widgets

The engine must be pure/domain-level logic as much as Ivy's architecture allows.

Conceptually:

DynamicBudgetEngine

responsibilities:

- resolve current period
- calculate period capacity
- calculate actual spending
- calculate reservations
- generate daily allocation
- calculate opening allowance
- calculate remaining allowance
- calculate rollover
- calculate overspending
- calculate tomorrow projection
- create calculation explanation
- produce period summary
- preserve negative internal values
- apply eligibility rules

---

# 13. MONEY REPRESENTATION

Never use Float or Double for persisted financial calculations.

Use Ivy's existing safe monetary representation if it is suitable.

Otherwise use integer minor units or another exact decimal representation.

For TND, correctly account for the Tunisian dinar's smallest supported unit.

Do not globally change Ivy's existing formatting merely to accommodate this feature.

Centralize money calculations and rounding.

Never silently create or destroy monetary value through rounding.

---

# 14. ACTUAL PERIOD CAPACITY

Define:

budgetLimit

=

configured budget for the active period

includedIncome

=

income transactions explicitly configured to increase available spending capacity

periodCapacity

=

budgetLimit + includedIncome

Then:

actualEligibleSpending

=

sum of eligible completed expense transactions in the active period

reservedSpending

=

sum of active planned/reserved expenses

actualPeriodRemaining

=

periodCapacity
- actualEligibleSpending
- reservedSpending

This value may be negative internally.

Never erase overspending information through clamping.

The UI safe-to-spend value may be clamped to zero.

The underlying domain model must retain negative values.

---

# 15. WHAT COUNTS AS ELIGIBLE SPENDING

Respect Ivy's transaction semantics.

By default:

Included:

- eligible expense transactions

Excluded:

- transfers between own accounts
- deleted transactions
- excluded categories
- excluded accounts
- transactions outside the active period
- anything Ivy explicitly treats as non-spending

Refunds and reversed expenses must follow Ivy's actual transaction semantics.

Do not invent a separate accounting definition without first inspecting Ivy.

---

# 16. DAILY ALLOWANCE MODEL

This is the most important mathematical section.

The daily engine must work using a deterministic daily ledger.

For each day:

- opening allowance
- daily allocation charges
- remaining allowance
- closing result
- carryover/deficit

The fundamental concept is:

> The user has a remaining discretionary pool that must survive until the end of the current budget period.

The pool is divided across the number of remaining calendar days.

At the beginning of each day:

> opening allowance = remaining distributable capacity / remaining eligible calendar days

where:

- remaining distributable capacity accounts for actual completed spending before the opening snapshot
- active reservations are already excluded from discretionary capacity
- included income is included where configured
- previous-day rollover is naturally reflected
- previous overspending is naturally reflected

---

# 17. SAME-DAY SPENDING

Once today's opening allowance has been established:

> remaining today = opening allowance - today's allowance charges

Today's allowance charges come from the allocation schedule.

Example:

Opening allowance:

60 TND

User spends:

23 TND

Remaining:

37 TND

The dashboard must show:

> **37 TND**

Do not reset the opening allowance to 37.

Do not treat 37 as a new opening allowance.

---

# 18. SAME-DAY ORDINARY TRANSACTION RULE

Adding a normal same-day expense must NOT arbitrarily rewrite the day's opening snapshot.

Example:

At 08:00:

Opening allowance = 60

At 12:00:

Expense = 20

Result:

Opening = 60

Remaining = 40

At 15:00:

Expense = 10

Result:

Opening = 60

Remaining = 30

The opening value remains the day's reference point.

The current remaining value changes.

---

# 19. STRUCTURAL CHANGES

Structural changes may invalidate the daily opening calculation.

Examples:

- budget amount changes
- budget period changes
- payday changes
- period boundaries change
- income inclusion changes
- eligibility filters change
- account eligibility changes
- category eligibility changes
- a historical transaction changes
- reservation configuration changes materially
- timezone changes
- transaction date changes into/out of the active period

These changes must trigger deterministic recalculation.

Do not preserve an outdated opening snapshot when doing so would make the resulting budget mathematically incorrect.

---

# 20. MIDDAY INCOME

If an income transaction is configured to increase the spending pool and is entered during the current period:

- update the actual account immediately
- update transaction history
- update analytics
- update budget capacity
- recalculate the affected daily state

Do not silently ignore newly included income.

Do not rewrite historical transaction records.

---

# 21. RESERVATIONS / PLANNED EXPENSES

A planned expense is NOT a completed transaction.

A planned expense:

- does not debit an account
- does not appear as completed spending
- does not appear as a normal completed transaction
- does reduce safe-to-spend capacity
- appears as reserved money

Example:

Budget:

450 TND

Actual spending:

100 TND

Remaining:

350 TND

Reservation:

100 TND

Ordinary discretionary amount:

250 TND

The dashboard should make this understandable.

---

# 22. RESERVATION CONVERSION

When a planned expense becomes paid:

1. consume/remove the reservation
2. create or connect the actual Ivy transaction
3. debit the account
4. record the transaction normally
5. apply its allowance-allocation mode
6. ensure reservation and transaction are not both counted
7. update dashboard immediately

This transition must be atomic wherever possible.

---

# 23. EXPENSE "APPLY TO ALLOWANCE"

Add one new field to Ivy's existing expense-entry flow:

> Apply to allowance

Options:

1. Today
2. This week
3. This month

This does NOT alter transaction accounting.

It only controls how the expense affects daily guidance.

---

# 24. TODAY MODE

If:

> Apply to allowance = Today

The full amount is assigned to the transaction's calendar date.

Example:

90 TND

→ Friday: 90 TND

---

# 25. THIS WEEK MODE

If:

> Apply to allowance = This week

Divide the transaction equally across:

> transaction date → Sunday

including the transaction date.

Example:

Friday 90 TND

Remaining dates:

Friday
Saturday
Sunday

Therefore:

30
30
30

The three shares must total exactly 90.

If the active budget period ends before Sunday, stop at the budget-period boundary.

Never allocate outside the active budget period.

---

# 26. THIS MONTH MODE

If:

> Apply to allowance = This month

Divide the expense equally across:

> transaction date → final calendar day of the month

including the transaction date.

For example, a transaction on the 28th in a 31-day month creates four allocation dates:

28
29
30
31

The shares must total exactly the source amount.

If the budget period ends earlier, stop at the budget-period end.

---

# 27. ALLOCATION ROUNDING

All allocation must occur in the smallest supported currency unit.

Algorithm:

1. Convert transaction amount to integer minor units.
2. Determine number of allocation dates.
3. Calculate base share.
4. Calculate remainder.
5. Assign base share to each date.
6. Distribute remaining minor units deterministically.
7. Start with the earliest date.
8. Continue until remainder = zero.
9. Verify sum(allocation shares) == original transaction amount.

Example:

100 units / 3 dates

→ 34
→ 33
→ 33

not:

33.3333
33.3333
33.3334

unless Ivy's exact currency representation explicitly supports this and the sum remains exact.

---

# 28. ALLOCATION DATA MODEL

Do not create fake transactions.

Use a dedicated allocation/schedule concept.

Conceptually:

ExpenseTransaction
↓
AllowanceAllocationSchedule
↓
AllocationEntry(date, amount)

The schedule is derived from the source transaction.

When the source expense is:

- edited
- deleted
- restored
- date-changed
- amount-changed
- allocation-mode-changed

the schedule must be replaced/rebuilt atomically.

The source transaction remains the financial source of truth.

---

# 29. NO DOUBLE COUNTING

This is a hard requirement.

For a 90 TND weekly expense:

Actual accounting:

90 TND total expense.

Daily guidance:

30 + 30 + 30 = 90.

Do NOT calculate:

Period spending = 90

AND then:

Period spending += 30 + 30 + 30

That would become:

180

which is wrong.

Maintain separate concepts:

1. Actual financial spending
2. Daily attribution of that spending

They interact in the daily engine but are not the same ledger.

---

# 30. ROLLOVER BEHAVIOR

Unused daily capacity must not disappear.

Example:

Opening allowance:

60

Actual allowance charges:

40

Unused amount:

20

That 20 remains inside the current budget period.

It becomes available to future days.

Similarly, overspending must not disappear.

Example:

Opening allowance:

60

Charges:

75

Overspend:

15

The 15 reduces the future available discretionary pool.

Future daily allowances therefore decrease.

The app must never manufacture money to conceal an overspend.

---

# 31. IMPORTANT ROLLOVER PRINCIPLE

Do not implement rollover as a fake deposit or fake transaction.

Rollover is a property of the budgeting engine.

It must not change:

- account balance
- transaction history
- transaction analytics
- bank/account totals

It changes only:

> future spending guidance

---

# 32. TOMORROW PROJECTION

Display:

> Tomorrow: approximately 62.00 TND

This is secondary information.

Tomorrow's projection must use the same canonical budget engine.

Do NOT create a simplified "tomorrow formula".

It must account for:

- current spending
- today's allocation
- future allocation schedules
- reservations
- included income
- actual period spending
- rollover
- overspending
- remaining period
- budget boundaries

If today is the final day of the active budget period:

Do not display a tomorrow projection.

---

# 33. HISTORICAL EDITS

Historical transactions are extremely important.

If a user changes an expense from last week, today's number may change.

Therefore:

When a historical transaction is:

- added
- edited
- deleted
- restored
- imported
- moved to another date
- moved between accounts
- moved between categories
- changed in amount
- changed in allocation mode

the engine must identify the earliest affected date and recalculate forward.

Conceptually:

earliestAffectedDate
→ all affected allocation schedules
→ daily ledger
→ today's result
→ tomorrow projection
→ remaining period state

Do not patch today's number independently while leaving historical derived states inconsistent.

---

# 34. MISSED MIDNIGHT

The application may be closed during midnight.

It must not depend on a timer firing exactly at 00:00.

Example:

User closes app Sunday at 22:00.

Opens app Wednesday at 09:00.

The system must correctly determine:

- Sunday result
- Monday
- Tuesday
- Wednesday opening allowance

without requiring the application to have been running continuously.

Date transitions must therefore be derived from persisted/source data and local dates rather than relying exclusively on a live midnight callback.

---

# 35. DAILY LEDGER

Introduce a domain concept representing daily budget calculation state.

It may be persisted or derived depending on what the repository architecture supports.

Conceptually:

DailyBudgetState:

- date
- active budget period
- opening allowance
- direct allocation charges
- weekly allocation charges
- monthly allocation charges
- reservation impact
- included-income adjustment
- remaining allowance
- underspend
- overspend
- closing result
- calculation version

Persist snapshots only if necessary for:

- consistency
- performance
- auditability

If snapshots are persisted:

The source of truth remains:

- transactions
- budget configuration
- reservations
- allocation schedules

Snapshots must be rebuildable.

---

# 36. DETERMINISTIC CALCULATION

The budget engine must be deterministic.

Given the same:

- transactions
- budgets
- reservations
- dates
- timezone
- allocation schedules
- rules

it must produce the same result.

The calculation must not depend on:

- UI state
- Compose recomposition
- collection order
- database query ordering unless explicit
- timing
- thread scheduling

---

# 37. CALCULATION EXPLANATION

The user should be able to tap the daily amount and see:

> How is this calculated?

Example:

Opening allowance             80.40 TND
Today's allocation            -23.00 TND
Weekly allocation              -6.50 TND
Monthly allocation              -2.39 TND
Other adjustment                +8.89 TND
-----------------------------------------
Safe to spend                  57.40 TND

Then period context:

Budget                         450.00 TND
Spent                          163.00 TND
Reserved                       100.00 TND
Available                      187.00 TND
Days remaining                  5

Only show relevant rows.

Use simple language.

The dashboard itself must remain clean.

---

# 38. OVERSPENDING

If remaining safe-to-spend becomes negative:

The primary displayed safe-to-spend amount should be:

> 0.00 TND

But internal calculations must retain the negative value.

Show a calm explanation:

> You are 12.00 TND over today's target.

Then:

> Future allowances will adjust.

Do not use:

- punishment language
- guilt
- red warning screens
- dramatic alerts

The application is a budgeting assistant, not a judgment system.

---

# 39. PERIOD OVERSpending

The application must distinguish:

1. over today's target
2. over the entire budget period

Example:

Today's safe-to-spend:

0.00 TND

but the period still has money available.

This is different from:

The entire budget period is exhausted.

These states must have different messages.

---

# 40. ZERO / EMPTY STATES

## No budget configured

Display:

> Set a spending budget to calculate what is safe to spend today.

Provide a setup action.

Do NOT display:

> 0.00 TND

because zero could incorrectly imply that the budget has been exhausted.

---

## Budget exhausted

Display:

> 0.00 TND
>
> Safe to spend today

and:

> You have used your available spending budget.

Details can show the negative internal amount if applicable.

---

## Over today's target but period still has money

Display:

> 0.00 TND

and:

> You are 12.00 TND over today's target. Future allowances will adjust.

---

## Last day

Today receives the remaining discretionary amount.

Do not show tomorrow.

---

# 41. ADD EXPENSE

The dashboard must have an obvious:

> Add Expense

action.

It must reuse Ivy Wallet's existing transaction-entry implementation.

Do not create a parallel expense system.

The workflow should remain as close as possible to Ivy.

Only add the required allowance-allocation choice.

On save:

- account updates immediately
- transaction appears immediately
- analytics update
- allocation schedule is generated
- dashboard updates reactively
- daily safe-to-spend recalculates

---

# 42. ADD INCOME

The dashboard must have:

> Add Income

This must reuse Ivy's existing income entry flow.

Income must:

- update selected account
- appear in transaction history
- appear in analytics
- follow Ivy's existing income semantics

Add the budget option:

> Include in current spending budget

or equivalent language using Ivy's localization conventions.

---

# 43. TRANSACTION REACTIVITY

The dashboard must update automatically after:

- expense creation
- expense editing
- expense deletion
- expense restoration
- amount changes
- date changes
- account changes
- category changes
- allocation-mode changes
- income creation
- income editing
- income deletion
- income inclusion changes
- planned expense creation
- planned expense editing
- planned expense deletion
- planned expense payment
- reservation changes
- budget changes
- period changes
- payday changes
- category eligibility changes
- account eligibility changes
- imports
- transfers
- crossing midnight
- entering a new period

No manual refresh.

---

# 44. REACTIVE ARCHITECTURE

Use Ivy's actual reactive architecture.

Prefer:

- Kotlin Flow
- repository-driven state
- use cases
- ViewModels
- immutable ViewState

where consistent with the actual repository.

Do not make Compose calculate financial logic.

Compose renders state.

The ViewModel coordinates intent.

The domain engine performs the financial calculation.

The repository provides source data.

---

# 45. CONCURRENCY

Correctly handle:

- rapid successive expense additions
- rapid edits
- transaction imports
- simultaneous edits
- dashboard collection while recalculation is active
- midnight transitions
- budget edits during recalculation

Requirements:

- one source of truth
- structured concurrency
- idempotent recalculation
- deterministic schedule creation
- database transactions where needed
- no stale state overwriting current state
- no duplicate Flow collectors
- no recomputation loops
- no expensive work on the main thread

---

# 46. DATABASE DESIGN

Inspect Ivy's current Room schema first.

Do not design new entities blindly.

Potential new entities/data:

- dynamic budget configuration
- budget period
- payday configuration
- income inclusion
- reservation/planned expense
- allowance allocation mode
- allocation schedule
- allocation entries
- daily budget state
- calculation version

Use Room migrations if Ivy uses Room.

Do NOT use destructive migrations.

Existing user data must survive.

Existing accounts must survive.

Existing transactions must survive.

Existing categories must survive.

Existing analytics must remain functional.

---

# 47. HISTORICAL EXPENSE DEFAULT

Existing Ivy expenses must receive a safe default.

Default:

> Today

meaning the expense is attributed to its original transaction date.

Do not retroactively reinterpret historical expenses as weekly/monthly allocations unless the user explicitly changes them.

---

# 48. STABLE INTERNAL ENUMS

Never store:

> "Today"

or:

> "Cette semaine"

or any localized display string

as the database representation.

Use stable internal identifiers.

For example conceptually:

TODAY
WEEK
MONTH

The actual names should follow the project conventions.

Localization must happen only in presentation.

---

# 49. MULTI-DEVICE / AMINA FUTURE REQUIREMENT

The first version MUST remain fully local.

Do NOT build cloud sync yet.

Do NOT add:

- Firebase authentication
- Supabase
- Google sign-in
- cloud database
- realtime sync
- backend APIs
- account sharing UI

at this stage.

However:

**The local data model and domain architecture must not make future synchronization unnecessarily difficult.**

Eventually I want the same budget and financial dataset to be shared between:

- Me
- Amina

This means the future architecture should conceptually support a shared household/workspace.

Do not implement the cloud yet.

---

# 50. FUTURE SHARED DATA MODEL

Design the persistence layer so that entities can eventually have stable identifiers suitable for synchronization.

Where appropriate, prefer immutable/stable IDs such as UUIDs rather than relying exclusively on database-generated row positions.

Potential future concept:

Household / SharedWorkspace

containing:

- members
- accounts
- transactions
- categories
- budgets
- reservations
- allocation schedules
- settings

But this is only architectural preparation.

Do not display:

> Household
>
> Invite Amina

in the first version.

Do not create authentication.

Do not add sync.

---

# 51. FUTURE SYNC READINESS

Without implementing cloud sync, avoid architectural choices that make future synchronization unnecessarily difficult.

Future sync will eventually need to deal with:

- stable IDs
- created timestamps
- updated timestamps
- deleted/tombstoned records
- conflict resolution
- duplicate prevention
- idempotency

Do not implement all of this now unless the existing Ivy architecture already makes it natural.

But do not create a design that assumes:

> "This database will always belong to exactly one phone forever."

The first version is:

> local-first

not:

> cloud-dependent

---

# 52. OFFLINE-FIRST

The application must work entirely offline.

The daily budgeting engine must never require an internet connection.

No bank integrations.

No financial institution connections.

No external API dependency for calculations.

No cloud dependency for the dashboard.

The user should be able to:

- add expenses
- add income
- modify budgets
- view safe-to-spend
- view history
- view analytics

with no network access.

---

# 53. PRIVACY

Do not transmit financial values to external services.

Do not introduce analytics that capture:

- transaction amounts
- account balances
- budget limits
- category spending
- personal financial information

If Ivy already contains crash reporting, do not enrich crash logs with sensitive financial data.

---

# 54. LOCALIZATION

All new strings must use Android resources.

Do not hard-code strings in Compose.

Support:

- different currencies
- local decimal formatting
- local date formats
- local timezone
- RTL
- accessibility font sizes
- screen readers
- content descriptions
- light theme
- dark theme

Do not use color alone to convey:

- under budget
- over target
- safe
- warning

Use text/icons as well.

---

# 55. CURRENCY

The engine must be currency-aware.

Do not assume TND is the only currency.

The examples use TND because that is my primary use case.

The architecture must continue to respect Ivy's existing multi-currency capabilities if present.

---

# 56. PERFORMANCE

The main dashboard should feel instant.

Avoid recalculating the entire historical dataset synchronously on the main thread.

Use appropriate background dispatching.

Optimize only after measuring.

Do not sacrifice correctness for premature optimization.

The first priority is:

> correct financial calculations

Second:

> reactive behavior

Third:

> performance optimization

---

# 57. ERROR HANDLING

Never display a financial number if the calculation is known to be invalid.

If calculation fails:

- log technical details safely
- show an understandable recoverable state
- provide retry/recovery where appropriate
- do not silently display 0.00 TND as if valid

A zero caused by "calculation failed" must never be indistinguishable from "budget exhausted."

---

# 58. TESTING IS MANDATORY

Unit tests are required before the feature is considered complete.

At minimum test:

## Basic budget

450 TND
7 days
0 spending

Verify correct daily allowance.

---

## Exact division

Test amounts that do not divide evenly.

Verify:

sum(daily allocations) == original amount

---

## Spend below allowance

Opening:

60

Spend:

20

Remaining:

40

Unused 40? No.

The difference between opening and actual charge must correctly remain inside the period and affect future days.

---

## Spend above allowance

Opening:

64.29

Spend:

70

Safe today:

0

Internal over-target:

5.71

Tomorrow decreases accordingly.

---

## Reservation

Budget:

450

Spent:

100

Reserved:

100

Ordinary discretionary capacity:

250

---

## Today allocation

90 TND

→ 90 on transaction date

---

## Weekly allocation

90 TND Friday

→ Friday
→ Saturday
→ Sunday

Total = 90

---

## Weekly boundary

Budget period ends Saturday.

90 TND Friday weekly allocation:

→ Friday
→ Saturday

No Sunday allocation.

---

## Monthly allocation

Transaction near month-end.

Correct number of dates.

Correct exact sum.

---

## Leap year

February 2028.

Correct handling of February 29.

---

## Salary cycle

Payday 31.

Correct handling of months without day 31.

---

## Historical edit

Modify a transaction from three days ago.

Today's allowance must update correctly.

---

## Historical deletion

Delete an expense from a previous day.

Later daily allowances must update correctly.

---

## Historical import

Import an old transaction.

Recalculate affected period.

---

## Same-day edit

Change today's transaction amount.

Opening allowance remains conceptually stable where appropriate.

Remaining allowance updates.

---

## Allocation mode change

Change:

This week

to:

Today

The allocation schedule is fully regenerated.

---

## Reservation conversion

Planned expense becomes completed expense.

Reservation disappears.

Actual transaction appears.

No double counting.

---

## Included income

Income excluded:

No budget impact.

Income included:

Budget capacity increases.

---

## Transfer

Account A → Account B.

Must not create spending or income.

---

## Midnight while app closed

Close app Sunday.

Open Wednesday.

Correct daily states must be reconstructed.

---

## Last day of budget

No tomorrow projection.

---

# 59. PROPERTY-STYLE INVARIANTS

Add strong mathematical tests where practical.

Invariant:

> Sum of allocation entries for an expense == expense amount.

Invariant:

> Allocation schedules never create account transactions.

Invariant:

> Actual spending is never multiplied by allocation count.

Invariant:

> Deleting an expense removes its budget allocation.

Invariant:

> Changing an allocation mode replaces the old allocation schedule.

Invariant:

> Transfers do not change spending capacity.

Invariant:

> Displayed safe-to-spend >= 0.

Invariant:

> Internal financial state may be negative.

Invariant:

> Re-running calculation with identical source data produces identical results.

Invariant:

> Recalculating twice produces the same result as recalculating once.

Invariant:

> Historical changes propagate forward to all affected dates.

---

# 60. DASHBOARD STATES

The dashboard must have explicit states for:

- loading
- no budget
- budget active
- budget exhausted
- over today's target
- over full period
- last day
- invalid configuration
- calculation error

Do not temporarily display fake zeros while loading.

---

# 61. UI STRUCTURE

Use the existing Ivy UI system.

Conceptual structure:

## Header

Compact Ivy-style header.

Possible:

- existing greeting
- current date
- existing profile/navigation

Do not introduce a giant title.

## Safe-to-spend area

Contains:

- "Safe to spend today"
- large amount
- remaining-today context
- opening allowance
- today's charges
- tomorrow projection

## Quick actions

- Add Expense
- Add Income

## Period summary

- Budget
- Spent
- Reserved
- Available
- Days remaining

## Recent transactions

Reuse Ivy's existing transaction rows.

## Existing Ivy content

Retain useful existing information.

Do not delete existing dashboard functionality simply because a new daily section was added.

---

# 62. VISUAL RULE

The application should NOT look like a new dashboard layered on top of Ivy.

It should look like:

> Ivy Wallet evolved naturally.

Use Ivy's:

- spacing
- typography
- colors
- components
- motion
- cards
- icons
- navigation

The safe-to-spend feature should feel native to Ivy.

---

# 63. DO NOT OVERDESIGN

Avoid:

- excessive cards
- excessive charts
- huge gradients
- excessive animations
- dashboards full of widgets
- clutter
- gamification unless already part of Ivy
- unnecessary badges
- giant headers
- competing numbers
- decorative financial visualizations above the daily amount

The user should be able to open the application and understand it within seconds.

---

# 64. EXISTING IVY FUNCTIONALITY MUST KEEP WORKING

After implementation, verify that these still work:

- creating account
- editing account
- deleting account
- adding expense
- editing expense
- deleting expense
- adding income
- editing income
- deleting income
- categories
- transfers
- analytics
- transaction history
- import
- export
- dark mode
- light mode
- localization
- backup/restore
- navigation

Do not sacrifice existing functionality to implement the budget engine.

---

# 65. NO MOCK DATA

Do not replace real Ivy data with:

- placeholder transactions
- fake accounts
- fake balances
- hard-coded dashboard numbers
- demo budgets

The new dashboard must derive its data from the real repository.

---

# 66. NO DUPLICATE SYSTEMS

Do not create:

- second account repository
- second expense database
- second income database
- second transaction history
- second category database
- second analytics system

Extend Ivy's existing systems.

---

# 67. IMPLEMENTATION ARCHITECTURE

The exact names must depend on the repository.

Conceptually separate:

### BudgetPeriodResolver

Responsible for:

- weekly periods
- monthly periods
- salary cycles
- custom periods
- remaining day calculation

### ExpenseAllocationScheduler

Responsible for:

- Today
- Week
- Month
- date ranges
- rounding
- exact amount preservation

### DynamicBudgetEngine

Responsible for:

- period capacity
- spending
- reservations
- daily allowance
- rollover
- overspending
- projections
- explanations

### DailyBudgetRecalculator

Responsible for:

- affected-date detection
- historical changes
- recalculation
- missed-midnight handling

These are conceptual responsibilities, not mandatory class names.

Follow Ivy's conventions.

---

# 68. VIEWMODEL RESPONSIBILITY

The ViewModel should:

- collect source data
- invoke use cases
- receive domain calculation results
- expose immutable ViewState
- handle UI events

It should NOT contain the financial formulas.

---

# 69. COMPOSE RESPONSIBILITY

Compose should:

- render ViewState
- dispatch user actions
- display loading/error states
- display formatted financial values

Compose must not independently calculate:

- daily allowance
- rollover
- period spending
- reservations
- allocation schedules

---

# 70. DOMAIN ENGINE OUTPUT

The engine should conceptually provide:

- currency
- period label
- start date
- end date
- opening allowance today
- safe-to-spend today
- today's charges
- direct charges
- weekly charges
- monthly charges
- period budget
- period spending
- period reservations
- period remaining
- days remaining
- tomorrow projection
- today overspend
- period overspend
- progress
- explanation rows
- warning state

The actual data class must follow Ivy's conventions.

---

# 71. BUDGET PROGRESS

Period progress should communicate:

- configured budget
- actual spending
- reserved amount
- remaining ordinary capacity
- days remaining

Use a simple progress representation if consistent with Ivy.

Do not let progress UI compete with safe-to-spend today.

---

# 72. ACCESSIBILITY

The most important content should be accessible to screen readers.

The screen reader order should reflect the visual hierarchy:

1. Safe amount
2. Explanation
3. Add Expense
4. Add Income
5. Period summary
6. Transactions

Do not make icons without accessible descriptions.

Do not communicate important states solely by color.

---

# 73. FUTURE Amina SHARING

Eventually I want:

> Me + Amina

to be able to see and modify the same shared budgeting data.

The future shared experience should allow:

- both users to see transactions
- both users to add expenses
- both users to add income
- both users to see the same safe-to-spend amount
- both users to see reservations
- both users to see budget state
- both users to see the same transaction history

However:

**DO NOT IMPLEMENT THIS NOW.**

The current milestone is:

> one-device local version first

Only after the local version has been tested and trusted will cloud synchronization be considered.

---

# 74. FUTURE CLOUD REQUIREMENT

When we eventually add cloud sync, it should synchronize the underlying financial data rather than synchronizing the displayed daily number.

The cloud should synchronize:

- transactions
- budgets
- reservations
- allocation settings
- categories if necessary
- accounts if necessary
- user/workspace state

The safe-to-spend number should be recalculated deterministically from synchronized source data.

Never treat:

> "57.40 TND"

as the authoritative database value.

That number is derived state.

---

# 75. SOURCE OF TRUTH PRINCIPLE

The ultimate source of truth is:

> financial source data + budget configuration + rules

Not:

> dashboard state

Not:

> cached safe-to-spend number

Not:

> yesterday's displayed number

The engine must always be capable of rebuilding the result.

---

# 76. BACKUP / EXPORT

Preserve Ivy's existing:

- backup
- export
- import

where possible.

New budget information must eventually be represented in backup/export formats.

Do not silently create budget metadata that disappears when the user exports/imports their data.

Before modifying import/export formats:

- inspect existing implementation
- consider backwards compatibility
- consider future schema evolution

---

# 77. VERSIONING THE CALCULATION ENGINE

If the calculation engine ever becomes persistent/serialized:

store a calculation-engine version.

This allows future versions to know how historical derived data was created and rebuild it when necessary.

The version must not be used to create incompatible behavior without migration/recalculation.

---

# 78. DATABASE TRANSACTIONS

Operations involving multiple dependent records should be atomic.

For example:

Creating expense + generating allocation schedule

should not leave:

> transaction exists but allocation schedule does not

or:

> allocation schedule exists but transaction was rolled back

Similarly:

Deleting an expense should remove its associated allocation metadata atomically.

---

# 79. IMPORT HANDLING

When Ivy imports transactions:

The budget system must process imported transactions through the same rules as manually entered transactions.

Imported expenses must:

- affect actual spending
- receive an appropriate/default allocation mode
- generate/update allocation schedules
- trigger affected-date recalculation

Do not create a special "import budgeting system."

---

# 80. ACCOUNT SCOPE

Do not assume every account is part of the spending budget.

If Ivy's architecture supports account-based filtering:

allow the user to choose eligible accounts.

If Ivy does not support it cleanly:

do not invent an incompatible account subsystem.

The budget engine must explicitly know which accounts count toward the spending pool.

---

# 81. CATEGORY SCOPE

Likewise, support category eligibility only in a way consistent with Ivy's existing category architecture.

For example:

Budget may include:

- food
- transport
- shopping

while excluding:

- savings
- investment
- transfers

But do not hard-code these categories.

---

# 82. TRANSFERS

Transfers between the user's own accounts are not spending.

They must not reduce the budget merely because money changed accounts.

Inspect Ivy's existing transfer semantics and integrate with them.

---

# 83. USER TRUST REQUIREMENT

The most important product requirement is:

> The daily number must be trustworthy.

A visually beautiful dashboard with incorrect budgeting mathematics is a failure.

When there is a conflict between:

- visual polish
- feature quantity
- calculation correctness

choose calculation correctness.

---

# 84. PRODUCT SIMPLICITY REQUIREMENT

Do not turn this into another complicated budgeting application.

The user should configure the budget once.

Then the app should quietly maintain the calculation.

The desired user behavior is:

Open app.

See:

> **57.40 TND**

Know what can safely be spent.

Record expense.

See number change.

Close app.

That is the core loop.

---

# 85. ACCEPTANCE TEST

The core feature is only successful if this scenario works correctly.

Suppose:

Budget:

450 TND

Period:

Monday → Sunday

Days remaining:

5

Already spent:

163 TND

Reserved:

100 TND

Remaining period capacity:

187 TND

Today's opening allowance:

80.40 TND

Today's allocation charges:

23.00 TND

Then dashboard should show approximately:

> **57.40 TND**
>
> Safe to spend today

Now add a:

> 20 TND expense → Today

Dashboard should immediately show:

> **37.40 TND**

Now add:

> 90 TND expense → This week

The account should immediately decrease by the full 90 TND.

Transaction history should show exactly one 90 TND transaction.

Analytics should show exactly one 90 TND expense.

The allowance schedule should distribute that 90 TND over the remaining eligible dates.

The expense must not be counted twice.

---

# 86. IMPLEMENTATION STAGES

After I explicitly authorize implementation:

## Stage 1

Repository analysis and architecture confirmation.

No product code changes until analysis is complete.

## Stage 2

Domain model and budget-engine foundation.

## Stage 3

Database/schema changes and migrations.

## Stage 4

Transaction allocation system.

## Stage 5

Budget configuration.

## Stage 6

Dashboard integration.

## Stage 7

Reservations.

## Stage 8

Historical recalculation.

## Stage 9

Tomorrow projection and explanation UI.

## Stage 10

Testing.

## Stage 11

UI refinement.

## Stage 12

Regression testing across existing Ivy functionality.

Do not attempt everything in one giant implementation.

---

# 87. AFTER EVERY IMPLEMENTATION STAGE

After each stage:

1. Compile the project.
2. Run relevant unit tests.
3. Run relevant instrumentation/screenshot tests where appropriate.
4. Fix compilation errors.
5. Fix test failures.
6. Reinspect affected code.
7. Explain:
    - what changed
    - why
    - which files changed
    - which tests were added
    - which tests passed
    - what remains

Do not move forward while the build is broken unless the break is explicitly documented and unavoidable.

---

# 88. BUILD SAFETY

Do not blindly upgrade:

- Kotlin
- Gradle
- AGP
- Compose
- Room
- dependencies

just because versions are old.

Ivy is an archived project, so dependency updates should be treated as deliberate engineering changes rather than automatic cleanup.

Only change dependencies when required.

---

# 89. CODE QUALITY

Follow Ivy's existing:

- naming conventions
- module boundaries
- architecture
- formatting
- lint rules
- testing style
- error-handling conventions

Do not introduce an unrelated architecture because it is personally preferred.

The implementation should look as though it belongs in the repository.

---

# 90. LICENSING / OPEN-SOURCE COMPLIANCE

Because this project is derived from Ivy Wallet:

Preserve the applicable license and copyright notices.

Do not remove existing attribution.

Before public distribution, identify:

- Ivy Wallet license obligations
- third-party dependency licenses
- attribution requirements
- any modifications required for publishing a derivative work

Do not assume that publication is legally unrestricted simply because the source is open source.

---

# 91. DO NOT IMPLEMENT THESE FEATURES YET

Unless explicitly requested later, do NOT add:

- bank connections
- account aggregation
- automatic transaction imports from banks
- AI financial advisor
- investment management
- cryptocurrency management
- savings goals
- gamification
- streak systems
- social feed
- notifications spam
- advertisements
- cloud synchronization
- Amina authentication
- household invitations
- online accounts
- server backend

The product should stay focused.

---

# 92. WHAT TO DO IF YOU ENCOUNTER AMBIGUITY

Do not silently choose a behavior that changes the financial meaning.

For implementation details that do not materially affect financial meaning:

choose the option most consistent with Ivy.

For anything that changes the financial calculation:

identify the ambiguity explicitly before implementation.

Examples:

- whether a reservation begins affecting the current day immediately
- whether income received today affects today's allowance
- category eligibility semantics
- account eligibility semantics
- refund behavior
- transfer behavior

The user must be able to trust the result.

---

# 93. ABSOLUTE PRIORITIES

When requirements conflict, use this priority order:

1. Financial correctness
2. Preservation of real Ivy transaction/account behavior
3. Data integrity
4. Deterministic calculations
5. User trust
6. Existing Ivy UX consistency
7. Performance
8. Visual polish
9. Feature quantity

Never sacrifice 1–5 for 8–9.

---

# 94. FINAL PRODUCT TEST

Before calling the application finished, ask:

### Question 1

When I open the app, can I immediately see how much I can still spend today?

### Question 2

Can I add an expense without learning a new transaction system?

### Question 3

Does the number update immediately after that expense?

### Question 4

Does the number remain mathematically correct after a historical edit?

### Question 5

Are reservations excluded from ordinary spending capacity without changing account balances?

### Question 6

Are weekly/monthly allocations guidance-only rather than fake transactions?

### Question 7

Can I use weekly, monthly, payday, and custom periods?

### Question 8

Does rollover work automatically?

### Question 9

Does overspending reduce future allowances?

### Question 10

Can the entire calculation be reconstructed from source data?

### Question 11

Does existing Ivy functionality still work?

### Question 12

Can we eventually synchronize the underlying data with Amina without redesigning the entire architecture?

If any answer is no, the implementation is not finished.

---

# 95. THE CORE EXPERIENCE

Everything ultimately supports this experience:

I open the app.

I see:

> **57.40 TND**
>
> Safe to spend today.

I spend 12 TND.

The app updates:

> **45.40 TND**

I spend less than expected today.

Tomorrow becomes more flexible.

I overspend today.

Tomorrow becomes tighter.

I reserve 100 TND for shopping.

The ordinary daily amount adjusts immediately.

I receive included income.

My available budget increases.

I edit an old transaction.

Today's number recalculates correctly.

I add an expense.

I don't have to manually calculate anything.

I do not need to understand the formulas.

The app quietly does the mathematics.

The result should always answer one question:

> **"How much can I still safely spend today?"**

That is the product.

Do not lose that simplicity while implementing the underlying complexity.

# END OF SPECIFICATION

**Do not build yet.**

The first task is repository inspection, architecture analysis, identification of relevant Ivy components, identification of data-model changes, identification of calculation risks, and a file-by-file implementation plan.

Only begin implementation after explicit authorization.