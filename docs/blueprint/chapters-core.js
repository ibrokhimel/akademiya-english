import {chapter,p,h,list,steps,table,note,flow} from './content.js';

export const core = [
chapter('product','The product','What Akademiya is supposed to be',
'A speaking-first English app for people in Uzbekistan: small lessons that turn into useful things you can actually say.',
p('The experience starts with a real purpose: greet someone, ask a price, order a drink, explain a problem, or express an opinion. The learner hears a natural example, understands it with Uzbek support, practises it, and uses it. Progress means a growing set of capabilities, with a friendly character and a habit system supporting the learning.')+
p('The whole intended ecosystem connects a structured course, personal review, real-life scenes, Dombi as a companion, private proof of improvement, and optional social motivation. The current Android app is the local foundation of that larger product. This blueprint describes the complete direction; it does not claim that every future feature is already built or that every proposal has been approved for Version 1.')+
h('Who uses it')+
table(['Learner','What they need','How the app responds'],[
['A complete beginner, age 13+','Permission to start small without feeling embarrassed.','Uzbek instructions, tiny phrases, pictures, examples, optional microphone use and a clear first win.'],
['Someone who studied English but cannot speak comfortably','A way to retrieve and use knowledge, rather than repeat passive lessons.','Placement, speaking from memory, useful situations and review of recurring difficulties.'],
['Someone learning for school, travel, work or IELTS','A path that feels relevant to their goal.','One shared foundation, approved goal-specific examples and later dedicated tracks.'],
['A busy learner','A useful finish in a short amount of time.','Lessons around 3–5 minutes, a future 60-second review mode, saved sessions and the freedom to do another lesson.'],
])+
h('What it feels like')+
p('Warm, clear and responsive. Nunito lettering, violet primary actions, coral speaking controls, solid raised buttons and expressive illustrated characters form one consistent visual language. Dombi is a confident round companion for teens and adults. Small sounds, haptics and character reactions make an action feel acknowledged. The interface stays readable and calm enough to concentrate on English.')+
flow(['Hear something useful','Understand the meaning','Say it with support','Use it for a purpose','See what you can do','Return when useful'])+
h('The rules that hold the product together')+
list(['Speaking begins on day one, with accessible alternatives when speaking is unavailable.','Instructions and explanations meet the learner where they are; Uzbek support gradually fades.','Mistakes lead to a useful correction and more practice. They never consume hearts or block access through an energy meter.','The course is human-owned. Fixed content and explanations are reviewed, even when AI helps draft them.','The can-say collection is the main score. Spendable Apples, XP and streaks are separate systems.','Voice clips are private, saved only by choice, and removable. Friends, parents and the team do not get access to those clips.','A reminder needs a truthful reason and a useful destination. Permission, timing and restraint are part of the product.'])+
note('How to read this blueprint','“Agreed direction” comes from our product notes or your instructions. “Recommendation” is my proposed way to complete a flow. “Open decision” means the feature or rule still needs a choice. The scope chapter separates the existing Android foundation from the intended product.','agreed'),
['product-definition.md','teaching-methodology.md','gamification.md','extra-features.md']),

chapter('first-session','First experience','What happens when someone opens it',
'The first session demonstrates useful learning before asking the learner to invest in an account.',
steps([
['Meet Dombi and begin','Welcome leads to a short introduction. Returning users with saved progress go directly to their place on Learn. A future account sign-in should only appear when it connects to a real service.'],
['Choose a reason and starting level','Pick school, IELTS, travel, work or personal interest. A beginner starts at Level 0. The current MVP uses a simple new/already-know choice; the full product adds a short placement check for an experienced learner.'],
['Understand the promise','Show concrete things the learner will be working toward. Ask a quick 1–5 confidence self-check. Avoid a long goals questionnaire and avoid guaranteed fluency dates.'],
['Choose microphone access','Explain why speaking uses the mic before the OS asks. Offer a tiny Hello check and an acknowledgment when it is heard. Permission denial leads to help or a non-speaking path.'],
['Choose recording consent separately','Microphone permission is not permission to keep a voice library. Explain saved clips, private playback and deletion. The recognition provider’s processing is described honestly.'],
['Choose an optional reminder','Use the approved cylindrical time wheel. Explain that the reminder is optional and ask notification permission in context. The current default is 19:00.'],
['Finish lesson one','Hear a greeting, recognise it in use, rehearse, and try an appropriate phrase. End with the new ability and an honest result.'],
['Make a local profile, then continue','Ask what Dombi should call the learner after the first win. The current standalone app saves locally. Future account linking can protect progress across phones; learning should not pretend that a local name is already a cloud account.'],
])+
h('Placement and skipping ahead')+
p('The planned placement check takes roughly 2–3 minutes and includes some speaking. It should find a comfortable unit instead of producing a prestigious-looking score. Skip-ahead tests let a stronger learner demonstrate the target ability without replaying every easy item. Placement and skip-ahead must use real evidence, allow an understandable recovery from a poor result, and keep service failures separate from ability.')+
note('Open decision','The exact placement tasks, thresholds, retry policy and permitted skip boundaries have not been designed. The existing level-choice screen is not a placement engine.','open')+
h('What the learner should understand before leaving')+
list(['Where their next lesson is.','What they can already practise.','Whether recordings are being saved.','Whether reminders are enabled and how to change them.','That their current progress is on this phone until real sync exists.']),
['pages.md','product-definition.md','extra-features.md','speech-and-retention-research.md']),

chapter('navigation','Finding your way','Four main places in the full application',
'Learn builds the ability. AI Speaking lets you talk. Progress shows the evidence. Profile makes the app yours.',
table(['Place','What people find there','How they use it'],[
['Learn','The winding lesson path, current unit, lesson start sheets, checkpoints, replay, and proposed entries to review and scenes.','Open the next useful lesson, continue a saved one, revisit something familiar, or use a completed unit in a situation.'],
['AI Speaking','A dedicated destination for free conversation, guided topics and real-life roleplays.','Choose a topic or situation, start speaking, exchange short replies, then finish with useful practice. Dombi is an additional shortcut.'],
['Progress','Things I can say, phrase practice, example and own-voice playback, streak calendar, level, trophies, records and future proof features.','See what has changed, revisit one phrase, or compare private recordings when the timeline exists.'],
['Profile','Name, avatar, goal, settings, recordings, privacy, awards, and proposed entrances to friends, the shop and family/account management.','Personalise the experience and control how the app works.'],
])+
p('The Learn path keeps the approved Path H: a violet unit banner, completed lesson ovals, a coral current lesson, locked lessons and a unit trophy. A unit’s phrase-book entry goes to the can-say collection. Later content extends this same course. The town is a proposed scene destination; replacing the approved path with the town is still an open choice.')+
note('Full application direction','The full app has Learn, AI Speaking, Progress and Profile. This is the owner’s updated direction. The Android MVP’s existing three-tab layout is a foundation, not the final navigation. Lessons can link into speaking scenarios; Dombi can open the same speaking tab.','agreed')+
h('Back, swipe and interruptions')+
list(['Back closes an open sheet, dialog or temporary overlay first. A settings subpage returns to Settings, then Profile. A phrase practice returns to the phrase collection.','A gesture and a back button should express the same parent-child relationship. Android Back should not leave the app from a settings page.','Tabs preserve useful context, such as the current path position. A notification opens the relevant lesson or feature and still provides a sensible route back.','Leaving a lesson offers a calm choice to continue or leave with progress saved. Returning resumes the saved item and result history.','After a background interruption, stop stale playback or microphone work and restore an understandable state. A late speech result cannot answer a different question.','At the app’s root, follow appropriate Android system back behavior. The precise root-exit treatment is a design choice, not an excuse to trap the learner.'])+
h('Three practice contexts')+
table(['Context','What remains available','What must stay honest'],[
['Full','Listening and speaking, normal and slow examples, supported and independent production.','Recognition and pronunciation assessment have different responsibilities.'],
['Headphones','Listening, choices and tiles. Speaking-only work waits.','The existing “Can’t speak now” behavior is the foundation; a named mode is future work.'],
['Silent','Reading and tiles adaptations, with sound-dependent activities replaced or deferred.','Reading a dialogue is not a listening result. Building a sentence is not verified spoken recall.'],
]),
['pages.md','activities.md','exercises.md','motion-plan.md']),

chapter('lesson','The learning experience','One lesson, one practical ability',
'Lessons are short units of learning, not a daily quota. The learner can stop after one or continue for as long as it remains useful.',
flow(['Hear','Notice','Say','Use','Review genuine misses','Celebrate the capability'])+
steps([
['Hear','Introduce the phrase through audio and a meaningful picture or exchange. Keep text hidden when the goal is listening. A replay and slow version are available.'],
['Notice','Make the pattern understandable with examples or a short Uzbek explanation. Draw attention to the specific trap that matters here, without a grammar lecture.'],
['Say','Rebuild with tiles, echo a model, then retrieve from a picture or situation. The hint is there on request instead of supplying the answer before the learner tries.'],
['Use','Give the phrase a purpose: greet a person, order an item or answer a short question. Later Guided and Free Reply make this a more responsive exchange.'],
['Review','Return actual content mistakes at the end until answered correctly. An uncertain recognizer result remains a retry, not a learner mistake.'],
['Finish','Show the new can-say capability, then the result. Update the first completed lesson’s daily streak, advance the path and offer a clear next action.'],
])+
h('A concrete example: ordering a drink')+
p('The learner hears “A coffee, please.” in a café context, learns what it means, notices when to use a or an, builds a short request, repeats an example, and asks for a drink from a situation cue. An existing phrase such as Hello or Thank you returns naturally. Finishing adds a meaningful capability: ask for a drink politely. At the end of the café unit, the checkpoint or future scene combines greeting, ordering, price, paying and goodbye.')+
h('How answers feel')+
table(['Situation','Response','Effect on progress'],[
['A correct selected or built answer','A short success sound, a light haptic where enabled, and a readable success state.','Continue. Consecutive correct answers can trigger a brief combo moment.'],
['A real content mistake','Show the correct model and a one-line Uzbek explanation where a known trap applies; move forward calmly.','Return the item during the lesson’s review round.'],
['A speaking mismatch or service failure','Show what was heard if useful, offer replay, retry, a requested hint or an explicit non-speaking path.','Do not accept unrelated speech. Do not count uncertain recognition as a content mistake.'],
['Optional reading after correct tiles','Offer a separate chance to say the completed sentence.','A skip keeps the earned tile result; it does not verify speech.'],
])+
p('The player mixes activity types instead of repeating the same task over and over. The activity plan targets short tasks, generally under 30 seconds, and no more than two or three of one type consecutively. Timing is a design target, not a reason to rush a learner who needs another listen.')+
h('Result rules')+
list(['Own-voice playback is reached through Progress or a later comparison invitation, not placed on the new-capability celebration card.','Perfect means the criteria really were met. Unverified speech retries must not produce a misleading perfect badge or pronunciation percentage.','Show actual learning answers, phrases and time with labels that match what was measured.','There is no heart loss, energy lock or purchase needed to do another lesson.']),
['lesson-template.md','teaching-methodology.md','mvp-lessons.md','mistake-engine.md','speech-and-retention-research.md']),

chapter('curriculum','The course','A course built around things people do',
'The long-term outline runs from first words to B2 through 48 planned units, with later goal tracks. Only the first three units currently have the finished MVP lesson set.',
p('The structure is level → stage → unit → lesson → exercise. A unit serves a situation. Its lessons prepare useful chunks and patterns, then a checkpoint or scene asks the learner to use them together. The same topic returns with more depth: a café request can grow into a restaurant problem or a polite complaint. Old words are deliberately recycled instead of abandoned after one successful answer.')+
table(['Level','Stage','What grows'],[
['0 · Pre-A1','First steps','Words and tiny phrases: greet, introduce yourself, order, ask prices and buy something.'],
['1 · A1','Survive','Short everyday exchanges: home, family, routines, directions, transport, health and travel needs.'],
['2 · A2','Live','Connected sentences about work, study, plans, events and problems.'],
['3 · B1','Connect','Opinions, stories, small talk, explanations, experiences and solutions.'],
['4 · B2','Achieve','Longer speaking, discussion, professional needs and goal-specific tasks.'],
])+
h('Uzbek is a bridge that fades')+
table(['Stage','Language support','Amount of help'],[
['Level 0','Instructions, meanings and explanations in Uzbek.','Picture and tile support; tiny speech attempts; no grammar terminology.'],
['Level 1','Uzbek instructions with short English instructions beginning.','Hints increasingly requested rather than automatically shown.'],
['Level 2','Mostly English instructions; Uzbek explanations for difficult errors.','Fuller sentences and more recall.'],
['Level 3','English with Uzbek help on tap.','Fewer hints; opinions, follow-up answers and scenes.'],
['Level 4','English with Uzbek for tricky points when needed.','Longer, more independent production; goal-specific situations.'],
])+
h('The current three units')+
p('Hello builds greetings, names, origin, checking how someone is and goodbye. Café builds drinks, food, prices, preferences, paying and thanks. Shopping adds availability, this/that, colours, sizes and buying. Numbers are taught through prices rather than isolated as a separate unit. The authoritative current content is 15 lessons and three checkpoints; the full lesson and course inventories appear below.')+
`<div data-appendix="lessons"></div>`+
h('The complete planned course')+
p('The 48-unit outline is included in full. Units after the first three still need lesson scripts, reviewed examples, audio, exercise mixes and final skill checks. A rough 240-lesson outline is not a finished 240-lesson course.')+
`<div data-appendix="course"></div>`+
h('Goal tracks')+
p('IELTS Speaking, job interviews, work abroad, study abroad and travel build on the same foundation, particularly from Levels 3–4. Relevance can begin earlier through approved examples matching the chosen goal. A learner studying for work can practise the same request pattern in a canteen; a traveller can use it in a café. The goal does not silently change unit order or invent a new lesson.')+
note('Earlier notes reconciled','Some early methodology examples listed a separate Numbers unit or roughly five Level 0 units. The later course and lesson plans lock Level 0 to Hello, Café and Shopping. The early scene proposal also called five scenes an MVP; later product scope moved live scenes after the current MVP.','agreed'),
['course-map.md','mvp-lessons.md','lesson-template.md','teaching-methodology.md','product-definition.md']),

chapter('adaptation','The personal learning engine','The same destination, the right practice for you',
'Personalisation changes the practice inside the course while keeping the human-designed curriculum understandable.',
table(['Layer','What it owns','What changes'],[
['Human-owned curriculum','Unit order, lesson names, can-say skills, core examples, explanations and task goals.','Only through reviewed content changes. Live AI does not rewrite the course.'],
['Personal learning rules','Due reviews, past content mistakes, weak skills, phrase strength, placement and help level.','Which suitable exercise appears, how much support it gives and when an old phrase returns.'],
['Live AI, where chosen','Scene replies, recasts, Dombi conversations and proposed language help.','A short response to what this learner actually said, within the task and agreed boundaries.'],
])+
h('What the engine remembers')+
list(['The phrase or skill, its practice history and the kind of task completed. Recognising a phrase, building it, recalling it and using it are different evidence.','Actual missed content items and known Uzbek-speaker traps. Recognition failure is recorded separately so a bad microphone does not become a fake weak skill.','Recent successful and difficult practice by activity type, including whether help was used.','A due-review estimate from the planned memory scheduler. FSRS is the proposed scheduling direction; the current fixed lessons do not already contain it.','The learner’s selected context: speaking available, headphones or silent.'])+
flow(['Recognise it','Rebuild it','Recall it','Use it','Revisit before it becomes fragile'])+
h('A concrete personalisation example')+
p('Two learners reach the same café lesson. One can recognise the price but mixes up word order, so receives a short tile rebuild before another recall. Another can build the sentence but forgets it without the model, so gets a meaningful situation cue and then a later retrieval. A third has repeated recognizer failures; the app offers a usable alternative and records a speech-service issue rather than diagnosing poor English.')+
h('Review without a second homework list')+
p('Due phrases and past mistakes are mixed into new lessons and available through personal review. A 60-second Quick Win is a small Memory Review mode for a busy day. It is not a separate curriculum. A passive Mistake Notebook was deliberately folded into active review. Phrase-strength bars, “these five need practice,” a phrase of the week and a fuller activity calendar are later presentation ideas that depend on meaningful history.')+
h('The Uzbek-speaker mistake engine')+
p('Start from reviewed patterns: missing am/is, articles, plural -s, English negation and questions, Thanks you, very versus too, and hearing fifteen versus fifty. Explanations compare English with what an Uzbek learner expects. The first nine authored traps are included here; detecting those patterns reliably in free speech is a separate proposed extension.')+
`<div data-appendix="traps"></div>`+
note('Open decisions','The exact scheduling algorithm configuration, weak-skill thresholds, exercise quotas, placement cutoffs and scene help adaptation are not locked. The system should explain its next task in plain language and be evaluated on recall and task success, not just exercise completion.','open'),
['teaching-programme.md','teaching-methodology.md','ai-plan.md','activities.md','mistake-engine.md']),
];
