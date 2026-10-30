import { Redirect } from "expo-router";
import { useApp } from "../lib/store";
export default function Index() {
  const { settings } = useApp();
  return (
    <Redirect
      href={
        !settings.onboarded
          ? "/onboarding"
          : "/(tabs)"
      }
    />
  );
}
