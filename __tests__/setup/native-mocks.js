'use strict';

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-file-system
jest.mock('expo-file-system', () => {
  const mockFileInstance = {
    exists: true,
    uri: 'file://mock/path.jpg',
    write: jest.fn(),
  };
  return {
    File: jest.fn(() => mockFileInstance),
    Paths: { cache: 'file://cache/', document: 'file://document/' },
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
  default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

// expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = (props) => React.createElement('View', props);
  return new Proxy({}, {
    get: () => Icon,
  });
});

// react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    default: (props) => React.createElement('Svg', props),
    Svg: (props) => React.createElement('Svg', props),
    Line: (props) => React.createElement('Line', props),
    Circle: (props) => React.createElement('Circle', props),
    SvgXml: (props) => React.createElement('SvgXml', props),
  };
});

// @react-three/fiber
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }) => children || null,
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
  Link: ({ children }) => children || null,
  RelativePathString: '',
}));
