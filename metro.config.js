const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["react-native", "require", "default"];

const THREE_MAIN = path.resolve(__dirname, 'node_modules/three/build/three.cjs');

const nativeWindConfig = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });

const upstream = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (ctx, moduleName, platform) => {
  // Force a single Three.js instance regardless of which package imports it
  if (moduleName === 'three') {
    return { filePath: THREE_MAIN, type: 'sourceFile' };
  }
  // @react-three/fiber has an empty "exports" map — bypass it explicitly
  if (moduleName === '@react-three/fiber/native') {
    return { filePath: require.resolve('@react-three/fiber/native'), type: 'sourceFile' };
  }
  return upstream ? upstream(ctx, moduleName, platform) : ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = nativeWindConfig;
