export type JobStatus = 'pending' | 'running' | 'done' | 'error' | 'timeout';

export type ReconstructionJob = {
  jobId: string;
  serie: string;
  status: JobStatus;
  progress: string[];
  error: string | null;
};
