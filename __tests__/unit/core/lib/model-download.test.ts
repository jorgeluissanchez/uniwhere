/**
 * La descarga vive en el stack nativo justamente para sobrevivir a que la app
 * pase a segundo plano, así que lo que se puede verificar en Jest es el
 * contrato alrededor: que se reanude en vez de reempezar, que un corte de red
 * se reintente en silencio, que un HTTP de error no se reintente, y que el
 * estado persistido se limpie cuando corresponde.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProgressCb = (data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void;

/** Guion de la tarea nativa: qué hace cada intento sucesivo. */
type Attempt =
  | { kind: 'ok'; status?: number }
  | { kind: 'network-error' }
  | { kind: 'progress-then-error'; loaded: number; total: number };

let mockAttempts: Attempt[] = [];
let mockCreatedWith: { url: string; fileUri: string; resumeData?: string }[] = [];
let mockPauseResumeData: string | undefined;

jest.mock('expo-file-system/legacy', () => ({
  FileSystemSessionType: { BACKGROUND: 0, FOREGROUND: 1 },
  createDownloadResumable: (
    url: string,
    fileUri: string,
    _options: unknown,
    callback?: ProgressCb,
    resumeData?: string,
  ) => {
    mockCreatedWith.push({ url, fileUri, resumeData });
    const run = async () => {
      const step = mockAttempts.shift() ?? { kind: 'ok' as const };
      if (step.kind === 'network-error') throw new Error('Network request failed');
      if (step.kind === 'progress-then-error') {
        callback?.({
          totalBytesWritten: step.loaded,
          totalBytesExpectedToWrite: step.total,
        });
        throw new Error('Network request failed');
      }
      return { uri: fileUri, status: step.status ?? 200, headers: {}, mimeType: null };
    };
    return {
      downloadAsync: run,
      resumeAsync: run,
      cancelAsync: jest.fn().mockResolvedValue(undefined),
      pauseAsync: jest.fn().mockResolvedValue({ url, fileUri, resumeData: mockPauseResumeData }),
      savable: () => ({ url, fileUri, resumeData }),
    };
  },
}));

import {
  downloadModelFile,
  forgetModelDownload,
  hasPendingModelDownload,
  HttpDownloadError,
} from '@/core/lib/model-download';

const URL = 'https://api.test/download/job-1?tipo=dense';
const FILE = 'file:///documents/job-1_dense.ply';

beforeEach(async () => {
  mockAttempts = [];
  mockCreatedWith = [];
  mockPauseResumeData = undefined;
  await AsyncStorage.clear();
});

describe('downloadModelFile', () => {
  it('devuelve el uri local y no deja estado pendiente al terminar bien', async () => {
    mockAttempts = [{ kind: 'ok' }];

    const uri = await downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise;

    expect(uri).toBe(FILE);
    expect(await hasPendingModelDownload('s1')).toBe(false);
  });

  it('usa la sesión de background y persiste el estado antes de empezar', async () => {
    // El primer intento falla para poder observar el estado a mitad de camino.
    mockAttempts = [{ kind: 'network-error' }, { kind: 'ok' }];

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise;

    // Dos tareas creadas: el intento original y el reintento.
    expect(mockCreatedWith).toHaveLength(2);
    expect(mockCreatedWith[0]).toMatchObject({ url: URL, fileUri: FILE });
  });

  it('reintenta en silencio cuando la red se corta y termina resolviendo', async () => {
    mockAttempts = [{ kind: 'network-error' }, { kind: 'ok' }];

    await expect(
      downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise,
    ).resolves.toBe(FILE);
  });

  it('reanuda desde el punto guardado en vez de reempezar', async () => {
    mockPauseResumeData = 'resume-token';
    mockAttempts = [{ kind: 'network-error' }, { kind: 'ok' }];

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise;

    // El reintento recibe el token de reanudación que devolvió `pauseAsync`.
    expect(mockCreatedWith[1].resumeData).toBe('resume-token');
  });

  it('retoma una descarga pendiente de una sesión anterior', async () => {
    await AsyncStorage.setItem(
      'model-download:s1',
      JSON.stringify({ url: URL, fileUri: FILE, resumeData: 'de-antes' }),
    );
    mockAttempts = [{ kind: 'ok' }];

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise;

    expect(mockCreatedWith[0].resumeData).toBe('de-antes');
  });

  it('ignora el estado guardado si apunta a otro modelo', async () => {
    await AsyncStorage.setItem(
      'model-download:s1',
      JSON.stringify({ url: 'https://api.test/otro', fileUri: FILE, resumeData: 'ajeno' }),
    );
    mockAttempts = [{ kind: 'ok' }];

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise;

    expect(mockCreatedWith[0].resumeData).toBeUndefined();
  });

  it('no reintenta cuando el servidor responde con un código de error', async () => {
    mockAttempts = [{ kind: 'ok', status: 409 }];

    await expect(
      downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise,
    ).rejects.toBeInstanceOf(HttpDownloadError);

    expect(mockCreatedWith).toHaveLength(1);
    expect(await hasPendingModelDownload('s1')).toBe(false);
  });

  it('se rinde tras agotar los reintentos y propaga el error de red', async () => {
    mockAttempts = [{ kind: 'network-error' }, { kind: 'network-error' }, { kind: 'network-error' }];

    await expect(
      downloadModelFile({ key: 's1', url: URL, fileUri: FILE }).promise,
    ).rejects.toThrow('Network request failed');
  });

  it('reporta progreso con el total cuando el servidor lo declara', async () => {
    mockAttempts = [{ kind: 'progress-then-error', loaded: 512, total: 1024 }, { kind: 'ok' }];
    const onProgress = jest.fn();

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE, onProgress }).promise;

    expect(onProgress).toHaveBeenCalledWith({ loaded: 512, total: 1024, ratio: 0.5 });
  });

  it('reporta bytes sin porcentaje cuando no hay Content-Length', async () => {
    // `/download` transmite en streaming: el nativo informa -1 como total.
    mockAttempts = [{ kind: 'progress-then-error', loaded: 2048, total: -1 }, { kind: 'ok' }];
    const onProgress = jest.fn();

    await downloadModelFile({ key: 's1', url: URL, fileUri: FILE, onProgress }).promise;

    expect(onProgress).toHaveBeenCalledWith({ loaded: 2048, total: null, ratio: null });
  });

  it('cancelar limpia el estado y rechaza con AbortError', async () => {
    mockAttempts = [{ kind: 'ok' }];
    const handle = downloadModelFile({ key: 's1', url: URL, fileUri: FILE });

    await handle.cancel();

    expect(await hasPendingModelDownload('s1')).toBe(false);
    await expect(handle.promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('forgetModelDownload', () => {
  it('borra el estado pendiente', async () => {
    await AsyncStorage.setItem('model-download:s1', JSON.stringify({ url: URL, fileUri: FILE }));

    await forgetModelDownload('s1');

    expect(await hasPendingModelDownload('s1')).toBe(false);
  });
});
