const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Add any additional asset extensions here
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg'
);

// Exclude backend directory from Metro watcher
config.watchFolders = config.watchFolders || [];
config.watchFolders = config.watchFolders.filter(folder => !folder.includes('backend'));

// Add resolver to ignore backend files
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.blockList = [
  /backend\/.*/,
  /\.next\/.*/,
];

module.exports = config;
