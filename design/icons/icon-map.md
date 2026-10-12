# Icon map — what replaces what

Source of truth: Rive file **"test"** (artboards `icon/*` = multi-colour, `glyph/*` = single-colour, recolourable).
SVG sources: `design/icons/build_icons.py` (v1, 16 icons) and `build_icons2.py` (v2, 63 icons).
Status: **v2 waiting for owner approval** in Rive, then swap into Pencil.

## Glyphs (replace lucide line icons; one path, colour set per use)

| lucide in Pencil | Rive glyph |
|---|---|
| check | glyph/check |
| x | glyph/close |
| chevron-right / chevron-left | glyph/chevron-right / glyph/chevron-left |
| lock | glyph/lock |
| volume-2 | glyph/speaker |
| mic / mic-off | glyph/mic / glyph/mic-off |
| play | glyph/play |
| rotate-ccw | glyph/replay |
| ellipsis | glyph/more |
| list-checks | glyph/list |
| timer | glyph/timer |
| user / user-round | glyph/user |
| message-circle | glyph/message |
| target | glyph/target |
| bell | glyph/bell |
| shield | glyph/shield |
| trash-2 | glyph/trash |
| info | glyph/info |
| wifi-off | glyph/wifi-off |
| snail | glyph/slow |
| audio-lines | glyph/wave |
| sparkles | glyph/sparkles |
| circle-check | glyph/circle-check |
| smartphone | glyph/phone |
| house / trending-up | glyph/home / glyph/chart (icon-only tabs use icon/tab-*) |
| star | glyph/star |

## Illustrated (replace emoji placeholders)

| Emoji | Rive icon | Emoji | Rive icon |
|---|---|---|---|
| 💡 | icon/bulb-tip | 🎉 | icon/party-popper |
| ✨ | icon/sparkles | 🤩 | icon/face-starstruck |
| 😄 | icon/face-grin | 🙂 | icon/face-smile |
| 🥺 | icon/face-pleading | 😵 | icon/face-dizzy |
| 💰 | icon/money-bag | 💳 | icon/card |
| 👋 | icon/hand-wave | 🙌 | icon/hands-up |
| 🧊 | icon/ice-freeze | 🎯 | icon/target |
| 📅 | icon/calendar | 🔁 | icon/repeat |
| 🎓 | icon/grad-cap | 🗑 | icon/trash |
| 🔔 | icon/bell | 📡 | icon/no-wifi |
| 🗣 | icon/speak-bubble | 🎙 | icon/studio-mic |
| 🎒 | icon/backpack | 📝 | icon/notepad |
| ✈️ | icon/plane | 💼 | icon/briefcase |
| 💛 | icon/heart | 🌱 | icon/sprout |
| 🌿 | icon/plant | 👑 | icon/crown (after MVP) |
| 🥈 | icon/medal-silver (after MVP) | 🎩 | icon/top-hat (after MVP) |
| 🧣 | icon/scarf (after MVP) | ⏩ | icon/skip-ahead (after MVP) |
| 🔥 💬 🍎 🏆 ☕ 🛒 🔒 | v1 icons (flame-streak, bubble-phrases, apple-currency, trophy-unit, coffee-kafeda, cart-dokon, glyph/lock) | | |

## Lesson pictures (2026-10-12, waiting for owner approval)

Things the learner names in E1, E2 and E6. Built by `build_lesson_pics.py` into `lesson/*.svg`; PNG copies in
`pendev/icons-r2/lesson-*.png`. Not in Rive yet.

| Emoji placeholder | Picture |
|---|---|
| 🍵 | lesson/tea (green teapot) |
| 🥤 | lesson/orange-juice |
| ☕ | icon/coffee-kafeda (existing) |
| — | lesson/water, lesson/sandwich, lesson/samsa, lesson/salad |

## Not icons (left as they are)

- 🧑‍🍳 waiter → Rive characters `Waiter A` / `Waiter C` (2026-10-12); 🐾 pet → Dombi. Not icons.
- Path G (Duolingo copy) → keeps Duolingo's own look as a reference.
- Google / Apple sign-in → must use the **official brand logos**.
- Café-world decor (🥐🧁🍵🥤🍰) and street buildings (🏠🌳🏪🏦) → after-MVP illustration work.
