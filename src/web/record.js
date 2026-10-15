// The learner's own voice, kept only in this browser (IndexedDB "akademiya", store "voice"): one clip per phrase, the newest wins.
// Every call still answers when IndexedDB is missing or blocked (private window, cleared site data): empty lists, false, nothing saved.
//   Rec.save(phraseId, blob) · Rec.list() -> [{ phraseId, at, ms }] newest first · Rec.has(id) · Rec.play(id, { onStart(ms) }) · Rec.stop() · Rec.remove(id) · Rec.clear()
let dbp = null;
const db = () => dbp || (dbp = new Promise((res) => {
  try { const r = indexedDB.open('akademiya', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('voice')) r.result.createObjectStore('voice', { keyPath: 'phraseId' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null); } catch (e) { res(null); }
}));
// one request in the "voice" store; resolves `fallback` whenever anything goes wrong
const ask = async (mode, fn, fallback) => { const d = await db(); if (!d) return fallback;
  return new Promise((res) => { try { const t = d.transaction('voice', mode), q = fn(t.objectStore('voice')); t.oncomplete = () => res(q ? q.result : true); t.onerror = t.onabort = () => res(fallback); } catch (e) { res(fallback); } }); };
// how long a clip is (0 when the browser cannot tell)
async function lengthOf(blob) {
  try { const C = window.AudioContext || window.webkitAudioContext, c = new C(), b = await c.decodeAudioData(await blob.arrayBuffer()); c.close(); return Math.round(b.duration * 1000); } catch (e) { return 0; }
}
let playing = null;

export const Rec = {
  async save(phraseId, blob) { if (!phraseId || !blob) return false; const ms = await lengthOf(blob); return !!(await ask('readwrite', (s) => s.put({ phraseId, blob, at: new Date().toISOString(), ms }), false)); },
  async list() { const all = await ask('readonly', (s) => s.getAll(), []); return (all || []).map(({ phraseId, at, ms }) => ({ phraseId, at, ms: ms || 0 })).sort((a, b) => (a.at < b.at ? 1 : -1)); },
  async has(phraseId) { const r = await ask('readonly', (s) => s.getKey(phraseId), undefined); return r !== undefined && r !== null && r !== false; },
  async play(phraseId, { onStart } = {}) {
    Rec.stop(); const r = await ask('readonly', (s) => s.get(phraseId), null); if (!r || !r.blob) return false;
    const url = URL.createObjectURL(r.blob), a = new Audio(url), me = playing = { a, url };
    return new Promise((res) => { const end = () => { URL.revokeObjectURL(url); if (playing === me) playing = null; res(true); };
      a.onended = end; a.onerror = end; me.end = end;
      a.play().then(() => { if (onStart) onStart(r.ms || Math.round((isFinite(a.duration) ? a.duration : 0) * 1000)); }).catch(end); });
  },
  stop() { if (!playing) return; const p = playing; playing = null; try { p.a.pause(); } catch (e) {} if (p.end) p.end(); },
  async remove(phraseId) { return !!(await ask('readwrite', (s) => s.delete(phraseId), false)); },
  async clear() { Rec.stop(); return !!(await ask('readwrite', (s) => s.clear(), false)); },
};
