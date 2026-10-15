"""Dombi's acted voices: his lines spoken by a voice model that takes a direction ("cool", "playful", "warm") and acts it.
  NAVOIY_DIR=<model folder> python build_dombi_acted.py        (after build_dombi_tts.py: the voices take their sound from its files)

The model is Navoiy TTS, the open Uzbek voice model of Aisha (Tashkent), Apache 2.0, on CosyVoice2. It runs on this computer's
graphics card (CUDA), so the lines cost nothing and need no account. It is given three things for every line:
  the text        what to say
  a direction     one English sentence on how to say it (ACTS). Ten came with the model; "cool" and "playful" are written for Dombi
  a reference     a few seconds of a voice: the sound of the new voice is copied from it, the acting is not (REFS)
The same text, direction and seed give the same performance whatever the reference is, so a take is chosen once and reused.

Every line is made SEEDS times. Nobody listens while this runs, so a speech recogniser (faster-whisper) writes each take down and
the take closest to the text is kept; a take that is much longer or shorter than the others is dropped first (a repeated or lost word).
The recogniser is weak at Uzbek (it writes "kerek" for "kerak", sometimes in Cyrillic), so this catches a broken take, not a small slip.

The model folder (about 7 GB, kept outside the project):
  git clone --recursive https://github.com/FunAudioLLM/CosyVoice.git   and   git checkout 074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc
  huggingface: FunAudioLLM/CosyVoice2-0.5B (revision eec1ae6c) -> CosyVoice2-0.5B     aisha-org/navoiy-tts -> navoiy-tts
  python -m venv --system-site-packages venv, then into it: conformer diffusers==0.29.0 hydra-core HyperPyYAML inflect librosa lightning
  omegaconf openai-whisper soundfile transformers==4.51.3 x-transformers wetext einops modelscope gdown wget pyarrow pyworld torchaudio

Before the app ships: the reference is a clip of Microsoft's voice here, which is fine for choosing. The app's reference must be
ten seconds of a person who agrees to it. Dombi's voice then belongs to the app.
"""
import os, sys, json, wave, shutil, difflib, hashlib, subprocess, statistics

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from build_final import write
from build_dombi_tts import LINES, LOUD, OUT, QUIET, save_voices

NAVOIY = os.environ.get('NAVOIY_DIR') or sys.exit('set NAVOIY_DIR to the model folder (see the top of this file)')
SEEDS = [1986, 7, 42, 2024, 3, 11, 58, 301]
# How a word is written for this model when it says the real spelling wrong, and what the recogniser must have heard for a take to count.
# "Dombiman" lost its b in every take ("Domiman"); with a doubled b the b and the i were heard in six takes of six. The speech bubble keeps the real spelling.
SAY = {'Dombiman': 'Dombbiman'}
MUST = {'Dombiman': 'biman'}
ACTS = {
    'cool': 'Speak in a cool, confident, laid-back voice with a relaxed pace, a slight smirk and playful, knowing intonation.',
    'playful': 'Speak in a playful, cheeky, friendly voice with lively intonation, a smile and a quick, light pace.',
    'dry': 'Speak in a sarcastic, mocking voice with exaggerated drawl, ironic stress on key words and a flat, knowing intonation.',
    'happy': 'Speak in a happy, excited and energetic voice with bright rising intonation and a quicker, lively pace.',
    'warm': 'Speak in a warm, gentle, affectionate voice with soft tone, smooth slow pacing and caring, soothing intonation.',
}
# the sound of a voice: (plain voice it is copied from, semitones that clip is moved first, body and all). Moved up, it is nobody's voice any more.
REFS = {'own': ('sardor', 3), 'man': ('sardor', 0), 'woman': ('madina', 0)}
# id: (name in the lab, what it is, sound, direction: one for all lines or one per line)
BY_LINE = ['cool', 'playful', 'cool', 'happy', 'playful', 'warm', 'warm', 'playful']       # hello · why · how much · look what you get · how sure · my promise · the kind reminder · your name
VOICES = {
    'dombi-cool': ('Cool', 'laid-back and sure of himself', 'own', 'cool'),
    'dombi-playful': ('Playful', 'cheeky and quick', 'own', 'playful'),
    'dombi-dry': ('Dry', 'a knowing drawl, a little mocking', 'own', 'dry'),
    'dombi-acted': ('Acted line by line', 'every line in the mood that fits it', 'own', BY_LINE),
    'dombi-deep': ('Cool, deeper', "the cool acting in a grown man's voice", 'man', 'cool'),
    'dombi-light': ('Cool, lighter', "the cool acting in a woman's voice", 'woman', 'cool'),
}
ff = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', *a], check=True, stdin=subprocess.DEVNULL)
sys.path.insert(0, os.path.join(NAVOIY, 'navoiy-tts'))
from uztts.normalize import normalize                    # numbers to words, Cyrillic to Latin
ALSO = str.maketrans({'ı': 'i', 'ş': 'sh', 'ç': 'ch', 'ö': 'o', 'ü': 'u', 'ğ': 'g', 'ə': 'a', 'ә': 'a', 'і': 'i', 'ү': 'u', 'ұ': 'u', 'ө': 'o', 'ң': 'n', 'һ': 'h'})      # letters the recogniser borrows from Turkish and Kazakh
letters = lambda t: ''.join(c for c in normalize(t, mode='infer').lower().translate(ALSO) if c.isalpha())
acts_of = lambda v: [v[3]] * len(LINES) if isinstance(v[3], str) else v[3]


