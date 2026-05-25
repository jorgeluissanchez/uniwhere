// __tests__/unit/features/viewer/data/repositories/ply-repository-impl.test.ts
import * as THREE from 'three';
import { PlyRepositoryImpl } from '@/features/viewer/data/repositories/ply-repository-impl';

const makeGeometry = (vertices: number[]): THREE.BufferGeometry => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geo;
};

describe('PlyRepositoryImpl', () => {
  let filePicker: { pick: jest.Mock };
  let parser: { parse: jest.Mock };
  let repo: PlyRepositoryImpl;

  beforeEach(() => {
    filePicker = { pick: jest.fn().mockResolvedValue({ fileUri: 'file://test.ply' }) };
    parser = { parse: jest.fn() };
    repo = new PlyRepositoryImpl(filePicker as any, parser as any);
  });

  it('loadFromPath calls parser with the given URI', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    await repo.loadFromPath('file://my.ply');

    expect(parser.parse).toHaveBeenCalledWith('file://my.ply', expect.any(Number));
  });

  it('centeringOffset is captured before geometry.center()', async () => {
    // Place a single vertex at (2, 4, 6) so center = (2, 4, 6)
    const geo = makeGeometry([2, 4, 6]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    const cloud = await repo.loadFromPath('file://my.ply');

    // centeringOffset should equal the original center of the geometry
    expect(cloud.centeringOffset.x).toBeCloseTo(2);
    expect(cloud.centeringOffset.y).toBeCloseTo(4);
    expect(cloud.centeringOffset.z).toBeCloseTo(6);
  });

  it('returns hasColors from parser', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: true });

    const cloud = await repo.loadFromPath('file://my.ply');
    expect(cloud.hasColors).toBe(true);
  });

  it('loadFromFile uses filePicker to get URI', async () => {
    const geo = makeGeometry([0, 0, 0]);
    parser.parse.mockResolvedValue({ geometry: geo, vertexCount: 1, hasColors: false });

    await repo.loadFromFile();
    expect(filePicker.pick).toHaveBeenCalled();
    expect(parser.parse).toHaveBeenCalledWith('file://test.ply', expect.any(Number));
  });
});
