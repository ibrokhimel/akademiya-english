import { Tabs } from "expo-router/js-tabs";
import { useReducedMotion } from "react-native-reanimated";
import { AppTabBar } from "../../components/AppTabBar";
import { DombiWatch } from "../../components/DombiWatch";
import { springs } from "../../components/system";
import { useTheme } from "../../components/ui";
import { sound } from "../../lib/audio";
import { useApp } from "../../lib/store";

export default function TabLayout() {
  const { settings } = useApp();
  const reduced = useReducedMotion();
  const c = useTheme();
  return (
    <DombiWatch>
    <Tabs
      initialRouteName="index"
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        animation: reduced ? "fade" : "shift",
        // The page pushes sideways on the same gentle spring as the tab bar's square.
        transitionSpec: {
          animation: "spring",
          config: { stiffness: springs.gentle.stiffness, damping: springs.gentle.damping, mass: springs.gentle.mass },
        },
        sceneStyle: { backgroundColor: c.bg },
      }}
      tabBar={({ state, navigation }) => <AppTabBar selected={state.index} onPress={i => {
        const route = state.routes[i];
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
        if (!event.defaultPrevented) {
          if (state.index !== i) sound("tab", settings.sound);
          navigation.navigate(route.name);
        }
      }} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="speak" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="profile" />
    </Tabs>
    </DombiWatch>
  );
}
