// Dombi engine, stage 3 (prep for hand-animating in the editor):
//  - shoulder pivots armL/armR (rotate the arm = the hand swings on an arc), hands parented under them
//  - arms drawn BEHIND the body; hidden = tucked behind the body at the shoulder (no more scale pop)
//  - handRFront: a twin drawn IN FRONT, used by the thinking pose (hand swaps from behind to in front)
//  - hands/* timelines rebuilt: hand slides out from behind the body to its pose (simple placeholder motion)
//  - face/* timelines lengthened to 15 frames so there is room to animate each mood's entrance
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const { C, POSES, pose } = require('../icons/dombi_rig');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');

const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18 };
const ROOT = { x: 100, y: 170 };
const SHOULDER = { handL: { x: 62, y: 128 }, handR: { x: 138, y: 128 } };   // inside the body -> hidden behind it
const OUT = { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 };                          // fast out, soft landing
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const key = (objectId, propertyKey, frame, value, cubic) =>
  ({ objectId, propertyKey, frame, value, interpolationType: cubic ? 'cubic' : 'hold', ...(cubic ? { cubicParams: cubic } : {}) });

async function group(name, parentId, x, y) {
  const r = await call('group_editor', { name, parentId });
  await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: x, [K.y]: y } } });
  return r.group.id;
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---- rig: shoulders + front twin ----
  if (!ids.armL) {
    for (const h of ['handL', 'handR']) {
      const arm = 'arm' + h.slice(-1);
      ids[arm] = await group(arm, ids.root, SHOULDER[h].x - ROOT.x, SHOULDER[h].y - ROOT.y);
      await call('reparent_objects', { operations: [{ objectId: ids[h], newParentId: ids[arm] }] });
      await call('set_property_values', { propertyValues: { [ids[h]]: { [K.x]: 0, [K.y]: 0, [K.sx]: 100, [K.sy]: 100 } } });
      await call('reorder_objects', { operations: [{ objectId: ids[arm], order: 'sendToBack' }] });
    }
    ids.handRFront = await group('handRFront', ids.root, 0, 0);
    ids.handRFrontShapes = (await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      { primitive: 'ellipse', name: 'handRFrontEdge', parentId: ids.handRFront, x: 0, y: 3, width: 28, height: 28, paints: [{ paintType: 'fill', color: argb(C.edge) }] },
      { primitive: 'ellipse', name: 'handRFrontFill', parentId: ids.handRFront, x: 0, y: 0, width: 28, height: 28, paints: [{ paintType: 'fill', color: argb(C.hand) }] },
    ] } } })).shapes;
    await call('reorder_objects', { operations: [{ objectId: ids.handRFront, order: 'sendToFront' }] });
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }

  // ---- hands timelines: wipe and rebuild ----
  const handIds = [ids.armL, ids.armR, ids.handL, ids.handR, ids.handRFront];
  const rel = (h, P) => ({ x: P[h].cx - SHOULDER[h].x, y: P[h].cy - SHOULDER[h].y });
  // every hand timeline keys ALL hand parts at frame 0 (no leaks); hidden = (0,0) at the shoulder, behind the body
  const base = (f = 0) => [
    key(ids.armL, K.r, f, 0), key(ids.armR, K.r, f, 0),
    ...['handL', 'handR'].flatMap(h => [key(ids[h], K.x, f, 0), key(ids[h], K.y, f, 0), key(ids[h], K.sx, f, 100), key(ids[h], K.sy, f, 100)]),
    key(ids.handRFront, K.x, f, 0), key(ids.handRFront, K.y, f, 0), key(ids.handRFront, K.sx, f, 0), key(ids.handRFront, K.sy, f, 0)];
  const plan = { 'hands/none': [6, base()] };
  for (const g of Object.keys(POSES)) {
    const P = pose(g), add = base().map(k => ({ ...k }));
    if (g === 'thinking') {
      // reach out from behind to the side (0-9), swap to the front twin (9), front twin slides in to the chin (9-18)
      const side = { x: 178 - SHOULDER.handR.x, y: 150 - SHOULDER.handR.y };
      add.find(k => k.objectId === ids.handR && k.propertyKey === K.x).interpolationType = 'cubic';
      add.push(key(ids.handR, K.x, 0, 0, OUT), key(ids.handR, K.y, 0, 0, OUT), key(ids.handR, K.x, 9, side.x), key(ids.handR, K.y, 9, side.y),
        key(ids.handR, K.x, 10, 0), key(ids.handR, K.y, 10, 0),
        key(ids.handRFront, K.x, 9, 178 - ROOT.x), key(ids.handRFront, K.y, 9, 150 - ROOT.y), key(ids.handRFront, K.sx, 9, 100), key(ids.handRFront, K.sy, 9, 100),
        key(ids.handRFront, K.x, 10, 178 - ROOT.x, OUT), key(ids.handRFront, K.y, 10, 150 - ROOT.y, OUT),
        key(ids.handRFront, K.x, 20, P.handR.cx - ROOT.x), key(ids.handRFront, K.y, 20, P.handR.cy - ROOT.y));
      plan['hands/' + g] = [20, dedupe(add)];
      continue;
    }
    for (const h of ['handL', 'handR']) {
      if (!P[h].s) continue;
      const t = rel(h, P);
      add.push(key(ids[h], K.x, 0, 0, OUT), key(ids[h], K.y, 0, 0, OUT), key(ids[h], K.x, 12, t.x), key(ids[h], K.y, 12, t.y));
    }
    plan['hands/' + g] = [12, dedupe(add)];
  }
  function dedupe(list) {  // later keys win on the same object/prop/frame
    const m = new Map(); for (const k of list) m.set(`${k.objectId}|${k.propertyKey}|${k.frame}`, k); return [...m.values()];
  }
  const q = await ae('queryKeyFrames', { animationIds: Object.keys(plan).map(n => mids.anims[n]) });
  fs.writeFileSync(path.join(__dirname, 'prep_keys_before.json'), JSON.stringify(q).slice(0, 200000));
  for (const [name, [frames, add]] of Object.entries(plan)) {
    const id = mids.anims[name];
    const old = (q.keyframes[id] || []).map(k => k.keyframeId);
    if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old });
    await call('set_property_values', { propertyValues: { [id]: { 57: frames } } });
    await ae('modifyKeyFrames', { animationId: id, add });
    console.log(name, 'deleted', old.length, 'added', add.length);
  }

  // ---- face timelines: room to animate entrances ----
  const pv = {};
  for (const [n, id] of Object.entries(mids.anims)) if (n.startsWith('face/')) pv[id] = { 57: 15 };
  await call('set_property_values', { propertyValues: pv });
  console.log('face timelines -> 15 frames');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
