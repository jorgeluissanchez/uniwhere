const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// MSW: required for React Native support
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["browser", "require", "default"];

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
