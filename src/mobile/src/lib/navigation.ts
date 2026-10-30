import { router,useFocusEffect,useNavigation,type Href } from "expo-router";
import type { Stack } from "expo-router/js-stack";
import { useCallback,type ComponentProps } from "react";
import { BackHandler,Keyboard } from "react-native";
import { stopAudio } from "./audio";
import { withNavigationParents } from "./navigationState";

export const navigationRouter: NonNullable<ComponentProps<typeof Stack>["UNSTABLE_router"]> = original => ({
  getRehydratedState: (state, options) => withNavigationParents(original.getRehydratedState(state, options)),
  getStateForAction: (state, action, options) => {
    const routeGetIdList = { ...options.routeGetIdList };
    for (const name of options.routeNames) routeGetIdList[name] = ({ params }) => `${name}/${String(params?.id || "")}`;
    const next = original.getStateForAction(state, action, { ...options, routeGetIdList });
    return next?.stale === false ? withNavigationParents(next) : next;
  },
});

export function useBack(fallback: Href, beforeBack?: () => boolean) {
  const navigation = useNavigation();
  const back = useCallback(() => {
    if (beforeBack?.()) return;
    stopAudio();
    if ((navigation.getState()?.index || 0) > 0) router.back();
    else router.replace(fallback);
  }, [navigation, fallback, beforeBack]);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (Keyboard.isVisible()) Keyboard.dismiss();
      else back();
      return true;
    });
    return () => { listener.remove(); stopAudio(); };
  }, [back]));
  return back;
}
export const goHome = () => { stopAudio(); router.dismissTo("/(tabs)"); };

// A root tab has no page to pop. Give Android Back an explicit Home action.
export function useHomeBack() {
  const navigation = useNavigation();
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (Keyboard.isVisible()) Keyboard.dismiss();
      else {
        stopAudio();
        navigation.dispatch({ type: "NAVIGATE", target: navigation.getState()?.key, payload: { name: "index" } });
      }
      return true;
    });
    return () => listener.remove();
  }, [navigation]));
}
