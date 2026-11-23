package com.hyowon.smsbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsIncomingReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        if (!BridgePrefs.isEnabled(context)) return

        // 즉시 수신 문자 파싱 후 서비스 동기화 트리거
        try {
            val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (!msgs.isNullOrEmpty()) {
                val sender = msgs.firstOrNull()?.originatingAddress ?: ""
                val fullBody = msgs.joinToString("") { it.displayMessageBody ?: "" }.trim()
                if (sender.isNotBlank() && fullBody.isNotBlank()) {
                    SmsBridgeService.enqueueImmediateInbound(context, sender, fullBody)
                    return
                }
            }
        } catch (_: Exception) {
        }

        SmsBridgeService.nudgeSync(context)
    }
}
