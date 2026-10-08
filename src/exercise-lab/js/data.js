// Sample content for Unit 3 "At the café". Placeholder pictures are emoji until the art style is chosen.

// task = the situation given in Uzbek/Russian for Say What You See (the cue for recall).
const PH = [
  { id: 'coffee', pic: '☕', en: "I'd like a coffee, please.", uz: 'Menga bitta qahva, iltimos.', ru: 'Мне кофе, пожалуйста.',
    task: { uz: "Siz qahva xohlaysiz. Ofitsiantga ayting.", ru: 'Вы хотите кофе. Скажите официанту.' } },
  { id: 'price', pic: '💰', en: 'How much is it?', uz: 'Bu qancha turadi?', ru: 'Сколько это стоит?',
    task: { uz: "Narxini so'rang.", ru: 'Спросите, сколько это стоит.' } },
  { id: 'spicy', pic: '🌶️', en: 'Is it spicy?', uz: 'Bu achchiqmi?', ru: 'Это острое?',
    task: { uz: "Taom achchiqmi-yo'qmi, so'rang.", ru: 'Спросите, острое ли блюдо.' } },
  { id: 'tea', pic: '🍵', en: 'Can I have tea instead?', uz: "Uning o'rniga choy olsam bo'ladimi?", ru: 'Можно мне вместо этого чай?',
    task: { uz: "Qahva o'rniga choy so'rang.", ru: 'Попросите чай вместо кофе.' } },
  { id: 'card', pic: '💳', en: 'Can I pay by card?', uz: "Karta bilan to'lasam bo'ladimi?", ru: 'Можно оплатить картой?',
    task: { uz: "Karta bilan to'lash mumkinmi, so'rang.", ru: 'Спросите, можно ли оплатить картой.' } },
];

// One-line explanations from the Uzbek/Russian mistake engine.
const WHY = {
  heShe: { uz: "O'zbek tilida «u» ham erkak, ham ayol uchun. Ingliz tilida tanlang: he — erkak, she — ayol.", ru: 'Brother — это «он», значит he. She — только для женщин.' },
  plural: { uz: "O'zbekchada «uchta kitob» deymiz. Ingliz tilida birdan ko'p bo'lsa -s qo'shiladi: three books.", ru: 'После числа больше одного в английском нужно -s: three books, two sisters.' },
  since: { uz: '«2020-yildan beri shu yerdaman» — inglizchada Present Perfect kerak: I have been here since 2020.', ru: '«Я здесь с 2020 года» — по-английски нужно Present Perfect: I have been here since 2020.' },
  polite: { uz: "«I'd like» — «I want» dan muloyimroq. Kafeda «I'd like…» deng.", ru: "«I'd like» вежливее, чем «I want». В кафе говорите «I'd like…»." },
  article: { uz: "O'zbek tilida artikl yo'q. Bitta narsa birinchi marta tilga olinsa — «a», ma'lum narsa — «the».", ru: 'В русском нет артиклей. «A» — одна вещь впервые, «the» — то, о чём уже знаем.' },
  wordOrder: { uz: "O'zbekchada fe'l oxirida keladi. Ingliz tilida tartib qat'iy: kim → nima qiladi → nimani.", ru: 'Порядок слов в английском строгий: кто → что делает → что.' },
  byCard: { uz: "To'lov usuli uchun «by» ishlatiladi: by card, by cash emas — in cash.", ru: 'Способ оплаты — с «by»: pay by card (но in cash).' },
  chunkLike: { uz: "«I'd like» — tayyor ibora: I'd dan keyin like o'zgarmaydi (-s yoki -ing qo'shilmaydi).", ru: "«I'd like» — готовая фраза: после I'd глагол без -s и -ing." },
  howMuch: { uz: "Narx so'ralganda «How much…?» ishlatiladi. «How many» — sanaladigan narsalar soni uchun.", ru: 'О цене спрашивают «How much…?». «How many» — о количестве предметов.' },
  perfectRule: { uz: "have/has + fe'lning 3-shakli: o'tmishda boshlangan va hozir ham davom etayotgan ish.", ru: 'have/has + 3-я форма глагола: действие началось в прошлом и продолжается сейчас.' },
  pluralRule: { uz: "Birdan ko'p sondan keyin ot -s oladi: two coffees, ten minutes.", ru: 'После числа больше одного существительное получает -s: two coffees, ten minutes.' },
};

const TILES = [
  { l1: { uz: 'Menga bitta choy, iltimos.', ru: 'Мне чай, пожалуйста.' }, ans: ["I'd", 'like', 'a', 'tea,', 'please.'], extra: ['want', 'the'], why: 'polite' },
  { l1: { uz: "Karta bilan to'lasam bo'ladimi?", ru: 'Можно оплатить картой?' }, ans: ['Can', 'I', 'pay', 'by', 'card?'], extra: ['with', 'do'], why: 'wordOrder' },
  { l1: { uz: 'Bu achchiqmi?', ru: 'Это острое?' }, ans: ['Is', 'it', 'spicy?'], extra: ["it's", 'very'], why: 'wordOrder' },
];

// Only one option may be correct English ("I'd love", "How long", "pay with" were removed for that reason).
const CHUNKS = [
  { pic: '☕', pre: "I'd ", post: ' a coffee, please.', opts: ['like', 'likes', 'liking'], a: 'like', why: 'chunkLike' },
  { pic: '💰', pre: 'How ', post: ' is it?', opts: ['much', 'many', 'more'], a: 'much', why: 'howMuch' },
  { pic: '💳', pre: 'Can I pay ', post: ' card?', opts: ['by', 'in', 'at'], a: 'by', why: 'byCard' },
];

