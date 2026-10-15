// Lesson pictures as PNGs for the design file and the lab, and one sheet to look at them all.
//   node lesson_png.js            every lesson/<name>.svg whose PNG is missing or older -> pendev/icons-r2/lesson-<name>.png (512 px, transparent)
//   node lesson_png.js --all      render every picture again
// Always writes lesson-sheet.png: all pictures on the light and on the dark picture tile, with their names.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'lesson'), OUT = path.join(__dirname, '..', '..', 'pendev', 'icons-r2'), SIZE = 512;
(async () => {
  const names = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
  const read = (n) => fs.readFileSync(path.join(SRC, n + '.svg'), 'utf8');
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: SIZE, height: SIZE } });
  let made = 0;
  for (const n of names) {
    const out = path.join(OUT, `lesson-${n}.png`), old = fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(path.join(SRC, n + '.svg')).mtimeMs;
    if (old && !process.argv.includes('--all')) continue;
    await p.setContent(`<html><body style="margin:0;background:transparent">${read(n).replace(/width="\d+" height="\d+"/, `width="${SIZE}" height="${SIZE}"`)}</body></html>`);
    await (await p.$('svg')).screenshot({ path: out, omitBackground: true }); made++;
  }
  // the sheet: the tile colours of the lab (card and its border, light and dark)
  const tile = (n, dark) => `<div style="width:142px;text-align:center;font:700 12px system-ui;color:${dark ? '#B7B7C4' : '#6E6E82'}"><div style="height:120px;border-radius:18px;border:2px solid ${dark ? '#34343B' : '#E5E5E5'};background:${dark ? '#1B1B1F' : '#FFFFFF'};display:grid;place-items:center">${read(n)}</div><div style="margin:5px 0 10px">${n}</div></div>`;
  const half = (dark) => `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px;background:${dark ? '#121214' : '#F1F0F7'}">${names.map((n) => tile(n, dark)).join('')}</div>`;
  await p.setViewportSize({ width: 1232, height: 800 });
  await p.setContent(`<html><body style="margin:0">${half(false)}${half(true)}</body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'lesson-sheet.png'), fullPage: true });
  await b.close(); console.log(`${made} PNG rendered of ${names.length} pictures; sheet: lesson-sheet.png`);
})();
