import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';

export interface IMeshRepository {
  pickAndLoad(): Promise<MeshModel | null>;
}
