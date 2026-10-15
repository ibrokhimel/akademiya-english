"""Dombi's plain voices: his lines read by Microsoft's two Uzbek text-to-speech voices. They read well and act nothing.
  pip install edge-tts      (once)
  python build_dombi_tts.py

Writes dombi/<voice>/<line>.wav and puts the voices into dombi/lines.json (for every voice: its name, and for every line the file,
its length and the volume that makes it heard at LOUD). The lab plays these when "Dombi's voice" is one of them.
The voices that act the lines are made by build_dombi_acted.py, which also takes the sound of its voices from these files.

The speech comes through the edge-tts package. That is fine for trying voices in the lab. The app's own files must be made
with a licensed service (Azure Speech has the same two voices).
"""
import os, re, sys, json, shutil, asyncio, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from build_final import write

OUT = os.path.join(HERE, 'dombi'); LOUD = -28          # speech carries meaning, so it sits above the small sounds and level with the rewards
# Every line Dombi says in a speech bubble (onboarding). A line that is not here (your name) falls back to his babble.
LINES = ['Salom! Men Dombiman.', 'Ingliz tili sizga nima uchun kerak?', 'Ingliz tilini qanchalik bilasiz?', '30 kunda mana shularga erishasiz!', "Ingliz tilida gapirganda o'zingizga qanchalik ishonasiz?",
         "Ovozingiz faqat sizniki. Va'da beraman:", 'Har kuni soat nechada eslatay? Kuniga bir martagina eslataman.', 'Sizni nima deb chaqiray?']
# How a word is written for the voice when the voice reads the real spelling wrong. "Dombi" as the last sound of a word came out as "Dombe" (the last i of
# an Uzbek word is said short and loose); "Dombiy" is heard as "Dombi" from both voices (checked with a speech recogniser). The speech bubble keeps the real
# spelling. Only the whole word is respelt: in "Dombiman" the i is in the middle and is said right as it stands.
SAY = {'Dombi': 'Dombiy'}
# id: (name in the lab, what it is, Microsoft voice, rate, pitch)
VOICES = {
    'sardor': ('Sardor', 'a man, reading', 'uz-UZ-SardorNeural', '+0%', '+0Hz'),
    'madina': ('Madina', 'a woman, reading', 'uz-UZ-MadinaNeural', '+0%', '+0Hz'),
}
QUIET = 'silenceremove=stop_periods=-1:stop_duration=0.32:stop_threshold=-42dB'      # no pause longer than a third of a second


def save_voices(kind, voices):
    """Put these voices into lines.json in place of the ones of the same kind ('reads' | 'acts'); the other kind stays as it is."""
    p = os.path.join(OUT, 'lines.json'); old = json.load(open(p, encoding='utf-8'))['voices'] if os.path.exists(p) else []
    for v in old:
        if v.get('kind', 'reads') == kind and v['id'] not in [n['id'] for n in voices]: shutil.rmtree(os.path.join(OUT, v['id']), ignore_errors=True)
    keep = [v for v in old if v.get('kind', 'reads') != kind]; new = [dict(v, kind=kind) for v in voices]
    json.dump({'voices': sorted(keep + new, key=lambda v: v['kind'])}, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)      # 'acts' before 'reads'


def spoken(text):
    for word, how in SAY.items(): text = re.sub(r'%s' % word, how, text)
    return text


async def speak(text, voice, rate, pitch, path):
    import edge_tts                                       # here, so build_dombi_acted.py can use this file without it
    for attempt in range(3):                              # the service drops a request now and then
        try: await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path); return
        except Exception as e:
            if attempt == 2: raise
            await asyncio.sleep(1.5)


def main():
    tmp = tempfile.mkdtemp(prefix='dombi-'); out = []
    for vid, (name, about, ms_voice, rate, pitch) in VOICES.items():
        d = os.path.join(OUT, vid); shutil.rmtree(d, ignore_errors=True); os.makedirs(d); lines = {}
        for i, text in enumerate(LINES):
            raw = os.path.join(tmp, '%s-%d.mp3' % (vid, i)); asyncio.run(speak(spoken(text), ms_voice, rate, pitch, raw)); src = os.path.join(tmp, '%s-%d.wav' % (vid, i))
            subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', raw, '-af', QUIET, src], check=True, stdin=subprocess.DEVNULL)
            r = write('voice', 'line-%d' % (i + 1), os.path.relpath(src, HERE), d, LOUD)
            lines[text] = {'file': r['file'], 'ms': r['ms'], 'volume': r['volume']}
        out.append({'id': vid, 'name': name, 'about': about, 'lines': lines})
        print('%-13s %s' % (vid, '  '.join('%.1fs' % (v['ms'] / 1000) for v in lines.values())))
    save_voices('reads', out); shutil.rmtree(tmp, ignore_errors=True)
    print(len(VOICES) * len(LINES), 'files')


if __name__ == '__main__': main()
