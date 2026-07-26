import {
  downloadWithProgress,
  HttpStatusError,
  isPlyCached,
  modelDownloadUrl,
  PLY_CACHE_NAME,
} from '@/core/lib/ply-cache';

describe('modelDownloadUrl', () => {
  it('usa "dense" cuando no se indica tipo', () => {
    expect(modelDownloadUrl('job-1')).toContain('/download/job-1?tipo=dense');
  });

  it('respeta el tipo indicado', () => {
    expect(modelDownloadUrl('job-1', 'sparse')).toContain('/download/job-1?tipo=sparse');
  });
});

describe('isPlyCached', () => {
  const originalCaches = (globalThis as any).caches;

  afterEach(() => {
    (globalThis as any).caches = originalCaches;
  });

  it('es false cuando la Cache API no existe (nativo, navegación privada)', async () => {
    (globalThis as any).caches = undefined;
    await expect(isPlyCached('http://x/model.ply')).resolves.toBe(false);
  });

  it('es true cuando la URL está en la caché', async () => {
    const match = jest.fn().mockResolvedValue(new Response('ply'));
    (globalThis as any).caches = { open: jest.fn().mockResolvedValue({ match }) };

    await expect(isPlyCached('http://x/model.ply')).resolves.toBe(true);
    expect((globalThis as any).caches.open).toHaveBeenCalledWith(PLY_CACHE_NAME);
    expect(match).toHaveBeenCalledWith('http://x/model.ply');
  });

  it('es false cuando la URL no está en la caché', async () => {
    (globalThis as any).caches = {
      open: jest.fn().mockResolvedValue({ match: jest.fn().mockResolvedValue(undefined) }),
    };
    await expect(isPlyCached('http://x/model.ply')).resolves.toBe(false);
  });

  it('no propaga errores de la Cache API', async () => {
    (globalThis as any).caches = { open: jest.fn().mockRejectedValue(new Error('denied')) };
    await expect(isPlyCached('http://x/model.ply')).resolves.toBe(false);
  });
});

describe('downloadWithProgress', () => {
  class FakeXHR {
    static last: FakeXHR;
    status = 200;
    response: unknown = new ArrayBuffer(8);
    responseType = '';
    onprogress: ((e: any) => void) | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    headers: Record<string, string> = {};
    aborted = false;

    constructor() { FakeXHR.last = this; }
    open = jest.fn();
    setRequestHeader = (k: string, v: string) => { this.headers[k] = v; };
    send = jest.fn();
    abort = () => { this.aborted = true; this.onabort?.(); };
  }

  const originalXHR = (globalThis as any).XMLHttpRequest;
  beforeEach(() => { (globalThis as any).XMLHttpRequest = FakeXHR; });
  afterEach(() => { (globalThis as any).XMLHttpRequest = originalXHR; });

  it('informa el progreso una sola vez por punto porcentual', async () => {
    const onProgress = jest.fn();
    const promise = downloadWithProgress('http://x/m.ply', { onProgress });

    const xhr = FakeXHR.last;
    xhr.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 }); // mismo %
    xhr.onprogress?.({ lengthComputable: true, loaded: 75, total: 100 });
    xhr.onload?.();

    await promise;
    expect(onProgress.mock.calls.map((c) => c[0].ratio)).toEqual([0.5, 0.75, 1]);
    expect(onProgress).toHaveBeenNthCalledWith(1, { loaded: 50, total: 100, ratio: 0.5 });
  });

  it('sin Content-Length informa bytes y ratio null', async () => {
    const onProgress = jest.fn();
    const promise = downloadWithProgress('http://x/m.ply', { onProgress });

    const MB = 1024 * 1024;
    const xhr = FakeXHR.last;
    xhr.onprogress?.({ lengthComputable: false, loaded: MB, total: 0 });
    xhr.onprogress?.({ lengthComputable: false, loaded: MB + 1, total: 0 }); // mismo tramo
    xhr.onprogress?.({ lengthComputable: false, loaded: 2 * MB, total: 0 });

    expect(onProgress.mock.calls.map((c) => c[0])).toEqual([
      { loaded: MB, total: null, ratio: null },
      { loaded: 2 * MB, total: null, ratio: null },
    ]);

    xhr.onload?.();
    await promise;
  });

  it('al terminar informa el tamaño real aunque no hubiera Content-Length', async () => {
    const onProgress = jest.fn();
    const promise = downloadWithProgress('http://x/m.ply', { onProgress });

    FakeXHR.last.response = new ArrayBuffer(2048);
    FakeXHR.last.onload?.();

    await promise;
    expect(onProgress).toHaveBeenCalledWith({ loaded: 2048, total: 2048, ratio: 1 });
  });

  it('envía los headers recibidos', async () => {
    const promise = downloadWithProgress('http://x/m.ply', { headers: { 'X-Test': '1' } });
    FakeXHR.last.onload?.();
    await promise;
    expect(FakeXHR.last.headers).toEqual({ 'X-Test': '1' });
  });

  it('rechaza con HttpStatusError conservando el código', async () => {
    const promise = downloadWithProgress('http://x/m.ply');
    FakeXHR.last.status = 409;
    FakeXHR.last.onload?.();

    await expect(promise).rejects.toMatchObject({ name: 'HttpStatusError', status: 409 });
    await expect(promise).rejects.toBeInstanceOf(HttpStatusError);
  });

  it('rechaza con AbortError si la señal se cancela', async () => {
    const controller = new AbortController();
    const promise = downloadWithProgress('http://x/m.ply', { signal: controller.signal });

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeXHR.last.aborted).toBe(true);
  });

  it('rechaza de inmediato si la señal ya venía cancelada', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      downloadWithProgress('http://x/m.ply', { signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
