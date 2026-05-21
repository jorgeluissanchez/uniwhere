import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';

export type StartJobParams = {
  serie: string;
  photos: Array<{ uri: string; name: string; type: string }>;
  inferGs?: boolean;
};

export interface ReconstructionRepository {
  startJob(params: StartJobParams): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<ReconstructionJob>;
  downloadPly(jobId: string, tipo?: 'dense' | 'splat'): Promise<string>;
}
