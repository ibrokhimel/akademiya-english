// Starts the two local servers the phone app uses (tech-stack.md §0b), open to phones and the Mac on the same network:
//   PocketBase  accounts, progress events, settings, voice recordings, feedback   port 8090
//   Whisper     speech to text, the fallback when the phone's own recogniser fails  port 8795
//   node server/start.js            -> both, open to the home network
//   node server/start.js --local    -> both, this PC only
// Stop with Ctrl+C. The addresses to give the app are printed below and kept in docs/local-servers.md.
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const LOCAL = process.argv.includes('--local');
const HOST = LOCAL ? '127.0.0.1' : '0.0.0.0';
const ROOT = path.join(__dirname, '..');

const lan = Object.values(os.networkInterfaces()).flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(i.address))
  .map((i) => i.address);

const kids = [
  spawn(path.join(__dirname, 'pocketbase', 'pocketbase.exe'), ['serve', `--http=${HOST}:8090`], { cwd: path.join(__dirname, 'pocketbase'), stdio: 'inherit' }),
  spawn('python', [path.join(ROOT, 'src', 'stt', 'server.py')], { stdio: 'inherit', env: { ...process.env, STT_HOST: HOST, PYTHONIOENCODING: 'utf-8' } }),
];
for (const k of kids) k.on('exit', (code) => { console.log(`a server stopped (code ${code}); stopping the other`); for (const o of kids) o.kill(); process.exit(code || 0); });
process.on('SIGINT', () => { for (const k of kids) k.kill(); process.exit(0); });

console.log('\nAkademiya local servers');
console.log('  dashboard (this PC):  http://127.0.0.1:8090/_/   login in server/pocketbase/admin-login.txt');
if (LOCAL) console.log('  this PC only (--local)');
else for (const ip of lan) console.log(`  for the phone app:    server http://${ip}:8090   speech http://${ip}:8795`);
console.log('');
