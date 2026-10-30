// The speak lab's boot and router: start → talk → report, and the "what Dombi remembers" page.
import { talkScreen, side } from './talk.js';
import { startPage } from './start.js';
import { reportScreen } from './report.js';
import { memoryScreen } from './memory.js';
import { loadProfile, saveProfile, addPhrases } from './profile.js';
import { mountTestBar } from './testbar.js';
import { emptyReport, mergeProfile } from './rules.js';

const root = document.getElementById('root');
document.body.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);
if (window.M) M.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;      // the lab's motion follows the computer's Reduce Motion, as in src/web

let bar = null, screen = 0;                                        // screen: a counter; a report that comes back after the screen moved on is dropped
const stopBar = () => { if (bar) { bar.stop(); bar = null; } };

async function startTalk(opts) {
  stopBar(); const my = ++screen;
  const T = await talkScreen(root, { ...opts, profile: loadProfile(), onEnd: (result) => { if (my === screen) showReport(opts, result); } });
  if (T.session && my === screen) bar = mountTestBar(root, T);
}

// the report: nothing said → the "you did not speak" report; otherwise the server's coach, and Dombi's memory grows
async function showReport(opts, result) {
  stopBar(); const my = ++screen;
  const btns = { onAgain: () => startTalk(opts), onStart: showStart, onRetry: () => showReport(opts, result) };
  if (!result.transcript.some((t) => t.who === 'learner')) return reportScreen(root, emptyReport('silent'), btns);
  reportScreen(root, { ...emptyReport('silent'), why: '…', stars: 0 }, btns);
  try {
    const report = await side('report', { transcript: result.transcript, cards: result.cards, profile: loadProfile(), pack: opts.pack, topic: opts.topic });
    if (!result.saved) { saveProfile(addPhrases(mergeProfile(loadProfile(), { ...report.profileUpdate, level: report.level }), report.phrases)); result.saved = true; }
    if (my === screen) reportScreen(root, { ...report, failed: false }, btns);
  } catch (e) { console.warn('report', e.message); if (my === screen) reportScreen(root, emptyReport('failed'), btns); }
}

function showMemory() {
  memoryScreen(root, loadProfile(), { onChange: (p) => saveProfile(p), onBack: showStart });
}
function showStart() {
  stopBar(); screen++;
  startPage(root, { profile: loadProfile(), onStart: ({ pack, voice, mic, topic, topicName }) => { saveProfile({ ...loadProfile(), voice, pack, mic }); startTalk({ pack, voice, mic, topic, topicName }); }, onMemory: showMemory });
}
if (location.hash === '#memory') showMemory(); else showStart();
