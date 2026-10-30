import { core } from './chapters-core.js';
import { aiSpeaking } from './chapters-ai.js';
import { experience } from './chapters-experience.js';
import { systems } from './chapters-systems.js';
import { esc,p,h,table,note,chapter,exercises,readerJourneys } from './content.js';
import { sourceCoverage,aiTargets,featureTarget,touchMeaning } from './coverage.js';
import { nodes as atlasNodes } from '/design/vision/data.js';

const $=selector=>document.querySelector(selector);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let appendix;
try {const response=await fetch('./appendices.json');if(!response.ok)throw Error(`HTTP ${response.status}`);appendix=await response.json();}
catch(error){$('#boot').innerHTML='The blueprint data could not load. <button id="reload">Try again</button>';$('#reload').onclick=()=>location.reload();throw error;}

function inventory(title,body,open=false,id=''){return `<details class="inventory" ${open?'open':''} ${id?`id="${id}"`:''}><summary>${title}<span aria-hidden="true">+</span></summary><div class="inventory-body">${body}</div></details>`;}
function renderAppendix(kind){
  if(kind==='lessons')return inventory('All 15 current lesson outcomes',table(['Lesson','Practical ability','Example phrases'],appendix.lessons.map(l=>[`${l.number}. ${esc(l.uzbek)}`,esc(l.skill),esc(l.phrases)])));
  if(kind==='course')return appendix.levels.map(level=>inventory(`Level ${level.number} · ${esc(level.title)} · ${level.units.length} units`,table(['Unit','The learner can…','Language or trap focus'],level.units.map(u=>[`${u.number}. ${esc(u.title)}`,esc(u.can),esc([u.patterns,u.trap].filter(Boolean).join(' · '))])),level.number===0,`course-level-${level.number}`)).join('');
  if(kind==='traps')return inventory('All nine authored Uzbek-speaker traps',table(['Trap','Model and correction','Uzbek explanation'],appendix.traps.map(t=>[`${t.id} · ${esc(t.name)}`,`${esc(t.mistake)}<br><strong>${esc(t.correct)}</strong>`,esc(t.explanation)])));
  if(kind==='exercises')return `<div class="exercise-catalog">${appendix.exercises.map(e=>{const extra=exercises.find(v=>v.id===e.id);return `<details class="exercise" id="exercise-${e.id.toLowerCase()}"><summary><span class="exercise-id">${e.id}</span><span><strong>${esc(e.title)}</strong><small>${esc(e.activity)} · ${esc(e.ladder)}</small></span><span class="exercise-toggle" aria-hidden="true">+</span></summary><div class="exercise-body"><p class="exercise-aim">${esc(extra.aim)}</p><dl><dt>What the learner does</dt><dd>${esc(e.does)}</dd><dt>Feedback and meaning</dt><dd>${esc(extra.feedback)}</dd><dt>When speaking or sound is off</dt><dd>${esc(extra.mode)}</dd><dt>Current position</dt><dd>${esc(extra.state)}</dd></dl></div></details>`;}).join('')}</div>`;
  if(kind==='touch')return inventory('All 19 touch-lab interactions and how they fit',table(['Gesture in the lab','Intended experience'],appendix.touch.map((t,i)=>[esc(t.gesture),esc(touchMeaning[i])]))+note('Playground versus app','These interactions exist as animation concepts or lab behavior. Their inclusion, controls and permissions in the persistent mobile companion still need implementation.'));
  if(kind==='sounds')return inventory('All 20 chosen sound categories',table(['Moment','Selected asset','Length in the chosen set'],appendix.sounds.map(s=>[esc(s.title),esc(s.file),esc(s.length)]))+p('These are existing selections from the sound plan. Timing, volume and simultaneous playback still have to make sense in the actual context; a longer source asset does not require a learner to wait for its entire tail.'));
  return '';
}
function hydrate(body){return body.replace(/<div data-appendix="([a-z]+)"><\/div>/g,(_,kind)=>renderAppendix(kind));}

