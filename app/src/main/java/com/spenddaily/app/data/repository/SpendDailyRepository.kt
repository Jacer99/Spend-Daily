package com.spenddaily.app.data.repository

import com.spenddaily.app.data.local.dao.*
import com.spenddaily.app.data.local.entity.*
import com.spenddaily.app.data.preferences.DataStoreManager
import com.spenddaily.app.data.sync.FirebaseSyncEngine
import com.spenddaily.app.domain.engine.AmortizationEngine
import com.spenddaily.app.domain.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.ZoneId

class SpendDailyRepository(
    private val database: AppDatabase,
    private val dataStoreManager: DataStoreManager,
    private val syncEngine: FirebaseSyncEngine,
    private val scope: CoroutineScope
) {
    private val accountDao = database.accountDao()
    private val categoryDao = database.categoryDao()
    private val transactionDao = database.transactionDao()
    private val loanDao = database.loanDao()
    private val budgetConfigDao = database.budgetConfigDao()

    // Database Flows
    val accountsFlow: Flow<List<AccountEntity>> = accountDao.getAllAccounts()
    val categoriesFlow: Flow<List<CategoryEntity>> = categoryDao.getAllCategories()
    val transactionsFlow: Flow<List<TransactionEntity>> = transactionDao.getAllTransactions()
    val loansFlow: Flow<List<LoanEntity>> = loanDao.getAllLoans()
    val budgetConfigFlow: Flow<BudgetConfigEntity?> = budgetConfigDao.getBudgetConfig()

    // Preferences Flows
    val themeModeFlow: Flow<ThemeMode> = dataStoreManager.themeModeFlow
    val currencyFlow: Flow<String> = dataStoreManager.currencyFlow
    val householdCodeFlow: Flow<String?> = dataStoreManager.householdCodeFlow
    val onboardingCompletedFlow: Flow<Boolean> = dataStoreManager.onboardingCompletedFlow

    /**
     * Reactive Safe-to-Spend Daily Allowance Flow combining transactions and budget configuration.
     */
    val dailyAllowanceFlow: Flow<DailyAllowanceCalculation> = combine(
        budgetConfigFlow,
        transactionsFlow
    ) { config, transactions ->
        val safeConfig = config ?: BudgetConfigEntity(
            id = "default_budget",
            cycleType = CycleType.MONTHLY,
            totalBudget = 1200.0,
            salaryCycleDay = 1,
            isConfigured = false
        )

        val today = LocalDate.now()
        val zoneId = ZoneId.systemDefault()
        val startOfTodayEpoch = today.atStartOfDay(zoneId).toInstant().toEpochMilli()
        val endOfTodayEpoch = today.plusDays(1).atStartOfDay(zoneId).toInstant().toEpochMilli() - 1

        val spentToday = transactions
            .filter { it.type == TransactionType.EXPENSE && it.timestamp in startOfTodayEpoch..endOfTodayEpoch }
            .sumOf { it.amount }

        // Determine cycle start timestamp
        val cycleStartEpoch = when (safeConfig.cycleType) {
            CycleType.WEEKLY -> {
                val monday = today.minusDays((today.dayOfWeek.value - 1).toLong())
                monday.atStartOfDay(zoneId).toInstant().toEpochMilli()
            }
            CycleType.MONTHLY -> {
                val clampedDay = safeConfig.salaryCycleDay.coerceIn(1, 28)
                val cycleStartDate = if (today.dayOfMonth >= clampedDay) {
                    today.withDayOfMonth(clampedDay)
                } else {
                    today.minusMonths(1).withDayOfMonth(clampedDay)
                }
                cycleStartDate.atStartOfDay(zoneId).toInstant().toEpochMilli()
            }
        }

        val expensesInCycleBeforeToday = transactions
            .filter {
                it.type == TransactionType.EXPENSE &&
                        it.timestamp in cycleStartEpoch until startOfTodayEpoch
            }
            .sumOf { it.amount }

        AmortizationEngine.calculateDailyAllowance(
            totalCycleBudget = safeConfig.totalBudget,
            expensesInCycle = expensesInCycleBeforeToday,
            spentToday = spentToday,
            cycleType = safeConfig.cycleType,
            salaryCycleDay = safeConfig.salaryCycleDay,
            today = today
        )
    }.flowOn(Dispatchers.Default)

    /**
     * Records a new transaction, updating local balances, database, and pushing to cloud sync.
     */
    suspend fun recordTransaction(transaction: TransactionEntity) = withContext(Dispatchers.IO) {
        transactionDao.insertTransaction(transaction)

        // Adjust Account Balances
        when (transaction.type) {
            TransactionType.EXPENSE -> {
                accountDao.adjustBalance(transaction.accountId, -transaction.amount)
            }
            TransactionType.INCOME -> {
                accountDao.adjustBalance(transaction.accountId, transaction.amount)
            }
            TransactionType.TRANSFER -> {
                accountDao.adjustBalance(transaction.accountId, -transaction.amount)
                transaction.toAccountId?.let { toId ->
                    accountDao.adjustBalance(toId, transaction.amount)
                }
            }
        }

        // Push to Household Firestore if connected
        val householdCode = dataStoreManager.householdCodeFlow.first()
        if (!householdCode.isNullOrBlank()) {
            syncEngine.pushTransaction(transaction, householdCode)
        }
    }

    suspend fun deleteTransaction(tx: TransactionEntity) = withContext(Dispatchers.IO) {
        // Reverse balances
        when (tx.type) {
            TransactionType.EXPENSE -> accountDao.adjustBalance(tx.accountId, tx.amount)
            TransactionType.INCOME -> accountDao.adjustBalance(tx.accountId, -tx.amount)
            TransactionType.TRANSFER -> {
                accountDao.adjustBalance(tx.accountId, tx.amount)
                tx.toAccountId?.let { toId ->
                    accountDao.adjustBalance(toId, -tx.amount)
                }
            }
        }
        transactionDao.deleteTransaction(tx)
    }

    suspend fun saveAccount(account: AccountEntity) = withContext(Dispatchers.IO) {
        accountDao.insertAccount(account)
    }

    suspend fun deleteAccount(id: String) = withContext(Dispatchers.IO) {
        accountDao.deleteAccountById(id)
    }

    suspend fun saveCategory(category: CategoryEntity) = withContext(Dispatchers.IO) {
        categoryDao.insertCategory(category)
    }

    suspend fun deleteCategory(id: String) = withContext(Dispatchers.IO) {
        categoryDao.deleteCategoryById(id)
    }

    suspend fun saveLoan(loan: LoanEntity) = withContext(Dispatchers.IO) {
        loanDao.insertLoan(loan)
    }

    suspend fun recordLoanPayment(loanId: String, paymentAmount: Double) = withContext(Dispatchers.IO) {
        loanDao.addPayment(loanId, paymentAmount)
    }

    suspend fun deleteLoan(id: String) = withContext(Dispatchers.IO) {
        loanDao.deleteLoanById(id)
    }

    suspend fun saveBudgetConfig(config: BudgetConfigEntity) = withContext(Dispatchers.IO) {
        budgetConfigDao.setBudgetConfig(config)
    }

    suspend fun deleteBudgetConfig() = withContext(Dispatchers.IO) {
        budgetConfigDao.deleteBudgetConfig()
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStoreManager.setThemeMode(mode)
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        dataStoreManager.setOnboardingCompleted(completed)
    }

    /**
     * "Start Fresh" Data Wipe:
     * Wipes all local Room database tables, clears DataStore preferences,
     * and deletes remote records in Firebase.
     */
    suspend fun startFreshWipe() = withContext(Dispatchers.IO) {
        val householdCode = dataStoreManager.householdCodeFlow.first()
        if (!householdCode.isNullOrBlank()) {
            syncEngine.wipeRemoteHousehold(householdCode)
        }

        // Clear local tables
        transactionDao.deleteAll()
        loanDao.deleteAll()
        categoryDao.deleteAll()
        accountDao.deleteAll()
        budgetConfigDao.deleteAll()

        // Clear preferences
        dataStoreManager.clearAll()

        // Re-seed essential defaults
        AppDatabase.seedDatabase(database)
    }
}
