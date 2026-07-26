import { requireOptionalNativeModule } from 'expo';

/**
 * Mantiene el proceso despierto mientras dura una descarga (Android).
 *
 * Por qué existe: la descarga del PLY ya corre en el stack nativo y sobrevive a
 * que el usuario salga de la app, pero el aviso de "modelo listo" lo programa
 * JS al resolverse la promesa. Android congela el proceso de una app en segundo
 * plano (cached app freezer, API 30+), así que ese callback quedaba encolado y
 * la notificación aparecía recién al reabrir la app — es decir, justo cuando ya
 * no servía de nada.
 *
 * Un foreground service saca al proceso del freezer. Como efecto visible, el
 * sistema exige una notificación persistente: la usamos para mostrar el
 * progreso, que además es lo que el usuario querría ver estando fuera.
 *
 * Solo Android:
 *   - iOS ya funciona sin esto. `NSURLSession` en modo background despierta al
 *     proceso cuando la descarga termina, así que el callback corre solo.
 *   - Web no tiene proceso que congelar.
 * En esas plataformas —y en Expo Go, donde el módulo no está compilado—
 * `requireOptionalNativeModule` devuelve `null` y todo esto queda en no-op.
 */
type DownloadKeepAliveModule = {
  start: (title: string, body: string) => void;
  update: (body: string) => void;
  stop: () => void;
};

const KeepAlive = requireOptionalNativeModule<DownloadKeepAliveModule>('DownloadKeepAlive');

/** Cada cuánto se permite repintar la notificación de progreso. */
const UPDATE_INTERVAL_MS = 1000;

let lastUpdate = 0;

/**
 * Arranca el servicio. Tiene que llamarse con la app en primer plano: desde
 * Android 12 el sistema rechaza arrancar un foreground service desde atrás.
 *
 * Nunca lanza. Un fallo aquí solo significa volver al comportamiento anterior
 * (el aviso llega al reabrir la app), y no hay razón para tumbar la descarga.
 */
export function startDownloadKeepAlive(title: string, body: string): void {
  if (!KeepAlive) return;
  try {
    KeepAlive.start(title, body);
    lastUpdate = Date.now();
  } catch {
    // sin keep-alive; la descarga sigue igual
  }
}

/**
 * Repinta el texto de progreso, como mucho una vez por segundo: el callback
 * nativo de progreso llega por cada chunk y notificar a esa frecuencia hace que
 * el sistema empiece a descartar actualizaciones.
 */
export function updateDownloadKeepAlive(body: string): void {
  if (!KeepAlive) return;
  const now = Date.now();
  if (now - lastUpdate < UPDATE_INTERVAL_MS) return;
  lastUpdate = now;
  try {
    KeepAlive.update(body);
  } catch {
    // idem
  }
}

/** Detiene el servicio y retira la notificación de progreso. Idempotente. */
export function stopDownloadKeepAlive(): void {
  if (!KeepAlive) return;
  try {
    KeepAlive.stop();
  } catch {
    // idem
  }
}
