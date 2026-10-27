# Codex prompts · Profile customization art (A2)

For the screens in Pencil, section "Redesign · Profile customization". Plan:
[2026-10-27-build-profile-customization.md](../../docs/superpowers/plans/2026-10-27-build-profile-customization.md), Task A2.

## How to use

1. Run Codex in the repo root on the Mac.
2. Paste **Shared style**, then **one** batch. Do one batch per run so you can check it before the next.
3. Codex saves into `design/profile-art/out/<batch>/` with the exact file names given.
4. Check each batch against the list at its end. I then put the PNGs into Pencil and the app.

**Two ways of making art:**
- **Batches 1, 3 and 4** are simple shapes that must line up exactly. Codex writes them as **SVG code** and then
  exports PNG, so every ring, tile and avatar part fits the same grid.
- **Batches 2 and 5** are pictures (city scenes, app icons). Codex **generates images** for these.

**Not in these prompts:** Dombi himself and his hats, scarves and other items. Those are made in Rive so he stays
on-model. No prompt may draw Dombi, except the app icons in batch 5, which copy the existing icon.

---

## Shared style (paste first, every time)

```
You are making art for Akademiya English, a phone app that teaches English to Uzbek speakers (teens and
adults). Match the existing art in pendev/icons-r2/ (look at crown.png, lesson-tashkent.png, trophy-unit.png,
flame-streak.png before you start).

Style rules:
- Flat vector look. No outlines, no gradients, no textures, no noise, no drop shadows, no 3D, no glow.
- Rounded, chunky shapes with soft corners. Depth comes only from a second, darker shade of the same colour
  on one side (like the darker band on crown.png).
- Bright, clean colours. Use this palette and nothing far from it:
  violet #7B5CFF, violet dark #5A3FD9, violet wash #EFEBFF,
  gold #FFCB2E, gold dark #E0A800, gold wash #FFF6D1,
  green #1DB45A, green dark #14904A, green wash #E3F6EA,
  orange #F29D0C, orange wash #FFF1DC,
  red #E5394A, coral #FF6B5B,
  blue #1CB0F6, blue dark #1A8FD0, sky #BDE8FF,
  ink #14161B, paper #F4F5F7, white #FFFFFF.
- Uzbek motifs (ikat, suzani, Rishtan ceramics, Samarkand tilework) are simplified into a few bold flat shapes,
  never fine detail. They must read at 64 px.
- No text, letters or numbers inside the art unless a prompt asks for them.
- No people's faces in scenes. No flags. No logos. No religious figures.
- Never draw the mascot Dombi unless the prompt says so.
- Save every file at the exact path and name given. PNG files have a transparent background unless the prompt
  says "opaque".
```

---

## Batch 1 · Avatar frames (SVG → PNG)

```
Make avatar frames: decorated rings that sit around a round profile picture.

Grid (same for every file):
- Canvas 1024 × 1024, transparent.
- The picture hole is a circle centred at (512, 512) with radius 400. It must stay fully transparent.
  Nothing may be drawn inside radius 400.
- The ring is drawn between radius 400 and radius 500. Decorations may stick out to radius 512 at most.
- Keep the ring visually even all the way round, so it looks right at any size from 64 px to 160 px.

Write each frame as a clean SVG (only <circle>, <path>, <rect>, <g>, fills from the palette), save it as
design/profile-art/out/frames/<name>.svg, then export PNG 1024 × 1024 to design/profile-art/out/frames/<name>.png
(use sharp or rsvg-convert; add a small script at design/profile-art/export.mjs and reuse it in later batches).

Frames:
1. streak-7     – orange ring, 7 small flame shapes spaced evenly on it.
2. streak-30    – orange-to-red two-tone ring, 12 flames, a little thicker than streak-7.
3. streak-100   – red ring with gold flames, a gold band on the inner edge.
4. streak-365   – gold ring with red flames and 4 small gold sparkles at 12, 3, 6 and 9 o'clock.
5. unit-cafe    – warm brown/orange ring with 6 tiny coffee cups and steam curls.
6. unit-shop    – blue ring with 6 tiny shopping bags.
7. level-a1     – violet ring with one gold star at 12 o'clock.
8. level-a2     – violet ring, two gold stars at 11 and 1 o'clock.
9. level-b1     – violet dark ring, three gold stars along the top.
10. level-b2    – violet dark ring, four gold stars along the top, thin gold inner band.
11. level-c1    – ink ring with a gold inner band and five gold stars along the top.
12. ikat        – ring made of repeating ikat diamond shapes in violet, coral and white (soft, blurred-looking
                  edges drawn as stepped flat shapes, not real blur).
13. suzani      – coral ring with round suzani flowers (big circle, petal ring) in red, gold and green.
14. rishtan     – deep blue (#1A8FD0) ring with white and sky-blue Rishtan ceramic petals.
15. samarkand   – turquoise and blue tile ring with small gold eight-point stars, like Registan tilework.
16. navruz      – green ring with small white and pink blossoms and sprouts (sumalak season, spring).
17. independence – sky blue and white ring with small gold sun shapes (no flag, no text).
18. new-year    – ice blue ring with white snowflakes.
19. ramadan     – deep violet ring with a small gold crescent at 12 o'clock and tiny gold stars.
20. perfect     – a thin, clean gold ring (radius 440–500 only) with 3 small sparkles at the top right.
21. speaker     – violet ring with small sound-wave arcs and one small microphone at 12 o'clock.

Also export a preview sheet design/profile-art/out/frames/_sheet.png: all 21 frames in a 6-column grid on
paper #F4F5F7, each with a plain violet circle in the hole, name under each.
```

