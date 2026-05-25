import { ScanRemoteDataSourceImpl } from '@/features/scan/data/datasources/scan-remote-data-source-impl';
import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

const prefs = LocalPreferencesAsyncStorage.getInstance();

function mockFetchOk(body: unknown) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => body,
  } as Response);
}

describe('ScanRemoteDataSourceImpl', () => {
  let ds: ScanRemoteDataSourceImpl;

  beforeEach(async () => {
    ds = new ScanRemoteDataSourceImpl();
    await prefs.storeData('token', 'test-token');
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('getScansByUser sends GET with user_id param and maps snake_case to camelCase', async () => {
    const fetchSpy = mockFetchOk([{
      _id: 'scan-1', user_id: 'user-123', job_id: 'job-abc',
      serie: 'serie-x', tipo: 'dense', local_uri: '', created_at: '2026-01-01',
    }]);

    const scans = await ds.getScansByUser('user-123');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('user_id=user-123'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }) }),
    );
    expect(scans[0]).toEqual({
      _id: 'scan-1', userId: 'user-123', jobId: 'job-abc',
      serie: 'serie-x', tipo: 'dense', localUri: '', createdAt: '2026-01-01',
    });
  });

  it('saveScan sends POST with snake_case columns', async () => {
    const fetchSpy = mockFetchOk({ inserted: 1 });
    await ds.saveScan({ userId: 'u1', jobId: 'j1', serie: 's1', tipo: 'dense', localUri: '' });

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.records[0]).toMatchObject({
      user_id: 'u1', job_id: 'j1', serie: 's1', tipo: 'dense', local_uri: '',
    });
  });

  it('deleteScan sends DELETE with correct idValue', async () => {
    const fetchSpy = mockFetchOk({ deleted: 1 });
    await ds.deleteScan('scan-1');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.idValue).toBe('scan-1');
  });

  it('getScansByUser returns empty array on non-array response', async () => {
    mockFetchOk(null);
    const scans = await ds.getScansByUser('user-x');
    expect(scans).toEqual([]);
  });
});
