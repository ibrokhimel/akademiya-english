# Speech to text for the browser version, on this PC (faster-whisper, large-v3-turbo on the graphics card).
# The browsers' own recognisers send the sound to Google or Microsoft and came back empty here, so the app sends what the
# learner said to this small server instead (src/web/hear.js). The phone app will use the phone's own recogniser.
#   python src/stt/server.py            -> http://127.0.0.1:8795   GET /health · POST /stt (the recorded sound) -> {"text": ...}
import json, os, sys, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get('STT_PORT', 8795))
MODEL = os.environ.get('STT_MODEL', 'large-v3-turbo')
lock = threading.Lock()

def load():
    from faster_whisper import WhisperModel
    try: return WhisperModel(MODEL, device='cuda', compute_type='float16'), 'cuda'
    except Exception as e:
        print('no graphics card for whisper, using the processor:', e, flush=True)
        return WhisperModel('base.en' if MODEL == 'large-v3-turbo' else MODEL, device='cpu', compute_type='int8'), 'cpu'

model, device = load()
print(f'speech to text ready on http://127.0.0.1:{PORT} ({MODEL}, {device})', flush=True)

def transcribe(path, partial=False):
    with lock:
        segs, info = model.transcribe(path, language='en', beam_size=1 if partial else 5, vad_filter=True, condition_on_previous_text=False,
                                      vad_parameters={'min_silence_duration_ms': 300})
        segs = [s for s in segs if s.no_speech_prob < 0.6]
    return ' '.join(s.text.strip() for s in segs).strip()

class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    def reply(self, obj, code=200):
        body = json.dumps(obj).encode(); self.send_response(code); self.cors(); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def do_GET(self):
        if self.path.startswith('/health'): print('a page checked in:', self.headers.get('Origin') or '-', flush=True); return self.reply({'ok': True, 'model': MODEL, 'device': device})
        self.reply({'error': 'not found'}, 404)
    def do_POST(self):
        if not self.path.startswith('/stt'): return self.reply({'error': 'not found'}, 404)
        n = int(self.headers.get('Content-Length', 0)); data = self.rfile.read(n)
        if not data: return self.reply({'text': ''})
        f = tempfile.NamedTemporaryFile(delete=False, suffix='.webm'); f.write(data); f.close()
        try:
            partial = 'partial' in self.path; t0 = time.time(); text = transcribe(f.name, partial)
            print(f"{'  so far' if partial else 'heard'} {len(data) // 1024} KB in {time.time() - t0:.2f}s: {text!r}", flush=True)
            self.reply({'text': text})
        except Exception as e:
            print('could not read the sound:', e, flush=True)
            try: self.reply({'text': '', 'error': str(e)})
            except OSError: pass                                     # the page stopped waiting
        finally: os.unlink(f.name)
    def log_message(self, *a): pass

ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
