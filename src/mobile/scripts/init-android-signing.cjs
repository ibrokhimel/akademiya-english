// Creates a private, durable upload key outside the repository. Never prints passwords.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const directory = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local/share'), 'Akademiya', 'signing');
const settings = path.join(directory, 'android-signing.json');
if (fs.existsSync(settings)) {
  const config = JSON.parse(fs.readFileSync(settings, 'utf8'));
  if (!fs.existsSync(config.storeFile)) throw new Error('Signing configuration exists but its keystore is missing. Restore the original key.');
  console.log('Existing private signing key is ready.');
  process.exit(0);
}
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const storeFile = path.join(directory, 'akademiya-upload.jks');
if (fs.existsSync(storeFile)) throw new Error('An existing keystore has no configuration. Restore its password; refusing to overwrite it.');
const password = crypto.randomBytes(32).toString('base64url');
const keytool = path.join(process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr', 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
const result = spawnSync(keytool, ['-genkeypair', '-noprompt', '-keystore', storeFile, '-storetype', 'JKS', '-alias', 'akademiya-upload', '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000', '-dname', 'CN=Akademiya English, O=Akademiya', '-storepass:env', 'AKADEMIYA_NEW_KEY_PASSWORD', '-keypass:env', 'AKADEMIYA_NEW_KEY_PASSWORD'], { env: { ...process.env, AKADEMIYA_NEW_KEY_PASSWORD: password }, encoding: 'utf8' });
if (result.status !== 0) throw new Error('Key generation failed: ' + result.stderr);
fs.writeFileSync(settings, JSON.stringify({ storeFile, storePassword: password, keyAlias: 'akademiya-upload', keyPassword: password }, null, 2), { mode: 0o600, flag: 'wx' });
if (process.platform === 'win32') {
  const identity = spawnSync('whoami', [], { encoding: 'utf8' }).stdout.trim();
  const lock = spawnSync('icacls', [directory, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`], { encoding: 'utf8' });
  if (lock.status !== 0) throw new Error('Key created, but restricting file access failed. Secure the signing directory before distributing.');
}
console.log('Created private Android signing key at ' + directory + '. Back up this folder securely; future updates require the same key.');
