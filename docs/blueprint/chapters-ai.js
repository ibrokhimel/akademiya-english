import {chapter,p,h,steps,table,note} from './content.js';

export const aiSpeaking=chapter('ai-speaking','AI Speaking','A dedicated home for live conversation',
'AI Speaking is a main tab in the full application. The learner opens it directly to practise talking, without having to enter through Dombi.',
table(['Mode','What the learner does','What the app does'],[
['Free conversation','Choose a topic and speak in a natural back-and-forth exchange.','Give short, relevant replies that leave room for the learner’s voice.'],
['Guided conversation','Start from a useful prompt, with a hint or sentence starter when needed.','Provide support without silently supplying a complete answer before the learner tries.'],
['Situational roleplay','Handle a café, travel, shopping or work task with a character.','Use the scene goal, help ladder, meaningful replies and replay twists.'],
])+
h('How someone uses the tab')+
steps([
['Choose','Open AI Speaking, then select a topic, guided practice or a situation.'],
['Start deliberately','See the goal and begin listening explicitly. The microphone is not always on.'],
['Talk and respond','Speak, see live text when available, hear a short AI reply and continue. Interrupt or stop when needed.'],
['Get useful help','Ask for a hint, a model or an appropriate explanation. Recognition uncertainty is not treated as proof of poor English.'],
['Finish with something useful','See a concise recap and an optional phrase to practise. Conversation phrase saving and precise feedback criteria remain design choices.'],
])+
p('The course can lead into a relevant roleplay, and Dombi can offer a shortcut into AI Speaking. These are additional entrances to the same speaking destination. The Learn tab keeps the structured curriculum; Progress keeps evidence and private recordings; Profile keeps settings and personal features.')+
p('AI Speaking is not hidden behind course completion. A beginner can start with guidance, and a more confident learner can choose a freer exchange. Topic difficulty, access allowances and exact feedback still need design; the dedicated destination itself is part of the confirmed full-app direction.')+
note('Confirmed direction; implementation still planned','The owner requested a dedicated AI speaking tab on 23 October 2026. This supersedes carrying the MVP’s three-tab layout into the full app. The current Android build still has three tabs and no live AI conversation service. Providers, costs, limits and exact topic catalogues remain open.','agreed'),
['pages.md','companion-pet.md','ai-plan.md','scene-simulation-concept.md']);
