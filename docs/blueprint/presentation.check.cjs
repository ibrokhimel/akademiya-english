const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const base=process.env.PRESENTATION_URL||'http://127.0.0.1:8793/docs/blueprint/';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const output=path.resolve(__dirname,'../../.expo/presentation-checks');fs.mkdirSync(output,{recursive:true});
  const errors=[];
  try {
    const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.addInitScript(()=>{
      window.__readCalls=[];window.__readCancels=0;
      Object.defineProperty(window,'speechSynthesis',{value:{cancel(){window.__readCancels++;},getVoices(){return[];},speak(u){window.__readCalls.push(u.text);}},configurable:true});
    });
    await page.goto(base);await page.waitForFunction(()=>window.PRESENTATION);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.chapter').count(),0);
    assert.equal(await page.locator('[data-move="-1"]').isDisabled(),true);
    assert.equal(await page.evaluate(()=>window.__readCalls.length),0,'No automatic audio');
    const initialHash=new URL(page.url()).hash;await page.waitForTimeout(800);assert.equal(new URL(page.url()).hash,initialHash,'No automatic advancing');
    await page.screenshot({path:path.join(output,'tour-desktop.png')});
    await page.locator('[data-pick="goal"][data-value="shop"]').click();assert(await page.locator('.phrase').textContent().then(t=>t.includes('blue')));
    await page.locator('[data-more]').click();assert.equal(await page.locator('dialog li').count(),3);assert(await page.locator('dialog').isVisible());
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.body.classList.contains('dialog-open'));
    assert.equal(await page.locator('[data-more]').evaluate(el=>document.activeElement===el),true,'Details restore keyboard focus');
    await page.locator('[data-listen]').click();assert.equal(await page.evaluate(()=>window.__readCalls.length),1);assert.equal(await page.locator('[data-listen]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-move="1"]').click();await page.waitForFunction(()=>window.PRESENTATION.step===1);assert.equal(await page.locator('[data-listen]').getAttribute('aria-pressed'),'false','Audio stops on navigation');
    await page.locator('[data-pick="day"][data-value="2"]').click();assert(await page.locator('.illustration h2').textContent().then(t=>t.includes('yourself')));
    await page.screenshot({path:path.join(output,'lesson-desktop.png')});
    const model=await page.evaluate(async()=>{const m=await import('./presentation-data.js');return{slides:m.slides,groups:m.groups};});
    assert.equal(model.slides.length,10);
    await page.goto(base+'#tour/places');await page.locator('.tab-choices').waitFor();
    assert.equal(await page.locator('.tab-choices button').count(),4,'The full application has four main tabs');
    await page.locator('[data-pick="place"][data-value="ai"]').click();assert(await page.locator('.visual-description').textContent().then(t=>t.includes('dedicated AI')));
    await page.goto(base+'#tour/ai-speaking');await page.locator('[data-ai-turn]').click();assert(await page.locator('.ai-conversation').textContent().then(t=>t.includes('usually play')));
    await page.locator('[data-pick="aiMode"][data-value="roleplay"]').click();assert(await page.locator('.ai-conversation').textContent().then(t=>t.includes('Where would you like to go')));
    for(const s of model.slides){
      await page.goto(base+'#tour/'+s.id);await page.waitForFunction(index=>window.PRESENTATION?.view==='tour'&&window.PRESENTATION.step===index,model.slides.indexOf(s));
      assert.equal(await page.locator('.slide').count(),1);
      const words=await page.locator('.slide').evaluate(el=>el.textContent.trim().split(/\s+/).length);assert(words<=110,`Too much default text: ${s.id}, ${words} words`);
      const picks=await page.locator('[data-pick]').evaluateAll(items=>items.map(b=>({key:b.dataset.pick,value:b.dataset.value})));
      for(const pick of picks){await page.locator(`[data-pick="${pick.key}"][data-value="${pick.value}"]`).click();assert.equal(await page.locator(`[data-pick="${pick.key}"][data-value="${pick.value}"]`).getAttribute('aria-pressed'),'true');}
    }
    await page.goto(base+'#tour/scenes');await page.locator('[data-scene]').click();assert(await page.locator('.conversation').textContent().then(t=>t.includes('no coffee')));await page.locator('[data-scene]').click();assert(await page.locator('.reply').textContent().then(t=>t.includes('used my English')));
    await page.screenshot({path:path.join(output,'scene-desktop.png')});
    await page.goto(base+'#tour/control');const before=await page.locator('[data-toggle]').getAttribute('aria-checked');await page.locator('[data-toggle]').click();assert.notEqual(await page.locator('[data-toggle]').getAttribute('aria-checked'),before);
    await page.locator('[data-move="1"]').click();await page.locator('.finish').waitFor();assert.equal(await page.locator('.finish h1').count(),1);
    await page.getByRole('link',{name:'Start the tour again'}).click();await page.waitForFunction(()=>window.PRESENTATION.step===0);assert.equal(await page.evaluate(()=>window.PRESENTATION.step),0);
    await page.locator('#topic-button').click();assert.equal(await page.locator('.topic-list a').count(),10);await page.locator('.topic-list a[href="#tour/dombi"]').click();assert(await page.locator('dialog').isHidden());assert.equal(new URL(page.url()).hash,'#tour/dombi');
    await page.goto(base+'#features/learn');await page.locator('#feature-search').fill('voice');assert(await page.locator('.feature-list a').count()>0);assert(await page.locator('.feature-detail').textContent().then(t=>t.toLowerCase().includes('voice')));
    await page.locator('#feature-search').fill('no-such-feature-abc');assert.equal(await page.locator('.feature-list a').count(),0);assert(await page.locator('.no-results').isVisible());
    for(const group of model.groups){for(const feature of group.features){await page.goto(base+`#features/${group.id}/${feature.id}`);await page.waitForFunction(name=>document.querySelector('.feature-detail h2')?.textContent===name,feature.name);assert.equal(await page.locator('.feature-detail h2').textContent(),feature.name);assert.equal(await page.locator('.feature-points li').count(),2);}}
    await page.screenshot({path:path.join(output,'feature-desktop.png')});
    await page.goto(base+'#tour/day');await page.waitForFunction(()=>window.PRESENTATION?.step===1&&window.PRESENTATION.view==='tour');await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>window.PRESENTATION.step===2);assert.equal(new URL(page.url()).hash,'#tour/places');await page.goBack();assert.equal(new URL(page.url()).hash,'#tour/day');
    for(const width of [360,390,768,1024,1440]){
      await page.setViewportSize({width,height:844});
      for(const s of model.slides){await page.goto(base+'#tour/'+s.id);await page.waitForFunction(index=>window.PRESENTATION?.view==='tour'&&window.PRESENTATION.step===index,model.slides.indexOf(s));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${width} ${s.id}`);}
      await page.goto(base+'#features/progress/voice');await page.locator('.feature-detail').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Feature overflow: ${width}`);
    }
    await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForFunction(()=>window.PRESENTATION);await page.screenshot({path:path.join(output,'tour-mobile.png'),fullPage:true});
    await page.goto(base+'#tour/scenes');await page.locator('.slide').waitFor();await page.screenshot({path:path.join(output,'scene-mobile.png'),fullPage:true});
    await page.goto(base+'#features/progress/voice');await page.locator('.feature-detail').waitFor();await page.screenshot({path:path.join(output,'feature-mobile.png'),fullPage:true});
    await page.goto(base+'#speech');await page.waitForURL('**/reference.html#speech');await page.waitForFunction(()=>window.BLUEPRINT);assert(await page.locator('#speech h2').isVisible(),'Old chapter links still reach the full reference');
    assert.deepEqual(errors,[],'No browser errors or missing assets');
    console.log(`PASS: 10 short steps, dedicated AI Speaking tab, ${model.groups.flatMap(g=>g.features).length} optional features, all examples, user-controlled audio, keyboard/back navigation and 5 viewport widths.`);
    console.log('Screenshots: '+output);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
