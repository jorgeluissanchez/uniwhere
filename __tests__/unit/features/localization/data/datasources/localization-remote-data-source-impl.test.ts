// __tests__/unit/features/localization/data/datasources/localization-remote-data-source-impl.test.ts
import { LocalizationRemoteDataSourceImpl } from '@/features/localization/data/datasources/localization-remote-data-source-impl';

const IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };

describe('LocalizationRemoteDataSourceImpl', () => {
  let ds: LocalizationRemoteDataSourceImpl;

  beforeEach(() => {
    ds = new LocalizationRemoteDataSourceImpl();
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends POST to /{encodeURIComponent(serie)}/localize with ngrok header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 10, translation: [1, 2, 3], rotation: [], pose: [] }),
    } as Response);

    await ds.localize('mi serie', IMAGE);

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent('mi serie'));
    expect(url).toContain('/localize');

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['ngrok-skip-browser-warning']).toBe('1');
  });

  it('FormData uses field name "foto" not "image"', async () => {
    // We can verify this indirectly: the FormData is the body.
    // Spy on FormData.append to capture field names.
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 5, translation: [0, 0, 0], rotation: [], pose: [] }),
    } as Response);

    await ds.localize('serie-x', IMAGE);

    expect(appendSpy).toHaveBeenCalledWith('foto', expect.anything());
    expect(appendSpy).not.toHaveBeenCalledWith('image', expect.anything());
  });

  it('maps translation[0..2] to x, y, z', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, inlier_count: 7, translation: [1.1, 2.2, 3.3], rotation: [], pose: [] }),
    } as Response);

    const result = await ds.localize('serie-x', IMAGE);
    expect(result.x).toBeCloseTo(1.1);
    expect(result.y).toBeCloseTo(2.2);
    expect(result.z).toBeCloseTo(3.3);
  });

  it('throws correct message on 404', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false, status: 404, json: async () => ({}),
    } as Response);

    await expect(ds.localize('serie-x', IMAGE))
      .rejects.toThrow('No hay modelo ACE entrenado para esta serie');
  });

  it('throws correct message on 422', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false, status: 422, json: async () => ({}),
    } as Response);

    await expect(ds.localize('serie-x', IMAGE))
      .rejects.toThrow('La imagen no es válida o el nombre de serie contiene caracteres no permitidos.');
  });
});
