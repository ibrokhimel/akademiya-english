"""Choose the audition candidates.  python -I curate.py  -> sound-tools/curated.json  (then design/sound/build_candidates.py)
Pack picks are written here by hand (chosen by file name and measured length / pitch direction);
single sounds come from sound-src/singles/INDEX.json, filtered by measured length."""
import json, os, re, sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'sound-tools'); from listing import load
PACKS = {p['slug']: p for p in json.load(open('sound-src/packs/INDEX.json', encoding='utf-8'))}
SHORT = {'kenney-interface-sounds': 'Kenney', 'kenney-ui-audio': 'Kenney', 'kenney-digital-audio': 'Kenney', 'kenney-music-jingles': 'Kenney', 'kenney-casino-audio': 'Kenney', 'kenney-rpg-audio': 'Kenney',
         'google-material-product-sounds': 'Material', 'snd-snd01-sine': 'SND 01', 'snd-snd02-piano': 'SND 02', 'snd-snd03-industrial': 'SND 03', 'octave-ui-sounds': 'Octave',
         'akx-notifications': 'akx', 'rcptones-dev-tones-free': 'dev_tones', 'itch-obsydianx-interface-sfx-pack-1': 'ObsydianX', 'itch-cyrex-studios-universal-ui-soundpack': 'Cyrex',
         'itch-shapeforms-free-sfx': 'Shapeforms', 'oga-jcsounds-ui-utility-pack-vol-1': 'JC Sounds', 'oga-lrsf-ui-sound-effects-library': 'Little Robot', 'oga-lrsf-fantasy-sound-effects-library': 'Little Robot',
         'oga-virix-ui-item-magic-samples': 'ViRiX', 'oga-wobbleboxx-level-up-power-up-coin': 'wobbleboxx', 'oga-mousebyte-chimey-ui-sounds': 'Mousebyte', 'oga-joth-7-ui-sound-effects': 'Joth',
         'oga-robinlamb-ui-sound-effects': 'Robin Lamb', 'oga-haeldb-ui-sounds': 'haeldb', 'oga-lokif-gui-sound-effects': 'Lokif', 'oga-mintodog-cozy-puzzle-jingles': 'Mintodog',
         'oga-rubberduck-100-cc0-sfx': 'rubberduck', 'oga-rubberduck-100-cc0-sfx-2': 'rubberduck', 'oga-rubberduck-80-cc0-rpg-sfx': 'rubberduck', 'oga-cc0-singles': 'OpenGameArt'}
ROWS = {}


def lic(text):
    t = (text or '').lower()
    if 'cc0' in t or 'public domain' in t: return 'CC0'
    if 'cc-by' in t or 'cc by' in t or 'attribution' in t: return 'credit'
    return 'free'


LEN = {}


def find(slug, part):
    if slug not in ROWS: ROWS[slug] = load(slug)
    hits = [r for r in ROWS[slug] if ('/' + os.path.splitext(r['file'])[0].lower()).endswith('/' + part.lower())]
    if len(hits) != 1: raise SystemExit('pick %s / %s matched %d files' % (slug, part, len(hits)))
    LEN[hits[0]['file']] = hits[0]['s']
    return hits[0]['file']


def P(slug, part, title=None, off=None):
    """A pack pick. `off` = the matching 'off' sound of an on/off pair (same pack)."""
    p = PACKS[slug]; base = os.path.basename(part)
    src = find(slug, part)
    it = {'src': src, '_s': LEN[src], 'title': title or re.sub(r'[_\-]+', ' ', base).strip(), 'source': SHORT[slug], 'lic': lic(p['licence']), 'attribution': p.get('attribution'), 'page': p.get('page_url')}
    if off: it['src2'] = find(slug, off); it['title'] += ' + off'
    return it


