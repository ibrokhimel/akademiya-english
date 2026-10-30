import { Children, Fragment, isValidElement, useCallback, useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View, type FlexStyle, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

export type Rect = { x: number; y: number; w: number; h: number };
/** What an exercise shows, in its own coordinates: the scroll view's box and every block on screen inside it. */
export type Space = { view: Rect; blocks: Rect[] };

/**
 * Measures an exercise's blocks so Dombi can sit where nothing is (owner, 2026-10-27).
 * `blocks(children)` puts each top-level block in a measured box; fragments are opened up, so the scroll view's
 * gaps stay as they were. A block's own alignSelf, percentage width and marginTop "auto" move to its box, so a centred row measures
 * only as wide as what it shows.
 */
export function useSpace(onSpace?: (space: Space) => void) {
  const rects = useRef(new Map<string, Rect>()), view = useRef<Rect | null>(null), scrollY = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), report = useRef(onSpace);
  useEffect(() => { report.current = onSpace; }, [onSpace]);
  const changed = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const v = view.current; if (!v || !report.current) return;
      report.current({ view: v, blocks: [...rects.current.values()].map((r) => ({ ...r, x: r.x + v.x, y: r.y + v.y - scrollY.current })) });
    }, 120);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onBlock = useCallback((id: string, r: Rect | null) => { if (r) rects.current.set(id, r); else rects.current.delete(id); changed(); }, [changed]);
  const scrollProps = {
    onLayout: (e: LayoutChangeEvent) => { const { x, y, width, height } = e.nativeEvent.layout; view.current = { x, y, w: width, h: height }; changed(); },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { scrollY.current = e.nativeEvent.contentOffset.y; changed(); },
    scrollEventThrottle: 64,
  };
  const blocks = (children: ReactNode) => <>{measured(children, onBlock, "")}</>;
  return { scrollProps, blocks };
}

function measured(children: ReactNode, onBlock: (id: string, r: Rect | null) => void, prefix: string): ReactNode[] {
  return Children.toArray(children).flatMap((child): ReactNode[] => {
    if (!isValidElement(child)) return [child];
    const id = prefix + String(child.key);
    const props = child.props as { children?: ReactNode; style?: unknown };
    if (child.type === Fragment) return measured(props.children, onBlock, id + "/");
    const style = (StyleSheet.flatten(props.style as never) ?? {}) as FlexStyle;
    const width = typeof style.width === "string" ? style.width : undefined;
    return [<Block key={id} id={id} onBlock={onBlock} alignSelf={style.alignSelf} width={width} auto={style.marginTop === "auto"}>{child}</Block>];
  });
}

function Block({ id, onBlock, alignSelf, width, auto, children }: { id: string; onBlock: (id: string, r: Rect | null) => void; alignSelf?: FlexStyle["alignSelf"]; width?: FlexStyle["width"]; auto: boolean; children: ReactNode }) {
  useEffect(() => () => onBlock(id, null), [id, onBlock]);
  return (
    <View style={{ alignSelf, width, marginTop: auto ? "auto" : undefined }} onLayout={(e) => { const { x, y, width, height } = e.nativeEvent.layout; onBlock(id, { x, y, w: width, h: height }); }}>
      {children}
    </View>
  );
}
