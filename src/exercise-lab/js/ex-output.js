// Exercises E9–E16: Echo, Sound Duel, Spot the Rule, Fix It, Quick Reply.

/* E9 Echo Line: repeat right after the speaker (shadowing). */
function echoLine(card) {
  if (speakingOnly(card)) return;
  runQueue(card, ECHO, (it, body, done) => {
    body.append(bubble(it.who, it.t), audioBtn(it.t, '🔊 Hear it again'));
    say(it.t, { pitch: it.who === 'Waiter' ? 0.8 : 1.2 });
    body.append(speakInput({
      target: it.t, prompt: 'Repeat right after it',
      onResult: (said) => {
        const r = compare(it.t, said);
        feedback(body, {
          kind: r.pass ? 'good' : 'near',
          node: h('div', { class: 'answer' }, chips(r), r.pass ? null : h('p', { class: 'hint' }, 'Tap an orange word to hear it.')),
          onNext: () => done(r.pass),
        });
      },
    }));
  });
}

/* E10 Which One? Fast minimal-pair listening rounds. */
function whichOne(card) {
  if (S.mode === 'silent') {
    card.replaceChildren(h('div', { class: 'fb near' }, h('p', { class: 'fb-t' }, 'This one needs sound'),
      h('p', {}, 'Switch to Headphones or Full mode to play Which One?')));
    return;
  }
  const rounds = shuffle(PAIRS.flatMap((p) => [{ p, w: p[0] }, { p, w: p[1] }])).slice(0, 8);
  let i = 0, score = 0;
  const counter = h('p', { class: 'hint' });
  const btns = h('div', { class: 'duel' });
  let timer = null;
  S.cleanup = () => clearTimeout(timer);
  function round() {
    if (i >= rounds.length) {
      card.replaceChildren(h('div', { class: 'done' },
        h('p', { class: 'done-k' }, `${score} of ${rounds.length} heard right`),
        h('button', { class: 'btn', onclick: () => whichOne(card) }, 'Play again')));
      return;
    }
    const r = rounds[i];
    counter.textContent = `Round ${i + 1} of ${rounds.length}`;
    btns.replaceChildren(...r.p.map((w) => {
      const b = h('button', { class: 'duel-b' }, w);
      b.addEventListener('click', () => {
        const ok = w === r.w;
        if (ok) score++;
        tone(ok);
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) [...btns.children].find((x) => x.textContent === r.w).classList.add('right');
        [...btns.children].forEach((x) => { x.disabled = true; });
        i++;
        timer = setTimeout(round, ok ? 500 : 1100);
      });
      return b;
    }));
    say(r.w, { rate: 0.85 });
  }
  card.replaceChildren(counter, h('p', { class: 'q' }, 'Which word did you hear?'),
    h('button', { class: 'play big', onclick: () => rounds[i] && say(rounds[i].w, { rate: 0.85 }) }, '🔊 Hear again'), btns);
  round();
}

/* E11 Say Both: say two words that differ by one sound. */
function sayBoth(card) {
  if (S.mode === 'headphones' && speakingOnly(card, h('button', { class: 'btn', onclick: () => go('E10') }, 'Practise the same sounds in Which One?'))) return;
  if (speakingOnly(card)) return;
  runQueue(card, PAIRS.slice(0, 3).map((p) => ({ a: p[0], b: p[1] })), (it, body, done) => {
    const res = {};
    const stage = h('div');
    body.append(h('p', { class: 'q' }, 'Say both words. Make them sound different.'),
      h('div', { class: 'pair' }, h('div', { class: 'pw' }, it.a, ' ', audioBtn(it.a)), h('div', { class: 'pw' }, it.b, ' ', audioBtn(it.b))),
      stage);
    function ask(k) {
      stage.replaceChildren(speakInput({
        target: it[k], prompt: `Say “${it[k]}”`,
        onResult: (said) => {
          res[k] = norm(said);
          if (k === 'a') ask('b'); else finish();
        },
      }));
    }
    function finish() {
      const okA = res.a.split(' ').includes(it.a), okB = res.b.split(' ').includes(it.b);
      const ok = okA && okB;
      feedback(body, {
        kind: ok ? 'good' : okA || okB ? 'near' : 'notyet',
        node: h('p', {}, `Heard “${res.a}” and “${res.b}”.`),
        onNext: () => done(ok),
      });
    }
    ask('a');
  });
}

