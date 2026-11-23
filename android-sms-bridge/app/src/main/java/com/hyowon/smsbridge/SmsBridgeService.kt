package com.hyowon.smsbridge

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.telephony.SmsManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.util.UUID
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class SmsBridgeService : Service() {

    companion object {
        private const val CHANNEL_ID = "hyowon_sms_bridge_channel"
        private const val NOTIF_ID = 1001
        private const val ACTION_START = "com.hyowon.smsbridge.ACTION_START"
        private const val ACTION_STOP = "com.hyowon.smsbridge.ACTION_STOP"
        private const val ACTION_NUDGE = "com.hyowon.smsbridge.ACTION_NUDGE"
        private const val ACTION_IMMEDIATE_INBOUND = "com.hyowon.smsbridge.ACTION_IMMEDIATE_INBOUND"
        private const val EXTRA_PHONE = "extra_phone"
        private const val EXTRA_BODY = "extra_body"

        fun start(context: Context) {
            val intent = Intent(context, SmsBridgeService::class.java).apply {
                action = ACTION_START
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, SmsBridgeService::class.java).apply {
                action = ACTION_STOP
            }
            context.stopService(intent)
        }

        fun nudgeSync(context: Context) {
            if (!BridgePrefs.isEnabled(context)) return
            try {
                val intent = Intent(context, SmsBridgeService::class.java).apply {
                    action = ACTION_NUDGE
                }
                ContextCompat.startForegroundService(context, intent)
            } catch (_: Exception) {
            }
        }

        fun enqueueImmediateInbound(context: Context, phone: String, body: String) {
            if (!BridgePrefs.isEnabled(context)) return
            try {
                val intent = Intent(context, SmsBridgeService::class.java).apply {
                    action = ACTION_IMMEDIATE_INBOUND
                    putExtra(EXTRA_PHONE, phone)
                    putExtra(EXTRA_BODY, body)
                }
                ContextCompat.startForegroundService(context, intent)
            } catch (_: Exception) {
            }
        }
    }

    private var executor: ScheduledExecutorService? = null
    private val isTickRunning = AtomicBoolean(false)
    private val immediateInboundQueue = ConcurrentLinkedQueue<SyncItem>()
    private var smsObserver: ContentObserver? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val nudgeRunnable = Runnable { triggerImmediateTick() }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startAsForeground("어드민 서버와 연결 준비 중...")
        SmsMmsScanner.ensureBaselineInitialized(this)
        registerSmsContentObserver()
        startWorkerLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                BridgePrefs.setEnabled(this, false)
                BridgePrefs.setStatusText(this, "중지됨")
                BridgePrefs.appendLog(this, "사용자에 의해 연동이 중지되었습니다.")
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_IMMEDIATE_INBOUND -> {
                val phone = intent.getStringExtra(EXTRA_PHONE) ?: ""
                val body = intent.getStringExtra(EXTRA_BODY) ?: ""
                if (phone.isNotBlank() && body.isNotBlank()) {
                    immediateInboundQueue.add(
                        SyncItem(
                            direction = "inbound",
                            phone = phone,
                            message = body,
                            timestamp = System.currentTimeMillis()
                        )
                    )
                }
                triggerImmediateTick()
            }
            ACTION_NUDGE, ACTION_START -> {
                triggerImmediateTick()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(nudgeRunnable)
        unregisterSmsContentObserver()
        executor?.shutdownNow()
        executor = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startWorkerLoop() {
        if (executor != null) return
        val exec = Executors.newSingleThreadScheduledExecutor()
        executor = exec
        exec.scheduleWithFixedDelay(
            { runTickSafely() },
            0L,
            3L,
            TimeUnit.SECONDS
        )
    }

    private fun triggerImmediateTick() {
        executor?.execute { runTickSafely() }
    }

    private fun registerSmsContentObserver() {
        if (smsObserver != null) return
        val observer = object : ContentObserver(mainHandler) {
            override fun onChange(selfChange: Boolean, uri: Uri?) {
                super.onChange(selfChange, uri)
                mainHandler.removeCallbacks(nudgeRunnable)
                mainHandler.postDelayed(nudgeRunnable, 900L)
            }
        }
        try {
            contentResolver.registerContentObserver(Uri.parse("content://sms"), true, observer)
            contentResolver.registerContentObserver(Uri.parse("content://mms-sms/"), true, observer)
            smsObserver = observer
        } catch (e: Exception) {
            BridgePrefs.appendLog(this, "문자함 감지 등록 실패(권한 확인 필요): ${e.message}")
        }
    }

    private fun unregisterSmsContentObserver() {
        smsObserver?.let {
            runCatching { contentResolver.unregisterContentObserver(it) }
        }
        smsObserver = null
    }

    private fun runTickSafely() {
        if (!BridgePrefs.isEnabled(this)) return
        if (!isTickRunning.compareAndSet(false, true)) return

        try {
            val serverUrl = BridgePrefs.getServerUrl(this)
            val secret = BridgePrefs.getSecret(this)
            if (serverUrl.isBlank() || secret.isBlank()) {
                BridgePrefs.setStatusText(this, "설정 필요 (서버주소/보안키)")
                return
            }

            val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}".trim()

            // 1. 어드민 발송 대기 큐 폴링
            val pollRes = BridgeApiClient.poll(serverUrl, secret, deviceName)
            if (!pollRes.ok) {
                val errMsg = pollRes.error ?: "연결 실패"
                BridgePrefs.setStatusText(this, "연결 오류: $errMsg")
                updateNotification("연결 확인 필요: $errMsg")
                return
            }

            BridgePrefs.setStatusText(this, "실시간 연결됨 ($deviceName)")
            updateNotification("어드민과 실시간 문자 동기화 중")

            // 2. 발송 대기 문자 실제 유심(SIM) 발송 처리
            for (job in pollRes.jobs) {
                SmsMmsScanner.recordBridgeDispatch(job.receiverPhone, job.message)
                val (sentOk, errText) = sendSmsViaSim(job.receiverPhone, job.message)
                BridgeApiClient.ack(serverUrl, secret, job.outboxId, sentOk, errText)
                if (sentOk) {
                    BridgePrefs.appendLog(this, "[어드민발송 완료] ${job.receiverPhone} (${job.message.length}자)")
                } else {
                    BridgePrefs.appendLog(this, "[어드민발송 실패] ${job.receiverPhone}: $errText")
                }
            }

            // 3. 즉시 수신 큐 + 문자함(SMS/LMS) 증분 스캔 동기화
            val immediateItems = mutableListOf<SyncItem>()
            while (true) {
                val item = immediateInboundQueue.poll() ?: break
                immediateItems.add(item)
            }

            val hasReadPerm = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_SMS
            ) == PackageManager.PERMISSION_GRANTED

            val scanBatch = if (hasReadPerm) {
                SmsMmsScanner.collectNewMessages(this)
            } else {
                null
            }

            val combined = mutableListOf<SyncItem>()
            combined.addAll(immediateItems)
            if (scanBatch != null) {
                for (scanned in scanBatch.items) {
                    val alreadyInImmediate = immediateItems.any {
                        it.direction == scanned.direction &&
                            SmsMmsScanner.normalizePhone(it.phone) == SmsMmsScanner.normalizePhone(scanned.phone) &&
                            it.message.trim() == scanned.message.trim()
                    }
                    if (!alreadyInImmediate) {
                        combined.add(scanned)
                    }
                }
            }

            if (combined.isNotEmpty()) {
                val syncRes = BridgeApiClient.sync(serverUrl, secret, deviceName, combined)
                if (syncRes.ok) {
                    if (scanBatch != null) {
                        BridgePrefs.setLastSmsId(this, scanBatch.nextSmsId)
                        BridgePrefs.setLastMmsId(this, scanBatch.nextMmsId)
                    }
                    if (syncRes.synced > 0) {
                        BridgePrefs.appendLog(this, "[동기화 완료] 고객 문자 ${syncRes.synced}건 어드민 반영")
                    }
                } else {
                    // 실패 시 커서를 전진시키지 않아 다음 주기에 자동 재시도
                    BridgePrefs.appendLog(this, "[동기화 재시도 예정] ${syncRes.error}")
                }
            } else if (scanBatch != null) {
                BridgePrefs.setLastSmsId(this, scanBatch.nextSmsId)
                BridgePrefs.setLastMmsId(this, scanBatch.nextMmsId)
            }
        } catch (e: Exception) {
            BridgePrefs.setStatusText(this, "네트워크 재연결 대기 중")
        } finally {
            isTickRunning.set(false)
        }
    }

    private fun sendSmsViaSim(rawPhone: String, message: String): Pair<Boolean, String?> {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            return Pair(false, "앱에 문자 발송(SEND_SMS) 권한이 없습니다.")
        }

        val phone = SmsMmsScanner.normalizePhone(rawPhone)
        if (phone.length < 9) {
            return Pair(false, "유효하지 않은 전화번호: $rawPhone")
        }

        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(SmsManager::class.java) ?: run {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }

        val parts = smsManager.divideMessage(message)
        if (parts.isEmpty()) {
            return Pair(false, "빈 문자 내용")
        }

        val actionName = "com.hyowon.smsbridge.SMS_SENT_${UUID.randomUUID()}"
        val latch = CountDownLatch(parts.size)
        var anyError: String? = null

        val sentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (resultCode != Activity.RESULT_OK) {
                    anyError = "통신사 전송 오류 (코드: $resultCode)"
                }
                latch.countDown()
            }
        }

        ContextCompat.registerReceiver(
            this,
            sentReceiver,
            IntentFilter(actionName),
            ContextCompat.RECEIVER_EXPORTED
        )

        return try {
            if (parts.size == 1) {
                val pi = PendingIntent.getBroadcast(
                    this,
                    0,
                    Intent(actionName).setPackage(packageName),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                smsManager.sendTextMessage(phone, null, message, pi, null)
            } else {
                val sentIntents = ArrayList<PendingIntent>(parts.size)
                for (i in parts.indices) {
                    val pi = PendingIntent.getBroadcast(
                        this,
                        i,
                        Intent(actionName).setPackage(packageName),
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    sentIntents.add(pi)
                }
                smsManager.sendMultipartTextMessage(phone, null, parts, sentIntents, null)
            }

            val completed = latch.await(25L, TimeUnit.SECONDS)
            if (!completed) {
                Pair(true, null) // 통신사 응답 지연 시에도 발송 요청은 정상 전달됨
            } else if (anyError != null) {
                Pair(false, anyError)
            } else {
                Pair(true, null)
            }
        } catch (e: Exception) {
            Pair(false, e.message ?: "문자 발송 예외 발생")
        } finally {
            runCatching { unregisterReceiver(sentReceiver) }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "효원 문자 연동 상태",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "어드민과 회사폰 문자를 실시간으로 연동합니다."
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pi = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.sym_action_chat)
            .setContentTitle("효원 문자연동 실행 중")
            .setContentText(contentText)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startAsForeground(contentText: String) {
        val notif = buildNotification(contentText)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIF_ID, notif)
        }
    }

    private fun updateNotification(contentText: String) {
        val nm = getSystemService(NotificationManager::class.java) ?: return
        nm.notify(NOTIF_ID, buildNotification(contentText))
    }
}