def said(text):
    for word, how in SAY.items(): text = text.replace(word, how)
    return text


def run(jobs, tmp):
    p = os.path.join(tmp, 'jobs.json'); json.dump(jobs, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
    subprocess.run([os.path.join(NAVOIY, 'venv', 'Scripts', 'python'), os.path.join(HERE, 'tools', 'navoiy_run.py'), p, NAVOIY], check=True, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    from faster_whisper import WhisperModel
    tmp = os.path.join(NAVOIY, 'takes'); os.makedirs(tmp, exist_ok=True); ref = {}      # takes stay here: a second run only makes what changed
    for k, (plain, st) in REFS.items():                   # a reference clip: two of the plain voice's lines, five seconds
        ref[k] = os.path.join(tmp, 'ref-%s.wav' % k); r = 2 ** (st / 12); a, b = (os.path.join(OUT, plain, 'line-%d.wav' % n) for n in (2, 7))
        ff('-i', a, '-i', b, '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1,asetrate=44100*%f,aresample=24000,atempo=%f' % (r, 1 / r), '-ac', '1', ref[k])
    # 1. every line in every direction that some voice uses, SEEDS times, in the first voice's sound
    need = sorted({(a, i) for v in VOICES.values() for i, a in enumerate(acts_of(v))}); take = lambda a, i, s, k='own': os.path.join(tmp, '%s-%d-%d-%s-%s.wav' % (a, i, s, k, hashlib.md5((ACTS[a] + said(LINES[i]) + str(REFS[k])).encode()).hexdigest()[:6]))
    run([{'out': take(a, i, s), 'text': said(LINES[i]), 'ref': ref['own'], 'instruct': ACTS[a], 'seed': s} for a, i in need for s in SEEDS], tmp)
    # 2. the recogniser writes every take down; the plain voice's reading of the line is written down too, as what a right reading looks like to it
    w = WhisperModel('large-v3-turbo', device='cuda', compute_type='float16'); hear = lambda p: [letters(''.join(s.text for s in w.transcribe(p, language=l, beam_size=5, condition_on_previous_text=False)[0])) for l in ('uz', 'tr')]      # told it is Uzbek, then Turkish: the better of the two counts
    right = [hear(os.path.join(OUT, 'sardor', 'line-%d.wav' % (i + 1))) for i in range(len(LINES))]; best = {}
    seconds = lambda p: (lambda f: f.getnframes() / f.getframerate())(wave.open(p, 'rb'))
    for a, i in need:
        ms = {s: seconds(take(a, i, s)) for s in SEEDS}; mid = statistics.median(ms.values()); score = {}
        for s in SEEDS:
            heard = hear(take(a, i, s)); lost = any(w in LINES[i] and not any(m in h for h in heard) for w, m in MUST.items())
            score[s] = max(difflib.SequenceMatcher(None, h, r).ratio() for h in heard for r in right[i] + [letters(LINES[i])]) - (1 if not 0.7 < ms[s] / mid < 1.4 else 0) - (0.5 if lost else 0)
        best[a, i] = max(SEEDS, key=lambda s: score[s]); print('%-8s line %d  take %-4d  %s' % (a, i + 1, best[a, i], '  '.join('%d:%.2f' % (s, score[s]) for s in SEEDS)), flush=True)
    del w
    # 3. the chosen takes again in the other sounds
    more = sorted({(a, i, v[2]) for v in VOICES.values() for i, a in enumerate(acts_of(v)) if v[2] != 'own'})
    if more: run([{'out': take(a, i, best[a, i], k), 'text': said(LINES[i]), 'ref': ref[k], 'instruct': ACTS[a], 'seed': best[a, i]} for a, i, k in more], tmp)
    # 4. into the lab's folder, at the level of the other spoken lines
    out = []
    for vid, v in VOICES.items():
        d = os.path.join(OUT, vid); shutil.rmtree(d, ignore_errors=True); os.makedirs(d); lines = {}
        for i, a in enumerate(acts_of(v)):
            src = os.path.join(tmp, 'q.wav'); ff('-i', take(a, i, best[a, i], v[2]), '-af', QUIET, src)
            r = write('voice', 'line-%d' % (i + 1), os.path.relpath(src, HERE), d, LOUD); lines[LINES[i]] = {'file': r['file'], 'ms': r['ms'], 'volume': r['volume'], 'act': a}
        out.append({'id': vid, 'name': v[0], 'about': v[1], 'lines': lines}); print('%-14s %s' % (vid, '  '.join('%.1fs' % (l['ms'] / 1000) for l in lines.values())))
    save_voices('acts', out)


if __name__ == '__main__': main()
