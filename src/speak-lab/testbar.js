// The test bar (test build only, English): what the talk is doing under the hood, and buttons to poke it.
// mountTestBar(root, talk) where `talk` is the object talkScreen returns
import { CFG } from './config.js';
import { resetProfile } from './profile.js';

export function mountTestBar(root, talk) {
  const bar = document.createElement('div'); bar.className = 'testbar';
  bar.innerHTML = `<span class="tb model">${CFG.MODEL}</span><span class="tb lat">latency —</span><span class="tb min">0:00</span><span class="tb cost">$—</span><span class="tb mic">mic 0</span><span class="tb mood">smirk</span>
    <button class="tb nudge-remark">nudge remark</button><button class="tb nudge-whisper">nudge whisper</button><button class="tb reset">reset Dombi's memory</button>`;
  root.appendChild(bar);
  const $ = (s) => bar.querySelector(s);
  const t = setInterval(() => {
    const s = talk.state; if (!s) return;
    const sec = Math.round((Date.now() - s.started) / 1000); $('.min').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    if (s.latencies.length) $('.lat').textContent = `latency ${s.latencies.at(-1)} ms`;
    if (s.cost != null) $('.cost').textContent = `$${s.cost.toFixed(3)}`;
    $('.mood').textContent = s.mood; $('.mic').textContent = `mic ${talk.micAmp ? talk.micAmp() : 0}`;
  }, 500);
  $('.nudge-remark').onclick = () => talk.nudge && talk.nudge('remark');
  $('.nudge-whisper').onclick = () => talk.nudge && talk.nudge('whisper');
  $('.reset').onclick = () => { if (confirm("Forget everything Dombi remembers?")) { resetProfile(); location.reload(); } };
  return { stop: () => { clearInterval(t); bar.remove(); } };
}