function journeySteps(j){return `<ol class="journey-story">${j.moments.map(([action,learner,app],i)=>`<li><span class="story-number">${String(i+1).padStart(2,'0')}</span><div><h4>${esc(action)}</h4><dl><dt>The learner</dt><dd>${esc(learner)}</dd><dt>The app</dt><dd>${esc(app)}</dd></dl></div></li>`).join('')}</ol>`;}
function journeyBlock(j){return `<div class="journey-context"><span>EXAMPLE LEARNER · ${esc(j.title.toUpperCase())}</span><p>${esc(j.intro)}</p></div>${journeySteps(j)}`;}
const journeyChapter=chapter('journeys','People using the app','Six ways people will actually use it',
  'Follow a person through the product. Each step separates what the learner does from what the app is responsible for.',
  `<div class="journey-picker no-print" role="group" aria-label="Choose a learner journey">${readerJourneys.map((j,i)=>`<button data-journey="${j.id}" aria-pressed="${i===0}">${esc(j.title)}</button>`).join('')}</div><div id="journey-content" class="no-print">${journeyBlock(readerJourneys[0])}</div><div class="only-print">${readerJourneys.map(j=>`<h3>${esc(j.title)}</h3>${journeyBlock(j)}`).join('')}</div>`,
  ['pages.md','teaching-methodology.md','scene-simulation-concept.md','speech-and-retention-research.md']);

const coverageChapter=chapter('coverage','Coverage and source notes','What this blueprint accounts for',
  'The guide above is the product explanation. This appendix makes its coverage reviewable against every earlier plan.',
  h('Later extensions remain visible')+
  table(['Extension','How people would use it','What remains to design'],[
    ['Russian interface','Choose reviewed Russian instructions, hints and explanations while following the same English course.','Translation and error-pattern coverage; Uzbek remains first. The current app is not a complete bilingual course.'],
    ['Offline course packs','Keep suitable later units and media available when the course grows beyond bundled content.','Download controls, storage and version handling. Current lessons are bundled; offline speech and hosted AI remain separate.'],
    ['Widget','See a real phrase, current habit or next lesson without opening a feed.','Native widget layout, update behavior and supported platforms.'],
    ['Telegram reminders and family reports','Choose an extra reminder channel or a consented learning summary.','Account linking, delivery preferences, deduplication and privacy; no saved voice is shared.'],
    ['Share cards and invitations','Deliberately share a visible win or invite a friend.','What is exposed, consent, qualifying rewards and anti-abuse rules. Nothing is automatically posted.'],
    ['Certificates and goal tracks','Reach an app-defined milestone or practise an explicit travel, study, work or IELTS goal.','Assessment and authored content. An app certificate is not an official exam result.'],
  ])+
  h('All 17 learner-facing AI proposals')+
  p('This is the complete earlier proposal list, not 17 confirmed requirements or 17 implemented AI features. Each has a place in the product explanation.')+
  table(['Original proposal','Explained here'],appendix.ai.map((item,i)=>[`${item.number}. ${esc(item.feature)}`,`<a href="#${aiTargets[i]}">${esc(({speech:'Speaking and listening','first-session':'First experience',adaptation:'Personal learning engine',proof:'Visible improvement',retention:'Returning for a reason',dombi:'Dombi companion','ai-speaking':'AI Speaking',scenes:'Real-life scenes'})[aiTargets[i]])} →</a>`]))+
  h('The feature map, connected to this explanation')+
  p('Every existing map entry is linked to a product chapter here. These are supporting references; the guide does not ask you to infer the whole product from pictures.')+
  `<details class="inventory" id="mapped-feature-inventory"><summary>All ${atlasNodes.length} earlier map entries<span aria-hidden="true">+</span></summary><div class="inventory-body"><div class="ledger-controls no-print"><label for="ledger-search">Find a mapped feature</label><input id="ledger-search" type="search" placeholder="Try voice, shop, friends, or reminder"><span id="ledger-count" role="status">${atlasNodes.length} entries</span></div><div class="feature-ledger">${atlasNodes.map(n=>`<div class="ledger-row" data-ledger="${esc([n.title,n.summary,n.id].join(' ').toLowerCase())}"><div><strong>${esc(n.title)}</strong><p>${esc(n.summary)}</p></div><a href="#${featureTarget(n)}">Read the behavior →</a></div>`).join('')}</div></div></details>`+
  h('Every product-planning source')+
  p('Later direct instructions take priority over old documents. In particular: Android first; the current MVP works without a hosted backend; launch is excluded; disabled controls use solid gray; the approved wheel, transitions and back behavior remain part of the experience; speech uncertainty is not a content mistake. Earlier proposals stay labeled as proposals.')+
  table(['Source','Covered material','Product chapter'],sourceCoverage.map(([file,description,targets])=>[`<a href="/docs/ideas/${file}" target="_blank" rel="noopener">${file} ↗</a>`,esc(description),targets.map(t=>`<a class="source-chip" href="#${t}">${esc(t.replaceAll('-',' '))}</a>`).join(' ')]))+
  note('A product blueprint, not a false promise','All known feature families and source plans are represented. Exact prices, thresholds, provider choices, detailed social permissions and the final Version 1 bundle remain open where no decision exists. That is part of the definition rather than an omitted screen.','agreed'),
  sourceCoverage.map(s=>s[0]));

