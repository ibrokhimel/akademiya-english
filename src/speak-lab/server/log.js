// One folder per talk under logs/: the transcript, the cards, the numbers, and Dombi's audio when the page sent it.
import fs from 'node:fs';
import path from 'node:path';

const wavHeader = (bytes, rate) => { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + bytes, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(bytes, 40); return h; };

// writeTalk(dir, body) -> folder name; body = { id, transcript, cards, nudges, secIn, secOut, latencies, interruptions, timing?, acting?, words?, visemes?, audio? (base64 24 kHz pcm) }
export function writeTalk(dir, body) {
  const safe = String(body.id || 'talk').replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'talk';
  const folder = `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-${safe}`, full = path.join(dir, folder);
  fs.mkdirSync(full, { recursive: true });
  fs.writeFileSync(path.join(full, 'transcript.json'), JSON.stringify({ transcript: body.transcript || [], cards: body.cards || [], nudges: body.nudges || [] }, null, 1));
  fs.writeFileSync(path.join(full, 'stats.json'), JSON.stringify({ secIn: body.secIn || 0, secOut: body.secOut || 0, latencies: body.latencies || [], interruptions: body.interruptions || 0, pack: body.pack || '', topic: body.topic || '' }, null, 1));
  // when each caption piece and audio chunk arrived, when each beat started and let go, the word clock's times for his words and
  // every mouth shape he showed (spec 2026-10-30 in-sync §4.8): enough to check a talk after the fact
  if (Array.isArray(body.timing)) fs.writeFileSync(path.join(full, 'timing.json'), JSON.stringify({ timing: body.timing, acting: Array.isArray(body.acting) ? body.acting : [], words: Array.isArray(body.words) ? body.words : [], visemes: Array.isArray(body.visemes) ? body.visemes : [] }));
  if (typeof body.audio === 'string' && body.audio.length > 0) { const pcm = Buffer.from(body.audio, 'base64'); fs.writeFileSync(path.join(full, 'dombi.wav'), Buffer.concat([wavHeader(pcm.length, 24000), pcm])); }
  return folder;
}
