import * as THREE from 'three';

export type PlyCloud = {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  originalVertexCount: number;
  hasColors: boolean;
  boundingBox: THREE.Box3;
  centeringOffset: THREE.Vector3;   // bbox center before centering; used to adjust marker coordinates
};
