import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRemoteDataSource } from '@/features/scan/data/datasources/scan-remote-data-source';
import { SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';

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
      _id:       r._id,
      userId:    r.user_id,
      jobId:     r.job_id,
      serie:     r.serie,
      tipo:      r.tipo,
      localUri:  r.local_uri,
      createdAt: r.created_at,
    }));
  }

  async saveScan(params: SaveScanParams): Promise<void> {
    const token = await this.token();
    const res = await fetch(`${this.dbUrl}/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tableName: 'scan',
        records: [{
          user_id:   params.userId,
          job_id:    params.jobId,
          serie:     params.serie,
          tipo:      params.tipo,
          local_uri: params.localUri,
        }],
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Error al guardar el escaneo (HTTP ${res.status})`);
    }
  }

  async deleteScan(scanId: string): Promise<void> {
    const token = await this.token();
    await fetch(`${this.dbUrl}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tableName: 'scan', idColumn: '_id', idValue: scanId }),
    });
  }
}
