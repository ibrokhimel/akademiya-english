// The browser version of Akademiya English: the whole MVP, for testing (docs/ideas/tech-stack.md §0).
// Open http://127.0.0.1:8791/src/web/ (the lab's server, design/motion/serve.js, serves the whole project).
import { loadContent, C } from './content.js';
import { loadPeople, setDark } from './people.js';
import { showLearn } from './learn.js';
import { playLesson } from './player.js';
import { streakScreen, trophyScreen, levelUp } from './moments.js';
import { onboarding, createAccount } from './onboarding.js';
import { renderProgress, thingsICanSay } from './progresspage.js';
import { renderProfile } from './profilepage.js';
import { Rec } from './record.js';
import * as St from './states.js';
import { progressOf } from '../core/progress.js';
import { hearReady } from './hear.js';

const phone = document.querySelector('#phone'), screen = document.querySelector('#screen'), shell = document.querySelector('#shell');
// The screens are drawn 390 wide. On a computer the phone is shown whole, as large as the window allows; on a phone it fills the screen.
function fit() { const w = innerWidth, h = innerHeight, full = w <= 520; document.body.classList.toggle('full', full);
  const k = full ? w / 390 : Math.min(1, (h - 32) / 844), ph = full ? h / k : 844;
  phone.style.height = ph + 'px'; phone.style.transform = `scale(${k})`; shell.style.width = 390 * k + 'px'; shell.style.height = ph * k + 'px'; }
addEventListener('resize', fit); fit();
// Reduce Motion follows the system setting
const rm = matchMedia('(prefers-reduced-motion: reduce)'); M.reduce = rm.matches; rm.addEventListener('change', () => { M.reduce = rm.matches; });

