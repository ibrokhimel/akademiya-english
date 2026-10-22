const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;

// Rive files are bundled as assets, like images.
config.resolver.assetExts.push("riv");
// Native builds generate thousands of files. Exclude their absolute Windows
// paths so they cannot stall Metro's source watcher and asset HTTP requests.
const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  ...["android", "ios", ".expo"].map(
    (name) =>
      new RegExp(
        `^${escapePattern(path.resolve(__dirname, name))}(?:[\\\\/]|$)`,
      ),
  ),
  /[\\/]node_modules[\\/](?:@[^\\/]+[\\/])?[^\\/]+[\\/]android[\\/](?:build|\.cxx)(?:[\\/]|$)/,
  /[\\/]build-android[^\\/]*\.log$/,
];
// The mobile app reuses the browser's approved content, rules and artwork.
// Watch only these shared directories, rather than the design labs' node_modules.
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    path.resolve(__dirname, "../content"),
    path.resolve(__dirname, "../core"),
    path.resolve(__dirname, "../../pendev/icons-r2"),
    path.resolve(__dirname, "../../design/rive/out"),
    path.resolve(__dirname, "../../design/sound/final"),
    path.resolve(__dirname, "../../design/sound/families/sine"),
    path.resolve(__dirname, "../../design/sound/dombi/dombi-acted"),
  ]),
];

module.exports = config;
