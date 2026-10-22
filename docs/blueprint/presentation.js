import {slides,groups} from './presentation-data.js';

const $=s=>document.querySelector(s);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(name,cls='')=>`<img class="${cls}" src="${name==='dombi'?'/design/icons/characters-dombi/pose-wave.svg':`/pendev/icons-r2/${name}.png`}" alt="">`;
const dombi=mood=>`<img class="dombi-art" src="/design/icons/characters-dombi/${mood}.svg" alt="Dombi">`;
const state={step:0,values:{},lastTour:'idea',query:'',speaking:false,utterance:null,previousFocus:null};
const bookIds=new Set(['top','product','journeys','first-session','navigation','lesson','curriculum','adaptation','exercises','speech','ai-speaking','scenes','dombi','proof','retention','rewards','social','personal','access','feel','reliability','scope','coverage']);
const allFeatures=groups.flatMap(g=>g.features.map(f=>({...f,group:g.id,icon:g.icon})));
const select=(key,options)=>`<div class="options" role="group" aria-label="Choose an example">${options.map(([label,value])=>`<button data-pick="${key}" data-value="${value}" aria-pressed="${String(value)===String(state.values[key]??options[0][1])}">${label}</button>`).join('')}</div>`;

function visual(s){
  if(s.kind==='promise'){
    const v=state.values.goal||'cafe';const data={cafe:['coffee-kafeda','Order a drink.','A coffee, please.'],hello:['lesson-hello','Meet someone.','Hello! I’m Aziz.'],shop:['cart-dokon','Ask for what you need.','Do you have it in blue?']}[v];
    return `<div class="visual-cap">THE EVERYDAY GOAL</div><div class="goal-art">${img(data[0])}</div><h2>${data[1]}</h2><div class="phrase">“${data[2]}”</div>${select('goal',[['Café','cafe'],['Say hello','hello'],['Shopping','shop']])}`;
  }
  if(s.kind==='day'){
    const i=+(state.values.day||0),beats=[['Hear it','Listen to “A coffee, please.”','glyph-speaker-violet'],['Build it','Put the useful words in order.','book-phrase-list'],['Say it','Try the phrase for yourself.','glyph-mic-violet'],['Use it','Order a drink in a situation.','coffee-kafeda']];
    return `<div class="visual-cap">FOLLOW ONE LESSON</div><div class="lesson-track">${beats.map((b,k)=>`<button data-pick="day" data-value="${k}" aria-pressed="${k===i}"><span>${k+1}</span><strong>${b[0]}</strong></button>`).join('')}</div><div class="center-art">${img(beats[i][2])}</div><h2>${beats[i][1]}</h2><p class="visual-note">Choose a step to see what happens.</p>`;
  }
  if(s.kind==='places'){
    const key=state.values.place||'learn',data={learn:['tab-home','What should I learn next?','Your course, saved lesson and personal review.'],ai:['glyph-mic-violet','Let’s actually talk.','Your dedicated AI conversation and roleplay tab.'],progress:['tab-progress','What can I do now?','Your phrases, voice clips and learning progress.'],profile:['tab-profile','How do I make it mine?','Your preferences, recordings and personal space.']}[key];
    return `<div class="visual-cap">FULL APP · FOUR MAIN TABS</div><div class="tab-choices">${[['learn','tab-home','Learn'],['ai','glyph-mic-violet','AI Speaking'],['progress','tab-progress','Progress'],['profile','tab-profile','Profile']].map(([id,icon,label])=>`<button data-pick="place" data-value="${id}" aria-pressed="${key===id}">${img(icon)}<span>${label}</span></button>`).join('')}</div><div class="center-art small">${img(data[0])}</div><h2>${data[1]}</h2><p class="visual-description">${data[2]}</p>`;
  }
  if(s.kind==='ai-speaking'){
    const mode=state.values.aiMode||'free',i=+(state.values.aiTurn||0);
    const examples={free:['Free conversation','What do you enjoy doing after work?','I like playing football.','Who do you usually play with?'],guided:['Guided topic','Tell me one thing you did today.','Today, I went to…','Good start. Where did you go?'],roleplay:['Roleplay','Hello! Where would you like to go?','To the station, please.','Of course. Do you have any bags?']};
    const example=examples[mode];
    return `<div class="visual-cap">AI SPEAKING TAB · SCRIPTED PREVIEW</div>${select('aiMode',[['Free talk','free'],['Guided','guided'],['Roleplay','roleplay']])}<div class="conversation ai-conversation"><small>${example[0].toUpperCase()}</small><p>${i?example[3]:example[1]}</p></div><button class="reply" data-ai-turn="${i?0:1}"><span>${i?'The conversation continues.':example[2]}</span><small>${i?'Restart the example ↺':'Try this reply →'}</small></button><p class="visual-note">You speak; the AI replies. This preview uses preset text.</p>`;
  }
  if(s.kind==='personal'){
    const v=state.values.practice||'recall',data={recall:['glyph-mic-violet','Remember it yourself.','The example disappears. Try the phrase from a useful situation.'],review:['repeat','Bring it back later.','The future review engine revisits material that needs another try.'],quiet:['book-phrase-list','Keep going quietly.','Use suitable tiles or listening when speaking isn’t possible.']}[v];
    return `<div class="visual-cap">PRACTICE ADAPTS TO THE MOMENT</div><div class="center-art">${img(data[0])}</div><h2>${data[1]}</h2><p class="visual-description">${data[2]}</p>${select('practice',[['Recall','recall'],['Review','review'],['Quiet mode','quiet']])}`;
  }
  if(s.kind==='scene'){
    const i=+(state.values.scene||0),lines=[['What would you like?','A coffee, please.','Try my reply →'],['Sorry, no coffee. Would you like tea?','Tea, please.','Handle the surprise →'],['Of course. Here you are!','I used my English.','Try again ↺']];const row=lines[i];
    return `<div class="visual-cap">CAFÉ · SCRIPTED PREVIEW</div><div class="scene-art">${img('coffee-kafeda')}</div><div class="conversation"><small>THE WAITER</small><p>${row[0]}</p></div><button class="reply" data-scene="${(i+1)%3}"><span>${row[1]}</span><small>${row[2]}</small></button><p class="visual-note">Future live scenes will respond to your own words.</p>`;
  }
  if(s.kind==='dombi'){
    const v=state.values.dombi||'guide',data={guide:['pose-wave','A guide.','Helps you start and makes the learning feel alive.'],talk:['listen','A speaking partner.','Future live practice, with room for your voice.'],play:['happy','A little play.','Future interactions and outfits, when you want them.']}[v];
    return `<div class="visual-cap">CHOOSE HIS ROLE</div>${dombi(data[0])}<h2>${data[1]}</h2><p class="visual-description">${data[2]}</p>${select('dombi',[['Guide','guide'],['Talk','talk'],['Play','play']])}`;
  }
  if(s.kind==='proof'){
    const v=state.values.proof||'phrases',data={phrases:['bubble-phrases','“How much is it?”','A useful phrase you can revisit and practise.'],voice:['glyph-mic-coral','Your own voice.','Replay a clip you chose to save. Only you can listen.'],compare:['calendar','Then. Now. You.','A planned comparison of the same phrase over time.']}[v];
    return `<div class="visual-cap">EVIDENCE THAT MEANS SOMETHING</div><div class="center-art">${img(data[0])}</div><h2>${data[1]}</h2><p class="visual-description">${data[2]}</p>${select('proof',[['My phrases','phrases'],['My voice','voice'],['Then / now','compare']])}`;
  }
  if(s.kind==='return'){
    const v=state.values.return||'nudge',data={nudge:['bell','“Continue your saved lesson?”','A real next step, at a time you choose.'],friends:['heart','Learn alongside a friend.','A future shared habit, with real requests and control.'],apples:['apple-currency','Earn a little extra.','Future outfits and extras. Never pay to skip learning.']}[v];
    return `<div class="visual-cap">MOTIVATION WITHOUT PRESSURE</div><div class="center-art">${img(data[0])}</div><h2>${data[1]}</h2><p class="visual-description">${data[2]}</p>${select('return',[['Reminders','nudge'],['Friends','friends'],['Apples','apples']])}`;
  }
  const v=state.values.control||'voice',data={voice:['glyph-mic-coral','Save my voice','You choose. Saved clips can be deleted.'],reminder:['bell','Practice reminders','Choose a time—or turn them off.'],quiet:['glyph-mic-off-violet','Speak right now','You can keep learning without speaking.']}[v];
  const on=state.values[`toggle-${v}`]!==false;
  return `<div class="visual-cap">YOUR CHOICES STAY YOURS</div><div class="center-art small">${img(data[0])}</div><h2>${data[1]}</h2><p class="visual-description">${data[2]}</p><button class="demo-toggle" data-toggle="${v}" role="switch" aria-checked="${on}" aria-label="Preview ${esc(data[1].toLowerCase())}"><span>${on?'On':'Off'}</span><i><b></b></i></button>${select('control',[['Voice','voice'],['Reminders','reminder'],['Speaking','quiet']])}<p class="visual-note">Preview only. Your real app settings stay unchanged.</p>`;
}

