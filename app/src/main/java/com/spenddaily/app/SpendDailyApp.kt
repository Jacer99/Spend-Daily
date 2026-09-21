package com.spenddaily.app

import android.app.Application
import androidx.glance.appwidget.updateAll
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.spenddaily.app.data.local.dao.AppDatabase
import com.spenddaily.app.data.preferences.DataStoreManager
import com.spenddaily.app.data.repository.SpendDailyRepository
import com.spenddaily.app.data.sync.FirebaseSyncEngine
import com.spenddaily.app.widget.SpendDailyGlanceWidget
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class SpendDailyApp : Application() {

    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database by lazy { AppDatabase.getDatabase(this, applicationScope) }
    val dataStoreManager by lazy { DataStoreManager(this) }

    val syncEngine by lazy {
        FirebaseSyncEngine(
            firestore = FirebaseFirestore.getInstance(),
            auth = FirebaseAuth.getInstance(),
            accountDao = database.accountDao(),
            categoryDao = database.categoryDao(),
            transactionDao = database.transactionDao(),
            scope = applicationScope,
            onDataSynced = {
                // Whenever partner syncs new transactions, update launcher widget immediately
                applicationScope.launch {
                    try {
                        SpendDailyGlanceWidget().updateAll(this@SpendDailyApp)
                    } catch (e: Exception) {
                        // Ignore widget update errors in background
                    }
                }
            }
        )
    }

    val repository by lazy {
        SpendDailyRepository(
            database = database,
            dataStoreManager = dataStoreManager,
            syncEngine = syncEngine,
            scope = applicationScope
        )
    }

    override fun onCreate() {
        super.onCreate()
    }
}
