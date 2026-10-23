const FRAMES = ["REPLACE_ME"];
const dsCheck = (FRAME) => {
  const STEPS = { 34: [900], 26: [900], 20: [900], 16: [700, 900], 14: [700], 12: [900] };
  const ART = /^(Dombi|Waiter|Lesson picture|Icon|Pet|Glyph)\b/;
  const out = [];
  const add = (id, rule, detail) => out.push({ nodeId: id, rule, detail });
  const weight = (w) => (typeof w === "number" ? w : w === "bold" ? 700 : Number(w) || 400);
  const colours = (n) => {
    const l = [];
    const t = (f) => (Array.isArray(f) ? f.forEach(t) : typeof f === "string" ? l.push(f) : null);
    t(n.fill);
    if (n.stroke) t(n.stroke.fill || n.stroke);
    return l;
  };
  const root = Get(FRAME, { depth: 0 });
  if (root.width !== 390 && root.width !== 360) add(FRAME, "width", String(root.width));
  const comp = {};
  let dombi = 0;
  Get(FRAME, (n) => {
    if (n.type === "ref" && n.ref) {
      const k = Get(n.ref, { depth: 0 });
      const name = (k && k.name) || "";
      comp[n.id] = name;
      if (/^Dombi( guide)? \//.test(name)) dombi++;
    }
  });
  const owner = (id) => {
    const parts = id.split("/");
    for (let i = parts.length - 1; i >= 1; i--) if (comp[parts[i - 1]] !== undefined) return comp[parts[i - 1]];
    return comp[parts[0]];
  };
  let heroes = 0;
  Get(FRAME, (n, c) => {
    if (n.enabled === false) { c.skipChildren(); return; }
    const inside = n.id.includes("/");
    const art = inside && ART.test(owner(n.id) || "");
    if (n.type === "text") {
      const s = n.fontSize;
      if (typeof s === "number" && s < 12) add(n.id, "small-text", String(s));
      else if (typeof s === "number" && !(STEPS[s] || []).includes(weight(n.fontWeight))) add(n.id, "off-scale", s + "/" + n.fontWeight);
    }
    for (const col of colours(n)) {
      if (col.startsWith("#") && !/^#[0-9A-Fa-f]{6}00$/.test(col) && !art) add(n.id, "raw-colour", col);
      else if (col.startsWith("$") && !inside && !col.startsWith("$ds-") && !col.startsWith("$dombi-")) add(n.id, "old-variable", col);
      if (col === "$ds-reward" && n.type === "frame" && !inside) heroes++;
    }
  }, { resolveInstances: true });
  if (!dombi) add(FRAME, "no-dombi", "no Dombi instance");
  if (heroes > 1) add(FRAME, "two-heroes", String(heroes));
  return { frame: FRAME, name: root.name, total: out.length, violations: out.slice(0, 25) };
};
for (const f of FRAMES) Print(JSON.stringify(dsCheck(f)));
