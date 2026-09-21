package com.spenddaily.app.domain.model

enum class TransactionType {
    INCOME,
    EXPENSE,
    TRANSFER
}

enum class LoanType {
    BANK,
    LENT,      // People who owe me
    BORROWED   // I owe someone
}

enum class CycleType {
    MONTHLY,  // Salary cycle ending on user-defined day
    WEEKLY    // Strict Monday 00:00:00 to Sunday 23:59:59
}

enum class AllocationMode {
    TODAY,
    WEEK,
    MONTH
}

enum class ThemeMode {
    AUTO,
    LIGHT,
    DARK
}

data class DailyAllowanceCalculation(
    val safeToSpendToday: Double,
    val remainingBudget: Double,
    val totalBudget: Double,
    val remainingDaysInCycle: Int,
    val totalDaysInCycle: Int,
    val tomorrowProjection: Double,
    val spentToday: Double,
    val cycleType: CycleType,
    val isOverspent: Boolean,
    val cycleEndDateFormatted: String
)
