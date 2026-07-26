/**
 * Versión web: usa la Notification API del navegador para mandar
 * notificaciones de escritorio.
 *
 * Metro resuelve `.web.ts` antes que `.ts`, así que el bundle web usa este
 * archivo y nunca llega a resolver `expo-notifications` — que es casi todo
 * código nativo. Un `import()` diferido NO bastaría: Metro resuelve también
 * los imports dinámicos al construir el bundle.
 *
 * La API debe mantenerse en paridad con model-download-notifications.ts.
 */

/** La API solo existe en contexto seguro (https o localhost). */
function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function configureModelDownloadNotifications(): Promise<void> {
  // El navegador no necesita canales ni handler de primer plano.
}

/**
 * Pide el permiso si aún no se ha concedido. Devuelve si quedó concedido.
 *
 * Safari exige que la petición nazca de un gesto del usuario, por eso esto se
 * llama al principio del handler del botón y no en el arranque de la app.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isSupported()) return false;

  if (Notification.permission === 'granted') return true;
  // 'denied' es definitivo: volver a preguntar no muestra nada.
  if (Notification.permission === 'denied') return false;

  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export type ModelReadyPayload = {
  serie: string;
  scanId: string;
  localUri: string;
};

/**
 * Suscriptores del clic en la notificación.
 *
 * En web no hay un emisor del sistema como en nativo: la `Notification` del
 * navegador expone su propio `onclick`, así que el puente lo hacemos acá para
 * que el resto de la app consuma la misma API en las dos plataformas.
 */
const listeners = new Set<(payload: ModelReadyPayload) => void>();

/** Muestra la notificación de escritorio y avisa a los suscriptores al clic. */
export async function notifyModelReady(payload: ModelReadyPayload): Promise<void> {
  if (!isSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification('Modelo listo', {
    body: `${payload.serie} terminó de descargarse. Ábrelo para verlo en 3D.`,
    tag: `model-ready-${payload.serie}`, // evita apilar avisos del mismo modelo
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    listeners.forEach((cb) => cb(payload));
  };
}

export function addModelReadyListener(
  onOpen: (payload: ModelReadyPayload) => void,
): () => void {
  listeners.add(onOpen);
  return () => { listeners.delete(onOpen); };
}

/** En web la pestaña no se relanza desde una notificación: nunca hay pendiente. */
export async function getLaunchModelReady(): Promise<ModelReadyPayload | null> {
  return null;
}