// What happened is kept as a list that only grows (the same list the phone app will send to the server); the rest is worked out from it.
const store = { get(k, v) { try { const s = localStorage.getItem('akademiya.' + k); return s == null ? v : JSON.parse(s); } catch (e) { return v; } },
  set(k, v) { try { localStorage.setItem('akademiya.' + k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem('akademiya.' + k); } catch (e) {} } };
let events = store.get('events', []);
const push = (e) => { events.push({ ...e, at: now().toISOString() }); store.set('events', events); };
// settings: what the learner chose (saved one by one)
const S = { dark: store.get('dark', false), speaking: store.get('speaking', true), sound: store.get('sound', true), reminder: store.get('reminder', '19:00'), goal: store.get('goal', null),
  saveVoice: store.get('saveVoice', false), openAll: store.get('openAll', false), cast: C.cast, name: store.get('name', null), joined: store.get('joined', null), dayShift: store.get('dayShift', 0) };
const now = () => new Date((window.APP_TEST && window.APP_TEST.now ? +new Date(window.APP_TEST.now) : Date.now()) + S.dayShift * 864e5);
const progress = () => progressOf(C.units, events, { now: now(), openAll: S.openAll });
const firstConfidence = () => { const e = events.find((x) => x.type === 'onboarding'); return e ? e.confidence : null; };
let where = 'boot';

// one object for every page that needs the app (Progress, Profile, Settings, the pop-ups)
const ctx = {
  phone, screen, C, rec: Rec, now, progress, settings: S,
  get events() { return events; }, get firstConfidence() { return firstConfidence(); }, where: () => where,
  set(k, v) { S[k] = v;
    if (k === 'cast') { try { localStorage.setItem('akademiya.voices', v); } catch (e) {} loadContent(); } else store.set(k, v);
    if (k === 'dark') { document.body.classList.toggle('dark', v); setDark(v); }
    if (k === 'sound') SND.out.gain.value = v ? 1 : 0;
    document.dispatchEvent(new CustomEvent('akademiya-settings', { detail: { k, v } })); },
  shiftDays(n) { S.dayShift = n ? S.dayShift + n : 0; store.set('dayShift', S.dayShift); location.reload(); },
  notReady: () => St.notReady(ctx),
  saveFeedback: (f) => push({ type: 'feedback', ...f }),
  async show(name) { const A = { feedback: () => St.feedbackForm(ctx), confidence: () => St.confidenceAgain(ctx), offline: () => St.showOffline(ctx), micBlocked: () => St.micBlocked(ctx),
    speech: () => St.speechUnavailable(ctx), error: () => St.errorScreen(ctx, new Error('test')), notReady: () => St.notReady(ctx) }; if (A[name]) await A[name](); },
  logOut() { store.set('loggedOut', true); location.reload(); },
  async deleteAccount() { await Rec.clear(); try { Object.keys(localStorage).filter((k) => k.startsWith('akademiya.')).forEach((k) => localStorage.removeItem(k)); } catch (e) {} location.reload(); },
  async practise(id) { await practise(id); },
};
window.APP = { C, ready: false, ctx, get events() { return events; }, progress };

// ---------- a lesson and what comes after it: result, trophy, level up, streak ----------
let mic;
const speechProblem = (kind) => (kind === 'nomic' ? St.micBlocked(ctx) : St.speechUnavailable(ctx));
async function runLesson(lesson, resume = null) {
  where = lesson.id; const was = progress();
  const out = await playLesson(lesson, { phone, screen, mic, speaking: S.speaking, resume, onSpeech: speechProblem,
    keepVoice: S.saveVoice ? (id, blob) => Rec.save(id, blob) : null,
    onProgress: (st) => store.set('inLesson', st) });
  store.del('inLesson'); if (!out.done) return null;
  push({ type: 'lesson', id: lesson.id, accuracy: out.stats.accuracy, mistakes: out.stats.mistakes, spokenMs: Math.round(out.spokenMs), skipped: out.stats.skipped });
  const is = progress();
  if (lesson.checkpoint) { const unit = C.units.find((u) => u.checkpoint.id === lesson.id);
    await trophyScreen(phone, screen, lesson, unit, out.stats.mistakes);
    if (is.level > was.level) await levelUp(phone, screen, is.level); }
  if (is.streak.today && !was.streak.today) await streakScreen(screen, was.streak, is.streak);      // the first lesson of the day
  // about two weeks after the start: the confidence question again (30), once
  const ob = events.find((x) => x.type === 'onboarding');
  if (ob && !events.some((x) => x.type === 'confidence') && now() - new Date(ob.at) >= 13.5 * 864e5) { const r = await St.confidenceAgain(ctx); if (r && r.value) push({ type: 'confidence', value: r.value }); }
  return { before: was, after: { id: lesson.id } };
}
// "practise again" from the list of phrases: one listen-and-repeat, no result screens
async function practise(id) {
  const host = document.createElement('div'); host.className = 'practice'; phone.appendChild(host);
  await playLesson({ id: 'practice', title: '', items: [{ ex: 'meet', p: id }], new: [] }, { phone, screen: host, mic, speaking: S.speaking, quiet: true, onSpeech: speechProblem,
    keepVoice: S.saveVoice ? (pid, blob) => Rec.save(pid, blob) : null });
  host.remove(); document.dispatchEvent(new CustomEvent('akademiya-refresh'));
}

async function main() {
  document.body.classList.toggle('dark', S.dark);
  await loadContent(); S.cast = C.cast; await loadPeople(); window.APP.hearing = await hearReady();      // speech to text: the server on this PC, else the browser's own
  mic = await W.mic(); document.querySelector('#park').appendChild(mic.el); mic.onTap = null; M.pressable(mic.btn, () => { if (mic.onTap) mic.onTap(); });
  await SND.ready; SND.out.gain.value = S.sound ? 1 : 0; await M.wait(1200);                     // the Rive views have had their start-up moment by now
  const boot = document.querySelector('#boot'); await M.anim(boot, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }); boot.remove();
  window.APP.ready = true; St.watchOnline(ctx);
  const byId = Object.fromEntries(C.units.flatMap((u) => [...u.lessons, u.checkpoint].map((l) => [l.id, l])));
  let next = null;

  // ---------- first run: onboarding, Lesson 1, then the account (screen 10) ----------
  if (!events.some((e) => e.type === 'onboarding') || store.get('loggedOut', false)) {
    where = 'onboarding';
    const ob = await onboarding({ phone, screen, hasAccount: (m) => store.get('account', null) === m && events.length > 0, micBlocked: () => St.micBlocked(ctx) });
    if (ob.loggedIn) store.del('loggedOut');
    else {
      if (store.get('loggedOut', false)) { await Rec.clear(); events = []; store.del('loggedOut'); }            // "start fresh" after logging out
      for (const k of ['goal', 'reminder', 'saveVoice']) if (ob[k] != null) ctx.set(k, ob[k]); if (!ob.micOk) ctx.set('speaking', false);
      S.joined = now().toISOString(); store.set('joined', S.joined); push({ type: 'onboarding', ...ob }); store.set('needAccount', ob.method || true);
    }
  }
  const resume = store.get('inLesson', null);                                                     // a reload in the middle of a lesson: straight back to it
  if (resume && byId[resume.id]) next = await runLesson(byId[resume.id], resume);
  else if (store.get('needAccount', false) && !events.some((e) => e.type === 'lesson')) next = await runLesson(byId.l1);
  const need = store.get('needAccount', false);
  if (need && events.some((e) => e.type === 'lesson')) { where = 'account';
    const acc = await createAccount({ phone, screen }, { method: typeof need === 'string' ? need : null });
    if (acc.name) ctx.set('name', acc.name); if (acc.signIn) { store.set('account', acc.signIn); push({ type: 'account', method: acc.signIn }); }
    store.del('needAccount'); }

  // ---------- the app: the Learn page and its tabs ----------
  let tab = 'learn';
  const tabs = { progress: (host) => renderProgress(host, ctx), profile: (host) => renderProfile(host, ctx) };
  for (;;) {
    where = 'learn';
    const pick = await showLearn(phone, screen, { p: progress(), before: next && next.before, after: next && next.after, ctx, tab, tabs });
    next = null; tab = pick.tab || 'learn';
    if (pick.refresh) continue;
    if (pick.lesson) next = await runLesson(pick.lesson);
  }
}

// 31e: anything that breaks shows the error screen instead of a frozen page
let failing = false;
async function broke(err) { console.error(err); if (failing || !window.APP.ready) return; failing = true;
  const pick = await St.errorScreen(ctx, err); if (pick === 'report') await St.feedbackForm(ctx); location.reload(); }
addEventListener('error', (e) => broke(e.error || e.message)); addEventListener('unhandledrejection', (e) => broke(e.reason));
main().catch((e) => { console.error(e); const b = document.querySelector('#boot'); if (b) b.innerHTML = `<b>Ochilmadi</b><span>${e.message}</span>`; else broke(e); });
