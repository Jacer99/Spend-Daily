package com.spenddaily.app.data.sync

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.spenddaily.app.data.local.dao.*
import com.spenddaily.app.data.local.entity.AccountEntity
import com.spenddaily.app.data.local.entity.CategoryEntity
import com.spenddaily.app.data.local.entity.TransactionEntity
import com.spenddaily.app.domain.model.AllocationMode
import com.spenddaily.app.domain.model.TransactionType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.security.SecureRandom

class FirebaseSyncEngine(
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth,
    private val accountDao: AccountDao,
    private val categoryDao: CategoryDao,
    private val transactionDao: TransactionDao,
    private val scope: CoroutineScope,
    private val onDataSynced: () -> Unit = {}
) {

    private var remoteListener: ListenerRegistration? = null
    private val _syncState = MutableStateFlow<SyncState>(SyncState.Idle)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    sealed class SyncState {
        object Idle : SyncState()
        object Syncing : SyncState()
        data class Connected(val householdCode: String, val role: String) : SyncState()
        data class Error(val message: String) : SyncState()
    }

    /**
     * Generates a random uppercase 6-character household invite code.
     */
    fun generateHouseholdCode(): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val random = SecureRandom()
        return (1..6).map { chars[random.nextInt(chars.length)] }.joinToString("")
    }

    /**
     * Creates a new household space in Cloud Firestore with the current user as Creator.
     */
    suspend fun createHousehold(code: String): Result<String> {
        return try {
            val user = auth.currentUser ?: throw IllegalStateException("User not authenticated")
            val householdData = hashMapOf(
                "code" to code,
                "creatorUid" to user.uid,
                "creatorEmail" to (user.email ?: ""),
                "members" to listOf(user.uid),
                "memberEmails" to listOfNotNull(user.email),
                "createdAt" to System.currentTimeMillis()
            )
            firestore.collection("households").document(code).set(householdData).await()
            startListening(code)
            _syncState.value = SyncState.Connected(code, "Creator")
            Result.success(code)
        } catch (e: Exception) {
            _syncState.value = SyncState.Error(e.message ?: "Failed to create household")
            Result.failure(e)
        }
    }

    /**
     * Joins an existing household space via 6-character code.
     */
    suspend fun joinHousehold(code: String): Result<Unit> {
        return try {
            val user = auth.currentUser ?: throw IllegalStateException("User not authenticated")
            val docRef = firestore.collection("households").document(code)
            val snapshot = docRef.get().await()

            if (!snapshot.exists()) {
                return Result.failure(IllegalArgumentException("Invalid Household Code. Please verify with your partner."))
            }

            @Suppress("UNCHECKED_CAST")
            val currentMembers = snapshot.get("members") as? MutableList<String> ?: mutableListOf()
            if (!currentMembers.contains(user.uid)) {
                currentMembers.add(user.uid)
                docRef.update("members", currentMembers).await()
            }

            user.email?.let { email ->
                @Suppress("UNCHECKED_CAST")
                val memberEmails = snapshot.get("memberEmails") as? MutableList<String> ?: mutableListOf()
                if (!memberEmails.contains(email)) {
                    memberEmails.add(email)
                    docRef.update("memberEmails", memberEmails).await()
                }
            }

            startListening(code)
            _syncState.value = SyncState.Connected(code, "Member")
            Result.success(Unit)
        } catch (e: Exception) {
            _syncState.value = SyncState.Error(e.message ?: "Failed to join household")
            Result.failure(e)
        }
    }

    /**
     * Starts listening to real-time Firestore changes for this household.
     */
    fun startListening(householdCode: String) {
        remoteListener?.remove()

        val transactionsRef = firestore.collection("households")
            .document(householdCode)
            .collection("transactions")

        remoteListener = transactionsRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                _syncState.value = SyncState.Error(error.message ?: "Sync error")
                return@addSnapshotListener
            }

            snapshot?.documentChanges?.let { changes ->
                scope.launch(Dispatchers.IO) {
                    changes.forEach { change ->
                        val doc = change.document
                        val entity = parseTransactionEntity(doc, householdCode)
                        transactionDao.insertTransaction(entity)
                    }
                    onDataSynced()
                }
            }
        }
    }

    /**
     * Pushes a local transaction to Firestore for the household.
     */
    suspend fun pushTransaction(tx: TransactionEntity, householdCode: String) {
        try {
            val data = hashMapOf(
                "id" to tx.id,
                "type" to tx.type.name,
                "amount" to tx.amount,
                "title" to tx.title,
                "note" to (tx.note ?: ""),
                "timestamp" to tx.timestamp,
                "accountId" to tx.accountId,
                "toAccountId" to (tx.toAccountId ?: ""),
                "categoryId" to (tx.categoryId ?: ""),
                "allocationMode" to tx.allocationMode.name,
                "householdCode" to householdCode,
                "syncedBy" to (auth.currentUser?.email ?: "offline")
            )

            firestore.collection("households")
                .document(householdCode)
                .collection("transactions")
                .document(tx.id)
                .set(data)
                .await()
        } catch (e: Exception) {
            // Silently queue or log in production
        }
    }

    /**
     * Wipes remote cloud records associated with this user on "Start Fresh".
     */
    suspend fun wipeRemoteHousehold(householdCode: String) {
        try {
            remoteListener?.remove()
            val txCol = firestore.collection("households").document(householdCode).collection("transactions")
            val docs = txCol.get().await()
            for (doc in docs) {
                doc.reference.delete().await()
            }
            firestore.collection("households").document(householdCode).delete().await()
            _syncState.value = SyncState.Idle
        } catch (e: Exception) {
            // Continue wipe
        }
    }

    private fun parseTransactionEntity(doc: DocumentSnapshot, householdCode: String): TransactionEntity {
        val typeStr = doc.getString("type") ?: "EXPENSE"
        val allocationStr = doc.getString("allocationMode") ?: "TODAY"

        return TransactionEntity(
            id = doc.getString("id") ?: doc.id,
            type = try { TransactionType.valueOf(typeStr) } catch (e: Exception) { TransactionType.EXPENSE },
            amount = doc.getDouble("amount") ?: 0.0,
            title = doc.getString("title") ?: "Expense",
            note = doc.getString("note"),
            timestamp = doc.getLong("timestamp") ?: System.currentTimeMillis(),
            accountId = doc.getString("accountId") ?: "acc_cash",
            toAccountId = doc.getString("toAccountId")?.takeIf { it.isNotBlank() },
            categoryId = doc.getString("categoryId")?.takeIf { it.isNotBlank() },
            allocationMode = try { AllocationMode.valueOf(allocationStr) } catch (e: Exception) { AllocationMode.TODAY },
            isSynced = true,
            householdCode = householdCode
        )
    }

    fun stop() {
        remoteListener?.remove()
        remoteListener = null
    }
}
