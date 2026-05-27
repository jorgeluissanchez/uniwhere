import * as THREE from 'three';
import * as FileSystem from 'expo-file-system';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MeshLoaderDataSource } from './mesh-loader-data-source';

export class MeshLoaderDataSourceImpl implements MeshLoaderDataSource {
  async loadOBJ(uri: string): Promise<THREE.Group> {
    const text = await FileSystem.readAsStringAsync(uri);
    const loader = new OBJLoader();
    const group = loader.parse(text);
    this.applyFallbackMaterial(group);
    return group;
  }

  async loadGLTF(uri: string): Promise<THREE.Group> {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`Error al leer el archivo (HTTP ${res.status})`);
    const buffer = await res.arrayBuffer();
    const loader = new GLTFLoader();
    return new Promise<THREE.Group>((resolve, reject) =>
      loader.parse(buffer, '', gltf => resolve(gltf.scene), reject)
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
