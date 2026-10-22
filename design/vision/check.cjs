// Browser checks for the local planning atlas. Run while the repo is served:
// node design/vision/check.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.VISION_URL || 'http://127.0.0.1:8793/design/vision/';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  const output=path.resolve(__dirname,'../../.expo/vision-checks');fs.mkdirSync(output,{recursive:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    await page.goto(base);await page.locator('.region').first().waitFor();await page.evaluate(()=>document.fonts.ready);
    const model=await page.evaluate(async()=>{const m=await import('./data.js');return {nodes:m.nodes,areas:m.areas,journeys:m.journeys};});
    assert.equal(new Set(model.nodes.map(n=>n.id)).size,model.nodes.length,'Node IDs must be unique');
    const ids=new Set(model.nodes.map(n=>n.id));
    for(const n of model.nodes)for(const next of n.next)assert(ids.has(next),`Broken connection: ${n.id} -> ${next}`);
    for(const j of model.journeys)for(const id of j.steps)assert(ids.has(id),`Broken journey: ${j.id} -> ${id}`);
    await page.screenshot({path:path.join(output,'whole-map.png'),fullPage:true});
    await page.getByRole('button',{name:'Future extensions',exact:true}).click();
    assert.equal(await page.locator('.region').count(),4,'Extension filter must omit core areas');
    await page.getByRole('button',{name:'Core experience',exact:true}).click();
    assert.equal(await page.locator('.region').count(),5);
    await page.getByRole('button',{name:'Whole vision',exact:true}).click();
    await page.locator('[data-node="path"]').first().click();
    await page.getByRole('dialog').waitFor();await page.screenshot({path:path.join(output,'screen-details.png')});
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.body.style.overflow==='');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'','Dialog restores scrolling');
    await page.goto(base+'#screens');
    await page.locator('.screen-card').last().waitFor();
    assert.equal(await page.locator('.screen-card').count(),model.nodes.length);
    await page.locator('#search').fill('pronunciation');await page.waitForTimeout(220);
    assert(await page.locator('.screen-card').count()>0,'Search returns relevant screens');
    await page.locator('#search').fill('nothing-matches-this-screen');await page.waitForTimeout(220);
    assert.equal(await page.locator('.screen-card').count(),0);assert(await page.locator('.search-empty').isVisible());
    await page.locator('#search').fill('');await page.waitForTimeout(220);
    await page.getByRole('button',{name:/^Built \d+/}).click();
    assert.equal(await page.locator('.screen-card').count(),model.nodes.filter(n=>n.status==='built').length);
    await page.getByRole('button',{name:/^All \d+/}).click();
    // Render every detail and verify it has behavior, a preview, and a close path.
    for(const n of model.nodes){
      await page.locator(`.screen-card[data-node="${n.id}"]`).click();
      assert.equal(await page.locator('#detail-title').textContent(),n.title);
      assert(await page.locator('#detail .detail-rules li').count()>0);
      await page.getByRole('button',{name:'Close screen details'}).click();
      await page.getByRole('dialog').waitFor({state:'hidden'});
    }
    for(const a of model.areas){await page.goto(base+'#area/'+a.id);await page.locator('.screen-card').last().waitFor();assert.equal(await page.locator('.screen-card').count(),a.nodes.length);}
    await page.goto(base+'#journeys/daily');await page.locator('.journey-list').waitFor();
    await page.getByRole('button',{name:'Next journey screen'}).click();
    assert.equal(await page.locator('.journey-step.selected strong').textContent(),'Lesson start sheet');
    assert.equal(await page.locator('.journey-controls [data-walk="1"]').evaluate(el=>el===document.activeElement),true,'Journey navigation keeps keyboard focus');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(output,'daily-journey.png'),fullPage:true});
    await page.goto(base+'#notifications');await page.locator('#scenario').waitFor();
    assert(await page.locator('.push').isVisible());
    await page.locator('[data-notice="done"]').check();assert.equal(await page.locator('.push').count(),0);
    await page.selectOption('#scenario','weekly');assert(await page.locator('.push').isVisible(),'An optional weekly summary is not a request to do another lesson');
    await page.locator('[data-notice="permission"]').uncheck();assert.equal(await page.locator('.push').count(),0);
    await page.locator('[data-notice="permission"]').check();await page.locator('[data-notice="done"]').uncheck();
    await page.locator('[data-notice="quiet"]').check();assert.equal(await page.locator('.push').count(),0);
    await page.locator('[data-notice="quiet"]').uncheck();await page.locator('[data-notice="sent"]').check();assert.equal(await page.locator('.push').count(),0);
    await page.locator('[data-notice="sent"]').uncheck();await page.selectOption('#scenario','daily');
    const before=await page.locator('.push>p').textContent();await page.locator('[data-rotate]').click();assert.notEqual(await page.locator('.push>p').textContent(),before);
    await page.selectOption('#scenario','resume');await page.locator('.push [data-node]').click();assert.equal(await page.locator('#detail-title').textContent(),'Continue a saved lesson');await page.keyboard.press('Escape');
    await page.screenshot({path:path.join(output,'notification-lab.png'),fullPage:true});
    await page.goto(base+'#node/scene');await page.locator('#detail-title').waitFor();assert.equal(await page.locator('#detail-title').textContent(),'Your turn with the character');
    await page.locator('#detail .mock-options button').first().click();assert.equal(await page.locator('#detail-title').textContent(),'A twist, then a real outcome');await page.keyboard.press('Escape');
    await page.goto(base+'#decisions');await page.locator('.decision').first().waitFor();assert.equal(await page.locator('.decision').count(),7);
    await page.locator('#theme').click();assert(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
    await page.screenshot({path:path.join(output,'decisions-dark.png'),fullPage:true});await page.locator('#theme').click();
    for(const width of [360,768,1024,1440]){
      await page.setViewportSize({width,height:900});
      for(const route of ['map','area/learn','journeys/first','notifications','decisions','node/scene']){
        await page.goto(base+'#'+route);await page.waitForTimeout(80);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow: ${route} at ${width}`);
        if(route.startsWith('node/'))assert(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Dialog overflow at ${width}`);
      }
    }
    await page.setViewportSize({width:390,height:844});await page.goto(base);await page.locator('.region').first().waitFor();
    await page.getByRole('button',{name:'Toggle navigation'}).click();assert(await page.locator('.sidebar').evaluate(el=>el.classList.contains('open')));
    await page.locator('#area-nav a[href="#area/progress"]').click();assert(!(await page.locator('.sidebar').evaluate(el=>el.classList.contains('open'))));
    await page.screenshot({path:path.join(output,'mobile-progress.png'),fullPage:true});
    await page.goto(base+'#notifications');await page.locator('#scenario').waitFor();await page.screenshot({path:path.join(output,'mobile-notifications.png'),fullPage:true});
    assert.deepEqual(errors,[],'No browser errors or missing resources');
    console.log(`PASS: ${model.nodes.length} screens, ${model.areas.length} areas, ${model.journeys.length} journeys; search, filters, all connections, every detail, reminder suppression, live links, theme, navigation and 4 viewport widths.`);
    console.log('Screenshots: '+output);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
