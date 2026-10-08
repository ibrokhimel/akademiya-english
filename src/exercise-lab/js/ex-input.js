// Exercises E1–E8: Picture Talk, Build the Sentence, Overheard.

/* E1 Meet It: listen first. Picture + meaning + audio, no text; repeat what you heard, then see the text. */
function meetIt(card) {
  runQueue(card, PH, (it, body, done) => {
    const silent = S.mode === 'silent';
    const text = h('p', { class: 'phrase' }, it.en);
    const answer = speakInput({
      target: it.en, prompt: 'Repeat what you heard',
      onResult: (said, via) => {
        const r = compare(it.en, said);
        const ok = via === 'tiles' ? r.exact : r.pass;
        feedback(body, { kind: ok ? 'good' : 'near', title: ok ? 'Nice' : 'Almost', node: chips(r), correct: it.en, onNext: () => done(true) });
      },
    });
    body.append(h('div', { class: 'pic' }, it.pic), h('p', { class: 'l1' }, l1(it)));
    if (silent) {
      // No sound: read it once, then build it from memory (the text hides so it isn't copying).
      const ready = h('button', { class: 'btn ghost' }, "I've read it");
      ready.addEventListener('click', () => { text.remove(); ready.replaceWith(answer); });
      body.append(h('p', { class: 'hint' }, 'Silent mode: read it, then build it from memory.'), text, ready);
    } else {
      const reveal = h('button', { class: 'linkbtn' }, 'Stuck? Show the text');
      reveal.addEventListener('click', () => reveal.replaceWith(text));
      body.append(audioBtn(it.en, '🔊 Hear it again'), reveal, answer);
      say(it.en);
    }
  });
}

/* E2 Say What You See: a task in Uzbek/Russian is the cue; recall the English phrase. */
function sayWhatYouSee(card) {
  runQueue(card, PH, (it, body, done) => {
    const firstWords = it.en.split(' ').slice(0, 2).join(' ') + ' …';
    const hint = h('button', { class: 'linkbtn' }, 'Show hint');
    hint.addEventListener('click', () => hint.replaceWith(h('p', { class: 'l1' }, 'Starts with: ', h('strong', {}, firstWords))));
    body.append(
      h('div', { class: 'pic big' }, it.pic),
      h('div', { class: 'note' }, h('p', { class: 'q' }, h('span', { class: 'l1tag' }, l1Tag()), l1(it.task))),
      hint,
      speakInput({
        target: it.en, prompt: 'Say the phrase',
        onResult: (said, via) => {
          const r = compare(it.en, said);
          const ok = via === 'tiles' ? r.exact : r.pass;
          const kind = ok ? 'good' : r.score >= 0.5 ? 'near' : 'notyet';
          feedback(body, { kind, node: chips(r), correct: ok ? null : it.en, react: ok ? maybeReact() : null, onNext: () => done(ok) });
        },
      }));
  });
}

/* E3 Match Rush: 4 sounds to 4 phrases against the clock (Silent mode: Uzbek/Russian to English). */
function matchRush(card) {
  let sel = null, matched = 0, misses = 0, t0 = null, timer = null;
  const set = shuffle(PH).slice(0, 4);
  const silent = S.mode === 'silent';
  const clock = h('span', { class: 'clock' }, '0.0s');
  const L = h('div', { class: 'col' }), R = h('div', { class: 'col' });
  const tick = () => { clock.textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's'; };
  const start = () => { if (!t0) { t0 = performance.now(); timer = setInterval(tick, 100); } };
  S.cleanup = () => clearInterval(timer);

  shuffle(set).forEach((p, i) => {
    const b = h('button', { class: silent ? 'tile' : 'tile pic-tile', 'data-id': p.id, 'aria-label': silent ? false : `Sound ${i + 1}` },
      silent ? l1(p) : `🔊 ${i + 1}`);
    b.addEventListener('click', () => {
      start();
      say(p.en);
      L.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
      sel = p.id; b.classList.add('sel');
    });
    L.append(b);
  });
  shuffle(set).forEach((p) => {
    const b = h('button', { class: 'tile', 'data-id': p.id }, p.en);
    b.addEventListener('click', () => {
      start();
      if (!sel) return;
      if (p.id === sel) {
        tone(true);
        const left = L.querySelector(`[data-id="${sel}"]`);
        [b, left].forEach((x) => { x.classList.add('gone'); x.disabled = true; });
        sel = null;
        if (++matched === set.length) {
          clearInterval(timer); tick();
          card.append(h('div', { class: 'fb good' },
            h('p', { class: 'fb-t' }, `All matched in ${clock.textContent}`),
            h('p', {}, misses ? `${misses} wrong ${misses === 1 ? 'try' : 'tries'}` : 'No wrong tries'),
            h('button', { class: 'btn', onclick: () => matchRush(card) }, 'Play again')));
        }
      } else {
        misses++; tone(false);
        b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400);
      }
    });
    R.append(b);
  });
  const how = silent ? 'Tap a meaning, then its English phrase' : 'Tap a sound to hear it, then tap its phrase';
  card.replaceChildren(h('div', { class: 'rushbar' }, h('p', { class: 'q' }, how), clock),
    h('div', { class: silent ? 'match even' : 'match' }, L, R));
}