function tour(id){
  let i=slides.findIndex(s=>s.id===id);if(i<0)i=0;state.step=i;state.lastTour=slides[i].id;const s=slides[i];
  $('#tour-link').href=`#tour/${s.id}`;
  $('#stage').className='tour-stage';
  $('#stage').innerHTML=`<section class="slide" aria-labelledby="slide-title"><div class="slide-copy"><div class="eyebrow">${s.topic}</div><h1 id="slide-title" tabindex="-1">${s.title}</h1><p class="summary">${s.summary}</p><div class="slide-tools"><button class="more-button" data-more>A little more <span>+</span></button><button class="listen-button" data-listen aria-pressed="false"><span aria-hidden="true">▷</span> Listen</button></div><p class="maturity ${s.type}"><i></i>${s.status}</p></div><div class="illustration" role="group" aria-label="Interactive example">${visual(s)}</div></section>`;
  $('#controls').className='tour-controls';
  $('#controls').innerHTML=`<button class="back-button" data-move="-1" ${i===0?'disabled':''}>← Back</button><div class="position"><span>${i+1} of ${slides.length}</span><div class="track" role="progressbar" aria-label="Tour progress" aria-valuemin="1" aria-valuemax="${slides.length}" aria-valuenow="${i+1}"><i style="width:${100*(i+1)/slides.length}%"></i></div></div><button class="next-button" data-move="1">${i===slides.length-1?'Finish tour ✓':'Next →'}</button>`;
  $('#announcement').textContent=`${i+1} of ${slides.length}. ${s.topic}.`;
}

