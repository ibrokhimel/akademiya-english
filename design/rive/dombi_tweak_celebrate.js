// Tweak of the owner's hands/celebrate (2026-10-10), keeping their beats (squat f0-8, jump to f31, hang to f37,
// land + lean f62, pump, second pop f91-102):
//  - new group `act` (root -> act -> lean): gesture-owned body motion; root stays with the Sway layer
//  - their root x/y/r keys move to act as offsets from rest; squat/landing become squash (feet stay on the floor)
//  - jump easing: fast up / soft top (ease-out), soft top / fast down (ease-in); lean -15° -> -8°
//  - ends home (act 0,0,0) with a landing squash; left hand trails the right by 3 frames instead of 15
//  - every hands/* timeline keys act neutral at frame 0 (no leaks)
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const key = (objectId, propertyKey, frame, value, c = SINE) => ({ objectId, propertyKey, frame, value, interpolationType: 'cubic', cubicParams: c });

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  if (!ids.act) {
    const r = await call('group_editor', { name: 'act', parentId: ids.root });
    ids.act = r.group.id;
    await call('set_property_values', { propertyValues: { [ids.act]: { [K.x]: 0, [K.y]: 0 } } });
    await call('reparent_objects', { operations: [{ objectId: ids.lean, newParentId: ids.act }] });
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }
  const cel = mids.anims['hands/celebrate'];
  const q = await ae('queryKeyFrames', { animationIds: [cel] });
  const ks = q.keyframes[cel];

  // 1. remove the root keys (moved to act below)
  const rootKeys = ks.filter(k => k.objectId === ids.root).map(k => k.keyframeId);
  if (rootKeys.length) await ae('modifyKeyFrames', { animationId: cel, delete: rootKeys });

  // 2. left hand: first rise f11->f31 becomes f3->f19 (3-frame lag behind the right hand)
  const change = ks.filter(k => k.objectId === ids.handL && (k.frame === 11 || k.frame === 31))
    .map(k => ({ keyframeId: k.keyframeId, frame: k.frame === 11 ? 3 : 19 }));
  if (change.length) await ae('modifyKeyFrames', { animationId: cel, change });

  // 3. body acting on act (offsets from rest; y negative = up)
  const A = ids.act, add = [
    // y: squat stays on the floor (squash does it), jump up fast, hang, drop fast, small second pop, land home
    key(A, K.y, 0, 0), key(A, K.y, 8, 0, OUT), key(A, K.y, 31, -19), key(A, K.y, 37, -19, IN), key(A, K.y, 60, 0),
    key(A, K.y, 84, 0, OUT), key(A, K.y, 98, -7), key(A, K.y, 104, -7, IN), key(A, K.y, 114, 0), key(A, K.y, 128, 0),
    // x: their sideways drift, smaller at the end and back to centre
    key(A, K.x, 0, 0), key(A, K.x, 31, -6.8), key(A, K.x, 37, -6.8), key(A, K.x, 62, 10), key(A, K.x, 91, -2.5), key(A, K.x, 104, -4), key(A, K.x, 120, 0),
    // r: their tilts, lean on landing reduced to -8°
    key(A, K.r, 0, 0), key(A, K.r, 8, 0), key(A, K.r, 31, 6.6), key(A, K.r, 44, 6.6), key(A, K.r, 62, -8), key(A, K.r, 86, 2.2), key(A, K.r, 104, 5), key(A, K.r, 120, 0),
    // squash & stretch from the feet (area kept: sx ≈ 1/sy)
    ...[[0, 100, 100], [8, 108, 92], [14, 95, 106], [24, 100, 100], [37, 100, 100], [60, 108, 92], [68, 97, 103], [76, 100, 100],
        [84, 104, 96], [90, 97, 103], [98, 100, 100], [114, 106, 94], [121, 99, 101], [128, 100, 100]]
      .flatMap(([f, sx, sy]) => [key(A, K.sx, f, sx), key(A, K.sy, f, sy)]),
  ];
  await ae('modifyKeyFrames', { animationId: cel, add });

  // 4. act neutral at frame 0 in every other hands/* timeline
  for (const n of ['hands/none', 'hands/wave', 'hands/thinking', 'hands/point']) {
    const id = mids.anims[n];
    await ae('modifyKeyFrames', { animationId: id, add: [K.x, K.y, K.r].map(p => key(A, p, 0, 0)).concat([key(A, K.sx, 0, 100), key(A, K.sy, 0, 100)]) });
  }
  // 5. design-view rest pose
  await call('set_property_values', { propertyValues: { [ids.root]: { [K.x]: 100, [K.y]: 170, [K.r]: 0 }, [A]: { [K.x]: 0, [K.y]: 0, [K.r]: 0, [K.sx]: 100, [K.sy]: 100 } } });
  console.log('celebrate tweaked: removed', rootKeys.length, 'root keys, moved', change.length, 'left-hand keys, added', add.length, 'act keys');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
