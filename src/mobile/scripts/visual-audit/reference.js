import { loadContent, C } from '/src/web/content.js';
import { loadPeople, People, setDark } from '/src/web/people.js';
import { progressOf } from '/src/core/progress.js';
import { answerOf, tilesOf } from '/src/core/text.js';
import { showLearn } from '/src/web/learn.js';
import { renderProfile, settingsPage, recordingsPage } from '/src/web/profilepage.js';
import { renderProgress, thingsICanSay, streakCalendar } from '/src/web/progresspage.js';
import { onboarding, createAccount } from '/src/web/onboarding.js';
import * as States from '/src/web/states.js';
import * as Finish from '/src/web/finish.js';
import * as Moments from '/src/web/moments.js';
import { playLesson } from '/src/web/player.js';
import { Rec } from '/src/web/record.js';

const phone = document.querySelector('#phone'), screen = document.querySelector('#screen');
await loadContent(); await loadPeople(); await M.initPop(); await SND.ready;
SND.out.gain.value = 0;
const mic = await W.mic(); document.querySelector('#park').appendChild(mic.el);
M.pressable(mic.btn, () => { if (mic.onTap) mic.onTap(); });
// The original app hides the Rive startup frames before showing a screen.
await new Promise(resolve => setTimeout(resolve, 2600));
window.APP = { C, ready: true };
const cases = await fetch('/src/mobile/src/audit/cases.json').then(r => r.json());
let cleanup;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function fixture(config) {
  const today = new Date(), at = days => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, 12).toISOString();
  const events = [{ client_id: 'audit-onboarding', type: 'onboarding', at: at(-10), confidence: 2 }];
  if (config.populated) for (let i = 0; i < 6; i++) events.push({ client_id: 'audit-lesson-' + (i + 1), type: 'lesson', id: 'l' + (i + 1), at: at(i - 5), accuracy: i === 3 ? 83 : 100, mistakes: i === 3 ? 2 : 0, spokenMs: 83000, skipped: 0 });
  if(config.id==='calendar-previous')events.unshift({client_id:'audit-previous-month',type:'lesson',id:'l1',at:new Date(today.getFullYear(),today.getMonth(),0,12).toISOString(),accuracy:100,mistakes:0});
  const settings = { dark: config.dark, sound: false, speaking: config.speaking ?? true, saveVoice: config.saveVoice ?? true, reminder: '19:00', cast: 'uk', name: config.populated ? 'Ibrokhim' : '', goal: 'ielts', openAll: true, joined: at(-10) };
  const ctx = { phone, screen, C, events, settings, now: () => new Date(), progress: () => progressOf(C.units, events, { now: new Date(), openAll: true }), firstConfidence: 2, rec: Rec,
    set(k,v) { settings[k]=v; }, shiftDays() {}, notReady: () => States.notReady(ctx), show: name => States[name === 'feedback' ? 'feedbackForm' : 'confidenceAgain'](ctx), logOut() {}, deleteAccount() {}, saveFeedback() {}, where: () => 'visual-audit', practise() {} };
  return ctx;
}
function tabbar(selected) {
  const el = document.createElement('div'); el.className = 'tabbar';
  el.style.cssText = 'position:absolute;top:auto;bottom:0;left:0;right:0';
  el.innerHTML = ['home','progress','profile'].map((name,i) => `<div class="tab${i===selected?' on':''}"><img src="/pendev/icons-r2/tab-${name}.png" alt=""></div>`).join('');
  phone.appendChild(el);
}
function makeTone(ms) {
  const rate=16000,n=Math.round(rate*ms/1000),buffer=new ArrayBuffer(44+n*2),v=new DataView(buffer);
  const text=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  text(0,'RIFF');v.setUint32(4,36+n*2,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,n*2,true);
  return new Blob([buffer],{type:'audio/wav'});
}
const launch = promise => { if (promise?.catch) promise.catch(error => console.error(error)); };
window.AUDIT = {
  answerWords() { return tilesOf(answerOf(window.APP.now.item,C.P)); },
  listen() { launch(mic.speak(true,60000)); },
  async show(id,dark) {
    const entry=cases.find(c=>c.id===id); if(!entry) throw new Error('Unknown case '+id);
    const c={...entry.native,id,dark}; window.AUDIT.current=entry;
    if(cleanup) { cleanup(); cleanup=null; }
    People.home(); mic.abort?.();
    for(const child of [...phone.children]) if(child!==screen) child.remove();
    screen.innerHTML=''; document.body.classList.toggle('dark',dark);setDark(dark);
    await Rec.clear();
    if(c.populated) for(const [i,id] of ['hello','hi','good-morning'].entries()) await Rec.save(id,makeTone(1800+i*200));
    if(c.populated) await new Promise((resolve,reject)=>{
      const request=indexedDB.open('akademiya',1);
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('voice','readwrite'),store=tx.objectStore('voice');
        ['hello','hi','good-morning'].forEach((id,i)=>{
          const get=store.get(id);get.onsuccess=()=>{
            const today=new Date();
            store.put({...get.result,at:new Date(today.getFullYear(),today.getMonth(),today.getDate()-i,12).toISOString()});
          };
        });
        tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
      };
    });
    const ctx=fixture(c); window.AUDIT.ctx=ctx;
    const contentHost=()=>{screen.innerHTML='<div class="audit-host" style="position:absolute;inset:0 0 94px"></div>';return screen.firstChild;};
    switch(c.kind) {
      case 'onboarding': {
        launch(onboarding(ctx));
        await wait(140);
        const names=['welcome','meet','goal','level','achieve','confidence','mic','listen','heard','promise','reminder'];
        window.AUDIT_OB.go(names[c.step]);
        break;
      }
      case 'account':
        if(c.mode==='login') {launch(onboarding(ctx));await wait(140);window.AUDIT_OB.go('login');}
        else launch(createAccount(ctx));
        break;
      case 'learn': launch(showLearn(phone,screen,{p:ctx.progress(),ctx,tab:'learn'}));break;
      case 'profile': cleanup=renderProfile(contentHost(),ctx);tabbar(2);break;
      case 'progress': cleanup=renderProgress(contentHost(),ctx);tabbar(1);break;
      case 'settings': launch(settingsPage(ctx));break;
      case 'recordings': launch(recordingsPage(ctx));break;
      case 'phrases': launch(thingsICanSay(ctx));break;
      case 'calendar': launch(streakCalendar(ctx));break;
      case 'feedback': launch(States.feedbackForm(ctx));break;
      case 'confidence': launch(States.confidenceAgain(ctx));break;
      case 'moment': {
        const lesson=c.checkpoint?C.lessons.find(l=>l.checkpoint):C.lessons[0];
        if(c.phase==='mistakes') launch(Finish.mistakesCard(screen,3));
        else if(c.phase==='canSay') launch(Finish.canSay(phone,screen,lesson));
        else if(c.phase==='result'&&c.checkpoint) launch(Moments.trophyScreen(phone,screen,lesson,lesson.unit,c.mistakes||0));
        else if(c.phase==='result') launch(Finish.result(phone,screen,lesson,{accuracy:c.perfect?100:83,perfect:!!c.perfect,mistakes:c.perfect?0:2,skipped:0},83000));
        else if(c.phase==='level') launch(Moments.levelUp(phone,screen,1));
        else if(c.phase==='streak') {const p=ctx.progress();launch(Moments.streakScreen(screen,{...p.streak,count:6},{...p.streak,count:7}));}
        break;
      }
      case 'exercise': {
        if (c.checkpoint) { launch(playLesson(C.lessons.find(l=>l.checkpoint),{phone,screen,mic,speaking:c.speaking??true})); break; }
        const parent=C.lessons.find(l=>!l.checkpoint&&l.items.some(it=>it.ex===c.exercise))||C.lessons[0];
        const item=parent.items.find(it=>it.ex===c.exercise)||parent.items[0];
        const lesson={...parent,id:'visual-audit',items:[item,...parent.items.filter(other=>other!==item)]};
        const speaking=(entry.id==='exercise-tiles-right'||entry.id==='exercise-tiles-wrong')?false:(c.speaking??true);
        launch(playLesson(lesson,{phone,screen,mic,speaking}));break;
      }
      case 'practice': launch(playLesson({id:'practice',title:'',items:[{ex:'meet',p:'hello'}],new:[]},{phone,screen,mic,speaking:c.speaking??true,quiet:true}));break;
      case 'problem': {
        const names={'offline':'showOffline','mic-blocked':'micBlocked','speech-unavailable':'speechUnavailable','not-ready':'notReady','not-found':'notReady','error':'errorScreen'};
        launch(States[names[c.state]](ctx,new Error('visual-audit')));break;
      }
      case 'controls': {
        if(c.control==='options'){launch(onboarding(ctx));await wait(140);window.AUDIT_OB.go('goal');}
        else if(['segments','dialog','time-wheel'].includes(c.control)) launch(settingsPage(ctx));
        else if(c.control==='streak-week') cleanup=renderProgress(contentHost(),ctx);
        else if(c.control==='text-input') launch(createAccount(ctx));
        else if(c.control==='toast') launch(States.feedbackForm(ctx));
        else if(c.control==='progress') launch(playLesson(C.lessons[0],{phone,screen,mic,speaking:false}));
        else if(c.control==='toggles') screen.innerHTML='<div style="padding:20px;display:flex;flex-direction:column;gap:16px"><button class="toggle on"><i style="translate:20px 0"></i></button><button class="toggle"><i></i></button></div>';
        else if(c.control==='icons') screen.innerHTML='<div style="padding:20px;display:flex;flex-wrap:wrap;gap:20px">'+['tab-home','tab-progress','tab-profile','flame-streak','trophy-unit','bubble-phrases','repeat','glyph-speaker-violet','glyph-mic-grey','face-pleading','face-dizzy','face-smile','face-grin','face-starstruck'].map(n=>`<img style="width:40px;height:40px" src="/pendev/icons-r2/${n}.png">`).join('')+'</div>';
        else screen.innerHTML='<div style="padding:20px;display:flex;flex-direction:column;gap:16px">'+['primary','secondary','green','gold','danger','disabled'].map(k=>`<button class="p3d btn ${k}"><span class="face">DAVOM ETISH</span></button>`).join('')+'<button class="link">KEYINROQ</button></div>';
        if (['buttons', 'toggles', 'icons'].includes(c.control)) screen.firstElementChild.style.marginTop = '44px';
        break;
      }
    }
    await wait(700);
    return entry;
  },
  metrics() {
    const root=phone.getBoundingClientRect();const texts=[];const walker=document.createTreeWalker(phone,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {const node=walker.currentNode;if(!node.textContent.trim())continue;const el=node.parentElement,css=getComputedStyle(el);if(css.display==='none'||css.visibility==='hidden'||+css.opacity===0)continue;const range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;texts.push({text:node.textContent.trim(),x:r.x-root.x,y:r.y-root.y,width:r.width,height:r.height,fontSize:css.fontSize,fontWeight:css.fontWeight,fontFamily:css.fontFamily,color:css.color,lineHeight:css.lineHeight});}
    const elements=[...phone.querySelectorAll('button,input,textarea,img,.face,.speech,.sheet,.tab,.toggle,.tgl')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return{tag:el.tagName,className:el.className,text:el.tagName==='IMG'?el.getAttribute('src'):el.textContent.trim(),x:r.x-root.x,y:r.y-root.y,width:r.width,height:r.height,border:c.border,padding:c.padding,borderRadius:c.borderRadius,background:c.backgroundColor};});
    return {id:this.current.id,texts,elements};
  },
};
window.AUDIT.ready=true;
