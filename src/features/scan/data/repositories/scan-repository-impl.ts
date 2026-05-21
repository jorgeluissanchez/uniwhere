import * as FileSystem from 'expo-file-system';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRepository, SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';
import { ScanRemoteDataSource } from '@/features/scan/data/datasources/scan-remote-data-source';

export class ScanRepositoryImpl implements ScanRepository {
  constructor(private readonly remoteDS: ScanRemoteDataSource) {}

  async getScansByUser(userId: string): Promise<Scan[]> {
    return this.remoteDS.getScansByUser(userId);
  }

  async saveScan(params: SaveScanParams): Promise<void> {
    const scan: Scan = {
      ...params,
      scanId:    crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return this.remoteDS.saveScan(scan);
  }

  async deleteScan(scanId: string): Promise<void> {
    return this.remoteDS.deleteScan(scanId);
  }
}
