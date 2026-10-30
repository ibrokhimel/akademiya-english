import { useCallback } from "react";
import { useWindowDimensions } from "react-native";

// The approved browser screens use a 390-unit canvas.
export function useDesignScale() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2);
  return useCallback((value: number) => value * scale, [scale]);
}
