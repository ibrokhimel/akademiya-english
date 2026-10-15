"""The English of the lessons, spoken: every line the MVP lessons play, at normal speed and slow.
  PYTHONPATH=<folder with edge-tts> python build_lessons.py [uk us] [--hear]
      uk us    which sets of voices to build (default: all in CASTS)
      --hear   afterwards a speech recogniser writes every clip down and the ones it heard differently are listed

What to say comes from the lesson files: `node src/content/check.js --clips` lists one clip for each (voice, text).
Four people speak: Aziz and Malika (the learner's side: they say every phrase that is taught), the waiter, the seller.
A set of voices ("cast") gives each of them a text-to-speech voice. These are Microsoft's read-aloud voices (edge-tts):
free, no account, natural. Good for the test version; a release needs voices the app has a licence for, or people.

For every clip, into src/content/audio/<cast>/:
  <voice>/<text>.wav        16-bit mono 24 kHz, silence cut from both ends, peak at -3 dB
  <voice>/<text>.slow.wav   the same line at SLOW speed (the turtle button). Said slower by the voice, not stretched.
  index.json                for each clip: ms, volume (so every line is heard at LOUD, level with Dombi's lines), words
                            (when each word starts and ends, so the text can light up with the voice) and mouth
                            (mouth shapes in time, added by tools/lesson_mouth.mjs, for the waiter, the seller and Dombi)
src/content/audio/cast.json says which cast the app uses.

Word times. The voice service reports when each word starts, but 100 to 200 ms before the word is heard, and by a different
amount for each voice and speed. So a clip's times are moved as one block until the first word starts where the sound starts.
The build then measures what is left: for every word that follows a pause, how far its time is from the rise in loudness.

What the service sent (sound and word times) is kept in originals/lessons-cache, so a second run only fetches new lines.
"""
import os, re, sys, json, wave, base64, socket, hashlib, asyncio, subprocess, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from build_final import decode, loudness

CONTENT = os.path.join(HERE, '..', '..', 'src', 'content'); OUT = os.path.join(CONTENT, 'audio'); SR = 24000
CACHE = os.path.join(HERE, 'originals', 'lessons-cache')
LOUD = -28; SLOW = '-30%'
# cast: person -> (voice, rate, pitch). The waiter and the seller never meet (café, shop), so one voice can serve both, a little lower for the seller.
CASTS = {
    'uk': ('British', {'aziz': ('en-GB-RyanNeural', '+0%', '+0Hz'), 'malika': ('en-GB-SoniaNeural', '+0%', '+0Hz'),
                       'waiter': ('en-GB-ThomasNeural', '+0%', '+0Hz'), 'seller': ('en-GB-ThomasNeural', '-4%', '-12Hz')}),
    'us': ('American', {'aziz': ('en-US-AndrewMultilingualNeural', '+0%', '+0Hz'), 'malika': ('en-US-AvaMultilingualNeural', '+0%', '+0Hz'),
                        'waiter': ('en-US-BrianMultilingualNeural', '+0%', '+0Hz'), 'seller': ('en-US-ChristopherNeural', '+0%', '+0Hz')}),
}
USE = 'uk'                                                 # the lessons are written in British spelling ("colour")
# How a word is written for the voices when they say the real spelling wrong. The text on screen keeps the real spelling.
# "Malika": the voices ended it with a short weak "uh" (owner, 2026-10-14: "malikuh not ma li kaa"). Written "Malikaa" the last
# vowel is a full, longer "a" in all four voices (its two tones move from about 750 / 1650 Hz to about 800 / 1380 Hz; a recogniser writes "Malikar").
SAY = {'Malika': 'Malikaa'}


def spoken(text):
    for word, how in SAY.items(): text = re.sub(r'\b%s\b' % word, how, text)
    return text


def add_rate(a, b):                                        # '-4%' and '-30%' -> '-34%'
    return '%+d%%' % (int(a[:-1]) + int(b[:-1]))


async def fetch(text, voice, rate, pitch):
    kept = os.path.join(CACHE, hashlib.md5('|'.join((spoken(text), voice, rate, pitch)).encode()).hexdigest() + '.json')
    if os.path.exists(kept): d = json.load(open(kept)); return base64.b64decode(d['mp3']), d['words']
    mp3, words = await fetch_new(text, voice, rate, pitch)
    json.dump({'text': text, 'voice': voice, 'rate': rate, 'mp3': base64.b64encode(mp3).decode(), 'words': words}, open(kept, 'w'))
    return mp3, words