const chapters=[core[0],journeyChapter,...core.slice(1),...experience.slice(0,2),aiSpeaking,...experience.slice(2),...systems,coverageChapter];
const grouped=[['UNDERSTAND THE PRODUCT',['product','journeys','first-session','navigation']],['LEARNING AND PRACTICE',['lesson','curriculum','adaptation','exercises','speech','ai-speaking','scenes']],['THE CONNECTED EXPERIENCE',['dombi','proof','retention','rewards','social']],['CONTROL AND COMPLETE THE SYSTEM',['personal','access','feel','reliability','scope','coverage']]];
$('#toc').innerHTML=grouped.map(([title,ids])=>`<div class="toc-group"><span>${title}</span>${ids.map(id=>{const c=chapters.find(v=>v.id===id);return `<a href="#${id}" data-chapter="${id}"><small>${String(chapters.indexOf(c)+1).padStart(2,'0')}</small>${esc(c.label)}</a>`;}).join('')}</div>`).join('');

const cover=`<section class="cover" id="top"><div class="cover-eyebrow">AKADEMIYA ENGLISH · COMPLETE PRODUCT BLUEPRINT</div><div class="cover-heading"><div><h1>How the whole<br>app works.</h1><p>A clear definition of the app we’re building: the features, the people using them, the learning behind them, and the experience that connects everything.</p></div><img class="cover-dombi" src="/design/icons/characters-dombi/pose-wave.svg" alt="Dombi, Akademiya’s companion"></div><div class="cover-meta"><span>${chapters.length} chapters</span><span>16 exercise types</span><span>48-unit course outline</span><span>6 learner journeys</span></div><div class="cover-actions"><a class="primary-button" href="#product">Read the blueprint ↓</a><a class="quiet-link" href="#journeys">Follow a learner →</a><a class="quiet-link" href="#scope">See the open decisions →</a><a class="quiet-link" href="Akademiya-English-Blueprint.pdf" target="_blank" rel="noopener">Download the full PDF ↗</a></div><div class="definition"><strong>The product in one sentence</strong><p>A speaking-first English app for Uzbekistan where short lessons lead to useful things you can say, real-life situations let you use them, and private proof helps you see your progress.</p></div><div class="product-spine" aria-label="How the product connects"><div><span>LEARN</span><strong>Build the ability.</strong><p>Course → lesson → recall → checkpoint</p></div><div><span>AI SPEAKING</span><strong>Have a conversation.</strong><p>Topic → speak → AI reply → useful practice</p></div><div><span>PROGRESS</span><strong>See the evidence.</strong><p>Capabilities → practice → private voice → improvement</p></div><div><span>PROFILE</span><strong>Make it yours.</strong><p>Preferences → companion → friends → optional rewards</p></div></div><p class="cover-boundary">This defines the full intended ecosystem. Agreed directions, recommendations and open decisions remain distinguishable. Android is the current foundation; launch work is excluded.</p></section>`;
const printContents=`<section class="print-contents only-print"><h2>Contents</h2><p>Start with the product and learner journeys for the overall experience. The remaining chapters define the features, behavior and open decisions in detail.</p><ol>${chapters.map(c=>`<li><a href="#${c.id}">${esc(c.label)}</a></li>`).join('')}</ol></section>`;
$('#book').innerHTML=cover+printContents+chapters.map((c,i)=>`<section class="chapter" id="${c.id}" aria-labelledby="heading-${c.id}"><header class="chapter-header"><div class="chapter-label"><span>${String(i+1).padStart(2,'0')}</span>${esc(c.label)}</div><h2 id="heading-${c.id}">${esc(c.title)}</h2><p class="chapter-lead">${esc(c.lead)}</p></header><div class="chapter-body">${hydrate(c.body)}</div><div class="chapter-sources"><strong>Source notes</strong>${c.sources.map(s=>`<a href="/docs/ideas/${s}" target="_blank" rel="noopener">${s}</a>`).join('')}</div><a class="next-chapter no-print" href="#${chapters[i+1]?.id||'top'}">${chapters[i+1]?`Next: ${esc(chapters[i+1].label)} →`:'Back to the beginning ↑'}</a></section>`).join('');
$('#boot').remove();
document.documentElement.dataset.blueprintReady='true';

