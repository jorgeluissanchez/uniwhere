import { File, Paths } from 'expo-file-system';
import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import { ReconstructionRepository, StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';
import { ReconstructionRemoteDataSource } from '@/features/reconstruction/data/datasources/reconstruction-remote-data-source';

export class ReconstructionRepositoryImpl implements ReconstructionRepository {
  constructor(private readonly remoteDS: ReconstructionRemoteDataSource) {}

  async startJob(params: StartJobParams): Promise<{ jobId: string; serie: string }> {
    return this.remoteDS.startJob(params);
  }

  async getStatus(jobId: string): Promise<ReconstructionJob> {
    return this.remoteDS.getStatus(jobId);
  }

  async downloadPly(jobId: string, serie: string, tipo: 'dense' | 'splat' = 'dense'): Promise<string> {
    const fileName = `${serie}_${tipo}.ply`;
    const url = `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/download/${jobId}?tipo=${tipo}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`La descarga falló con estado ${response.status}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const dest = new File(Paths.cache, fileName);
    dest.write(bytes);
    return dest.uri;
  }
}