function done(){
  $('#stage').className='done-stage';$('#stage').innerHTML=`<section class="finish"><div class="eyebrow">THE BIG PICTURE</div>${dombi('happy')}<h1 tabindex="-1">Learn it.<br>Talk with AI. Grow.</h1><p>That’s the app: practical English, a little support, and progress you can feel.</p><a class="next-button" href="#features/learn">Explore something you’re curious about →</a><a class="quiet restart" href="#tour/idea" data-restart>Start the tour again</a></section>`;
  $('#controls').className='end-controls';$('#controls').innerHTML='<span>Tour complete</span><a href="reference.html">Full reference, only if you want it ↗</a>';
}

function featureList(group,feature,query=''){
  const list=query?allFeatures.filter(f=>[f.name,f.summary,...f.detail].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0,8):group.features.map(f=>({...f,group:group.id}));
  return list.length?list.map(f=>`<a href="#features/${f.group}/${f.id}" ${feature?.id===f.id&&group.id===f.group?'aria-current="true"':''}><span>${f.name}</span><b>›</b></a>`).join(''):'<p class="no-results">No match. Try “voice”, “friends” or “course”.</p>';
}
function featurePanel(group,feature){return `<div class="feature-hero">${img(group.icon)}<span class="feature-state">${feature.status}</span></div><h2 tabindex="-1">${feature.name}</h2><p class="feature-summary">${feature.summary}</p><ul class="feature-points">${feature.detail.map(d=>`<li>${d}</li>`).join('')}</ul><a class="quiet reference-link" href="reference.html#${feature.reference}">Full detail, if you want it ↗</a>`;}
function explore(groupId,featureId){
  const group=groups.find(g=>g.id===groupId)||groups[0],feature=group.features.find(f=>f.id===featureId)||group.features[0];
  $('#stage').className='feature-stage';$('#stage').innerHTML=`<section class="explorer"><div class="explorer-heading"><div><div class="eyebrow">CHOOSE WHAT INTERESTS YOU</div><h1 tabindex="-1">One feature at a time.</h1></div><label class="feature-search"><span aria-hidden="true">⌕</span><input id="feature-search" type="search" placeholder="Find a feature" aria-label="Find a feature"></label></div><nav class="group-picker" aria-label="Feature areas">${groups.map(g=>`<a href="#features/${g.id}" ${g.id===group.id?'aria-current="true"':''}>${img(g.icon)}<span>${g.title}</span></a>`).join('')}</nav><div class="feature-layout"><nav class="feature-list" aria-label="Choose a feature">${featureList(group,feature)}</nav><article class="feature-detail">${featurePanel(group,feature)}</article></div></section>`;
  $('#controls').className='feature-controls';$('#controls').innerHTML=`<a class="back-button" href="#tour/${state.lastTour}">← Back to the tour</a><span>Details only when you choose them.</span>`;
}

