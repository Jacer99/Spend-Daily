package com.spenddaily.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.spenddaily.app.data.local.entity.BudgetConfigEntity
import com.spenddaily.app.domain.model.CycleType
import com.spenddaily.app.domain.model.ThemeMode
import com.spenddaily.app.domain.model.TransactionType
import com.spenddaily.app.ui.screens.*
import com.spenddaily.app.ui.theme.AccentPrimary
import com.spenddaily.app.ui.theme.AccentSuccess
import com.spenddaily.app.viewmodel.MainViewModel
import kotlinx.coroutines.launch

enum class Screen {
    HOME,
    ANALYTICS,
    ACCOUNTS,
    LOANS,
    SETTINGS,
    ADD_TRANSACTION,
    WIZARD
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var currentScreen by remember { mutableStateOf(Screen.HOME) }
    var addTransactionType by remember { mutableStateOf(TransactionType.EXPENSE) }
    var analyticsInitialTab by remember { mutableStateOf("expense") }

    // State from ViewModel
    val allowance by viewModel.dailyAllowance.collectAsState()
    val budgetConfig by viewModel.budgetConfig.collectAsState()
    val accounts by viewModel.accounts.collectAsState(initial = emptyList())
    val categories by viewModel.categories.collectAsState(initial = emptyList())
    val transactions by viewModel.transactions.collectAsState(initial = emptyList())
    val loans by viewModel.loans.collectAsState(initial = emptyList())
    val currency by viewModel.currency.collectAsState()
    val themeMode by viewModel.themeMode.collectAsState()
    val householdCode by viewModel.householdCode.collectAsState()
    val onboardingCompleted by viewModel.onboardingCompleted.collectAsState()

    var showBudgetConfigModal by remember { mutableStateOf(false) }

    val todayTxs = remember(transactions) {
        val startOfToday = java.time.LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
        transactions.filter { it.timestamp >= startOfToday }
    }

