const { withAppBuildGradle } = require('expo/config-plugins');

function applyReleaseSigning(source) {
  const start = '// Akademiya release signing: begin';
  const end = '// Akademiya release signing: end';
  source = source.replace(new RegExp(`    ${start}[\\s\\S]*?    ${end}\\r?\\n`, 'g'), '');
  const marker = '    signingConfigs {';
  if (!source.includes(marker)) throw new Error('Release signing: Gradle template changed');
  source = source.replace(marker, `    ${start}
    def akademiyaTestSigner = System.getenv('AKADEMIYA_TEST_SIGNING') == '1'
    def akademiyaKeyPath = System.getenv('AKADEMIYA_STORE_FILE')
    ${end}
${marker}`);
  // Idempotently replace our own config or add it to a freshly generated project.
  source = source.replace(/        akademiyaRelease \{[\s\S]*?\n        \}\n/g, '');
  source = source.replace(marker, `${marker}
        akademiyaRelease {
            if (akademiyaKeyPath) {
                storeFile file(akademiyaKeyPath)
                storePassword System.getenv('AKADEMIYA_STORE_PASSWORD')
                keyAlias System.getenv('AKADEMIYA_KEY_ALIAS')
                keyPassword System.getenv('AKADEMIYA_KEY_PASSWORD')
            }
        }`);
  const release = source.indexOf('        release {');
  if (release < 0) throw new Error('Release signing: no release build type');
  const after = source.slice(release).replace(/signingConfig (?:signingConfigs\.debug|\(akademiyaTestSigner \? signingConfigs\.debug : signingConfigs\.akademiyaRelease\))/, 'signingConfig (akademiyaTestSigner ? signingConfigs.debug : signingConfigs.akademiyaRelease)');
  return source.slice(0, release) + after;
}
module.exports = config => withAppBuildGradle(config, config => {
  if (config.modResults.language !== 'groovy') throw new Error('Release signing requires Groovy Gradle');
  config.modResults.contents = applyReleaseSigning(config.modResults.contents);
  return config;
});
module.exports.applyReleaseSigning = applyReleaseSigning;
