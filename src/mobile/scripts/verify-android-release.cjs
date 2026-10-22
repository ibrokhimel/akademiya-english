const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const apk = path.resolve(process.argv[2] || '.expo/builds/akademiya-english-arm64-v8a,x86_64.apk');
const sdk = process.env.ANDROID_HOME || path.join(os.homedir(), 'AppData/Local/Android/Sdk');
const versions = fs.readdirSync(path.join(sdk, 'build-tools')).filter(v => /^\d+\.\d+\.\d+$/.test(v)).sort((a,b) => a.localeCompare(b,undefined,{numeric:true}));
const buildTools = path.join(sdk, 'build-tools', versions.at(-1));
function run(binary, args) {
  const result = spawnSync(binary, args, {encoding:'utf8'});
  if(result.status !== 0) throw new Error(result.stderr || result.stdout || 'Verification tool failed');
  return result.stdout;
}
const java = path.join(process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr','bin',process.platform === 'win32' ? 'java.exe' : 'java');
const signer = run(java, ['-jar',path.join(buildTools,'lib','apksigner.jar'),'verify','--verbose','--print-certs',apk]);
if (/certificate DN:.*Android Debug/i.test(signer)) throw new Error('This is a test-signed APK, not a public release');
const aapt = path.join(buildTools,process.platform === 'win32' ? 'aapt2.exe' : 'aapt2');
const manifest = run(aapt, ['dump','xmltree',apk,'--file','AndroidManifest.xml']);
if (/android:debuggable[^\n]*0xffffffff/.test(manifest)) throw new Error('Release is debuggable');
for(const flag of ['allowBackup','usesCleartextTraffic'])
  if(!new RegExp('android:'+flag+'[^\\n]*(?:0x0|false)').test(manifest)) throw new Error('Release must disable '+flag);
const details = run(aapt, ['dump','badging',apk]);
if (!details.includes("name='ai.akademiya.english'") || !details.includes("versionName='1.0.0'")) throw new Error('Unexpected package/version');
const out=path.resolve('.expo/mvp-release-checks');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'release-certificate.txt'),signer);
fs.writeFileSync(path.join(out,'release-manifest.txt'),manifest);
fs.writeFileSync(path.join(out,'release-package.txt'),details);
console.log('Verified: private release certificate, non-debuggable 1.0.0 APK, no cleartext traffic, backups disabled.');
