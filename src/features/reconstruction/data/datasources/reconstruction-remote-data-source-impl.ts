import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import { StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';
import { ReconstructionRemoteDataSource } from '@/features/reconstruction/data/datasources/reconstruction-remote-data-source';

export class ReconstructionRemoteDataSourceImpl implements ReconstructionRemoteDataSource {
  private readonly baseUrl: string;

  constructor() {
    const url = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL;
    if (!url) throw new Error('Falta la variable de entorno EXPO_PUBLIC_RECONSTRUCTION_API_URL');
    this.baseUrl = url;
  }

  async startJob(params: StartJobParams): Promise<{ jobId: string; serie: string }> {
    const form = new FormData();
    form.append('serie', params.serie);
    if (params.inferGs) { form.append('infer_gs', 'true'); }

    for (const photo of params.photos) {
      if (typeof document !== 'undefined') {
        // Web: fetch the data/object URL and convert to a real File for FormData
        const blob = await fetch(photo.uri).then(r => r.blob());
        form.append('fotos', new File([blob], photo.name, { type: photo.type }));
      } else {
        // Android/iOS: React Native FormData accepts the {uri, name, type} object directly
        form.append('fotos', { uri: photo.uri, name: photo.name, type: photo.type } as any);
      }
    }

    const res = await fetch(`${this.baseUrl}/reconstruct`, { method: 'POST', body: form });
    const body = await res.json();
    if (!res.ok) { throw new Error(body.detail ?? `Error HTTP ${res.status}`); }
    return { jobId: body.job_id, serie: body.serie };
  }

  async getStatus(jobId: string): Promise<ReconstructionJob> {
    const res = await fetch(`${this.baseUrl}/status/${jobId}`);
    const body = await res.json();
    if (!res.ok) { throw new Error(body.detail ?? `Error HTTP ${res.status}`); }
    return {
      jobId: body.job_id,
      serie: body.serie,
      status: body.status,
      progress: body.progress ?? [],
      error: body.error ?? null,
    };
  }
}
