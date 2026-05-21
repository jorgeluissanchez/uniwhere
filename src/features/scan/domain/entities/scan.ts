export type Scan = {
  scanId: string;
  userId: string;
  jobId: string;
  serie: string;
  tipo: 'dense' | 'splat';
  localUri: string;
  createdAt: string;
};
