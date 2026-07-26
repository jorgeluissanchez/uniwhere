/**
 * Mock de @reactvision/react-viro para Jest.
 *
 * En Jest no hay ARCore/ARKit ni runtime nativo de Viro, así que las
 * exportaciones reales no se pueden evaluar. Replicamos la API mínima con
 * componentes RN que devuelven `null` (como hacen los mocks de otros
 * renderers 3D del proyecto, e.g. three-fiber.js).
 *
 * Si un test necesita inspeccionar qué props se le pasaron a ViroARScene (por
 * ejemplo, el callback `onCameraTransformUpdate`), se usa `__viroCalls` o
 * directamente el `testInstance.findByType` del test renderer.
 */
const React = require('react');

function noopComponent(name) {
  const C = () => null;
  C.displayName = name;
  return C;
}

const ViroARScene = noopComponent('ViroARScene');
const ViroARPlane = noopComponent('ViroARPlane');
const ViroARPlaneSelector = noopComponent('ViroARPlaneSelector');
const ViroARImageMarker = noopComponent('ViroARImageMarker');
const ViroNode = noopComponent('ViroNode');
const ViroGroup = noopComponent('ViroGroup');
const Viro3DObject = noopComponent('Viro3DObject');
const ViroAnchor = noopComponent('ViroAnchor');
const ViroCamera = noopComponent('ViroCamera');
const ViroBox = noopComponent('ViroBox');
const ViroSphere = noopComponent('ViroSphere');
const ViroQuad = noopComponent('ViroQuad');
const ViroText = noopComponent('ViroText');
const ViroImage = noopComponent('ViroImage');
const ViroDirectionalLight = noopComponent('ViroDirectionalLight');
const ViroAmbientLight = noopComponent('ViroAmbientLight');
const ViroOmniLight = noopComponent('ViroOmniLight');
const ViroSpotLight = noopComponent('ViroSpotLight');
const ViroSound = noopComponent('ViroSound');
const ViroParticleEmitter = noopComponent('ViroParticleEmitter');
const ViroPortal = noopComponent('ViroPortal');
const ViroSky = noopComponent('ViroSky');
const ViroPolyline = noopComponent('ViroPolyline');

const ViroAmbientLight_typeWarning = noopComponent('ViroAmbientLight');

const useViroCamera = () => null;
const useViroNode = () => null;
const useViroAnchor = () => null;
const useViroUtils = () => null;

module.exports = {
  // constants
  ARTrackingState: { TRACKING_NORMAL: 'NORMAL', TRACKING_LIMITED: 'LIMITED', TRACKING_UNAVAILABLE: 'UNAVAILABLE' },
  ARTrackingStateReason: { INITIALIZING: 'INITIALIZING', RELOCALIZING: 'RELOCALIZING', EXCESSIVE_MOTION: 'EXCESSIVE_MOTION', INSUFFICIENT_FEATURES: 'INSUFFICIENT_FEATURES' },
  ARAnchorDetectionTypes: { Planes: 'Planes', Points: 'Points', Images: 'Images' },
  ARPlaneAlignment: { Horizontal: 'Horizontal', HorizontalUpward: 'HorizontalUpward', HorizontalDownward: 'HorizontalDownward', Vertical: 'Vertical' },
  ARSessionConfiguration: { World: 'World', Image: 'Image' },

  // scene
  ViroARScene,
  ViroARSceneNavigator: ViroARScene,
  ViroARPlane,
  ViroARPlaneSelector,
  ViroARImageMarker,
  ViroNode,
  ViroGroup,
  ViroAnchor,
  ViroCamera,

  // objects
  ViroBox,
  ViroSphere,
  ViroQuad,
  ViroText,
  ViroImage,
  Viro3DObject,

  // lighting
  ViroAmbientLight,
  ViroAmbientLight_typeWarning,
  ViroDirectionalLight,
  ViroOmniLight,
  ViroSpotLight,

  // misc
  ViroSound,
  ViroParticleEmitter,
  ViroPortal,
  ViroSky,
  ViroPolyline,

  // hooks
  useViroCamera,
  useViroNode,
  useViroAnchor,
  useViroUtils,
};
