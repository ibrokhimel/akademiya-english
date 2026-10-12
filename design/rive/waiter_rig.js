// Café waiters: builds the animatable rigs in the open Rive file (artboards "Waiter A" and "Waiter C"; B was dropped by the owner).
// Same drawings as design/icons/build_waiter.py, at 2x (192x192), split into named parts.
//   node waiter_rig.js rig a|c      -> artboard + parts (ids -> waiter_ids.json)
//   node waiter_rig.js capture a|c [name]
// Hierarchy:  root > torso, neck, head > (hairBack, ears, skull, hair, [cap], face > (brows, eyes, nose, mouth, [stache])), [tie]
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');

const IDS_FILE = path.join(__dirname, 'waiter_ids.json');
const all = fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')) : {};
const save = () => fs.writeFileSync(IDS_FILE, JSON.stringify(all, null, 1));
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };

const HAIR = '#3D3D3D', EYE = '#4B4B4B', WHITE = '#FFFFFF';
// absolute pivots (artboard px)
const PIV = { root: [96, 192], torso: [96, 192], head: [96, 124], face: [96, 80], eyes: [96, 76.5], brows: [96, 60.5],
              mouth: [97, 101], stache: [96, 98], tie: [96, 148], cap: [96, 38], hairBack: [96, 60] };

const CHARS = {
  a: { name: 'Waiter A', skin: '#FFB59F', shade: '#FA8E77', mouth: '#B5443A',
       torso: [{ p: 'rectangle', n: 'jacket', x: 96, y: 180, w: 136, h: 88, r: 44, c: EYE },
               { p: 'polygon', n: 'shirt', x: 96, y: 174.9, w: 60, h: 163.5, r: 6, rot: 180, c: WHITE }],
       hair: [{ p: 'rectangle', n: 'hairTop', x: 96, y: 36, w: 86, h: 32, tl: 16, tr: 16, bl: 4, br: 4, c: HAIR },
              { p: 'rectangle', n: 'sideL', x: 58.5, y: 55, w: 11, h: 26, r: 5.5, c: HAIR },
              { p: 'rectangle', n: 'sideR', x: 133.5, y: 55, w: 11, h: 26, r: 5.5, c: HAIR },
              { p: 'rectangle', n: 'hairShine', x: 108, y: 32, w: 48, h: 18, r: 9, rot: -5, c: '#555555' }],
       tie: [{ p: 'polygon', n: 'tieL', x: 81.33, y: 148, w: 30, h: 29.3, r: 4, rot: 90, c: '#FF4B4B' },
             { p: 'polygon', n: 'tieR', x: 110.67, y: 148, w: 30, h: 29.3, r: 4, rot: -90, c: '#FF4B4B' },
             { p: 'ellipse', n: 'tieKnot', x: 96, y: 148, w: 12.8, h: 12.8, c: '#FF4B4B' }] },
  c: { name: 'Waiter C', skin: '#E3A07F', shade: '#C0775A', mouth: '#8C432A', smallMouth: true,
       torso: [{ p: 'rectangle', n: 'shirt', x: 96, y: 180, w: 136, h: 88, r: 44, c: '#FFF3D6' },
               { p: 'rectangle', n: 'strapL', x: 75, y: 144, w: 8, h: 32, r: 4, c: '#43C000' },
               { p: 'rectangle', n: 'strapR', x: 117, y: 144, w: 8, h: 32, r: 4, c: '#43C000' },
               { p: 'rectangle', n: 'apron', x: 96, y: 186, w: 60, h: 60, r: 12, c: '#58CC02' },
               { p: 'rectangle', n: 'pocket', x: 96, y: 171.5, w: 24, h: 7, r: 3.5, c: '#89E219' }],
       hair: [{ p: 'rectangle', n: 'hairTop', x: 96, y: 43, w: 84, h: 14, r: 7, c: HAIR },
              { p: 'rectangle', n: 'sideL', x: 59.5, y: 54, w: 11, h: 24, r: 5.5, c: HAIR },
              { p: 'rectangle', n: 'sideR', x: 132.5, y: 54, w: 11, h: 24, r: 5.5, c: HAIR }],
       cap: [{ p: 'rectangle', n: 'doppi', x: 96, y: 27, w: 76, h: 30, r: 10, c: '#2B2B2B' },
             { p: 'rectangle', n: 'doppiBand', x: 96, y: 36.6, w: 76, h: 5.2, r: 2.6, c: WHITE },
             { p: 'ellipse', n: 'doppiDot1', x: 77, y: 23, w: 8, h: 8, c: WHITE },
             { p: 'ellipse', n: 'doppiDot2', x: 96, y: 21, w: 8, h: 8, c: WHITE },
             { p: 'ellipse', n: 'doppiDot3', x: 115, y: 23, w: 8, h: 8, c: WHITE }],
       stache: [{ p: 'rectangle', n: 'stacheL', x: 87, y: 98.5, w: 24, h: 11, r: 5.5, rot: 10, c: HAIR },
                { p: 'rectangle', n: 'stacheR', x: 105, y: 98.5, w: 24, h: 11, r: 5.5, rot: -10, c: HAIR }] },
};

