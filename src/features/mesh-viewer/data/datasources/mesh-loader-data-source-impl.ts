import * as THREE from 'three';
import { File } from 'expo-file-system';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshLoaderDataSource } from './mesh-loader-data-source';

export class MeshLoaderDataSourceImpl implements MeshLoaderDataSource {
  async loadOBJ(uri: string): Promise<THREE.Group> {
    const text = await new File(uri).text();
    await new Promise<void>(resolve => setTimeout(resolve, 50));
    const loader = new OBJLoader();
    return loader.parse(text);
  }

  async loadGLTF(uri: string): Promise<THREE.Group> {
    const buffer = await new File(uri).arrayBuffer();
    // Yield to event loop so the loading indicator renders before the
    // synchronous GLTFLoader.parse() blocks the JS thread.
    await new Promise<void>(resolve => setTimeout(resolve, 50));
    const loader = new GLTFLoader();
    return new Promise<THREE.Group>((resolve, reject) =>
      loader.parse(buffer, '', (gltf: GLTF) => resolve(gltf.scene), reject)
    );
  }
}
