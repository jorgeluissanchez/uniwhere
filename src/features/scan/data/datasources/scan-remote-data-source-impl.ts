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

  private async refreshToken(): Promise<string> {
    const refresh = await this.prefs.retrieveData<string>('refreshToken');
    if (!refresh) throw new Error('Sesión expirada, inicia sesión de nuevo');
    const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://roble-api.openlab.uninorte.edu.co';
    const projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID!;
    const res = await fetch(`${base}/auth/${projectId}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) throw new Error('Sesión expirada, inicia sesión de nuevo');
    const data = await res.json();
    const newToken: string = data.accessToken;
    await this.prefs.storeData('token', newToken);
    return newToken;
  }

  private async fetchAuth(url: string, init: RequestInit = {}): Promise<Response> {
    let token = await this.token();
    const makeReq = (t: string) => fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string> ?? {}), Authorization: `Bearer ${t}` },
    });
    const res = await makeReq(token);
    if (res.status !== 401) return res;
    token = await this.refreshToken();
    return makeReq(token);
  }

  async getScansByUser(userId: string): Promise<Scan[]> {
    const res = await this.fetchAuth(`${this.dbUrl}/read?tableName=scan&user_id=${userId}`);
    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => ({
      _id:       r._id,
      userId:    r.user_id,
      jobId:     r.job_id,
      serie:     r.serie,
      tipo:      r.tipo,
      localUri:  r.local_uri,
      createdAt: r.created_at ?? '',
    }));
  }

  async saveScan(params: SaveScanParams): Promise<void> {
    const res = await this.fetchAuth(`${this.dbUrl}/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: 'scan',
        records: [{
          user_id:    params.userId,
          job_id:     params.jobId,
          serie:      params.serie,
          tipo:       params.tipo,
          local_uri:  params.localUri,
          created_at: new Date().toISOString(),
        }],
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Error al guardar el escaneo (HTTP ${res.status})`);
    }
  }

  async updateScan(scanId: string, localUri: string): Promise<void> {
    await this.fetchAuth(`${this.dbUrl}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: 'scan',
        idColumn: '_id',
        idValue: scanId,
        updates: { local_uri: localUri },
      }),
    });
  }

  async deleteScan(scanId: string): Promise<void> {
    const res = await this.fetchAuth(`${this.dbUrl}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: 'scan', idColumn: '_id', idValue: scanId }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail?.detail ?? `Error al eliminar el escaneo (HTTP ${res.status})`);
    }
  }
}