const DIALOGS = [
  {
    lines: [
      { who: 'Customer', t: 'Hi! Can I have a green tea, please?' },
      { who: 'Waiter', t: 'Sure. Anything else?' },
      { who: 'Customer', t: 'No, thanks. How much is it?' },
      { who: 'Waiter', t: 'Fifteen thousand som.' },
    ],
    q: 'What did the customer order?',
    opts: [{ p: '🍵', l: 'Green tea', ok: true }, { p: '☕', l: 'Coffee' }, { p: '🥤', l: 'Juice' }],
  },
  {
    lines: [
      { who: 'Customer', t: 'Excuse me, is the soup spicy?' },
      { who: 'Waiter', t: 'Yes, a little.' },
      { who: 'Customer', t: "Then I'd like the salad, please." },
    ],
    q: 'What did the customer choose?',
    opts: [{ p: '🥗', l: 'Salad', ok: true }, { p: '🍲', l: 'Soup' }, { p: '🍕', l: 'Pizza' }],
  },
];

const WHO = [
  { d: 0, line: 'Anything else?', a: 'Waiter' },
  { d: 0, line: 'How much is it?', a: 'Customer' },
  { d: 1, line: 'Yes, a little.', a: 'Waiter' },
];

const MISSING = [
  { full: 'Can I have the menu, please?', pre: 'Can I have the ', post: ', please?', a: 'menu', opts: ['menu', 'money', 'many'] },
  { full: 'The soup is a little spicy.', pre: 'The soup is a little ', post: '.', a: 'spicy', opts: ['spicy', 'sweet', 'salty'] },
  { full: 'That is fifteen thousand som.', pre: 'That is ', post: ' thousand som.', a: 'fifteen', alts: ['15'], opts: ['fifteen', 'fifty', 'five'] },
];

const ECHO = [
  { who: 'Waiter', t: 'Anything else?' },
  { who: 'Waiter', t: 'Here you are.' },
  { who: 'Customer', t: "I'd like a coffee, please." },
];

const PAIRS = [['ship', 'sheep'], ['think', 'sink'], ['live', 'leave'], ['three', 'tree'], ['vest', 'west'], ['full', 'fool']];

const PATTERNS = [
  {
    ex: ['I <b>have lived</b> here for 5 years.', 'She <b>has worked</b> here since 2020.', 'We <b>have known</b> him for a long time.'],
    q: 'When do we use "have + verb"?',
    opts: [{ t: 'Something that started in the past and is still true now', ok: true }, { t: 'Something that finished yesterday' }, { t: 'A plan for tomorrow' }],
    why: 'perfectRule',
  },
  {
    ex: ['two <b>coffees</b>', 'three <b>books</b>', 'ten <b>minutes</b>', 'one <b>tea</b>'],
    q: 'What happens to a word after a number bigger than one?',
    opts: [{ t: 'It gets -s at the end', ok: true }, { t: 'It stays the same' }, { t: 'It gets -ing at the end' }],
    why: 'pluralRule',
  },
];

// Every item has a context line so exactly one answer is right.
const CTX = {
  brother: { uz: 'Aziz akasini tanishtiryapti:', ru: 'Азиз знакомит вас со своим братом:' },
  books: { uz: 'Malika do\'konda uchta kitob so\'rayapti:', ru: 'Малика просит в магазине три книги:' },
  tashkent: { uz: 'Timur 2020-yildan beri Toshkentda yashaydi va hozir ham shu yerda:', ru: 'Тимур живёт в Ташкенте с 2020 года и сейчас тоже там:' },
  sisters: { uz: 'Dilnoza akasi haqida gapiryapti. Akasining ikkita singlisi bor:', ru: 'Дилноза рассказывает о брате. У него две сестры:' },
};

const MISTAKES = [
  { ctx: 'brother', words: ['She', 'is', 'my', 'brother.'], wrong: 0, fix: 'He', why: 'heShe' },
  { ctx: 'books', words: ['I', 'want', 'three', 'book.'], wrong: 3, fix: 'books.', why: 'plural' },
  { ctx: 'tashkent', words: ['I', 'am', 'here', 'since', '2020.'], wrong: 1, fix: 'have been', why: 'since' },
];

const FIXSAY = [
  { ctx: 'tashkent', wrong: 'I am here since 2020.', a: 'I have been here since 2020.', why: 'since' },
  { ctx: 'sisters', wrong: 'He has two sister.', a: 'He has two sisters.', why: 'plural' },
  { ctx: 'brother', wrong: 'She is my brother.', a: 'He is my brother.', why: 'heShe' },
];

const GUIDED = [
  { c: 'Hot or iced?', opts: ['Hot, please.', 'Iced, please.'], react: { 'Hot, please.': 'One hot coffee. Anything else?', 'Iced, please.': 'Iced coffee, good choice. Anything else?' } },
  { c: 'For here or to go?', opts: ['For here, please.', 'To go, please.'], react: { 'For here, please.': 'Great, take any table you like.', 'To go, please.': "Sure, I'll put a lid on it." } },
  { c: 'Would you like some cake?', opts: ['Yes, please.', 'No, thank you.'], react: { 'Yes, please.': 'Our honey cake is very good today.', 'No, thank you.': 'No problem. That is twenty thousand som.' } },
];

// Offline waiter for Free Reply. The real app uses an AI model here.
const MENU = { coffee: 'coffee', tea: 'tea', cake: 'cake', water: 'water', juice: 'juice', plov: 'plov', samsa: 'samsa', soup: 'soup', salad: 'salad', latte: 'latte' };
