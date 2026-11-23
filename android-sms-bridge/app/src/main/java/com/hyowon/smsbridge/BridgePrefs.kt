package com.hyowon.smsbridge

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object BridgePrefs {
    private const val PREF_NAME = "hyowon_sms_bridge_prefs"
    const val KEY_SERVER_URL = "server_url"
    const val KEY_SECRET = "secret"
    const val KEY_ENABLED = "enabled"
    const val KEY_LAST_SMS_ID = "last_sms_id"
    const val KEY_LAST_MMS_ID = "last_mms_id"
    const val KEY_LOGS = "activity_logs"
    const val KEY_STATUS_TEXT = "status_text"

    const val DEFAULT_SERVER_URL = "https://elated-fish-742.convex.site"

    fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun getServerUrl(context: Context): String {
        val raw = prefs(context).getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        return raw.trim().trimEnd('/')
    }

    fun getSecret(context: Context): String =
        (prefs(context).getString(KEY_SECRET, "") ?: "").trim()

    fun saveConfig(context: Context, serverUrl: String, secret: String) {
        prefs(context).edit()
            .putString(KEY_SERVER_URL, serverUrl.trim().trimEnd('/'))
            .putString(KEY_SECRET, secret.trim())
            .apply()
    }

    fun isEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_ENABLED, false)

    fun setEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
    }

    fun getLastSmsId(context: Context): Long =
        prefs(context).getLong(KEY_LAST_SMS_ID, -1L)

    fun setLastSmsId(context: Context, id: Long) {
        prefs(context).edit().putLong(KEY_LAST_SMS_ID, id).apply()
    }

    fun getLastMmsId(context: Context): Long =
        prefs(context).getLong(KEY_LAST_MMS_ID, -1L)

    fun setLastMmsId(context: Context, id: Long) {
        prefs(context).edit().putLong(KEY_LAST_MMS_ID, id).apply()
    }

    fun setStatusText(context: Context, status: String) {
        prefs(context).edit().putString(KEY_STATUS_TEXT, status).apply()
    }

    fun getStatusText(context: Context): String =
        prefs(context).getString(KEY_STATUS_TEXT, "대기 중") ?: "대기 중"

    @Synchronized
    fun appendLog(context: Context, line: String) {
        val stamp = SimpleDateFormat("HH:mm:ss", Locale.KOREA).format(Date())
        val current = prefs(context).getString(KEY_LOGS, "") ?: ""
        val lines = if (current.isBlank()) emptyList() else current.split("\n")
        val updated = (lines + "[$stamp] $line").takeLast(40).joinToString("\n")
        prefs(context).edit().putString(KEY_LOGS, updated).apply()
    }

    fun getLogs(context: Context): String =
        prefs(context).getString(KEY_LOGS, "아직 기록이 없습니다.") ?: ""
}
