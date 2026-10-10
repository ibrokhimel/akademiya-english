// Dombi engine, stage 4: the "alive" layers (never touches face/*, hands/*, eyes/* timelines).
//  - new group `lean` between root and everything else (owned only by the Idle layer)
//  - Gaze layer: eyes-group x/y; random holds + 50 ms darts (the dart is the transition blend)
//  - Idle layer: random rests (8 / 12 / 17 s) then a random idle break (look-around, weight shift, tiny hop,
//    lean back, nod); every state starts and ends neutral and keys all lean props (no leaks)
// Timing numbers: skill rive-animation (craft.md §3) — darts 33-50 ms, holds 0.6-2.5 s, breaks every 8-20 s, ≤5 % squash.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');

const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 };
const OUT = { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const key = (objectId, propertyKey, frame, value, cubic = SINE) =>
  ({ objectId, propertyKey, frame, value, interpolationType: cubic ? 'cubic' : 'hold', ...(cubic ? { cubicParams: cubic } : {}) });

async function anim(name, frames, add) {
  let id = mids.anims[name];
  if (!id) {
    const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
    id = mids.anims[name] = (r.animations || r.linearAnimations)[0].id;
  }
  await call('set_property_values', { propertyValues: { [id]: { 56: 60, 57: frames, 59: 0 } } });
  await ae('modifyKeyFrames', { animationId: id, add });
}

// ---- gaze: eyes group offsets from its rest spot (0,-9), ≤5 px (≈25 % of the eye width) ----
const EYES0 = { x: 0, y: -9 };
const LOOKS = { left: [-5, 0], right: [5, 0], down: [0, 4], 'up-left': [-4, -4], 'up-right': [4, -4], 'down-left': [-4, 3] };
const GAZE = { 'gaze/center-long': [0, 0, 156], 'gaze/center': [0, 0, 84],
  ...Object.fromEntries(Object.entries(LOOKS).map(([n, [x, y]], i) => ['gaze/' + n, [x, y, [54, 72, 90, 66, 60, 78][i]]])) };

// ---- idle breaks on `lean` (props: r, x, y, sx, sy); each list = [[frame, value, cubic?]...] ----
const N = { r: 0, x: 0, y: 0, sx: 100, sy: 100 };
const BREAKS = {
  'idle/look-around': [108, { r: [[0, 0], [18, -2], [48, -2], [68, 1.5], [90, 1.5], [108, 0]] }],
  'idle/weight-shift': [72, { x: [[0, 0], [20, -3], [45, -3], [72, 0]], r: [[0, 0], [20, -1], [72, 0]],
                              sx: [[0, 100], [20, 101.5], [45, 100], [72, 100]], sy: [[0, 100], [20, 98.5], [45, 100], [72, 100]] }],
  'idle/hop': [45, { y: [[0, 0], [6, 0], [14, -6, OUT], [18, -6], [26, 0], [45, 0]],
                     sy: [[0, 100], [6, 96], [14, 103], [18, 102], [26, 96], [33, 101], [42, 100], [45, 100]],
                     sx: [[0, 100], [6, 104], [14, 97], [18, 98], [26, 104], [33, 99], [42, 100], [45, 100]] }],
  'idle/lean-back': [96, { r: [[0, 0], [14, 2.5, OUT], [70, 2.5], [96, 0]], sy: [[0, 100], [14, 101, OUT], [70, 101], [96, 100]],
                           sx: [[0, 100], [14, 99, OUT], [70, 99], [96, 100]] }],
  'idle/nod': [54, { y: [[0, 0], [8, 2], [16, 0], [24, 2], [32, 0], [54, 0]], sy: [[0, 100], [8, 98], [16, 100], [24, 98], [32, 100], [54, 100]],
                     sx: [[0, 100], [8, 102], [16, 100], [24, 102], [32, 100], [54, 100]] }],
};
const RESTS = { 'idle/rest-8s': 480, 'idle/rest-12s': 720, 'idle/rest-17s': 1020 };

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---- rig: lean group at the root origin (identity), same draw order ----
  if (!ids.lean) {
    const r = await call('group_editor', { name: 'lean', parentId: ids.root });
    ids.lean = r.group.id;
    await call('set_property_values', { propertyValues: { [ids.lean]: { [K.x]: 0, [K.y]: 0 } } });
    for (const c of [ids.handRFront, ids.squash, ids.armL, ids.armR])
      await call('reparent_objects', { operations: [{ objectId: c, newParentId: ids.lean, position: 'end' }] });
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }

  // ---- timelines ----
  for (const [n, [x, y, f]] of Object.entries(GAZE))
    await anim(n, f, [key(ids.eyes, K.x, 0, EYES0.x + x, null), key(ids.eyes, K.y, 0, EYES0.y + y, null),
                      key(ids.eyes, K.x, f, EYES0.x + x, null), key(ids.eyes, K.y, f, EYES0.y + y, null)]);
  const leanKeys = (f, spec = {}) => Object.keys(N).flatMap(p =>
    (spec[p] || [[0, N[p]], [f, N[p]]]).map(([fr, v, c]) => key(ids.lean, K[p], fr, v, c || SINE)));
  for (const [n, f] of Object.entries(RESTS)) await anim(n, f, leanKeys(f));
  for (const [n, [f, spec]] of Object.entries(BREAKS)) await anim(n, f, leanKeys(f, spec));
  fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));

  // ---- layers ----
  let sm = await ae('queryStateMachine', {});
  if (!sm.layers.some(l => l.layerName === 'Gaze')) {
    const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    const centers = ['gaze/center-long', 'gaze/center'], looks = Object.keys(LOOKS).map(n => 'gaze/' + n);
    const rests = Object.keys(RESTS), breaks = Object.keys(BREAKS);
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [
      { name: 'Gaze', states: [...centers.map((n, i) => st(n, 200, i * 120)), ...looks.map((n, i) => st(n, 480, i * 70 - 120))],
        otherTransitions: [{ from: '{Entry State}', to: 'gaze/center-long' },
          ...centers.flatMap(c => looks.map(l => ({ from: c, to: l }))), ...looks.flatMap(l => centers.map(c => ({ from: l, to: c }))),
          { from: 'gaze/left', to: 'gaze/right' }, { from: 'gaze/right', to: 'gaze/left' }] },
      { name: 'Idle', states: [...rests.map((n, i) => st(n, 200, i * 120)), ...breaks.map((n, i) => st(n, 480, i * 80 - 80))],
        otherTransitions: [{ from: '{Entry State}', to: 'idle/rest-8s' },
          ...rests.flatMap(r => breaks.map(b => ({ from: r, to: b }))), ...breaks.flatMap(b => rests.map(r => ({ from: b, to: r })))] },
    ] });
    sm = await ae('queryStateMachine', {});
  }

  // ---- weights / timing ----
  const W = { 'gaze/left': 3, 'gaze/right': 3, 'gaze/down': 3, 'gaze/up-left': 1, 'gaze/up-right': 1, 'gaze/down-left': 1,
              'gaze/center-long': 3, 'gaze/center': 3,
              'idle/look-around': 3, 'idle/weight-shift': 3, 'idle/hop': 1, 'idle/lean-back': 2, 'idle/nod': 2,
              'idle/rest-8s': 2, 'idle/rest-12s': 3, 'idle/rest-17s': 2 };
  const pv = {};
  for (const l of sm.layers.filter(l => l.layerName === 'Gaze' || l.layerName === 'Idle')) {
    const name = {}; for (const s of l.states) name[s.id] = s.name;
    for (const s of l.states) if (s.type === 'animation') pv[s.id] = { 536: 1 };       // Randomize Exit
    for (const t of l.transitions) {
      const to = name[t.toStateId]; if (!to || name[t.fromStateId] === '') continue;
      const lr = (name[t.fromStateId] === 'gaze/left' && to === 'gaze/right') || (name[t.fromStateId] === 'gaze/right' && to === 'gaze/left');
      pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 537: lr ? 1 : (W[to] || 1),
                   158: l.layerName === 'Gaze' ? 50 : 0, 349: 2 };                     // dart = 50 ms cubic blend
    }
  }
  await call('set_property_values', { propertyValues: pv });
  console.log('alive layers ready:', Object.keys(GAZE).length, 'gaze states,', Object.keys(RESTS).length + Object.keys(BREAKS).length, 'idle states');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
