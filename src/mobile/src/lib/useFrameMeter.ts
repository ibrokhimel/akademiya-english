import { useEffect,useState } from "react";

export type FrameStats = {
  /** Frames the JS thread produced in the last second. */
  fps: number;
  /** Longest gap between two frames in the last second, in ms. */
  worstMs: number;
};

/** Measures the JS thread's frame rate, reported once a second. */
export function useFrameMeter(enabled = true): FrameStats {
  const [stats, setStats] = useState<FrameStats>({ fps: 0, worstMs: 0 });

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;

    const tick = (now: number) => {
      frames += 1;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - windowStart >= 1000) {
        setStats({
          fps: Math.round((frames * 1000) / (now - windowStart)),
          worstMs: Math.round(worst),
        });
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return stats;
}
