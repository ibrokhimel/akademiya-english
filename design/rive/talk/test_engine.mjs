import { buildTrack, VNAME, g2pUz, g2pRu, g2pEn } from './engine.js';
import { dictionary } from '../node_modules/cmu-pronouncing-dictionary/index.js';
const show = (lang, text) => {
  const tr = buildTrack(text, lang, { dict: dictionary });
  console.log(`\n[${lang}] ${text}  (${Math.round(tr.total)} ms)`);
  for (const w of tr.words) console.log('  ', w.text.padEnd(12), w.phones.map(p => p.ph + (p.stress ? 'ˈ' : '')).join(' '));
  console.log('   →', tr.segs.map(s => `${VNAME[s.v]}:${Math.round(s.dur)}`).join(' '));
};
show('en', "Hello! I'm Dombi. Let's practise speaking English together.");
show('en', 'Thank you very much, Bobur.');
show('uz', "Salom! Men Dombi. Keling, birga ingliz tilida gaplashamiz.");
show('uz', "Rahmat, o'qituvchi. G'alaba qo'shiq ma'no.");
show('ru', 'Привет! Я Домби. Давай вместе говорить по-английски.');
show('ru', 'Спасибо, хорошо. Что нового?');
