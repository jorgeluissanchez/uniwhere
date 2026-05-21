import { Scan } from '@/features/scan/domain/entities/scan';

export type SaveScanParams = Omit<Scan, 'scanId' | 'createdAt'>;

export interface ScanRepository {
  getScansByUser(userId: string): Promise<Scan[]>;
  saveScan(params: SaveScanParams): Promise<void>;
  deleteScan(scanId: string): Promise<void>;
}