function openDialog(content){
  stopListening();state.previousFocus=document.activeElement;const dialog=$('#detail');dialog.innerHTML=`<button class="close-dialog" data-close aria-label="Close details">×</button>${content}`;dialog.showModal();document.body.classList.add('dialog-open');dialog.querySelector('[data-close]').focus({preventScroll:true});
}
function more(){const s=slides[state.step];openDialog(`<div class="eyebrow">A LITTLE MORE</div><h2 id="detail-title">${s.topic}</h2><ul class="detail-points">${s.more.map(v=>`<li>${v}</li>`).join('')}</ul><a class="quiet reference-link" href="reference.html#${s.reference}">Full reference, if you want it ↗</a>`);}
function topics(){openDialog(`<div class="eyebrow">YOUR PACE</div><h2 id="detail-title">Jump to a topic.</h2><nav class="topic-list" aria-label="Tour topics">${slides.map((s,i)=>`<a href="#tour/${s.id}" data-topic><span>${i+1}</span>${s.topic}<b>→</b></a>`).join('')}</nav>`);}
$('#detail').addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(state.previousFocus?.isConnected)state.previousFocus.focus({preventScroll:true});});
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}});
$('#topic-button').onclick=topics;

function stopListening(){state.speaking=false;state.utterance=null;if('speechSynthesis' in window)window.speechSynthesis.cancel();const b=$('[data-listen]');if(b){b.innerHTML='<span aria-hidden="true">▷</span> Listen';b.setAttribute('aria-pressed','false');}}
function readUnavailable(){stopListening();const b=$('[data-listen]');if(b)b.textContent='Audio unavailable';$('#announcement').textContent='Read aloud is unavailable in this browser right now.';}
function listen(){
  if(state.speaking){stopListening();return;}
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){readUnavailable();return;}
  const s=slides[state.step];const u=new SpeechSynthesisUtterance(`${s.topic}. ${s.title.replace('<br>',' ')} ${s.summary}`);u.lang='en-GB';u.rate=.92;const voice=speechSynthesis.getVoices().find(v=>v.lang==='en-GB')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)u.voice=voice;
  state.speaking=true;state.utterance=u;$('[data-listen]').innerHTML='<span aria-hidden="true">■</span> Stop';$('[data-listen]').setAttribute('aria-pressed','true');
  const finish=()=>{if(state.utterance===u)stopListening();};u.onend=finish;u.onerror=e=>{if(state.utterance!==u)return;finish();if(e.error!=='canceled'&&e.error!=='interrupted')readUnavailable();};try{speechSynthesis.speak(u);}catch{readUnavailable();}
}
function move(direction){
  if(!location.hash.startsWith('#tour/'))return;
  const index=state.step+direction;if(index>=slides.length){location.hash='done';return;}if(index<0)return;location.hash=`tour/${slides[index].id}`;
}
function redrawExample(key,value){
  state.values[key]=value;if(key==='aiMode')state.values.aiTurn=0;const x=scrollX,y=scrollY;$('.illustration').innerHTML=visual(slides[state.step]);
  const button=[...document.querySelectorAll(`[data-pick="${key}"]`)].find(b=>b.dataset.value===String(value));button?.focus({preventScroll:true});scrollTo(x,y);
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button,a');if(!button||button.disabled)return;
  if(button.getAttribute('href')==='#stage'){e.preventDefault();$('#stage').focus({preventScroll:true});return;}
  if(button.hasAttribute('data-more'))more();
  else if(button.hasAttribute('data-listen'))listen();
  else if(button.hasAttribute('data-close'))$('#detail').close();
  else if(button.dataset.move)move(+button.dataset.move);
  else if(button.dataset.pick)redrawExample(button.dataset.pick,button.dataset.value);
  else if(button.dataset.scene){state.values.scene=+button.dataset.scene;$('.illustration').innerHTML=visual(slides[state.step]);$('[data-scene]').focus({preventScroll:true});}
  else if(button.hasAttribute('data-ai-turn')){state.values.aiTurn=+button.dataset.aiTurn;$('.illustration').innerHTML=visual(slides[state.step]);$('[data-ai-turn]').focus({preventScroll:true});}
  else if(button.dataset.toggle){const key=`toggle-${button.dataset.toggle}`;state.values[key]=state.values[key]===false;$('.illustration').innerHTML=visual(slides[state.step]);$('[data-toggle]').focus({preventScroll:true});}
  if(button.hasAttribute('data-restart'))state.values={};
  if(button.hasAttribute('data-topic')){state.previousFocus=null;$('#detail').close();if(button.hash===location.hash)$('#stage h1')?.focus({preventScroll:true});}
});
document.addEventListener('input',e=>{
  if(e.target.id!=='feature-search')return;
  const parts=location.hash.split('/'),group=groups.find(g=>g.id===parts[1])||groups[0];state.query=e.target.value.trim();
  const first=state.query?allFeatures.find(f=>[f.name,f.summary,...f.detail].join(' ').toLowerCase().includes(state.query.toLowerCase())):group.features[0];
  const selectedGroup=first?.group?groups.find(g=>g.id===first.group):group;
  $('.feature-list').innerHTML=featureList(selectedGroup,first,state.query);
  $('.feature-detail').innerHTML=first?featurePanel(selectedGroup,first):'<h2>Try a different word.</h2><p class="feature-summary">You can also choose an area above.</p>';
  document.querySelectorAll('.group-picker a').forEach(a=>a.setAttribute('aria-current',String(!!first&&a.hash===`#features/${selectedGroup.id}`)));
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')stopListening();
  if(!location.hash.startsWith('#tour/')||$('#detail').open||e.target.matches('input,textarea,select')||e.target.closest('.options,.tab-choices,.lesson-track'))return;
  if(e.key==='ArrowRight'){move(1);e.preventDefault();}else if(e.key==='ArrowLeft'){move(-1);e.preventDefault();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopListening();});
let touch;
$('#stage').addEventListener('pointerdown',e=>{touch=e.pointerType==='touch'&&!e.target.closest('button,a,input')?{x:e.clientX,y:e.clientY}:null;});
$('#stage').addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>85&&Math.abs(dy)<45)move(dx<0?1:-1);});
$('#stage').addEventListener('pointercancel',()=>{touch=null;});

function route(initial=false){
  const raw=location.hash.slice(1),parts=raw.split('/');
  if(bookIds.has(raw)||raw.startsWith('exercise-')||raw.startsWith('course-level-')){location.replace(`reference.html#${raw}`);return;}
  stopListening();if($('#detail').open){state.previousFocus=null;$('#detail').close();}
  const featureMode=parts[0]==='features';$('#tour-link').setAttribute('aria-current',featureMode?'false':'page');$('#features-link').setAttribute('aria-current',featureMode?'page':'false');
  if(featureMode){state.query='';explore(parts[1],parts[2]);}else if(raw==='done')done();else tour(parts[0]==='tour'?parts[1]:'idea');
  if(!raw){history.replaceState(null,'','#tour/idea');}
  scrollTo(0,0);if(!initial)$('#stage h1')?.focus({preventScroll:true});
  window.PRESENTATION=Object.freeze({step:state.step,total:slides.length,features:allFeatures.length,view:featureMode?'features':raw==='done'?'done':'tour'});
}
addEventListener('hashchange',()=>route());
route(true);
