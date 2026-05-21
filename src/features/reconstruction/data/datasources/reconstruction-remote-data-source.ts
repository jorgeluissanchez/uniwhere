import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import { StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';

export interface ReconstructionRemoteDataSource {
  startJob(params: StartJobParams): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<ReconstructionJob>;
}
