import * as THREE from 'three';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import { PlyRepository } from '@/features/viewer/domain/repositories/ply-repository';
import { FilePickerDataSource } from '@/features/viewer/data/datasources/file-picker-data-source';
import { PlyStreamingParserDataSource } from '@/features/viewer/data/datasources/ply-streaming-parser-data-source';

const MAX_POINTS = 500_000;

export class PlyRepositoryImpl implements PlyRepository {
  constructor(
    private readonly filePicker: FilePickerDataSource,
    private readonly parser: PlyStreamingParserDataSource,
  ) {}

  async loadFromFile(): Promise<PlyCloud> {
    const { fileUri } = await this.filePicker.pick();
    return this.parse(fileUri);
  }

  async loadFromPath(fileUri: string): Promise<PlyCloud> {
    return this.parse(fileUri);
  }

  private async parse(fileUri: string): Promise<PlyCloud> {
    const { geometry, vertexCount, hasColors } = await this.parser.parse(fileUri, MAX_POINTS);
    geometry.computeBoundingBox();
    const centeringOffset = new THREE.Vector3();
    geometry.boundingBox!.getCenter(centeringOffset);   // capture offset BEFORE centering
    geometry.center();                                   // centers geometry; geometry.boundingBox updated automatically
    return {
      geometry,
      vertexCount,
      originalVertexCount: vertexCount,
      hasColors,
      boundingBox: geometry.boundingBox ?? new THREE.Box3(),
      centeringOffset,
    };
  }
}
