// Dombi engine, stage 6: every gesture = intro (one-shot, the owner's animation) -> idle loop (keeps going until the
// gesture changes). Hands layer rewired with direct transitions (Any-State would restart the intro during the loop):
//   none -> g        (gesture == g)          g = wave | celebrate | thinking | point
//   g, g-loop -> h   (gesture == h, h != g)  and -> none (gesture == none)
//   g -> g-loop      (exit time 100 %)
// Loops start from the intro's last pose (read from the file), so the hand-off is seamless.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const G = ['wave', 'celebrate', 'thinking', 'point'];
const OWNED = [['armL', ['r']], ['armR', ['r']], ['handL', ['x', 'y', 'sx', 'sy']], ['handR', ['x', 'y', 'sx', 'sy']],
               ['handRFront', ['x', 'y', 'sx', 'sy']], ['act', ['x', 'y', 'r', 'sx', 'sy']]];
const NEUTRAL = { r: 0, x: 0, y: 0, sx: 100, sy: 100 };

// loop motion on top of the end pose: part -> prop -> [[frame, delta]] (delta added to the end value)
const LOOPS = {
  // hands pump up and down; left trails right by 3 frames; tiny body bounce with the right hand
  celebrate: [40, { handR: { y: [[0, 0], [10, -8], [20, 0], [30, -8], [40, 0]] },
                    handL: { y: [[0, -1.2], [3, 0], [13, -8], [23, 0], [33, -8], [40, -1.2]] },
                    act: { y: [[0, 0], [10, -2], [20, 0], [30, -2], [40, 0]] } }],
  // two small chin taps, then a still hold
  thinking: [90, { handRFront: { y: [[0, 0], [40, 0], [44, -3], [50, 0], [54, -3], [60, 0], [90, 0]] } }],
  // a small jab forward every 1.2 s
  point: [72, { handR: { x: [[0, 0], [6, 3], [14, 0], [72, 0]] } }],
  // the owner's wave ends with the hand put away: hold it (animate a loop here if he should keep waving)
  wave: [60, {}],
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---- 1. loop timelines from each intro's end pose ----
  const q = await ae('queryKeyFrames', { animationIds: G.map(g => mids.anims['hands/' + g]) });
  for (const g of G) {
    const end = {};
    for (const k of q.keyframes[mids.anims['hands/' + g]]) {
      const kk = `${k.objectId}|${k.propertyKey}`;
      if (!end[kk] || k.frame >= end[kk].frame) end[kk] = { frame: k.frame, value: +k.value };
    }
    const [frames, motion] = LOOPS[g], add = [];
    for (const [part, props] of OWNED) for (const p of props) {
      const base = end[`${ids[part]}|${K[p]}`]?.value ?? NEUTRAL[p];
      const track = (motion[part] && motion[part][p]) || [[0, 0], [frames, 0]];
      for (const [f, d] of track) add.push({ objectId: ids[part], propertyKey: K[p], frame: f, value: +(base + d).toFixed(3), interpolationType: 'cubic', cubicParams: SINE });
    }
    const name = `hands/${g}-loop`;
    if (!mids.anims[name]) {
      const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
      mids.anims[name] = (r.animations || r.linearAnimations)[0].id;
    }
    await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: 1 } } });
    await ae('modifyKeyFrames', { animationId: mids.anims[name], add });
  }
  fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));

  // ---- 2. rewire the Hands layer ----
  let sm = await ae('queryStateMachine', {});
  let L = sm.layers.find(l => l.layerName === 'Hands');
  const anyTr = L.transitions.filter(t => t.fromStateId === L.anyStateId).map(t => t.id);
  if (anyTr.length) await call('delete_objects', { objectIds: anyTr });
  if (!L.states.some(s => s.name === 'hands/wave-loop'))
    await ae('createStates', { layerId: L.layerId, states: G.map((g, i) => ({ name: `hands/${g}-loop`, x: 380 + i * 180, y: 160, linearAnimationName: `hands/${g}-loop` })) });
  sm = await ae('queryStateMachine', {});
  L = sm.layers.find(l => l.layerName === 'Hands');
  const S = {}; for (const s of L.states) if (s.type === 'animation') S[s.name.slice(6)] = s.id;   // 'none', 'wave', 'wave-loop', ...
  const plan = [];   // [from, to, kind]
  for (const g of G) plan.push(['none', g, 'cond']);
  for (const g of G) for (const from of [g, g + '-loop']) {
    plan.push([from, 'none', 'cond']);
    for (const h of G) if (h !== g) plan.push([from, h, 'cond']);
  }
  for (const g of G) plan.push([g, g + '-loop', 'exit']);
  const byFrom = {};
  for (const [f, t] of plan) (byFrom[S[f]] = byFrom[S[f]] || []).push({ to: S[t] });
  await ae('createTransitions', { states: Object.entries(byFrom).map(([id, transitions]) => ({ id, transitions })) });

  sm = await ae('queryStateMachine', {});
  L = sm.layers.find(l => l.layerName === 'Hands');
  const vm = (await call('viewmodel_editor', { command: 'listViewModels', data: { listViewModels: {} } })).viewModels.find(v => v.name === 'Dombi');
  const gestureProp = vm.viewModelProperties.find(p => p.name === 'gesture').id;
  const name = {}; for (const s of L.states) name[s.id] = s.name ? s.name.slice(6) : s.type;
  const pv = {}, conds = [];
  for (const t of L.transitions) {
    const from = name[t.fromStateId], to = name[t.toStateId];
    if (from === 'entry') continue;
    if (to.endsWith('-loop')) { pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0 }; continue; }
    pv[t.id] = { 152: F.enableEarlyExit, 158: 150, 349: 2 };
    if (!t.conditions.length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: gestureProp }, comparationOperation: 'equal',
      rightComparator: { valueType: 'constantValueType', value: to } }] });
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('loops:', G.length, '· transitions:', L.transitions.length - 1, '· new conditions:', conds.length, '· removed any-state:', anyTr.length);
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
