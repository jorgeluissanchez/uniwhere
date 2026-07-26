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

type DownloadOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Fracción 0..1, o `null` si la respuesta no declara tamaño. */
  onProgress?: (ratio: number | null) => void;
};

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
    // porcentual para no disparar un render por cada chunk.
    let lastPercent = -1;
    xhr.onprogress = (event) => {
      if (!onProgress) return;
      // Sin Content-Length (respuesta comprimida o en streaming) no hay
      // porcentaje que mostrar.
      if (!event.lengthComputable || event.total <= 0) { onProgress(null); return; }
      const percent = Math.floor((event.loaded / event.total) * 100);
      if (percent === lastPercent) return;
      lastPercent = percent;
      onProgress(event.loaded / event.total);
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve(xhr.response as ArrayBuffer);
      } else {
        reject(new HttpStatusError(xhr.status));
      }
    };
    xhr.onerror = () => { cleanup(); reject(new Error('Error de red al descargar el modelo')); };
    xhr.onabort = () => { cleanup(); reject(abortError()); };

    xhr.send();
  });
}
