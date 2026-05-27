import * as THREE from 'three';
import * as FileSystem from 'expo-file-system';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
    // fetch() fails with file:// URIs on Android — use FileSystem base64 read instead
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const loader = new GLTFLoader();
    return new Promise<THREE.Group>((resolve, reject) =>
      loader.parse(bytes.buffer, '', (gltf: GLTF) => resolve(gltf.scene), reject)
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
