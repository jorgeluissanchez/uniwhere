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
 *
 * Importante: NO importamos `expo-notifications` desde su root. El paquete
 * root (`dist/index.js`) re-exporta `getExpoPushTokenAsync`, que al
 * evaluarse despliega un side-effect que registra un push-token listener,
 * el cual en Expo Go emite el warning
 *   "Android Push notifications (remote notifications) functionality
 *    provided by expo-notifications was removed from Expo Go with the
 *    release of SDK 53."
 * Como no usamos push tokens, importamos sólo los sub-módulos que sí
 * necesitamos: handler, permisos, scheduling y canal Android. Esos
 * sub-módulos no tienen el side-effect.
 */

const ANDROID_CHANNEL_ID = 'model-downloads';

// `AndroidImportance` está en `NotificationChannelManager.types`, no en el
// re-export raíz de expo-notifications. Como solo nos importa el valor del
// default (5), lo dejamos como literal para no depender de un deep path.
const ANDROID_IMPORTANCE_DEFAULT = 5;

let isExpoGo: boolean | undefined;
async function detectExpoGo(): Promise<boolean> {
  if (isExpoGo !== undefined) return isExpoGo;
  try {
    const expo = await import('expo');
    isExpoGo = !!expo.isRunningInExpoGo?.();
  } catch {
    isExpoGo = false;
  }
  return isExpoGo;
}

type NotificationsApi = {
  setNotificationHandler: typeof import('expo-notifications/build/NotificationsHandler').setNotificationHandler;
  getPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  setNotificationChannelAsync: (
    id: string,
    config: { name: string; importance: number },
  ) => Promise<unknown>;
  scheduleNotificationAsync: typeof import('expo-notifications/build/scheduleNotificationAsync').scheduleNotificationAsync;
};

let NotificationsMod: NotificationsApi | null | undefined;
async function getNotifications(): Promise<NotificationsApi | null> {
  if (NotificationsMod !== undefined) return NotificationsMod;
  if (await detectExpoGo()) {
    NotificationsMod = null;
    return null;
  }
  // Importamos sólo los sub-módulos que necesitamos, no el `index.js` raíz.
  const [handler, permissions, channel, schedule] = await Promise.all([
    import('expo-notifications/build/NotificationsHandler'),
    import('expo-notifications/build/NotificationPermissions'),
    import('expo-notifications/build/setNotificationChannelAsync'),
    import('expo-notifications/build/scheduleNotificationAsync'),
  ]);
  NotificationsMod = {
    setNotificationHandler: handler.setNotificationHandler,
    getPermissionsAsync: permissions.getPermissionsAsync,
    requestPermissionsAsync: permissions.requestPermissionsAsync,
    setNotificationChannelAsync: channel.setNotificationChannelAsync,
    scheduleNotificationAsync: schedule.scheduleNotificationAsync,
  };
  return NotificationsMod;
}

let configured = false;

/**
 * Idempotente: se puede llamar en cada descarga sin efectos duplicados.
 *
 * En Expo Go se vuelve no-op: la descarga sigue funcionando; solo perdemos
 * el aviso de sistema.
 */
export async function configureModelDownloadNotifications(): Promise<void> {
  if (configured) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
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
      importance: ANDROID_IMPORTANCE_DEFAULT,
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
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Avisa que un modelo quedó listo.
 *
 * Limitación real: esto se dispara desde JS, así que solo llega si el proceso
 * sigue vivo cuando la descarga termina. Si el sistema operativo suspendió o
 * mató la app, la descarga se detiene y no hay notificación — no es un
 * background transfer nativo.
 */
export async function notifyModelReady(serie: string, _onOpen?: () => void): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
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
