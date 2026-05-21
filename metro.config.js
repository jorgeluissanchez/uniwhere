const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["react-native", "require", "default"];

// Force a single Three.js instance — r3f and our parser both import it
config.resolver.extraNodeModules = {
  three: path.resolve(__dirname, 'node_modules/three'),
};

const nativeWindConfig = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });

// @react-three/fiber has an empty "exports" map, so Metro won't resolve
// its /native subpath when package-exports mode is on. Bypass it explicitly.
const upstream = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (ctx, moduleName, platform) => {
  if (moduleName === '@react-three/fiber/native') {
    return { filePath: require.resolve('@react-three/fiber/native'), type: 'sourceFile' };
  }
  return upstream ? upstream(ctx, moduleName, platform) : ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = nativeWindConfig;
