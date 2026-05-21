import { ScanRemoteDataSource } from '@/features/scan/data/datasources/scan-remote-data-source';
import { Scan } from '@/features/scan/domain/entities/scan';
import { SaveScanParams, ScanRepository } from '@/features/scan/domain/repositories/scan-repository';

export class ScanRepositoryImpl implements ScanRepository {
  constructor(private readonly remoteDS: ScanRemoteDataSource) {}

  async getScansByUser(userId: string): Promise<Scan[]> {
    return this.remoteDS.getScansByUser(userId);
  }

  async saveScan(params: SaveScanParams): Promise<void> {
    return this.remoteDS.saveScan(params);
  }

  async deleteScan(scanId: string): Promise<void> {
    return this.remoteDS.deleteScan(scanId);
  }
}
