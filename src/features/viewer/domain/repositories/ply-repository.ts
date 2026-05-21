import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';

export interface PlyRepository {
  loadFromFile(): Promise<PlyCloud>;
  loadFromPath(fileUri: string): Promise<PlyCloud>;
}
