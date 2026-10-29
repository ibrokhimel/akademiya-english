// Everything Dombi can act, as data (spec §4.1). Adding an emote = draw it in Rive + one line here.
// rig: { trigger } fires a view-model trigger; { enum, value } sets play / gesture / mood for `ms`, then hands it back.
// life: how often the living picker takes it in each state (0 = never); packs: weight multipliers per personality.
// talk: false = touch-only (it needs a finger on him), never used in a talk. mouth: uses his mouth, so never over his voice.
const T = (trigger) => ({ trigger }), E = (en, value) => ({ enum: en, value });
const L = (idle = 0, listening = 0, talking = 0) => ({ idle, listening, talking });
const a = (id, rig, family, kind, ms, use, words = [], more = {}) =>
  ({ id, rig, family, kind, ms, use, words, mouth: false, big: false, life: L(), talk: true, ...more });

export const CATALOG = [
  // celebrate
  a('celebrate', T('celebrate'), 'celebrate', 'once', 1400, 'a big win or a huge relief: they finally got it, great news', ['finally', 'nihoyat', 'we did it', "let's go", 'there it is'], { big: true, packs: { drama: 2, kind: 0.5 } }),
  a('clap', T('clap'), 'celebrate', 'once', 670, 'a high-five moment: agreeing hard, a small win together', ['high five', 'high-five', 'beshlik', 'deal']),
  a('correct', T('correct'), 'celebrate', 'once', 1200, 'they said it right; approval, a fist pump', ['perfect', 'exactly', 'nailed it', "zo'r", 'barakalla', 'correct', "to'g'ri"]),
  a('gesture:celebrate', E('gesture', 'celebrate'), 'celebrate', 'once', 2100, 'pure joy, both hands up', ['yay', 'hooray', 'ura']),
  a('mood:happy', E('mood', 'happy'), 'celebrate', 'face', 2500, 'pleased, a warm smile'),
  a('mood:laugh', E('mood', 'laugh'), 'celebrate', 'face', 2500, 'something is really funny'),
  a('mood:proud', E('mood', 'proud'), 'celebrate', 'face', 2500, 'proud of them or of himself'),
  // show-off
  a('trickSpin', T('trickSpin'), 'show-off', 'once', 670, 'showing off, being cool, "watch this"', ['watch this', 'tomosha qil', 'spin'], { life: L(0.4), packs: { funny: 2 } }),
  a('trickFlick', T('trickFlick'), 'show-off', 'once', 730, 'a cocky flick: "easy", "obviously"', ['easy', 'oson', 'obviously'], { life: L(1), packs: { rude: 1.5, funny: 1.5 } }),
  a('trickShades', T('trickShades'), 'show-off', 'once', 1600, 'too cool: sunglasses on', ['cool', 'too cool', 'swag', 'drip'], { big: true, packs: { drama: 2, funny: 2 } }),
  a('smug', T('smug'), 'show-off', 'once', 1070, 'smug, he knew it all along, a slow cool blink', ['told you', 'i knew it', 'bilardim'], { life: L(1), packs: { rude: 2 } }),
  a('dress', T('dress'), 'show-off', 'once', 1070, 'clothes, outfits, looking good', ['outfit', 'clothes', 'kiyim', 'doppi', 'dress'], { big: true, packs: { drama: 2 } }),
  a('grow', T('grow'), 'show-off', 'once', 730, 'feeling big, bragging, puffing up', ['bigger', 'grow', 'katta'], { big: true }),
  a('mood:wink', E('mood', 'wink'), 'show-off', 'face', 2000, 'a joke between friends, a wink', [], { life: L(0.5, 0, 0.3) }),
  // surprise
  a('mood:surprised', E('mood', 'surprised'), 'surprise', 'face', 2000, 'shock, "no way", "really?"'),
  a('hop', T('hop'), 'surprise', 'once', 500, 'a jump: startled or excited', ['jump', 'sakra', 'hop']),
  a('land', T('land'), 'surprise', 'once', 670, 'landing after a fall or a jump', ['fell', 'fall', 'yiqildim']),
  // think
  a('mood:think', E('mood', 'think'), 'think', 'face', 2500, 'thinking it over'),
  a('mood:confused', E('mood', 'confused'), 'think', 'face', 2500, 'confused, did not get it'),
  a('gesture:thinking', E('gesture', 'thinking'), 'think', 'loop', 2500, 'hand on chin, thinking hard', ['let me think', "o'ylab", 'hmm'], { life: L(0, 0.5, 0.5) }),
  // annoyed
  a('poke2', T('poke2'), 'annoyed', 'once', 800, 'sceptical: "hey", "really?", one eye narrowed', ['seriously', 'really', 'rostdanmi', 'hey'], { packs: { rude: 2 } }),
  a('poke3', T('poke3'), 'annoyed', 'once', 930, 'annoyed, shooing it away: "stop", "go away"', ['stop', 'go away', 'bas', 'ket', 'ugh'], { packs: { rude: 2 } }),
  a('shook', T('shook'), 'annoyed', 'once', 1330, 'rattled, shaken up, then a flat annoyed stare', ['shook', 'shaking', 'shake', 'silkit'], { packs: { drama: 1.5 } }),
  a('mood:focus', E('mood', 'focus'), 'annoyed', 'face', 2500, 'determined, focused, serious'),
  // dizzy, food
  a('dizzy', T('dizzy'), 'dizzy', 'once', 1830, 'dizzy, spinning head, too much', ['dizzy', 'spinning', 'boshim aylandi', 'aylandi']),
  a('eat', T('eat'), 'food', 'once', 1000, 'food, eating, hungry, a dish he loves', ['samsa', 'plov', 'osh', 'ovqat', 'shashlik', "lag'mon", 'manti', 'pizza', 'burger', 'food', 'eat', 'eating', 'hungry', 'delicious', 'yummy', 'mazali'], { mouth: true }),
  // lazy
  a('play:sleep', E('play', 'sleep'), 'lazy', 'loop', 4000, 'tired, sleepy, bored to sleep', ['sleep', 'sleepy', 'tired', 'uxla', 'charchadim', 'zzz'], { big: true, life: L(0.3), packs: { dangasa: 5, kind: 0.5 } }),
  a('wake', T('wake'), 'lazy', 'once', 1670, 'waking up, a big yawn and stretch', ['wake up', "uyg'on", 'yawn'], { mouth: true, life: L(0.2), packs: { dangasa: 3 } }),
  a('play:warm', E('play', 'warm'), 'lazy', 'loop', 3000, 'cold, warming his hands', ['cold', 'freezing', 'sovuq', 'warm'], { life: L(0.3) }),
  a('mood:sleepy', E('mood', 'sleepy'), 'lazy', 'face', 2500, 'lazy, sleepy', [], { packs: { dangasa: 3 } }),
  // greet, explain, oops
  a('gesture:wave', E('gesture', 'wave'), 'greet', 'once', 2000, 'hello or goodbye', ['hello', 'hi', 'salom', 'bye', 'xayr', 'assalomu alaykum']),
  a('gesture:point', E('gesture', 'point'), 'explain', 'once', 1200, 'pointing at something, "look", "this one"', ['look', 'this one', 'mana', 'qara'], { life: L(0, 0, 1) }),
  a('mood:oops', E('mood', 'oops'), 'oops', 'face', 2000, 'oops, his own mistake'),
  a('ahem', T('ahem'), 'oops', 'once', 930, 'covering an awkward moment: "anyway", clearing his throat', ['ahem', 'anyway', 'ehem'], { life: L(0.3) }),
  a('wrong', T('wrong'), 'oops', 'once', 900, 'not quite right: a glance away, "hm"', ['nope', 'not quite', 'wrong', 'xato']),
  // listen and the idle breaks (the page fires these since the rig's own random breaks stop with `directed`)
  a('mood:listen', E('mood', 'listen'), 'listen', 'face', 3000, 'listening closely', [], { life: L(0, 3) }),
  a('nod', T('nod'), 'listen', 'once', 900, 'agreeing, "yeah", "right"', ['yeah', 'right', 'ha', 'mhm'], { life: L(2, 3, 0.5) }),
  a('leanBack', T('leanBack'), 'listen', 'once', 1600, 'leaning back, relaxed', [], { life: L(2, 1), packs: { dangasa: 2 } }),
  a('lookAround', T('lookAround'), 'listen', 'once', 1800, 'looking around', [], { life: L(3, 1) }),
  a('weightShift', T('weightShift'), 'listen', 'once', 1200, 'shifting his weight', [], { life: L(3, 0.5) }),
  a('idleHop', T('idleHop'), 'move', 'once', 750, 'a small restless hop', [], { life: L(1) }),
  a('blink', T('blink'), 'listen', 'once', 500, 'a slow cool blink', [], { life: L(2, 2, 1) }),
  a('play:peek', E('play', 'peek'), 'listen', 'loop', 3000, 'peeking round a corner, sneaky, a secret', ['peek', 'secret', 'sir', 'hide'], { life: L(0.5) }),
  // move, offer
  a('play:walk', E('play', 'walk'), 'move', 'loop', 1500, 'walking somewhere (the stage moves him)', []),
  a('play:highfive', E('play', 'highfive'), 'offer', 'loop', 2500, 'offering a high-five, waiting for it', ['gimme five', 'qo\'l ber']),
  a('playoff', T('playoff'), 'offer', 'once', 1070, 'a high-five left hanging: plays it off', ['left hanging']),
  a('snap', T('snap'), 'move', 'once', 500, 'snapping back into shape', []),
  // touch-only: they need a finger on him
  a('play:held', E('play', 'held'), 'touch', 'loop', 2000, 'carried on a finger', [], { talk: false }),
  a('play:pet', E('play', 'pet'), 'touch', 'loop', 2000, 'being rubbed', [], { talk: false }),
  a('play:wind', E('play', 'wind'), 'touch', 'loop', 2000, 'being blown at', [], { talk: false }),
  a('play:back', E('play', 'back'), 'touch', 'loop', 3000, 'turns his back after too many pokes', [], { talk: false }),
  a('tapped', T('tapped'), 'touch', 'once', 600, 'tapped', [], { talk: false }),
  a('poke1', T('poke1'), 'touch', 'once', 530, 'first poke', [], { talk: false }),
];
