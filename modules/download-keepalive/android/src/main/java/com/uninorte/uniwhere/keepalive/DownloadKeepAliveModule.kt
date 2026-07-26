package com.uninorte.uniwhere.keepalive

import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Puente JS → `DownloadKeepAliveService`.
 *
 * Las tres funciones son síncronas a propósito: solo despachan una orden, y
 * `start` tiene que ejecutarse dentro del gesto del usuario que arranca la
 * descarga. Desde Android 12 (API 31) no se puede arrancar un foreground
 * service con la app ya en segundo plano, así que no puede quedar esperando en
 * una cola de promesas.
 */
class DownloadKeepAliveModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DownloadKeepAlive")

    Function("start") { title: String, body: String ->
      val context = reactContext()
      val intent = Intent(context, DownloadKeepAliveService::class.java).apply {
        putExtra(DownloadKeepAliveService.EXTRA_TITLE, title)
        putExtra(DownloadKeepAliveService.EXTRA_BODY, body)
      }
      ContextCompat.startForegroundService(context, intent)
    }

    // Actualiza la notificación en sitio. No pasa por un Intent porque en
    // segundo plano volver a llamar a `startForegroundService` sería ilegal.
    Function("update") { body: String ->
      DownloadKeepAliveService.updateBody(body)
    }

    // `stopService` sí es válido desde segundo plano, a diferencia de arrancar.
    Function("stop") {
      val context = reactContext()
      context.stopService(Intent(context, DownloadKeepAliveService::class.java))
    }
  }

  private fun reactContext() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
}
