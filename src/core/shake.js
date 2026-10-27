// When the phone counts as shaken: two jolts over 1.8 g (the whole reading, gravity included) within 0.6 s, the way a hand
// shakes back and forth. One bump, a tilt or a slow wave is not a shake. After a shake, 1.5 s before the next one counts.
const BAR = 1.8, PAIR = 600, REST = 1500;

export const shakeStart = () => ({ above: false, jolt: -Infinity, rest: -Infinity });

/** One accelerometer reading: `g` is its size in g, `t` in ms. Returns the next state and whether this reading ends a shake. */
export function shakeStep(s, t, g) {
  const above = g > BAR;
  if (!above || s.above) return { state: { ...s, above }, shake: false };
  if (t - s.jolt <= PAIR && t >= s.rest) return { state: { above, jolt: -Infinity, rest: t + REST }, shake: true };
  return { state: { ...s, above, jolt: t }, shake: false };
}
