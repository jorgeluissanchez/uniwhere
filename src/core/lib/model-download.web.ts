/**
 * Variante web de `model-download.ts`.
 *
 * En web no hay sistema de archivos ni sesión de descarga nativa: el modelo se
 * guarda en Cache Storage y la transferencia sigue siendo un `XMLHttpRequest`
 * (`downloadWithProgress`). El navegador tampoco congela la pestaña de la misma
 * forma que un SO móvil suspende una app, así que el problema que motiva el
 * módulo nativo no existe aquí.
 *
 * La API debe mantenerse en paridad con `model-download.ts`.
 */
import { downloadWithProgress, HttpStatusError, putPlyInCache, DownloadProgress } from './ply-cache';

export type ModelDownloadParams = {
  key: string;
  url: string;
  fileUri: string;
  headers?: Record<string, string>;
  onProgress?: (progress: DownloadProgress) => void;
};

export type ModelDownloadHandle = {
  promise: Promise<string>;
  cancel: () => Promise<void>;
};

export class HttpDownloadError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpDownloadError';
  }
}

export function downloadModelFile(params: ModelDownloadParams): ModelDownloadHandle {
  const { url, headers, onProgress } = params;
  const controller = new AbortController();

  const promise = (async () => {
    try {
      const buffer = await downloadWithProgress(url, {
        headers,
        signal: controller.signal,
        onProgress,
      });
      await putPlyInCache(url, buffer);
      // En web el "uri local" es la propia URL remota: es la clave con la que
      // el parser encuentra el modelo en Cache Storage.
      return url;
    } catch (error) {
      if (error instanceof HttpStatusError) throw new HttpDownloadError(error.status);
      throw error;
    }
  })();
  promise.catch(() => {});

  return {
    promise,
    cancel: async () => controller.abort(),
  };
}

/** No hay reanudación en web: Cache Storage guarda todo o nada. */
export async function hasPendingModelDownload(_key: string): Promise<boolean> {
  return false;
}

export async function forgetModelDownload(_key: string): Promise<void> {
  // no-op
}
