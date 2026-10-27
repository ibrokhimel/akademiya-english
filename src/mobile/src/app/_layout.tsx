import {
Nunito_700Bold,
Nunito_800ExtraBold,
Nunito_900Black,
useFonts,
} from "@expo-google-fonts/nunito";
import * as Notifications from "expo-notifications";
import { router,useSegments } from "expo-router";
import { CardStyleInterpolators,Stack } from "expo-router/js-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect,useEffectEvent,useRef,useState } from "react";
import { AppState,Easing } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReducedMotion } from "react-native-reanimated";
import { Actors } from "../components/Actor";
import { ProblemContent } from "../components/ProblemContent";
import { lessons } from "../data/content";
import { stopEffects,warmSounds } from "../lib/audio";
import { pb,sync } from "../lib/backend";
import { cloudEnabled,testToolsEnabled } from "../lib/config";
import { navigationRouter } from "../lib/navigation";
import { reminders } from "../lib/notifications";
import { reminderDestination } from "../lib/reminderPlan";
import { read } from "../lib/storage";
import type { Event,Recording } from "../lib/store";
import { AppProvider,useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";

void SplashScreen.preventAutoHideAsync();
export const unstable_settings = { anchor: "(tabs)" };
export function ErrorBoundary({ retry }: import("expo-router").ErrorBoundaryProps) {
  return <AppProvider><Actors><ProblemContent kind="error" onChoice={() => { void retry(); }} onHome={() => { void retry(); router.replace("/(tabs)"); }} onReport={() => { void retry(); setTimeout(() => router.navigate("/feedback"), 100); }} /></Actors></AppProvider>;
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Actors>
          <Navigation />
        </Actors>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
function Navigation() {
  const { settings } = useApp();
  const segments = useSegments();
  const reduced = useReducedMotion();
  return (
    <>
      {segments[0] !== "visual-audit" && !getVisualAudit() ? <Services /> : null}
      <StatusBar style={settings.dark ? "light" : "dark"} />
      <Stack
        UNSTABLE_router={navigationRouter}
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: settings.dark ? "#121214" : "#FFFFFF",
          },
          animation: reduced ? "fade" : "slide_from_right",
          animationTypeForReplace: "push",
          cardStyleInterpolator: reduced ? CardStyleInterpolators.forFadeFromCenter : CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureResponseDistance: 28,
          keyboardHandlingEnabled: true,
          transitionSpec: { open: { animation: "timing", config: { duration: reduced ? 150 : 250, easing: Easing.bezier(0.2, 0, 0, 1) } }, close: { animation: "timing", config: { duration: reduced ? 120 : 200, easing: Easing.bezier(0.2, 0, 0, 1) } } },
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none", gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="account" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="visual-audit" options={{ animation: "none", gestureEnabled: false, cardStyleInterpolator: () => ({ cardStyle: {} }), transitionSpec: { open: { animation: "timing", config: { duration: 0 } }, close: { animation: "timing", config: { duration: 0 } } } }} />
        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="customize/index" />
          <Stack.Screen name="customize/avatar" />
          <Stack.Screen name="speech-settings" />
          <Stack.Protected guard={testToolsEnabled}>
            <Stack.Screen name="device-settings" />
            <Stack.Screen name="test-a" />
            <Stack.Screen name="speech-test" />
          </Stack.Protected>
          <Stack.Screen name="recordings" />
          <Stack.Screen name="phrases" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="feedback" options={{ presentation: "transparentModal", animation: "none", cardStyle: { backgroundColor: "transparent" }, cardStyleInterpolator: () => ({ cardStyle: {} }), gestureEnabled: false }} />
          <Stack.Screen name="problem" options={{ presentation: "transparentModal", cardStyle: { backgroundColor: "transparent" } }} />
          <Stack.Screen name="confidence" />
          <Stack.Screen name="lesson/[id]" />
          <Stack.Screen name="practice/[id]" />
          <Stack.Screen name="activity/[kind]" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
function Services() {
  useEffect(() => warmSounds(["button", "pick", "next", "back", "tab"]), []);
  const app = useApp(),
    [authVersion, setAuthVersion] = useState(0),
    [wake, setWake] = useState(0);
  const openedNotification = useRef("");
  useEffect(() => {
    if (!app.settings.sound) stopEffects();
  }, [app.settings.sound]);
  const eventKey = app.events.map((e) => e.client_id).join(","),
    recordKey = app.recordings.map((r) => r.uri).join(",");
  const schedule = useEffectEvent(() => {
    void reminders(app.settings, read<Event[]>("events", [])).catch(() => {});
  });
  const synchronize = useEffectEvent(async (isActive: () => boolean) => {
    const user = pb.authStore.record?.id;
    if (!cloudEnabled || !user || !app.settings.onboarded) return;
    try {
      await sync();
      if (!isActive() || pb.authStore.record?.id !== user) return;
      const events = read<Event[]>("events", []);
      if (JSON.stringify(events) !== JSON.stringify(app.events))
        app.replaceEvents(events);
      for (const record of read<Recording[]>("recordings", []))
        if (
          !app.recordings.some(
            (r) => r.uri === record.uri && r.synced === record.synced,
          )
        )
          app.saveRecording(record);
    } catch {
      /* Keep the offline event queue for the next connection. */
    }
  });
  useEffect(
    () => pb.authStore.onChange(() => setAuthVersion((n) => n + 1)),
    [],
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setWake((n) => n + 1);
    });
    const interval = setInterval(() => setWake((n) => n + 1), 60000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    schedule();
  }, [app.settings.reminder, app.settings.onboarded, app.resume, eventKey, wake]);
  useEffect(() => {
    let active = true;
    void synchronize(() => active);
    return () => {
      active = false;
    };
  }, [
    authVersion,
    wake,
    eventKey,
    recordKey,
    app.settings.server,
    app.settings.name,
    app.settings.cast,
    app.settings.dark,
    app.settings.sound,
    app.settings.speaking,
    app.settings.saveVoice,
    app.settings.reminder,
  ]);
  useEffect(() => {
    let active = true;
    const open = (response: Notifications.NotificationResponse | null) => {
        if (!active || !response || !app.settings.onboarded) return;
        const id = response.notification.request.identifier;
        if (openedNotification.current === id) return;
        openedNotification.current = id;
        const url = reminderDestination(response.notification.request.content.data?.url, lessons.map(l => l.id));
        if (url.startsWith("/lesson/"))
          router.navigate({
            pathname: "/lesson/[id]",
            params: { id: url.split("/").pop()! },
          });
        else router.navigate("/(tabs)");
        void Notifications.clearLastNotificationResponseAsync();
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    return () => { active = false; sub.remove(); };
  }, [app.settings.onboarded]);
  return null;
}