function closeMenu(){$('.rail').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');}
$('#menu').onclick=()=>{const open=$('.rail').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));};
function updateTheme(){const dark=document.body.classList.contains('dark');$('#theme').setAttribute('aria-label',`Switch to ${dark?'light':'dark'} theme`);try{localStorage.setItem('akademiya.blueprint.theme',dark?'dark':'light');}catch{}}
try{if(localStorage.getItem('akademiya.blueprint.theme')==='dark')document.body.classList.add('dark');}catch{}
updateTheme();$('#theme').onclick=()=>{document.body.classList.toggle('dark');updateTheme();};

function revealHash(scroll=true){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target)return;for(let e=target;e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true;if(scroll)target.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}
addEventListener('hashchange',()=>revealHash());
document.addEventListener('click',e=>{
  const journey=e.target.closest('[data-journey]');if(journey){const j=readerJourneys.find(v=>v.id===journey.dataset.journey);$('#journey-content').innerHTML=journeyBlock(j);document.querySelectorAll('[data-journey]').forEach(b=>b.setAttribute('aria-pressed',String(b===journey)));}
  if(e.target.closest('a[href^="#"]')){closeMenu();closeSearch();if(e.target.closest('a').hash===location.hash)revealHash();}
  if(innerWidth<=900&&!e.target.closest('.rail,#menu'))closeMenu();
  if(!e.target.closest('.search-panel,.search'))closeSearch();
});
$('#ledger-search').addEventListener('input',()=>{const q=$('#ledger-search').value.toLowerCase().trim();let count=0;document.querySelectorAll('.ledger-row').forEach(r=>{r.hidden=!r.dataset.ledger.includes(q);if(!r.hidden)count++;});$('#ledger-count').textContent=`${count} ${count===1?'entry':'entries'}`;});