/* E12 Find the Pattern: guess the rule from examples, confirm in Uzbek/Russian. */
function findPattern(card) {
  runQueue(card, PATTERNS, (it, body, done) => {
    const ul = h('ul', { class: 'examples' });
    it.ex.forEach((x) => { const li = h('li'); li.innerHTML = x; ul.append(li); });
    const right = it.opts.find((o) => o.ok);
    body.append(h('p', { class: 'hint' }, 'Look at the examples'), ul, h('p', { class: 'q' }, it.q),
      h('div', { class: 'choices' }, shuffle(it.opts).map((o) => h('button', {
        class: 'choice',
        onclick: () => feedback(body, { kind: o.ok ? 'good' : 'notyet', title: o.ok ? 'You found it' : null, correct: o.ok ? null : right.t, why: it.why, onNext: () => done(!!o.ok) }),
      }, o.t))));
  });
}

/* E13 Tap the Mistake: find the typical Uzbek/Russian mistake. */
function tapMistake(card) {
  runQueue(card, MISTAKES, (it, body, done) => {
    const fixed = it.words.map((w, i) => (i === it.wrong ? it.fix : w)).join(' ');
    const words = h('div', { class: 'words' });
    it.words.forEach((w, i) => words.append(h('button', {
      class: 'word',
      onclick: () => {
        const ok = i === it.wrong;
        words.children[it.wrong].classList.add('hit');
        feedback(body, { kind: ok ? 'good' : 'notyet', title: ok ? 'Good catch' : null, correct: fixed, why: it.why, onNext: () => done(ok) });
      },
    }, w)));
    body.append(h('div', { class: 'note' }, h('p', { class: 'hint' }, h('span', { class: 'l1tag' }, l1Tag()), l1(CTX[it.ctx])), words),
      h('p', { class: 'q' }, 'One word is wrong. Tap it.'));
  });
}

/* E14 Fix & Say: say (or type) the corrected sentence. */
function fixAndSay(card) {
  runQueue(card, FIXSAY, (it, body, done) => {
    body.append(h('div', { class: 'note' }, h('p', { class: 'hint' }, h('span', { class: 'l1tag' }, l1Tag()), l1(CTX[it.ctx])), h('p', { class: 'phrase' }, it.wrong)),
      speakInput({
        target: it.a, prompt: 'Say the correct sentence',
        onResult: (said) => {
          const r = compare(it.a, said);
          const ok = r.exact && norm(said).split(' ').length <= norm(it.a).split(' ').length + 1;
          feedback(body, { kind: ok ? 'good' : 'notyet', node: chips(r), correct: it.a, why: ok ? null : it.why, onNext: () => done(ok) });
        },
      }));
  });
}

/* E15 Guided Reply: pick a reply, say it, the waiter reacts. */
function guidedReply(card) {
  if (speakingOnly(card)) return;
  runQueue(card, GUIDED, (it, body, done) => {
    body.append(bubble('Waiter', it.c));
    say(it.c, { pitch: 0.8 });
    const choices = h('div', { class: 'choices' });
    function react(choice, r) {
      const line = it.react[choice];
      say(line, { pitch: 0.8 });
      feedback(body, {
        kind: !r || r.pass ? 'good' : 'near', title: !r || r.pass ? 'Done' : 'Almost',
        node: h('div', { class: 'answer' }, r ? chips(r) : null, bubble('You', choice, true), bubble('Waiter', line)),
        onNext: () => done(true),
      });
    }
    it.opts.forEach((c) => choices.append(h('button', {
      class: 'choice',
      onclick: () => {
        choices.remove();
        body.append(speakInput({ target: c, prompt: `Now say it: “${c}”`, onResult: (said) => react(c, compare(c, said)) }));
      },
    }, c)));
    body.append(h('p', { class: 'q' }, 'Choose your reply'), choices);
  });
}