    if (!onboardingCompleted) {
        FirstLaunchWizardScreen(
            currency = currency,
            onCompleteWizard = { budget, cycle, payday ->
                viewModel.saveBudgetConfig(
                    BudgetConfigEntity(
                        id = "default_budget",
                        cycleType = cycle,
                        totalBudget = budget,
                        salaryCycleDay = payday,
                        currency = currency,
                        isConfigured = true
                    )
                )
                viewModel.setOnboardingCompleted(true)
            }
        )
        return
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        bottomBar = {
            if (currentScreen != Screen.ADD_TRANSACTION && currentScreen != Screen.WIZARD) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        shape = RoundedCornerShape(32.dp),
                        color = MaterialTheme.colorScheme.surface,
                        tonalElevation = 8.dp,
                        shadowElevation = 10.dp,
                        modifier = Modifier
                            .widthIn(max = 500.dp)
                            .fillMaxWidth()
                            .height(64.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 12.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Home Tab
                            IconButton(onClick = { currentScreen = Screen.HOME }) {
                                Icon(
                                    Icons.Default.Home,
                                    contentDescription = "Home",
                                    tint = if (currentScreen == Screen.HOME) AccentPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            // Analytics Tab
                            IconButton(onClick = {
                                analyticsInitialTab = "expense"
                                currentScreen = Screen.ANALYTICS
                            }) {
                                Icon(
                                    Icons.Default.BarChart,
                                    contentDescription = "Analytics",
                                    tint = if (currentScreen == Screen.ANALYTICS) AccentPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            // Center Floating Action Button (Record Transaction)
                            FloatingActionButton(
                                onClick = {
                                    addTransactionType = TransactionType.EXPENSE
                                    currentScreen = Screen.ADD_TRANSACTION
                                },
                                shape = CircleShape,
                                containerColor = AccentPrimary,
                                contentColor = Color.White,
                                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp),
                                modifier = Modifier.size(48.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Record")
                            }

                            // Accounts Tab
                            IconButton(onClick = { currentScreen = Screen.ACCOUNTS }) {
                                Icon(
                                    Icons.Default.AccountBalance,
                                    contentDescription = "Accounts",
                                    tint = if (currentScreen == Screen.ACCOUNTS) AccentPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            // Settings Tab
                            IconButton(onClick = { currentScreen = Screen.SETTINGS }) {
                                Icon(
                                    Icons.Default.Settings,
                                    contentDescription = "Settings",
                                    tint = if (currentScreen == Screen.SETTINGS) AccentPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentScreen) {
                Screen.HOME -> HomeScreen(
                    allowance = allowance,
                    budgetConfig = budgetConfig,
                    accounts = accounts,
                    todayTransactions = todayTxs,
                    currency = currency,
                    onNavigateToAddTransaction = { type ->
                        addTransactionType = type
                        currentScreen = Screen.ADD_TRANSACTION
                    },
                    onNavigateToAnalytics = { tab ->
                        analyticsInitialTab = tab
                        currentScreen = Screen.ANALYTICS
                    },
                    onOpenBudgetSetup = { showBudgetConfigModal = true },
                    onOpenCoupleSync = { currentScreen = Screen.SETTINGS }
                )

                Screen.ADD_TRANSACTION -> AddTransactionScreen(
                    initialType = addTransactionType,
                    accounts = accounts,
                    categories = categories,
                    currency = currency,
                    onSaveTransaction = { tx ->
                        viewModel.recordTransaction(tx)
                        currentScreen = Screen.HOME
                    },
                    onBack = { currentScreen = Screen.HOME }
                )

                Screen.ANALYTICS -> AnalyticsScreen(
                    initialTab = analyticsInitialTab,
                    transactions = transactions,
                    categories = categories,
                    currency = currency,
                    onBack = { currentScreen = Screen.HOME }
                )

                Screen.ACCOUNTS -> AccountsScreen(
                    accounts = accounts,
                    currency = currency,
                    onSaveAccount = { viewModel.saveAccount(it) },
                    onDeleteAccount = { viewModel.deleteAccount(it) },
                    onBack = { currentScreen = Screen.HOME }
                )

                Screen.LOANS -> LoansScreen(
                    loans = loans,
                    currency = currency,
                    onSaveLoan = { viewModel.saveLoan(it) },
                    onRecordPayment = { id, amount -> viewModel.recordLoanPayment(id, amount) },
                    onDeleteLoan = { viewModel.deleteLoan(it) },
                    onBack = { currentScreen = Screen.HOME }
                )

                Screen.SETTINGS -> SettingsScreen(
                    currentTheme = themeMode,
                    householdCode = householdCode,
                    currency = currency,
                    onSelectTheme = { viewModel.setThemeMode(it) },
                    onCreateHousehold = { viewModel.createHousehold() },
                    onJoinHousehold = { viewModel.joinHousehold(it) },
                    onStartFreshWipe = { viewModel.startFreshWipe() },
                    onBack = { currentScreen = Screen.HOME }
                )

                Screen.WIZARD -> FirstLaunchWizardScreen(
                    currency = currency,
                    onCompleteWizard = { budget, cycle, payday ->
                        viewModel.saveBudgetConfig(
                            BudgetConfigEntity(
                                id = "default_budget",
                                cycleType = cycle,
                                totalBudget = budget,
                                salaryCycleDay = payday,
                                currency = currency,
                                isConfigured = true
                            )
                        )
                        viewModel.setOnboardingCompleted(true)
                        currentScreen = Screen.HOME
                    }
                )
            }
        }

        // Budget Config Dialog
        if (showBudgetConfigModal) {
            var budgetInput by remember { mutableStateOf(budgetConfig?.totalBudget?.toString() ?: "1200") }
            var cycleType by remember { mutableStateOf(budgetConfig?.cycleType ?: CycleType.MONTHLY) }
            var paydayInput by remember { mutableStateOf(budgetConfig?.salaryCycleDay?.toString() ?: "1") }

            AlertDialog(
                onDismissRequest = { showBudgetConfigModal = false },
                title = { Text("Configure Daily Allowance") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = budgetInput,
                            onValueChange = { budgetInput = it },
                            label = { Text("Total Budget ($currency)") },
                            singleLine = true
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = cycleType == CycleType.MONTHLY,
                                onClick = { cycleType = CycleType.MONTHLY },
                                label = { Text("Monthly Salary") }
                            )
                            FilterChip(
                                selected = cycleType == CycleType.WEEKLY,
                                onClick = { cycleType = CycleType.WEEKLY },
                                label = { Text("Weekly") }
                            )
                        }
                        if (cycleType == CycleType.MONTHLY) {
                            OutlinedTextField(
                                value = paydayInput,
                                onValueChange = { paydayInput = it },
                                label = { Text("Payday (1-28)") },
                                singleLine = true
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val budget = budgetInput.toDoubleOrNull() ?: 1200.0
                            val payday = paydayInput.toIntOrNull() ?: 1
                            viewModel.saveBudgetConfig(
                                BudgetConfigEntity(
                                    id = "default_budget",
                                    cycleType = cycleType,
                                    totalBudget = budget,
                                    salaryCycleDay = payday,
                                    currency = currency,
                                    isConfigured = true
                                )
                            )
                            showBudgetConfigModal = false
                        }
                    ) {
                        Text("Save")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showBudgetConfigModal = false }) { Text("Cancel") }
                }
            )
        }
    }
}
