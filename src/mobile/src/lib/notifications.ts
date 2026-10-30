import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { progressOf } from "../../../core/progress.js";
import { lessons,P,units } from "../data/content";
import { reminderCopy } from "../data/reminderCopy";
import { reminderPlan } from "./reminderPlan";
import { read } from "./storage";
import type { Event,Resume,Settings } from "./store";
export { validTime } from "./reminderPlan";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});
async function channel() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("practice", {
    name: "Ingliz tili", importance: Notifications.AndroidImportance.DEFAULT,
  });
}
export async function notificationPermission() {
  await channel();
  const current = await Notifications.getPermissionsAsync();
  return current.granted || (await Notifications.requestPermissionsAsync()).granted;
}
// All scheduling passes share a queue so an older pass cannot win a race.
let queue: Promise<void> = Promise.resolve();
let restoredThisProcess = false;
export function reminders(settings: Settings, events: Event[]) {
  const next = queue.catch(() => {}).then(() => reconcile(settings, events));
  queue = next;
  return next;
}
async function reconcile(settings: Settings, events: Event[]) {
  await channel();
  const granted = (await Notifications.getPermissionsAsync()).granted;
  const progress = progressOf(units, events), resume = read<Resume | null>("resume", null);
  const learned = units.flatMap(u => u.lessons).filter(l => Object.hasOwn(progress.done, l.id)).flatMap(l => l.new || []).map(id => P[id]?.uz).filter(Boolean);
  const plan = granted && settings.onboarded ? reminderPlan({
    time: settings.reminder, now: new Date(), days: Platform.OS === "android" ? 365 : 60,
    completed: events.filter(e => e.type === "lesson").map(e => e.at), copies: reminderCopy, learned,
    resume: resume && lessons.some(l => l.id === resume.id) ? resume.id : undefined,
    checkpoint: progress.current?.startsWith("c") ? progress.current : undefined, streak: progress.streak.count,
  }) : [];
  const desired = new Map(plan.map(item => [item.identifier, item]));
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const current = new Map(existing.map(item => [item.identifier, item]));
  for (const item of existing)
    if (item.identifier.startsWith("practice-") && !desired.has(item.identifier))
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
  for (const item of plan) {
    const signature = `${item.at.toISOString()}|${item.body}|${item.url}`;
    // Android force-stop clears AlarmManager entries while Expo's persisted
    // requests survive. Re-arm them once after every cold process start.
    if (restoredThisProcess && current.get(item.identifier)?.content.data?.signature === signature) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: { title: "Dombi · Akademiya English", body: item.body, data: { url: item.url, signature }, sound: "default" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.at, channelId: "practice" },
    });
  }
  if (plan.length) restoredThisProcess = true;
}
