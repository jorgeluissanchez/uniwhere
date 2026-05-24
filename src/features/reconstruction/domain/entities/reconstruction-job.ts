export type JobStatus = 'pending' | 'reconstructing' | 'training' | 'done' | 'error' | 'timeout';

export type ReconstructionJob = {
  jobId: string;
  serie: string;
  status: JobStatus;
  progress: string[];
  error: string | null;
};
