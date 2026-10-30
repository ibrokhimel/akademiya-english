import { createContext,useContext,useEffect,useId,useRef,type ReactNode,type RefObject } from "react";
import { ScrollView,StyleSheet,Text,useWindowDimensions,View,type LayoutChangeEvent,type PressableProps,type TextProps } from "react-native";
import { getVisualAudit } from "../lib/visualAudit";

type Capture = { record: (id: string, entry: unknown) => void };
export const CaptureContext = createContext<Capture | null>(null);
export function useAuditScroll(ref: RefObject<ScrollView | null>, scale?: number) {
  const config = getVisualAudit();
  const { width } = useWindowDimensions();
  const factor = scale ?? Math.min(width / 390, 1.2);
  useEffect(() => {
    if (!config?.scroll) return;
    const timer = setTimeout(() => {
      if (config.scroll === "bottom") ref.current?.scrollToEnd({ animated: false });
      else ref.current?.scrollTo({ y: 400 * factor, animated: false });
    }, 500);
    return () => clearTimeout(timer);
  }, [config, ref, factor]);
}
export function createLayoutCapture(id: string, dark: boolean) {
  const entries = new Map<string, unknown>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    record(key: string, entry: unknown) {
      entries.set(key, entry);
      clearTimeout(timer);
      timer = setTimeout(() => {
        void fetch("http://127.0.0.1:8792/layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, dark, entries: [...entries.values()] }) }).catch(() => {});
      }, 400);
    },
  };
}
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}
export function useAuditText(props: TextProps) {
  const capture = useContext(CaptureContext);
  const id = useId();
  const ref = useRef<Text>(null);
  if (!capture) return {};
  return {
    ref,
    onLayout(event: LayoutChangeEvent) {
      props.onLayout?.(event);
      // Safe-area layout and route placement can move an unchanged-size child
      // after its first onLayout. Measure after both have settled.
      setTimeout(() => ref.current?.measureInWindow((x, y, width, height) => capture.record(id, { x, y, width, height, text: textOf(props.children), style: StyleSheet.flatten(props.style) || {} })), 900);
    },
  };
}
export function useAuditBox(props: PressableProps, style: object) {
  const capture = useContext(CaptureContext);
  const id = useId();
  const ref = useRef<View>(null);
  if (!capture) return {};
  return {
    ref,
    onLayout(event: LayoutChangeEvent) {
      props.onLayout?.(event);
      setTimeout(() => ref.current?.measureInWindow((x, y, width, height) => capture.record(id, { kind: "button", id: props.testID, text: props.accessibilityLabel || "", disabled: !!props.disabled, x, y, width, height, style })), 900);
    },
  };
}
