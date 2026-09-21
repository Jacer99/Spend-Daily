package com.spenddaily.app.viewmodel

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.spenddaily.app.data.local.entity.AccountEntity
import com.spenddaily.app.data.local.entity.BudgetConfigEntity
import com.spenddaily.app.data.local.entity.CategoryEntity
import com.spenddaily.app.data.local.entity.LoanEntity
import com.spenddaily.app.data.local.entity.TransactionEntity
import com.spenddaily.app.data.repository.SpendDailyRepository
import com.spenddaily.app.data.sync.FirebaseSyncEngine
import com.spenddaily.app.domain.model.DailyAllowanceCalculation
import com.spenddaily.app.domain.model.ThemeMode
import com.spenddaily.app.widget.SpendDailyGlanceWidget
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(
    private val repository: SpendDailyRepository,
    private val syncEngine: FirebaseSyncEngine,
    private val appContext: Context
) : ViewModel() {

    val accounts = repository.accountsFlow
    val categories = repository.categoriesFlow
    val transactions = repository.transactionsFlow
    val loans = repository.loansFlow
    val budgetConfig = repository.budgetConfigFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val dailyAllowance = repository.dailyAllowanceFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DailyAllowanceCalculation(
            safeToSpendToday = 0.0,
            remainingBudget = 0.0,
            totalBudget = 0.0,
            remainingDaysInCycle = 1,
            totalDaysInCycle = 1,
            tomorrowProjection = 0.0,
            spentToday = 0.0,
            cycleType = com.spenddaily.app.domain.model.CycleType.MONTHLY,
            isOverspent = false,
            cycleEndDateFormatted = ""
        )
    )

    val themeMode = repository.themeModeFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = ThemeMode.AUTO
    )

    val currency = repository.currencyFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = "TND"
    )

    val householdCode = repository.householdCodeFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val onboardingCompleted = repository.onboardingCompletedFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = true
    )

    fun recordTransaction(tx: TransactionEntity) {
        viewModelScope.launch {
            repository.recordTransaction(tx)
            updateWidget()
        }
    }

    fun deleteTransaction(tx: TransactionEntity) {
        viewModelScope.launch {
            repository.deleteTransaction(tx)
            updateWidget()
        }
    }

    fun saveAccount(account: AccountEntity) {
        viewModelScope.launch { repository.saveAccount(account) }
    }

    fun deleteAccount(id: String) {
        viewModelScope.launch { repository.deleteAccount(id) }
    }

    fun saveCategory(category: CategoryEntity) {
        viewModelScope.launch { repository.saveCategory(category) }
    }

    fun deleteCategory(id: String) {
        viewModelScope.launch { repository.deleteCategory(id) }
    }

    fun saveLoan(loan: LoanEntity) {
        viewModelScope.launch { repository.saveLoan(loan) }
    }

    fun recordLoanPayment(loanId: String, amount: Double) {
        viewModelScope.launch { repository.recordLoanPayment(loanId, amount) }
    }

    fun deleteLoan(id: String) {
        viewModelScope.launch { repository.deleteLoan(id) }
    }

    fun saveBudgetConfig(config: BudgetConfigEntity) {
        viewModelScope.launch {
            repository.saveBudgetConfig(config)
            updateWidget()
        }
    }

    fun deleteBudgetConfig() {
        viewModelScope.launch {
            repository.deleteBudgetConfig()
            updateWidget()
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch { repository.setThemeMode(mode) }
    }

    fun setOnboardingCompleted(completed: Boolean) {
        viewModelScope.launch { repository.setOnboardingCompleted(completed) }
    }

    fun createHousehold() {
        viewModelScope.launch {
            val code = syncEngine.generateHouseholdCode()
            syncEngine.createHousehold(code)
        }
    }

    fun joinHousehold(code: String) {
        viewModelScope.launch {
            syncEngine.joinHousehold(code)
        }
    }

    fun startFreshWipe() {
        viewModelScope.launch {
            repository.startFreshWipe()
            updateWidget()
        }
    }

    private suspend fun updateWidget() {
        try {
            SpendDailyGlanceWidget().updateAll(appContext)
        } catch (e: Exception) {
            // Silently handle widget update outside launcher process
        }
    }

    class Factory(
        private val repository: SpendDailyRepository,
        private val syncEngine: FirebaseSyncEngine,
        private val context: Context
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return MainViewModel(repository, syncEngine, context) as T
        }
    }
}
