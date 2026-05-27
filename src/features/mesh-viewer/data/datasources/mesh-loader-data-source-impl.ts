import * as THREE from 'three';
import { File } from 'expo-file-system';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshLoaderDataSource } from './mesh-loader-data-source';

export class MeshLoaderDataSourceImpl implements MeshLoaderDataSource {
  async loadOBJ(uri: string): Promise<THREE.Group> {
    const text = await new File(uri).text();
    const loader = new OBJLoader();
    const group = loader.parse(text);
    this.applyFallbackMaterial(group);
    return group;
  }

  async loadGLTF(uri: string): Promise<THREE.Group> {
    const buffer = await new File(uri).arrayBuffer();
    const loader = new GLTFLoader();
    return new Promise<THREE.Group>((resolve, reject) =>
      loader.parse(buffer, '', (gltf: GLTF) => resolve(gltf.scene), reject)
    );
  }

  private applyFallbackMaterial(group: THREE.Group): void {
    const fallback = new THREE.MeshLambertMaterial({ color: '#cccccc' });
    group.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.material || child.material instanceof THREE.MeshBasicMaterial) {
        child.material = fallback;
      }
    });
  }
}
