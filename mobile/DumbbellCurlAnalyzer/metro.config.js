const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('bin');
config.resolver.assetExts.push('txt');
config.resolver.assetExts.push('jpg');
config.resolver.assetExts.push('png');
config.resolver.assetExts.push('json');

config.resolver.alias = {
  ...config.resolver.alias,
  '@tensorflow/tfjs': '@tensorflow/tfjs-react-native',
};

module.exports = config;
