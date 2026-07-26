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
