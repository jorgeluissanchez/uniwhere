import { isPlyCached, modelDownloadUrl, PLY_CACHE_NAME } from '@/core/lib/ply-cache';

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
