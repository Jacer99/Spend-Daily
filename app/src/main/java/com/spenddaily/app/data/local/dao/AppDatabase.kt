package com.spenddaily.app.data.local.dao

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.spenddaily.app.data.local.entity.*
import com.spenddaily.app.domain.model.CycleType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        AccountEntity::class,
        CategoryEntity::class,
        TransactionEntity::class,
        LoanEntity::class,
        BudgetConfigEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun accountDao(): AccountDao
    abstract fun categoryDao(): CategoryDao
    abstract fun transactionDao(): TransactionDao
    abstract fun loanDao(): LoanDao
    abstract fun budgetConfigDao(): BudgetConfigDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "spend_daily_database"
                )
                    .addCallback(DatabaseCallback(scope))
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        seedDatabase(database)
                    }
                }
            }
        }

        suspend fun seedDatabase(database: AppDatabase) {
            val accountDao = database.accountDao()
            val categoryDao = database.categoryDao()
            val budgetConfigDao = database.budgetConfigDao()

            // Seed Initial Accounts
            val defaultAccounts = listOf(
                AccountEntity(id = "acc_cash", name = "Cash Wallet", type = "cash", balance = 350.0, currency = "TND", includeInBalance = true, colorHex = "#34C759"),
                AccountEntity(id = "acc_bank", name = "Attijari Bank", type = "bank", balance = 2400.0, currency = "TND", includeInBalance = true, colorHex = "#007AFF"),
                AccountEntity(id = "acc_card", name = "Savings Vault", type = "savings", balance = 5000.0, currency = "TND", includeInBalance = false, colorHex = "#AF52DE")
            )
            accountDao.insertAccounts(defaultAccounts)

            // Seed Initial Categories
            val defaultCategories = listOf(
                CategoryEntity(id = "cat_groceries", name = "Groceries & Market", type = "expense", iconName = "shopping-cart", colorHex = "#34C759", budgetLimit = 400.0),
                CategoryEntity(id = "cat_dining", name = "Cafes & Dining", type = "expense", iconName = "coffee", colorHex = "#FF9500", budgetLimit = 250.0),
                CategoryEntity(id = "cat_transport", name = "Fuel & Transport", type = "expense", iconName = "car", colorHex = "#007AFF", budgetLimit = 180.0),
                CategoryEntity(id = "cat_housing", name = "Rent & Bills", type = "expense", iconName = "home", colorHex = "#5856D6", budgetLimit = 800.0),
                CategoryEntity(id = "cat_health", name = "Pharmacy & Medical", type = "expense", iconName = "heart", colorHex = "#FF2D55", budgetLimit = 100.0),
                CategoryEntity(id = "cat_salary", name = "Monthly Salary", type = "income", iconName = "briefcase", colorHex = "#34C759")
            )
            categoryDao.insertCategories(defaultCategories)

            // Seed Default Budget Config
            budgetConfigDao.setBudgetConfig(
                BudgetConfigEntity(
                    id = "default_budget",
                    cycleType = CycleType.MONTHLY,
                    totalBudget = 1200.0,
                    salaryCycleDay = 1,
                    currency = "TND",
                    isConfigured = true
                )
            )
        }
    }
}
