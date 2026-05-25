// __tests__/unit/features/scan/data/repositories/scan-repository-impl.test.ts
import { ScanRepositoryImpl } from '@/features/scan/data/repositories/scan-repository-impl';

const mockDS = {
  getScansByUser: jest.fn(),
  saveScan: jest.fn(),
  updateScan: jest.fn(),
  deleteScan: jest.fn(),
  fetchPortada: jest.fn(),
};

describe('ScanRepositoryImpl', () => {
  let repo: ScanRepositoryImpl;

  beforeEach(() => {
    repo = new ScanRepositoryImpl(mockDS as any);
    jest.clearAllMocks();
  });

  it('getScansByUser delegates to datasource', async () => {
    mockDS.getScansByUser.mockResolvedValue([]);
    await repo.getScansByUser('user-1');
    expect(mockDS.getScansByUser).toHaveBeenCalledWith('user-1');
  });

  it('fetchPortada returns null when datasource returns null', async () => {
    mockDS.fetchPortada.mockResolvedValue(null);
    const result = await repo.fetchPortada('serie-x');
    expect(result).toBeNull();
  });

  it('fetchPortada returns URI from datasource', async () => {
    mockDS.fetchPortada.mockResolvedValue('file://cache/portada_serie-x.jpg');
    const result = await repo.fetchPortada('serie-x');
    expect(result).toBe('file://cache/portada_serie-x.jpg');
  });
});
