import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRemoteDataSource } from '@/features/scan/data/datasources/scan-remote-data-source';

export class ScanRemoteDataSourceImpl implements ScanRemoteDataSource {
  private readonly dbUrl: string;
  private readonly prefs = LocalPreferencesAsyncStorage.getInstance();

  constructor() {
    const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://roble-api.openlab.uninorte.edu.co';
    const projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID;
    if (!projectId) throw new Error('Falta EXPO_PUBLIC_ROBLE_PROJECT_ID');
    this.dbUrl = `${base}/database/${projectId}`;
  }

  private async token(): Promise<string> {
    const t = await this.prefs.retrieveData<string>('token');
    if (!t) throw new Error('No autorizado');
    return t;
  }

  async getScansByUser(userId: string): Promise<Scan[]> {
    const token = await this.token();
    const res = await fetch(`${this.dbUrl}/read?tableName=scan&user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => ({
      scanId:    r.scan_id,
      userId:    r.user_id,
      jobId:     r.job_id,
      serie:     r.serie,
      tipo:      r.tipo,
      localUri:  r.local_uri,
      createdAt: r.created_at,
    }));
  }

  async saveScan(scan: Scan): Promise<void> {
    const token = await this.token();
    await fetch(`${this.dbUrl}/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tableName: 'scan',
        records: [{
          scan_id:    scan.scanId,
          user_id:    scan.userId,
          job_id:     scan.jobId,
          serie:      scan.serie,
          tipo:       scan.tipo,
          local_uri:  scan.localUri,
          created_at: scan.createdAt,
        }],
      }),
    });
  }

  async deleteScan(scanId: string): Promise<void> {
    const token = await this.token();
    await fetch(`${this.dbUrl}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tableName: 'scan', filter: { scan_id: scanId } }),
    });
  }
}