async function group(name, parentId, abs, parentAbs) {
  const r = await call('group_editor', { name, parentId });
  const id = r.group.id;
  await call('set_property_values', { propertyValues: { [id]: { [K.x]: abs[0] - parentAbs[0], [K.y]: abs[1] - parentAbs[1] } } });
  return id;
}

// creates shapes under parentId; specs are in absolute artboard px, parentAbs = the parent's absolute origin
async function shapes(specs, parentId, parentAbs) {
  const list = specs.map(s => {
    const o = { primitive: s.p, name: s.n, parentId, x: s.x - parentAbs[0], y: s.y - parentAbs[1], width: s.w, height: s.h,
                paints: [{ paintType: 'fill', color: argb(s.c) }] };
    if (s.p === 'polygon') o.points = 3;
    if (s.r != null && s.p !== 'ellipse') o.cornerRadius = s.r;
    if (s.tl != null) Object.assign(o, { cornerRadiusTL: s.tl, cornerRadiusTR: s.tr, cornerRadiusBL: s.bl, cornerRadiusBR: s.br });
    return o;
  });
  const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: list } } });
  const made = r.shapes || r.created || r;
  const out = {}, pv = {};
  specs.forEach((s, i) => { const id = made[i].id || made[i]; out[s.n] = id; if (s.rot) pv[id] = { [K.r]: s.rot }; });
  if (Object.keys(pv).length) await call('set_property_values', { propertyValues: pv });
  return out;
}

