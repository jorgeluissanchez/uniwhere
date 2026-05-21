import { Scan } from '@/features/scan/domain/entities/scan';
import { SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';

export interface ScanRemoteDataSource {
  getScansByUser(userId: string): Promise<Scan[]>;
  saveScan(scan: Scan): Promise<void>;
  deleteScan(scanId: string): Promise<void>;
}
