import * as THREE from 'three';

export type ParseResult = {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  hasColors: boolean;
};

export interface PlyStreamingParserDataSource {
  parse(fileUri: string, maxPoints: number): Promise<ParseResult>;
}
