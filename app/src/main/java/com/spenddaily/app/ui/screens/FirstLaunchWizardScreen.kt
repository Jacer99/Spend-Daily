package com.spenddaily.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.spenddaily.app.domain.model.CycleType
import com.spenddaily.app.ui.theme.AccentPrimary
import com.spenddaily.app.ui.theme.AccentSuccess

@Composable
fun FirstLaunchWizardScreen(
    currency: String,
    onCompleteWizard: (Double, CycleType, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var step by remember { mutableStateOf(1) }
    var budgetInput by remember { mutableStateOf("1200") }
    var selectedCycle by remember { mutableStateOf(CycleType.MONTHLY) }
    var salaryDayInput by remember { mutableStateOf("1") }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .widthIn(max = 500.dp)
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                when (step) {
                    1 -> {
                        // Step 1: Welcome & Auth choice
                        Icon(
                            imageVector = Icons.Default.AccountBalanceWallet,
                            contentDescription = null,
                            tint = AccentPrimary,
                            modifier = Modifier.size(64.dp)
                        )
                        Text(
                            text = "Welcome to Spend Daily",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Eliminate money anxiety with one real-time daily safe-to-spend allowance.",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = { step = 2 },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentPrimary)
                        ) {
                            Text("Use Offline Account", fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { step = 2 },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Sign in with Google", fontWeight = FontWeight.Bold)
                        }
                    }
                    2 -> {
                        // Step 2: Configure Daily Allowance & Cycle
                        Text(
                            text = "Set Up Your Allowance",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Enter your disposable budget for this cycle. The app will automatically amortize it every single morning.",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        OutlinedTextField(
                            value = budgetInput,
                            onValueChange = { budgetInput = it },
                            label = { Text("Cycle Budget ($currency)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedCycle == CycleType.MONTHLY,
                                onClick = { selectedCycle = CycleType.MONTHLY },
                                label = { Text("Monthly Salary") },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = selectedCycle == CycleType.WEEKLY,
                                onClick = { selectedCycle = CycleType.WEEKLY },
                                label = { Text("Weekly Reset") },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (selectedCycle == CycleType.MONTHLY) {
                            OutlinedTextField(
                                value = salaryDayInput,
                                onValueChange = { salaryDayInput = it },
                                label = { Text("Payday (Day of month, 1-28)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                        }

                        Button(
                            onClick = {
                                val budget = budgetInput.toDoubleOrNull() ?: 1200.0
                                val day = salaryDayInput.toIntOrNull() ?: 1
                                onCompleteWizard(budget, selectedCycle, day)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentSuccess)
                        ) {
                            Text("Start Spending Daily", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