async function rig(k) {
  const ch = CHARS[k];
  const ids = all[k] = { name: ch.name };
  const ab = (await call('open_file_editor', { command: 'createArtboard',
    data: { createArtboard: [{ name: ch.name, width: 192, height: 192, isComponent: true }] } })).artboards[0];
  ids.artboard = ab.id;
  const h = await call('get_artboard_hierarchy', { artboardId: ab.id, depth: 3 });
  const a = h.objects.find(o => o.id === ab.id);
  const fill = h.objects.find(o => a.children.includes(o.id) && o.types.includes('Fill'));
  const col = fill && h.objects.find(o => fill.children.includes(o.id));
  if (col) await call('set_property_values', { propertyValues: { [col.id]: { 37: '#00000000' } } });

  ids.root = await group('root', ab.id, PIV.root, [0, 0]);
  ids.torso = await group('torso', ids.root, PIV.torso, PIV.root);
  Object.assign(ids, await shapes(ch.torso, ids.torso, PIV.torso));
  Object.assign(ids, await shapes([{ p: 'rectangle', n: 'neck', x: 96, y: 130, w: 32, h: 44, r: 12, c: ch.shade }], ids.root, PIV.root));
  ids.head = await group('head', ids.root, PIV.head, PIV.root);
  if (ch.hairBack) {
    ids.hairBack = await group('hairBack', ids.head, PIV.hairBack, PIV.head);
    Object.assign(ids, await shapes(ch.hairBack, ids.hairBack, PIV.hairBack));
  }
  Object.assign(ids, await shapes([
    { p: 'ellipse', n: 'earL', x: 56, y: 80, w: 22, h: 22, c: ch.skin }, { p: 'ellipse', n: 'earR', x: 136, y: 80, w: 22, h: 22, c: ch.skin },
    { p: 'rectangle', n: 'skull', x: 96, y: 78, w: 80, h: 92, r: 40, c: ch.skin }], ids.head, PIV.head));
  Object.assign(ids, await shapes(ch.hair, ids.head, PIV.head));
  if (ch.cap) {
    ids.cap = await group('cap', ids.head, PIV.cap, PIV.head);
    Object.assign(ids, await shapes(ch.cap, ids.cap, PIV.cap));
  }
  ids.face = await group('face', ids.head, PIV.face, PIV.head);
  ids.brows = await group('brows', ids.face, PIV.brows, PIV.face);
  Object.assign(ids, await shapes([
    { p: 'rectangle', n: 'browL', x: 82.5, y: 60.5, w: 17, h: 5.6, r: 2.8, rot: -6, c: HAIR },
    { p: 'rectangle', n: 'browR', x: 109.5, y: 60.5, w: 17, h: 5.6, r: 2.8, rot: 6, c: HAIR }], ids.brows, PIV.brows));
  ids.eyes = await group('eyes', ids.face, PIV.eyes, PIV.face);
  Object.assign(ids, await shapes([
    { p: 'rectangle', n: 'eyeL', x: 82, y: 76.5, w: 10, h: 17, r: 5, c: EYE },
    { p: 'rectangle', n: 'eyeR', x: 110, y: 76.5, w: 10, h: 17, r: 5, c: EYE }], ids.eyes, PIV.eyes));
  // mouth = dark ellipse + skin-coloured cover above it -> a smile crescent; talking moves/resizes both
  const mp = ch.smallMouth ? [97, 109] : PIV.mouth;
  ids.mouth = await group('mouth', ids.face, mp, PIV.face);
  const m = ch.smallMouth ? { w: 22, h: 12, cw: 26, ch: 11, cy: -2.5 } : { w: 32, h: 20, cw: 36, ch: 17, cy: -4 };
  Object.assign(ids, await shapes([
    { p: 'ellipse', n: 'mouthShape', x: mp[0], y: mp[1], w: m.w, h: m.h, c: ch.mouth },
    { p: 'ellipse', n: 'mouthCover', x: mp[0], y: mp[1] + m.cy, w: m.cw, h: m.ch, c: ch.skin }], ids.mouth, mp));
  if (!ch.smallMouth) await call('set_property_values', { propertyValues: { [ids.mouth]: { [K.r]: -4 } } });
  Object.assign(ids, await shapes([{ p: 'rectangle', n: 'nose', x: 96, y: 87, w: 8, h: 14, r: 4, c: ch.shade }], ids.face, PIV.face));
  if (ch.stache) {
    ids.stache = await group('stache', ids.face, PIV.stache, PIV.face);
    Object.assign(ids, await shapes(ch.stache, ids.stache, PIV.stache));
  }
  if (ch.tie) {
    ids.tie = await group('tie', ids.root, PIV.tie, PIV.root);
    Object.assign(ids, await shapes(ch.tie, ids.tie, PIV.tie));
  }
  await paths(k);
  save();
  console.log(ch.name, 'rig ready:', Object.keys(ids).length, 'ids');
}

// the parametric path (Rectangle / Ellipse / Polygon) under each shape holds width (20) and height (21)
async function paths(k) {
  const ids = all[k];
  const h = await call('get_artboard_hierarchy', { artboardId: ids.artboard, depth: 8 });
  const by = {}; for (const o of h.objects) by[o.id] = o;
  ids.path = {}; ids.color = {};
  for (const [n, id] of Object.entries(ids)) {
    const o = typeof id === 'string' && by[id];
    if (!o || !o.types.includes('Shape')) continue;
    const kids = (o.children || []).map(c => by[c]).filter(Boolean);
    const pth = kids.find(c => c.types.some(t => /Rectangle|Ellipse|Polygon|Triangle/.test(t)));
    const fill = kids.find(c => c.types.includes('Fill'));
    if (pth) ids.path[n] = pth.id;
    if (fill && fill.children && fill.children[0]) ids.color[n] = fill.children[0];
  }
  save();
  return ids;
}

async function capture(k, name) {
  const r = await call('capture_artboard', { artboardId: all[k].artboard, longEdge: 384 });
  const dir = path.join(__dirname, 'captures'); fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `waiter-${k}-${name || 'rig'}.png`);
  fs.writeFileSync(f, Buffer.from(r.image, 'base64'));
  console.log(f);
}

module.exports = { all, save, call, K, PIV, CHARS, paths };
if (require.main === module) {
  const [cmd, k, n] = process.argv.slice(2);
  ({ rig, capture, paths })[cmd](k, n).catch(e => { console.log('FAIL', e.message); process.exit(1); });
}