const searchIndex=[
  ...chapters.map(c=>({title:c.label,id:c.id,text:document.getElementById(c.id).textContent.replace(/\s+/g,' '),kind:'Chapter'})),
  ...appendix.exercises.map(e=>({title:`${e.id} · ${e.title}`,id:`exercise-${e.id.toLowerCase()}`,text:[e.title,e.activity,e.does,exercises.find(v=>v.id===e.id).aim].join(' '),kind:'Exercise'})),
  ...atlasNodes.map(n=>({title:n.title,id:featureTarget(n),text:[n.title,n.summary,...n.rules].join(' '),kind:'Feature'})),
  ...appendix.ai.map((a,i)=>({title:a.feature,id:aiTargets[i],text:a.feature,kind:'AI proposal'})),
];
function closeSearch(){$('#search-panel').hidden=true;}
function search(){const q=$('#search').value.trim().toLowerCase();if(!q){closeSearch();return;}const found=searchIndex.map(entry=>({...entry,score:entry.title.toLowerCase().includes(q)?2:entry.text.toLowerCase().includes(q)?1:0})).filter(v=>v.score).sort((a,b)=>b.score-a.score).slice(0,12);$('#search-panel').hidden=false;$('#search-panel').innerHTML=`<div class="search-caption" role="status">${found.length?`${found.length} relevant places`:'No matching feature found'}</div>${found.map(v=>{const at=v.text.toLowerCase().indexOf(q);const start=Math.max(0,at-45);const snippet=v.text.slice(start,start+160);return `<a href="#${v.id}"><small>${v.kind}</small><strong>${esc(v.title)}</strong><span>${esc(snippet)}${v.text.length>start+160?'…':''}</span></a>`;}).join('')}${!found.length?'<p>Try “Dombi”, “silent”, “confidence”, “Match Rush” or “payment”.</p>':''}`;}
$('#search').addEventListener('input',search);$('#search').addEventListener('focus',()=>{if($('#search').value.trim())search();});
$('#search').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){$('#search-panel a')?.focus();e.preventDefault();}if(e.key==='Enter'){const link=$('#search-panel a');if(link){location.hash=link.hash;closeSearch();$('#search').blur();}}});
$('#search-panel').addEventListener('keydown',e=>{const links=[...$('#search-panel').querySelectorAll('a')];const i=links.indexOf(document.activeElement);if(e.key==='ArrowDown'){links[(i+1)%links.length]?.focus();e.preventDefault();}if(e.key==='ArrowUp'){if(i<=0)$('#search').focus();else links[i-1].focus();e.preventDefault();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.target.matches('input,textarea,select')){e.preventDefault();$('#search').focus();}if(e.key==='Escape'){closeSearch();closeMenu();}});

let scrollQueued=false;
function updateReading(){scrollQueued=false;const total=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=`${total>0?Math.min(100,100*scrollY/total):0}%`;const active=[...document.querySelectorAll('.chapter')].filter(s=>s.getBoundingClientRect().top<180).at(-1);document.querySelectorAll('[data-chapter]').forEach(a=>{const selected=a.dataset.chapter===active?.id;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateReading);}},{passive:true});
addEventListener('resize',updateReading);document.addEventListener('toggle',updateReading,true);
updateReading();if(location.hash)requestAnimationFrame(()=>revealHash());

let printState=[];
addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(d=>[d,d.open]);printState.forEach(([d])=>{d.open=true;});document.querySelectorAll('.ledger-row').forEach(r=>{r.dataset.printHidden=String(r.hidden);r.hidden=false;});closeSearch();});
addEventListener('afterprint',()=>{printState.forEach(([d,open])=>{d.open=open;});document.querySelectorAll('.ledger-row').forEach(r=>{r.hidden=r.dataset.printHidden==='true';delete r.dataset.printHidden;});printState=[];});
$('#print').onclick=()=>window.print();

// Exposes read-only counts for review and the browser completeness checks.
window.BLUEPRINT=Object.freeze({chapters:chapters.map(c=>({id:c.id,label:c.label})),exercises:appendix.exercises.length,units:appendix.levels.reduce((s,l)=>s+l.units.length,0),lessons:appendix.lessons.length,traps:appendix.traps.length,sounds:appendix.sounds.length,touch:appendix.touch.length,ai:appendix.ai.length,sources:sourceCoverage.length,mappedFeatures:atlasNodes.length,journeys:readerJourneys.length});
