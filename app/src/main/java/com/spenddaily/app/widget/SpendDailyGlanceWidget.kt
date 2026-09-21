package com.spenddaily.app.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.*
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.spenddaily.app.MainActivity
import com.spenddaily.app.SpendDailyApp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import java.util.Locale

class SpendDailyGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val app = context.applicationContext as SpendDailyApp
        val allowance = app.repository.dailyAllowanceFlow.first()
        val currency = app.repository.currencyFlow.first()

        provideContent {
            GlanceThemeContent(
                safeToSpend = allowance.safeToSpendToday,
                tomorrow = allowance.tomorrowProjection,
                daysLeft = allowance.remainingDaysInCycle,
                currency = currency,
                isOverspent = allowance.isOverspent
            )
        }
    }

    @Composable
    private fun GlanceThemeContent(
        safeToSpend: Double,
        tomorrow: Double,
        daysLeft: Int,
        currency: String,
        isOverspent: Boolean
    ) {
        val openAppIntent = Intent(Intent.ACTION_VIEW, Uri.parse("spenddaily://app/home")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val openIncomeIntent = Intent(Intent.ACTION_VIEW, Uri.parse("spenddaily://app/add?type=income")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val openExpenseIntent = Intent(Intent.ACTION_VIEW, Uri.parse("spenddaily://app/add?type=expense")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val openTransferIntent = Intent(Intent.ACTION_VIEW, Uri.parse("spenddaily://app/add?type=transfer")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        // Frosted container with 24dp corner radius
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .cornerRadius(24.dp)
                .background(ColorProvider(Color(0xE6131B2E), Color(0xF2FFFFFF)))
                .padding(16.dp)
                .clickable(actionStartActivity(openAppIntent))
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                // Header: SAFE TO SPEND TODAY
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.Start,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = "SAFE TO SPEND TODAY",
                        style = TextStyle(
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = ColorProvider(Color(0xFF94A3B8), Color(0xFF64748B))
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(6.dp))

                // Hero Allowance Number (Calm 0.00 on overspend)
                Row(
                    verticalAlignment = Alignment.Vertical.Bottom
                ) {
                    Text(
                        text = String.format(Locale.US, "%.2f", if (isOverspent) 0.0 else safeToSpend),
                        style = TextStyle(
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            color = ColorProvider(
                                if (isOverspent) Color(0xFF94A3B8) else Color(0xFF00BFA5),
                                if (isOverspent) Color(0xFF64748B) else Color(0xFF00897B)
                            )
                        )
                    )
                    Spacer(modifier = GlanceModifier.width(6.dp))
                    Text(
                        text = currency,
                        style = TextStyle(
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = ColorProvider(Color(0xFF94A3B8), Color(0xFF64748B))
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(4.dp))

                // Badges: Tomorrow Projection & Remaining Days
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = "Tomorrow: +${String.format(Locale.US, "%.2f", tomorrow)} $currency",
                        style = TextStyle(
                            fontSize = 10.sp,
                            color = ColorProvider(Color(0xFF34C759), Color(0xFF2E7D32))
                        )
                    )
                    Spacer(modifier = GlanceModifier.width(12.dp))
                    Text(
                        text = "$daysLeft days left",
                        style = TextStyle(
                            fontSize = 10.sp,
                            color = ColorProvider(Color(0xFF94A3B8), Color(0xFF64748B))
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(10.dp))

                // 3 Quick Action Buttons: Income (↓), Expense (↑), Transfer (⇄)
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    // Income Quick Action
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .height(36.dp)
                            .cornerRadius(12.dp)
                            .background(ColorProvider(Color(0x3334C759), Color(0x2634C759)))
                            .clickable(actionStartActivity(openIncomeIntent)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "↓ Income",
                            style = TextStyle(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ColorProvider(Color(0xFF34C759), Color(0xFF1B5E20))
                            )
                        )
                    }

                    Spacer(modifier = GlanceModifier.width(8.dp))

                    // Expense Quick Action
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .height(36.dp)
                            .cornerRadius(12.dp)
                            .background(ColorProvider(Color(0x33FF3B30), Color(0x26FF3B30)))
                            .clickable(actionStartActivity(openExpenseIntent)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "↑ Expense",
                            style = TextStyle(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ColorProvider(Color(0xFFFF3B30), Color(0xFFC62828))
                            )
                        )
                    }

                    Spacer(modifier = GlanceModifier.width(8.dp))

                    // Transfer Quick Action
                    Box(
                        modifier = GlanceModifier
                            .defaultWeight()
                            .height(36.dp)
                            .cornerRadius(12.dp)
                            .background(ColorProvider(Color(0x33AF52DE), Color(0x26AF52DE)))
                            .clickable(actionStartActivity(openTransferIntent)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "⇄ Transfer",
                            style = TextStyle(
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ColorProvider(Color(0xFFAF52DE), Color(0xFF6A1B9A))
                            )
                        )
                    }
                }
            }
        }
    }
}
