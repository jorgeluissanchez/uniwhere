import { Scan } from '@/features/scan/domain/entities/scan';

export type SaveScanParams = Omit<Scan, '_id' | 'createdAt'>;

export interface ScanRepository {
  getScansByUser(userId: string): Promise<Scan[]>;
  saveScan(params: SaveScanParams): Promise<void>;
  updateScan(scanId: string, localUri: string): Promise<void>;
  deleteScan(scanId: string): Promise<void>;
  fetchPortada(serie: string): Promise<string | null>;
}
