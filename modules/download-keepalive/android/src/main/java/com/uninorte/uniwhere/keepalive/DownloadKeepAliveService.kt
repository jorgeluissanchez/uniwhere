package com.uninorte.uniwhere.keepalive

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Foreground service que mantiene el proceso vivo mientras se descarga un modelo.
 *
 * El problema que resuelve: la transferencia del PLY ya es nativa y sobrevive a
 * que el usuario salga de la app, pero el aviso de "modelo listo" lo programa JS
 * cuando la promesa resuelve. Con la app en segundo plano Android congela el
 * proceso (cached app freezer, API 30+), así que ese callback no corría y la
 * notificación solo aparecía al volver a abrir la app.
 *
 * Un foreground service excluye al proceso del freezer, así que el callback
 * corre en el momento real y la notificación llega estando fuera. El precio —
 * que es también una mejora — es la notificación persistente de progreso que el
 * sistema obliga a mostrar mientras el servicio está activo.
 *
 * No hace la descarga: solo mantiene el proceso despierto. Quien descarga sigue
 * siendo `model-download.ts`.
 */
class DownloadKeepAliveService : Service() {
  companion object {
    const val EXTRA_TITLE = "title"
    const val EXTRA_BODY = "body"

    /** Canal aparte del de "modelo listo": este es silencioso y persistente. */
    private const val CHANNEL_ID = "model-download-progress"
    private const val NOTIFICATION_ID = 8021

    /**
     * Instancia viva, o `null` si el servicio no está corriendo.
     *
     * El progreso se empuja por aquí y no con un Intent: desde Android 12
     * (API 31) un `startForegroundService` con la app ya en segundo plano lanza
     * `ForegroundServiceStartNotAllowedException`, y el segundo plano es
     * justamente cuando más queremos actualizar el progreso.
     *
     * No es una fuga: `onDestroy` lo limpia, y el objeto referenciado es el
     * propio servicio, no una Activity.
     */
    @Volatile
    private var running: DownloadKeepAliveService? = null

    /** No-op si el servicio ya no está activo (descarga terminada o cancelada). */
    fun updateBody(body: String) {
      running?.setBody(body)
    }
  }

  private var title: String = "Descargando modelo"
  private var body: String = ""

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    intent?.getStringExtra(EXTRA_TITLE)?.let { title = it }
    intent?.getStringExtra(EXTRA_BODY)?.let { body = it }

    running = this
    createChannel()
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      buildNotification(),
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
      } else {
        0
      },
    )
    // START_NOT_STICKY: si el sistema mata el proceso no queremos que reviva un
    // servicio sin descarga detrás.
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    running = null
    // Al destruirse el servicio Android retira su notificación, pero lo hacemos
    // explícito para que no quede visible durante el intervalo entre ambos.
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }

  private fun setBody(next: String) {
    body = next
    notificationManager().notify(NOTIFICATION_ID, buildNotification())
  }

  private fun notificationManager(): NotificationManager =
    getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Descargas en curso",
      // LOW: la notificación tiene que estar, pero no debe sonar ni asomarse.
      // El aviso que sí interrumpe es el de "modelo listo", en su propio canal.
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Progreso de la descarga de modelos 3D"
      setShowBadge(false)
    }
    notificationManager().createNotificationChannel(channel)
  }

  /** Abre la app al tocar la notificación de progreso. */
  private fun contentIntent(): PendingIntent? {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    return PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun buildNotification(): Notification =
    NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body)
      // Icono del sistema: evita depender de un drawable propio que
      // `expo prebuild --clean` tendría que regenerar en cada build.
      .setSmallIcon(android.R.drawable.stat_sys_download)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setOngoing(true)
      .setSilent(true)
      .setContentIntent(contentIntent())
      .build()
}
