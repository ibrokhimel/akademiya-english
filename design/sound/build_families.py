"""Build the families of small interface sounds.  python -I build_families.py

A family is one maker's set, designed to sound like one material. Each family fills every small moment of the app
(tap, pick, wheel tick, tab, sheet, switch...), so the lab can swap the whole set at once and the owner picks a family,
not single sounds. The big sounds (right, rewards, streak) stay the owner's picks from final/.

Writes families/<family>/<moment>.wav and families/families.json:
  sounds  moment -> files (several = variants played in turn), volume for each, step (semitones the moment is played at)
  tune    for each of the owner's picks: how many semitones to shift it so it sits in the family's key
"""
import os, sys, json, shutil
from concurrent.futures import ThreadPoolExecutor
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [HERE, os.path.join(HERE, 'tools')]      # python -I leaves the script's folder out
from build_final import write
import features
OUT = os.path.join(HERE, 'families'); PACKS = os.path.join(HERE, 'originals', 'packs')

# How loud each small moment is heard, in LUFS (same measure as build_final.py). The more often it plays, the lower it sits.
LOUD = {'turn': -36, 'roll': -47, 'appear': -44, 'tick': -43, 'button': -46, 'tab': -43, 'seg': -43, 'close': -41, 'next': -41, 'back': -41, 'unfold': -41, 'pick': -40, 'count': -40, 'step': -40, 'whoosh': -40,
        'tile': -39, 'switch-on': -39, 'switch-off': -39, 'star': -38, 'mistakes': -39, 'nothing': -38, 'pop': -37, 'sent': -37, 'unlock': -33, 'friend': -31}
# What each moment is, for the docs and the app
WHEN = {'turn': 'it becomes your turn to speak', 'appear': 'one of several things arriving one after another (rises a step each time)', 'button': 'a main or small button is pressed', 'pick': 'something becomes the picked one', 'tile': 'a word tile lands in the line (rises a step each time)', 'pop': 'a toast, tip, dialog or speech bubble appears',
        'whoosh': 'a bottom sheet comes up', 'close': 'a sheet or dialog goes away', 'switch-on': 'a toggle is switched on', 'switch-off': 'a toggle is switched off', 'count': 'a gold bit lands on a counter (rises)',
        'tick': 'one step of the time wheel', 'roll': 'a number counting up (a few soft ticks)', 'tab': 'a tab at the bottom is chosen', 'seg': 'the two-option control changes', 'next': 'onboarding moves to the next screen',
        'back': 'onboarding goes back a screen', 'unfold': 'the streak calendar opens or closes', 'mistakes': 'the mistakes round arrives', 'step': 'a step of a list lights up (rises)', 'star': 'a phrase earns a star',
        'sent': 'a friend request is sent', 'friend': 'a friend request is accepted', 'unlock': 'the next lesson circle unlocks', 'nothing': 'the mic heard nothing'}

T = lambda n: ['type_0%d' % i for i in range(1, n + 1)]
SND = {'button': 'button', 'pick': 'select', 'tile': 'tap_03', 'pop': 'tap_02', 'whoosh': 'transition_up', 'close': 'transition_down', 'switch-on': 'toggle_on', 'switch-off': 'toggle_off',
       'count': ('select', -12), 'step': ('select', -12), 'appear': 'tap_01', 'turn': ('notification', -5), 'tick': T(5), 'roll': T(5), 'tab': 'tap_01', 'seg': 'tap_05', 'next': 'swipe_01', 'back': 'swipe_02', 'unfold': 'swipe_03', 'mistakes': 'swipe_04',
       'sent': 'swipe_05', 'star': ('toggle_on', -5), 'unlock': 'notification', 'friend': 'celebration', 'nothing': 'disabled'}
