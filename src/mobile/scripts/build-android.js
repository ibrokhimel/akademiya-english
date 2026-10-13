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
const root = path.join(__dirname, '..');
const logPath = path.join(root, 'build-android.log');

const env = {
  ...process.env,
  JAVA_HOME: process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr',
  ANDROID_HOME: process.env.ANDROID_HOME || path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
  // The NDK's default CMake breaks on Windows paths longer than 260 characters.
  CMAKE_VERSION: '3.31.6',
};

const args = [`app:assemble${variant}`, `-PreactNativeArchitectures=${abi}`, '--console=plain'];
if (process.env.ANDROID_DL_PROXY) {
  const [host, port] = process.env.ANDROID_DL_PROXY.split(':');
  const proxy = [`-Dhttps.proxyHost=${host}`, `-Dhttps.proxyPort=${port}`];
  args.push(...proxy);
  env.GRADLE_OPTS = [env.GRADLE_OPTS, ...proxy].filter(Boolean).join(' ');
}

const log = fs.createWriteStream(logPath);
const started = Date.now();
const gradle = spawn(process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew', args, {
  cwd: path.join(root, 'android'),
  env,
  shell: true,
});
gradle.stdout.pipe(log);
gradle.stderr.pipe(log);
gradle.on('close', (code) => {
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`gradle ${variant} ${abi}: exit ${code} after ${minutes} min, log in build-android.log`);
  process.exit(code ?? 1);
});
