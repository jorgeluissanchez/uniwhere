import * as THREE from 'three';
import { IMeshRepository } from '@/features/mesh-viewer/domain/repositories/i-mesh-repository';
import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';
import { MeshFilePickerDataSource } from '../datasources/mesh-file-picker-data-source';
import { MeshLoaderDataSource } from '../datasources/mesh-loader-data-source';

export class MeshRepositoryImpl implements IMeshRepository {
  constructor(
    private readonly picker: MeshFilePickerDataSource,
    private readonly loader: MeshLoaderDataSource,
  ) {}

  async pickAndLoad(): Promise<MeshModel | null> {
    let uri: string;
    try {
      uri = await this.picker.pickFile();
    } catch (e) {
      if (e instanceof Error && /cancel/i.test(e.message)) return null;
      throw e;
    }

    const ext = uri.split('.').pop()?.toLowerCase();
    let scene: THREE.Group;

    if (ext === 'obj') {
      scene = await this.loader.loadOBJ(uri);
    } else if (ext === 'glb' || ext === 'gltf') {
      scene = await this.loader.loadGLTF(uri);
    } else {
      throw new Error(`Formato no soportado: .${ext}. Use OBJ, GLB o GLTF.`);
    }

    const boundingBox = new THREE.Box3().setFromObject(scene);
    return { scene, boundingBox };
  }
}
