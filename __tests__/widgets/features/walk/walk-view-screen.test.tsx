import React from 'react';
import { render } from '@testing-library/react-native';

import { DIProvider } from '@/core/di/di-provider';
import { WalkViewScreen } from '@/features/walk/presentation/screens/walk-view-screen';

import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { useLocalSearchParams } from 'expo-router';
import * as THREE from 'three';

// Force "always renders" path: pretend we're not in Expo Go so the screen
// exercises the real branch (spinner / error / load).
jest.mock('expo', () => ({
  isRunningInExpoGo: () => false,
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('@reactvision/react-viro', () => ({
  ViroARSceneNavigator: () => null,
  ViroARScene: () => null,
  ViroAmbientLight: () => null,
  ViroNode: () => null,
}));

jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: any) => children ?? null,
  useFrame: () => {},
  useThree: () => ({ camera: { position: { copy: () => {}, set: () => {} }, quaternion: { copy: () => {}, set: () => {} } } }),
}));

// Mock the joystick so we don't pull react-native-gesture-handler into the
// test, which requires a GestureHandlerRootView to mount.
jest.mock('@/features/walk/presentation/components/walk-joystick', () => ({
  WalkJoystick: () => null,
}));

jest.mock('@/features/viewer/presentation/context/viewer-context');
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  RelativePathString: '',
}));

describe('WalkViewScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
  });

  it('muestra spinner si no hay PLY cargada', async () => {
    (useViewer as jest.Mock).mockReturnValue({
      cloud: null,
      loading: true,
      error: null,
      loadFromPath: jest.fn(),
    });

    const { findByText } = render(<DIProvider><WalkViewScreen /></DIProvider>);
    expect(await findByText('Cargando PLY…')).toBeTruthy();
  });

  it('muestra mensaje de error distinto al spinner', async () => {
    (useViewer as jest.Mock).mockReturnValue({
      cloud: null,
      loading: false,
      error: 'No se pudo cargar',
      loadFromPath: jest.fn(),
    });

    const { findByText } = render(<DIProvider><WalkViewScreen /></DIProvider>);
    expect(await findByText('No se pudo cargar')).toBeTruthy();
  });

  it('intenta cargar el PLY cuando llega un localUri', () => {
    const loadFromPath = jest.fn().mockResolvedValue(true);
    (useViewer as jest.Mock).mockReturnValue({
      cloud: null,
      loading: false,
      error: null,
      loadFromPath,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ localUri: 'file:///ply/example.ply' });

    render(<DIProvider><WalkViewScreen /></DIProvider>);
    expect(loadFromPath).toHaveBeenCalledWith('file:///ply/example.ply');
  });

  it('no recarga si ya hay cloud', () => {
    const loadFromPath = jest.fn();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const fakeCloud = {
      geometry,
      boundingBox: { min: { y: 0 }, max: { y: 3 } },
      centeringOffset: { x: 0, y: 0, z: 0 },
    };
    (useViewer as jest.Mock).mockReturnValue({
      cloud: fakeCloud,
      loading: false,
      error: null,
      loadFromPath,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ localUri: 'file:///ply.ply' });

    render(<DIProvider><WalkViewScreen /></DIProvider>);
    expect(loadFromPath).not.toHaveBeenCalled();
  });
});
