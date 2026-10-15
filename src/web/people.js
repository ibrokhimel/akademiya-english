// Everything drawn by Rive, made once when the app opens (a new Rive view shows a start-up logo for two seconds, so none is made later):
// the four people of the lessons, Dombi, and the effects. A view is one canvas, so a person is in one place at a time.
const BOARD = { aziz: 'Aziz', malika: 'Malika', waiter: 'Waiter A', seller: 'Waiter C' };
export const People = { vm: {}, canvas: {}, dombi: null, fx: {}, flame: null, flameBig: null };
const park = () => document.querySelector('#park');
const canvas = (w, h) => { const c = Object.assign(document.createElement('canvas'), { width: w, height: h }); park().appendChild(c); return c; };

export async function loadPeople() {
  for (const who of Object.keys(BOARD)) { People.canvas[who] = canvas(264, 264); People.vm[who] = await M.rive(People.canvas[who], BOARD[who], 'Waiter'); }
  People.canvas.dombi = canvas(460, 460); People.dombi = await M.rive(People.canvas.dombi, 'Dombi', 'Dombi');
  for (const [k, board, w, h] of [['confetti', 'FX Confetti', 780, 1688], ['twinkle', 'FX Twinkle', 480, 400], ['embers', 'FX Embers', 400, 520], ['rings', 'FX Rings', 480, 480], ['dust', 'FX Dust', 400, 240]]) { People.canvas[k] = canvas(w, h); People.fx[k] = await M.rive(People.canvas[k], board); }
  // two streak flames: the small one at the top of the Learn page and the big one on the streak screen
  People.canvas.flame = canvas(96, 124); People.flame = await M.rive(People.canvas.flame, 'Streak Flame'); People.canvas.flameBig = canvas(192, 248); People.flameBig = await M.rive(People.canvas.flameBig, 'Streak Flame');
  await M.initPop(); setDark(document.body.classList.contains('dark'));
}
export function setDark(on) { for (const vm of [...Object.values(People.vm), People.dombi]) if (vm) vm.boolean('dark').value = on; }
// put a person into a holder at `size` px (whoever was there goes back to the park)
People.put = (who, holder, size) => { const c = People.canvas[who]; for (const o of [...holder.children]) if (o.tagName === 'CANVAS' && o !== c) park().appendChild(o);      // one person in a holder at a time
  c.style.cssText = `width:${size}px;height:${size}px;display:block`; holder.appendChild(c); return People.vm[who]; };
People.quiet = () => Object.values(People.vm).forEach((vm) => { vm.boolean('talking').value = false; });
// everyone back to the park (before a screen is thrown away, or its canvases go with it)
People.home = () => { for (const c of Object.values(People.canvas)) { c.className = ''; park().appendChild(c); } People.quiet(); };
// Dombi in a box of the design's size (his artboard has room around him: see dombiFit in the lab)
People.putDombi = (box, size) => { dombiInto(People.canvas.dombi, box, size); return People.dombi; };
// an effect over the whole screen (confetti) or centred on an element (twinkle), in the phone's own units
People.over = (k, phone, el, w, h, dy = 0) => { const c = People.canvas[k]; c.className = 'fxlayer'; phone.appendChild(c);
  if (!el) { c.style.cssText = 'width:390px;height:100%;left:0;top:0;z-index:7'; return People.fx[k]; }
  const p = phone.getBoundingClientRect(), r = el.getBoundingClientRect(), s = phone.offsetWidth / p.width;
  c.style.cssText = `width:${w}px;height:${h}px;left:${(r.left - p.left + r.width / 2) * s - w / 2}px;top:${(r.top - p.top + r.height / 2) * s - h / 2 + dy}px;z-index:8`; return People.fx[k]; };
