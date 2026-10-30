// Builds the Android app with Gradle and writes the full output to build-android.log.
//
//   node scripts/build-android.js [debug|release] [abi]
//
// The abi defaults to x86_64 (the emulator). Use arm64-v8a for a real phone.
// Set ANDROID_DL_PROXY=host:port to send Gradle's downloads through a proxy.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const variant = process.argv[2] === 'release' ? 'Release' : 'Debug';
const abi = process.argv[3] || 'x86_64';
if (!abi.split(',').every((value) => ['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'].includes(value))) throw new Error('Unsupported Android architecture');
const root = path.join(__dirname, '..');
const logPath = path.join(root, 'build-android.log');
const testSigning = process.env.AKADEMIYA_TEST_SIGNING === '1' || process.argv[4] === 'test';
const bundle = ['bundle', 'both'].includes(process.argv[4]);
const signing = {};
if (variant === 'Release' && !testSigning) {
  if (process.env.EXPO_PUBLIC_VISUAL_AUDIT === '1' || process.env.EXPO_PUBLIC_INTERNAL_BUILD === '1')
    throw new Error('A public release cannot contain capture fixtures or internal controls.');
  const filename = process.env.AKADEMIYA_SIGNING_CONFIG || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local/share'), 'Akademiya', 'signing', 'android-signing.json');
  if (!fs.existsSync(filename)) throw new Error('Run node scripts/init-android-signing.cjs first. Public releases never fall back to the debug key.');
  const key = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!key.storeFile || !fs.existsSync(key.storeFile) || !key.storePassword || !key.keyAlias || !key.keyPassword)
    throw new Error('The private signing configuration is incomplete.');
  Object.assign(signing, { AKADEMIYA_STORE_FILE: key.storeFile, AKADEMIYA_STORE_PASSWORD: key.storePassword, AKADEMIYA_KEY_ALIAS: key.keyAlias, AKADEMIYA_KEY_PASSWORD: key.keyPassword });
}

const env = {
  ...process.env,
  ...signing,
  AKADEMIYA_TEST_SIGNING: testSigning ? '1' : '0',
  JAVA_HOME: process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr',
  ANDROID_HOME: process.env.ANDROID_HOME || path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
  // The NDK's default CMake breaks on Windows paths longer than 260 characters.
  CMAKE_VERSION: '3.31.6',
};

const args = [
  ...(process.argv[4] === 'bundle' ? [`app:bundle${variant}`] : process.argv[4] === 'both' ? [`app:assemble${variant}`, `app:bundle${variant}`] : [`app:assemble${variant}`]), `-PreactNativeArchitectures=${abi}`, '--console=plain',
  '--max-workers=2', '--no-parallel',
  '"-Dorg.gradle.jvmargs=-Xmx2048m -XX:ActiveProcessorCount=2 -XX:MaxMetaspaceSize=768m"',
  '-Dorg.gradle.internal.http.connectionTimeout=15000',
  '-Dorg.gradle.internal.http.socketTimeout=30000',
];
if (process.env.ANDROID_DL_PROXY) {
  const [host, port] = process.env.ANDROID_DL_PROXY.split(':');
  if (!/^[a-zA-Z0-9.-]+$/.test(host) || !/^\d+$/.test(port) || +port < 1 || +port > 65535) {
    throw new Error('ANDROID_DL_PROXY must be a hostname:port');
  }
  const proxy = [`-Dhttps.proxyHost=${host}`, `-Dhttps.proxyPort=${port}`];
  args.push(...proxy);
  env.GRADLE_OPTS = [env.GRADLE_OPTS, ...proxy].filter(Boolean).join(' ');
}

const log = fs.createWriteStream(logPath);
const started = Date.now();
const executable = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
// All variable arguments are validated above; the one argument containing spaces
// is a fixed, quoted JVM setting. Keep the batch invocation explicit on Windows.
const gradle = spawn([executable, ...args].join(' '), {
  cwd: path.join(root, 'android'),
  env,
  shell: true,
});
gradle.stdout.pipe(log, { end: false });
gradle.stderr.pipe(log, { end: false });
gradle.on('error', (error) => log.write(`${error.message}\n`));
gradle.on('close', (code) => {
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  log.end(() => {
    console.log(`gradle ${variant} ${abi}: exit ${code} after ${minutes} min, log in build-android.log`);
    if (code === 0 && variant === 'Release') {
      const destination = path.join(root, '.expo', 'builds');
      fs.mkdirSync(destination, { recursive: true });
      const name = testSigning ? 'akademiya-test' : 'akademiya-english';
      if (process.argv[4] !== 'bundle') fs.copyFileSync(path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), path.join(destination, `${name}-${abi}.apk`));
      if (bundle) fs.copyFileSync(path.join(root, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'), path.join(destination, `${name}-${abi}.aab`));
    }
    process.exitCode = code ?? 1;
  });
});
