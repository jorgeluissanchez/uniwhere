import * as FileSystem from 'expo-file-system';
import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import { ReconstructionRepository, StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';
import { ReconstructionRemoteDataSource } from '@/features/reconstruction/data/datasources/reconstruction-remote-data-source';

export class ReconstructionRepositoryImpl implements ReconstructionRepository {
  constructor(private readonly remoteDS: ReconstructionRemoteDataSource) {}

  async startJob(params: StartJobParams): Promise<{ jobId: string }> {
    return this.remoteDS.startJob(params);
  }

  async getStatus(jobId: string): Promise<ReconstructionJob> {
    return this.remoteDS.getStatus(jobId);
  }

  async downloadPly(jobId: string, tipo: 'dense' | 'splat' = 'dense'): Promise<string> {
    const job = await this.remoteDS.getStatus(jobId);
    const fileName = `${job.serie}_${tipo}.ply`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    const url = `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/download/${jobId}?tipo=${tipo}`;

    const result = await FileSystem.downloadAsync(url, localUri);
    if (result.status !== 200) {
      throw new Error(`La descarga falló con estado ${result.status}`);
    }
    return result.uri;
  }
}
