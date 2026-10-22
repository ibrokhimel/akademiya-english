import {chapter,p,h,list,steps,table,note,flow} from './content.js';

export const systems = [
chapter('rewards','Habits and rewards','Make learning satisfying without making it punitive',
'The can-say collection measures learning. Streaks recognise a habit. Apples buy optional things. XP would serve competition. These are different systems.',
h('The habit layer')+
p('The current streak counts local days with at least one finished lesson. The calendar is Sunday-first, shows practised days, today and frozen days, and explains how a freeze was used. One free freeze per week can automatically cover a missed day. A missed streak does not delete phrases, lessons or capabilities. A proposed repair within 24 hours is a habit-recovery feature; it must not fabricate a lesson event on the missed day.')+
p('The learner sees a small milestone celebration at a useful moment, such as finishing the first lesson of the day. In a lesson, consecutive correct answers can trigger short combo moments at 3, 5 and 10. The path visibly fills, a unit earns a trophy and a completed level explains what is now possible. The perfect-lesson badge must match the actual result and excludes unverified speech retries.')+
note('Open habit rules','Whether a 60-second Quick Win counts toward a streak, how streak repair works and how travel or timezone changes affect future cloud records need explicit decisions. The existing finished-lesson rule remains the current baseline.','open')+
h('Apples and the shop')+
table(['How Apples are earned','What they can buy','Limits'],[
['Meaningful learning: lessons, speaking, checkpoints, genuine perfect lessons and selected milestones. Speaking is intended to earn more than tapping.','Dombi outfits and accessories, a decorated pet corner, themes, profile frames or avatar items, extra freezes, scene-character outfits and optional fun content.','Exact earnings and prices are not set. Repeating easy actions should not become an infinite reward farm.'],
['Possible later paid currency and premium multipliers.','Optional cosmetic or convenience items under agreed rules.','Not present in the current app. Never buy a lesson skip or checkpoint pass, and never spend the permanent can-say score.'],
])+
p('Apples fit the teacher/apple image, Uzbek orchards and Dombi’s world. They are an optional economy, not the reason a sentence is correct. Core learning must not require Apple purchases. A shop visit should clearly show balance, item, cost and ownership; a completed purchase updates inventory once, while an unavailable or failed purchase does not take currency. These transaction details are recommended completion rules, not already built functionality.')+
h('Achievements, quests and friendly competition')+
p('The expanded achievement ideas cover first spoken phrases, minutes of practice, completed units, actual no-hint performance, habits, repaired Uzbek-speaker traps, a first voice comparison, scene twists, pet interactions and hidden surprises. Some may be tiered and some may award Apples, but their criteria and amounts remain open. A small local award collection already exists. Daily quests should point to worthwhile actions, such as recalling an old phrase or using a unit’s material together, instead of empty tap counts.')+
p('Weekly leagues would use a separate XP system with real learners, real cohorts and fair earning rules. Difficulty, repeated practice, opt-out, tie handling and abuse prevention need a design before ranking feels credible. Leagues must not turn an honest learning result into a pressure tactic. The optional social layer is described next.'),
['gamification.md','progress-system.md','pages.md']),

chapter('social','Learning with people','Friends, requests and optional shared motivation',
'The social direction is friends and friend requests, not followers. It supports the learning path without becoming a requirement to practise.',
table(['Action or state','What the learner understands','Recommended completion behavior'],[
['Find or invite someone','They can identify a real person and send an invitation deliberately.','Decide discoverability, invitation links and age-appropriate defaults. Do not require address-book access to learn.'],
['Add friend','A request is being made to the chosen account.','Show Request sent after a real accepted server operation; handle duplicate or failed requests clearly.'],
['Request sent','The relationship is pending, not already a friendship.','Offer an understandable cancellation route; do not send repeated requests through repeated tapping.'],
['Incoming request','They can choose whether to connect.','An accepted request becomes Friends. Decline and block behavior needs explicit, calm controls.'],
['Friends','The relationship is mutual.','Show the permitted shared profile information and relevant optional encouragement. Removing a friend is distinct from blocking.'],
['Another person’s profile','This is a read-only profile, not an editable copy of their own.','Show only permitted fields. Keep report and block accessible. No private voice playback.'],
['Report or block','They can control contact that feels inappropriate.','Blocking should prevent further unwanted requests under clearly defined rules; reports need a real delivery route. Exact visibility and moderation policy remain open.'],
])+
h('Friend streaks, invitations and leagues')+
p('A friend streak is an optional shared learning habit. It should encourage actual practice rather than make one person responsible for another person’s guilt. Friend notifications must reflect an action that occurred or a clearly opted-in shared state. An invite reward for both people is an earlier Apple idea; eligibility, qualifying learning and anti-abuse rules have not been chosen.')+
p('A weekly league is separate from friendship. A learner may participate without turning their entire profile public. No fake users, invented rank movements or claims that a friend practised when the system does not know that. Public fields, cohort rules and the ability to stay out of competition need explicit design.')+
h('Privacy stays intact')+
p('A friend can see permitted learning milestones, never saved voice clips. Parent or family membership does not create access to audio either. Profile names, photos, discoverability and report handling need protections suitable for the intended 13+ audience. Exact age-related account and sharing rules are open; the current standalone app has no working social backend.')+
note('Scope and placement','Friends, requests, other-person profiles, friend streaks and leagues are represented in the intended ecosystem. My recommended entrance is Profile. Real accounts, a hosted service, privacy defaults and working report/block controls are dependencies—not completed integrations.','open'),
['pages.md','gamification.md','extra-features.md','product-definition.md']),

chapter('personal','Your account and controls','A personal app the learner can control',
'Local learning works on its own today. Cloud identity, sync and family access add capabilities only when their services really exist.',
h('Profile and settings')+
table(['Area','Controls and information','How it is used'],[
['Profile','Name, avatar, goal, joined date, level, bio where supported, records and awards.','Make the learning space recognisable. Future social, league, Apple and pet modules should only act as real features when available.'],
['General settings','Sound effects, dark theme, reminder time, learning goal and supported feedback/haptic preferences.','Adjust the experience without navigating away from the learning identity. The current native settings may not expose every proposed preference separately.'],
['Speaking','Speaking availability, normal/slow examples and British or American English voice choice.','Keep the microphone context and example playback understandable. Voice choice does not change the course standard.'],
['Recordings','Save-my-voice consent, clip list, play/stop, delete one and delete all.','Retain control over saved audio without deleting the course history by accident.'],
['Account and privacy','What is local, future account linking and sync status, sign-out when applicable, local reset and future account deletion.','Different actions need different wording and consequences. A local profile is not a cloud login.'],
['Help and about','Report a problem, app version, relevant credits and explanations of unavailable capabilities.','Make a problem report honest about whether it was actually delivered.'],
])+
h('From a local profile to a cloud account')+
steps([
['Keep the first win local','Do not block the first lesson behind registration. Explain that this phone currently holds the progress.'],
['Offer a real linking benefit','When a hosted account system exists, explain that it protects progress across devices. Earlier plans name Google, Apple and phone sign-in; the exact working provider set remains to be selected.'],
['Handle existing progress carefully','If an account already exists, show an understandable choice or merge policy. My recommendation is to preserve learning history, deduplicate event identities and never silently replace a richer record with an empty one.'],
['Make sync visible when it matters','A pending upload, a sign-in failure or a network issue should not erase a finished local lesson. Show a retry path without inventing a successful sync.'],
['Support recovery and leaving','The full account design needs provider-specific recovery, expired-session handling, sign-out, device changes and explicit deletion. These are required flow designs, not capabilities already supplied by a mock login button.'],
])+
h('Voice privacy, precisely')+
p('The owner’s rule is that only the learner can listen to their saved voice recordings. Not friends, parents, teachers or our team. Recordings are not shared, sold, used in marketing or included in reports. Saved audio is currently local. A future cloud version must preserve private access rather than treating uploaded files as public links. Consent to save is separate from the fact that a speech-recognition service may process audio to produce text.')+
p('Turning saving off stops future retention; deleting an existing clip removes that chosen copy under the app’s explained storage rules. Removing all recordings is distinct from resetting local learning progress. A future cloud deletion flow must say which copies exist and what is being removed. Retention length, cloud audio access design and under-18 rules remain to be settled before those features are built.')+
h('Family access and parent reports')+
p('The business concept includes a family plan for two to six people and later Telegram summaries for parents. Each learner’s history stays separate. Family administration and report consent should be explicit, with visible membership and a way to understand what is shared. Reports can contain permitted learning counts and capabilities, never saved audio. Who may invite, manage payment, consent or revoke a report is still an open product design.')+
h('Problem reports')+
p('A problem sheet keeps the learner’s context, offers a category and text, and can include an optional screenshot under clear consent. The current standalone app keeps a local report draft. It must not show a cloud “sent” success without delivery. A future support route needs retry, duplicate handling and enough context to understand the issue without collecting private voice.'),
['pages.md','extra-features.md','tech-stack.md','product-definition.md']),

chapter('access','Plans and access','How free learning and paid features fit together',
'The current standalone Android MVP is free and has no checkout. The broader business direction is freemium with optional family access and paid live-speaking value.',
table(['Part','Existing direction','Still open'],[
['Core learning','Useful free lessons with no ads, hearts, paid skips or Apple locks on the core curriculum.','The exact free course extent and entitlement boundaries. Older notes also describe all units in Premium; this must be reconciled before promising a final free catalogue.'],
['Live speaking','Limited free conversational use, with a premium speaking offer.','Actual allowance, cost budget, overage behavior and whether an “unlimited” promise is sustainable.'],
['Subscription','Monthly and discounted yearly access are the planned model.','Prices, trial policy if any, renewal terms and account-management experience.'],
['Family','A two-to-six-person family concept.','Membership permissions, invitations, per-person entitlements and what happens when a member leaves.'],
['Local payment options','Payme, Click and Uzum are named in the earlier product plan.','Actual provider integration and the final payment path. No payment rail is implemented by this blueprint.'],
['Optional paid currency','A later possibility alongside earned Apples.','Whether it belongs in V1 at all, plus fair earning and spending rules.'],
])+
h('A complete purchase experience needs more than a paywall')+
steps([
['Understand the value','A learner sees the feature they want, what their current plan includes, and the exact offer when prices are decided.'],
['Choose deliberately','Show the selected plan and its actual terms before a payment action. Do not use fake discounts or hide the free route.'],
['Handle the transaction','Success grants the entitlement once. A cancelled, failed or pending payment stays distinct from success and provides a clear next step.'],
['Recognise existing access','An account change, device change or delayed confirmation must not cause duplicate purchases to be the only recovery path.'],
['Manage the plan','The learner can see their real access and understand changes, expiry or cancellation under the eventual chosen payment system.'],
])+
note('Recommendation','Set an affordable live-voice budget and a clear free learning promise before final pricing. An AI allowance reaching its limit should leave lessons and appropriate review usable; it should not become a heart system tied to mistakes.')+
p('This chapter records the intended product behavior and the unresolved commercial choices. App-store submission, external publication, launch campaigns and launch preparation are outside the requested work.'),
['product-definition.md','gamification.md','tech-stack.md','ai-plan.md']),

chapter('feel','Appearance, motion and sound','What the whole app should look and feel like',
'One recognisable visual and interaction system across the browser reference and the Android build.',
`<div class="palette" aria-label="Approved brand colors"><span style="--swatch:#7B5CFF"><i></i><b>Violet</b><small>Primary action · #7B5CFF</small></span><span style="--swatch:#FF6B5B"><i></i><b>Coral</b><small>Speaking · #FF6B5B</small></span><span style="--swatch:#3DCB6C"><i></i><b>Green</b><small>Success · #3DCB6C</small></span><span style="--swatch:#FFC93C"><i></i><b>Gold</b><small>Milestones · #FFC93C</small></span></div>`+
p('Use Nunito, comfortably readable instructions, familiar illustrated glyphs and the existing character style. Light mode uses white and pale surfaces with dark ink. The approved dark mode is Charcoal: a near-black #121214 background, #1B1B1F cards, #242429 surfaces and readable light text. Brand accents remain recognisable in both. Existing Dombi, waiter, Aziz and Malika artwork anchors one consistent world; later locations and characters need to match it.')+
h('The interaction rules you specifically asked for')+
table(['Component or moment','Expected behavior','What makes it feel coherent'],[
['Raised buttons','A solid face sits above a darker base and physically presses down. Disabled buttons become opaque gray with gray content and an appropriate base.','No reduced-opacity disabled mic or speaker that looks washed out against its surroundings.'],
['Screen changes','Use the approved motion language for forward, back and tab changes. Preserve the gesture’s sense of direction.','A native build should not drop the transitions that made the browser reference feel responsive.'],
['Bottom sheets','The sheet rises while the background scrim fades in place; the two motions are independent.','The dark overlay must not slide upward with the sheet.'],
['Reminder time wheel','The selected value is largest and most readable. Values above and below shrink and bend away like numbers around a cylinder.','Fast flicks remain stable: no overlapping duplicate numbers, stale positions or flicker.'],
['Microphone','Ready, listening, checking, accepted, unavailable and stopped states are visibly distinct.','Mic on/off feedback is clear; unrelated sounds do not compete with a recording.'],
['Audio and own voice','A playback action shows moving bars or a stop state, and stops when requested or when leaving.','A red “Mening ovozim” control must visibly do something and produce usable playback when a clip exists.'],
['Choices and tiles','Violet means selected. A check produces feedback. Tiles travel into place and leave a readable arrangement.','The same selection language is used across lessons, forms and onboarding.'],
['Progress and celebrations','Numbers update, paths fill, trophies and level-ups have character and rhythm.','Brief events celebrate actual outcomes and do not invent success to play an animation.'],
['Dombi and people','Breathing, blinks, gaze, listening, reactions and mouth movement make speech feel inhabited.','Character acting reinforces the current state, rather than fighting the learner’s attention.'],
])+
h('The sound family')+
p('The selected sound set covers correctness, choosing, tiles, combos, mic on/off, lesson completion, a genuine perfect result, a new phrase, counters, level-up, trophies, awards, streaks, freezes, button presses, pops, transitions, switches and reminders. Smaller sounds belong to a consistent family. A sound happens on the meaningful animation beat, at a sensible loudness, and avoids masking the model voice or microphone. Chosen source assets and their required credits remain recorded in the sound plan.')+
`<div data-appendix="sounds"></div>`+
h('Motion without taking away control')+
p('The motion lab is the reference for individual timings, particle effects, haptic families and character performances. Not every effect should run at once. Respect system reduced motion, relevant sound preferences and supported haptic choices. A reduced-motion learner still needs an obvious selected answer, recording state, success, error recovery and navigation destination. Sound and animation acknowledge the action; readable state carries its meaning.'),
['pages.md','motion-plan.md','sound-plan.md','companion-pet.md']),

chapter('reliability','How the product holds together','The invisible behavior that makes the experience trustworthy',
'Local learning, optional cloud services, reviewed content and live AI need clear responsibilities.',
table(['System','Current foundation','Full-product responsibility'],[
['Android app','The standalone Expo/React Native implementation, bundled authored content, local settings and learning history.','Keep local learning usable and preserve state across interruptions and updates. Android is the current build priority; iOS is later platform work.'],
['Shared learning rules','Lesson order, answer checking, session results, progress and habit rules shared with the browser reference.','Keep the same result meaning across platforms and separate content mistakes from service uncertainty.'],
['Content system','The current first 15 lessons, three checkpoints, illustrations, English audio, people and reviewed explanations.','Author later units and scene templates, version content deliberately and approve every fixed learner-facing asset.'],
['Optional account service','No public hosted backend currently connected. Earlier notes name PocketBase and local services.','Provide real identity, private sync, social events and account recovery. Local tools on a PC are not a hosted production service.'],
['Speech system','Phone recognition with requested partial results and honest final-answer checking.','Choose a suitable streaming engine through evidence. Add acoustic assessment only if it has a justified role.'],
['Conversation service','No implemented live scene or Dombi conversation backend.','Manage task context, safe brief replies, voice generation, interruptions, latency and per-minute cost.'],
['Learning insights','Useful local events exist; the retention proposals do not add cloud surveillance.','Measure completion, delayed recall, speaking use, service failures and return with privacy-conscious event collection.'],
])+
h('What the app needs to remember')+
p('Keep the learner’s selected settings and consent; lesson attempts and completions; genuine item mistakes; speech retries and failures separately; checkpoint outcomes; daily habit history; confidence self-reports; and a resumable lesson position. Derive visible progress consistently from that history. Recordings have their own private file and phrase/date metadata. Future economy, subscriptions and friendships add authoritative balances, entitlements and relationship state; those cannot be faked from a screen’s current appearance.')+
h('The content-production loop')+
flow(['Choose the can-say outcome','Write the lesson and trap focus','Review Uzbek and English','Build exercise variants','Produce audio and character timing','Check the whole experience','Approve a content version'])+
p('AI can help draft, translate, check consistency or prepare production assets. Humans own lesson names, the course map, explanations, final fixed content and final art. Live AI does not grade tile choices, decide prices or invent an account entitlement. A future team-facing workflow can highlight confusing questions, recognition failures and likely content issues using non-audio evidence; private clips are not opened for quality review.')+
h('Recovery behavior, end to end')+
table(['When this happens','What the learner should be able to do','What must be preserved'],[
['Microphone permission denied','Read the specific steps, open settings where supported, retry or continue without speaking.','The current lesson and all completed answers.'],
['Nothing heard, an incomplete result or unrelated recognition','See a calm explanation, hear the example, retry or choose an explicit alternative.','No fake pass and no content-mistake penalty from uncertainty.'],
['A fast repeat tap or late speech event','See one authoritative current state.','No duplicate answer, stale result, double navigation or repeated reward.'],
['A call, app backgrounding or a navigation gesture','Stop active recording/playback appropriately and return to a comprehensible state.','Saved progress and a recoverable attempt.'],
['No internet','Continue available bundled lessons or choose a suitable non-speaking path.','Local history. Offline speech and hosted AI are not promised.'],
['Audio is quiet, missing or unplayable','Stop/retry as appropriate and see an actionable explanation.','The original private clip and the rest of the learning history.'],
['A lesson is left or the app restarts','Resume its saved position rather than silently starting a new attempt.','The item, prior answers, relevant session state and honest result history.'],
['A cloud sync or sign-in fails','Keep using available local learning and retry the optional service.','Finished lessons; do not overwrite them with an empty remote state.'],
['A scene or conversation request fails','Keep the turn, retry or exit to available learning without losing context.','A clear distinction between attempted and completed live interaction.'],
['A report cannot be sent','Keep the draft and explain the delivery state.','No invented “sent” message.'],
['A friend request or purchase is pending','See pending, success, cancellation or failure as different states.','No double request, double charge, duplicate reward or fabricated friendship.'],
['A notification points somewhere stale','Open an appropriate safe destination, with back navigation.','No unknown route that traps or exits the learner unexpectedly.'],
['A learner deletes recordings or data','Understand the scope, confirm a destructive action and see the actual result.','Untargeted information must not be removed accidentally.'],
])+
h('How we know a feature is working')+
p('A lesson should teach the intended phrase and reveal actual comprehension or recall, not just a high completion rate. Speaking checks should reject unrelated speech and minimise understandable-accent rejection. Results should match what happened. Reminders should lead to useful learning without excessive opt-outs. Personalisation should improve retrieval. Scenes should produce real task completion and manageable latency. These are product-quality checks; launch planning is not included.'),
['tech-stack.md','teaching-programme.md','lesson-template.md','speech-and-retention-research.md','ai-plan.md']),

chapter('scope','Scope and remaining decisions','What is real, what is intended, and what still needs choosing',
'The blueprint accounts for the whole known vision. It does not erase the difference between implemented behavior, agreed concepts and earlier proposals.',
table(['Layer','What belongs here','Status'],[
['Existing Android foundation','Local onboarding/profile, three tabs and Path H, authored lessons and checkpoints, core exercises, speech checking with neutral retries, saved sessions, progress, phrase and voice playback, streaks/freezes, settings, dark theme, local reminders, recovery and a small award collection.','Built behavior; this does not certify speech accuracy on every voice or device.'],
['Agreed broader concepts','Four main tabs including dedicated AI Speaking, the full course outline, live scenes, Dombi and a voice helper, review, later proof, Apples/shop, friends/leagues, family and later language/channel extensions.','Part of the intended product direction, with substantial work still required.'],
['Earlier AI proposals','Acoustic pronunciation assessment, fluency measures, automated confidence, smart lesson choices, reminder-time adaptation, Uzbek phrase help, personal conversation phrasebook and pet memory.','Not all approved as final V1 scope; described with their dependencies and limits.'],
['Recommended completion rules','Detailed account merge/recovery, transaction states, social controls, explicit practice evidence, notification budgets and some new-feature placement.','My recommendations to make the product coherent. They remain reviewable choices.'],
])+
h('Decisions the blueprint deliberately leaves visible')+
table(['Decision','My recommended direction','Why it is still open'],[
['How broad is Version 1?','Keep the whole ecosystem visible; choose a concrete bundle before treating it as a delivery promise.','Agreeing that a pet or league exists someday did not assign every extension to one version.'],
['How much course content?','Deepen the first situations and deliberately author the next level.','The 48-unit destination still needs most of its scripts, audio and assessments.'],
['Which speech engine and which feedback?','Choose from comparative evidence; separate streaming transcription from acoustic assessment.','Provider, cost, short-phrase accuracy, latency and device footprint are not settled.'],
['What counts as demonstrated learning?','Keep distinct evidence for recognition, tiles, recall and use; do not penalise service uncertainty.','Final mastery criteria, adaptive thresholds and spoken-name exceptions need review.'],
['Where do scenes and the town live?','Use Learn / AI Speaking / Progress / Profile. Open roleplays from AI Speaking and relevant course checkpoints.','The dedicated speaking tab is confirmed; replacing the path with the town or replacing every checkpoint remains open.'],
['How is Dombi’s interaction resolved?','Double-tap for help; put playful tricks elsewhere; allow hiding and muting.','Playground and companion gesture meanings conflict. Memory and sensor rules also need design.'],
['What are fair habit and economy rules?','Start from the current lesson streak, free weekly freeze and learning-earned Apples.','Quick Win credit, repair, quests, earning amounts, prices, XP and league fairness are not final.'],
['What can be shared?','Private voice remains private. Make profile visibility and family reports explicit.','Discoverability, younger-user defaults, account recovery and report handling require further choices.'],
['What does Premium include?','Budget live voice first and define a clear free learning promise.','Prices, allowances, full-course entitlements, family management and payment integration are undecided.'],
['When do reminders stay quiet?','At most one proactive practice reminder at a chosen time; suppress after completion; use truthful context.','Quiet hours, social digests, comeback timing, channel duplication and wider limits remain proposals.'],
])+
h('The boundary of this work')+
p('This document defines the product, learner journeys, feature behavior, visual and interaction language, data and service responsibilities, and unresolved decisions. It does not include external publication, store submission, launch marketing or a launch checklist. The current Android app remains the build priority. The separate screen atlas is a visual reference that supports this explanation; it is not the blueprint itself.')+
note('What “complete” means here','Every known feature family and original planning document is accounted for, including the full 16 exercise types and all 17 learner-facing AI proposals. Some choices are intentionally open because the original plans did not decide them. A complete blueprint can expose an unresolved choice; it must not invent your approval.','agreed'),
['product-definition.md','pages.md','ai-plan.md','tech-stack.md','speech-and-retention-research.md']),
];