ADDRESS = {}
async def lookup(host, port=0, family=socket.AF_INET):
    """Finds the service's address over https. On this network the ordinary name lookup times out now and then (seen 2026-10-14), and the build then stalls."""
    if host not in ADDRESS:
        ask = lambda: json.load(urllib.request.urlopen('https://8.8.8.8/resolve?name=%s&type=A' % host, timeout=8))
        ADDRESS[host] = [a['data'] for a in (await asyncio.get_running_loop().run_in_executor(None, ask)).get('Answer', []) if a['type'] == 1]
    return [{'hostname': host, 'host': ip, 'port': port, 'family': socket.AF_INET, 'proto': 0, 'flags': socket.AI_NUMERICHOST} for ip in ADDRESS[host]]


async def fetch_new(text, voice, rate, pitch):
    import edge_tts, aiohttp
    class Lookup(aiohttp.abc.AbstractResolver):
        async def resolve(self, host, port=0, family=socket.AF_INET):
            try: return await lookup(host, port)
            except Exception: return await aiohttp.resolver.ThreadedResolver().resolve(host, port, family)
        async def close(self): pass
    for attempt in range(4):
        try:
            mp3, words = b'', []
            async for c in edge_tts.Communicate(spoken(text), voice, rate=rate, pitch=pitch, boundary='WordBoundary', connector=aiohttp.TCPConnector(resolver=Lookup())).stream():
                if c['type'] == 'audio': mp3 += c['data']
                elif c['type'] == 'WordBoundary': words.append([c['text'], c['offset'] / 10000, (c['offset'] + c['duration']) / 10000])
            if mp3: return mp3, words
        except Exception as e:
            err = e
        await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError('no sound for %r (%s): %r' % (text, voice, err))


def onsets(x):
    """The moments (ms) the sound rises after at least 70 ms of quiet: where a word that follows a pause really starts."""
    n = int(SR * 0.01); e = np.sqrt(np.convolve(x * x, np.ones(n) / n, 'same')); loud = e > e.max() * 0.04; out = []; quiet = 999
    for i in range(0, len(e), 24):
        if loud[i]:
            if quiet >= 70: out.append(i * 1000 / SR)
            quiet = 0
        else: quiet += 1
    return out


