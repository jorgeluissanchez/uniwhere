/**
 * Descarga de modelos PLY que sobrevive a que el usuario salga de la app.
 *
 * El problema que resuelve: la descarga vivía en un `XMLHttpRequest` en el hilo
 * de JS (`downloadWithProgress`). Cuando el usuario sale de la app el sistema
 * congela ese hilo y tira la conexión, así que la descarga moría con un
 * "error de red" en cuanto la pantalla se apagaba o se cambiaba de app.
 *
 * La solución es no descargar desde JS. `createDownloadResumable` de
 * expo-file-system delega la transferencia al stack nativo:
 *   - iOS: `NSURLSession` en modo background (`FileSystemSessionType.BACKGROUND`,
 *     que además es el default). El SO sigue la descarga con la app suspendida
 *     y despierta el proceso al terminar.
 *   - Android: las sesiones son siempre background; no hay opción que cambiar.
 *
 * Encima de eso hay reanudación persistida: el `savable()` de la tarea se
 * guarda en AsyncStorage, así que una descarga cortada por un kill del sistema
 * se retoma desde los bytes ya escritos en el siguiente arranque, en vez de
 * empezar de cero o mostrar un error.
 *
 * En web se usa `model-download.web.ts` (no hay sistema de archivos; ahí la
 * descarga sigue siendo por XHR contra Cache Storage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createDownloadResumable,
  DownloadResumable,
  FileSystemSessionType,
} from 'expo-file-system/legacy';

import { DownloadProgress } from './ply-cache';

/** Prefijo de las claves de AsyncStorage con descargas a medio terminar. */
const PENDING_PREFIX = 'model-download:';

/**
 * Cuántas veces se reintenta una descarga que falló sola (sin cancelación del
 * usuario). Los cortes reales al volver de background suelen resolverse al
 * primer reintento; más allá de eso es un problema de red de verdad y conviene
 * mostrarlo.
 */
const MAX_RETRIES = 2;

/** Estado serializable que `DownloadResumable.savable()` devuelve. */
type PauseState = {
  url: string;
  fileUri: string;
  options?: Record<string, unknown>;
  resumeData?: string;
};

export type ModelDownloadParams = {
  /** Clave estable de esta descarga (el `_id` del scan). */
  key: string;
  url: string;
  /** `file://` destino. Su directorio debe existir. */
  fileUri: string;
  headers?: Record<string, string>;
  onProgress?: (progress: DownloadProgress) => void;
};

export type ModelDownloadHandle = {
  /** Resuelve con el `file://` local ya escrito. */
  promise: Promise<string>;
  /** Cancela y descarta el estado de reanudación. */
  cancel: () => Promise<void>;
};

function pendingKey(key: string): string {
  return `${PENDING_PREFIX}${key}`;
}

/**
 * Traduce el progreso nativo al mismo contrato que ya consume la UI.
 * `totalBytesExpectedToWrite === -1` significa que el servidor no mandó
 * `Content-Length` — que es justo lo que hace `/download`, que transmite en
 * streaming. Sin total no hay porcentaje, pero los bytes recibidos sí sirven.
 */
function toDownloadProgress(data: {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}): DownloadProgress {
  const { totalBytesWritten: loaded, totalBytesExpectedToWrite: expected } = data;
  if (expected <= 0) return { loaded, total: null, ratio: null };
  return { loaded, total: expected, ratio: loaded / expected };
}

async function savePending(key: string, state: PauseState): Promise<void> {
  try {
    await AsyncStorage.setItem(pendingKey(key), JSON.stringify(state));
  } catch {
    // Sin estado guardado la descarga simplemente reempieza; no es fatal.
  }
}

async function clearPending(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(pendingKey(key));
  } catch {
    // idem
  }
}

async function readPending(key: string): Promise<PauseState | null> {
  try {
    const raw = await AsyncStorage.getItem(pendingKey(key));
    return raw ? (JSON.parse(raw) as PauseState) : null;
  } catch {
    return null;
  }
}

