// Completeness and reader-interaction checks, independent of the Android build.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const base=process.env.BLUEPRINT_URL||'http://127.0.0.1:8793/docs/blueprint/reference.html';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  const output=path.resolve(__dirname,'../../.expo/blueprint-checks');fs.mkdirSync(output,{recursive:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.goto(base);await page.waitForFunction(()=>window.BLUEPRINT);await page.evaluate(()=>document.fonts.ready);
    const spec=await page.evaluate(()=>window.BLUEPRINT);
    assert.equal(spec.exercises,16);assert.equal(spec.units,48);assert.equal(spec.lessons,15);assert.equal(spec.traps,9);assert.equal(spec.ai,17);assert.equal(spec.touch,19);assert.equal(spec.sounds,20);assert.equal(spec.mappedFeatures,96);assert.equal(spec.journeys,6);assert.equal(spec.sources,20);
    assert.equal(await page.locator('.chapter').count(),22);
    assert.equal(await page.locator('.exercise').count(),16);
    assert.equal(await page.locator('.ledger-row').count(),96);
    assert.equal(await page.locator('.phone').count(),0,'The blueprint is a product explanation, not a screen gallery');
    const broken=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)));
    assert.deepEqual(broken,[],'Every chapter, exercise and feature reference must resolve');
    const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[]);
    const sourceFiles=fs.readdirSync(path.resolve(__dirname,'../ideas')).filter(n=>n.endsWith('.md')).sort();
    const citedFiles=await page.evaluate(()=>[...new Set([...document.querySelectorAll('#coverage a[href^="/docs/ideas/"]')].map(a=>a.getAttribute('href').split('/').at(-1)))].sort());
    assert.deepEqual(citedFiles,sourceFiles,'Every original planning document must be accounted for');
    await page.screenshot({path:path.join(output,'cover-desktop.png')});
    await page.locator('a[data-chapter="journeys"]').click();
    for(const id of ['new','returning','quiet','scene','break','month']){
      await page.locator(`[data-journey="${id}"]`).click();
      assert.equal(await page.locator(`[data-journey="${id}"]`).getAttribute('aria-pressed'),'true');
      assert(await page.locator('#journey-content .journey-story>li').count()>=4);
      const text=await page.locator('#journey-content').textContent();assert(text.includes('The learner')&&text.includes('The app'));
    }
    await page.locator('[data-journey="quiet"]').click();await page.screenshot({path:path.join(output,'learner-walkthrough.png')});
    await page.locator('#search').fill('Match Rush');
    await page.locator('#search-panel').waitFor();
    await page.locator('#search-panel a').filter({hasText:'E3 · Match Rush'}).click();
    await page.waitForFunction(()=>document.querySelector('#exercise-e3').open);
    assert(await page.locator('#exercise-e3 .exercise-body').isVisible(),'Search opens the detailed exercise, not a closed chapter');
    await page.screenshot({path:path.join(output,'exercise-detail.png')});
    await page.locator('#search').fill('pet memory');assert(await page.locator('#search-panel').textContent().then(t=>t.toLowerCase().includes('pet memory')));
    await page.locator('#search').fill('no-possible-feature-match');assert(await page.locator('#search-panel').textContent().then(t=>t.includes('No matching')));
    await page.keyboard.press('Escape');assert(await page.locator('#search-panel').isHidden());
    await page.goto(base+'#exercise-e16');await page.waitForFunction(()=>document.querySelector('#exercise-e16')?.open);
    assert(await page.locator('#exercise-e16').textContent().then(t=>t.includes('more than one valid answer')));
    await page.locator('a[data-chapter="coverage"]').click();
    await page.locator('#mapped-feature-inventory>summary').click();
    await page.locator('#ledger-search').fill('voice');
    const filtered=await page.locator('.ledger-row:not([hidden])').count();assert(filtered>0&&filtered<96);
    const printSnapshot=await page.evaluate(()=>({open:[...document.querySelectorAll('details')].filter(d=>d.open).length,filtered:[...document.querySelectorAll('.ledger-row')].filter(d=>d.hidden).length}));
    await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('details:not([open])').count(),0,'The print copy expands all exercise and course details');
    assert.equal(await page.locator('.ledger-row[hidden]').count(),0,'A temporary feature filter must not omit content from print');
    await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('details[open]').count(),printSnapshot.open);assert.equal(await page.locator('.ledger-row[hidden]').count(),printSnapshot.filtered);
    await page.locator('#theme').click();assert(await page.locator('body').evaluate(b=>b.classList.contains('dark')));
    await page.locator('a[data-chapter="speech"]').click();await page.screenshot({path:path.join(output,'speech-dark.png')});await page.locator('#theme').click();
    for(const width of [360,390,768,1024,1440]){
      await page.setViewportSize({width,height:900});
      for(const target of ['top','journeys','exercises','curriculum','feel','scope','coverage']){
        await page.evaluate(id=>document.getElementById(id).scrollIntoView(),target);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow at ${width}, ${target}`);
      }
    }
    await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForFunction(()=>window.BLUEPRINT);
    await page.screenshot({path:path.join(output,'cover-mobile.png')});
    await page.getByRole('button',{name:'Toggle chapters'}).click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');
    await page.locator('a[data-chapter="journeys"]').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
    await page.screenshot({path:path.join(output,'walkthrough-mobile.png')});
    await page.goto(base+'#exercise-e3');await page.waitForFunction(()=>document.querySelector('#exercise-e3')?.open);
    await page.screenshot({path:path.join(output,'exercise-mobile.png')});
    assert.deepEqual(errors,[],'No browser errors or missing resources');
    console.log('PASS: all 22 chapters, 20 sources, 96 mapped features, 16 exercises, 48 units, 15 lessons, 9 traps, 17 AI proposals, 19 touch interactions and 20 sound categories.');
    console.log('PASS: six learner journeys, search/deep links, all anchors, feature lookup, print completeness/restoration, dark mode, mobile navigation and five viewport widths.');
    console.log('Screenshots: '+output);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
