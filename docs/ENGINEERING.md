# ENGINEERING.md — Architecture, Stages, Delivery

## 1. Repository layout
- Android app: `app/`
- Feature modules: `feature/`
- Shared modules: `shared/`
- Widgets: `widget/`
- Build helpers: `buildSrc/`, `gradle/`
- Follow existing module boundaries. Do not introduce new architecture patterns.

## 2. Responsibilities (conceptual; final names come from Ivy conventions)
- BudgetPeriodResolver — resolves active period, boundaries, days remaining.
- ExpenseAllocationScheduler — expense + mode → allocation schedule. Enforces
  exact-sum invariant.
- DynamicBudgetEngine — capacity, spending, reservations, opening/remaining,
  rollover, overspend, tomorrow projection, explanation rows.
- DailyBudgetRecalculator — earliest affected date; rebuild forward.
- ExplanationBuilder — "how is this calculated?" rows.

## 3. Data flow
- Repository exposes source data as Flow.
- Use cases call domain engine.
- ViewModel maps engine output to immutable ViewState.
- Compose renders ViewState only.

## 4. Persistence (planned — inspect actual Room schema first)
- Dynamic budget configuration
- Allocation mode on expense (default TODAY)
- Allocation schedule + entries (derived from source transactions)
- Reservation / planned expense
- Daily budget snapshot (optional, rebuildable)
- Calculation engine version

Rules:
- Non-destructive migrations only.
- Existing rows get safe defaults.
- Stable IDs suitable for future sync (UUIDs where Ivy's schema allows).

## 5. Reactive behavior
- Flow-driven. No manual refresh required for the dashboard.
- Updates on: expense/income/reservation/budget/period/eligibility changes,
  imports, midnight crossing, period rollover.

## 6. Concurrency
- Single source of truth for reads.
- Idempotent recalculation.
- Structured concurrency.
- No main-thread budget math.
- No stale state overwrites.
- No duplicated collectors.

## 7. Delivery stages (only after explicit authorization)
1. Repository recon (read-only)
2. Domain model + budget engine skeleton + tests
3. Database schema + migrations
4. Allocation scheduling
5. Budget configuration UI (minimal)
6. Dashboard integration
7. Reservations
8. Historical recalculation
9. Tomorrow projection + explanation UI
10. Testing sweep (invariants)
11. UI polish
12. Regression pass over untouched Ivy

After each stage: compile, run tests, fix, report changes and remaining work.
Do not proceed on a broken build.

## 8. Testing
- Unit tests required for engine.
- Invariants: docs/CALCULATION.md §19.
- UI/instrumentation tests only when meaningful.
- Regression tests for existing Ivy flows after stages 6, 7, 8, 12.

## 9. Performance
- Correctness first.
- No full-history recalculation on main thread.
- Optimize only after measuring.

## 10. Error handling
- Never display a number if the calculation failed.
- Distinguish "calculation failed" from "budget exhausted" in UI.
- Log detail safely; never log transaction amounts or balances.

## 11. Localization
- All strings via Android resources.
- Currency/decimal/date formatting via locale.
- RTL, font scaling, screen reader support.
- Never encode state in color alone.

## 12. Cloud readiness (future)
- v1 is local-only. Do not add auth, sync, or sharing.
- Design IDs, timestamps, and entity structure so future workspace sharing does
  not require a redesign.
- Do not speculatively add createdAt/updatedAt/tombstone unless recon shows
  Ivy already uses them.

## 13. Licensing
- Preserve GPL-3.0 notices and Ivy attribution.
- Any publishable derivative must respect GPL-3.0.

## 14. What AI agents must NOT do
- Do not implement without authorization.
- Do not create files without being asked.
- Do not upgrade dependencies.
- Do not invent class names or file paths.
- Do not refactor untouched Ivy.
- Do not bypass the domain engine.
- Do not create parallel financial systems.
- Do not silently change financial meaning.