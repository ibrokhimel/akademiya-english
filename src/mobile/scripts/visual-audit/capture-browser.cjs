const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const cases = require('../../src/audit/cases.json');
const phase = process.env.AUDIT_PHASE || 'before';
const viewportHeight = Number(process.env.AUDIT_HEIGHT || 844);
const out = path.resolve(__dirname, '../../.expo/visual-parity', phase, 'browser');
fs.mkdirSync(out, { recursive: true });
const selected = process.argv.slice(2);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function tap(page, selector) {
  const el = page.locator(selector).first();
  if (!await el.count()) throw new Error('Missing selector ' + selector);
  const box = await el.boundingBox();
  if (!box) throw new Error('Hidden selector ' + selector);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await sleep(45); await page.mouse.up();
}
async function applyState(page, entry) {
  const c = entry.native;
  if (c.selected && c.kind === 'onboarding') await tap(page, c.step === 2 ? '.gopt[data-k="ielts"]' : c.step === 3 ? '.gopt[data-k="new"]' : '.gopt >> nth=' + (c.selected - 1));
  if (c.kind === 'account' && c.populated) await page.locator('.namefield').fill('Ibrokhim');
  if (c.mode === 'login' && c.action === 'provider') await tap(page, '.signin');
  if (c.panel === 'goal') await tap(page, '[data-a="goal"]');
  if (c.panel === 'reminder' || c.control === 'time-wheel') await tap(page, '[data-a="reminder"]');
  if (c.panel === 'lesson' || c.panel === 'checkpoint') { await page.evaluate(()=>{const p=document.querySelector('.path');if(p)p.scrollTop=0;});await tap(page, c.panel === 'lesson' ? '[data-id="l1"]' : '[data-id="c1"]'); }
  if (c.scroll) await page.evaluate(where => {
    const el = document.querySelector('.pf-scroll,.pf-body,.pg24,.pgbody,.pg24-scroll,.path');
    const scroll = el && (el.scrollHeight > el.clientHeight ? el : [...el.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight && getComputedStyle(e).overflowY === 'auto'));
    if (scroll) scroll.scrollTop = where === 'bottom' ? scroll.scrollHeight : 400;
  }, c.scroll);
  if (c.action === 'logout') await tap(page, '[data-a="logout"]');
  if (c.action === 'delete' || c.control === 'dialog') {
    await page.locator('[data-a="delete"]').scrollIntoViewIfNeeded();
    await tap(page, '[data-a="delete"]');
  }
  if (c.action === 'previous') await tap(page, '.pg26 .prev');
  if (c.kind === 'recordings') {
    if (c.action === 'off') await tap(page, '.pg28b .toggle');
    if (c.action === 'playing') await tap(page, '.pf-vrow .play');
    if (c.action === 'delete-one') await tap(page, '.pf-vrow .del');
    if (c.action === 'delete-all') await tap(page, '[data-all]');
  }
  if ((c.kind === 'feedback' && c.action !== 'empty') || c.control === 'toast') {
    await tap(page, '.st29 .chip'); await page.locator('.st29 textarea').fill('Visual audit test draft');
    if(c.action==='sent'||c.control==='toast') await tap(page,'.st29 .btn');
  }
  if (c.kind === 'confidence' && c.selected) {
    await tap(page, '.st30 .copt:nth-of-type(' + c.selected + ')');
    if(c.result) await tap(page,'.st30 .stbot .btn');
  }
  if (c.kind === 'exercise') {
    await page.waitForTimeout(c.exercise==='heard'?4500:650);
    if (c.quit) await tap(page,'.xbtn');
    if (c.action === 'tiles-selected' || c.feedback || c.action === 'tiles-right' || c.action === 'tiles-wrong') {
      const words=await page.evaluate(() => [...document.querySelectorAll('.bbank .word:not(.used)')].map(e=>e.textContent));
      if(words.length) {
        const wanted=await page.evaluate(() => window.AUDIT.answerWords());
        const use=c.action==='tiles-selected'?words.slice(0,2):(c.feedback==='wrong'||c.action==='tiles-wrong')?words.filter(w=>!wanted.includes(w)).slice(0,1):wanted;
        for(const word of use) {const item=page.locator('.bbank .word:not(.used)').filter({hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();if(await item.count())await item.click({force:true});}
        if(c.feedback||c.action==='tiles-right'||c.action==='tiles-wrong')await tap(page,'.check');
      }
    }
    if(c.action==='fix-selected')await tap(page,'.mword');
    if(c.action==='gap-selected')await tap(page,'.gap');
    if(c.action==='heard-selected')await tap(page,'.ex .picture');
    if(c.listening)await page.evaluate(()=>window.AUDIT.listen());
    if(c.combo)await page.evaluate(n=>{const el=document.querySelector('.combo14');el.style.pointerEvents='auto';el.style.opacity='1';const big=el.querySelector('.big');big.textContent=n+' ta ketma-ket!';big.style.opacity='1';el.querySelector('.sub').style.opacity='1';el.querySelector('.track i').style.width='0%';},c.combo);
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] });
  const logPath = path.join(out,'capture-log.json');
  const results = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath,'utf8')) : [];
  try {
    const jobs=[false,true].flatMap(dark=>cases.filter(c=>!selected.length||selected.includes(c.id)).map(entry=>({entry,dark})));
    async function worker() {
      const context = await browser.newContext({ viewport: { width: 390, height: viewportHeight }, timezoneId: 'Asia/Tashkent' });
      const page = await context.newPage();
      await page.route('**/src/web/onboarding.js', async route => {
        let source=fs.readFileSync(path.join(root,'src/web/onboarding.js'),'utf8').replaceAll('const F = frame(ctx)', 'const F = window.AUDIT_OB = frame(ctx)');
        source=source.replace('if (window.APP_TEST) M.wait(900)', 'if (window.VISUAL_CAPTURE_HOLD) return; if (window.APP_TEST) M.wait(900)');
        await route.fulfill({status:200,contentType:'text/javascript',body:source});
      });
      for (;;) {
        const job=jobs.shift(); if(!job)break;
        const {entry,dark}=job;
        const name=entry.id+(dark?'-dark':'-light');
        if(process.env.AUDIT_RECAPTURE !== '1' && fs.existsSync(path.join(out,name+'.png')))continue;
        const row={id:entry.id,dark};const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
        try {
          await page.goto('http://127.0.0.1:8791/src/mobile/scripts/visual-audit/reference.html');
          await page.addStyleTag({ content: '#shell,#phone{height:' + viewportHeight + 'px!important}' });
          await page.waitForFunction(()=>window.AUDIT?.ready,null,{timeout:45000});
          await page.evaluate(()=>{window.VISUAL_CAPTURE_HOLD=true;});
          await page.evaluate(({id,dark})=>window.AUDIT.show(id,dark),{id:entry.id,dark});
          await applyState(page,entry);
          await page.waitForTimeout(entry.native.kind==='confidence'&&entry.native.result?3500:entry.native.kind==='moment'?2300:entry.native.panel==='checkpoint'?1600:900);
          await page.locator('#phone').screenshot({path:path.join(out,name+'.png'),timeout:15000});
          fs.writeFileSync(path.join(out,name+'.layout.json'),JSON.stringify(await page.evaluate(()=>window.AUDIT.metrics()),null,2));
          row.status='captured';row.errors=errors;
          console.log('BROWSER '+name+' captured'+(errors.length?' ('+errors.length+' page errors)':''));
        } catch(e) { row.status='failed';row.error=e.message;console.log('BROWSER '+name+' FAILED '+e.message.slice(0,180)); }
        finally {page.off('pageerror',handler);const previous=results.findIndex(r=>r.id===row.id&&r.dark===row.dark);if(previous>=0)results.splice(previous,1);results.push(row);fs.writeFileSync(logPath,JSON.stringify(results,null,2));}
      }
      await context.close();
    }
    await Promise.all(Array.from({length:Number(process.env.AUDIT_WORKERS||2)},worker));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
