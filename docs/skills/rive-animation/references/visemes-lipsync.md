# 5 — Visemes and lip sync for Dombi (EN / UZ / RU)

Research for a text-driven lip-sync engine: typed text becomes a timed viseme sequence, which drives one number input on Dombi's Rive mouth while the browser's `speechSynthesis` voice speaks.

Conventions: **(inferred)** marks my own reasoning or practice-based advice that no source states directly. **(recall)** marks figures I quote from memory of a published source I could not re-fetch this session. Verify these before treating them as fact. Everything else is backed by the sources at the end, which are numbered [S1]…[S30].

---

## 0. Decisions at a glance

| # | Decision | Why |
|---|---|---|
| 1 | Use **10 mouth shapes** (index 0–9), with 2 optional extras (10, 11) | Rhubarb shows that 6 basic shapes plus up to 3 extras are enough for TV-quality 2D [S4]. Oculus (15) and Azure (22) include distinctions a single white line can't show, such as tongue and teeth gaps (inferred). |
| 2 | Build the set from the Rhubarb/Hanna-Barbera A–H,X shapes, then split "teeth" consonants from **EE** and add a **SH/R** pucker-square | Rhubarb's B shape covers both K/S/T and EE [S4]. On a mouth with no teeth, a wide EE needs its own silhouette (inferred). Russian ш/ж/ч and English ʃ/tʃ/ɹ are lip-rounded, and Oculus CH and Azure 16 give them their own shape [S2][S1]. |
| 3 | Drive Rive with a **number `viseme` 0–9** plus a **number `open` 0–1** for amplitude (optional) | Duolingo uses a Rive State Machine with mouth states that blend, 20+ mouths per character [S20]. Dombi needs far fewer. |
| 4 | Do G2P **in the browser with no server**: Uzbek and Russian by rules, English through `cmu-pronouncing-dictionary` (ISC, about 4.7 MB unpacked) plus NRL letter-to-sound fallback | Uzbek Latin is near-phonemic [S21]. Russian rules are well known [S23]. CMUdict has 134k words [S15]. TalkingHead already ships NRL rules mapped to Oculus visemes, under the MIT licence [S8][S9]. |
| 5 | Time the sequence with **per-phoneme base durations scaled by `rate`**, then **re-anchor at each word `boundary` event** when the voice sends them | Boundary events are unreliable: Google network voices in Chrome send none [S18][S19], and Android sends none [S17]. The engine has to run open-loop and correct itself when events arrive. |
| 6 | Smoothing rules: merge visemes shorter than about 40 ms, hold MBP for at least 60–80 ms, show each shape about 20–40 ms before its sound, and don't close the mouth between words inside a phrase | Rhubarb and animator practice (Section 4). |
| 7 | Uzbek voice: only Azure/Edge **Madina** (F) and **Sardor** (M) exist, as `uz-UZ-MadinaNeural` and `uz-UZ-SardorNeural` [S2b]. In a browser they show up only in **Edge** as "Online (Natural)" voices (inferred). | No local Windows Uzbek voice exists, and Chrome has no Uzbek voice (inferred, verify with `getVoices()`). |

---

## 1. Viseme standards

### 1.1 Preston Blair / Disney chart (the classic 2D set)

Preston Blair's *Advanced Animation* (1947/1994) mouth chart is the source of the "phoneme set" used by Papagayo, Moho and others. Papagayo defaults to the Preston Blair set [S27], and Rhubarb can export Preston Blair names with `--datUsePrestonBlair` [S4]. The names that circulate in the Moho/Papagayo community [S27]:

| Preston Blair shape | Sounds | Look |
|---|---|---|
| **AI** | a, i (as in "eye") | wide open, jaw down |
| **E** | e, ee | open, wide, corners pulled |
| **O** | o | round open |
| **U** | oo, u | small pucker |
| **etc** | c d g k n r s th y z | teeth nearly closed, slightly open |
| **L** | l (th) | open with the tongue tip up behind the teeth |
| **WQ** | w, q(u) | tight pucker, pushed forward |
| **MBP** | m b p | lips closed and pressed |
| **FV** | f v | lower lip tucked under the upper teeth |
| **rest** | silence | relaxed closed |

That makes 10 shapes. The forum notes that the set groups "th" with either L or FV [S27].

### 1.2 Rhubarb Lip Sync (A–F basic, G H X extended)

Quoted from the Rhubarb README [S4]:

| Shape | Description (from the README) | Phonemes |
|---|---|---|
| **A** | Closed mouth for "P", "B", "M". "Almost identical to X, but there is ever-so-slight pressure between the lips." | P B M |
| **B** | "Slightly open mouth with clenched teeth. Used for most consonants (K, S, T, etc.). Also used for some vowels such as the EE in b**ee**." | K S T D N G Z, IY |
| **C** | "Open mouth. Used for vowels like EH (m**e**n) and AE (b**a**t). Also some consonants depending on context." Also the in-between for A/B→D. | EH AE (AH) |
| **D** | "Wide open mouth. Used for vowels like AA (f**a**ther)." | AA |
| **E** | "Slightly rounded mouth. Used for AO (**o**ff) and ER (b**ir**d)." In-between C/D→F; "make sure the mouth isn't wider open than for C." | AO ER |
| **F** | "Puckered lips. Used for UW (y**ou**), OW (sh**ow**), W (**w**ay)." | UW OW W |
| **G** (opt) | "Upper teeth touching the lower lip for F and V." | F V |
| **H** (opt) | "Long L sounds, with the tongue raised behind the upper teeth. At least as far open as C, but not quite as far as D." | L |
| **X** (opt) | "Idle position… used for pauses in speech… almost identical to A, but with slightly less pressure." | silence |

The README says A–F were "invented at the Hanna-Barbera studios… a de-facto standard for 2D animation" [S4]. Two transition rules from it matter for Rive: **A→C→D and B→C→D must look smooth**, and **C→E→F and D→E→F must look smooth**. C and E are the in-between shapes.

### 1.3 Oculus / Meta OVR LipSync (15 visemes)

From the Meta reference table [S3]:

| Viseme | Phonemes | Examples |
|---|---|---|
| sil | neutral | (silence) |
| PP | p, b, m | put, bat, mat |
| FF | f, v | fat, vat |
| TH | th | think, that |
| DD | t, d | tip, doll |
| kk | k, g | call, gas |
| CH | tS, dZ, S | chair, join, she |
| SS | s, z | sir, zeal |
| nn | n, l | lot, not |
| RR | r | red |
| aa | A: | car |
| E | e | bed |
| I (ih) | ih | tip |
| O (oh) | oh | toe |
| U (ou) | ou | book |

TalkingHead uses exactly these 15 codes as the output of its language modules: `'aa','E','I','O','U','PP','SS','TH','CH','FF','kk','nn','RR','DD','sil'` [S8].

### 1.4 Microsoft Azure Speech — 22 viseme IDs

Azure sends `VisemeReceived` events with a `VisemeId` and an `AudioOffset` in ticks (1 tick = 100 ns, so divide by 10,000 to get ms) [S1]. In SSML, `<mstts:viseme type="redlips_front"/>` asks for 2D SVG animation, and `type="FacialExpression"` asks for 3D blend shapes. Blend shapes arrive as a JSON matrix of frames at 60 fps × **55** facial positions with values 0–1, grouped by `FrameIndex` [S1]. The table below comes from [S1]. IDs 0–10 were fetched verbatim. IDs 11–21 are (recall) from the same page and match the published Azure table.

| ID | IPA | | ID | IPA |
|---|---|---|---|---|
| 0 | silence | | 11 | aɪ |
| 1 | æ ə ʌ | | 12 | h |
| 2 | ɑ | | 13 | ɹ |
| 3 | ɔ | | 14 | l |
| 4 | ɛ ʊ | | 15 | s z |
| 5 | ɝ | | 16 | ʃ tʃ dʒ ʒ |
| 6 | j i ɪ | | 17 | ð |
| 7 | w u | | 18 | f v |
| 8 | o | | 19 | d t n θ |
| 9 | aʊ | | 20 | k g ŋ |
| 10 | ɔɪ | | 21 | p b m |

