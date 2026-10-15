// node check-lessons.js [dark]  -> captures/ls-*.png
// Opens every lesson on the lessons page and counts what is missing (a picture, a sound), then plays three lines and
// watches the words light up and the waiter's mouth move with the sound.
const S = '.lwrap', open = (id) => ['click', `#lnav [data-id="${id}"]`];
const ALL = ['l1', 'l2', 'l3', 'l4', 'l5', 'c1', 'l6', 'l7', 'l8', 'l9', 'l10', 'c2', 'l11', 'l12', 'l13', 'l14', 'l15', 'c3'];
// plays a line and samples it: how many words lit up, which mouth shapes were shown, how long it took against the clip's length
const sample = (sel) => new Function(`return (${String(sampler).replace('SEL', JSON.stringify(sel))})()`);      // the page gets the function as text, so the line to play is written into it
const sampler = async () => { const el = document.querySelector(SEL), c = LESSONS.index()[el.dataset.f], part = el.dataset.slow ? c.slow : c, vm = LESSONS.vm[c.voice];
  const lit = new Set(), shapes = new Set(), t0 = performance.now(); const done = LESSONS.play(el);
  await new Promise((r) => { const text = el.dataset.slow ? el.previousElementSibling : el, tick = () => { text.querySelectorAll('.w.now').forEach((w) => lit.add([...text.querySelectorAll('.w')].indexOf(w))); if (vm && vm.boolean('talking').value) shapes.add(vm.number('viseme').value);
    if (performance.now() - t0 < part.ms + 150) requestAnimationFrame(tick); else r(); }; tick(); }); await done;
  return { line: c.text + (el.dataset.slow ? ' (slow)' : ''), who: c.voice, words: part.words.length, wordsLit: lit.size, mouthShapes: [...shapes].sort((a, b) => a - b).join(' '), clipMs: part.ms }; };
require('./check-lib')('lessons.html', 'ls', [
  ['eval', async () => { const out = { lines: 0, noSound: [], noPicture: [] };
    for (const b of document.querySelectorAll('#lnav button')) { b.click(); await new Promise((r) => setTimeout(r, 250));
      out.lines += document.querySelectorAll('#lmain .line:not(.slow)').length;
      document.querySelectorAll('#lmain .line.nofile').forEach((l) => out.noSound.push(b.dataset.id + ': ' + l.dataset.f)); document.querySelectorAll('#lmain .pic.none').forEach((p) => out.noPicture.push(b.dataset.id + ': ' + p.textContent)); }
    return out; }],
  open('l6'), ['wait', 400], ['shot', S, 'l6'],
  ['eval', sample('#lmain .talk .line')],                 // the waiter's "Hello!" in the café conversation
  ['eval', sample('#lmain .newrow .card:nth-child(3) .line')],                 // "An orange juice, please."
  ['eval', sample('#lmain .newrow .card:nth-child(3) .line.slow')],
  open('l1'), ['wait', 400], ['shot', S, 'l1'],
  open('l14'), ['wait', 400], ['shot', S, 'l14'], ['eval', sample('#lmain .newrow .card:nth-child(1) .line')],   // the seller: "Small, medium or large?"
  ['shot', '#lspeak', 'speaker'],
  open('c3'), ['wait', 400], ['shot', S, 'c3'],
], { width: 1240, height: 1500 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
