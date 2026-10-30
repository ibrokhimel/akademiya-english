export const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const p = text => `<p>${text}</p>`;
export const h = text => `<h3>${text}</h3>`;
export const list = items => `<ul>${items.map(t=>`<li>${t}</li>`).join('')}</ul>`;
export const steps = items => `<ol class="steps">${items.map(([title,text])=>`<li><strong>${title}</strong><p>${text}</p></li>`).join('')}</ol>`;
export const table = (head, rows) => `<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(head.join(', '))}"><table><thead><tr>${head.map(c=>`<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i===0?`<th scope="row">${c}</th>`:`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const note = (label,text,type='recommendation') => `<aside class="note ${type}"><strong>${label}</strong><p>${text}</p></aside>`;
export const flow = items => `<ol class="flow" aria-label="Sequence">${items.map(t=>`<li>${t}</li>`).join('')}</ol>`;
export const chapter = (id,label,title,lead,body,sources) => ({id,label,title,lead,body,sources});

export const exercises = [
  {id:'E1',aim:'Attach a useful phrase to a situation before relying on spelling.',feedback:'Reveal the English after the listening/attempt sequence; offer a model and another try. Exact text matching is not a pronunciation grade.',mode:'Without speaking: rebuild with tiles. Silent mode: read, then rebuild from memory.',state:'Core exercise family exists in Android.'},
  {id:'E2',aim:'Retrieve a phrase from memory for an actual purpose.',feedback:'A requested hint can reveal the first words. Unrelated final speech does not pass; uncertain recognition gets another try.',mode:'Speaking off: use word tiles. This verifies a different skill from spoken recall.',state:'Core exercise family exists in Android.'},
  {id:'E3',aim:'Connect a sound to a phrase quickly.',feedback:'Make the chosen pair clear and correct a mismatched pair. An untimed accessible version is recommended; its exact design is open.',mode:'Silent mode matches Uzbek meanings to English instead of audio.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E4',aim:'Notice English word order while making a useful sentence.',feedback:'A tap picks or places a word; Check evaluates the completed answer. Optional reading aloud is separate from the tile result.',mode:'Works without speaking. Keep the read-aloud optional and honestly labeled.',state:'Core exercise family exists in Android.'},
  {id:'E5',aim:'Recognize the English form that fits a meaningful phrase.',feedback:'Use a picture and context so only one of the three forms is correct. Pick first, then Check.',mode:'A tap task that can work silently; do not count it as spoken production.',state:'Planned exercise; distinct from the existing Tap the Gap variant of E13.'},
  {id:'E6',aim:'Understand what people are doing without reading a transcript first.',feedback:'Play the dialogue, let the learner pick a picture, then Check and reveal useful text.',mode:'Silent mode becomes an explicitly labeled reading task, not a listening score.',state:'Core exercise family exists in Android.'},
  {id:'E7',aim:'Track who said a line within an exchange.',feedback:'Choose the speaker and check. Replay the exchange without an early answer reveal.',mode:'Reading adaptation in Silent mode; no claim of verified listening.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E8',aim:'Recall one word that was heard, rather than recognize it from a full transcript.',feedback:'Accept a taught number as digits or words where appropriate. Correct the missing word and recycle a genuine miss.',mode:'Typing stays short: one missing word. Silent mode offers three choices.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E9',aim:'Rehearse a model’s useful phrase, rhythm and timing.',feedback:'Replay normal or slow audio. Current word comparison can indicate transcript agreement; sound-level feedback needs a separate validated method.',mode:'Speaking-only: defer while speaking is off. Do not replace it with tiles and call that Echo.',state:'Core exercise family exists in Android; dedicated pronunciation assessment does not.'},
  {id:'E10',aim:'Hear distinctions such as ship/sheep or difficult English consonants.',feedback:'A short set of listening choices with a replay and a clear correction. The source plan suggests eight rounds; pacing still needs evaluation.',mode:'Needs sound. Offer another suitable activity in Silent mode.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E11',aim:'Produce two words with a meaningful sound distinction.',feedback:'A recognizer returning two different strings is insufficient proof of the acoustic distinction. Use a validated assessment or frame this as practice.',mode:'Speaking-only: defer in Headphones or Silent mode; Which One? can remain a listening alternative.',state:'Planned exercise; assessment method remains open.'},
  {id:'E12',aim:'Discover a useful pattern from examples instead of memorizing grammar terms.',feedback:'Show four examples, ask for the pattern, then confirm in two simple Uzbek lines.',mode:'Can be adapted to quiet reading. Keep the explanation human-written or human-approved.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E13',aim:'Notice a specific Uzbek-speaker trap in a sentence with clear context.',feedback:'Select a wrong word or a missing-word gap, then Check. Show the repair and the short Uzbek explanation.',mode:'Tap task. The current content includes both wrong-word and missing-gap variants.',state:'Core exercise family exists in Android.'},
  {id:'E14',aim:'Repair a known error and retrieve the corrected phrase aloud.',feedback:'Context must make the intended repair clear. Recognition uncertainty does not become a learner mistake.',mode:'Speaking off: rebuild the corrected sentence with tiles.',state:'Planned exercise; not a finished Android activity.'},
  {id:'E15',aim:'Move from choosing an appropriate reply to saying it in a small exchange.',feedback:'The character reacts to the meaningful reply. Separate a correct choice from an unverified spoken attempt.',mode:'Speaking-only: defer the activity while speaking is off.',state:'Planned exercise; conversation/reaction integration is future work.'},
  {id:'E16',aim:'Respond independently and handle more than one valid answer.',feedback:'Evaluate meaning against the task, not a single exact sentence. The character uses a brief natural recast rather than a lecture.',mode:'Speaking-only in the original exercise plan. A scene can separately offer accessible choices or short typed input.',state:'Planned live-AI exercise; not a working Android conversation.'},
];

export const readerJourneys = [
  {id:'new',title:'A complete beginner',intro:'Aziz knows almost no English and feels awkward speaking. The first session should make one useful action feel possible.',moments:[
    ['Opens the app','Meets Dombi, picks a reason to learn and chooses “I’m new.”','The app starts at Level 0, uses Uzbek instructions and avoids a long placement exam.'],
    ['Chooses the permissions','Tries the microphone if comfortable and separately chooses whether to keep voice clips.','A denied microphone or declined recording consent does not block lessons.'],
    ['Learns a tiny greeting','Hears Hello, recognizes it in a scene, builds a familiar phrase and repeats it.','Listening, meaning and supported practice come before unaided recall.'],
    ['Uses it','Sees a morning situation and tries Good morning, with a hint available on request.','A reliable match can finish the answer; uncertainty invites a retry or a tiles route.'],
    ['Sees the win','Finishes the lesson, sees the practical new capability, then makes a local profile.','The path advances. The learner can continue immediately or leave without pressure.'],
  ]},
  {id:'returning',title:'A normal returning learner',intro:'Malika has a few minutes after work. The app remembers her place and gives her a sensible next action.',moments:[
    ['Returns to Learn','Sees her current lesson or the saved lesson she left earlier.','There is one clear way to continue. Finished lessons remain replayable.'],
    ['Builds on yesterday','Learns one new ability alongside a little previously learned material.','The authored course stays in order. The future memory engine changes practice choices inside it.'],
    ['Makes a real content mistake','Chooses an incorrect word or picture and checks the answer.','The app explains the useful correction, moves on, and brings that item back at the end.'],
    ['Finishes','Sees what she can now say and a streak update if this is her first completed lesson today.','No heart is lost. No currency is needed to do another lesson.'],
    ['Looks at Progress','Replays a phrase or her own saved voice, then leaves.','The current day’s practice reminder is suppressed after completion.'],
  ]},
  {id:'quiet',title:'Someone on a bus',intro:'The learner can use headphones but cannot speak comfortably. The app adapts the task without pretending that silent work proves spoken mastery.',moments:[
    ['Chooses “Can’t speak now”','One action turns speaking off for the session.','Recall tasks move to tiles; speaking-only tasks are deferred. No double confirmation is needed.'],
    ['Keeps learning','Listens with headphones and answers appropriate listening or word-order tasks.','A future Headphones mode makes this context explicit; Silent mode also adapts audio tasks.'],
    ['Finishes some useful work','Completes an honest listening/tiles outcome.','The result distinguishes what was practised. Quick Win streak credit remains a product decision.'],
    ['Speaks later','Turns speaking back on when alone and revisits a phrase or deferred activity.','The app offers practice rather than claiming that the earlier silent session verified pronunciation.'],
  ]},
  {id:'scene',title:'A first real-life conversation',intro:'The learner has practised ordering. The future café scene asks them to achieve a goal with a character who can respond.',moments:[
    ['Arrives at the café','Enters a location in the illustrated town and sees the situation.','A short model exchange and a clear goal prepare the learner. The town is a destination, not an approved replacement for Path H.'],
    ['Starts a reply','Chooses a line, uses a sentence starter or speaks freely, depending on help level.','The character waits, listens visibly and responds with a short relevant line.'],
    ['Handles a twist','Hears that coffee is unavailable and chooses something else.','The goal requires adapting, not repeating a script word for word.'],
    ['Sees the outcome','Gets the character’s reaction and a summary of the goal achieved and help used.','Useful phrases and genuine mistakes feed future review. The learner can replay with less help.'],
  ]},
  {id:'break',title:'Coming back after a break',intro:'The learner missed several days. Their earlier capabilities should still feel valuable.',moments:[
    ['Gets an optional invitation','Receives a small, relevant comeback suggestion if eligible and opted in.','The exact inactivity threshold is open. There is no stream of guilt messages or fake friend activity.'],
    ['Chooses a small win','Starts a short review of something familiar.','The app adjusts the amount of work rather than increasing notification pressure.'],
    ['Finds their place','Sees the same phrase collection and course progress as before.','A broken streak does not erase learned material. Freezes and a possible repair are separate habit rules.'],
    ['Builds momentum again','Chooses a normal lesson when ready.','The next reminder respects completion, time preferences and the proposed frequency budget.'],
  ]},
  {id:'month',title:'Seeing a month of progress',intro:'A learner wants proof that their speaking is improving, not another number without context.',moments:[
    ['Looks at capabilities','Sees useful phrases, completed units and situations handled.','The capability list stays the main permanent score.'],
    ['Compares private recordings','If consenting clips exist for the same phrase at both times, listens to then and now.','This requires a future recording timeline; the present latest-clip-per-phrase behavior is insufficient.'],
    ['Reflects on confidence','Answers the same 1–5 self-check used at the start.','A self-report remains separate from any proposed AI metric. A flat answer is not treated as failure.'],
    ['Chooses what comes next','Reads a real weekly summary or moves to a relevant goal track.','Any certificate is an Akademiya milestone, not an official CEFR or IELTS qualification.'],
  ]},
];
