// More baked effects (plan docs/ideas/motion-plan.md): F7 frost, F9 dust puff, F10 double ring, F2 twinkle.
//   node fx_more.js frost | dust | rings | twinkle | all
// Artboards + view models:
//   "FX Frost"   200×200  VM FXFrost    trigger fire (2 versions): ice ring + 8 shards + snow drifting down
//   "FX Dust"    200×120  VM FXDust     trigger fire (2 versions): puffs out sideways along the floor (y = 100)
//   "FX Rings"   240×240  VM FXRings    trigger fire, color `color` (gold): two rings, one after the other
//   "FX Twinkle" 240×200  VM FXTwinkle  trigger fire (2 versions), color `color` (gold): 7 twinkles over ~2 s
const fx = require('./fx_bake.js');
const { ids, save, call, vme, K, PAL, OUT, IN, rng, key, artboard, makePieces, timeline, wire, bakePiece, argb } = fx;

function radialKeys(pc, cx, cy, ang, dist, life, spin, start = 0, r0 = 12) {
  const a = ang * Math.PI / 180, at = (d) => [cx + Math.cos(a) * d, cy + Math.sin(a) * d], p0 = at(r0), p9 = at(r0 + (dist - r0) * 0.9), p1 = at(dist), s = start, keys = [];
  if (s) keys.push(key(pc.id, K.op, 0, 0, 'hold'));
  keys.push(key(pc.id, K.op, s, 100, 'hold'), key(pc.id, K.op, s + life, 0, 'hold'),
    key(pc.id, K.x, s, +p0[0].toFixed(1), OUT), key(pc.id, K.y, s, +p0[1].toFixed(1), OUT), key(pc.id, K.x, s + 11, +p9[0].toFixed(1), 'linear'), key(pc.id, K.y, s + 11, +p9[1].toFixed(1), 'linear'),
    key(pc.id, K.x, s + life, +p1[0].toFixed(1), 'hold'), key(pc.id, K.y, s + life, +p1[1].toFixed(1), 'hold'),
    key(pc.id, K.r, s, ang + 90, 'linear'), key(pc.id, K.r, s + life, ang + 90 + spin, 'hold'),
    key(pc.id, K.sx, s, 100, 'hold'), key(pc.id, K.sx, s + Math.round(life * 0.4), 100, IN), key(pc.id, K.sx, s + life, 0, 'hold'),
    key(pc.id, K.sy, s, 100, 'hold'), key(pc.id, K.sy, s + Math.round(life * 0.4), 100, IN), key(pc.id, K.sy, s + life, 0, 'hold'));
  return keys;
}
const ringKeys = (ring, cx, cy, start, life, from = 65, to = 190, op = 80) => [
  ...(start ? [key(ring.id, K.op, 0, 0, 'hold')] : []), key(ring.id, K.x, 0, cx, 'hold'), key(ring.id, K.y, 0, cy, 'hold'),
  key(ring.id, K.sx, start, from, OUT), key(ring.id, K.sx, start + life, to, 'hold'), key(ring.id, K.sy, start, from, OUT), key(ring.id, K.sy, start + life, to, 'hold'),
  key(ring.id, K.op, start, op, 'linear'), key(ring.id, K.op, start + life, 0, 'hold')];
async function bindColor(vm, prop, pieces, store, hex) {
  if (store.bound) return;
  await vme('databind', { viewModelId: vm.id, bindings: pieces.map(pc => ({ objectId: pc.colorId, propertyKey: K.color, viewModelPropertyId: prop('color') })) });
  const inst = await vme('listViewModelInstances', { viewModelId: vm.id }); const pv = {};
  for (const i of inst.instances) { const c = i.viewModelProperties.find(x => x.name === 'color'); if (c) pv[c.id] = { 555: argb(hex) }; }
  await call('set_property_values', { propertyValues: pv });
  store.bound = true; save();
}
const focus = (ab) => call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
async function board(keyName, name, w, h) { const ab = ids[keyName]?.ab || await artboard(name, w, h); ids[keyName] = ids[keyName] || { ab, anims: {} }; save(); await focus(ab); return ab; }