**Check:** the hole is empty on every frame, rings line up when stacked, and they still read at 64 px.

---

## Batch 2 · Profile banners (generated images, opaque)

```
Make profile banner pictures. They sit at the top of the profile page, behind the user's avatar and buttons.

Size and layout for every file:
- Opaque PNG, 1170 × 600 (the banner is 390 × 199 points at 3x).
- Keep the bottom-left area (left 40%, bottom 35%) calm and low in detail: the avatar sits over it.
- Keep the top-right corner (right 25%, top 25%) calm: two round buttons sit there.
- Flat vector illustration, same style as the shared style. Soft daytime light unless the name says otherwise.
- No people, no text, no signs, no flags.

Save to design/profile-art/out/banners/<name>.png:
1. registan      – Registan square in Samarkand: three madrasa facades with blue domes and tiled portals,
                   simplified, warm sand-gold ground, sky-blue sky.
2. khiva         – Itchan Kala walls and the short Kalta Minor minaret, warm clay colours, blue tile bands.
3. tv-tower      – Tashkent TV tower with green trees and a few simple buildings (like lesson-tashkent.png).
4. chorsu        – Chorsu bazaar's big blue-green dome with fruit stalls (pomegranates, melons) in front.
5. amir-temur    – Amir Timur square: round green park, the domed museum in the back. No statue of a person,
                   show trees and fountains instead.
6. scene-cafe    – inside a cosy cafe: counter, coffee machine, cups, warm brown and cream.
7. scene-shop    – inside a clothes shop: rails of colourful T-shirts, a mirror, a counter.
8. scene-airport – airport window with a plane outside, seats, a departures board shown as plain coloured rows.
9. apricot       – apricot trees in spring blossom, soft pink and white, green hills.
10. chimgan      – Chimgan mountains with snow, pine trees, clear sky.
11. fergana      – a Fergana Valley orchard in summer: rows of fruit trees, a small stream, warm light.
12. night-city   – Tashkent at night: dark violet sky (#2B2250), city lights, the TV tower lit up.

Also save design/profile-art/out/banners/_sheet.png: all 12 in a 3-column grid with a 1170 × 600 safe-area
overlay (a white circle at bottom-left where the avatar goes, two small circles top-right).
```

**Check:** nothing important sits under the avatar or the buttons, and the style matches the lesson pictures.

---

## Batch 3 · Seamless patterns (SVG → PNG)

```
Make seamless, tileable patterns. They are used as avatar backgrounds, profile page backgrounds, banners and
lesson backgrounds, so they must be calm enough to put text and cards on top.

For every pattern:
- Tile 512 × 512, opaque. It must repeat with no visible seam on all four sides (draw shapes that cross an
  edge on both sides).
- Two versions: <name>-light (light base, low contrast, like violet wash #EFEBFF or paper) and <name>-dark
  (base #1B1C22, motif in a muted colour about 15% brighter than the base).
- Keep the motif soft: maximum 3 colours per version, nothing louder than the brand violet.

Write SVG to design/profile-art/out/patterns/<name>-light.svg and -dark.svg, and export each as PNG 512 × 512
and 1024 × 1024 (<name>-light@2x.png) with the export script from batch 1.

Patterns:
1. ikat       – vertical bands of ikat diamonds, violet and coral on violet wash.
2. atlas      – Khan-atlas style flowing zig-zag waves, violet, coral, gold.
3. suzani     – scattered round suzani flowers, coral and gold on a cream base.
4. rishtan    – Rishtan ceramic petal rosettes, blue and sky on white.
5. samarkand  – eight-point star tile grid, turquoise and blue on paper.
6. dots       – plain soft violet dots, the quiet default.

Also save design/profile-art/out/patterns/_sheet.png showing each pattern tiled 2 × 2 so seams would show.
```

