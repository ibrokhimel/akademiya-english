// Café waiters, stage 3: talking, reactions, dark colours and the app controls.  node waiter_act.js a|c
// View model "Waiter" (same names as Dombi's where they overlap):
//   talking (bool) + viseme (number 0-11, same ids as design/icons/dombi_visemes.js) · correct / wrong (triggers) · dark (bool)
// Layers added after Body and Eyes (a lower layer in the list wins a shared property):
//   Reactions : react/idle (neutral + resting smile) · react/correct · react/wrong      owns root scale, head tilt, brows, tie/cap/moustache accents, mouth
//   Talk      : talk/off · talk/on (small face bob while speaking)                        owns face y
//   Mouth     : mouth/off (keys nothing -> the Reactions mouth shows) · mouth/v0..v11     overrides the mouth while talking
//   Theme     : theme/light · theme/dark                                                  owns the hair / jacket / cap colours
// The mouth is a dark ellipse with a skin-coloured cover above it (smile crescent), plus teeth and tongue.
const { all, save, call, K, PIV, CHARS, paths } = require('./waiter_rig');

const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 };
const IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const OUT = { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const W = 20, H = 21, OP = 18, COLOR = 37;
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const key = (objectId, propertyKey, frame, value, cubic) =>
  ({ objectId, propertyKey, frame, value, interpolationType: cubic ? 'cubic' : 'hold', ...(cubic ? { cubicParams: cubic } : {}) });
const T = (o, p, list) => list.map(([f, v, c]) => key(o, p, f, v, c === undefined ? SINE : c));
const cond = (id, op, value) => ({ leftComparator: { viewModelPropertyId: id }, ...(op ? { comparationOperation: op, rightComparator: { valueType: 'constantValueType', value } } : {}) });

// viseme ids = Dombi's. w/h of the opening, sag = how far the cover dips into the top edge (a smile), teeth / tongue sizes.
const VISEMES = {
  1: { w: 26, h: 5, sag: 0 },                                    // MBP  closed lips
  2: { w: 22, h: 8, sag: 0, teeth: [16, 4.5] },                  // FV   teeth on the lip
  3: { w: 28, h: 9, sag: 1, teeth: [20, 4.5] },                  // TEETH t d n s z k g
  4: { w: 34, h: 12, sag: 4, teeth: [24, 5] },                   // EE   widest, corners up
  5: { w: 28, h: 15, sag: 2, teeth: [18, 4] },                   // EH
  6: { w: 26, h: 23, sag: 1, teeth: [16, 4], tongue: [15, 8] },  // AA   wide open
  7: { w: 18, h: 18, sag: 0 },                                   // OH
  8: { w: 11, h: 12, sag: 0 },                                   // OO   small round
  9: { w: 19, h: 10, sag: 0, teeth: [12, 3.5] },                 // SH_R
  10: { w: 21, h: 11, sag: 2, tongue: [11, 5], tongueUp: true }, // TH   tongue between the teeth
  11: { w: 20, h: 9, sag: 1 },                                   // UH   lazy open
};
const DARK = { hair: '#666672', shine: '#84848F', jacket: '#5C5C68', doppi: '#4C4C58' };   // brows and moustache sit on skin, so they stay dark
const THEMED = { hairTop: 'hair', sideL: 'hair', sideR: 'hair', hairShine: 'shine', jacket: 'jacket', doppi: 'doppi' };
const LIGHT = { hair: '#3D3D3D', shine: '#555555', jacket: '#4B4B4B', doppi: '#2B2B2B' };

async function main(k) {
  const ids = all[k], ch = CHARS[k];
  const s = ch.smallMouth ? 0.7 : 1;
  const R = ch.smallMouth ? { w: 22, h: 12, cw: 26, ch: 11, cy: -2.5 } : { w: 32, h: 20, cw: 36, ch: 17, cy: -4 };
  const TOP = ch.smallMouth ? -2.5 : -6;      // top edge of an open mouth (the moustache hides anything higher)
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---------- rig: teeth + tongue inside the mouth, cover back on top ----------
  if (!ids.teeth) {
    const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      { primitive: 'ellipse', name: 'tongue', parentId: ids.mouth, x: 0, y: 0, width: 14 * s, height: 7 * s, paints: [{ paintType: 'fill', color: argb('#F05656') }] },
      { primitive: 'rectangle', name: 'teeth', parentId: ids.mouth, x: 0, y: 0, width: 16 * s, height: 4 * s, cornerRadius: 1.6, paints: [{ paintType: 'fill', color: argb('#FFFFFF') }] }] } } });
    const made = r.shapes || r.created || r;
    ids.tongue = made[0].id || made[0]; ids.teeth = made[1].id || made[1];
    await call('set_property_values', { propertyValues: { [ids.tongue]: { [OP]: 0 }, [ids.teeth]: { [OP]: 0 } } });
    await call('reparent_objects', { operations: [{ objectId: ids.mouthCover, newParentId: ids.mouth, position: 'start' }] });
    save(); await paths(k);
  }
  // the mouth sits behind the brows, eyes and nose, so its skin-coloured cover can never hide them
  if (!ids.mouthBehind) { await call('reparent_objects', { operations: [{ objectId: ids.mouth, newParentId: ids.face, position: 'end' }] }); ids.mouthBehind = true; save(); }
  const P = ids.path;

  // ---------- mouth poses ----------
  const stacheY = PIV.stache[1] - PIV.face[1];
  function pose(m) {   // m = { w, h, sag, teeth, tongue, x, y, rest }
    const v = {}; const set = (id, p, val) => { (v[id] = v[id] || {})[p] = +val.toFixed(3); };
    const w = m.w * s, h = m.h * s, x = (m.x || 0) * s;
    let my, cy;
    if (m.rest) { my = (m.y || 0) * s; cy = my + h / 2 - m.rest * s - R.ch / 2; }       // crescent `rest` px thick
    else { const top = TOP + (m.y || 0) * s; my = top + h / 2; cy = top + m.sag * s - 0.5 - R.ch / 2; }
    set(ids.mouthShape, K.x, x); set(ids.mouthShape, K.y, my); set(P.mouthShape, W, w); set(P.mouthShape, H, h);
    set(ids.mouthCover, K.x, x); set(ids.mouthCover, K.y, cy);
    const top = my - h / 2;
    const t = m.teeth, g = m.tongue;
    set(ids.teeth, OP, t ? 100 : 0); set(P.teeth, W, (t ? t[0] : 16) * s); set(P.teeth, H, (t ? t[1] : 4) * s);
    set(ids.teeth, K.y, t ? top + Math.max(m.sag, 0) * s + 0.8 * s + t[1] * s / 2 : my); set(ids.teeth, K.x, x);
    set(ids.tongue, OP, g ? 100 : 0); set(P.tongue, W, (g ? g[0] : 14) * s); set(P.tongue, H, (g ? g[1] : 7) * s);
    set(ids.tongue, K.y, g ? (m.tongueUp ? top + m.sag * s + g[1] * s / 2 + 1 : top + h - g[1] * s / 2 - 1.5 * s) : my); set(ids.tongue, K.x, x);
    if (ids.stache) set(ids.stache, K.y, stacheY - Math.min(Math.max((h - 4) / 8, 0), 1) * 2.2);
    return v;
  }
  const REST = pose({ w: R.w / s, h: R.h / s, rest: (R.h / 2 - (R.cy + R.ch / 2)) / s });   // exactly the rig's design pose
  const GRIN = pose({ w: 37, h: 25, rest: 9.5, y: 1 });
  const HM = pose({ w: 15, h: 5, sag: 0, x: 3, y: 9 });
  const poseKeys = (p, frame, cubic) => Object.entries(p).flatMap(([id, props]) => Object.entries(props).map(([pk, val]) => key(id, +pk, frame, val, cubic)));
  const morph = (steps) => steps.flatMap(([f, p, c]) => poseKeys(p, f, c === undefined ? SINE : c));

  // ---------- view model (shared by both waiters) ----------
  let vm = ((await vme('listViewModels', {})).viewModels || []).find(v => v.name === 'Waiter');
  if (!vm) {
    await vme('createViewModels', { viewModels: [{ name: 'Waiter', viewModelProperties: [
      { name: 'talking', propertyType: 'boolean' }, { name: 'viseme', propertyType: 'number' },
      { name: 'correct', propertyType: 'trigger' }, { name: 'wrong', propertyType: 'trigger' }, { name: 'dark', propertyType: 'boolean' }] }] });
    vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Waiter');
    await vme('createViewModelInstances', { viewModelId: vm.id, instances: [{ name: 'Default', instanceProperties: [] }] });
  }
  if (!ids.vmBound) { await vme('bindViewModelToArtboard', { artboardId: ids.artboard, viewModelId: vm.id }); ids.vmBound = true; save(); }
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;

  // ---------- timelines ----------
  ids.anims = ids.anims || {};
  async function anim(name, frames, loop, add) {
    let a = ids.anims[name];
    if (!a) {
      const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
      a = ids.anims[name] = (r.linearAnimations || r.animations || r.created)[0].id;
    } else {                                                  // re-run: replace the old keys
      const q = await ae('queryKeyFrames', { animationIds: [a] });
      const old = ((q.keyframes || {})[a] || []).map(x => x.keyframeId);
      for (let i = 0; i < old.length; i += 200) await ae('modifyKeyFrames', { animationId: a, delete: old.slice(i, i + 200) });
    }
    await call('set_property_values', { propertyValues: { [a]: { 56: 60, 57: frames, 59: loop ? 1 : 0 } } });
    for (let i = 0; i < add.length; i += 150) await ae('modifyKeyFrames', { animationId: a, add: add.slice(i, i + 150) });
  }
  // mouth
  await anim('mouth/off', 6, false, []);
  await anim('mouth/v0', 6, false, poseKeys(REST, 0));
  for (const [id, m] of Object.entries(VISEMES)) await anim(`mouth/v${id}`, 6, false, poseKeys(pose(m), 0));

  // reactions: every owned property is keyed in every state (no leaks)
  const B = PIV.brows[1] - PIV.face[1];
  const N = { rootSx: 100, rootSy: 100, headR: 0, browsY: B, browLY: 0, browLR: -6, browRY: 0, browRR: 6, tieR: 0, capR: 0, stSx: 100 };
  const owned = (spec, len) => {
    const o = (id, p, n) => id ? T(id, p, spec[n] || [[0, N[n], null], [len, N[n], null]]) : [];
    return [...o(ids.root, K.sx, 'rootSx'), ...o(ids.root, K.sy, 'rootSy'), ...o(ids.head, K.r, 'headR'), ...o(ids.brows, K.y, 'browsY'),
            ...o(ids.browL, K.y, 'browLY'), ...o(ids.browL, K.r, 'browLR'), ...o(ids.browR, K.y, 'browRY'), ...o(ids.browR, K.r, 'browRR'),
            ...o(ids.tie, K.r, 'tieR'), ...o(ids.cap, K.r, 'capR'), ...o(ids.stache, K.sx, 'stSx')];
  };
  await anim('react/idle', 6, false, [...owned({}, 6), ...poseKeys(REST, 0)]);
  // correct: dip 80 ms -> pop 100 ms -> hold 80 ms -> settle; brows up, head tilts, big smile; bow tie / cap / moustache accent lands late
  await anim('react/correct', 72, false, [...owned({
    rootSy: [[0, 100, IN], [5, 95, OUT], [11, 105.5], [16, 105.5], [24, 98.8], [32, 100.6], [40, 100], [72, 100]],
    rootSx: [[0, 100, IN], [5, 103, OUT], [11, 97], [16, 97], [24, 100.8], [32, 99.7], [40, 100], [72, 100]],
    headR: [[0, 0], [5, 0, OUT], [13, -3.5], [44, -3.5], [60, 0], [72, 0]],
    browsY: [[0, B, IN], [5, B + 1, OUT], [11, B - 4.5], [46, B - 4.5], [60, B], [72, B]],
    tieR: [[0, 0], [7, 0, OUT], [13, -12], [20, 9], [27, -5], [34, 2], [40, 0], [72, 0]],
    capR: [[0, 0], [7, 0, OUT], [13, -4], [22, 2.5], [30, -1], [38, 0], [72, 0]],
    stSx: [[0, 100], [7, 100, OUT], [13, 114], [22, 97], [30, 101], [38, 100], [72, 100]],
  }, 72), ...morph([[0, REST], [5, REST, OUT], [12, GRIN], [48, GRIN], [62, REST], [72, REST]])]);
  // wrong: a small "hm" - head tilts, one brow lifts, mouth goes small and flat; back in under 0.9 s; never sad
  await anim('react/wrong', 54, false, [...owned({
    rootSy: [[0, 100, IN], [6, 98.6, OUT], [14, 100], [54, 100]], rootSx: [[0, 100, IN], [6, 101, OUT], [14, 100], [54, 100]],
    headR: [[0, 0, OUT], [8, 4.5], [34, 4.5], [50, 0], [54, 0]],
    browLY: [[0, 0, OUT], [8, -3.5], [34, -3.5], [50, 0], [54, 0]], browLR: [[0, -6, OUT], [8, -13], [34, -13], [50, -6], [54, -6]],
    browRY: [[0, 0, OUT], [8, 1.2], [34, 1.2], [50, 0], [54, 0]], browRR: [[0, 6, OUT], [8, 1], [34, 1], [50, 6], [54, 6]],
  }, 54), ...morph([[0, REST, OUT], [7, HM], [34, HM], [50, REST], [54, REST]])]);
  // talk bob
  const FY = PIV.face[1] - PIV.head[1];
  await anim('talk/off', 6, false, [key(ids.face, K.y, 0, FY)]);
  await anim('talk/on', 66, true, T(ids.face, K.y, [[0, FY], [9, FY + 1.3], [20, FY], [31, FY + 0.7], [44, FY - 0.4], [56, FY + 1], [66, FY]]));
  // theme
  const cols = (m) => Object.entries(THEMED).filter(([n]) => ids.color[n]).map(([n, c]) => key(ids.color[n], COLOR, 0, argb(m[c])));
  await anim('theme/light', 6, false, cols(LIGHT));
  await anim('theme/dark', 6, false, cols(DARK));
  save();

  // ---------- layers ----------
  let sm = await ae('queryStateMachine', {});
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  const have = (n) => sm.layers.some(l => l.layerName === n);
  const vis = ['mouth/v0', ...Object.keys(VISEMES).map(i => `mouth/v${i}`)];
  const add = [];
  if (!have('Reactions')) add.push({ name: 'Reactions', states: [st('react/idle', 200, 0), st('react/correct', 440, -60), st('react/wrong', 440, 60)],
    otherTransitions: [{ from: '{Entry State}', to: 'react/idle' }, { from: '{Any State}', to: 'react/correct' }, { from: '{Any State}', to: 'react/wrong' },
      { from: 'react/correct', to: 'react/idle' }, { from: 'react/wrong', to: 'react/idle' }] });
  if (!have('Talk')) add.push({ name: 'Talk', states: [st('talk/off', 200, 0), st('talk/on', 440, 0)],
    otherTransitions: [{ from: '{Entry State}', to: 'talk/off' }, { from: 'talk/off', to: 'talk/on' }, { from: 'talk/on', to: 'talk/off' }] });
  if (!have('Mouth')) add.push({ name: 'Mouth', states: [st('mouth/off', 200, 0), ...vis.map((n, i) => st(n, 420 + (i % 4) * 170, Math.floor(i / 4) * 90 - 90))],
    otherTransitions: [{ from: '{Entry State}', to: 'mouth/off' }, { from: '{Any State}', to: 'mouth/off' }, ...vis.map(n => ({ from: '{Any State}', to: n }))] });
  if (!have('Theme')) add.push({ name: 'Theme', states: [st('theme/light', 220, 0), st('theme/dark', 440, 0)],
    otherTransitions: [{ from: '{Entry State}', to: 'theme/light' }, { from: 'theme/light', to: 'theme/dark' }, { from: 'theme/dark', to: 'theme/light' }] });
  if (add.length) { await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: add }); sm = await ae('queryStateMachine', {}); }

  const pv = {}, conds = [];
  for (const L of sm.layers.filter(l => ['Reactions', 'Talk', 'Mouth', 'Theme'].includes(l.layerName))) {
    const nm = {}; for (const x of L.states) nm[x.id] = x.name || x.type;
    for (const t of L.transitions) {
      const from = nm[t.fromStateId], to = nm[t.toStateId]; if (from === 'entry') continue;
      const c = (list) => { if (!t.conditions.length) conds.push({ id: t.id, conditions: list }); };
      if (L.layerName === 'Reactions') {
        if (to === 'react/idle') pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 200, 349: 2 };
        else { pv[t.id] = { 152: F.enableEarlyExit, 158: 60, 349: 2 }; c([cond(prop(to.slice(6)))]); }
      } else if (L.layerName === 'Talk') { pv[t.id] = { 152: F.enableEarlyExit, 158: 150, 349: 2 }; c([cond(prop('talking'), 'equal', to === 'talk/on')]); }
      else if (L.layerName === 'Mouth') {
        if (to === 'mouth/off') { pv[t.id] = { 152: F.enableEarlyExit, 158: 120, 349: 2 }; c([cond(prop('talking'), 'equal', false)]); }
        else { const n = +to.slice(7); pv[t.id] = { 152: F.enableEarlyExit, 158: n === 1 || n === 2 ? 50 : 70, 349: 2 };
          c([cond(prop('talking'), 'equal', true), cond(prop('viseme'), 'equal', n)]); }
      } else if (L.layerName === 'Theme') { pv[t.id] = { 152: F.enableEarlyExit, 158: 250, 349: 2 }; c([cond(prop('dark'), 'equal', to === 'theme/dark')]); }
    }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  save();
  console.log(ids.name, 'ready. layers:', sm.layers.map(l => l.layerName + '(' + l.states.length + ')').join(', '), '| new conditions:', conds.length);
}
main(process.argv[2]).catch(e => { console.log('FAIL', e.message); process.exit(1); });
