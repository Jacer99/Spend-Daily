package com.spenddaily.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.spenddaily.app.domain.model.AllocationMode
import com.spenddaily.app.domain.model.CycleType
import com.spenddaily.app.domain.model.LoanType
import com.spenddaily.app.domain.model.TransactionType

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val type: String = "cash", // cash, bank, card, savings
    val balance: Double = 0.0,
    val currency: String = "TND",
    val includeInBalance: Boolean = true,
    val colorHex: String = "#007AFF",
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val type: String = "expense", // expense, income
    val iconName: String = "tag",
    val colorHex: String = "#FF9500",
    val budgetLimit: Double? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(
            entity = AccountEntity::class,
            parentColumns = ["id"],
            childColumns = ["accountId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = CategoryEntity::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [
        Index(value = ["accountId"]),
        Index(value = ["categoryId"]),
        Index(value = ["timestamp"])
    ]
)
data class TransactionEntity(
    @PrimaryKey
    val id: String,
    val type: TransactionType,
    val amount: Double,
    val title: String,
    val note: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val accountId: String,
    val toAccountId: String? = null,
    val categoryId: String? = null,
    val allocationMode: AllocationMode = AllocationMode.TODAY,
    val isSynced: Boolean = false,
    val householdCode: String? = null
)

@Entity(
    tableName = "loans",
    indices = [Index(value = ["dueDate"])]
)
data class LoanEntity(
    @PrimaryKey
    val id: String,
    val type: LoanType,
    val counterparty: String,
    val amount: Double,
    val paidAmount: Double = 0.0,
    val title: String,
    val dueDate: Long? = null,
    val note: String? = null,
    val accountId: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "budget_config")
data class BudgetConfigEntity(
    @PrimaryKey
    val id: String = "default_budget",
    val cycleType: CycleType = CycleType.MONTHLY,
    val totalBudget: Double = 1500.0,
    val salaryCycleDay: Int = 1,
    val weeklyStartDay: Int = 1, // 1 = Monday
    val currency: String = "TND",
    val isConfigured: Boolean = true,
    val updatedAt: Long = System.currentTimeMillis()
)