Azure's example output looks like `Viseme ID: 1, Audio offset: 200ms … Viseme ID: 5, Audio offset: 850ms` [S1].

### 1.5 Amazon Polly visemes (X-SAMPA-like single letters)

Polly returns viseme speech marks. The full en-US table [S6] is fetched and reproduced here:

| Polly viseme | en-US phonemes [S6] | ru-RU phonemes [S7] |
|---|---|---|
| `p` | b m p | b bʲ m mʲ p pʲ |
| `t` | d n t | d dʲ t tʲ n nʲ **l lʲ** |
| `S` | dʒ ʃ tʃ ʒ | ʂ ʐ |
| `T` | ð θ | — |
| `f` | f v | f fʲ v vʲ |
| `k` | g k ŋ **h** | g gʲ k kʲ x xʲ |
| `i` | i ɪ **j** | i ɨ j |
| `r` | ɹ | r rʲ |
| `s` | s z | s sʲ z zʲ **t͡s** |
| `u` | u ʊ **w** | u |
| `@` | ə ɚ | ə |
| `a` | æ aɪ aʊ ɑ | a |
| `e` | eɪ | e |
| `E` | ɛ ɝ **ʌ** | ɛ |
| `o` | oʊ | o |
| `O` | ɔ ɔɪ | — |
| `J` | — | ɕː t͡ɕ ʑː (щ ч жж) |
| `sil` | silence | silence |

Polly maps en-US `l` to the `t` viseme and puts `h` with `k` [S6]. It gives Russian a separate `J` viseme for the soft hushing sounds щ/ч [S7].

### 1.6 MPEG-4 FAP visemes (14 + neutral)

MPEG-4 Facial Animation (ISO/IEC 14496-2) defines FAP 1 "viseme" with 14 static visemes plus neutral (recall, from the standard as summarised in the literature [S28]):

| # | Phonemes | # | Phonemes |
|---|---|---|---|
| 0 | none (neutral) | 8 | n, l |
| 1 | p, b, m | 9 | r |
| 2 | f, v | 10 | A: |
| 3 | T, D | 11 | e |
| 4 | t, d | 12 | I |
| 5 | k, g | 13 | Q |
| 6 | tS, dZ, S | 14 | U |
| 7 | s, z | | |

This is the direct ancestor of Oculus's 15. They match one to one: sil PP FF TH DD kk CH SS nn RR aa E ih oh ou (inferred from the identical groupings).

### 1.7 JALI (2016)

JALI (Edwards, Landreth, Fiume, Singh, SIGGRAPH 2016) separates **JA**w and **LI**p activity into two independent sliders on top of a viseme layer. It also models co-articulation explicitly: lip-heavy visemes (MBP, FV, OO) are "protected", and the jaw follows loudness (recall, [S29]). **What we can borrow:** add a second Rive number, `open` (0–1), that scales the height of the current shape by syllable stress or loudness. A stressed "AA" opens fully and an unstressed one opens to about 60%. This is the cheap JALI (inferred).

### 1.8 Which set gives the best quality for the shape count on Dombi?

Constraints on Dombi's mouth: one white round-capped curved line (3 points), or one white filled D/oval (3 vertices). There are no teeth or tongue, though a hint is possible. Things that **can** vary: width, height (openness), roundness (corner→circle), corner lift (smile vs frown), and top-edge flatness (a D shape vs an oval).

- **Oculus 15** keeps DD / kk / SS / nn / TH apart. On a toothless mouth these differ only in teeth and tongue position, so they collapse into a single "slightly open, wide" silhouette (inferred). That makes 5 of the 15 shapes redundant.
- **Azure 22** adds diphthong visemes (aɪ, aʊ, ɔɪ). We get the same result by sequencing two monophthong shapes.
- **Rhubarb A–F + G H X** is the best-proven 2D baseline [S4]. It has two weaknesses for Dombi. B carries both consonants and EE, but a toothless mouth loses EE's character unless it gets its own wide smile slit. It also has no shape for SH/CH/R, which are lip-rounded and very visible in Russian ш ж ч щ and English r, sh (Oculus CH and RR, Azure 13 and 16, and Polly S and r all keep them separate [S3][S1][S6]).

**Result: a 10-shape set.** It is Rhubarb's skeleton with EE split out of B and a SH/R shape added. There are 2 optional extras: an L/TH tongue-hint shape (Rhubarb H) and a small schwa shape.

### 1.9 Recommended Dombi viseme set (Rive number `viseme`)

Measurements are relative to REST. Width is a multiple of the rest mouth width W0. Height is a multiple of W0 (0 means a line). Roundness: 0 is a flat lens or D, 1 is a circle. "Corners" means vertical corner offset in units of W0 (+ is up). In the **line** version, height means the sag of the middle point plus a mirrored "lower lip" curve. In practice the line build only has the middle-point drop, so open shapes show as a deeper U (inferred). The **filled** version is the better build: a 3-vertex closed path with curved tangents can reach every shape below (inferred).

| idx | Name | Rhubarb / Oculus / Azure equivalent | Width | Height | Roundness | Corners | Geometry note (filled-shape build) |
|---|---|---|---|---|---|---|---|
| **0** | **REST** | X / sil / 0 | 1.00 | 0 (line) | – | +0.04 (character smirk) | Dombi's normal closed smirk line. This must be the idle mouth too [S4]. |
| **1** | **MBP** | A / PP / 21 | 0.90 | 0 (line) | – | 0 | The line flattens (smirk removed) and gets 5–8% shorter. The pressed look comes from a slight squash and thicker stroke. Hold ≥ 60–80 ms. |
| **2** | **FV** | G / FF / 18 | 0.95 | 0.10 | 0.1 | −0.02 | Thin flat D upside down: a **flat top edge** (upper teeth) with a shallow curve below. An optional 2-px white "tooth" bar is the teeth hint. Uzbek f is bilabial [ɸ] (see 2.2), so FV can render softly there. |
| **3** | **TEETH** (consonants) | B / DD kk SS nn TH / 15 19 20 | 1.05 | 0.15 | 0.2 | 0 | Slightly open, wide, flat lens. Used for t d n s z k g ŋ θ ð q χ ʁ h and also short ɪ. This is the "default consonant" shape. |
| **4** | **EE** | (B) / I / 6 | 1.25 | 0.20 | 0.15 | +0.08 | Widest, flattest shape, corners pulled up into a smile slit. Used for i iː j (and Russian и, the j-glide in я ю е ё). |
| **5** | **EH** | C / E / 1 4 | 1.10 | 0.40 | 0.45 | +0.02 | Mid-open D: flat top, round bottom. Used for ɛ e æ ə ʌ, Uzbek a [æ] and Russian э е. It is also the **in-between** for any jump from closed to AA [S4]. |
| **6** | **AA** | D / aa / 2 | 1.00 | 0.70 | 0.60 | 0 | Biggest opening: tall D or egg. Used for ɑ a aɪ(start) aʊ(start) and Russian а. |
| **7** | **OH** | E / O / 3 | 0.70 | 0.50 | 0.90 | 0 | Rounded oval, narrower than EH, **never wider-open than EH** [S4]. Used for ɔ ɒ ɜ, Uzbek o [ɒ] and Russian stressed о. In-between for EH/AA → OO. |
| **8** | **OO** | F / U / 7 8 | 0.40 | 0.32 | 1.00 | 0 | Small circle (pucker). Used for u ʊ w uː oʊ(end), Uzbek u and o' [o] and Russian у ю(vowel part). |
| **9** | **SH_R** | – / CH RR / 13 16 5 | 0.65 | 0.28 | 0.55 | 0 | Rounded square with lips pushed forward: a squircle, smaller than OH and less round than OO. Used for ʃ ʒ tʃ dʒ ɹ ɝ ɚ, Russian ш ж ч щ, Uzbek sh ch j. |
| 10 (opt) | **L_TH** | H / (nn TH) / 14 17 | 0.95 | 0.40 | 0.40 | 0 | Shaped like EH plus a small "tongue" bump at top centre. Use it only if the bump can be drawn (the filled build can add a 4th node). Without it, l → EH and θ ð → TEETH. |
| 11 (opt) | **UH** (schwa) | – / – / 1 | 0.85 | 0.22 | 0.5 | 0 | Small, lazy open. Used for unstressed ə and Russian reduced vowels. Without it, ə → EH, and EH gets shortened. |

