# Dombi moment map

Which Dombi the learner sees at each moment of the redesigned app, at each phone level. Plan: `docs/superpowers/plans/2026-10-26-redesign-dombi-states-and-levels.md`. Pencil: section "Redesign · Dombi" → "Moment map".

- **Full:** the Rive rig plays the state in the Full column everywhere.
- **Light:** the Full state plays only where Light says Animated (onboarding, answers, celebrations, per the spec); everywhere else the still pose shows.
- **Still** (and whenever the phone's Reduce Motion is on): the still pose always.

| Moment | Where | Full (Rive) | Light | Still pose |
|---|---|---|---|---|
| Idle on a tab | Learn, Speak, Practice, Me (overlay, quiet) | mood smile; breathing, blinks, glances | Still pose | Dombi / 80 / default |
| Guide bubble (welcome back, a tip, "this one is new") | Tab headers (Dombi guide / small) | talking while the bubble appears, then smile | Still pose | Dombi / 48 / talk |
| Glad after a break | Learn tab, first open after a break | mood happy + gesture wave | Still pose | Dombi / 80 / wave |
| Late at night | Learn tab only | mood sleepy (Z's) | Still pose | Dombi / 80 / sleepy |
| Onboarding, first time on a screen | Onboarding screens | hidden → enter, gesture wave | Animated | Dombi / 150 / wave · happy face |
| Empty tab before lesson 1 | Speak, Practice, Me first-time states | gesture point toward lesson 1 | Still pose | Dombi / 150 / point |
| Your turn to speak | Lesson mic, activity mic (overlay) | listening + amp | Still pose | Dombi / 80 / listen |
| Explaining or reading a phrase | Lesson: new phrase, Dombi reads it (overlay) | talking + amp; looks at the phrase | Still pose | Dombi / 80 / talk |
| Correct | Answer panel / correct | correct trigger | Animated | Dombi / 48 / laugh |
| Not yet | Answer panel / not yet | wrong trigger (blink, tilt, "hm"), never sad | Animated | Dombi / 48 / oops |
| Help offered after two misses | Lesson overlay with bubble | talking, then smile | Still pose | Dombi / 80 / talk |
| Help sheet open | Help sheet | mood smile; talking when a step is read aloud | Still pose | Dombi / 48 / default |
| Mistakes round | Mistakes round divider | mood think + gesture thinking | Still pose | Dombi / 150 / thinking · think face |
| Lesson result, new thing you can say | Lesson result | mood laugh + gesture celebrate | Animated | Dombi / 150 / celebrate · laugh face |
| Level up, perfect lesson | Level up, perfect badge | mood proud, then celebrate | Animated | Dombi / 150 / proud |
| Activity end | Activity end screens (overlay) | mood happy | Animated | Dombi / 80 / happy |
| Dombi talking in a conversation | Guided and free conversation | talking + visemes + amp | Still pose | Dombi / 150 / talk |
| Dombi listening in a conversation | Guided and free conversation | listening + amp | Still pose | Dombi / 150 / listen |
| Guide in a situation scene | Situation screens (overlay, quiet) | mood smile; looks at the character who speaks | Still pose | Dombi / 80 / default |
| Mic off, speech unavailable | Mic-off states in lessons and activities | mood confused, then talking | Still pose | Dombi / 80 / confused |
| Waiting for the server | Any wait (never a spinner) | mood think + gesture thinking | Still pose | Dombi / 80 / think |

Rules: sleepy shows only on the Learn tab late at night. After a miss Dombi is never sad (oops face, wrong reaction). Every row has a still pose.

Setting (owner pick, round 3): one switch "Kamroq harakat" in Settings → Umumiy; on means Still. With Reduce Motion on, the switch is on and shows "Telefoningizda harakat kamaytirilgan."

After the final review (2026-10-26): Correct uses 48 / laugh (48 / happy could not be told from the idle face at that size); "Explaining or reading a phrase" added from motion-plan §5; with Reduce Motion on, the switch is shown on and faded (locked).
