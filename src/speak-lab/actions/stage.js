// Dombi living on the stage (spec §4.3): every few seconds he does something of his own, picked by state (idle, listening,
// talking) and personality; when idle he sometimes walks to another spot. The rig's own random idle breaks are switched off
// (`directed`), so all his bigger moves come from here and from the acting engine, which pauses this while it acts.
// mountStage({ stageEl, boxEl, dombi, cfg, pack, reduce, getState, catalog?, rand? }) -> { pause(), resume(), stop(), log, spot() }
import { CATALOG } from './catalog.js';
import { livePick, nextLifeMs } from './rules.js';

const SPOTS = { left: 20, centre: 50, right: 80, edge: 95 };

export function mountStage({ stageEl, boxEl, dombi, cfg, pack, reduce = false, getState, catalog = CATALOG, rand = Math.random }) {
  const log = [];
  let alive = true, paused = 0, lastId = '', spot = 'centre', walking = null, tick = null;
  stageEl.classList.add('living'); boxEl.style.left = SPOTS.centre + '%';
  dombi.directed(true);

  function settle() {                                       // stop where he is (the learner started talking, or the talk ended)
    if (!walking) return; clearInterval(walking.watch); clearTimeout(walking.done);
    boxEl.style.transition = 'none'; boxEl.style.left = getComputedStyle(boxEl).left; dombi.play('none'); walking = null;
  }
  function travel() {
    const options = Object.keys(SPOTS).filter((s) => s !== spot), to = options[Math.floor(rand() * options.length) % options.length];
    const px = (Math.abs(SPOTS[to] - SPOTS[spot]) / 100) * stageEl.clientWidth, ms = Math.max(400, (px / cfg.WALK_PX_PER_S) * 1000);
    log.push({ travel: to, from: spot, state: 'idle', at: Math.round(performance.now()) }); spot = to;
    dombi.play('walk'); boxEl.style.transition = `left ${Math.round(ms)}ms ease-in-out`; boxEl.style.left = SPOTS[to] + '%';
    walking = {
      watch: setInterval(() => { if (getState() !== 'idle') settle(); }, 200),
      done: setTimeout(() => { clearInterval(walking.watch); walking = null; dombi.play(to === 'edge' ? 'peek' : 'none'); dombi.trigger('land');
        if (to === 'edge') setTimeout(() => { if (alive && !walking) dombi.play('none'); }, 3000); }, ms),
    };
  }
  function step() {
    if (!alive) return;
    if (!paused && !walking) {
      const state = getState(), p = livePick({ state, pack, lastId, reduce, rand }, catalog, cfg);
      if (p && p.travel) travel();
      else if (p) { lastId = p.id; dombi.fire(p.rig, p.ms); log.push({ id: p.id, state, fits: (p.life[state] || 0) > 0, at: Math.round(performance.now()) }); }
    }
    tick = setTimeout(step, nextLifeMs({ reduce, rand }, cfg));
  }
  tick = setTimeout(step, nextLifeMs({ reduce, rand }, cfg));

  return {
    log,
    spot: () => spot,
    pause() { paused++; settle(); },
    resume() { paused = Math.max(0, paused - 1); },
    stop() { alive = false; clearTimeout(tick); settle(); dombi.directed(false); },
  };
}
