import * as THREE from 'three';

export interface MeshModel {
  scene: THREE.Group;
  boundingBox: THREE.Box3;
}