def seconds(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return 0.0


SINGLES = json.load(open('sound-src/singles/INDEX.json', encoding='utf-8')) if os.path.exists('sound-src/singles/INDEX.json') else []


def S(slot, lo=0.0, hi=99.0, skip=(), pairs=(), only=()):
    """Single sounds for a slot, kept when the sounding part is lo..hi seconds long. pairs = [(on, off)] by file name. Flagged entries (8-bit, buzzer) are left out."""
    out, used = [], set()
    rows = [r for r in SINGLES if r['slot'] == slot and os.path.exists(r['file']) and not r.get('note')]
    name = lambda r: os.path.basename(r['file']).lower()
    def item(r, r2=None):
        t = re.sub(r'\s+', ' ', r.get('title') or name(r)).strip()
        it = {'src': r['file'], 'title': t[:60], 'source': r.get('source', '?'), 'lic': lic(r.get('licence')), 'attribution': r.get('attribution'), 'page': r.get('page_url'), '_s': r.get('active_s') or 0}
        if r2: it['src2'] = r2['file']; it['title'] = t[:48] + ' + off'; it['page2'] = r2.get('page_url')
        return it
    for a, b in pairs:
        ra = [r for r in rows if a in name(r)]; rb = [r for r in rows if b in name(r)]
        if ra and rb: out.append(item(ra[0], rb[0])); used |= {ra[0]['file'], rb[0]['file']}
    for r in rows:
        if r['file'] in used or any(k in name(r) for k in skip) or (only and not any(k in name(r) for k in only)): continue
        if lo <= (r.get('active_s') or 0) <= hi: out.append(item(r))
    return out


K = 'kenney-interface-sounds'; KU = 'kenney-ui-audio'; KD = 'kenney-digital-audio'; KJ = 'kenney-music-jingles'; KC = 'kenney-casino-audio'; KR = 'kenney-rpg-audio'
M = 'google-material-product-sounds'; S1, S2, S3 = 'snd-snd01-sine', 'snd-snd02-piano', 'snd-snd03-industrial'; O = 'octave-ui-sounds'; AK = 'akx-notifications'; DT = 'rcptones-dev-tones-free'
OB = 'itch-obsydianx-interface-sfx-pack-1'; CY = 'itch-cyrex-studios-universal-ui-soundpack'; SF = 'itch-shapeforms-free-sfx'; JC = 'oga-jcsounds-ui-utility-pack-vol-1'
LU = 'oga-lrsf-ui-sound-effects-library'; LF = 'oga-lrsf-fantasy-sound-effects-library'; VX = 'oga-virix-ui-item-magic-samples'; WB = 'oga-wobbleboxx-level-up-power-up-coin'
MB = 'oga-mousebyte-chimey-ui-sounds'; JO = 'oga-joth-7-ui-sound-effects'; RL = 'oga-robinlamb-ui-sound-effects'; HA = 'oga-haeldb-ui-sounds'; LK = 'oga-lokif-gui-sound-effects'; MD = 'oga-mintodog-cozy-puzzle-jingles'
R1, R2, RR = 'oga-rubberduck-100-cc0-sfx', 'oga-rubberduck-100-cc0-sfx-2', 'oga-rubberduck-80-cc0-rpg-sfx'; OG = 'oga-cc0-singles'

SLOTS = [
 # ------------------------------------------------------------------ the lesson
 dict(id='right', group='The lesson', name='Right', priority='first', ladder=True,
      when='The green sheet comes up after a right answer. The most-heard reward sound, and the one every other reward is built from.',
      want='two bright notes going up, 250–400 ms. Clean, not childish. Try “rising 5 times” to hear how it would climb in a combo.',
      fit=(0.2, 0.6), items=S('correct', 0.1, 1.4, skip=('kalimba-c3', 'marimba-note')) + [P(K, 'confirmation_001'), P(M, 'state-change_confirm-up', 'confirm up'), P(M, 'hero_simple-celebration-01', 'simple celebration 1'),
             P(OB, 'confirm_style_2_001', 'confirm style 2'),
             P(JC, 'UI_TwoNote Up_Set 14_01', 'two notes up, set 14'), P(JO, 'Menu Confirm'), P(MB, 'Chime_Confirm', 'chime confirm'),
             P(DT, 'music_marimba_chord', 'marimba chord')]),
 dict(id='not-right', group='The lesson', name='Not right', priority='first',
      when='The “not quite” sheet comes up. The app never says “wrong”, so this must not sound like a buzzer or a punishment.',
      want='soft, lower, a short step down, 250–350 ms. Quieter in feel than Right.',
      fit=(0.15, 0.5), items=S('not-right', 0.1, 1.5, skip=('funny', 'game-over')) + [P(M, 'alert_error-02', 'soft error 2'), P(M, 'navigation-cancel', 'cancel'), P(M, 'state-change_confirm-down', 'confirm down'), P(K, 'question_004'), P(K, 'error_006'),
             P(S2, 'caution', 'piano caution'), P(JC, 'UI_TwoNote Down_Set 9_01', 'two notes down, set 9'),
             P(OB, 'error_style_5_001', 'error style 5'), P(JO, 'Menu Error'), P(MB, 'Chime_Cancel', 'chime cancel')]),
 dict(id='pick', group='The lesson', name='Pick', priority='first',
      when='You pick an answer tile, a picture or a word. Heard many times in every lesson, so it has to be small.',
      want='one soft neutral note, 40–80 ms. “Almost boring.”',
      items=[P(K, 'select_001'), P(K, 'select_006'), P(K, 'pluck_001'), P(S1, 'select', 'sine select'), P(S2, 'select', 'piano select'), P(S2, 'tap_01', 'piano tap'), P(M, 'navigation_hover-tap', 'hover tap'),
             P(M, 'navigation_forward-selection-minimal', 'forward, minimal'), P(O, 'tap-mellow'), P(O, 'tap-warm'), P(O, 'beep-plucked'), P(CY, 'Modern2', 'modern 2'), P(CY, 'Wood Block1', 'wood block 1'),
             P(JC, 'UI_Single_Set 3_02', 'single, set 3'), P(JC, 'UI_Single_Set 6_02', 'single, set 6'), P(DT, 'pop_drip', 'pop drip')]),
 dict(id='tile', group='The lesson', name='Tile lands', priority='first', ladder=True,
      when='A word tile lands in the sentence line in Tile Builder. Each next tile plays one step higher.',
      want='a small soft knock or pluck, 50–90 ms. Try “rising 5 times” to hear five tiles in a row.',
      items=[P(K, 'drop_001'), P(K, 'drop_002'), P(K, 'drop_003'), P(K, 'drop_004'), P(K, 'pluck_002'), P(KC, 'card-place-1'), P(KC, 'chip-lay-3'), P(KR, 'bookPlace1', 'book place'), P(CY, 'Wood Block2', 'wood block 2'),
             P(CY, 'Modern3', 'modern 3'), P(O, 'tap-wooden'), P(O, 'tap-hollow'), P(O, 'tap-resonant'), P(S2, 'type_01', 'piano type'), P(OG, 'pop-sounds_cogitollc/pop5', 'pop 5'), P(JC, 'UI_Single_Set 6_01', 'single low, set 6')]),
 dict(id='combo', group='The lesson', name='Combo', priority='later',
      when='The full-screen combo page at 3, 5 and 10 right answers in a row.',
      want='a quick run of rising notes, 0.4–1.2 s. In the end this is built from the Right sound you choose; these show the shape.',
      items=[P(M, 'hero_simple-celebration-01', 'simple celebration 1'), P(M, 'hero_simple-celebration-02', 'simple celebration 2'), P(M, 'hero_simple-celebration-03', 'simple celebration 3'),
             P(KD, 'powerUp7'), P(KD, 'powerUp11'), P(KD, 'threeTone2'), P(KJ, 'jingles_PIZZI10', 'pizzicato 10'), P(KJ, 'jingles_STEEL10', 'steel drum 10'), P(KJ, 'jingles_HIT10', 'hit 10'),
             P(WB, 'Rise01', 'rise 1'), P(WB, 'Rise03', 'rise 3'), P(OG, 'up/upshort', 'up, short'), P(JC, 'UI_Flourish Up_Set_22_01', 'flourish up, set 22'), P(JC, 'UI_Flourish Up_Set 20_01', 'flourish up, set 20'),
             P(JC, 'UI_Single Flourish Up_Set 7_01', 'flourish up, set 7'), P(S1, 'celebration', 'sine celebration'), P(VX, 'Item1B', 'item 1B'), P(JO, 'Item Pickup'), P(HA, '#0', 'haeldb 0')]),
 # ------------------------------------------------------------------ speaking
 dict(id='mic', group='Speaking', name='Mic on / off', priority='first',
      when='You press the mic: a short sound right before it starts listening. Some options are a pair and play “on”, a pause, then “off” (listening ended).',
      want='a short soft rising blip, 80–150 ms, like a voice assistant starting to listen. Nothing plays while the mic is listening.',
      items=S('mic-on-off', 0.03, 1.0, pairs=[('beep-up', 'beep-down'), ('hover-1', 'hover-2'), ('ui-switch-on', 'ui-switch-off'), ('toggle-button-on', 'toggle-button-off'), ('ui-zoom-in', 'ui-zoom-out')], skip=('denied', 'cancel', 'remove', 'interface-back'))
            + [P(S1, 'transition_up', 'sine up', off='transition_down'), P(DT, 'beep_short_on', 'short beep', off='beep_short_off'), P(JC, 'UI_Single Swell Up_Set 2_01', 'swell, set 2', off='UI_Single Swell Down_Set 2_01'),
               P(JC, 'UI_Swell Up_Set 18_02', 'low swell, set 18', off='UI_Swell Down_Set 18_01'), P(JC, 'UI_Swell Up_Set 4_01', 'swell, set 4', off='UI_Swell Down_Set 4_02'),
               P(KD, 'phaserUp5', 'phaser', off='phaserDown2'), P(K, 'maximize_008', 'low maximize', off='minimize_008'), P(M, 'ui_refresh-feed', 'refresh'), P(S1, 'notification', 'sine two notes'), P(OB, 'cursor_style_3', 'cursor 3')]),
 # ------------------------------------------------------------------ rewards
 dict(id='lesson-done', group='Rewards', name='Lesson done', priority='first',
      when='The lesson result screen, with the confetti.',
      want='a short happy phrase that ends on its home note, 1.5–2.5 s. Heard once per lesson.',
      fit=(1.2, 2.5), items=S('lesson-complete', 0.8, 4.5) + [P(OG, 'WinVibraphone', 'win, vibraphone'), P(OG, 'WinSteelDrums', 'win, steel drums'), P(OG, 'WinGrandPiano', 'win, piano'),
             P(KJ, 'jingles_STEEL12', 'steel drum 12'), P(M, 'hero_decorative-celebration-02', 'decorative celebration 2'), P(S2, 'celebration', 'piano celebration'),
             P(MB, 'Chime_LevelUp', 'chime level up'), P(OG, 'Win sound', 'win sound'), P(LK, 'positive')]),
 dict(id='perfect', group='Rewards', name='Perfect lesson', priority='later',
      when='A lesson with no mistakes: “Mukammal” slams in gold, rings and big confetti.',
      want='bigger and longer than Lesson done, 2–3 s, with sparkle on top.',
      fit=(1.8, 3.2), items=S('perfect-lesson', 1.1, 5.5) + [P(LF, 'Jingle_Achievement_00', 'achievement jingle'), P(JO, 'Ability Learn'), P(OG, 'newthingget', 'new thing get'), P(OG, 'WinFantasia', 'win, fantasia'),
             P(VX, 'MESSAGE-B_Accept', 'message accept'), P(WB, 'Rise05', 'rise 5'), P(MD, 'Cozy Puzzle Clear (Jingle)', 'cozy puzzle clear')]),
 dict(id='new-phrase', group='Rewards', name='New phrase', priority='later',
      when='The violet “you can now say” card pops in with twinkles.',
      want='a sparkle or a small reveal, 0.4–1.2 s.',
      fit=(0.4, 1.2), items=S('new-phrase', 0.2, 2.6) + [P(OG, 'magical_2', 'magical 2'), P(RR, 'item_gem_04', 'gem 4'), P(M, 'notification_decorative-01', 'decorative 1'), P(SF, 'UI Message Appear 01', 'message appear')]),
 dict(id='count', group='Rewards', name='Count', priority='later', ladder=True,
      when='Numbers counting up, and the gold bits landing on a counter one by one.',
      want='a tiny tick or coin, 50–250 ms, that still sounds fine ten times in a row.',
      fit=(0.05, 0.25), items=S('counter-tick', 0.02, 0.6) + [P(LF, 'Pickup_Gold_01', 'gold pickup 1'), P(RR, 'item_coins_01', 'coins 1'), P(RR, 'item_gem_02', 'gem 2'), P(KC, 'chips-collide-1'), P(K, 'tick_001'), P(KD, 'tone1')]),
 dict(id='level-up', group='Rewards', name='Level up', priority='later',
      when='The level badge slams in and the number flips.',
      want='a rising fanfare, bigger than Lesson done, 2–3 s. Rare, so it can be big.',
      fit=(1.5, 3.0), items=S('level-up', 0.6, 5.5) + [P(JO, 'Level Up'), P(WB, 'Rise04', 'rise 4'), P(WB, 'Rise07', 'rise 7'), P(WB, 'Upper01', 'upper 1'), P(OG, 'up/uplong', 'up, long'), P(OG, 'WinBrass', 'win, brass')]),
 dict(id='trophy', group='Rewards', name='Trophy', priority='later',
      when='The checkpoint is finished: the trophy drops and lands.',
      want='the biggest sound in the app, 2.5–3.5 s.',
      fit=(1.5, 3.5), items=S('trophy', 0.8, 6.5) + [P(OG, 'WinStrings', 'win, strings'), P(OG, 'WinHarpsichord', 'win, harpsichord'), P(R1, 'gong_01', 'gong'), P(VX, 'Healing Full', 'healing, full'), P(WB, 'FX02', 'fx 2')]),
 dict(id='award', group='Rewards', name='Award', priority='later',
      when='A new award on the Profile page: the tile punches and gets its “YANGI” tag.',
      want='a middle-size sound with a metal glint, 1.2–1.8 s.',
      fit=(0.8, 1.8), items=S('trophy', 0.2, 0.7) + [P(MB, 'Chime_Load', 'chime load'), P(MB, 'Chime_Save', 'chime save'), P(VX, 'Item1A', 'item 1A'), P(VX, 'Item2A', 'item 2A'), P(VX, 'Menu2A', 'menu 2A'), P(AK, 'Enharpment'), P(AK, 'Glisten'), P(AK, 'Information_Bell', 'information bell'),
             P(AK, 'Koto'), P(M, 'hero_decorative-celebration-01', 'decorative celebration 1'), P(M, 'hero_decorative-celebration-03', 'decorative celebration 3'), P(KJ, 'jingles_STEEL01', 'steel drum 1'),
             P(KJ, 'jingles_PIZZI12', 'pizzicato 12'), P(R1, 'bell_01', 'bell 1'), P(OG, 'bell_ding4', 'bell ding 4'), P(RL, 'ding_deep', 'deep ding'), P(WB, 'Coin01', 'coin'), P(OG, 'completetask', 'complete task')]),
 # ------------------------------------------------------------------ streak
 dict(id='streak', group='Streak', name='Streak', priority='first',
      when='The flame lights on the streak screen after the first lesson of the day.',
      want='a warm, soft ignition, 0.6–1.5 s. Not an explosion.',
      fit=(0.4, 1.5), items=S('streak-fire', 0.15, 2.5) + [P(OG, 'catching-fire_themightyglider/flame', 'catching fire'), P(RR, 'spell_fire_02', 'fire spell 2'), P(RR, 'spell_fire_06', 'fire spell 6'), P(RR, 'spell_fire_07', 'fire spell 7'),
             P(OG, 'LEGIT_FIR_Fire_Staff 11-Audio', 'fire staff 11'), P(OG, 'LEGIT_FIR_Fire_Staff 7-Audio', 'fire staff 7')]),
 dict(id='freeze', group='Streak', name='Streak freeze', priority='later',
      when='A streak freeze is used: frost covers the flame.',
      want='cool and glassy, calm, 0.4–1.2 s. Not sad.',
      fit=(0.4, 1.2), items=S('streak-freeze', 0.15, 2.05) + [P(OG, 'freeze-spell_artisticdude/freeze', 'freeze spell'), P(OG, 'ice-spells_bart/ice', 'ice'), P(OG, 'coldsnap', 'cold snap'), P(VX, 'Ice attack 2', 'ice 2'), P(AK, 'Glass')]),
 # ------------------------------------------------------------------ interface
 dict(id='button', group='Interface', name='Button', priority='later',
      when='The main button is pressed (TEKSHIRISH, DAVOM ETISH).',
      want='a soft tick with no note, 30–60 ms. Very quiet in the app; may also stay silent with only a haptic.',
      items=[P(K, 'click_002'), P(K, 'click_005'), P(K, 'tick_004'), P(KU, 'click1'), P(KU, 'click2'), P(KU, 'switch10', 'switch 10'), P(M, 'ui_tap-variant-01', 'tap 1'), P(M, 'ui_tap-variant-03', 'tap 3'), P(S1, 'button', 'sine button'),
             P(S1, 'tap_01', 'sine tap'), P(S3, 'tap_01', 'industrial tap'), P(O, 'tap-crisp'), P(O, 'tap-professional'), P(O, 'tap-percussive'), P(LU, 'Click_Standard_02', 'click standard'), P(CY, 'Minimalist7', 'minimalist 7'),
             P(OG, 'menu tick')]),
 dict(id='pop', group='Interface', name='Pop', priority='later',
      when='Something small appears: a badge, a chip, a toast, a tag.',
      want='a small bubble pop, 80–250 ms.',
      fit=(0.05, 0.25), items=S('pop', 0.02, 1.0) + [P(OG, '3pops/pop1', 'pop 1'), P(OG, '3pops/pop3', 'pop 3'), P(OG, 'pop-sounds_cogitollc/pop6', 'pop 6'), P(OG, 'pop-effect-sounds_trezegames/p_1', 'p 1'), P(R1, 'plop_02', 'plop'),
             P(O, 'beep-brightpop', 'bright pop')]),
 dict(id='whoosh', group='Interface', name='Whoosh', priority='later',
      when='A sheet slides up, a tile flies to the line, a screen changes. Optional: many apps leave this silent.',
      want='soft air, 100–400 ms, no note.',
      fit=(0.1, 0.4), items=S('whoosh', 0.05, 1.0) + [P(OG, 'swosh-02'), P(OG, 'swosh-12'), P(OG, 'swish-7'), P(S1, 'swipe_01', 'sine swipe'), P(LU, 'Slide_Soft_00', 'soft slide'), P(SF, 'WHOOSH_AIRY_FLUTTER_01', 'airy flutter')]),
 dict(id='switch', group='Interface', name='Switch', priority='later',
      when='A toggle is flipped in Settings. Each option plays “on”, a pause, then “off”.',
      want='two notes up for on and the same two reversed for off, 60–100 ms each.',
      items=[P(S1, 'toggle_on', 'sine toggle', off='toggle_off'), P(S2, 'toggle_on', 'piano toggle', off='toggle_off'), P(S3, 'toggle_on', 'industrial toggle', off='toggle_off'), P(DT, 'beep_short_on', 'short beep', off='beep_short_off'),
             P(M, 'ui_unlock', 'unlock / lock', off='ui_lock'), P(M, 'state-change_confirm-up', 'confirm up / down', off='state-change_confirm-down'), P(K, 'maximize_007', 'maximize 7', off='minimize_007'),
             P(K, 'maximize_009', 'maximize 9', off='minimize_009'), P(K, 'toggle_002', 'toggle 2', off='toggle_001'), P(K, 'switch_006', 'switch 6', off='switch_005'), P(JC, 'UI_Flourish Up_Set 17_01', 'flourish, set 17', off='UI_Flourish Down_Set 17_01'),
             P(JC, 'UI_Single Up_Set 19_01', 'single, set 19', off='UI_Single Down_Set 19_01'), P(R2, 'sfx100v2_switch_01', 'real switch', off='sfx100v2_switch_02')]),
 dict(id='reminder', group='Interface', name='Reminder', priority='later',
      when='The daily reminder notification.',
      want='a gentle chime, under 1 s. The phone’s own notification sound is fine for the test build.',
      fit=(0.3, 1.2), items=S('notification', 0.15, 1.5) + [P(AK, 'Polite'), P(AK, 'Cloud'), P(AK, 'Woodblock'), P(M, 'notification_simple-02', 'simple 2'), P(S1, 'notification', 'sine notification')]),
]

for s in SLOTS:
    fit = s.pop('fit', None)
    if fit: s['items'].sort(key=lambda it: 0 if it.get('src2') else max(fit[0] - it['_s'], it['_s'] - fit[1], 0))
    for it in s['items']: it.pop('_s', None)
json.dump({'slots': SLOTS}, open('sound-tools/curated.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for s in SLOTS: print('%-12s %d' % (s['id'], len(s['items'])))
print('total', sum(len(s['items']) for s in SLOTS))