/* E16 Free Reply: say anything, the waiter reacts. Offline rules stand in for the AI model. */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function waiterReply(said, st) {
  const n = norm(said);
  const out = { reply: '', recast: null, why: null, face: '🙂', end: false };
  const items = Object.keys(MENU).filter((k) => new RegExp(`\\b${k}s?\\b`).test(n));
  if (/\b(bye|goodbye|thank you|thanks)\b/.test(n) && st.turns > 1) return { ...out, reply: 'Thank you! Have a nice day!', face: '😄', end: true };
  if (/\bhow much\b|\bprice\b/.test(n)) return { ...out, reply: st.order.length ? `That's ${st.order.length * 15} thousand som.` : 'It depends. What would you like?' };
  if (/\bcard\b/.test(n)) return { ...out, reply: 'Yes, card is fine. Here you are.' };
  if (/\bspicy\b/.test(n)) return { ...out, reply: 'The soup is a little spicy. The salad is not.' };
  if (items.length) {
    st.order.push(...items);
    if (/\bi want\b/.test(n)) { out.recast = said.replace(/\bI want\b/i, "I'd like"); out.why = 'polite'; }
    const num = n.match(/\b(two|three|four|five)\s+(coffee|tea|cake|water|juice|samsa|latte)\b/);
    if (num) { out.recast = (out.recast || said).replace(new RegExp(`\\b${num[2]}\\b`, 'i'), num[2] + 's'); out.why = 'pluralRule'; }
    return { ...out, reply: `${cap(items.join(' and '))}, coming up. Anything else?`, face: '😄' };
  }
  if (/\b(no|nothing|that's all|that is all)\b/.test(n)) return { ...out, reply: st.order.length ? 'Okay. Card or cash?' : 'No problem. Take your time.' };
  st.confused++;
  return { ...out, reply: "Sorry? You can say: I'd like a coffee, please.", face: '😕' };
}

function freeReply(card) {
  if (speakingOnly(card)) return;
  const st = { order: [], turns: 0, recasts: 0, confused: 0 };
  const chat = h('div', { class: 'chat', 'aria-live': 'polite' });
  const slot = h('div');
  const opening = 'Hi! Welcome to Chorsu Café. What would you like?';
  card.replaceChildren(h('p', { class: 'hint' }, 'Offline demo waiter with simple rules. The real app uses an AI model here.'), chat, slot);
  chat.append(bubble('Waiter', opening));
  say(opening, { pitch: 0.8 });

  function ask() {
    slot.replaceChildren(speakInput({ prompt: 'Your turn', onResult: turn }));
  }
  function turn(said) {
    st.turns++;
    chat.append(bubble('You', said, true));
    const r = waiterReply(said, st);
    chat.append(bubble('Waiter', r.face + ' ' + r.reply));
    if (r.recast) {
      st.recasts++;
      chat.append(h('div', { class: 'fb near' }, h('p', {}, 'Better: ', h('span', { class: 'recast' }, r.recast)),
        h('p', { class: 'fb-why' }, h('span', { class: 'l1tag' }, l1Tag()), l1(WHY[r.why]))));
    }
    chat.scrollTop = chat.scrollHeight;
    say(r.reply, { pitch: 0.8 });
    if (r.end || st.turns >= 6) finish(); else ask();
  }
  function finish() {
    const slips = st.recasts + st.confused;
    const face = slips === 0 ? '🤩' : slips <= 1 ? '😄' : '🙂';
    const line = { '🤩': '“Wow, your English is great!”', '😄': '“Great, have a nice day!”', '🙂': '“Thanks!”' }[face];
    slot.replaceChildren(h('div', { class: 'done' }, h('div', { class: 'face', 'aria-hidden': 'true' }, face),
      h('p', { class: 'done-k' }, 'Scene preview finished'), h('p', {}, 'Waiter: ' + line),
      h('p', { class: 'hint' }, `${st.turns} replies · ${st.recasts} corrections`),
      h('button', { class: 'btn', onclick: () => freeReply(card) }, 'Start again')));
  }
  ask();
}
