// Dombi engine, stage 5: Duolingo-style mouth (smirk option A, picked 2026-10-10).
//  mouthLine  = one round-capped white stroke, 3 detached vertices (2 cubic segments)  -> smirk, happy, flat, waves
//  mouthShape = one closed white fill, 3 detached vertices                               -> laugh D, talk D, surprised o
// Every face/<mood> timeline keys all vertices of both paths + their opacity, so moods MORPH (the smirk bends into a
// smile; an open mouth grows out of the line) instead of swapping parts. Old bar parts (mouth/tickR/tickL/mouthO) are deleted.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');

const FACE = { x: 100, y: 104 };
const VK = { x: 24, y: 25, inRot: 84, inDist: 85, outRot: 86, outDist: 87 };
const OP = 18;
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });

// ---- geometry helpers (all in face-local space) ----
const L = ([x, y]) => [x - FACE.x, y - FACE.y];
const Lf = (f) => ({ verts: f.verts.map(L), c: f.c.map(L) });
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function split(p0, p1, p2, p3) {   // one cubic -> two cubics at t = 0.5
  const a = lerp(p0, p1, .5), b = lerp(p1, p2, .5), c = lerp(p2, p3, .5), d = lerp(a, b, .5), e = lerp(b, c, .5), m = lerp(d, e, .5);
  return [[p0, a, d, m], [m, e, c, p3]];
}
// vertices as {p, in, out} with absolute handle points
function lineVerts(spec) {
  const segs = spec.length === 1 ? split(...spec[0]) : spec;
  return [{ p: segs[0][0], in: segs[0][0], out: segs[0][1] }, { p: segs[0][3], in: segs[0][2], out: segs[1][1] }, { p: segs[1][3], in: segs[1][2], out: segs[1][3] }];
}
function polar(v, ref) {
  const h = (q) => [q[0] - v.p[0], q[1] - v.p[1]];
  const ang = (d, r) => { if (Math.hypot(...d) < 1e-6) return r ?? 0; let a = Math.atan2(d[1], d[0]) * 180 / Math.PI;
    if (r !== undefined) { while (a - r > 180) a -= 360; while (a - r < -180) a += 360; } return a; };
  const i = h(v.in), o = h(v.out);
  return { x: v.p[0], y: v.p[1], inRot: ang(i, ref && ref.inRot), inDist: Math.hypot(...i), outRot: ang(o, ref && ref.outRot), outDist: Math.hypot(...o) };
}
const collapse = (pt, n) => Array.from({ length: n }, () => ({ p: pt, in: pt, out: pt }));

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---- 1. create the two paths (start from non-mirrored geometry so every vertex is "detached") ----
  if (!ids.mouthLine) {
    // seed geometry with uneven, non-collinear handles so Rive makes every vertex CubicDetached (keys set real shapes)
    const lv = [{ p: [-12, 23], out: [-8, 25] }, { p: [2, 25], in: [-3, 28], out: [8, 20] }, { p: [18, 15], in: [13, 21] }];
    const fillSpec = Lf(MOUTHS.laugh.fill);
    const [a, b, c] = fillSpec.verts;
    const h = { c: [[a[0] + 4, a[1] - 2], [b[0] - 5, b[1] + 1], ...fillSpec.c.slice(2)] };  // no zero-length handles
    const r = await call('path_editor', { command: 'createShapes', data: { createShapes: { shapes: [
      { name: 'mouthShape', parentId: ids.face, x: 0, y: 0, paints: [{ paintType: 'fill', color: '#ffffffff' }],
        paths: [{ name: 'mouthShapePath', commands: [{ commandType: 'moveTo', x: a[0], y: a[1] },
          { commandType: 'cubicTo', control1X: h.c[0][0], control1Y: h.c[0][1], control2X: h.c[1][0], control2Y: h.c[1][1], endX: b[0], endY: b[1] },
          { commandType: 'cubicTo', control1X: h.c[2][0], control1Y: h.c[2][1], control2X: h.c[3][0], control2Y: h.c[3][1], endX: c[0], endY: c[1] },
          { commandType: 'cubicTo', control1X: h.c[4][0], control1Y: h.c[4][1], control2X: h.c[5][0], control2Y: h.c[5][1], endX: a[0], endY: a[1] },
          { commandType: 'close' }] }] },
      { name: 'mouthLine', parentId: ids.face, x: 0, y: 0, paints: [{ paintType: 'stroke', color: '#ffffffff' }],
        paths: [{ name: 'mouthLinePath', commands: [{ commandType: 'moveTo', x: lv[0].p[0], y: lv[0].p[1] },
          { commandType: 'cubicTo', control1X: lv[0].out[0], control1Y: lv[0].out[1], control2X: lv[1].in[0], control2Y: lv[1].in[1], endX: lv[1].p[0], endY: lv[1].p[1] },
          { commandType: 'cubicTo', control1X: lv[1].out[0], control1Y: lv[1].out[1], control2X: lv[2].in[0], control2Y: lv[2].in[1], endX: lv[2].p[0], endY: lv[2].p[1] }] }] },
    ] } } });
    const h2 = await call('get_artboard_hierarchy', { artboardId: ids.artboard, depth: 12 });
    const by = {}; for (const o of h2.objects) by[o.id] = o;
    for (const name of ['mouthLine', 'mouthShape']) {
      const shape = h2.objects.find(o => o.name === name && o.types.includes('Shape'));
      const pth = shape.children.map(c => by[c]).find(o => o.types.includes('PointsPath'));
      const paint = shape.children.map(c => by[c]).find(o => o.types.includes('Stroke') || o.types.includes('Fill'));
      ids[name] = { id: shape.id, path: pth.id, verts: pth.children.filter(c => by[c].types.some(t => /Vertex/.test(t))), paint: paint.id };
      const kinds = ids[name].verts.map(v => by[v].types[0]);
      if (kinds.some(k => k !== 'CubicDetachedVertex')) throw new Error(`${name} vertices not all detached: ${kinds}`);
    }
    // stroke: 7 px, round caps + joins
    await call('set_property_values', { propertyValues: { [ids.mouthLine.paint]: { 47: 7, 48: 1, 49: 1 }, [ids.mouthLine.path]: { 32: false } } });  // open path: no closing segment
    // draw order: mouth above the face's other parts is fine (only eyes/lids are in another group)
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }

  // ---- 2. per-mood vertex keys ----
  const ref = { line: lineVerts(MOUTHS.smirk.line.map(seg => seg.map(L))).map(v => polar(v)),
                shape: null };
  const shapeVerts = (f) => {   // closed fill: vertex i has in-handle from previous segment, out-handle into next
    const v = f.verts, c = f.c;
    return [{ p: v[0], in: c[5], out: c[0] }, { p: v[1], in: c[1], out: c[2] }, { p: v[2], in: c[3], out: c[4] }];
  };
  ref.shape = shapeVerts(Lf(MOUTHS.laugh.fill)).map(v => polar(v));
  const add = {};
  for (const [mood, m] of Object.entries(MOUTHS)) {
    const anim = mids.anims['face/' + mood]; if (!anim) continue;
    let lineV, shapeV, lineOp, shapeOp;
    if (m.line) {
      lineV = lineVerts(m.line.map(seg => seg.map(L)));
      shapeV = collapse(lineV[1].p, 3); lineOp = 100; shapeOp = 0;
    } else {
      const f = Lf(m.fill);
      shapeV = shapeVerts(f);
      const cx = (f.verts[0][0] + f.verts[1][0] + f.verts[2][0]) / 3, cy = (f.verts[0][1] + f.verts[1][1] + f.verts[2][1]) / 3;
      lineV = collapse([cx, cy], 3); lineOp = 0; shapeOp = 100;
    }
    const keys = [];
    const push = (obj, verts, refs) => verts.forEach((v, i) => { const pv = polar(v, refs[i]);
      for (const [k, pk] of Object.entries(VK)) keys.push({ objectId: obj.verts[i], propertyKey: pk, frame: 0, value: +pv[k].toFixed(3), interpolationType: 'hold' }); });
    push(ids.mouthLine, lineV, ref.line); push(ids.mouthShape, shapeV, ref.shape);
    keys.push({ objectId: ids.mouthLine.id, propertyKey: OP, frame: 0, value: lineOp, interpolationType: 'hold' },
              { objectId: ids.mouthShape.id, propertyKey: OP, frame: 0, value: shapeOp, interpolationType: 'hold' });
    add[mood] = [anim, keys];
  }
  for (const [mood, [anim, keys]] of Object.entries(add)) await ae('modifyKeyFrames', { animationId: anim, add: keys });
  // design-view (setup) pose = the smirk, so the editor doesn't show the seed geometry outside Animate mode
  const base = {}; for (const k of add.smirk[1]) (base[k.objectId] = base[k.objectId] || {})[k.propertyKey] = k.value;
  await call('set_property_values', { propertyValues: base });

  // ---- 3. delete the old bar mouth (its keys go with it) ----
  if (ids.mouthShapes) {
    await call('delete_objects', { objectIds: ids.mouthShapes.map(s => s.id) });
    ids.oldMouthDeleted = ids.mouthShapes.map(s => s.id); delete ids.mouthShapes;
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }
  console.log('mouth keyed for', Object.keys(add).length, 'moods');
}
module.exports = { L, Lf, lineVerts, polar, collapse, VK, OP };
if (require.main === module) main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
