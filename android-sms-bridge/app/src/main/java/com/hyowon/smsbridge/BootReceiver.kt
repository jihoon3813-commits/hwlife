package com.hyowon.smsbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            if (BridgePrefs.isEnabled(context)) {
                try {
                    SmsBridgeService.start(context)
                } catch (e: Exception) {
                    BridgePrefs.appendLog(context, "부팅 자동 시작 대기: ${e.message}")
                }
            }
        }
    }
}
