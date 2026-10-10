// Emits a Pencil `execute` snippet that builds native "Dombi / 150 / <expression>" components from dombi_rig.js.
// Pencil rotates around the node's top-left corner, counter-clockwise; SVG/rig rotation is clockwise around the centre.
// Run: node dombi_pencil.js > snippet.js
const { C, EXPR, POSES, pose } = require('./dombi_rig');
const S = 0.75, r2 = (n) => +n.toFixed(2);

function rotPt(x, y, cx, cy, deg) {
  const a = deg * Math.PI / 180, dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}
function rect(cx, cy, w, h, r, rot, fill) {  // world centre + clockwise rotation -> Pencil rectangle
  const [x, y] = rotPt(cx - w / 2, cy - h / 2, cx, cy, rot);
  const n = { type: 'rectangle', x: r2(x * S), y: r2(y * S), width: r2(w * S), height: r2(h * S), cornerRadius: r2(r * S), fill };
  if (rot) n.rotation = r2(-rot);
  return n;
}
const circ = (cx, cy, r, fill) => ({ type: 'ellipse', x: r2((cx - r) * S), y: r2((cy - r) * S), width: r2(2 * r * S), height: r2(2 * r * S), fill });

function nodes(P) {
  const out = [circ(100, 108, 66, '$dombi-edge'), circ(100, 104, 66, '$dombi-body')];
  const F = P.face;
  const part = (k, fill) => {
    const p = P[k]; if (!p.op) return;
    let [cx, cy] = rotPt(p.cx, p.cy, 100, 104, F.rot);
    out.push(rect(cx + F.dx, cy + F.dy, p.w, p.h, p.r, p.rot + F.rot, fill));
  };
  ['eyeL', 'eyeR'].forEach(k => part(k, '#FFFFFF'));
  ['lidL', 'lidR'].forEach(k => part(k, '$dombi-body'));
  ['mouth', 'tickR', 'tickL', 'mouthO'].forEach(k => part(k, '#FFFFFF'));
  for (const k of ['handL', 'handR']) {
    const h = P[k]; if (!h.s) continue;
    out.push(circ(h.cx, h.cy + 3, 14 * h.s, '$dombi-edge'), circ(h.cx, h.cy, 14 * h.s, '$dombi-hand'));
  }
  for (const k of ['z1', 'z2']) {  // same geometry as zee() in dombi_rig.js
    const z = P[k]; if (!z.s || !z.op) continue;
    const s = z.s, w = 16 * s, t = 4.5 * s;
    out.push(rect(z.cx, z.cy - 9 * s + t / 2, w, t, t / 2, 0, '$dombi-hand'),
      rect(z.cx, z.cy + 9 * s - t / 2, w, t, t / 2, 0, '$dombi-hand'),
      rect(z.cx, z.cy, t, 20 * s, t / 2, 42, '$dombi-hand'));
  }
  return out;
}

const names = [...Object.keys(EXPR), ...Object.keys(POSES).map(n => 'pose-' + n)];
const comps = names.map(n => ({ name: n, children: nodes(pose(n.replace('pose-', ''))) }));
console.log(`const COMPS = ${JSON.stringify(comps)};`);
console.log(`
const board = "FOFel";
const head = Insert(board, {type:"frame", name:"Expressions header", layout:"vertical", gap:4, children:[
  {type:"text", fill:"$text", content:"Dombi · expressions", fontFamily:"$font", fontSize:28, fontWeight:"900"},
  {type:"text", fill:"$text-muted", content:"Static faces from design/icons/dombi_rig.js (same source as Rive dombi/*). Cool, never sad.", fontFamily:"$font", fontSize:16, fontWeight:"700"}]});
const grid = Insert(board, {type:"frame", name:"Dombi expressions", layout:"vertical", fill:"#FFFFFF", cornerRadius:28, gap:24, padding:24});
let row;
COMPS.forEach((c, i) => {
  if (i % 6 === 0) row = Insert(grid, {type:"frame", name:"Row " + (i / 6 + 1), layout:"horizontal", gap:24});
  const cell = Insert(row, {type:"frame", name:c.name, layout:"vertical", gap:8, alignItems:"center", width:170, padding:10, fill:"#EFEBFF", cornerRadius:22});
  Insert(cell, {type:"frame", name:"Dombi / 150 / " + c.name, reusable:true, width:150, height:150, layout:"none", children:c.children});
  Insert(cell, {type:"text", fill:"$text-muted", content:c.name, fontFamily:"$font", fontSize:15, fontWeight:"800"});
});
Print(grid);`);
