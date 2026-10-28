// The speak lab's boot and router: start → talk → report (the report and memory pages come in a later step).
import { talkScreen } from './talk.js';
import { startPage } from './start.js';
import { loadProfile } from './profile.js';
import { mountTestBar } from './testbar.js';
import { COPY } from './copy.js';

let bar = null;
async function startTalk(opts) {
  if (bar) bar.stop();
  const T = await talkScreen(root, opts);
  if (T.session) bar = mountTestBar(root, T);
  return T;
}

const root = document.getElementById('root');
document.body.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);

function showReport(result) {
  window.SPEAK.screen = 'report'; if (bar) { bar.stop(); bar = null; }
  root.innerHTML = `<div class="report"><h2>${COPY.reportSoon}</h2><p>${result.transcript.length} replika · ${result.seconds} s</p></div>`;
}
function showStart() {
  startPage(root, { profile: loadProfile(), onStart: ({ pack, topic, topicName }) => startTalk({ pack, topic, topicName, profile: loadProfile(), onEnd: showReport }), onMemory: () => {} });
}
showStart();
