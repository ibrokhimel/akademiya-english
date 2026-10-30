// Dombi in sync (docs/superpowers/specs/2026-10-30-dombi-in-sync-design.md §4.6-4.7): thirty moves can HOLD, and small
// talking beats.
//  - Holds: each move's once/<name> is cut at a loop window [a, b] found in its own keys (the two key frames, a in the first
//    half and b in the second, whose poses are closest). hold/<name> = the window, looping, its last frame = its first;
//    end/<name> = the rest of the move from b. PlayOnce: once/<name> --hold true, at a--> hold/<name> --hold false-->
//    end/<name> --100 %--> once/idle. With `hold` false nothing changes: the move plays once as before.
//  - Beats: a group `beat` between `once` and `act` that no other layer keys; layer Talk: Any --beat--> a random pick of
//    nod / tilt / bob (250-400 ms) --> rest.
// node dombi_holds.js --dry   prints the windows only.  Safe to run again (animations are re-keyed, states and routes reused).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { ae, anim, newAnim, F, SINE } = require('./dombi_redo');
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

const HOLDS = ['dance', 'wiggleDance', 'robotDance', 'headbang', 'airGuitar', 'applause', 'cheer', 'laughHard', 'drumroll', 'shiver',
  'phoneScroll', 'peekSide', 'readBook', 'writeNote', 'magnify', 'chinRub', 'headScratch', 'impatient', 'armsCrossed', 'fingerWag',
  'boxing', 'doubleFlex', 'dozeOff', 'sweat', 'steam', 'hideFace', 'sneakyLook', 'wobbleJelly', 'bounceBall', 'yesYes'];
const MIN_LOOP = 24, MIN_END = 12;                                          // frames (60 fps): a loop of at least 0.4 s, an end of 0.2 s

const clean = (k) => { const o = { objectId: k.objectId, propertyKey: k.propertyKey, frame: k.frame, value: k.value, interpolationType: k.interpolationType || 'hold' };
  if (k.cubicParams) o.cubicParams = k.cubicParams; return o; };
