import React from 'react';
import { render } from '@testing-library/react-native';
import { HUD } from '@/features/viewer/presentation/components/hud';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import * as THREE from 'three';

const makeCloud = (overrides: Partial<PlyCloud> = {}): PlyCloud => ({
  geometry: new THREE.BufferGeometry(),
  vertexCount: 1000,
  originalVertexCount: 1000,
  hasColors: false,
  boundingBox: new THREE.Box3(),
  centeringOffset: new THREE.Vector3(),
  ...overrides,
});

describe('HUD', () => {
  it('shows vertex count and FPS', () => {
    const { getByText } = render(<HUD cloud={makeCloud()} fps={60} />);
    expect(getByText('Puntos: 1,000')).toBeTruthy();
    expect(getByText('FPS: 60')).toBeTruthy();
  });

  it('shows processing text when loading', () => {
    const { getByText } = render(<HUD cloud={makeCloud()} fps={0} loading />);
    expect(getByText('Procesando…')).toBeTruthy();
  });

  it('shows reduced vertex info when decimated', () => {
    const { getByText } = render(
      <HUD cloud={makeCloud({ vertexCount: 500, originalVertexCount: 1000 })} fps={30} />
    );
    expect(getByText(/reducido de 1,000/)).toBeTruthy();
  });

  it('does not show reduced vertex info when counts match', () => {
    const { queryByText } = render(<HUD cloud={makeCloud()} fps={30} />);
    expect(queryByText(/reducido/)).toBeNull();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<HUD cloud={makeCloud()} fps={60} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
