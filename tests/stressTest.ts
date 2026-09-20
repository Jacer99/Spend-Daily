import { DynamicBudgetEngine } from '../src/domain/dynamicBudgetEngine';
import { ExpenseAllocationScheduler } from '../src/domain/expenseAllocationScheduler';
import { BudgetPeriod, Transaction, DynamicBudgetConfig } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEquals<T>(expected: T, actual: T, message?: string) {
  if (expected !== actual) {
    throw new Error(
      `assertEquals Failed: expected [${expected}] but got [${actual}]. ${message || ''}`
    );
  }
}

function assertNull(actual: any, message?: string) {
  if (actual !== null) {
    throw new Error(`assertNull Failed: expected null but got [${actual}]. ${message || ''}`);
  }
}

function assertNotNull(actual: any, message?: string) {
  if (actual === null || actual === undefined) {
    throw new Error(`assertNotNull Failed: expected non-null but got [${actual}]. ${message || ''}`);
  }
}

function runTests() {
  console.log('====================================================');
  console.log('Starting DynamicBudgetEngine Mathematical Stress Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Integer Dust & Millime Conservation
  // 1,000 TND over 31 days does NOT divide evenly (32,258.0645... millimes).
  // Invariant: Zero millimes must vanish from the system over the month.
  // --------------------------------------------------------------------------
  test('test 01 - integer division remainder remains conserved across 31 days', () => {
    const period: BudgetPeriod = {
      start: '2026-01-01',
      end: '2026-01-31',
      type: 'monthly',
    };
    const budgetLimit = 1_000_000; // 1,000.000 TND in millimes
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    let simulatedChargesBeforeToday = 0;

    for (let dayIndex = 0; dayIndex < 31; dayIndex++) {
      const d = dayIndex + 1;
      const todayStr = `2026-01-${d < 10 ? '0' + d : d}`;
      const daysLeft = 31 - dayIndex;

      const snapshot = DynamicBudgetEngine.calculate({
        config,
        period,
        transactions: [],
        reservations: [],
        todayStr,
      });

      // Opening allowance = remaining pool / daysLeft (Math.trunc for integer millimes)
      const expectedOpening = Math.trunc((budgetLimit - simulatedChargesBeforeToday) / daysLeft);
      assertEquals(expectedOpening, Math.trunc(snapshot.openingAllowance), `Day ${d}`);

      // On the last day, opening allowance clears exact remaining dust
      if (dayIndex === 30) {
        assertEquals(1, snapshot.daysRemaining);
        assertEquals(Math.trunc(snapshot.periodRemaining), Math.trunc(snapshot.openingAllowance));
      }
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Leap Year 29-Day February Boundary
  // Verifies leap year February gives exactly 29 daily slices.
  // --------------------------------------------------------------------------
  test('test 02 - leap year 29 day cycle allocates correctly without truncation', () => {
    const period: BudgetPeriod = {
      start: '2028-02-01',
      end: '2028-02-29',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 290_000, // 290.000 TND = exactly 10.000 TND / day
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [],
      reservations: [],
      todayStr: '2028-02-01',
    });

    assertEquals(29, snapshot.daysRemaining);
    assertEquals(10_000, Math.trunc(snapshot.openingAllowance));
    assertEquals(10_000, Math.trunc(snapshot.remainingAllowance));
    assertEquals(10_000, Math.trunc(snapshot.tomorrowProjection!));
  });

  // --------------------------------------------------------------------------
  // TEST 3: Cycle End (Final Day, DaysRemaining = 1)
  // Verifies zero-division protection: tomorrowProjection MUST be null on the last day.
  // --------------------------------------------------------------------------
  test('test 03 - last day of cycle guards against division by zero and returns null tomorrow', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 300_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const tx: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 4_000,
      type: 'expense',
      date: '2026-09-30T10:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [tx],
      reservations: [],
      todayStr: '2026-09-30',
    });

    assertEquals(1, snapshot.daysRemaining);
    assertEquals(300_000, Math.trunc(snapshot.openingAllowance));
    assertEquals(296_000, Math.trunc(snapshot.remainingAllowance));
    assertNull(snapshot.tomorrowProjection, 'Tomorrow projection must be null on period end');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Penultimate Day (DaysRemaining = 2)
  // Tomorrow has exactly 1 day left; divisor is 1. Verifies exact math.
  // --------------------------------------------------------------------------
  test('test 04 - penultimate day projects last day with divisor 1', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 200_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const tx: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 40_000,
      type: 'expense',
      date: '2026-09-29T10:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [tx],
      reservations: [],
      todayStr: '2026-09-29',
    });

    assertEquals(2, snapshot.daysRemaining);
    assertEquals(100_000, Math.trunc(snapshot.openingAllowance));
    assertEquals(60_000, Math.trunc(snapshot.remainingAllowance));
    assertNotNull(snapshot.tomorrowProjection);
    assertEquals(100_000, Math.trunc(snapshot.tomorrowProjection!));
  });

  // --------------------------------------------------------------------------
  // TEST 5: Catastrophic Day-1 Overspend (Zero Panic Invariant)
  // --------------------------------------------------------------------------
  test('test 05 - catastrophic overspend results in mathematically sound negative pool', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 1_000_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const tx: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 2_500_000,
      type: 'expense',
      date: '2026-09-01T12:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [tx],
      reservations: [],
      todayStr: '2026-09-01',
    });

    assertEquals(30, snapshot.daysRemaining);
    assertEquals(33_333, Math.trunc(snapshot.openingAllowance));
    assertEquals(2_500_000, Math.trunc(snapshot.todayCharges));
    assertEquals(-2_466_667, Math.trunc(snapshot.remainingAllowance));
    assertEquals(-51_724, Math.trunc(snapshot.tomorrowProjection!));
  });

  // --------------------------------------------------------------------------
  // TEST 6: "THIS_WEEK" Mode Amortization & Truncation at Period End
  // --------------------------------------------------------------------------
  test('test 06 - this week allocation near period end clips to remaining days', () => {
    const entries = ExpenseAllocationScheduler.schedule(
      60_000,
      '2026-09-28',
      'THIS_WEEK',
      '2026-09-30'
    );

    assertEquals(3, entries.length, 'Must allocate across exactly 3 days');
    assertEquals(20_000, Math.round(entries[0].amount));
    assertEquals(20_000, Math.round(entries[1].amount));
    assertEquals(20_000, Math.round(entries[2].amount));
    assertEquals('2026-09-30', entries[entries.length - 1].date);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Under-spend Smoothing (Morning Conservative Projection)
  // --------------------------------------------------------------------------
  test('test 07 - tomorrow projection assumes unspent allowance is consumed today', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 900_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const tx: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 5_000,
      type: 'expense',
      date: '2026-09-01T10:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [tx],
      reservations: [],
      todayStr: '2026-09-01',
    });

    assertEquals(30_000, Math.trunc(snapshot.openingAllowance));
    assertEquals(25_000, Math.trunc(snapshot.remainingAllowance));
    assertEquals(30_000, Math.trunc(snapshot.tomorrowProjection!));
  });

  // --------------------------------------------------------------------------
  // TEST 8: Under-spend Actual Rollover on the Next Day
  // --------------------------------------------------------------------------
  test('test 08 - next morning absorbs previous day underspend into higher allowance', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 900_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const tx: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 5_000,
      type: 'expense',
      date: '2026-09-01T10:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [tx],
      reservations: [],
      todayStr: '2026-09-02', // Day 2
    });

    assertEquals(29, snapshot.daysRemaining);
    assertEquals(30_862, Math.trunc(snapshot.openingAllowance));
    assertEquals(30_862, Math.trunc(snapshot.remainingAllowance));
  });

  // --------------------------------------------------------------------------
  // TEST 9: Historical & Out-of-Bounds Expenses are Excluded
  // --------------------------------------------------------------------------
  test('test 09 - expenses outside active period window are ignored', () => {
    const period: BudgetPeriod = {
      start: '2026-09-01',
      end: '2026-09-30',
      type: 'monthly',
    };
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: 300_000,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: false,
    };

    const txOut1: Transaction = {
      id: 'tx1',
      accountId: 'acc1',
      amount: 100_000,
      type: 'expense',
      date: '2026-08-31T23:59:59',
      allocationMode: 'TODAY',
    };
    const txOut2: Transaction = {
      id: 'tx2',
      accountId: 'acc1',
      amount: 100_000,
      type: 'expense',
      date: '2026-10-01T00:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [txOut1, txOut2],
      reservations: [],
      todayStr: '2026-09-01',
    });

    assertEquals(0, snapshot.periodSpentRaw);
    assertEquals(300_000, snapshot.periodRemaining);
    assertEquals(10_000, Math.trunc(snapshot.openingAllowance));
  });

  // --------------------------------------------------------------------------
  // TEST 10: Extreme Values & Multi-Billion Millimes
  // --------------------------------------------------------------------------
  test('test 10 - extreme multi-million figures execute without arithmetic overflow', () => {
    const period: BudgetPeriod = {
      start: '2026-01-01',
      end: '2026-01-31',
      type: 'monthly',
    };
    const hugeBudget = 100_000_000_000; // 100 Million TND in millimes
    const config: DynamicBudgetConfig = {
      id: 'cfg',
      periodType: 'monthly',
      payday: 1,
      budgetLimit: hugeBudget,
      currencyCode: 'TND',
      includedAccountIds: [],
      includedCategoryIds: [],
      includeIncomeInBudget: true,
    };

    const incomeTx: Transaction = {
      id: 'inc1',
      accountId: 'acc1',
      amount: 50_000_000_000,
      type: 'income',
      includeInBudget: true,
      date: '2026-01-01T09:00:00',
    };

    const expTx: Transaction = {
      id: 'exp1',
      accountId: 'acc1',
      amount: 31_000_000_000,
      type: 'expense',
      date: '2026-01-01T12:00:00',
      allocationMode: 'TODAY',
    };

    const snapshot = DynamicBudgetEngine.calculate({
      config,
      period,
      transactions: [incomeTx, expTx],
      reservations: [],
      todayStr: '2026-01-01',
    });

    assertEquals(150_000_000_000, snapshot.capacity);
    assertEquals(31_000_000_000, snapshot.periodSpentRaw);
    assertEquals(119_000_000_000, snapshot.periodRemaining);
    assertEquals(4_838_709_677, Math.trunc(snapshot.openingAllowance));
    assert(snapshot.remainingAllowance < 0, 'Remaining allowance should be negative');
  });

  console.log('\n====================================================');
  console.log(`STRESS TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
