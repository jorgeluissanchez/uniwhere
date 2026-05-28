import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { IMeshRepository } from '@/features/mesh-viewer/domain/repositories/i-mesh-repository';
import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';
import { MeshFilePickerDataSource } from '../datasources/mesh-file-picker-data-source';
import { MeshLoaderDataSource } from '../datasources/mesh-loader-data-source';

const MAX_TRIANGLES = 300_000;

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

    const geometry = this.mergeAndOptimize(scene);
    this.disposeScene(scene);

    const material = new THREE.MeshLambertMaterial({ color: '#cccccc' });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    const boundingBox = new THREE.Box3().setFromObject(group);
    return { scene: group, boundingBox };
  }

  private mergeAndOptimize(scene: THREE.Group): THREE.BufferGeometry {
    scene.updateMatrixWorld(true);
    const posOnlyGeos: THREE.BufferGeometry[] = [];

    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const src = child.geometry.index
        ? child.geometry.toNonIndexed()
        : child.geometry.clone();

      const posOnly = new THREE.BufferGeometry();
      posOnly.setAttribute('position', src.getAttribute('position').clone());
      posOnly.applyMatrix4(child.matrixWorld);
      posOnlyGeos.push(posOnly);
      src.dispose();
    });

    if (posOnlyGeos.length === 0) throw new Error('No se encontraron geometrías en el modelo');

    const merged = posOnlyGeos.length === 1
      ? posOnlyGeos[0]
      : mergeGeometries(posOnlyGeos);
    posOnlyGeos.forEach(g => g !== merged && g.dispose());

    const indexed = mergeVertices(merged);
    merged.dispose();

    const triCount = indexed.index!.count / 3;
    let finalGeo: THREE.BufferGeometry = indexed;

    if (triCount > MAX_TRIANGLES) {
      const targetVerts = Math.floor(indexed.attributes.position.count * (MAX_TRIANGLES / triCount));
      const toRemove = indexed.attributes.position.count - Math.max(targetVerts, 3);
      if (toRemove > 0) {
        const modifier = new SimplifyModifier();
        try {
          finalGeo = modifier.modify(indexed, toRemove);
          indexed.dispose();
        } catch {
          // SimplifyModifier failed — use indexed geometry as-is (still merged, still 1 draw call)
          finalGeo = indexed;
        }
      }
    }

    finalGeo.computeVertexNormals();
    finalGeo.center();
    return finalGeo;
  }

  private disposeScene(scene: THREE.Group): void {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    });
  }
}
