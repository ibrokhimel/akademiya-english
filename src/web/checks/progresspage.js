// Pictures of the Progress tab pages (24, 25, 26), with data and empty, light and dark, plus a back tap.
//   node progresspage.js        (needs the lab's server: node design/motion/serve.js)
const path = require('path'), fs = require('fs'); const { chromium } = require('playwright');
const OUT = path.join(__dirname, 'shots-pg'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(), errors = [];
  const runs = [['24', 'full', 0, 0], ['24', 'full', 0, 1], ['24', 'empty', 0, 0], ['25', 'full', 0, 0], ['25', 'empty', 0, 0], ['26', 'full', 0, 0], ['26', 'full', 0, 1]];
  for (const dark of [0, 1]) for (const [page, data, , today] of runs) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(`http://127.0.0.1:8791/src/web/checks/progresspage.html?page=${page}&data=${data}&dark=${dark}&today=${today}`); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
    await p.waitForTimeout(1800); const name = `p${page}-${data}${today ? '-today' : ''}${dark ? '-dark' : ''}`; await p.screenshot({ path: path.join(OUT, name + '.png') });
    if (page === '24' && data === 'full' && !dark && !today) {                                // taps: see all opens 25, back closes it; the streak card opens 26
      await p.click('.pg24 .all'); await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, 'p24-to-25.png') });
      await p.click('.pg25 .back'); await p.waitForTimeout(600); console.log('25 closed:', await p.locator('.pg25').count() === 0);
      await p.click('.pg24 .scard'); await p.waitForTimeout(1200); console.log('26 open:', await p.locator('.pg26').count() === 1);
      console.log('no earlier month to go to:', await p.locator('.pg26 .prev.off').count() === 1); await p.click('.pg26 .x'); await p.waitForTimeout(600); console.log('26 closed:', await p.locator('.pg26').count() === 0); }
    await p.close();
  }
  console.log(errors.length ? 'PAGE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors'); await b.close();
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