**Check:** no seams in the 2 × 2 sheet, and white text stays readable on every dark version.

---

## Batch 4 · Avatar builder parts (SVG → PNG, layered)

```
Make a layered avatar builder: a flat, round, friendly face built from parts that stack on top of each other.
It must look like the app's other art, not like a cartoon toy. Adults and teens use it, so faces are simple
and calm: no blush, no sparkles in the eyes, no "kawaii" style.

Grid (same for every part, so any parts can be stacked):
- Canvas 1024 × 1024, transparent. The avatar is shown inside a circle, so keep everything inside a circle of
  radius 480 centred at (512, 512).
- Head: an oval centred at (512, 540), 460 wide, 520 tall. Ears at the sides at y 560.
- Eyes sit on the line y = 520, 90 px either side of centre. Brows on y = 440. Mouth on y = 690.
- Shoulders/clothes start at y = 800 and run off the bottom of the circle.

Layer order (bottom → top): clothes, head, ears, beard, mouth, eyes, brows, glasses, hair, hijab, doppi.
Each part is one SVG file with only that part. Export each as PNG 1024 × 1024 too (export script from batch 1).
Save to design/profile-art/out/avatar/<layer>/<name>.svg/.png.

Parts:
- head:    one head + ears shape in 6 skin tones: tone-1 #F6D7B8, tone-2 #EBC09A, tone-3 #D9A27A,
           tone-4 #B97F57, tone-5 #8E5B3B, tone-6 #5E3A26 (darker shade of each on the right side for depth).
- eyes:    6 kinds – round, almond, calm (half-closed), smile (curved), wide, sleepy. Ink #14161B.
- brows:   4 kinds – straight, arched, thick, thin.
- mouth:   4 kinds – small smile, open smile, flat, grin with teeth.
- hair:    10 kinds – buzz cut, short side part, short curly, wavy medium, long straight, long curly, bun,
           ponytail, bob, bald (empty file). Make each in 5 colours: black, dark brown, brown, auburn, blonde.
- beard:   4 kinds – stubble, short beard, full beard, moustache. Same 5 colours as hair.
- glasses: 4 kinds – round, square, thin metal, sunglasses.
- hijab:   4 kinds (ro'mol) – plain wrap in violet, coral, green and blue; when used it replaces the hair.
- doppi:   3 kinds – classic black doppi with white pepper (qalampir) motifs, green doppi, blue doppi.
           It sits on top of the head, slightly to the back.
- clothes: 6 kinds – T-shirt, hoodie, shirt with collar, jacket, chapan with stripes, school blazer.
           In violet, coral, green, blue and ink.

Also save design/profile-art/out/avatar/_sheet.png: 12 example avatars built from mixed parts, shown inside
circles, so I can see that the parts line up.
```

**Check:** in the example sheet, eyes, glasses and hair line up on every head, and the hijab and doppi sit
right.

---

## Batch 5 · App icon variants (generated, opaque)

```
Make alternate app icons. Copy the current icon exactly in layout: src/mobile/assets/icon.png. It shows the
mascot Dombi as a big round dark body (sample its colour from icon.png) peeking in from the right, with one white
rounded-pill eye, on a violet #7B5CFF background. Do not change Dombi's shape, eye or position. Only change what
each variant says.

Every file: opaque PNG 1024 × 1024, square corners (iOS rounds them), no text, nothing important within
100 px of the edges.

Save to design/profile-art/out/app-icons/<name>.png:
1. doppi  – same as icon.png, plus a classic black Uzbek doppi with white pepper (qalampir) motifs sitting on
            top of Dombi's round body, tilted slightly. The doppi follows the body's curve.
2. gold   – background gold #FFCB2E instead of violet. Dombi unchanged.
3. night  – background ink #14161B, Dombi's body a little lighter than now so it still shows, a thin violet
            rim light on his left edge, the eye stays white.
4. ikat   – background is a bold ikat pattern in violet #7B5CFF, violet dark #5A3FD9 and white. Dombi unchanged.

Also make a 180 × 180 preview of each, with corners rounded like an iPhone home screen, in
design/profile-art/out/app-icons/_preview.png.
```

**Check:** Dombi looks the same in all four icons, and they still read as the same app at 60 px.

---

## Already handled elsewhere

- Plain colour frames, colour banners, themes and name colours are drawn by the app from tokens. They need no art.
- The moving banner (clouds, teapot), Dombi's corner props and Dombi's hats, neck items, held items, glasses and
  poses are done in **Rive**.
