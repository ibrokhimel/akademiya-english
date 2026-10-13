const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Rive files are bundled as assets, like images.
config.resolver.assetExts.push('riv');

module.exports = config;
