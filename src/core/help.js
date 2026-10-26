// Dombi's help inside a lesson (owner's pick A, 2026-10-23). No screens here.
// Tap Dombi to open the help sheet; each step shows a little more. After the second miss on the same item he offers help.
//   helpStart() -> { misses, step, offered }     helpReducer(state, { type: 'miss' | 'open' | 'next' | 'item' })

export const HELP_STEPS = ['slow', 'firstWord', 'uzbek', 'answer'];

export const helpStart = () => ({ misses: 0, step: 0, offered: false });

export function helpReducer(s, { type }) {
  switch (type) {
    case 'miss': { const misses = s.misses + 1; return { ...s, misses, offered: s.offered || misses >= 2 }; }
    case 'open': return { ...s, step: Math.max(1, s.step) };
    case 'next': return { ...s, step: Math.min(HELP_STEPS.length, s.step + 1) };
    case 'item': return helpStart();
    default: return s;
  }
}