FAMILIES = [
    {'id': 'sine', 'name': 'Sine', 'by': 'SND01 "sine" (snd.dev)', 'licence': 'free for apps (SND terms of use)', 'credit': None, 'dir': 'snd-snd01-sine',
     'about': 'pure, tiny, electronic; the closest to the iPhone feel', 'scale': [0, 2, 4, 5, 7, 9], 'map': SND},
    {'id': 'piano', 'name': 'Piano', 'by': 'SND02 "piano" (snd.dev)', 'licence': 'free for apps (SND terms of use)', 'credit': None, 'dir': 'snd-snd02-piano',
     'about': 'the same set played on a grand piano: notes, hammer knocks, string scrapes; warm and musical, but longer', 'scale': [0, 2, 4, 5, 7, 9, 11],
     'map': {**SND, 'count': ('button', -12), 'step': ('button', -12), 'tile': 'tap_01', 'pop': 'tap_04', 'tab': 'tap_02', 'star': ('toggle_on', 0), 'appear': 'tap_03', 'turn': ('button', 7)}},
    {'id': 'material', 'name': 'Material', 'by': 'Google Material sounds', 'licence': 'CC BY 4.0', 'credit': 'Sounds from Material Design sound resources by Google, licensed under CC BY 4.0.', 'dir': 'google-material-product-sounds',
     'about': 'soft, rounded, tonal; the family your Right and Pick already come from', 'scale': [2, 4, 6, 7, 9, 11, 1],
     'map': {'button': 'ui_tap-variant-01', 'pick': 'navigation_hover-tap', 'tile': 'ui_tap-variant-02', 'pop': 'ui_lock', 'whoosh': 'navigation_transition-right', 'close': 'navigation_transition-left',
             'switch-on': 'state-change_confirm-up', 'switch-off': 'state-change_confirm-down', 'count': 'navigation_hover-tap', 'step': 'navigation_hover-tap',
             'appear': 'ui_tap-variant-04', 'turn': ('notification_simple-01', -5), 'tick': ['ui_tap-variant-03', 'ui_tap-variant-04', 'ui_tap-variant-02'], 'roll': ['ui_tap-variant-03', 'ui_tap-variant-04'], 'tab': 'ui_tap-variant-03', 'seg': 'ui_tap-variant-04',
             'next': 'navigation_forward-selection-minimal', 'back': 'navigation_backward-selection-minimal', 'unfold': 'navigation_transition-right', 'mistakes': 'navigation_transition-right',
             'sent': 'notification_simple-01', 'star': 'ui_unlock', 'unlock': 'ui_unlock', 'friend': 'navigation_selection-complete-celebration', 'nothing': 'navigation_unavailable-selection'}},
    {'id': 'clicks', 'name': 'Clicks', 'by': 'Kenney Interface Sounds', 'licence': 'CC0', 'credit': None, 'dir': 'kenney-interface-sounds',
     'about': 'dry clicks and ticks with no pitch of their own, like switches on a device', 'scale': None,
     'map': {'button': 'click_002', 'pick': 'select_002', 'tile': 'drop_004', 'pop': 'pluck_001', 'whoosh': 'open_001', 'close': 'close_001', 'switch-on': 'maximize_007', 'switch-off': 'minimize_007',
             'count': 'drop_003', 'step': 'drop_003', 'appear': 'click_005', 'turn': 'select_005', 'tick': ['tick_001', 'tick_002'], 'roll': ['tick_001'], 'tab': 'click_003', 'seg': 'click_005', 'next': 'maximize_003', 'back': 'minimize_003',
             'unfold': 'open_002', 'mistakes': 'open_004', 'sent': 'select_006', 'star': 'pluck_002', 'unlock': 'confirmation_001', 'friend': 'confirmation_002', 'nothing': 'switch_006'}},
]


def find(folder, stem):
    hits = [os.path.join(d, f) for d, _, fs in os.walk(os.path.join(PACKS, folder)) for f in fs if os.path.splitext(f)[0] == stem and f.lower().endswith(('.wav', '.ogg'))]
    assert len(hits) == 1, (folder, stem, hits); return os.path.relpath(hits[0], HERE)


def tune(paths, scale):
    """Semitones (-3..3) that move these sounds' notes into the scale, or 0 when they have no clear notes or already fit.
    An on/off pair is measured as one sound, so both halves move together."""
    w = np.zeros(12)
    for path in paths:
        for m, _, strength, pure in features.notes(features.decode(path)):
            if pure > 0.3: w[m % 12] += strength * pure
    if w.sum() < 1.0: return 0, None
    fit = lambda s: sum(w[pc] for pc in range(12) if (pc + s) % 12 in scale) / w.sum()
    best = max(range(-3, 4), key=lambda s: fit(s) - 0.04 * abs(s))
    return (best if fit(best) - fit(0) > 0.15 else 0), (round(fit(0), 2), round(fit(best), 2))


def main():
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    final = json.load(open(os.path.join(HERE, 'final', 'sounds.json'), encoding='utf-8'))['sounds']; out = []
    assert all(set(f['map']) == set(LOUD) == set(WHEN) for f in FAMILIES), 'every family must fill every moment'
    for fam in FAMILIES:
        d = os.path.join(OUT, fam['id']); os.makedirs(d); jobs = []
        for role, src in fam['map'].items():
            step = 0
            if isinstance(src, tuple): src, step = src
            stems = src if isinstance(src, list) else [src]
            for i, stem in enumerate(stems): jobs.append((role, role + ('-%d' % (i + 1) if len(stems) > 1 else ''), find(fam['dir'], stem), step, stem))
        with ThreadPoolExecutor(12) as ex: done = list(ex.map(lambda j: write(j[0], j[1], j[2], d, LOUD[j[0]]), jobs))
        sounds = {}
        for (role, name, src, step, stem), r in zip(jobs, done):
            s = sounds.setdefault(role, {'when': WHEN[role], 'step': step, 'files': []}); s['files'].append({'file': r['file'], 'volume': r['volume'], 'ms': r['ms'], 'from': stem})
        tunes = {}
        if fam['scale']:
            groups = {}
            for s in final:
                if s['name'] not in sounds: groups.setdefault(s['name'].replace('-on', '').replace('-off', '') if s['name'].endswith(('-on', '-off')) else s['name'], []).append(s)
            for g, members in groups.items():
                t, how = tune([os.path.join(HERE, 'final', s['file']) for s in members], fam['scale'])
                if t: tunes.update({s['name']: t for s in members})
                if how: print('   %-8s %-12s fits %.2f%s' % (fam['id'], g, how[0], ' -> %+d semitones, fits %.2f' % (t, how[1]) if t else ''))
        out.append({k: fam[k] for k in ('id', 'name', 'by', 'licence', 'credit', 'about')} | {'sounds': sounds, 'tune': tunes})
        print('%-9s %2d files  %s' % (fam['id'], len(jobs), '  '.join('%s %d ms' % (k, v['files'][0]['ms']) for k, v in sounds.items() if k in ('button', 'pick', 'tick', 'tab', 'whoosh', 'unlock', 'friend'))))
    json.dump({'families': out}, open(os.path.join(OUT, 'families.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__': main()