async function frost() {
  const ab = await board('frost', 'FX Frost', 200, 200), S = ids.frost;
  if (!S.pieces) {
    S.pieces = await makePieces(ab, [{ name: 'ring', primitive: 'ellipse', w: 44, h: 44, color: PAL.ice, stroke: 4 },
      ...Array.from({ length: 8 }, (_, i) => ({ name: 'shard' + i, primitive: 'rectangle', w: i % 2 ? 5 : 7, h: i % 2 ? 13 : 9, r: 2, color: i % 3 === 0 ? PAL.iceSoft : PAL.ice })),
      ...Array.from({ length: 8 }, (_, i) => ({ name: 'flake' + i, primitive: 'ellipse', w: 5 + (i % 3), h: 5 + (i % 3), color: i % 2 ? PAL.iceSoft : PAL.ice }))]); save();
  }
  const [ring, ...rest] = S.pieces, shards = rest.slice(0, 8), flakes = rest.slice(8);
  await timeline(S.anims, 'idle', 6, []);
  for (const [vname, seed] of [['frost-a', 17], ['frost-b', 29]]) {
    const R = rng(seed), keys = [...ringKeys(ring, 100, 96, 0, 20)], off = R() * 45;
    shards.forEach((pc, i) => keys.push(...radialKeys(pc, 100, 96, off + i * 45 + (R() - 0.5) * 26, 44 + R() * 30, 22 + Math.floor(R() * 8), 0, Math.floor(R() * 3))));
    flakes.forEach(pc => keys.push(...bakePiece(pc, { x: 100 + (R() - 0.5) * 110, y: 60 + R() * 40, angle: -90 + (R() - 0.5) * 80, v0: 1.5 + R() * 2, decay: 0.92, fall: 0.9 + R() * 0.7,
      wobAmp: 5 + R() * 6, wobHz: 0.7 + R() * 0.6, wobPhase: R() * 6.28, start: 8 + Math.floor(R() * 16), life: 62 + Math.floor(R() * 26), rot0: 0, rotSpeed: 0, tumble: 0, fadeFrom: 0.55 }, 120)));
    await timeline(S.anims, vname, 114, keys);
  }
  save(); await wire(ab, 'FXFrost', { fire: ['frost-a', 'frost-b'] }); console.log('frost ready');
}
async function dust() {
  const ab = await board('dust', 'FX Dust', 200, 120), S = ids.dust;
  if (!S.pieces) { S.pieces = await makePieces(ab, Array.from({ length: 8 }, (_, i) => ({ name: 'puff' + i, primitive: 'ellipse', w: 14 + (i % 3) * 4, h: 14 + (i % 3) * 4, color: PAL.dust }))); save(); }
  await timeline(S.anims, 'idle', 6, []);
  for (const [vname, seed] of [['dust-a', 61], ['dust-b', 67]]) {
    const R = rng(seed), keys = [];
    S.pieces.forEach((pc, i) => { const side = i % 2 ? 1 : -1, dx = side * (26 + R() * 46), dy = -(4 + R() * 18), life = 18 + Math.floor(R() * 8), s = Math.floor(R() * 3), x0 = 100 + side * 8, y0 = 100;
      if (s) keys.push(key(pc.id, K.op, 0, 0, 'hold'));
      keys.push(key(pc.id, K.x, s, x0, OUT), key(pc.id, K.y, s, y0, OUT), key(pc.id, K.x, s + life, +(x0 + dx).toFixed(1), 'hold'), key(pc.id, K.y, s + life, +(y0 + dy).toFixed(1), 'hold'),
        key(pc.id, K.sx, s, 45, OUT), key(pc.id, K.sx, s + life, 125, 'hold'), key(pc.id, K.sy, s, 45, OUT), key(pc.id, K.sy, s + life, 125, 'hold'),
        key(pc.id, K.op, s, 85, 'linear'), key(pc.id, K.op, s + life, 0, 'hold')); });
    await timeline(S.anims, vname, 30, keys);
  }
  save(); await wire(ab, 'FXDust', { fire: ['dust-a', 'dust-b'] }); console.log('dust ready');
}
async function rings() {
  const ab = await board('rings', 'FX Rings', 240, 240), S = ids.rings;
  if (!S.pieces) { S.pieces = await makePieces(ab, [0, 1].map(i => ({ name: 'ring' + i, primitive: 'ellipse', w: 60, h: 60, color: PAL.gold, stroke: 5 }))); save(); }
  await timeline(S.anims, 'idle', 6, []);
  await timeline(S.anims, 'double', 40, [...ringKeys(S.pieces[0], 120, 120, 0, 24, 60, 330, 85), ...ringKeys(S.pieces[1], 120, 120, 9, 26, 60, 330, 70)]);
  save(); const { vm, prop } = await wire(ab, 'FXRings', { fire: ['double'] }, [{ name: 'color', propertyType: 'color' }]);
  await bindColor(vm, prop, S.pieces, S, PAL.gold); console.log('rings ready');
}
async function twinkle() {
  const ab = await board('twinkle', 'FX Twinkle', 240, 200), S = ids.twinkle;
  if (!S.pieces) { S.pieces = await makePieces(ab, Array.from({ length: 7 }, (_, i) => ({ name: 'tw' + i, primitive: 'star', w: 12 + (i % 3) * 5, h: 12 + (i % 3) * 5, points: 4, inner: 30, r: 1.5, color: PAL.gold }))); save(); }
  await timeline(S.anims, 'idle', 6, []);
  for (const [vname, seed] of [['twinkle-a', 83], ['twinkle-b', 89]]) {
    const R = rng(seed), keys = [];
    S.pieces.forEach((pc) => { const a = R() * 6.28, rad = 62 + R() * 34, x = 120 + Math.cos(a) * rad * 1.15, y = 100 + Math.sin(a) * rad * 0.8, s = Math.floor(R() * 78), life = 34 + Math.floor(R() * 16);
      keys.push(key(pc.id, K.x, 0, +x.toFixed(1), 'hold'), key(pc.id, K.y, 0, +y.toFixed(1), 'hold'), key(pc.id, K.op, 0, 100, 'hold'),
        ...(s ? [key(pc.id, K.sx, 0, 0, 'hold'), key(pc.id, K.sy, 0, 0, 'hold')] : []),
        key(pc.id, K.sx, s, 0, OUT), key(pc.id, K.sx, s + Math.round(life * 0.35), 100, IN), key(pc.id, K.sx, s + life, 0, 'hold'),
        key(pc.id, K.sy, s, 0, OUT), key(pc.id, K.sy, s + Math.round(life * 0.35), 100, IN), key(pc.id, K.sy, s + life, 0, 'hold'),
        key(pc.id, K.r, s, 0, 'linear'), key(pc.id, K.r, s + life, 60, 'hold')); });
    await timeline(S.anims, vname, 132, keys);
  }
  save(); const { vm, prop } = await wire(ab, 'FXTwinkle', { fire: ['twinkle-a', 'twinkle-b'] }, [{ name: 'color', propertyType: 'color' }]);
  await bindColor(vm, prop, S.pieces, S, PAL.gold); console.log('twinkle ready');
}

(async () => {
  const what = process.argv[2] || 'all';
  for (const [n, fn] of [['frost', frost], ['dust', dust], ['rings', rings], ['twinkle', twinkle]]) if (what === n || what === 'all') await fn();
})().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
