// __tests__/unit/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl.test.ts
import { ReconstructionRemoteDataSourceImpl } from '@/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl';

describe('ReconstructionRemoteDataSourceImpl', () => {
  let ds: ReconstructionRemoteDataSourceImpl;

  beforeEach(() => {
    ds = new ReconstructionRemoteDataSourceImpl();
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('startJob', () => {
    it('sends POST /reconstruct with serie and fotos in FormData', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true, json: async () => ({ job_id: 'job-abc', serie: 'serie-x' }),
      } as Response);

      const result = await ds.startJob({
        serie: 'serie-x',
        inferGs: false,
        photos: [{ uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg' }],
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/reconstruct'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ jobId: 'job-abc', serie: 'serie-x' });
    });

    it('throws on non-ok response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false, status: 500, json: async () => ({ detail: 'Server error' }),
      } as Response);

      await expect(ds.startJob({ serie: 's', inferGs: false, photos: [] }))
        .rejects.toThrow('Server error');
    });
  });

  describe('getStatus', () => {
    it('maps response to ReconstructionJob entity', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          job_id: 'job-abc', serie: 'serie-x', status: 'done',
          progress: ['step1'], error: null,
        }),
      } as Response);

      const job = await ds.getStatus('job-abc');
      expect(job).toEqual({
        jobId: 'job-abc', serie: 'serie-x', status: 'done',
        progress: ['step1'], error: null,
      });
    });
  });
});
