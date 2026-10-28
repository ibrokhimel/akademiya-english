// The feedback cards beside Dombi: "say it better" and one pronunciation note per turn, text only, newest on top, fading after a while.
// mountCards(column, cfg) -> { show(kind, text), turn(), clear() }
import { COPY } from './copy.js';

export function mountCards(column, cfg) {
  let thisTurn = new Set();
  return {
    // one card of each kind per learner turn; the next turn starts with turn()
    show(kind, text) {
      if (!text || thisTurn.has(kind)) return false; thisTurn.add(kind);
      const el = document.createElement('div'); el.className = 'fcard ' + kind;
      el.innerHTML = `<div class="klbl">${kind === 'better' ? COPY.cardBetter : COPY.cardPron}</div><div class="ktxt"></div>`; el.querySelector('.ktxt').textContent = text;
      column.insertBefore(el, column.firstChild); while (column.children.length > 6) column.lastChild.remove();
      if (window.M && !M.reduce) M.fadeUp(el, 8, 200);
      setTimeout(() => { el.classList.add('old'); }, cfg.CARD_FADE_MS);
      return true;
    },
    turn() { thisTurn = new Set(); },
    clear() { column.innerHTML = ''; thisTurn = new Set(); },
  };
}
