import React from 'react';
import { render } from '@testing-library/react-native';
import { LocalizationResultScreen } from '@/features/localization/presentation/screens/localization-result-screen';

jest.mock('@/features/viewer/presentation/context/viewer-context');
jest.mock('@/features/localization/presentation/context/localization-context');
jest.mock('@/features/viewer/presentation/components/point-cloud-canvas', () => ({
  PointCloudCanvas: () => null,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import * as THREE from 'three';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';

const mockCloud: PlyCloud = {
  geometry: new THREE.BufferGeometry(),
  vertexCount: 100,
  originalVertexCount: 100,
  hasColors: false,
  boundingBox: new THREE.Box3(),
  centeringOffset: new THREE.Vector3(0, 0, 0),
};

const mockUseViewer = useViewer as jest.MockedFunction<typeof useViewer>;
const mockUseLocalization = useLocalization as jest.MockedFunction<typeof useLocalization>;

function setViewerState(cloud: PlyCloud | null, loading = false) {
  mockUseViewer.mockReturnValue({
    cloud,
    loading,
    error: null,
    loadFromPath: jest.fn(),
    loadFile: jest.fn(),
  });
}

function setLocState(result: object | null = null) {
  mockUseLocalization.mockReturnValue({
    selectedScan: null,
    image: null,
    submitting: false,
    error: null,
    result: result as any,
    setSelectedScan: jest.fn(),
    setImage: jest.fn(),
    submit: jest.fn(),
    reset: jest.fn(),
  });
}

describe('LocalizationResultScreen', () => {
  beforeEach(() => {
    setViewerState(mockCloud);
    setLocState();
  });

  it('shows loading indicator when viewer is loading', () => {
    setViewerState(null, true);
    setLocState();
    const { getByText } = render(<LocalizationResultScreen />);
    expect(getByText('Cargando modelo…')).toBeTruthy();
  });

  it('shows loading indicator when cloud is null', () => {
    setViewerState(null);
    setLocState();
    const { getByText } = render(<LocalizationResultScreen />);
    expect(getByText('Cargando modelo…')).toBeTruthy();
  });

  it('shows "Usted se encuentra aquí" badge when result is present', () => {
    setLocState({ x: 1, y: 2, z: 3, success: true, inlier_count: 10 });
    const { getByText } = render(<LocalizationResultScreen />);
    expect(getByText('Usted se encuentra aquí')).toBeTruthy();
  });

  it('shows low-confidence warning when success is false', () => {
    setLocState({ x: 1, y: 2, z: 3, success: false, inlier_count: 3 });
    const { getByText } = render(<LocalizationResultScreen />);
    expect(getByText(/baja confianza/)).toBeTruthy();
  });

  it('shows coordinates', () => {
    setLocState({ x: 1.123, y: 2.456, z: 3.789, success: true, inlier_count: 15 });
    const { getByText } = render(<LocalizationResultScreen />);
    expect(getByText(/X: 1.123/)).toBeTruthy();
  });

  it('matches snapshot', () => {
    setLocState({ x: 1, y: 2, z: 3, success: true, inlier_count: 10 });
    const { toJSON } = render(<LocalizationResultScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
