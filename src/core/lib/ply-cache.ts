/**
 * Caché de modelos PLY en web.
 *
 * En web no hay sistema de archivos donde guardar el modelo descargado, así que
 * el parser lo persiste en Cache Storage usando la URL remota como clave. Este
 * módulo centraliza el nombre de la caché y la construcción de esa clave para
 * que quien descarga (el parser) y quien pregunta si ya está descargado (la UI)
 * no puedan desincronizarse.
 */

export const PLY_CACHE_NAME = 'ply-models';

export function modelDownloadUrl(jobId: string, tipo?: string): string {
  return `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/download/${jobId}?tipo=${tipo ?? 'dense'}`;
}

/**
 * ¿Está el modelo ya en Cache Storage? Siempre `false` fuera de web o cuando la
 * Cache API no está disponible (navegación privada), que es justo el caso en el
 * que el parser también hará fetch directo.
 */
export async function isPlyCached(url: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(PLY_CACHE_NAME);
    return !!(await cache.match(url));
  } catch {
    return false;
  }
}

/**
 * Guarda el modelo ya descargado bajo la misma clave que consulta el parser.
 * Que falle (cuota llena, Cache API bloqueada) no es fatal: solo significa que
 * la próxima vez habrá que descargarlo otra vez.
 */
export async function putPlyInCache(url: string, buffer: ArrayBuffer): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(PLY_CACHE_NAME);
    await cache.put(url, new Response(buffer.slice(0), {
      headers: { 'Content-Type': 'application/octet-stream' },
    }));
  } catch {
    // sin caché, pero el modelo ya está en memoria para esta sesión
  }
}

/** Error con el código HTTP a la vista, para que el llamador dé el mensaje. */
export class HttpStatusError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpStatusError';
  }
}

function abortError(): Error {
  const err = new Error('Descarga cancelada');
  err.name = 'AbortError';
  return err;
}

export type DownloadProgress = {
  /** Bytes recibidos hasta ahora. Siempre disponible. */
  loaded: number;
  /** Tamaño total, o `null` si la respuesta no lo declara. */
  total: number | null;
  /** Fracción 0..1, o `null` si no se conoce el total. */
  ratio: number | null;
};

type DownloadOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
};

/**
 * Cada cuántos bytes se notifica cuando no hay porcentaje. Sin total no se puede
 * limitar el ritmo por punto porcentual, y el endpoint emite chunks de 1MB.
 */
const PROGRESS_BYTES_STEP = 512 * 1024;

/**
 * Descarga con progreso.
 *
 * Usa XMLHttpRequest y no `fetch` porque es la única API con eventos de progreso
 * disponible tanto en el navegador como en React Native: los streams de
 * `response.body` no existen en el fetch de RN.
 */
export function downloadWithProgress(url: string, options: DownloadOptions = {}): Promise<ArrayBuffer> {
  const { headers = {}, signal, onProgress } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return; }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort);
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    // Los eventos llegan muy seguidos; solo se notifica al cruzar un punto
    // porcentual (o un tramo de bytes) para no disparar un render por chunk.
    let lastPercent = -1;
    let lastLoaded = -1;
    xhr.onprogress = (event) => {
      if (!onProgress) return;
      const loaded = event.loaded ?? 0;

      // Sin Content-Length (respuesta comprimida, o en streaming como hace
      // /download) no hay porcentaje posible, pero los bytes recibidos sí son
      // información real que la UI puede mostrar.
      if (!event.lengthComputable || event.total <= 0) {
        if (lastLoaded >= 0 && loaded - lastLoaded < PROGRESS_BYTES_STEP) return;
        lastLoaded = loaded;
        onProgress({ loaded, total: null, ratio: null });
        return;
      }

      const percent = Math.floor((loaded / event.total) * 100);
      if (percent === lastPercent) return;
      lastPercent = percent;
      onProgress({ loaded, total: event.total, ratio: loaded / event.total });
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        const buffer = xhr.response as ArrayBuffer;
        // Al terminar el tamaño ya es conocido aunque nunca hubiera header.
        const size = buffer?.byteLength ?? 0;
        onProgress?.({ loaded: size, total: size, ratio: 1 });
        resolve(buffer);
      } else {
        reject(new HttpStatusError(xhr.status));
      }
    };
    xhr.onerror = () => { cleanup(); reject(new Error('Error de red al descargar el modelo')); };
    xhr.onabort = () => { cleanup(); reject(abortError()); };

    xhr.send();
  });
}