def finish(mp3, words, path, real):
    """Cut the silence, level the peak, write the wav. Returns ms, the word times (moved so the first word starts with the sound), how far they were moved, and what is still off."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'mp3', '-i', 'pipe:0', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], input=mp3, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0; m = np.abs(x); top = m.max()
    first = int(np.argmax(m > top * 0.02)); last = len(m) - int(np.argmax(m[::-1] > top * 0.01))      # the first and last moment anything is heard
    a = max(0, first - int(SR * 0.015)); b = min(len(x), last + int(SR * 0.09)); x = x[a:b] * (10 ** (-3 / 20) / top)
    fade = int(SR * 0.004); ramp = np.linspace(0, 1, fade); x[:fade] *= ramp; x[-fade:] *= ramp[::-1]
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    ms = int(len(x) * 1000 / SR); back = {how: word for word, how in SAY.items()}                    # the text on screen keeps the real spelling
    if not words: return ms, [], 0, []
    move = (first - a) * 1000 / SR - words[0][1]                       # the first word starts where the sound starts
    out = [[back.get(t, t), max(0, round(s + move)), min(ms, round(e + move))] for t, s, e in words]
    on = onsets(x); left = [min(on, key=lambda o: abs(o - w[1])) - w[1] for w in out[1:]] if on else []
    return ms, out, move + a * 1000 / SR, [d for d in left if abs(d) < 150]


async def build(cast, clips):
    name, people = CASTS[cast]; root = os.path.join(OUT, cast); index = {}; off = []; left = []; gate = asyncio.Semaphore(6); os.makedirs(CACHE, exist_ok=True)
    speeds = (('', '+0%', '.wav'), ('slow', SLOW, '.slow.wav')); got = {}
    async def one(c, key, extra):                              # first everything is fetched (the network waits for nobody), then the sound is worked on
        voice, rate, pitch = people[c['voice']]
        async with gate: got[c['file'], key] = await fetch(c['text'], voice, add_rate(rate, extra), pitch)
    await asyncio.gather(*[one(c, key, extra) for c in clips for key, extra, _ in speeds])
    for c in clips:
        path = os.path.join(root, c['file']); os.makedirs(os.path.dirname(path), exist_ok=True); entry = {'voice': c['voice'], 'text': c['text']}
        for key, _, suffix in speeds:
            mp3, words = got[c['file'], key]; ms, w, d, l = finish(mp3, words, path + suffix, c['text']); off.append(d); left.extend(l)
            vol = round(min(1.0, 10 ** ((LOUD - loudness(decode(path + suffix))) / 20)), 3)
            (entry if not key else entry.setdefault('slow', {})).update({'ms': ms, 'volume': vol, 'words': w})
        index[c['file']] = entry
    json.dump({'cast': cast, 'name': name, 'voices': {k: v[0] for k, v in people.items()}, 'slow': SLOW, 'heardAt': LOUD, 'clips': dict(sorted(index.items()))},
              open(os.path.join(root, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    subprocess.run(['node', os.path.join(HERE, 'tools', 'lesson_mouth.mjs'), os.path.join(root, 'index.json')], check=True)
    secs = sum(e['ms'] + e['slow']['ms'] for e in index.values()) / 1000
    print('%-3s %d clips x 2 speeds, %.0f s of speech. Word times were reported %.0f ms early (median; %.0f to %.0f) and moved.' % (cast, len(index), secs, np.median(off), min(off), max(off)), flush=True)
    if left: print('    after the move, a word that follows a pause is %+.0f ms from the rise of its sound (median of %d; 8 in 10 between %+.0f and %+.0f)' % (np.median(left), len(left), np.percentile(left, 10), np.percentile(left, 90)), flush=True)


def hear(cast):
    """A speech recogniser writes every clip down; the ones that differ from the text are printed. It mishears short lines now and then, so this points at clips to listen to."""
    from faster_whisper import WhisperModel
    w = WhisperModel('large-v3-turbo', device='cuda', compute_type='float16'); idx = json.load(open(os.path.join(OUT, cast, 'index.json'), encoding='utf-8'))['clips']; bad = 0
    NUM = {'1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen', '15': 'fifteen',
           '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen', '20': 'twenty', '30': 'thirty', '40': 'forty', '45': 'fortyfive', '50': 'fifty', '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety', '100': 'ahundred'}
    def plain(t):
        t = re.sub(r'(\d+),000', lambda m: NUM.get(m.group(1), m.group(1)) + ' thousand', t.lower()); t = re.sub(r'\d+', lambda m: NUM.get(m.group(0), m.group(0)), t)
        return re.sub(r'[^a-z]', '', t.replace('okay', 'ok').replace('sum', 'som').replace('soom', 'som').replace('some', 'som').replace('one hundred', 'a hundred'))
    for f, e in idx.items():
        for suffix in ('.wav', '.slow.wav'):
            got = ''.join(s.text for s in w.transcribe(os.path.join(OUT, cast, f + suffix), language='en', beam_size=5, condition_on_previous_text=False, initial_prompt='Aziz, Malika, Tashkent, samsa, som, T-shirt.')[0]).strip()
            if plain(got) != plain(e['text']): bad += 1; print('  %-4s %-46s text: %-44s heard: %s' % (cast, f + suffix, e['text'], got), flush=True)
    print('%s: %d of %d clips heard differently from the text' % (cast, bad, len(idx) * 2), flush=True)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; casts = args or list(CASTS)
    clips = json.loads(subprocess.run(['node', os.path.join(CONTENT, 'check.js'), '--clips'], capture_output=True, text=True, encoding='utf-8', check=True).stdout)
    os.makedirs(OUT, exist_ok=True)
    for cast in casts: asyncio.run(build(cast, clips))
    built = [c for c in CASTS if os.path.exists(os.path.join(OUT, c, 'index.json'))]
    json.dump({'use': USE, 'casts': {c: CASTS[c][0] for c in built}}, open(os.path.join(OUT, 'cast.json'), 'w', encoding='utf-8'), indent=1)
    if '--hear' in sys.argv:
        for cast in casts: hear(cast)


if __name__ == '__main__': main()
