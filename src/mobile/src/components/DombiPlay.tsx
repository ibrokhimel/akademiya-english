import { useIsFocused } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from "react-native-reanimated";
import { touchReducer, touchStart } from "../../../core/touch.js";
import type { Rig } from "./Actor";
import { Dombi, type DombiMoment } from "./Dombi";

type Effect = { fire?: string; play?: string; mood?: string; haptic?: number | number[] };
type Rule = "all" | "nocarry";

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
 * Reduce Motion: no touch play; a tap still does onTap.
 */
export function DombiPlay({ moment, size, rule = "all", onTap }: { moment: DombiMoment; size: number; rule?: Rule; onTap?: () => void }) {
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
  const dx = useSharedValue(0), dy = useSharedValue(0), rot = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }, { translateY: dy.value }, { rotate: `${rot.value}deg` }] }));

  const env = useCallback(() => {
    const h = home.current ?? { x: width - 56, y: height - 120 };
    return { w: width, h: height, homeX: h.x, floorY: h.y };
  }, [width, height]);

  const apply = useCallback((effects: Effect[]) => {
    const now = Date.now();
    const queue = [...pending.current.filter((p) => now - p.at < 1000), ...effects.map((e) => ({ e, at: now }))];
    pending.current = [];
    for (const { e, at } of queue) {
      if (e.haptic !== undefined) { if (at === now) buzz(e.haptic); continue; }
      const r = rig.current;
      if (!r) { if (awakeRef.current) pending.current.push({ e, at }); continue; }   // still-picture phone: the rig is mounting
      if (e.fire) r.fire(e.fire); else if (e.play !== undefined) r.play(e.play); else if (e.mood) r.mood(e.mood);
    }
  }, []);

  const draw = useCallback(() => {
    const s = current(), e = env(), b = s.body;
    if (b.x === null || b.y === null) return;
    dx.set(b.x - e.homeX); dy.set(b.y - e.floorY); rot.set(b.rot);
    const r = rig.current; if (!r) return;
    const held = s.mode === "held";
    r.num("swing", held ? b.swing : 0); r.num("squish", held ? b.squish : 0);
    r.bool("looking", held);
    r.num("lookX", held ? Math.max(-100, Math.min(100, b.vx / 6)) : 0); r.num("lookY", held ? Math.max(-100, Math.min(100, b.vy / 6)) : 0);
  }, [env, dx, dy, rot]);

  const send = useCallback((ev: { type: "down" | "move" | "up" | "tick"; t: number; x?: number; y?: number; dt?: number; cancel?: boolean }) => {
    const r = touchReducer(current(), { ...ev, rule, env: env() });
    state.current = r.state; apply(r.effects as Effect[]); draw();
    const sleeping = r.state.mode === "asleep";
    if (sleeping !== asleepRef.current) { asleepRef.current = sleeping; setAsleep(sleeping); }
  }, [rule, env, apply, draw]);

  // Leaving the screen sends him home, calm (a throw or a walk never plays out unseen), and coming back starts his
  // 22 s nap count afresh: the count runs only while his screen is in view.
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) return;
    state.current = touchStart(Date.now()); pending.current = [];
    dx.set(0); dy.set(0); rot.set(0);
    rig.current?.play("none"); rig.current?.mood("smirk");
    if (asleepRef.current) { asleepRef.current = false; setAsleep(false); }
    return () => { state.current = touchStart(Date.now()); };
  }, [focused, dx, dy, rot]);

  // Frames run only while something moves or a press is pending; otherwise one timer waits for his 22 s nap.
  const schedule = useRef<() => void>(() => {});
  useEffect(() => {
    if (!focused) { schedule.current = () => {}; return; }
    const L = loop.current;
    // Keep ticking while effects wait for the rig, so they play as soon as it mounts.
    const busy = () => { const s = current(); return !!s.press || !["idle", "asleep"].includes(s.mode) || Object.keys(s.at).length > 0 || pending.current.length > 0; };
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
      if (s.mode === "idle") L.timer = setTimeout(() => { L.timer = null; send({ type: "tick", t: Date.now(), dt: 0.016 }); schedule.current(); }, Math.max(50, s.lastAct + 22050 - Date.now()));
    };
    schedule.current();
    return () => { cancelAnimationFrame(L.raf); if (L.timer) clearTimeout(L.timer); L.raf = 0; L.timer = null; };
  }, [send, focused]);

  // On a still-picture phone the rig is only mounted while he plays; he goes back to the picture 2 s after settling.
  useEffect(() => {
    if (!awake) return;
    const check = setInterval(() => {
      const s = current();
      if (!s.press && ["idle", "asleep"].includes(s.mode) && Date.now() - s.lastAct > 2000) { awakeRef.current = false; pending.current = []; setAwake(false); }
    }, 500);
    return () => clearInterval(check);
  }, [awake]);

  // His home spot comes from a touch that lands on him while he sits there: the finger's screen point minus its point inside him.
  // (Measuring the view on layout read the tab mid-slide, up to a screen width off, so he was drawn away from the finger.)
  const homeFrom = useCallback((x: number, y: number, lx: number, ly: number) => {
    const s = current(), { w, h } = boxSize.current;
    if (!w || !["idle", "asleep"].includes(s.mode) || Math.abs(dx.get()) > 0.5 || Math.abs(dy.get()) > 0.5) return;
    home.current = { x: x - lx + w / 2, y: y - ly + h };
    state.current = { ...s, body: { ...s.body, x: home.current.x, y: home.current.y } };
  }, [dx, dy]);

  const pressAt = useRef(0), pressMoved = useRef(0), last = useRef({ x: 0, y: 0 }), lifted = useRef(false);
  const restart = useCallback(() => { const L = loop.current; if (L.timer) { clearTimeout(L.timer); L.timer = null; } schedule.current(); }, []);
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
  /* eslint-enable react-hooks/refs */

  if (reduce) {
    return (
      <Pressable disabled={!onTap} onPress={onTap} accessibilityRole={onTap ? "button" : undefined} accessibilityLabel="Dombi">
        <Dombi moment={moment} size={size} />
      </Pressable>
    );
  }
  return (
    <GestureDetector gesture={pan}>
      <Animated.View onLayout={(e) => { boxSize.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }} style={style} accessible accessibilityRole="button" accessibilityLabel="Dombi" onAccessibilityTap={onTap} accessibilityActions={onTap ? [{ name: "activate" }] : undefined} onAccessibilityAction={onTap ? () => onTap() : undefined}>
        <Dombi moment={asleep ? "night" : moment} size={size} awake={awake} rigRef={rig} />
      </Animated.View>
    </GestureDetector>
  );
}
