import * as THREE from 'three';

export interface MeshLoaderDataSource {
  loadOBJ(uri: string): Promise<THREE.Group>;
  loadGLTF(uri: string): Promise<THREE.Group>; // handles both .glb and .gltf
}