**Shape ordering:** the indexes are ordered so that "nearby numbers ≈ nearby shapes" for most transitions (0-1-2-3 closed→slight, 4-5-6 spread→open, 7-8-9 round). With a **1D Blend State** this ordering lets a fractional value interpolate between neighbours. Switching between non-neighbours, such as 6→8, should go through an explicit in-between (AA→OH→OO, the Rhubarb D→E→F rule [S4]) (inferred).

**Rive wiring suggestion (inferred):** one State Machine layer called "Mouth". It has a number input `viseme` and 10 states (one keyed pose each). Transitions use `viseme == n` conditions with a 40–60 ms cubic ease mix. Add a second number, `open` (0–1), on an additive layer that scales the mouth group's Y by 0.6 + 0.4·open. This follows Duolingo's approach: separate mouth states blended in the State Machine, running alongside the body animation states [S20].

---

## 2. Phoneme inventories

### 2.1 English — ARPAbet (CMUdict) with IPA (General American)

CMUdict uses 39 phonemes, and vowels carry a stress digit 0/1/2. Example from the npm package: `aachen: 'AA1 K AH0 N'` [S15].

| ARPAbet | IPA | Example | | ARPAbet | IPA | Example |
|---|---|---|---|---|---|---|
| AA | ɑ | odd | | B | b | be |
| AE | æ | at | | CH | tʃ | cheese |
| AH | ʌ (stressed) / ə (AH0) | hut / about | | D | d | dee |
| AO | ɔ | ought | | DH | ð | thee |
| AW | aʊ | cow | | F | f | fee |
| AY | aɪ | hide | | G | g | green |
| EH | ɛ | Ed | | HH | h | he |
| ER | ɝ / ɚ (ER0) | hurt | | JH | dʒ | gee |
| EY | eɪ | ate | | K | k | key |
| IH | ɪ | it | | L | l | lee |
| IY | i | eat | | M | m | me |
| OW | oʊ | oat | | N | n | knee |
| OY | ɔɪ | toy | | NG | ŋ | ping |
| UH | ʊ | hood | | P | p | pee |
| UW | u | two | | R | ɹ | read |
| | | | | S | s | sea |
| | | | | SH | ʃ | she |
| | | | | T | t | tea |
| | | | | TH | θ | theta |
| | | | | V | v | vee |
| | | | | W | w | we |
| | | | | Y | j | yield |
| | | | | Z | z | zee |
| | | | | ZH | ʒ | seizure |

RP differences that matter visually (inferred): RP drops non-prevocalic r (car = /kɑː/), so the SH_R shape disappears there. RP /əʊ/ starts more central, which gives a shorter OH and a later OO. RP /ɒ/ (lot) is rounded, so it maps to OH rather than AA. A US voice will be used, so map GA.

### 2.2 Standard Uzbek (Latin, 1995 orthography)

Uzbek has 6 vowel phonemes and lost vowel harmony in the standard language [S22]. Stress normally falls on the **last syllable** [S22]. The letter→IPA mapping below follows the Wikipedia correspondence chart [S21] and the phonology table [S22]:

| Letter | Cyr. | IPA | Notes |
|---|---|---|---|
| a | а | /a/ → [æ]; [ɑ] near uvulars (q, g', x) | "a" in *cat*, but back [ɑ] in *qalam*, *xat* [S22] |
| b | б | b | |
| d | д | d̪ | dental |
| e | э/е | e | after a vowel or at word start, Cyrillic е = "ye" [S21] |
| f | ф | **ɸ** | bilabial fricative, so no teeth on lip [S21] |
| g | г | ɡ | |
| h | ҳ | h | glottal |
| i | и | i, shortened [ɪ]; [ɨ] near uvulars | [S22] |
| j | ж | dʒ (native); ʒ in some words and Russian loans | *ajdod* [æʒˈdɔd] [S21] |
| k | к | k | |
| l | л | l | |
| m | м | m | |
| n | н | n | |
| o | о | **/ɔ/ ~ [ɒ]** | open back rounded; *hot* (RP), *call* [S21] |
| p | п | p | |
| q | қ | **q** (uvular stop); [q͡χ] word-finally and before consonants | [S22] |
| r | р | r (tap/trill) | |
| s | с | s | |
| t | т | t̪ | |
| u | у | u, shortened [ʊ]; [ʉ] near uvulars | [S22] |
| v | в | **w ~ v** | the phonology table puts w~v in one cell [S22]; [w] between and after vowels (inferred from typical descriptions) |
| x | х | **χ** (uvular fricative) | |
| y | й | j | |
| z | з | z | |
| **o'** (oʻ) | ў | **/o/** (close-mid rounded); can front to [ø]/[œ] near front vowels | *Oʻzbekiston* [œzbekɪstɒn] [S22] |
| **g'** (gʻ) | ғ | **ʁ** (voiced uvular fricative) | |
| **sh** | ш | ʃ | |
| **ch** | ч | tʃ | |
| **ng** | нг | ŋ | |
| **ʼ** (tutuq belgisi) | ъ | ʔ, or lengthening of the preceding vowel | *ma'no*, *she'r*; marginal phoneme, loans only [S22] |
| (c) | ц | ts | Russian loans; written "ts" after a vowel, otherwise "s" [S21] |

**The o / o' distinction (lip sync):** Uzbek *o* is an open, back, rounded [ɒ~ɔ] (jaw low, loose rounding), which maps to **OH**. Uzbek *o'* is a close-mid [o] with tighter, more protruded rounding, which maps to **OO**. Rhubarb maps English OW to the puckered F shape for the same reason [S4]. This is the most important Uzbek-specific choice (inferred).

**Reduction and assimilation basics** (Sjoberg 1963 via [S22], with extra inferred notes):
- High vowels i and u shorten to [ɪ ʊ] in unstressed syllables [S22]. Between voiceless consonants they may be near-silent, e.g. *kitob* (inferred). For the engine: shorten unstressed i/u to about 50% duration.
- a [æ] backs to [ɑ] next to q, g', x [S22], so it becomes AA instead of EH. This is a **visible** difference and costs one rule.
- Morphophonemic changes appear in spelling (*toğ+qa → toqqa*, *yurak → yuragim*) [S22], so no extra G2P rule is needed.
- n before b/p sounds as [m] (*shanba* → [ʃamba]) (inferred, common across Turkic). Map n → MBP before b/p for a nice lip close.
- Final stress means the last vowel of each word gets the longest duration and the `open` boost.

### 2.3 Russian (Cyrillic)

Five vowel phonemes /i e a o u/. [ɨ] is the allophone of /i/ after hard consonants. Consonants come in hard/soft pairs (palatalisation). Unstressed /o/ merges with /a/, and after soft consonants unstressed /a e/ merge with /i/ [S23].

| Letter | Phoneme(s) | Notes |
|---|---|---|
| а | a; unstressed [ɐ]/[ə] | |
| б | b / bʲ | final devoicing → p (same viseme) |
| в | v / vʲ | final → f |
| г | ɡ / ɡʲ | **-ого/-его endings → v** (*его* [jɪˈvo]) |
| д | d / dʲ | |
| е | after consonant: ʲe (softens it); at word start, after a vowel, or after ъ/ь: **je** | unstressed → [ɪ] |
| ё | ʲo / **jo** (same positions as е) | **always stressed** |
| ж | ʐ (hard, lips rounded) | |
| з | z / zʲ | |
| и | i; after ж ш ц → [ɨ]; after ь → **ji** | |
| й | j | |
| к | k / kʲ | |
| л | ɫ / lʲ | |
| м | m / mʲ | |
| н | n / nʲ | |
| о | o (stressed); unstressed → [ɐ]/[ə] | **the visible "akanye"** |
| п | p / pʲ | |
| р | r / rʲ (trill) | |
| с | s / sʲ | |
| т | t / tʲ | |
| у | u | |
| ф | f / fʲ | |
| х | x / xʲ | |
| ц | t͡s | |
| ч | t͡ɕ (always soft) | |
| ш | ʂ | |
| щ | ɕː | |
| ъ | (no sound); makes the next е ё ю я iotated | |
| ы | ɨ | |
| ь | softens the previous consonant (no sound); next е ё ю я и iotated | |
| э | ɛ | |
| ю | ʲu / **ju** | |
| я | ʲa / **ja**; unstressed after soft consonant → [ɪ] | |

Polly's Russian table confirms the hard/soft pairs and the phoneme set [S7].

### 2.4 Combined table: every phoneme in all three languages → Dombi viseme

`V` = Dombi index from 1.9. Diphthongs are split into two shapes, with the first segment at about 60% of the duration and the second at about 40% (inferred).

| IPA | EN (ARPAbet) | UZ letter | RU letter | **V** | Shape |
|---|---|---|---|---|---|
| (silence, pause) | – | – | – | **0** | REST |
| p | P | p | п | **1** | MBP |
| b | B | b | б | **1** | MBP |
| m | M | m | м | **1** | MBP |
| pʲ bʲ mʲ | – | – | пь бь мь | **1** | MBP |
| f | F | – | ф | **2** | FV |
| v | V | v (when [v]) | в | **2** | FV |
| fʲ vʲ | – | – | фь вь | **2** | FV |
| ɸ | – | f | – | **2** | FV (soft; no teeth hint) |
| w | W | v (when [w]) | – | **8** | OO |
| θ | TH | – | – | **3** (10 if built) | TEETH / L_TH |
| ð | DH | – | – | **3** (10 if built) | TEETH / L_TH |
| t d | T D | t d | т д | **3** | TEETH |
| tʲ dʲ | – | – | ть дь | **3** | TEETH |
| n | N | n | н | **3** | TEETH (→1 before b/p in UZ) |
| nʲ | – | – | нь | **3** | TEETH |
| s z | S Z | s z | с з | **3** | TEETH |
| sʲ zʲ | – | – | сь зь | **3** | TEETH |
| ts | – | ts (c) | ц | **3** | TEETH |
| k ɡ | K G | k g | к г | **3** | TEETH |
| kʲ ɡʲ | – | – | кь гь | **3** | TEETH |
| ŋ | NG | ng | – | **3** | TEETH |
| q | – | q | – | **3** | TEETH |
| x xʲ | – | – | х | **3** | TEETH |
| χ | – | x | – | **3** | TEETH |
| ʁ | – | g' | – | **3** | TEETH |
| h | HH | h | – | **ctx** | take the **next vowel's** shape at 50% open (inferred; Azure gives h its own ID 12 [S1], Polly puts it with k [S6]) |
| ʔ | – | ʼ | – | **0 / hold** | brief REST (≤ 60 ms) or lengthen the previous vowel |
| l ɫ lʲ | L | l | л ль | **5** (10 if built) | EH / L_TH |
| r (trill/tap) rʲ | – | r | р рь | **3** | TEETH (tongue trill, lips neutral) (inferred) |
| ɹ | R | – | – | **9** | SH_R (English r is lip-rounded) |
| ʃ | SH | sh | – | **9** | SH_R |
| ʒ | ZH | j (some) | – | **9** | SH_R |
| tʃ | CH | ch | – | **9** | SH_R |
| dʒ | JH | j | – | **9** | SH_R |
| ʂ | – | – | ш | **9** | SH_R |
| ʐ | – | – | ж | **9** | SH_R |
| t͡ɕ | – | – | ч | **9** | SH_R |
| ɕː | – | – | щ | **9** | SH_R |
| j | Y | y | й (and the glide in я е ё ю) | **4** | EE (short, 40–60 ms) |
| i | IY | i | и | **4** | EE |
| ɪ | IH | i (unstressed) | е/я/и unstressed | **3** | TEETH (short, less spread) |
| ɨ | – | i (near uvulars) | ы | **3** | TEETH |
| e | EY (1st part) | e | е (stressed) | **5** | EH |
| ɛ | EH | – | э | **5** | EH |
| æ | AE | a | – | **5** | EH |
| ə | AH0 | – | unstressed а о | **11** or **5** | UH / EH-short |
| ɐ | – | – | unstressed а о (pretonic) | **5** | EH (keep it open, not round) |
| ʌ | AH1 | – | – | **5** | EH |
| ɝ ɚ | ER | – | – | **9** | SH_R |
| ɑ | AA | a (near q g' x) | – | **6** | AA |
| a | – | – | а (stressed) | **6** | AA |
| ɔ ɒ | AO | o | – | **7** | OH |
| o | OW (1st part) | o' | о (stressed) | **7** (RU) / **8** (UZ o') | OH / OO |
| ø œ | – | o' (fronted) | – | **8** | OO |
| ʊ | UH | u (short) | – | **8** | OO |
| u | UW | u | у, ю | **8** | OO |
| ʉ y | – | u (allophones) | ю after soft consonant | **8** | OO |
| aɪ | AY | ay | ай | **6→4** | AA then EE |
| aʊ | AW | – | – | **6→8** | AA then OO |
| eɪ | EY | ey | ей | **5→4** | EH then EE |
| oʊ | OW | – | – | **7→8** | OH then OO |
| ɔɪ | OY | oy | ой | **7→4** | OH then EE |

---

## 3. Grapheme-to-phoneme in the browser (no server)

The output of every G2P function is a list of `{ph, stress, word}` tokens. A shared `PH2VIS` table (built from 2.4) converts tokens to viseme indexes.

### 3.1 Uzbek Latin → phonemes (code-ready)

Pre-normalisation:
1. Lowercase. Unify apostrophes: `[ʻ'‘’`ʼ]` → treat **after o or g** as the o'/g' modifier, and **elsewhere** as the glottal stop `ʔ`.
   - Rule: if the char before the apostrophe is `o` or `g`, combine into `o'` / `g'`. Otherwise emit `ʔ`. Exception: in `s'h` (as in *Is'hoq*) the apostrophe **separates** s and h, so emit `s`, then `h` [S21-style usage, inferred].
2. Numbers → words (bir, ikki, uch, …). Optional.

Greedy longest-match table, checked in this order:

```js
const UZ = [
  ["o'", 'o'], ["g'", 'ʁ'], ['sh', 'ʃ'], ['ch', 'tʃ'], ['ng', 'ŋ'],
  ['ts', 'ts'],                 // Russian loans only; fine to always apply
  ['a', 'a'], ['b', 'b'], ['d', 'd'], ['e', 'e'], ['f', 'ɸ'], ['g', 'ɡ'],
  ['h', 'h'], ['i', 'i'], ['j', 'dʒ'], ['k', 'k'], ['l', 'l'], ['m', 'm'],
  ['n', 'n'], ['o', 'ɒ'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'],
  ['t', 't'], ['u', 'u'], ['v', 'v'], ['x', 'χ'], ['y', 'j'], ['z', 'z'],
  ['c', 'ts'], ['w', 'w'],      // c and w only in foreign names
];
```

