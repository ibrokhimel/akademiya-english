"""Navoiy TTS (Aisha's open Uzbek voice model, on CosyVoice2), many lines in one go. Needs a CUDA graphics card.
  <model folder>/venv/Scripts/python navoiy_run.py jobs.json <model folder>
The model folder holds CosyVoice (the code), CosyVoice2-0.5B (the base model), navoiy-tts (the Uzbek checkpoint) and venv: see build_dombi_acted.py.
jobs.json: [{ "out": "x.wav", "text": "...", "ref": "voice.wav", "instruct": "Speak ...", "seed": 1986, "speed": 1.0 }, ...]
The model is loaded once; a job whose file already exists is skipped."""
import os, sys, json, random, time
HERE = os.path.abspath(sys.argv[2])
sys.path[:0] = [os.path.join(HERE, 'CosyVoice'), os.path.join(HERE, 'CosyVoice', 'third_party', 'Matcha-TTS'), os.path.join(HERE, 'navoiy-tts')]
import numpy as np, soundfile as sf, torch, torchaudio


def load(path, *a, **k):                                  # this torchaudio wants torchcodec to read a file; soundfile does the same job
    x, sr = sf.read(str(path), dtype='float32', always_2d=True); return torch.from_numpy(x.T.copy()), sr
torchaudio.load = load

from cosyvoice.cli.cosyvoice import CosyVoice2
from uztts.normalize import normalize

jobs = json.load(open(sys.argv[1], encoding='utf-8'))
t0 = time.time(); model = CosyVoice2(os.path.join(HERE, 'CosyVoice2-0.5B'), load_jit=False, load_trt=False, fp16=True)
state = torch.load(os.path.join(HERE, 'navoiy-tts', 'emotion_600h_joint.pt'), map_location='cpu', weights_only=True)
for key in ('state_dict', 'model', 'llm'):
    if isinstance(state.get(key), dict): state = state[key]
bad = model.model.llm.load_state_dict(state, strict=False); model.model.llm.eval()
print('model ready in %.0f s · missing %d · unexpected %d' % (time.time() - t0, len(bad.missing_keys), len(bad.unexpected_keys)), flush=True)
for j in jobs:
    if os.path.exists(j['out']): continue
    seed = j.get('seed', 1986); random.seed(seed); np.random.seed(seed); torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    t = time.time(); text = normalize(j['text'], mode='infer'); chunks = []
    with torch.inference_mode():
        for r in model.inference_instruct2(text, j['instruct'].strip() + '<|endofprompt|>', os.path.abspath(j['ref']), stream=False, speed=j.get('speed', 1.0)): chunks.append(r['tts_speech'].detach().cpu())
    audio = torch.cat(chunks, dim=1).numpy()[0]; os.makedirs(os.path.dirname(os.path.abspath(j['out'])), exist_ok=True); sf.write(j['out'], audio, 24000, subtype='PCM_16')
    print('%-40s %.2f s of sound in %.1f s  | %s' % (os.path.basename(j['out']), len(audio) / 24000, time.time() - t, text), flush=True)