function tracksOf(keys) {
  const m = new Map();
  for (const k of keys) { const id = k.objectId + '|' + k.propertyKey; if (!m.has(id)) m.set(id, []); m.get(id).push(k); }
  for (const t of m.values()) t.sort((x, y) => x.frame - y.frame);
  return [...m.values()];
}
// a track's value at frame f: held keys hold, numbers are eased linearly between keys (only used for the cut points)
function valueAt(t, f) {
  let i = t.length - 1; while (i > 0 && t[i].frame > f) i--;
  const k = t[i], n = t[i + 1];
  if (f <= t[0].frame) return t[0].value;
  if (!n || k.interpolationType === 'hold' || typeof k.value !== 'number') return k.value;
  return k.value + ((n.value - k.value) * (f - k.frame)) / (n.frame - k.frame);
}
function windowOf(tracks, len) {
  const frames = [...new Set(tracks.flatMap((t) => t.map((k) => k.frame)))].sort((x, y) => x - y);
  const num = tracks.filter((t) => typeof t[0].value === 'number');
  const range = num.map((t) => Math.max(1e-6, Math.max(...t.map((k) => k.value)) - Math.min(...t.map((k) => k.value))));
  let best = null;
  for (const a of frames) for (const b of frames) {
    if (a < len * 0.15 || a > len * 0.55 || b < len * 0.45 || b > len - MIN_END || b - a < MIN_LOOP) continue;
    const d = num.reduce((s, t, i) => s + Math.abs(valueAt(t, a) - valueAt(t, b)) / range[i], 0) / Math.max(1, num.length);
    if (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) < 1e-9 && b - a > best.b - best.a)) best = { a, b, d };
  }
  return best || { a: Math.round(len * 0.3), b: Math.round(len * 0.7), d: NaN };
}
// keys of the window [from, to] of a track, shifted to start at 0; first and last frame pinned (the loop closes on `close`)
function cut(t, from, to, close) {
  const inside = t.filter((k) => k.frame > from && k.frame < to).map((k) => ({ ...clean(k), frame: k.frame - from }));
  const first = { ...clean(t[0]), frame: 0, value: valueAt(t, from), interpolationType: typeof t[0].value === 'number' ? 'cubic' : 'hold' };
  if (first.interpolationType === 'cubic') first.cubicParams = SINE; else delete first.cubicParams;
  const last = { ...first, frame: to - from, value: close ? first.value : valueAt(t, to) };
  return [first, ...inside, last];
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const dry = process.argv.includes('--dry'), plan = [];
  for (const name of HOLDS) {
    const id = mids.anims['once/' + name]; if (!id) throw new Error('no once/' + name);
    const q = await ae('queryKeyFrames', { animationIds: [id] }), tracks = tracksOf(q.keyframes[id] || []);
    const len = Math.max(...tracks.flatMap((t) => t.map((k) => k.frame)));
    const w = windowOf(tracks, len);
    plan.push({ name, len, ...w, tracks });
    console.log(name.padEnd(12), 'frames', len, '· loop', w.a, '→', w.b, `(${Math.round(((w.b - w.a) / 60) * 1000)} ms)`, '· pose gap', Number.isNaN(w.d) ? '?' : w.d.toFixed(3));
  }
  if (dry) return;

  // the view model: `hold` (bool) and `beat` (trigger)
  let vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  const has = (n) => vm.viewModelProperties.find((p) => p.name === n);
  if (has('hold') && has('hold').propertyType !== 'boolean') throw new Error('hold is already a ' + has('hold').propertyType);
  if (has('beat') && has('beat').propertyType !== 'trigger') throw new Error('beat is already a ' + has('beat').propertyType);
  const add = [!has('hold') && { name: 'hold', propertyType: 'boolean' }, !has('beat') && { name: 'beat', propertyType: 'trigger' }].filter(Boolean);
  if (add.length) { await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: add }] }); vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi'); }
  const prop = (n) => vm.viewModelProperties.find((p) => p.name === n).id;
  const isHold = (v) => [{ leftComparator: { viewModelPropertyId: prop('hold') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: v } }];

  // holds
  for (const p of plan) {
    await newAnim('hold/' + p.name, p.b - p.a); await anim('hold/' + p.name, p.b - p.a, p.tracks.flatMap((t) => cut(t, p.a, p.b, true)), 1);
    await newAnim('end/' + p.name, p.len - p.b); await anim('end/' + p.name, p.len - p.b, p.tracks.flatMap((t) => cut(t, p.b, p.len, false)), 0);
  }
  let sm = await ae('queryStateMachine', {}), L = sm.layers.find((l) => l.layerName === 'PlayOnce');
  const missing = plan.flatMap((p) => ['hold/' + p.name, 'end/' + p.name]).filter((n) => !L.states.some((s) => s.name === n));
  if (missing.length) { await ae('createStates', { layerId: L.layerId, states: missing.map((n, i) => ({ name: n, linearAnimationName: n, x: 1500 + (i % 2) * 200, y: 300 + Math.floor(i / 2) * 60 })) });
    sm = await ae('queryStateMachine', {}); L = sm.layers.find((l) => l.layerName === 'PlayOnce'); }
  const st = (n) => L.states.find((s) => s.name === n), route = (a, b) => L.transitions.find((t) => t.fromStateId === st(a).id && t.toStateId === st(b).id);
  const want = plan.flatMap((p) => [['once/' + p.name, 'hold/' + p.name], ['hold/' + p.name, 'end/' + p.name], ['end/' + p.name, 'once/idle']]).filter(([a, b]) => !route(a, b));
  if (want.length) { await ae('createTransitions', { states: want.map(([a, b]) => ({ id: st(a).id, transitions: [{ to: st(b).id }] })) });
    sm = await ae('queryStateMachine', {}); L = sm.layers.find((l) => l.layerName === 'PlayOnce'); }
  const pv = {}, conds = [];
  for (const p of plan) {
    const tIn = route('once/' + p.name, 'hold/' + p.name), tOut = route('hold/' + p.name, 'end/' + p.name), tBack = route('end/' + p.name, 'once/idle');
    pv[tIn.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: Math.round((p.a / p.len) * 100), 158: 0 };   // a cut at a (exit time takes whole percents)
    pv[tOut.id] = { 152: F.enableEarlyExit, 158: 150, 349: 2 };
    pv[tBack.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 120, 349: 2 };
    if (!(tIn.conditions || []).length) conds.push({ id: tIn.id, conditions: isHold(true) });
    if (!(tOut.conditions || []).length) conds.push({ id: tOut.id, conditions: isHold(false) });
  }
  const set = async (v) => { const r = await call('set_property_values', { propertyValues: v }); if ((r.errors || []).length) throw new Error('set: ' + JSON.stringify(r.errors).slice(0, 300)); };
  await set(pv);
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('holds wired:', plan.length);

  // beats: the `beat` group between once and act
  if (!ids.beat) {
    const g = (await call('group_editor', { name: 'beat', parentId: ids.once })).group.id;
    await call('reparent_objects', { operations: [{ objectId: ids.act, newParentId: g }] });
    // close any open timeline in the editor first: a move made while one is open is keyed into it (2026-10-30 theme/light
    // got act x 130 / y 200 that way and Dombi drew off-canvas at runtime)
    await call('set_property_values', { propertyValues: { [g]: { 13: 0, 14: 0 }, [ids.act]: { 13: 0, 14: 0 } } });
    ids.beat = g; fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }
  const B = (name, frames, k) => [['x', 13], ['y', 14], ['r', 15], ['sx', 16], ['sy', 17]].flatMap(([p, pk]) =>
    (k[p] || [[0, p[0] === 's' ? 100 : 0], [frames, p[0] === 's' ? 100 : 0]]).map(([f, v]) => ({ objectId: ids.beat, propertyKey: pk, frame: f, value: v, interpolationType: 'cubic', cubicParams: SINE })));
  const BEATS = {
    'talk/rest': [6, {}],
    'talk/pick': [1, {}],
    'talk/nod': [18, { y: [[0, 0], [6, 3], [18, 0]], sy: [[0, 100], [6, 97], [18, 100]] }],        // a small nod, 300 ms
    'talk/tilt': [24, { r: [[0, 0], [8, -3], [24, 0]] }],                                         // the head and body lean in, 400 ms
    'talk/bob': [15, { y: [[0, 0], [5, -3], [15, 0]], sy: [[0, 100], [5, 102], [15, 100]] }],      // a little lift on a word, 250 ms
  };
  for (const [n, [frames, k]] of Object.entries(BEATS)) { await newAnim(n, frames); await anim(n, frames, B(n, frames, k), 0); }
  sm = await ae('queryStateMachine', {});
  if (!sm.layers.some((l) => l.layerName === 'Talk')) {
    const s = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Talk',
      states: [s('talk/rest', 200, 0), s('talk/pick', 400, 0), s('talk/nod', 600, -90), s('talk/tilt', 600, 0), s('talk/bob', 600, 90)],
      otherTransitions: [{ from: '{Entry State}', to: 'talk/rest' }, { from: '{Any State}', to: 'talk/pick' },
        { from: 'talk/pick', to: 'talk/nod' }, { from: 'talk/pick', to: 'talk/tilt' }, { from: 'talk/pick', to: 'talk/bob' },
        { from: 'talk/nod', to: 'talk/rest' }, { from: 'talk/tilt', to: 'talk/rest' }, { from: 'talk/bob', to: 'talk/rest' }] }] });
    sm = await ae('queryStateMachine', {});
  }
  const T = sm.layers.find((l) => l.layerName === 'Talk'), ts = (n) => T.states.find((s) => s.name === n);
  const r = (a, b) => T.transitions.find((t) => t.fromStateId === (a === 'any' ? T.anyStateId : ts(a).id) && t.toStateId === ts(b).id);
  const bp = { [ts('talk/pick').id]: { 536: 1 } };                          // randomize exit: one of the three, at random
  const tAny = r('any', 'talk/pick'); bp[tAny.id] = { 152: F.enableEarlyExit, 158: 0 };
  for (const v of ['talk/nod', 'talk/tilt', 'talk/bob']) { bp[r('talk/pick', v).id] = { 158: 0, 537: 1 }; bp[r(v, 'talk/rest').id] = { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 60, 349: 2 }; }
  await set(bp);
  if (!(tAny.conditions || []).length) await ae('createConditions', { transitions: [{ id: tAny.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('beat') } }] }] });
  console.log('talk beats wired');
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