Context rules, applied after tokenisation:
1. `a` → `ɑ` if the previous or next phoneme ∈ {q, χ, ʁ} [S22]. Otherwise `æ`.
2. `i` → `ɨ` next to {q, χ, ʁ} [S22].
3. `v` → `w` when after a vowel and (before a consonant or at word end) (inferred). Otherwise `v`.
4. `n` → `m` before {b, p} (inferred).
5. `ng` false positives: the `ng` digraph can split across a morpheme boundary (rare). Ignore it, since both readings are TEETH.
6. Stress: the last vowel of each word gets `stress=1` [S22].
7. Unstressed `i`, `u` get `short=true`, which halves the duration.
8. `ʔ` → emit a 50 ms REST, **or** lengthen the previous vowel ×1.5 (use the vowel-lengthening option inside words, e.g. *ma'no*).

**Uzbek Cyrillic support (optional):** transliterate first. ў→o', қ→q, ғ→g', ҳ→h, ш→sh, ч→ch, ж→j, х→x, й→y, ц→ts/s. For е/ё/ю/я: **ye/yo/yu/ya** at word start or after a vowel, otherwise e/o/u/a [S21]. ъ→ʼ.

### 3.2 Russian Cyrillic → phonemes (code-ready)

Pass 1: whole-word and cluster exceptions. Apply them to the lowercase word before letter rules:

```js
const RU_EXC = [
  [/^что(бы)?$/, 'што$1'], [/^конечно$/, 'конешно'], [/^скучно$/, 'скушно'],
  [/(о|е)го$/, '$1во'],       // его, него, нового, синего (skip много, дорого: check list)
  [/тся$|ться$/, 'ца'],       // учится, учиться
  [/стн/g, 'сн'], [/здн/g, 'зн'], [/вств/g, 'ств'], [/лнц/g, 'нц'],
  [/[сз]ч/g, 'щ'], [/[сз]щ/g, 'щ'], [/жч/g, 'щ'],
];
const RU_GO_KEEP = new Set(['много','дорого','строго','немного','убого','отлого']);
```

Pass 2: letters. Keep a flag `prevIsVowelOrStart`, set to true at word start, after a vowel, after ъ, and after ь.

```js
const RU_CONS = { б:'b', в:'v', г:'ɡ', д:'d', ж:'ʐ', з:'z', й:'j', к:'k', л:'l', м:'m',
  н:'n', п:'p', р:'r', с:'s', т:'t', ф:'f', х:'x', ц:'ts', ч:'tɕ', ш:'ʂ', щ:'ɕ' };
const RU_IOT  = { я:'a', е:'e', ё:'o', ю:'u' };      // iotated vowels
const RU_V    = { а:'a', о:'o', у:'u', э:'ɛ', ы:'ɨ', и:'i' };
// for each char c:
//  ъ, ь         -> no phoneme; set prevIsVowelOrStart = true (ь: also mark prev cons soft)
//  c in RU_IOT  -> if prevIsVowelOrStart: emit 'j', then vowel; else soften prev cons, emit vowel
//  c === 'и'    -> if previous char is 'ь': emit 'j','i'; if prev cons in {ж,ш,ц}: emit 'ɨ'; else 'i'
//  c in RU_V    -> emit vowel
//  c in RU_CONS -> emit consonant
```

Final devoicing (б→p, в→f, г→k, д→t, ж→ʂ, з→s at word end and before voiceless consonants) doesn't change the viseme class, so skip it.

Pass 3: stress and reduction. **Stress is unknown** from plain text. Approximation, in order of preference:
1. `ё` present → that syllable is stressed.
2. The user typed an acute accent (U+0301) after a vowel → that syllable is stressed. Lesson text can carry these.
3. A small lookup of the ~2,000 most frequent words with known stress. Sources: Wiktionary-derived Russian stress lists, or the OpenRussian / `russian-words` datasets (inferred; check licences).
4. Fallback: monosyllables are stressed. In polysyllables mark **no** vowel as stressed and apply "safe" reduction:
   - `o` (unstressed) → `ɐ`, which gives viseme **EH** (5). Akanye makes unstressed о sound and look like a short a [S23]. Showing OH where the voice says [ɐ] looks wrong, and showing EH where the voice says [o] looks only slightly flat (inferred).
   - `e`, `a` after a soft consonant (`я`, `е` vowel part), unstressed → `ɪ`, which gives TEETH (3).
   - Unstressed vowels get 0.6× duration. When stress is unknown, give every vowel in the word 0.8×, and let word-boundary rescaling fix the total.
5. Word-final unstressed `о` → `ə`. Non-final unstressed vowels other than /o/ keep their quality at word start [S23].

### 3.3 English: CMUdict + fallback rules

**Package:** `cmu-pronouncing-dictionary` on npm. Version **3.0.0**, licence **ISC** (the underlying CMUdict carries a BSD-style CMU licence; keep its notice), **ESM-only** (`import { dictionary } from 'cmu-pronouncing-dictionary'`), **134,000+ words**, unpacked size **≈ 4.7 MB** [S15][S16]. Format is a plain object of lowercase word → ARPAbet string with stress digits. Alternates use `word(1)` keys, e.g. `'a(1)': 'EY1'`, `aachen: 'AA1 K AH0 N'` [S16].

**Browser use (inferred):** for a test page, import from a CDN such as `https://esm.sh/cmu-pronouncing-dictionary@3.0.0` (about 1.2–1.5 MB gzipped, estimated). For production, prune it to the ~20k most frequent words, or to the course vocabulary, as a JSON file of about 300 KB.

Lookup steps:
1. Lowercase. Strip punctuation except the apostrophe (`don't`, `it's` are in CMUdict).
2. `dictionary[word]`. If it is missing, try stripping `'s` or `s`, then fall back to rules.
3. Split the string on spaces. The stress digit gives stress (1 = primary, 2 = secondary, 0 = unstressed).

**Fallback: NRL letter-to-sound rules** (Elovitz, Johnson, McHugh, Shore, NRL Report 7948, 1976 [S10]). Each rule is `left[MATCH]right=phonemes`, with context symbols `#` (1+ vowels), `:` (0+ consonants), `^` (one consonant), `.` (voiced consonant), `%` (suffix -er -e -es -ed -ing -ely), `+` (front vowel e i y), and space (word boundary). TalkingHead's `lipsync-en.mjs` contains the **full NRL rule set already converted to Oculus visemes** and compiled into regexes, under the MIT licence [S9][S8]. Sample:

```
'A': [" [ARE] =aa RR", " [AR]O=aa RR", "[AR]#=E RR", " ^[AS]#=E SS", "[A]WA=aa", "[AW]=aa", ...]
```

**Recommendation:** copy TalkingHead's rule tables (keep the MIT notice) and remap Oculus → Dombi with this table:

```js
const OCULUS2DOMBI = { sil:0, PP:1, FF:2, TH:3 /*or 10*/, DD:3, kk:3, CH:9, SS:3,
  nn:3 /* n */, RR:9, aa:6, E:5, I:4 /*ih→3 if short*/, O:7, U:8 };
```

TalkingHead's `nn` covers both n and l. If you want l → EH, keep the ARPAbet path for dictionary words, since the fallback is rare anyway.

**ARPAbet → Dombi (main path):**

```js
const ARPA2V = {
  AA:[6], AE:[5], AH:[5], AO:[7], AW:[6,8], AY:[6,4], EH:[5], ER:[9], EY:[5,4],
  IH:[3], IY:[4], OW:[7,8], OY:[7,4], UH:[8], UW:[8],
  B:[1], P:[1], M:[1], F:[2], V:[2], W:[8], TH:[3], DH:[3],
  T:[3], D:[3], N:[3], S:[3], Z:[3], K:[3], G:[3], NG:[3], L:[5], R:[9],
  SH:[9], ZH:[9], CH:[9], JH:[9], Y:[4], HH:['next'],
};
// AH0 -> 11 (UH) if the optional shape exists, else 5 with short=true
```

**Other G2P options:**

| Option | Licence | Notes |
|---|---|---|
| `phonemize` (npm 2.0.1) | MIT [S13] | "Fast phonemizer with rule-based G2P prediction. Pure JavaScript." English-focused; outputs IPA (inferred). A good drop-in replacement for the NRL fallback. |
| `espeak-ng` (npm 1.0.2, WASM build) | GPL-3.0-or-later [S12][S13] | eSpeak NG covers 100+ languages, **including Uzbek and Russian** (inferred from its language list) [S11]. Run with `-q -x --ipa` to get phonemes without audio. GPL means the app's distributed code has to be GPL-compatible, so use it only for **offline** generation of a phoneme cache, never shipped in the app bundle (inferred). |
| meSpeak.js | GPL (eSpeak-based) | Old (2011–2019) and audio-oriented. Skip it. |

---

## 4. Timing

### 4.1 Base rates

- English normal speech: about **4 syllables/s** (Cruttenden, *Gimson's Pronunciation*), with an observed range of **3.3–5.9 syl/s** across emotional contexts [S25].
- Sound (phone) rate: **9.4 to 13.8 sounds/s** from poetry reading to sports commentary [S25], which is about **75–105 ms per phone**.
- Pellegrino, Coupé & Marsico (2011), reading-aloud task: English ≈ 6.2 syl/s (recall, [S26]). Faster syllable rates go with lower information per syllable. Russian and Uzbek were not in that study.
- TTS at `rate = 1` sits near the lower, careful end: about 3.5–4.5 syl/s and about 10–12 phones/s (inferred from listening tests; calibrate per voice, see 5.4).

### 4.2 Per-phoneme base durations (ms, at rate 1)

English inherent durations follow Klatt's 1979 duration model (`DUR = MINDUR + (INHDUR − MINDUR) × PRCNT` [S30]). The values are (recall) the published Klatt/MITalk inherent durations, rounded:

| Class | EN examples (inherent ms) | Use for UZ / RU |
|---|---|---|
| Long/tense vowels, stressed | AA 240, AO 240, AE 230, IY 155, UW 210, OW 220, ER 180 | Uzbek final-stressed vowel 150–200. Russian stressed vowel 150–220 |
| Diphthongs | AY 250, AW 260, OY 280, EY 190 | split 60/40 |
| Lax vowels | IH 135, EH 150, UH 160, AH 140 | Uzbek non-final vowel 90–120 |
| Schwa | AX/AH0 120 (min 60) | Russian reduced vowel 50–80 |
| Plosives | P 90, B 85, T 75, D 75, K 80, G 80 | same |
| Fricatives | F 100, V 60, TH 90, DH 50, S 105, Z 75, SH 105, ZH 70, HH 80 | Russian щ 140 (it is long); Uzbek χ 90 |
| Nasals/liquids | M 70, N 60, NG 95, L 80, R 80, W 80, Y 80 | Russian/Uzbek trill r 60 |
| Affricates | CH 70, JH 70 (closure + release) | Russian ц ч 90 |

Engine values in a single table (inferred, tuned for TTS):

```js
const BASE_MS = {
  vowelStressed: 170, vowelUnstressed: 85, vowelReduced: 60, diphthong: 220,
  plosive: 70, fricative: 90, affricate: 90, nasal: 65, liquid: 65, glide: 55,
  pauseComma: 220, pauseSentence: 420, pauseWord: 0,   // no gap between words
};
// actual = base * mult[lang] / utterance.rate
const LANG_MULT = { en: 1.0, ru: 0.95, uz: 1.0 };       // calibrate per voice
```

The TalkingHead English module uses **relative** viseme durations (1.0 = average), e.g. `aa 0.95, E 0.90, I 0.92, O 0.96, U 0.95, PP 1.08, SS 1.23, kk 1.21, nn 0.88, RR 0.88`. Pauses are `' ':1, ',':3, '-':0.5`. The total is then scaled to the TTS word timestamps [S9]. This relative-then-rescale design is the right one for our case too.

### 4.3 Simplification rules animators use (apply after G2P)

1. **Merge short visemes.** At 24 fps one frame is 42 ms. Anything below about 40 ms is invisible and only causes flicker. Merge it into the neighbour with the bigger opening, or drop it (inferred, standard practice). Use a threshold of 45 ms at rate 1, or 35 ms at rate ≥ 1.2.
2. **Never drop MBP, FV, or OO.** Lip closures and puckers are what viewers check (the lip-reading literature shows p/b/m and f/v are the most identifiable viseme classes [S28]). Instead, **stretch MBP to at least 60–80 ms**, borrowing time from the neighbouring vowel (inferred).
3. **Collapse repeats.** Same viseme twice in a row → one segment. For a doubled vowel or consonant across a word boundary, lengthen instead.
4. **Lead the audio.** Show each mouth shape about 1 frame (20–40 ms) **before** its sound. The mouth has to be in position when the sound starts (inferred, common animator rule). In code, subtract 30 ms from every start time.
5. **Don't close between words** inside a phrase. Only commas, sentence ends, and gaps longer than 150 ms go to REST. Inside a phrase, a word-final consonant flows straight into the next word's first shape (inferred). Rhubarb uses X only "for pauses in speech" [S4].
6. **Use the in-betweens.** For any transition AA↔closed, insert EH for one frame. For AA/EH → OO, insert OH (Rhubarb's A→C→D and C→E→F rules [S4]).
7. **Co-articulation** (inferred):
   - **Rounding spreads backward:** a consonant before OO, OH, or SH_R (e.g. *two*, *school*, Russian *ту*, *шу*) takes a rounded variant. Render TEETH as SH_R, or narrow its width to 0.8, when the next vowel is round.
   - **h** has no shape of its own and takes the next vowel's shape.
   - **Consonant clusters:** keep only the most visible member (priority MBP > FV > OO/W > SH_R > TEETH). *strength* = s-t-r-e-ŋ-k-θ → SH_R (the r rounds), EH, TEETH.
   - **Stressed vowels open more:** drive `open` = 1.0 for stressed and 0.6 for unstressed (the JALI jaw idea [S29]).
8. **Hold the last vowel** of a sentence for about 80 ms, then ease to REST over about 120 ms. That avoids snapping shut (inferred).

### 4.4 Timeline algorithm (pseudo-code)

```js
function buildTimeline(text, lang, rate) {
  const words = tokenize(text);                     // keep char offsets for boundary sync
  let t = 0; const out = [];                        // out: {v, start, dur, wordIdx, open}
  words.forEach((w, wi) => {
    w.start = t;
    const phs = G2P[lang](w.text);                  // [{ph, stress, short}]
    for (const p of phs) {
      const vis = PH2VIS(p, lang, nextPh(p));       // array (diphthongs -> 2)
      const total = baseMs(p, lang) / rate;
      vis.forEach((v, k) => out.push({ v, start: t + (vis.length>1 ? (k? total*0.6:0) : 0),
        dur: vis.length>1 ? total*(k?0.4:0.6) : total, wordIdx: wi, open: p.stress?1:0.6 }));
      t += total;
    }
    w.end = t;
    if (w.punct === ',') { out.push({ v:0, start:t, dur:220/rate, wordIdx:wi }); t += 220/rate; }
    if (/[.!?]/.test(w.punct)) { out.push({ v:0, start:t, dur:420/rate, wordIdx:wi }); t += 420/rate; }
  });
  return smooth(out);                                // rules 4.3: merge<45ms, MBP>=70ms, in-betweens, lead -30ms
}
```

---

## 5. Browser `speechSynthesis` in practice

### 5.1 API facts

- `SpeechSynthesisUtterance`: `text`, `lang`, `voice`, `rate` (spec 0.1–10, 1 = default), `pitch` (0–2), `volume` (0–1). Keep rate and pitch between 0.1 and 2, since some voices reject values outside that range [S17].
- Events: `start`, `end`, `pause`, `resume`, `boundary`, `mark`, `error`. `boundary` fires "when the spoken utterance reaches a word or sentence boundary" [S14].
- `SpeechSynthesisEvent` has `charIndex`, `charLength`, `elapsedTime`, `name` [S18b]. The spec says `elapsedTime` is "the time, **in seconds**, that this event triggered, relative to when this utterance has begun to be spoken", and that `charIndex` only promises that text before it has been spoken [S18b]. Implementations have reported milliseconds in some versions (inferred). **Don't trust `elapsedTime` units.** Timestamp events yourself with `performance.now()` and keep a `t0` taken at the `start` event.
- `name` is `'word'` or `'sentence'`. On macOS sentence events arrive as an extra `'word'`. Chrome and Edge on Windows send `charLength = 0` for sentence boundaries. Safari sends no `charLength` [S17].
- **Boundary support differs by voice:**
  - **Android** (Chrome/Firefox): `boundary` **never fires** [S17].
  - **Chrome, Google network voices** ("Google US English", "Google русский"): `onboundary` "doesn't work at all for them" (2015 report [S19]). A 2021 report says events only fire with native voices [S18]. Treat these voices as **no-boundary**. Chrome on Windows also lists the local Microsoft SAPI voices, which do fire word boundaries (inferred from [S18][S19]).
  - **Edge on Windows, "Microsoft … Online (Natural)" voices**: these are Azure neural voices streamed by Edge. Edge's Read Aloud highlights words with them, so word timing exists in the service [S24b]. Whether page-level `onboundary` fires for them in your Edge build **must be tested** (inferred; the 2016 Edge post says boundary was not yet supported, and that is outdated [S24]). Also note an Edge 150 regression reported in July 2026: `getVoices()` returned "Microsoft undefined Online (Natural) - undefined" names and speech fell back to David [S24c]. **Pick voices by `lang` + `name.includes('Madina')` and log the list.**
- Web Speech audio **cannot be routed into Web Audio** (no MediaStream). Amplitude or FFT lip sync such as wawa-lipsync therefore can't be used with `speechSynthesis` (inferred). It works only with an `<audio>` element or a pre-rendered file.

### 5.2 Voice availability (Windows 11, inferred, verify with `getVoices()`)

| Language | Edge (online natural) | Chrome | Windows local (SAPI/OneCore, both browsers) |
|---|---|---|---|
| en-US | Ava, Andrew, Emma, Brian, Jenny, Guy, Aria… (`en-US-*Neural` [S2b]) | Google US English (network, no boundary) | David, Zira, Mark |
| ru-RU | Svetlana, Dmitry, Dariya (`ru-RU-*Neural` [S2b]) | Google русский (network, no boundary) | Irina, Pavel (only if the Russian speech pack is installed) |
| uz-UZ | **Madina (F), Sardor (M)**: `uz-UZ-MadinaNeural`, `uz-UZ-SardorNeural`, listed as "Uzbek (Latin, Uzbekistan)" [S2b] | **none** | **none** |

So the Uzbek test path is **Edge only**. In other browsers, fall back to a ru-RU voice or show a notice (inferred).

### 5.3 Syncing the heuristic timeline to boundary events (code-ready)

```js
let t0, words, timeline, rateEMA = 1, lastAnchor = { wi: -1, real: 0, pred: 0 };
u.onstart = () => { t0 = performance.now(); rafLoop(); };
u.onboundary = (e) => {
  if (e.name !== 'word') return;
  const wi = wordIndexAt(e.charIndex);              // binary search over word char offsets
  const real = performance.now() - t0;              // ms since start (ignore e.elapsedTime units)
  const pred = words[wi].start;                     // predicted start of this word (ms)
  if (lastAnchor.wi >= 0 && wi > lastAnchor.wi) {
    const r = (real - lastAnchor.real) / Math.max(1, pred - lastAnchor.pred);
    rateEMA = 0.7 * rateEMA + 0.3 * clamp(r, 0.5, 2);   // learns the voice's true speed
  }
  lastAnchor = { wi, real, pred };
};
function currentViseme(now) {
  const real = now - t0;
  // map real time -> predicted time: from last anchor, advance at 1/rateEMA
  const predT = lastAnchor.wi >= 0 ? lastAnchor.pred + (real - lastAnchor.real) / rateEMA
                                   : real / rateEMA;
  if (lastAnchor.wi >= 0 && predT > words[lastAnchor.wi + 1]?.start)  // ran ahead of the voice:
    return holdOrRest(lastAnchor.wi);               // freeze on last vowel of current word, don't drift into next
  return lookup(timeline, predT + 30);              // +30 ms lead (rule 4.3.4)
}
u.onend = () => { setViseme(0); cancelAnimationFrame(raf); };
```

Notes:
- **Freeze on overrun.** If the prediction reaches the next word before its boundary event arrives, hold the current word's last open shape (or close softly). Racing ahead and snapping back reads as a glitch (inferred).
- **Late voice start:** Edge online voices take 100–400 ms of network latency before audio, but `onstart` fires when audio starts (inferred, verify). Anchor `t0` at `onstart`, never at `speak()`.
- **No boundary events at all:** after 600 ms without one, switch to open-loop. Use `rateEMA` from a per-voice calibration table (5.4) and close the mouth at `onend`.
- **Long text:** Chrome's network voices historically stopped after about 15 s (inferred, long-standing bug). Split text into sentences and queue one utterance per sentence. That also resets drift.

### 5.4 Calibration (inferred)

Speak a fixed 30-word sentence per voice. Measure `onend − onstart`, divide by the predicted total, and store `{voiceName: factor}` in localStorage. Typical neural voices run 0.85–1.15× of the base table.

### 5.5 How production apps do it

- **Azure TTS + visemes:** subscribe to `VisemeReceived`. Each event carries `VisemeId` (0–21) plus `AudioOffset` in 100-ns ticks, and optionally SVG or 60-fps 55-blend-shape frames. "Your 3D engine should render each group of BlendShapes frames immediately before the corresponding audio chunk" [S1]. This is the most accurate route, but it needs an Azure key and a server or token endpoint, and works only with Azure voices (which include Madina and Sardor [S2b]). **Recommended for production**, in a mode where you pre-render lesson lines to audio + viseme JSON and cache them.
- **Amazon Polly:** request `SpeechMarkTypes=["viseme","word"]` and get JSON lines `{time, type:"viseme", value:"p"}` with the Polly viseme set (1.5) [S5]. Polly has no Uzbek voice (inferred).
- **Duolingo:** their TTS did not provide pronunciations or timing. So they "generate the speech, run it through our in-house speech recognition and pronunciation models, and get the timing for each word and phoneme", then map each sound "onto a visual representation, or viseme, in a set we designed based on linguistic features". They built "a factory to generate all the viseme timings" for course content, with tools to **audit and correct** them. Each character has **20+ mouths**. Mouths run as separate states in Rive's State Machine, in parallel with the body and pose states, and the app triggers them from the timings during the challenge [S20].
- **Implication for Akademiya (inferred):** the speechSynthesis + heuristic engine is right for the **test page** and for free-typed text. For shipped lesson audio, copy Duolingo: pre-render the audio, align it with forced alignment (or Azure viseme events), store `[{t, v}]` per line, and have the app just play it back.

---

## 6. Open-source projects worth borrowing from

| Project | What it does | Licence | Borrow |
|---|---|---|---|
| **TalkingHead** (met4citizen) [S8] | JS class for real-time lip sync on 3D avatars. Language modules `lipsync-xx.mjs` turn text into **Oculus visemes + relative times + durations**, scaled to TTS word timestamps (Google TTS or Azure / ElevenLabs word timings) [S8]. The Finnish module maps graphemes straight to visemes with ">99.9% lip-sync accuracy" in about 4k of code [S8]. | **MIT** [S8] | The architecture (`preProcessText` → `wordsToVisemes` → `{visemes, times, durations}`), the NRL English rules converted to visemes [S9], the relative duration table [S9], and number→word code. Write `lipsync-uz` and `lipsync-ru` in the same shape. |
| **Rhubarb Lip Sync** (Daniel Wolf) [S4] | Offline CLI. Takes audio (+ optional dialog text) and outputs a timed A–H/X track. Uses PocketSphinx (English) or a language-independent phonetic recogniser. Exports TSV, XML, JSON, Moho .dat, and has After Effects and Spine integrations. | MIT (recall) | Shape definitions and transition rules [S4]. For pre-rendered lesson audio in **any** language, run its phonetic recogniser offline and remap A–H,X → Dombi (A→1, B→3, C→5, D→6, E→7, F→8, G→2, H→10/5, X→0). |
| **wawa-lipsync** (Wawa Sensei) [S10b] | Real-time **audio-analysis** lip sync in the browser: analyses an `<audio>`/media element with Web Audio and outputs visemes. | **MIT** [S10b] | Not usable with `speechSynthesis` (no audio tap). Useful later if lessons play pre-recorded MP3s. |
| **eSpeak NG** [S11] | Formant TTS + rule-based G2P for 100+ languages, including Russian and Uzbek (inferred). | **GPL-3.0** [S11]; npm WASM build `espeak-ng` 1.0.2 is GPL-3.0-or-later [S12] | Offline tool for checking or generating phoneme strings (`espeak-ng -v uz -q -x --ipa "salom"`). Don't bundle it in the app. |
| **phonemize** (npm) [S13] | Pure-JS rule-based English G2P | **MIT** | Better English OOV fallback than NRL. |
| **cmu-pronouncing-dictionary** [S15][S16] | CMUdict as an ESM JS object | **ISC** | Main English lookup. |
| Papagayo-NG [S27] | Manual or semi-auto lip-sync timing tool using the Preston Blair set | GPL (recall) | Reference only. |

---

## 7. Implementation checklist for the test page

1. `g2p/uz.js`, `g2p/ru.js`, `g2p/en.js` (CMUdict via esm.sh plus TalkingHead NRL rules), each returning `{ph, stress, short}` tokens with word char offsets.
2. `visemes.js`: the `PH2VIS` table from 2.4, diphthong splits, `h`→next vowel, cluster priority.
3. `timeline.js`: base durations (4.2), rate scaling, smoothing rules (4.3), 30 ms lead.
4. `sync.js`: `onstart` anchor, word `boundary` re-anchoring with the `rateEMA` overrun freeze, open-loop fallback, sentence queueing.
5. Debug UI: voice picker (log `getVoices()` with `lang` and `localService`), a "boundary events received: n" counter, a strip chart of viseme index over time, and buttons that step through all 10 mouth shapes.
6. Rive: number `viseme` (0–9) and optional `open` (0–1). Transitions 40–60 ms. Explicit in-between states for AA↔REST and AA↔OO.

Test sentences (cover every viseme):
- EN: "Mom, five big cheeses would show you the way." (MBP, FV, EE, SH_R, OO, OH, AA, EH)
- UZ: "Oʻzbekiston — goʻzal, qadimiy yurt. Ma'no, shaharda choy ichamiz." (o', g', q, ʼ, sh, ch)
- RU: "Щука ждёт у моста. Молоко, его, чтобы — хорошо!" (щ ж ч, iotated ё, akanye, -его, что)

---

## Sources

- [S1] Microsoft Learn, "Get facial position with viseme" (Azure Speech): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
- [S2b] Microsoft Learn, Azure Speech language & voice support (uz-UZ-MadinaNeural, uz-UZ-SardorNeural, ru-RU-SvetlanaNeural/DmitryNeural/DariyaNeural, en-US multilingual voices): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- [S3] Meta Horizon, OVRLipSync Viseme Reference: https://developers.meta.com/horizon/documentation/unity/audio-ovrlipsync-viseme-reference/
- [S4] Rhubarb Lip Sync README (D. S. Wolf): https://github.com/DanielSWolf/rhubarb-lip-sync (raw: https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/README.adoc)
- [S5] Amazon Polly, Visemes and Amazon Polly: https://docs.aws.amazon.com/polly/latest/dg/viseme.html
- [S6] Amazon Polly, Phoneme/Viseme table English (US): https://docs.aws.amazon.com/polly/latest/dg/ph-table-english-us.html
- [S7] Amazon Polly, Phoneme/Viseme table Russian: https://docs.aws.amazon.com/polly/latest/dg/ph-table-russian.html
- [S8] TalkingHead (met4citizen), README and MIT LICENSE: https://github.com/met4citizen/TalkingHead
- [S9] TalkingHead `modules/lipsync-en.mjs` (NRL rules → Oculus visemes, relative durations): https://github.com/met4citizen/TalkingHead/blob/main/modules/lipsync-en.mjs
- [S10] Elovitz, Johnson, McHugh, Shore, "Automatic Translation of English Text to Phonetics by Means of Letter-to-Sound Rules", NRL Report 7948 (1976): https://apps.dtic.mil/sti/pdfs/ADA021929.pdf
- [S10b] wawa-lipsync (MIT): https://github.com/wass08/wawa-lipsync
- [S11] eSpeak NG repository (GPL-3.0): https://github.com/espeak-ng/espeak-ng
- [S12] npm `espeak-ng` (WASM build, GPL-3.0-or-later): https://www.npmjs.com/package/espeak-ng
- [S13] npm `phonemize` (MIT): https://www.npmjs.com/package/phonemize
- [S14] MDN, SpeechSynthesisUtterance: boundary event: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/boundary_event
- [S15] npm `cmu-pronouncing-dictionary` 3.0.0 (ISC, ESM, 134k words): https://www.npmjs.com/package/cmu-pronouncing-dictionary
- [S16] words/cmu-pronouncing-dictionary README: https://github.com/words/cmu-pronouncing-dictionary
- [S17] Will Boyd, "JavaScript Text-to-Speech and Its Many Quirks" (Coder's Block): https://codersblock.com/blog/javascript-text-to-speech-and-its-many-quirks/
- [S18] W3C public-speech-api list, 2021 (boundary only with native voices): https://lists.w3.org/Archives/Public/public-speech-api/2021Jun/0000.html
- [S18b] Web Speech API specification (SpeechSynthesisEvent: charIndex, charLength, elapsedTime): https://webaudio.github.io/web-speech-api/
- [S19] W3C public-speech-api list, Oct 2015 (A. Brewer / D. Mazzoni: onboundary does not work for Chrome remote voices; engines differ on word splitting and event timing): https://lists.w3.org/Archives/Public/public-speech-api/2015Oct/0002.html
- [S20] Duolingo Blog, "How Duolingo Animates Its World Characters" (Vahidsafa & Lenzo, 2022): https://blog.duolingo.com/world-character-visemes/
- [S21] Wikipedia, Uzbek alphabet (correspondence chart): https://en.wikipedia.org/wiki/Uzbek_alphabet
- [S22] Wikipedia, Uzbek language — Phonology (after Sjoberg 1963, *Uzbek Structural Grammar*): https://en.wikipedia.org/wiki/Uzbek_language#Phonology
- [S23] Wikipedia, Russian phonology — Unstressed vowels: https://en.wikipedia.org/wiki/Russian_phonology
- [S24] Microsoft Edge Dev Blog, "Introducing Speech Synthesis API" (2016; boundary not yet supported at the time): https://blogs.windows.com/msedgedev/2016/06/01/introducing-speech-synthesis-api/
- [S24b] W3C public-speech-api list, Nov 2016 (Microsoft on word boundary + length in Edge): https://lists.w3.org/Archives/Public/public-speech-api/2016Nov/0000.html
- [S24c] Microsoft Tech Community, "Edge version 150 JavaScript speechSynthesis.getVoices() undefined voices" (2026): https://techcommunity.microsoft.com/discussions/edgeinsiderdiscussions/edge-version-150-javascript-speechsynthesis-getvoices-undefined-voices/4538591
- [S25] Wikipedia, Speech tempo (Cruttenden 2014: ~4 syl/s; Arnfield et al. 1995: 3.3–5.9 syl/s; Fonagy & Magdics 1960: 9.4–13.83 sounds/s): https://en.wikipedia.org/wiki/Speech_tempo
- [S26] Pellegrino, Coupé, Marsico (2011), "A cross-language perspective on speech information rate", *Language* 87(3): https://doi.org/10.1353/lan.2011.0057
- [S27] Lost Marble (Moho/Papagayo) forum, Preston Blair set and Papagayo defaults: https://lostmarble.com/forum/viewtopic.php?p=217061 and https://lostmarble.com/forum/viewtopic.php?p=11386 ; Toon Boom lip-sync mouth chart: https://learn.toonboom.com/modules/lip-sync-animation/topic/activity-2-mouth-shapes-overview
- [S28] Wikipedia, Viseme (Fisher 1968; p/b/m, t/d/n/l, k/g/ŋ groupings; MPEG-4 and lip-reading context): https://en.wikipedia.org/wiki/Viseme
- [S29] Edwards, Landreth, Fiume, Singh, "JALI: An Animator-Centric Viseme Model for Expressive Lip Synchronization", SIGGRAPH 2016: https://www.dgp.toronto.edu/~elf/JALISIG16.pdf
- [S30] Klatt (1979), "Synthesis by rule of segmental durations in English sentences", in Lindblom & Öhman (eds.), *Frontiers of Speech Communication Research*, pp. 287–299. Model summary via UCL Experimental Phonetics: https://www.phon.ucl.ac.uk/courses/spsci/expphon/week2.php