/* E4 Tile Builder: build the English sentence from tiles, then read it aloud. */
function tileBuilder(card) {
  runQueue(card, TILES, (it, body, done) => {
    const tiles = shuffle([...it.ans, ...it.extra]);
    const picked = [];
    const line = h('div', { class: 'line' }), bank = h('div', { class: 'bank' });
    function draw() {
      line.replaceChildren(...picked.map((ti, pi) => h('button', { class: 'tile on', onclick: () => { picked.splice(pi, 1); draw(); } }, tiles[ti])));
      if (!picked.length) line.append(h('span', { class: 'ph' }, 'Tap the words below'));
      bank.replaceChildren(...tiles.map((w, ti) => h('button', { class: 'tile', disabled: picked.includes(ti), onclick: () => { picked.push(ti); draw(); } }, w)));
    }
    draw();
    const answer = it.ans.join(' ');
    body.append(
      h('p', { class: 'hint' }, h('span', { class: 'l1tag' }, l1Tag()), l1(it.l1)),
      h('p', { class: 'q' }, 'Build it in English'),
      line, bank,
      h('button', {
        class: 'btn',
        onclick: () => {
          const ok = picked.map((i) => tiles[i]).join(' ') === answer;
          feedback(body, ok
            ? { kind: 'good', correct: answer, node: readAloud(answer), onNext: () => done(true) }
            : { kind: 'notyet', correct: answer, why: it.why, onNext: () => done(false) });
        },
      }, 'Check'));
  });
}

/* E5 Complete the Chunk: pick the missing piece of a phrase. */
function completeChunk(card) {
  runQueue(card, CHUNKS, (it, body, done) => {
    const full = it.pre + it.a + it.post;
    body.append(
      h('div', { class: 'pic' }, it.pic),
      h('p', { class: 'phrase' }, it.pre, h('span', { class: 'blank' }, ' '), it.post),
      h('div', { class: 'choices' }, shuffle(it.opts).map((o) => h('button', {
        class: 'choice',
        onclick: () => {
          const ok = o === it.a;
          feedback(body, { kind: ok ? 'good' : 'notyet', correct: full, why: ok ? null : it.why, react: ok ? maybeReact() : null, onNext: () => done(ok) });
        },
      }, o))));
  });
}

/* E6 What Happened? Listen first (no text), answer, then see the text. */
function whatHappened(card) {
  runQueue(card, DIALOGS, (d, body, done) => {
    const tr = transcript(d.lines, true);
    if (S.mode === 'silent') body.append(h('p', { class: 'hint' }, 'Silent mode: read the conversation instead of listening.'), tr);
    else { tr.hidden = true; body.append(h('button', { class: 'play big', onclick: () => sayLines(d.lines) }, '🔊 Play conversation'), tr); sayLines(d.lines); }
    const right = d.opts.find((x) => x.ok);
    body.append(h('p', { class: 'q' }, d.q), h('div', { class: 'choices pics' }, shuffle(d.opts).map((o) => h('button', {
      class: 'choice',
      onclick: () => {
        tr.hidden = false;
        feedback(body, { kind: o.ok ? 'good' : 'notyet', correct: o.ok ? null : right.l, onNext: () => done(!!o.ok) });
      },
    }, h('span', { class: 'emoji' }, o.p), o.l))));
  });
}

/* E7 Who Said It? */
function whoSaidIt(card) {
  runQueue(card, WHO, (it, body, done) => {
    const d = DIALOGS[it.d];
    if (S.mode === 'silent') body.append(h('p', { class: 'hint' }, 'Silent mode: read the conversation. Names are hidden.'), transcript(d.lines, false));
    else { body.append(h('button', { class: 'play big', onclick: () => sayLines(d.lines) }, '🔊 Play conversation')); sayLines(d.lines); }
    body.append(h('p', { class: 'q' }, `Who said “${it.line}”?`), h('div', { class: 'choices pics' }, ['Waiter', 'Customer'].map((who) => h('button', {
      class: 'choice',
      onclick: () => {
        const ok = who === it.a;
        feedback(body, { kind: ok ? 'good' : 'notyet', correct: ok ? null : `The ${it.a.toLowerCase()}`, node: transcript(d.lines, true), onNext: () => done(ok) });
      },
    }, h('span', { class: 'emoji' }, who === 'Waiter' ? '🧑‍🍳' : '👩'), who))));
  });
}

/* E8 Missing Word: hear the sentence, fill the gap. */
function missingWord(card) {
  runQueue(card, MISSING, (it, body, done) => {
    if (S.mode !== 'silent') { body.append(h('button', { class: 'play big', onclick: () => say(it.full) }, '🔊 Play sentence')); say(it.full); }
    body.append(h('p', { class: 'phrase' }, it.pre, h('span', { class: 'blank' }, ' '), it.post));
    const check = (ans) => {
      const ok = norm(ans) === it.a || (it.alts || []).includes(norm(ans));
      feedback(body, { kind: ok ? 'good' : 'notyet', correct: it.full, onNext: () => done(ok) });
    };
    if (S.mode === 'silent') {
      body.append(h('p', { class: 'hint' }, 'Silent mode: choose the word that fits.'),
        h('div', { class: 'choices' }, shuffle(it.opts).map((o) => h('button', { class: 'choice', onclick: () => check(o) }, o))));
    } else {
      const input = h('input', { class: 'type', type: 'text', autocomplete: 'off', 'aria-label': 'Missing word', placeholder: 'Type the missing word' });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) check(input.value); });
      body.append(h('div', { class: 'typerow' }, input, h('button', { class: 'btn ghost', onclick: () => input.value.trim() && check(input.value) }, 'Check')));
    }
  });
}
