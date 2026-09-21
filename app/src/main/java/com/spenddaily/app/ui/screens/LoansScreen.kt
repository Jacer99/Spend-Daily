package com.spenddaily.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.spenddaily.app.data.local.entity.LoanEntity
import com.spenddaily.app.domain.model.LoanType
import com.spenddaily.app.ui.theme.AccentPrimary
import com.spenddaily.app.ui.theme.AccentSuccess
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoansScreen(
    loans: List<LoanEntity>,
    currency: String,
    onSaveLoan: (LoanEntity) -> Unit,
    onRecordPayment: (String, Double) -> Unit,
    onDeleteLoan: (String) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf<LoanType?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }
    var payingLoanId by remember { mutableStateOf<String?>(null) }

    val filteredLoans = if (selectedFilter == null) loans else loans.filter { it.type == selectedFilter }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 600.dp)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                    Text(
                        text = "Debts & Loans",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Loan", tint = AccentPrimary)
                    }
                }
            }

            // Top Filter Chips: All, Bank Loans, People who owe me, I owe
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedFilter == null,
                        onClick = { selectedFilter = null },
                        label = { Text("All") }
                    )
                    FilterChip(
                        selected = selectedFilter == LoanType.BANK,
                        onClick = { selectedFilter = LoanType.BANK },
                        label = { Text("Bank") }
                    )
                    FilterChip(
                        selected = selectedFilter == LoanType.LENT,
                        onClick = { selectedFilter = LoanType.LENT },
                        label = { Text("Owed to me") }
                    )
                    FilterChip(
                        selected = selectedFilter == LoanType.BORROWED,
                        onClick = { selectedFilter = LoanType.BORROWED },
                        label = { Text("I owe") }
                    )
                }
            }

            // Loan List Items
            if (filteredLoans.isEmpty()) {
                item {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier.padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No loans or debts in this category.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            } else {
                items(filteredLoans, key = { it.id }) { loan ->
                    val progress = if (loan.amount > 0) (loan.paidAmount / loan.amount).toFloat().coerceIn(0f, 1f) else 0f
                    val remaining = (loan.amount - loan.paidAmount).coerceAtLeast(0.0)

                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = loan.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "${loan.counterparty} • ${when (loan.type) {
                                            LoanType.BANK -> "Bank Loan"
                                            LoanType.LENT -> "Lent to person"
                                            LoanType.BORROWED -> "Borrowed from person"
                                        }}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                IconButton(onClick = { onDeleteLoan(loan.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                }
                            }

                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = AccentSuccess,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Paid: ${String.format(Locale.US, "%.2f", loan.paidAmount)} / ${String.format(Locale.US, "%.2f", loan.amount)} $currency",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Button(
                                    onClick = { payingLoanId = loan.id },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
                                ) {
                                    Text("Pay")
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add Loan Dialog
        if (showAddDialog) {
            var newTitle by remember { mutableStateOf("") }
            var newCounterparty by remember { mutableStateOf("") }
            var newAmount by remember { mutableStateOf("") }
            var newType by remember { mutableStateOf(LoanType.BANK) }

            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Debt or Loan") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = newTitle,
                            onValueChange = { newTitle = it },
                            label = { Text("Title") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = newCounterparty,
                            onValueChange = { newCounterparty = it },
                            label = { Text("Person or Bank Name") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = newAmount,
                            onValueChange = { newAmount = it },
                            label = { Text("Total Amount ($currency)") },
                            singleLine = true
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(selected = newType == LoanType.BANK, onClick = { newType = LoanType.BANK }, label = { Text("Bank") })
                            FilterChip(selected = newType == LoanType.LENT, onClick = { newType = LoanType.LENT }, label = { Text("Lent") })
                            FilterChip(selected = newType == LoanType.BORROWED, onClick = { newType = LoanType.BORROWED }, label = { Text("Borrowed") })
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val amount = newAmount.toDoubleOrNull() ?: 0.0
                            if (newTitle.isNotBlank() && amount > 0) {
                                onSaveLoan(
                                    LoanEntity(
                                        id = "loan_${System.currentTimeMillis()}",
                                        type = newType,
                                        counterparty = newCounterparty.ifBlank { "Personal" },
                                        amount = amount,
                                        paidAmount = 0.0,
                                        title = newTitle.trim()
                                    )
                                )
                                showAddDialog = false
                            }
                        }
                    ) {
                        Text("Add")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddDialog = false }) { Text("Cancel") }
                }
            )
        }

        // Record Payment Dialog
        payingLoanId?.let { loanId ->
            var paymentAmountInput by remember { mutableStateOf("") }

            AlertDialog(
                onDismissRequest = { payingLoanId = null },
                title = { Text("Record Payment") },
                text = {
                    OutlinedTextField(
                        value = paymentAmountInput,
                        onValueChange = { paymentAmountInput = it },
                        label = { Text("Payment Amount ($currency)") },
                        singleLine = true
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val amount = paymentAmountInput.toDoubleOrNull() ?: 0.0
                            if (amount > 0) {
                                onRecordPayment(loanId, amount)
                                payingLoanId = null
                            }
                        }
                    ) {
                        Text("Confirm Payment")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { payingLoanId = null }) { Text("Cancel") }
                }
            )
        }
    }
}
