import type { ParamListBase,StackNavigationState } from "expo-router/react-navigation";

// Supply the same parents for a cold deep link as for a normal tap through the app.
const parents: Record<string, string> = { privacy: "settings", "speech-settings": "settings", recordings: "settings", "device-settings": "settings", "practice/[id]": "phrases", "speech-test": "settings", "test-a": "settings" };
export function withNavigationParents(state: StackNavigationState<ParamListBase>) {
  if (!state.routeNames.includes("(tabs)")) return state;
  const focused = state.routes[state.index].key;
  let source = state.routes;
  const lastHome = source.findLastIndex(route => route.name === "(tabs)");
  if (lastHome > 0) source = source.slice(lastHome);
  const mainRoute = !["index", "onboarding"].includes(state.routes[state.index].name);
  if (mainRoute) source = source.filter(route => !["index", "onboarding"].includes(route.name));
  const routes: typeof state.routes = [];
  if (mainRoute && !source.some(route => route.name === "(tabs)")) routes.push({ key: `${state.key}-home`, name: "(tabs)" });
  for (const route of source) {
    const parent = parents[route.name];
    if (parent && state.routeNames.includes(parent) && !routes.some(entry => entry.name === parent)) routes.push({ key: `${route.key}-parent-${parent}`, name: parent });
    routes.push(route);
  }
  const destination = state.routes[state.index].name;
  const tab = destination === "activity/[kind]" ? "practice" : ["settings", "recordings", "device-settings", "account", "feedback", "test-a", "speech-test"].includes(destination)
    || ["phrases", "practice/[id]", "calendar"].includes(destination) ? "profile" : null;
  // An anchor has no mounted child navigator yet on a cold link. Supply its
  // selected tab explicitly instead of relying on the child's scoped pathname.
  const homeIndex = routes.findIndex(route => route.name === "(tabs)");
  if (tab && homeIndex >= 0 && !routes[homeIndex].state) {
    routes[homeIndex] = { ...routes[homeIndex], state: { stale: true, index: 0, routes: [{ name: tab }] } };
  }
  if (routes.length === state.routes.length && routes.every((route, index) => route === state.routes[index])) return state;
  return { ...state, routes, index: Math.max(0, routes.findIndex(route => route.key === focused)) };
}
