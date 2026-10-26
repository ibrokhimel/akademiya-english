import { router } from "expo-router";
import { useState } from "react";
import { practiceItems } from "../../../core/practice.js";
import { ActivityEnd } from "../components/ActivityEnd";
import { ProblemContent } from "../components/ProblemContent";
import { units, type Item, type Lesson } from "../data/content";
import { goHome } from "../lib/navigation";
import { useApp } from "../lib/store";
import { Player, type Stats } from "./LessonScreen";

export type ActivityKind = "catch" | "overheard" | "fixit";
const KINDS: string[] = ["catch", "overheard", "fixit"];
export const toPractice = () => { if (router.canGoBack()) router.back(); else router.replace("/practice"); };

// Catch the sentence (C1–C5), Overheard (O1–O4) and Fix it (X1–X6): the lesson player on items from finished lessons.
// Nothing is saved: no resume, no lesson event, so the streak is untouched.
export default function ActivityScreen({ kind }: { kind: ActivityKind }) {
  const { progress } = useApp();
  const [lesson] = useState<Lesson>(() => ({ id: `practice-${kind}`, title: "", unit: 0, items: (KINDS.includes(kind) ? practiceItems(kind, units, progress.done) : []) as Item[] }));
  const [end, setEnd] = useState<Stats | null>(null);
  if (!lesson.items.length) return <ProblemContent kind="not-found" onChoice={toPractice} onHome={goHome} onReport={() => router.navigate("/feedback")} />;
  if (end) return <ActivityEnd of={lesson.items.length - end.skipped} right={end.correct} onDone={toPractice} />;
  const n = lesson.items.length;
  return <Player lesson={lesson} onExit={toPractice} activity={{
    leaveText: (s) => kind === "catch" ? `${n} tadan ${s.answered} tasi qildingiz. Natija saqlanmaydi.` : "Bu mashq saqlanmaydi. Keyin boshidan boshlaysiz.",
    onFinish: setEnd,
  }} />;
}
