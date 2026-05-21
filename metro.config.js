const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// MSW: required for React Native support
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["browser", "require", "default"];

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