/** True si el error viene de que el usuario canceló, no de la red. */
function isCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function abortError(): Error {
  const err = new Error('Descarga cancelada');
  err.name = 'AbortError';
  return err;
}

/**
 * Arranca (o retoma) la descarga de un modelo.
 *
 * Si hay estado de reanudación guardado para `key`, continúa desde ahí en vez
 * de volver a pedir el archivo entero.
 */
export function downloadModelFile(params: ModelDownloadParams): ModelDownloadHandle {
  const { key, url, fileUri, headers, onProgress } = params;

  let cancelled = false;
  let task: DownloadResumable | null = null;

  const makeTask = (resumeData?: string): DownloadResumable =>
    createDownloadResumable(
      url,
      fileUri,
      {
        headers,
        // Explícito aunque sea el default: es la línea de la que depende que la
        // descarga siga viva con la app en segundo plano en iOS.
        sessionType: FileSystemSessionType.BACKGROUND,
      },
      (data) => onProgress?.(toDownloadProgress(data)),
      resumeData,
    );

  const run = async (): Promise<string> => {
    const saved = await readPending(key);
    // Solo se reutiliza el estado si apunta al mismo archivo remoto y local:
    // un `resumeData` de otra descarga produciría un PLY corrupto.
    const resumable =
      saved && saved.url === url && saved.fileUri === fileUri ? saved.resumeData : undefined;

    let attempt = 0;
    let resumeData = resumable;

    for (;;) {
      if (cancelled) throw abortError();

      task = makeTask(resumeData);
      // Se guarda antes de empezar para que un kill del sistema a mitad de
      // descarga deje rastro con el que retomar.
      await savePending(key, task.savable() as PauseState);

      try {
        const result = resumeData ? await task.resumeAsync() : await task.downloadAsync();
        if (cancelled) throw abortError();
        // `undefined` significa que la tarea fue cancelada desde el nativo.
        if (!result) throw abortError();
        if (result.status >= 400) {
          throw new HttpDownloadError(result.status);
        }
        await clearPending(key);
        return result.uri;
      } catch (error) {
        if (cancelled || isCancellation(error)) {
          await clearPending(key);
          throw abortError();
        }
        // Un código HTTP es una respuesta del servidor, no un corte: reintentar
        // no lo va a arreglar y el llamador necesita el status para el mensaje.
        if (error instanceof HttpDownloadError) {
          await clearPending(key);
          throw error;
        }
        if (attempt >= MAX_RETRIES) throw error;

        attempt += 1;
        // Rescatamos el punto donde quedó para que el reintento no vuelva a
        // empezar de cero. Si el nativo no puede darlo, se reempieza.
        resumeData = await captureResumeData(task);
      }
    }
  };

  const promise = run();
  // Sin este `catch` de cortesía, una descarga que falla mientras el usuario
  // está en otra pantalla dispara un unhandled rejection. El error real sigue
  // llegando a quien haga `await handle.promise`.
  promise.catch(() => {});

  return {
    promise,
    cancel: async () => {
      cancelled = true;
      try {
        await task?.cancelAsync();
      } catch {
        // La tarea ya podía estar muerta; lo que importa es limpiar el estado.
      }
      await clearPending(key);
    },
  };
}

/** El servidor respondió, pero con un código de error. */
export class HttpDownloadError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpDownloadError';
  }
}

async function captureResumeData(task: DownloadResumable): Promise<string | undefined> {
  try {
    const state = (await task.pauseAsync()) as PauseState;
    return state.resumeData;
  } catch {
    return undefined;
  }
}

/** ¿Quedó una descarga a medias para este scan? */
export async function hasPendingModelDownload(key: string): Promise<boolean> {
  return (await readPending(key)) !== null;
}

/** Olvida el estado de reanudación (p. ej. al borrar el scan). */
export async function forgetModelDownload(key: string): Promise<void> {
  await clearPending(key);
}
