import {chapter,p,h,list,steps,table,note,flow} from './content.js';

export const experience = [
chapter('exercises','Every activity','The complete exercise system',
'Nine activity families plus a Scene create variety. Six core exercise families exist in Android; the complete plan contains 16 named exercise types.',
p('An activity describes the skill being practised; an exercise describes the actual task the learner performs. Picture Talk introduces or recalls a phrase. Build the Sentence teaches useful order. Overheard trains listening. Echo rehearses a model. Sound Duel focuses on sound differences. Spot the Rule makes a pattern visible. Fix It repairs a specific error. Quick Reply uses a phrase in an exchange. Memory Review mixes suitable tasks around due material and past mistakes. The Scene combines these abilities in a real situation.')+
h('Rules shared by every exercise')+
list(['Use a clear task and meaningful context. A beginner should know what to produce without guessing what an isolated icon means.','When the goal is listening, text must not reveal the answer first. When the goal is recall, the answer must not already be visible.','Choice tasks have one unambiguous correct option. Open conversations can have many valid responses and need task-based evaluation.','A tap selects an answer and can be changed. The Check button evaluates it. Selection and correctness have different visual states.','Speaking is central; typing is brief, generally one to three words. Matching and tiles support learning without becoming a substitute for every spoken task.','A genuine miss gets a useful model and returns as practice. An uncertain speech result does not get a fake pass or a content-mistake penalty.'])+
`<div data-appendix="exercises"></div>`+
h('Purposeful variety')+
p('Scenes and review are longer experiences; ordinary exercise tasks stay short. Avoid more than two or three of the same activity consecutively. Reuse familiar characters and situations so the lesson feels like one world. Picture Talk absorbs passive phrase cards, Overheard absorbs dictation-style Catch the Word, and active Memory Review replaces a passive mistake notebook. The earlier generic Town Chat idea was cut; it is not quietly added back as an extra feed.')+
note('Speaking-color rule','Older exercise notes describe green/orange words as “almost” pronunciation. The blueprint uses the newer research distinction: transcript agreement can show which words the recognizer returned, but cannot establish sound-level pronunciation quality. Dedicated assessment stays a separate proposal.','agreed'),
['exercises.md','activities.md','speech-and-retention-research.md']),

chapter('speech','Speaking and listening','What happens when the learner talks',
'The ideal is visible, responsive listening with trustworthy feedback. Recognising text, judging an answer and assessing pronunciation are three different jobs.',
flow(['Tap mic','Listening becomes obvious','Provisional words update','Final utterance arrives','Check the intended answer','Continue or offer a useful retry'])+
h('While speaking')+
p('The mic has an unmistakable listening state, a level-reactive response and a clear way to stop. Provisional words appear as audio arrives and may change as the service hears more. A long word may begin as a partial or mistaken hypothesis and settle into the final word. This is the behavior you asked for: feedback during speech rather than only after it ends. Provisional text is neutral and never awards credit.')+
p('The Android app requests partial results today, but the installed recognition service controls when they arrive. A consistent keyboard-like streaming experience is a requirement to evaluate, not a guarantee the current Redmi engine already meets. Compare candidate engines on Uzbek-accented speech, unrelated words, near-sounding errors, silence, noise and interruptions. Measure false acceptance, false rejection, first live-text delay and final-result delay separately.')+
h('After speaking')+
table(['Example','What the learner sees','What the app records'],[
['Expected Hello; final result Hello','An accepted phrase attempt and a clear way to continue.','A matching recognised utterance. This does not prove every sound was pronounced perfectly.'],
['Expected Hello; final result yellow','The heard text, an example replay and another attempt or a non-speaking route.','A retry. Unrelated speech is not accepted as yellow success and is not silently added to the can-say result.'],
['The service fails, ends without a final answer or hears nothing','A calm recovery, permission help if relevant, retry or tiles.','A recognition failure or retry, separate from the learner’s scored content mistakes.'],
['A learner chooses an incorrect content answer and checks it','A useful correction and short explanation when available.','A genuine learning mistake, queued for review.'],
['A learner builds correct tiles, then skips the optional read-aloud','The earned tile result remains.','A completed tile task; no verified spoken answer is invented.'],
])+
p('A fixed-answer exercise checks the complete utterance against accepted answers. Legitimate contractions, taught number formats and reviewed alternatives can be normalised; matching a target word buried in unrelated padding is insufficient. Only a final successful recognition result can be checked. A late, interrupted or stale result cannot finish the current question. Open conversations use a different standard: whether the reply makes sense and advances the task.')+
h('Pronunciation, fluency and confidence')+
table(['Measure','Intended use','Boundary'],[
['Phrase recognition','Did the service transcribe an accepted answer?','Recognition confidence is not pronunciation quality.'],
['Pronunciation assessment · proposed','Give useful feedback on intelligibility and specific sounds.','Needs acoustic assessment, human agreement and accent-fair evaluation. No native-accent imitation requirement.'],
['Fluency measures · proposed','Show changes in pace or pauses across comparable tasks.','Do not display “40% better” without a valid baseline and a meaningful measure. Faster is not automatically better.'],
['Confidence self-check','Ask the learner how they feel, using the same 1–5 question over time.','Already a self-report, not an automated diagnosis of emotion or confidence.'],
['AI speaking-confidence score · earlier proposal','An optional estimated summary, if it can be justified.','Its meaning, validity and inclusion remain open. It must not replace the learner’s own report.'],
])+
h('Listening and playback')+
p('English examples have normal and slow versions. British and American voice sets are kept; the learner chooses the English voice in Settings. The speaker changes to visible playback bars while playing, and a second action can stop it. Example audio and a saved own-voice clip should not compete or continue unexpectedly after leaving the page. Quiet saved WAV recordings can be amplified for playback without modifying the original clip or changing the phone’s volume behind the learner’s back.')+
note('Research boundary','The local speech-and-retention report records the research and candidate approaches. No paid recognition provider or pronunciation model has been selected. Evaluation recordings would require separate voluntary consent; private learner clips are not a pool for team listening.','open'),
['speech-and-retention-research.md','sound-plan.md','ai-plan.md','exercises.md']),

chapter('scenes','Using English in the world','Real-life scenes with a purpose',
'Open a roleplay from AI Speaking or a relevant course checkpoint, then handle a situation with a responsive character.',
steps([
['Arrive','A top-down illustrated town leads to a place. The scene begins with a wide situation shot: “You’re hungry. Order lunch.” The town and characters use the same art direction.'],
['Watch and prepare','Hear a short model exchange with subtitles, then review around three useful chunks. This provides a safe example before independent performance.'],
['Take your turn','The camera moves to a first-person character view. The character asks a short relevant question. The learner speaks, or uses an accessible choice or brief typed route when appropriate.'],
['Get the right amount of help','A beginner can choose a line and say it. A developing learner gets a sentence starter. A more independent learner replies freely. An Uzbek whisper or requested hint is available.'],
['Handle a twist','A requested item is unavailable, a size is wrong or a plan changes. The learner adapts instead of repeating an entire memorised script.'],
['See the outcome and replay','The character reacts, the goal outcome and help used are explained, and useful new material goes to review. A replay offers a new variation or less support.'],
])+
h('A café example from start to finish')+
p('The learner has practised a coffee request, a price question and polite thanks. At the counter, the waiter asks what they would like. The learner orders. The waiter says coffee is unavailable and offers tea. The learner chooses an alternative, asks the price and completes the interaction. A supported completion still counts as a useful achievement, but it is distinguishable from an independent completion that handled the twist without help.')+
h('What is fixed and what can respond')+
table(['Human-designed','Responsive layer','Learner outcome'],[
['The location, learning goal, key phrases, help levels, permitted twists and completion criteria.','A brief reply to what the learner actually says, within the situation.','Finish the task meaningfully, with help available.'],
['A bank of reviewed explanations and relevant examples.','A natural recast: the character models a useful repair in their reply.','Understand a mistake without a long lecture or humiliation.'],
['Recognisable recurring characters and a consistent world.','Proposed memory of relevant prior interactions, with explicit limits.','Familiarity without unexplained personal-data collection.'],
])+
p('The initial scene ambitions are café, shop, taxi, hotel and job interview, with goal-relevant future situations such as a work-abroad or study interview, a bazaar or an IELTS speaking room. Location scripts, twists and mastery standards still need authoring. A daily scene-of-the-day and brief micro-scenes inside lessons are planned variations, not additional daily push requirements. The old passport-stamp reward was removed; character reactions and demonstrated ability carry the reward.')+
h('When live services are slow or unavailable')+
p('A character’s thinking or listening expression makes the state visible, but it cannot conceal an indefinite wait. If a request fails, preserve the learner’s turn, show a retry or a safe way back, and offer an available lesson or review. The design ambition is a fast conversational response, around a second where feasible; the actual service must be measured before that becomes a promise. Live voice use also needs an affordable allowance.')+
note('Scope','Live scenes are an agreed direction after the current MVP. The full town, live conversation and scene grading are not implemented. Whether all five initial locations belong in Version 1, and whether a scene replaces or complements each checkpoint, remain explicit scope decisions.','open'),
['scene-simulation-concept.md','teaching-programme.md','activities.md','ai-plan.md']),

chapter('dombi','The companion','What Dombi actually does',
'Dombi is the guide and the future companion: expressive, helpful and present without taking over the learning.',
p('Dombi is a round dark character with tall white eyes and a centred smile. He has confident, simple expressions rather than blush or childish baby talk. The expression set includes smile, happy, laugh, talk, listen, think, surprised, sleepy, wink, proud, focus, confused and oops. Hands appear for a wave, celebration, thinking or pointing. A recognisable voice and mouth movement connect speech and expression.')+
h('The three roles')+
table(['Role','How people use it','Product behavior'],[
['Guide','Meet him during onboarding, listening, explanations and celebrations.','Already part of the Android foundation. He reacts gently and never looks punished by the learner’s errors.'],
['Persistent companion','See him at home beside the Learn path and in a safe resting spot across pages.','An agreed concept: he persists across navigation, avoids content and controls, and can be hidden or muted. The mobile companion layer is future work.'],
['Voice helper and practice partner','Double-tap to ask for navigation help or choose to practise a topic.','The assistant listens only after an explicit action. Live practice opens the AI Speaking tab, which is also directly accessible; short replies leave room for the learner.'],
])+
h('A conversation with Dombi')+
p('The learner starts listening, asks for help, or chooses a topic. Dombi visibly listens and gives a short relevant response. Navigation help goes to a real destination, such as saved phrases. Free speaking remains within age-appropriate topic boundaries. The learner can stop, mute, return to a lesson, or choose a useful phrase to save. A conversation phrasebook is separate from proof that a course skill has been mastered.')+
p('Earlier AI proposals include “How do I say…?” from Uzbek into English and memory of a name, learning goal and interests. Uzbek recognition quality must be checked before promising that interaction. Dombi’s memory needs visible boundaries: what is remembered, why it helps, and how it can be removed. A recommended design stores learner-approved preferences rather than treating every conversation as permanent memory.')+
p('The proposed AI boundaries suit the intended 13+ audience: no romantic or adult roleplay, no requests for personal details, and a brief redirect when a conversation leaves the permitted learning context. Dombi identifies himself as an AI. The learner can end or report an interaction, and a service failure does not manufacture a reply or a successful task outcome. The exact topic limits and output-checking system still need design.')+
h('Touch, play and outfits')+
p('The animation playground contains the detailed touch ideas below. Existing animation rigs are evidence that the visual behavior can be explored; they are not a completed persistent pet system in the Android app. During an exercise, small taps, petting and a high-five can remain available, while carrying, throwing, feeding and pinching wait until the exercise is over. A learner should always be able to focus on the question.')+
`<div data-appendix="touch"></div>`+
p('Outfits and accessories, including an Uzbek doppi, connect to the Apple shop. A decorated corner and optional growth celebrate learning. The pet does not become hungry, sick or distressed to pressure someone into returning.')+
note('Gesture conflict to resolve','The companion concept assigns double-tap to the voice assistant. The earlier play lab also assigns double-tap to tricks. My recommendation is to keep the app’s double-tap for help and place tricks in the pet corner or an explicit interaction menu. Sensor and mic-based play must be intentional, never always-on listening or hidden monitoring.','recommendation'),
['companion-pet.md','motion-plan.md','ai-plan.md','gamification.md']),

chapter('proof','Visible improvement','What progress means to the learner',
'Progress should answer what I can do, how far I have come, and whether I am improving.',
h('The can-say collection is the main score')+
p('Completed learning adds useful phrases and capabilities to a collection grouped by unit. Each entry has its meaning, a normal/slow example where available, quick practice and an own-voice action only when a clip exists. The collection is permanent learning progress; it is never spent in the shop. The app should not imply that a tile-only session independently verified spoken mastery. A recommended later evidence label distinguishes practised, said, recalled and used without replacing the approved permanent count.')+
h('The facts the app can show')+
table(['Fact','What it means','What it does not mean'],[
['Phrases and can-say abilities','Material learned through the course and available for practice.','A guarantee that every phrase can already be produced unaided in real life.'],
['Level and unit progress','Completed requirements in the Akademiya curriculum.','An official CEFR assessment.'],
['Lessons and active days','Actual completed learning events.','Time spent merely opening the app.'],
['Speaking time','A measure based on microphone activity in the current app.','A precise acoustic measurement of words spoken; pauses can be included.'],
['Streak and freezes','The habit history under the app’s daily and weekly rules.','A score of intelligence, effort or worth.'],
['Pace prediction','A rough date estimate derived from actual activity.','A guaranteed B2 or IELTS result.'],
])+
h('My voice and then-versus-now')+
p('The learner separately consents to saving recordings. A clip is associated with its phrase and date and stays private. They can play it beside the example, stop it, remove one clip or delete all. The current local app keeps the latest saved clip for a phrase. A true timeline needs a future storage model that preserves comparable earlier clips instead of overwriting them.')+
p('After about 30 days, the same phrase can be recorded again with consent during ordinary practice. A calm invitation after a lesson, or an entry in Progress, offers a then/now comparison. Both clips must actually exist and refer to the same phrase. No improvement percentage is invented from two audio files. The learner can decline the comparison without losing progress.')+
h('Weekly summaries and confidence')+
p('A weekly summary reports real phrases and abilities learned, lessons finished, microphone time and actual mistakes revisited. “Most improved,” a mistake of the week, a next-week preview and a share card are additional proposals. An empty week does not get a fabricated success story. Optional sharing excludes private audio and lets the learner choose the visible information.')+
p('The 1–5 confidence question returns after roughly two weeks. A positive change can be celebrated; a flat or lower self-rating gets a neutral response and useful next steps. Automated fluency or confidence scores are separate earlier proposals with unresolved validity. A future level certificate should be clearly an Akademiya milestone and explain its capabilities, not resemble an official exam result.')+
h('Trophies, records and awards')+
p('A unit trophy means the learner used the unit’s material together. A level-up explains new abilities. Personal records can show consistent practice and other actual accomplishments. A small local award collection already exists; the larger catalogue of tiered, hidden, speaking, habit, scene and progress awards still needs final criteria. Proposed Apple rewards belong to the separate economy.'),
['progress-system.md','teaching-methodology.md','pages.md','ai-plan.md','gamification.md']),

chapter('retention','Returning for a reason','The full notification and retention ecosystem',
'Retention comes from useful learning, visible progress and relevant invitations. A list of notification types is not a schedule to send all of them every day.',
p('The strongest return loop is inside the product: a practical win, a clear next task, review that fits the learner, proof of improvement and a place that remembers their progress. Someone repeatedly struggling needs a better example or easier retrieval step, not more pressure. Someone who finished today should be allowed to feel done.')+
h('Which invitation fits which situation?')+
table(['Situation','Example and destination','Eligibility and maturity'],[
['No lesson completed today','“Bugun yana bir foydali ibora aytib ko‘ramizmi?” → current Learn position.','The local reminder already rotates copy at a chosen time. Suppress after a completed lesson.'],
['A lesson was left unfinished','“Boshlagan darsingiz saqlangan. Qolganini tugatamizmi?” → that saved lesson.','Already supported locally; do not claim a percentage completed unless known.'],
['A checkpoint is ready','“Bo‘limdagi iboralarni o‘rgandingiz. Endi birga ishlatib ko‘ramizmi?” → the ready checkpoint.','Already supported locally when the condition is real.'],
['A learned phrase is worth recalling','Name a real learned phrase → a suitable practice destination.','The current reminder can name learned material. Claiming it is due requires the future memory scheduler.'],
['A streak milestone is near','Name the actual current practice run → a useful lesson.','Local milestone variants exist. The milestone is a different eligible copy choice, not an extra daily alert.'],
['A due memory review exists','A short, specific retrieval invitation → Review or Quick Win.','Proposed. Requires due material and an available review experience.'],
['The learner has been away','“Bir daqiqalik mashqdan boshlaymizmi?” → a gentle review.','Proposed. Choose inactivity threshold, cooldown and restart behavior before implementation.'],
['A useful weekly summary exists','“Bu hafta nimalarni o‘rgandingiz?” → the real summary.','Proposed category. In-app may be enough; opt-in push should not stack carelessly with practice reminders.'],
['A valid then/now comparison exists','A private invitation to listen → Progress comparison.','Proposed. Both consenting clips must exist; never show private audio on a lock screen.'],
['A real friend event occurs','An actual request or permitted encouragement → requests or the relevant friend state.','Needs real social accounts, notification controls and limits. Never invent a friend action.'],
['An opted-in league event matters','A truthful ranking update → the learner’s real league.','Future feature. Cohorts and timing rules must exist before league copy is eligible.'],
])+
h('Four places to communicate')+
table(['Channel','Useful role','Control'],[
['Inside the app','A post-lesson check-in, a summary, a quiet review suggestion or a real friend request.','No interruption of an active spoken answer or exercise. Make optional invitations dismissible.'],
['Phone notifications','A time-relevant reason to return with a useful deep link.','OS permission, chosen time, opt-out and proposed category/quiet-hour controls.'],
['Telegram · later','An explicitly linked reminder channel or consented family summary.','Avoid duplicating the same invitation through push and Telegram. No bot is currently linked to the app.'],
['Home-screen widget · later','A real phrase, streak or next lesson available at a glance.','A pull surface, not a new excuse to send alerts.'],
])+
h('The recommended decision process')+
steps([
['Check permission and preferences','No permission or opt-out means no push. Apply the learner’s chosen time and future quiet-hour settings.'],
['Check the learner’s actual state','Has today’s practice finished? Does a saved lesson, due review, ready checkpoint or real event exist? Avoid stale claims.'],
['Choose one useful practice reason','A saved lesson or a relevant next task can be more helpful than a generic reminder. Rotate eligible wording to avoid repetition.'],
['Apply frequency and cooldown rules','Start from at most one proactive practice reminder per local day. Broader social-event budgets, digests and comeback cooldowns are separate open rules.'],
['Open a real destination','A tap resumes the actual saved lesson or opens the relevant feature. Invalid or stale links return safely to Learn.'],
['Evaluate whether it helped','Look at useful return, lesson completion, delayed recall and opt-outs. Notification opens alone are not success.'],
])+
note('Research and privacy','The supplied retention video informed hypotheses. Its claims about Wi-Fi histories, home inference, silent-mode monitoring or an exact universal churn score were not established by the research reviewed. None becomes an app requirement here. The existing research report explains the evidence and limits.','agreed')+
note('Still to decide','Exact cooldowns, event-category budgets, quiet hours, summary preference defaults and reminder-time adaptation are proposals. “Best time” should begin with an explicit learner choice; a future adaptation requires evidence and a way to control it.','open'),
['speech-and-retention-research.md','extra-features.md','gamification.md','ai-plan.md']),
];
