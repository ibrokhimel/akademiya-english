// The speak lab's boot and router. This version opens straight into a talk; the start page comes next.
import { talkScreen } from './talk.js';
import { COPY } from './copy.js';

const root = document.getElementById('root');
document.body.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);

export function showReport(result) {
  window.SPEAK.screen = 'report';
  root.innerHTML = `<div class="report"><h2>${COPY.reportSoon}</h2><p>${result.transcript.length} replika · ${result.seconds} s</p></div>`;
}

talkScreen(root, { pack: 'kind', topic: 'salom', profile: {}, onEnd: showReport });
