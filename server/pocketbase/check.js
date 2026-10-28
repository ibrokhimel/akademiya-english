// Checks the local server's rules with two throwaway test users, then deletes them.
//   node server/pocketbase/check.js [http://127.0.0.1:8090]
const BASE = process.argv[2] || 'http://127.0.0.1:8090';
let failed = 0;
const ok = (cond, what) => { console.log((cond ? 'ok   ' : 'FAIL ') + what); if (!cond) failed++; };
const api = async (path, { token, method = 'GET', json, form } = {}) => {
  const headers = {}; if (token) headers.Authorization = token; if (json) headers['Content-Type'] = 'application/json';
  const r = await fetch(BASE + path, { method, headers, body: json ? JSON.stringify(json) : form });
  let body = null; try { body = await r.json(); } catch (e) {}
  return { status: r.status, body };
};
const rand = () => Math.random().toString(36).slice(2, 10);
// a real, silent 0.1 s WAV: the server checks what the file is, not just its name
function silentWav(ms = 100, rate = 16000) {
  const n = Math.round(rate * ms / 1000), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  return b;
}

async function user() {
  const email = `check-${rand()}@akademiya.test`, password = rand() + rand();
  const c = await api('/api/collections/users/records', { method: 'POST', json: { email, password, passwordConfirm: password, name: 'Check' } });
  const a = await api('/api/collections/users/auth-with-password', { method: 'POST', json: { identity: email, password } });
  return { id: c.body && c.body.id, token: a.body && a.body.token };
}

(async () => {
  ok((await api('/api/health')).status === 200, 'server answers');
  const A = await user(), B = await user();
  ok(!!(A.token && B.token), 'two test accounts sign up and sign in');

  const ev = { user: A.id, client_id: rand(), type: 'lesson', at: new Date().toISOString(), data: { id: 'l1', accuracy: 0.9 } };
  ok((await api('/api/collections/events/records', { token: A.token, method: 'POST', json: ev })).status === 200, 'A saves a lesson event');
  ok((await api('/api/collections/events/records', { token: A.token, method: 'POST', json: ev })).status === 400, 'the same event sent twice is refused (offline resend)');
  ok((await api('/api/collections/events/records', { token: B.token, method: 'POST', json: { ...ev, client_id: rand() } })).status === 400, 'B cannot save an event as A');
  ok((await api('/api/collections/events/records', { token: A.token })).body.items.length === 1, 'A sees their event');
  ok((await api('/api/collections/events/records', { token: B.token })).body.items.length === 0, 'B sees none of A\'s events');

  const form = () => { const f = new FormData(); f.append('user', A.id); f.append('phrase', 'p-coffee'); f.append('ms', '1200'); f.append('at', new Date().toISOString());
    f.append('audio', new Blob([silentWav()], { type: 'audio/wav' }), 'a.wav'); return f; };
  const rec = await api('/api/collections/recordings/records', { token: A.token, method: 'POST', form: form() });
  ok(rec.status === 200, 'A uploads a voice recording');
  ok((await api('/api/collections/recordings/records', { token: B.token })).body.items.length === 0, 'B cannot list A\'s recordings');
  ok((await api(`/api/collections/recordings/records/${rec.body && rec.body.id}`, { token: B.token })).status === 404, 'B cannot open A\'s recording');
  const file = rec.body && await fetch(`${BASE}/api/files/recordings/${rec.body.id}/${rec.body.audio}`);
  ok(!!file && file.status !== 200, 'the audio file is not readable without a file token');
  const ft = (await api('/api/files/token', { token: A.token, method: 'POST' })).body;
  const own = rec.body && await fetch(`${BASE}/api/files/recordings/${rec.body.id}/${rec.body.audio}?token=${ft && ft.token}`);
  ok(!!own && own.status === 200, 'A can play their own recording with a file token');
  const ftB = (await api('/api/files/token', { token: B.token, method: 'POST' })).body;
  const other = rec.body && await fetch(`${BASE}/api/files/recordings/${rec.body.id}/${rec.body.audio}?token=${ftB && ftB.token}`);
  ok(!!other && other.status !== 200, 'B cannot play A\'s recording even with their own file token');

  // @username (pb_migrations/1793200000_profile_media.js): the pattern allows an empty name and the unique index skips empty ones,
  // so a learner can clear their name and any number of learners can have none
  const uname = 'chk_' + rand();
  const setName = (u, username) => api(`/api/collections/users/records/${u.id}`, { token: u.token, method: 'PATCH', json: { username } });
  ok((await setName(A, uname)).status === 200, 'A takes an @username');
  ok((await setName(B, uname)).status === 400, 'B cannot take the same @username');
  const cleared = await setName(A, '');
  ok(cleared.status === 200 && cleared.body && cleared.body.username === '', 'A clears the @username to empty');
  ok((await setName(B, '')).status === 200, 'B saves an empty @username too (empty names do not collide)');

  const fb = new FormData(); fb.append('user', A.id); fb.append('text', 'check'); fb.append('screen', 'learn');
  ok((await api('/api/collections/feedback/records', { token: A.token, method: 'POST', form: fb })).status === 200, 'A sends feedback');
  ok((await api('/api/collections/feedback/records', { token: A.token })).status !== 200 || (await api('/api/collections/feedback/records', { token: A.token })).body.items.length === 0, 'learners cannot read feedback');

  for (const u of [A, B]) ok((await api(`/api/collections/users/records/${u.id}`, { token: u.token, method: 'DELETE' })).status === 204, 'a test account deletes itself');
  console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
