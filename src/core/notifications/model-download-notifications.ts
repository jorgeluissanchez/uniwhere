import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notificaciones locales para avisar que un modelo terminó de descargarse
 * mientras el usuario estaba fuera de la app.
 *
 * Son *locales*: las programa la propia app cuando termina la descarga, no hay
 * servidor de push involucrado. Eso también significa que dependen de que el
 * proceso siga vivo — ver la nota de `notifyModelReady`.
 *
 * En web se usa `model-download-notifications.web.ts`, que son no-ops; este
 * archivo solo entra en los bundles nativos.
 */

const ANDROID_CHANNEL_ID = 'model-downloads';

let configured = false;

/**
 * Idempotente: se puede llamar en cada descarga sin efectos duplicados.
 */
export async function configureModelDownloadNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  // Sin esto, una notificación que llega con la app en primer plano no se
  // muestra en absoluto (queda solo en el listener).
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Descargas de modelos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * Pide el permiso si aún no se ha concedido. Devuelve si quedó concedido.
 *
 * Se llama justo antes de la primera descarga y no en el arranque, para que el
 * sistema pregunte en un momento en que el permiso tiene sentido para el usuario.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Avisa que un modelo quedó listo.
 *
 * `onOpen` existe por paridad con la versión web, donde el clic en la
 * notificación puede enfocar la pestaña y navegar. Aquí no se usa: tocar una
 * notificación del sistema solo abre la app, y encaminarla a una pantalla
 * concreta requiere manejar la respuesta con deep links.
 *
 * Limitación real: esto se dispara desde JS, así que solo llega si el proceso
 * sigue vivo cuando la descarga termina. Si el sistema operativo suspendió o
 * mató la app, la descarga se detiene y no hay notificación — no es un
 * background transfer nativo.
 */
export async function notifyModelReady(serie: string, _onOpen?: () => void): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Modelo listo',
      body: `${serie} terminó de descargarse. Ábrelo para verlo en 3D.`,
      data: { serie },
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null, // inmediata
  });
}
