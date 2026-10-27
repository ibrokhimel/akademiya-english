import { useIsFocused } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import { DeviceMotion } from "expo-sensors";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { touchReducer, touchStart } from "../../../core/touch.js";
import type { Rig } from "./Actor";
import { useFinger } from "./DombiWatch";
import { useMicLevel } from "../lib/micLevel";
import { Dombi, type DombiMoment } from "./Dombi";

type Effect = { fire?: string; play?: string; mood?: string; haptic?: number | number[]; drop?: boolean; num?: [string, number]; looking?: boolean; hidden?: boolean; pop?: boolean };
/** Learn-tab perches in screen points: the card's top edge and the flame's left side and bottom. */
export type Zones = { peek?: { l: number; r: number; top: number }; warm?: { x: number; y: number } };
type Event = { type: string; t: number; x?: number; y?: number; dt?: number; cancel?: boolean; d?: number; g?: number; level?: number };
type Rule = "all" | "nocarry" | "perch";

// Haptics as in the playground's buzz(): one number is one tap, an array alternates tap / pause.
function buzz(pattern: number | number[]) {
  const pulses = Array.isArray(pattern) ? pattern.filter((_, i) => i % 2 === 0) : [pattern];
  let at = 0;
  pulses.forEach((ms, i) => {
    setTimeout(() => { void Haptics.impactAsync(ms >= 15 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, at);
    at += ms + (Array.isArray(pattern) ? pattern[i * 2 + 1] ?? 0 : 0);
  });
}

/**
 * Dombi you can touch (motion-plan §8, locked 2026-10-11; owner 2026-10-27): hold to pick him up, carry, drop, throw,
 * tap to poke, double-tap for a trick, rub to pet, he sleeps after 22 s and a tap wakes him.
 * rule "nocarry" (a lesson): taps, pokes, tricks and petting only. On still-picture phones he comes alive while touched.
 * rule "perch" (a lesson): carried, dropped and thrown as on the tabs, landing `ground` points below his spot; after
 * 4 s untouched where he landed, onDrop gets how far from his spot he is and the screen moves him to the nearest free
 * spot (owner, 2026-10-27). scale shrinks him with his feet in place.
 * Eyes follow a finger anywhere on the tabs (DombiWatch); a drop on the Learn card or beside the flame perches him (zones);
 * let go at a side edge he hides and peeks back in.
 * Reduce Motion: no touch play; a tap still does onTap.
 */
export function DombiPlay({ moment, size, rule = "all", onTap, onDrop, scale = 1, ground = 0, zones, eventsRef, onPop }: { moment: DombiMoment; size: number; rule?: Rule; onTap?: () => void; onDrop?: (dx: number, dy: number) => void; scale?: number; ground?: number; zones?: () => Zones | undefined; /** filled with a sender for screen events: feed, highfive, hand */ eventsRef?: RefObject<((type: string) => void) | null>; /** a high-five landed: the screen shows its pop */ onPop?: () => void }) {
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const rig = useRef<Rig | null>(null);
  const state = useRef<ReturnType<typeof touchStart> | null>(null);
  const current = () => (state.current ??= touchStart(Date.now()));
  // Effects waiting for the rig to mount on a still-picture phone (dropped after 1 s, or when he is a picture again).
  const pending = useRef<{ e: Effect; at: number }[]>([]);
  const awakeRef = useRef(false);
  const home = useRef<{ x: number; y: number } | null>(null);
  const boxSize = useRef({ w: 0, h: 0 });
  const loop = useRef<{ raf: number; timer: ReturnType<typeof setTimeout> | null; last: number }>({ raf: 0, timer: null, last: 0 });
  const [awake, setAwake] = useState(false);
  // Asleep shows on every phone: a still-picture phone draws the sleeping pose (Redmi test, 2026-10-27: he looked awake).
  const [asleep, setAsleep] = useState(false);
  const asleepRef = useRef(false);
  const dx = useSharedValue(0), dy = useSharedValue(0), rot = useSharedValue(0), shown = useSharedValue(1), wasHeld = useRef(false);
  const style = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: dx.value }, { translateY: dy.value }, { rotate: `${rot.value}deg` }, { scale }], transformOrigin: "50% 100%" }));
  const dropTo = useRef(onDrop), popTo = useRef(onPop);
  useEffect(() => { dropTo.current = onDrop; popTo.current = onPop; }, [onDrop, onPop]);
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const env = useCallback(() => {
    const h = home.current ?? { x: width - 56, y: height - 120 };
    return { w: width, h: height, homeX: h.x, floorY: h.y, groundY: h.y + ground, eyeUp: size * 0.55, zones: zones?.() };
  }, [width, height, ground, size, zones]);

  const apply = useCallback((effects: Effect[]) => {
    const now = Date.now();
    const queue = [...pending.current.filter((p) => now - p.at < 1000), ...effects.map((e) => ({ e, at: now }))];
    pending.current = [];
    for (const { e, at } of queue) {
      if (e.haptic !== undefined) { if (at === now) buzz(e.haptic); continue; }
      // The screen takes him from where he was let go; his own offset goes back to his spot in the same frame.
      if (e.drop) { dropTo.current?.(dx.get(), dy.get()); dx.set(0); dy.set(0); rot.set(0); continue; }
      if (e.hidden !== undefined) { shown.set(e.hidden ? 0 : 1); continue; }
      if (e.pop) { popTo.current?.(); continue; }
      const r = rig.current;
      if (!r) { if (awakeRef.current) pending.current.push({ e, at }); continue; }   // still-picture phone: the rig is mounting
      if (e.fire) r.fire(e.fire); else if (e.play !== undefined) r.play(e.play); else if (e.mood) r.mood(e.mood);
      else if (e.num) r.num(e.num[0], e.num[1]); else if (e.looking !== undefined) r.bool("looking", e.looking);
    }
  }, [dx, dy, rot, shown]);

  const draw = useCallback(() => {
    const s = current(), e = env(), b = s.body;
    if (b.x === null || b.y === null) return;
    dx.set(b.x - e.homeX); dy.set(b.y - e.floorY); rot.set(b.rot);
    const r = rig.current; if (!r) return;
    const held = s.mode === "held";
    r.num("swing", b.swing); r.num("squish", held ? b.squish : 0);
    // Carried, his eyes look where he is going; at rest they belong to the finger watcher (effects `looking`, lookX/Y).
    if (held) { r.bool("looking", true); r.num("lookX", Math.max(-100, Math.min(100, b.vx / 6))); r.num("lookY", Math.max(-100, Math.min(100, b.vy / 6))); }
    else if (wasHeld.current) { r.bool("looking", false); r.num("lookX", 0); r.num("lookY", 0); }
    wasHeld.current = held;
  }, [env, dx, dy, rot]);

  // Held on a tab, the mic listens (owner: only while a finger holds him): talk and he pulses, blow and he leans back.
  const mic = useMicLevel(), micOn = useRef(false), micLevel = useRef<(level: number) => void>(() => {});
  const send = useCallback((ev: Event) => {
    const r = touchReducer(current(), { ...ev, rule, env: env() });
    state.current = r.state; apply(r.effects as Effect[]); draw();
    const held = rule === "all" && r.state.mode === "held";
    if (held !== micOn.current) { micOn.current = held; if (held) mic.start((level) => micLevel.current(level)); else mic.stop(); }
    const sleeping = r.state.mode === "asleep";
    if (sleeping !== asleepRef.current) { asleepRef.current = sleeping; setAsleep(sleeping); }
  }, [rule, env, apply, draw, mic]);
  useEffect(() => { micLevel.current = (level) => send({ type: "mic", t: Date.now(), level, dt: 0.05 }); }, [send]);

  // Leaving the screen sends him home, calm (a throw or a walk never plays out unseen), and coming back starts his
  // 22 s nap count afresh: the count runs only while his screen is in view.
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) return;
    state.current = touchStart(Date.now()); pending.current = [];
    dx.set(0); dy.set(0); rot.set(0); shown.set(1);
    rig.current?.play("none"); rig.current?.mood("smirk");
    if (asleepRef.current) { asleepRef.current = false; setAsleep(false); }
    micOn.current = false; mic.stop();
    return () => { state.current = touchStart(Date.now()); };
  }, [focused, dx, dy, rot, shown, mic]);

  // Frames run only while something moves or a press is pending; otherwise one timer waits for his 22 s nap.
  const schedule = useRef<() => void>(() => {});
  useEffect(() => {
    if (!focused) { schedule.current = () => {}; return; }
    const L = loop.current;
    // Keep ticking while effects wait for the rig, so they play as soon as it mounts.
    // In a lesson, frames also run while he waits away from his spot, so the 4 s wait ends on time.
    const busy = () => { const s = current(); return !!s.press || !["idle", "asleep", "perched"].includes(s.mode) || s.tilt !== 0 || s.slid || Object.keys(s.at).length > 0 || pending.current.length > 0 || (rule === "perch" && (Math.abs(dx.get()) > 1 || Math.abs(dy.get()) > 1)); };
    const frame = (now: number) => {
      L.raf = 0;
      const dt = Math.min(0.033, L.last ? (now - L.last) / 1000 : 0.016); L.last = now;
      send({ type: "tick", t: Date.now(), dt });
      if (busy()) L.raf = requestAnimationFrame(frame);
      else { L.last = 0; schedule.current(); }
    };
    schedule.current = () => {
      if (L.raf || L.timer) return;
      if (busy()) { L.raf = requestAnimationFrame(frame); return; }
      const s = current();
      if (s.mode === "idle" || s.mode === "perched") L.timer = setTimeout(() => { L.timer = null; send({ type: "tick", t: Date.now(), dt: 0.016 }); schedule.current(); }, Math.max(50, s.lastAct + 22050 - Date.now()));
    };
    schedule.current();
    return () => { cancelAnimationFrame(L.raf); if (L.timer) clearTimeout(L.timer); L.raf = 0; L.timer = null; };
  }, [send, focused, rule, dx, dy]);

  // On a still-picture phone the rig is only mounted while he plays; he goes back to the picture 2 s after settling.
  useEffect(() => {
    if (!awake) return;
    const check = setInterval(() => {
      const s = current();
      if (!s.press && ["idle", "asleep", "perched"].includes(s.mode) && Date.now() - s.lastAct > 2000) { awakeRef.current = false; pending.current = []; setAwake(false); }
    }, 500);
    return () => clearInterval(check);
  }, [awake]);

  // His home spot comes from a touch that lands on him while he sits there: the finger's screen point minus its point inside him.
  // (Measuring the view on layout read the tab mid-slide, up to a screen width off, so he was drawn away from the finger.)
  const homeFrom = useCallback((x: number, y: number, lx: number, ly: number) => {
    const s = current(), { w, h } = boxSize.current, k = scaleRef.current;
    if (!w || !["idle", "asleep"].includes(s.mode) || Math.abs(dx.get()) > 0.5 || Math.abs(dy.get()) > 0.5) return;
    home.current = { x: x + (w / 2 - lx) * k, y: y + (h - ly) * k };
    state.current = { ...s, body: { ...s.body, x: home.current.x, y: home.current.y } };
  }, [dx, dy]);

  const pressAt = useRef(0), pressMoved = useRef(0), last = useRef({ x: 0, y: 0 }), lifted = useRef(false);
  const restart = useCallback(() => { const L = loop.current; if (L.timer) { clearTimeout(L.timer); L.timer = null; } schedule.current(); }, []);
  // Eyes on a finger anywhere on the tab. They follow only while the rig is drawn (a still-picture phone: while he is awake), so a passing
  // finger never loads the rig.
  useFinger(focused && rule === "all" && !reduce, (x, y) => { if (!rig.current) return; send({ type: "look", t: Date.now(), x, y }); restart(); });

  // The phone itself, only while his tab is in view: a hard shake throws him (1.5 s apart), a tilt past 8° slides him.
  useEffect(() => {
    if (!focused || rule !== "all" || reduce) return;
    let lastShake = 0, lastG = 0;
    DeviceMotion.setUpdateInterval(50);
    const sub = DeviceMotion.addListener((m) => {
      const now = Date.now(), a = m.acceleration;
      if (a && Math.hypot(a.x, a.y, a.z) > 22 && now - lastShake > 1500) {
        lastShake = now; awakeRef.current = true; setAwake(true);
        send({ type: "phoneShake", t: now }); restart();
      }
      const deg = m.rotation ? (m.rotation.gamma * 180) / Math.PI : 0, g = Math.abs(deg) > 8 ? deg : 0;
      if (Math.abs(g - lastG) > 1 || (g === 0) !== (lastG === 0)) { lastG = g; send({ type: "tilt", t: now, g }); restart(); }
    });
    return () => sub.remove();
  }, [focused, rule, reduce, send, restart]);
  const down = useCallback((x: number, y: number, lx: number, ly: number) => {
    homeFrom(x, y, lx, ly);
    awakeRef.current = true; setAwake(true); pressAt.current = Date.now(); pressMoved.current = 0; last.current = { x, y };
    send({ type: "down", t: Date.now(), x, y }); restart();
  }, [homeFrom, send, restart]);
  const move = useCallback((x: number, y: number) => {
    pressMoved.current += Math.hypot(x - last.current.x, y - last.current.y); last.current = { x, y };
    send({ type: "move", t: Date.now(), x, y });
  }, [send]);
  const up = useCallback((x: number, y: number, cancel: boolean) => {
    const tapped = !cancel && Date.now() - pressAt.current < 300 && pressMoved.current < 12;
    send({ type: "up", t: Date.now(), x, y, cancel }); restart();
    if (tapped) onTap?.();   // in a lesson a single tap also opens Dombi's help
  }, [send, restart, onTap]);
  // RNGH registers these callbacks now and invokes them only for later touch
  // events. The compiler's refs rule incorrectly treats registration as a call.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => { lifted.current = false; down(e.absoluteX, e.absoluteY, e.x, e.y); })
    .onTouchesUp(() => { lifted.current = true; })
    .onUpdate((e) => move(e.absoluteX, e.absoluteY))
    .onFinalize((e) => up(e.absoluteX, e.absoluteY, !lifted.current)), [down, move, up]);
  // A second finger beside him (within 120 points) pinches: he stretches like gum and snaps back on release.
  // Screen events (a word fed to him, a high-five): they wake a still-picture phone's rig like a touch does.
  useEffect(() => {
    if (!eventsRef) return;
    eventsRef.current = (type) => { awakeRef.current = true; setAwake(true); send({ type, t: Date.now() }); restart(); };
    return () => { eventsRef.current = null; };
  }, [eventsRef, send, restart]);
  const pinchTo = useCallback((d: number | null, first = false) => {
    const t = Date.now(); send(d === null ? { type: "pinchEnd", t } : { type: "pinch", t, d }); if (first || d === null) restart();
  }, [send, restart]);
  const pinch = useMemo(() => Gesture.Pinch()
    .runOnJS(true)
    .hitSlop(120)
    .onStart(() => pinchTo(100, true))
    .onUpdate((e) => pinchTo(100 * e.scale))
    .onFinalize(() => pinchTo(null)), [pinchTo]);
  const gesture = useMemo(() => Gesture.Simultaneous(pan, pinch), [pan, pinch]);
  /* eslint-enable react-hooks/refs */

  if (reduce) {
    return (
      <Pressable disabled={!onTap} onPress={onTap} accessibilityRole={onTap ? "button" : undefined} accessibilityLabel="Dombi">
        <Dombi moment={moment} size={size} />
      </Pressable>
    );
  }
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View onLayout={(e) => { boxSize.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }} style={style} accessible accessibilityRole="button" accessibilityLabel="Dombi" onAccessibilityTap={onTap} accessibilityActions={onTap ? [{ name: "activate" }] : undefined} onAccessibilityAction={onTap ? () => onTap() : undefined}>
        <Dombi moment={asleep ? "night" : moment} size={size} awake={awake} rigRef={rig} />
      </Animated.View>
    </GestureDetector>
  );
}
