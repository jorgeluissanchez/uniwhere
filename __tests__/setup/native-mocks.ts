// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-file-system (new API used by scan datasource)
jest.mock('expo-file-system', () => {
  const mockFileInstance = {
    exists: true,
    uri: 'file://mock/path.jpg',
    write: jest.fn(),
  };
  return {
    File: jest.fn(() => mockFileInstance),
    Paths: {
      cache: 'file://cache/',
      document: 'file://document/',
    },
  };
});

// expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { hostUri: 'localhost:8081' },
  },
}));

// expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const Svg = (props: any) => React.createElement('Svg', props);
  const Line = (props: any) => React.createElement('Line', props);
  const Circle = (props: any) => React.createElement('Circle', props);
  const SvgXml = (props: any) => React.createElement('SvgXml', props);
  return { default: Svg, Svg, Line, Circle, SvgXml };
});

// @react-three/fiber (exclude 3D rendering from tests)
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: any) => children,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ camera: {}, scene: {}, gl: {} })),
}));

// r3f-native-orbitcontrols
jest.mock('r3f-native-orbitcontrols', () => ({
  OrbitControls: () => null,
}));

// expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: any) => children,
}));
