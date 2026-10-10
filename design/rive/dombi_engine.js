// Dombi engine: builds the animatable Dombi rig in the open Rive file, from design/icons/dombi_rig.js.
// Stages:  node dombi_engine.js rig        -> artboard "Dombi" + native named parts  (ids -> dombi_ids.json)
//          node dombi_engine.js capture [name] -> PNG of the artboard into ./captures
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const { C, BASE } = require('../icons/dombi_rig');

const IDS_FILE = path.join(__dirname, 'dombi_ids.json');
const ids = fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')) : {};
const save = () => fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 1));
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();

// Rig geometry. Root sits at the bottom-centre of the body (100,170) so scale = squash from the floor.
const ROOT = { x: 100, y: 170 };
const FACE = { x: 100, y: 104 };            // face pivot (tilt) = body centre
const EYES_Y = 95;                           // eyes group pivot (blink scaleY, gaze x/y)

async function shapes(list) {
  const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: list } } });
  const out = r.shapes || r.created || r;
  return out;
}
async function group(name, parentId, x, y) {
  const r = await call('group_editor', { name, parentId, x, y });
  const id = r.group.id;  // group_editor ignores x/y -> set them explicitly
  await call('set_property_values', { propertyValues: { [id]: { 13: x, 14: y } } });
  return id;
}

async function rig() {
  const ab = (await call('open_file_editor', { command: 'createArtboard',
    data: { createArtboard: [{ name: 'Dombi', width: 200, height: 200, isComponent: true }] } })).artboards[0];
  ids.artboard = ab.id;
  // transparent background
  const h = await call('get_artboard_hierarchy', { artboardId: ab.id, depth: 3 });
  const a = h.objects.find(o => o.id === ab.id);
  const fill = h.objects.find(o => a.children.includes(o.id) && o.types.includes('Fill'));
  const col = fill && h.objects.find(o => fill.children.includes(o.id));
  if (col) await call('set_property_values', { propertyValues: { [col.id]: { 37: '#00000000' } } });

  ids.root = await group('root', ab.id, ROOT.x, ROOT.y);
  ids.squash = await group('squash', ids.root, 0, 0);
  const body = await shapes([
    { primitive: 'ellipse', name: 'bodyEdge', parentId: ids.squash, x: 0, y: 108 - ROOT.y, width: 132, height: 132, paints: [{ paintType: 'fill', color: argb(C.edge) }] },
    { primitive: 'ellipse', name: 'body', parentId: ids.squash, x: 0, y: 104 - ROOT.y, width: 132, height: 132, paints: [{ paintType: 'fill', color: argb(C.body) }] },
  ]);
  ids.bodyShapes = body;
  ids.face = await group('face', ids.squash, FACE.x - ROOT.x, FACE.y - ROOT.y);
  ids.eyes = await group('eyes', ids.face, 0, EYES_Y - FACE.y);
  const ex = (p) => p.cx - FACE.x, eyY = (p) => p.cy - EYES_Y, fy = (p) => p.cy - FACE.y;
  const rect = (name, p, parentId, y, color) => ({ primitive: 'rectangle', name, parentId, x: ex(p), y,
    width: p.w, height: p.h, cornerRadius: p.r, paints: [{ paintType: 'fill', color: argb(color) }] });
  ids.eyeShapes = await shapes([
    rect('eyeL', BASE.eyeL, ids.eyes, eyY(BASE.eyeL), C.eye), rect('eyeR', BASE.eyeR, ids.eyes, eyY(BASE.eyeR), C.eye),
    rect('lidL', BASE.lidL, ids.eyes, eyY(BASE.lidL), C.body), rect('lidR', BASE.lidR, ids.eyes, eyY(BASE.lidR), C.body),
  ]);
  ids.mouthShapes = await shapes(['mouth', 'tickR', 'tickL', 'mouthO'].map(k => rect(k, BASE[k], ids.face, fy(BASE[k]), C.eye)));
  for (const k of ['handL', 'handR']) {
    const p = BASE[k];
    ids[k] = await group(k, ids.root, p.cx - ROOT.x, p.cy - ROOT.y);
    ids[k + 'Shapes'] = await shapes([
      { primitive: 'ellipse', name: k + 'Edge', parentId: ids[k], x: 0, y: 3, width: 28, height: 28, paints: [{ paintType: 'fill', color: argb(C.edge) }] },
      { primitive: 'ellipse', name: k + 'Fill', parentId: ids[k], x: 0, y: 0, width: 28, height: 28, paints: [{ paintType: 'fill', color: argb(C.hand) }] },
    ]);
  }
  for (const k of ['z1', 'z2']) {
    const p = BASE[k];
    ids[k] = await group(k, ab.id, p.cx, p.cy);
    const w = 16, t = 4.5;
    ids[k + 'Shapes'] = await shapes([
      { primitive: 'rectangle', name: k + 'Top', parentId: ids[k], x: 0, y: -9 + t / 2, width: w, height: t, cornerRadius: t / 2, paints: [{ paintType: 'fill', color: argb(C.hand) }] },
      { primitive: 'rectangle', name: k + 'Bottom', parentId: ids[k], x: 0, y: 9 - t / 2, width: w, height: t, cornerRadius: t / 2, paints: [{ paintType: 'fill', color: argb(C.hand) }] },
      { primitive: 'rectangle', name: k + 'Diag', parentId: ids[k], x: 0, y: 0, width: t, height: 20, cornerRadius: t / 2, paints: [{ paintType: 'fill', color: argb(C.hand) }] },
    ]);
  }
  save();
  console.log(JSON.stringify(ids, null, 1));
}

async function capture(name = 'rig') {
  const r = await call('capture_artboard', { artboardId: ids.artboard, longEdge: 400 });
  const dir = path.join(__dirname, 'captures'); fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${name}.png`);
  fs.writeFileSync(f, Buffer.from(r.image, 'base64'));
  console.log(f);
}

module.exports = { ids, save, call, ROOT, FACE, EYES_Y };
if (require.main === module) {
  const [cmd, a] = process.argv.slice(2);
  ({ rig, capture })[cmd](a).catch(e => { console.log('FAIL', e.message); process.exit(1); });
}
