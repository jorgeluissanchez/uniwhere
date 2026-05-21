export type Scan = {
  _id: string;
  userId: string;
  jobId: string;
  serie: string;
  tipo: 'dense' | 'splat';
  localUri: string;
  createdAt: string;
};
