# PROJECT_RULES.md

Hard rules for this repository. Any AI agent or contributor must follow these.
If this file conflicts with any other instruction, THIS FILE WINS.

## 1. Baseline
- This is a fork of Ivy Wallet (GPL-3.0), archived 2024-11-05.
- Baseline tag: `ivy-original-baseline`.
- Default dev branch: `development`. `main` stays clean.
- `upstream` (`Ivy-Apps/ivy-wallet`) is read-only reference. Never push to it.

## 2. Do not break untouched Ivy
- Accounts, expenses, income, categories, transfers, analytics, import/export,
  backup/restore, dark/light, localization must all keep working.
- Never delete or bypass existing Ivy functionality.
- Never create parallel systems (second transaction store, second account
  repository, second analytics, etc.). Extend Ivy's existing ones.

## 3. Toolchain is frozen
- Gradle wrapper: 8.8
- Gradle JDK: 17
- Do not upgrade Kotlin, AGP, Compose, Room, Hilt, or any dependency without
  explicit authorization.
- Do not switch JDK to 21/25.
- Do not run "auto-fix" or "cleanup" upgrades.
- If a dependency upgrade is truly required, document why and wait for approval.

## 4. Database safety
- Never use destructive migrations. Ever.
- Preserve user data through all migrations.
- New fields must have safe defaults.
- Default allocation mode for existing expenses is `TODAY`.
- Follow Ivy's existing Room migration style exactly.

## 5. Money representation
- Never use `Float` or `Double` for persisted money.
- Use Ivy's existing exact representation. If insufficient, use integer minor units.
- Rounding only inside the allocation algorithm, in minor units.
- Never create or destroy value through rounding.

## 6. Financial engine is the single source of truth
- All budget math lives in a pure domain engine.
- No formulas in Compose, ViewModels, Activities, Fragments, repositories, widgets, or helpers.
- All screens read the same engine output.
- Deterministic: same input → same output.

## 7. Actual accounting vs allowance attribution are separate
- A transaction is one real financial event.
- Allowance allocation is derived guidance metadata.
- Never create fake transactions for allocation shares.
- Never double-count a transaction in period spending and allocation.
- Sum of allocation shares must equal the source transaction amount exactly.

## 8. Opening vs remaining allowance
- Opening allowance is the day's snapshot at 00:00 local time.
- Remaining = opening − today's allowance charges.
- Same-day ordinary expenses change remaining, not opening.
- Structural changes invalidate and rebuild the snapshot.

## 9. Historical edits are first-class
- Any change to a historical transaction, budget, period, reservation, or
  eligibility must recalculate forward from the earliest affected date.
- Never patch today's number without rebuilding the affected chain.

## 10. Rollover is a property of the engine
- Unused daily capacity stays in the period.
- Overspending reduces future capacity.
- Rollover never creates transactions or changes balances.

## 11. Reservations
- A reservation reduces safe-to-spend capacity but does not debit any account.
- Converting a reservation to a paid expense must be atomic and must not double-count.

## 12. No cloud, no accounts, no sharing — yet
- v1 is fully local and offline.
- No Firebase, Supabase, Google Sign-In, backend, sync, or invite UI.
- Local schema must use stable IDs so cloud sync can be added later without
  redesigning the database.
- Future "Amina" sharing is architectural intent, not a v1 feature.

## 13. Tests are mandatory
- Every stage includes unit tests for the math it touches.
- Required invariants (see docs/CALCULATION.md §19).
- Do not mark a stage complete with failing tests.

## 14. Build must stay green
- After each stage: compile, run tests, fix, then report.
- Do not move forward on a broken build.
- Do not mix unrelated changes into one commit.

## 15. Licensing
- Preserve GPL-3.0 notices and Ivy attribution.
- Do not remove Ivy copyright headers.
- Any public distribution must respect GPL-3.0.

## 16. AI agent behavior
- Read this file first.
- Do not implement without explicit authorization.
- Do not invent class names or file paths. Inspect the repo first.
- When the specification is ambiguous on a financially meaningful point, STOP
  and ask.
- When ambiguity is cosmetic, follow Ivy's existing conventions.
- Never "fix" something not in scope.
- Never silently change financial meaning.

## 17. Priority order when requirements conflict
1. Financial correctness
2. Preservation of Ivy accounting
3. Data integrity
4. Deterministic calculations
5. User trust
6. Ivy UX consistency
7. Performance
8. Visual polish
9. Feature count