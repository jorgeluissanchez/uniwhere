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

/**
 * Muestra la notificación de escritorio. `onOpen` se dispara al hacer clic:
 * enfoca la pestaña y deja que quien llama decida a dónde llevar al usuario.
 */
export async function notifyModelReady(serie: string, onOpen?: () => void): Promise<void> {
  if (!isSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification('Modelo listo', {
    body: `${serie} terminó de descargarse. Ábrelo para verlo en 3D.`,
    tag: `model-ready-${serie}`, // evita apilar avisos del mismo modelo
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    onOpen?.();
  };
}
