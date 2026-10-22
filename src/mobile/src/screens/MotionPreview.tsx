// Read-only previews for the existing test-a developer route. Never writes progress.
import { router,useFocusEffect } from "expo-router";
import { useCallback,useEffect,useState } from "react";
import { Actor } from "../components/Actor";
import { Exercise,type Answer } from "../components/Exercise";
import { LessonMoment,type MomentPhase } from "../components/LessonMoment";
import { ScreenTransition } from "../components/ScreenTransition";
import { Button,LinkButton,Page,Txt } from "../components/ui";
import { lessons } from "../data/content";
import { audioDiagnostics,playDombi,sound,stopAudio } from "../lib/audio";
import { useApp } from "../lib/store";

export function MotionPreview({ preview }: { preview: string }) {
  const { settings } = useApp();
  const [result, setResult] = useState<Answer | null>(null),
    [attempt, setAttempt] = useState(0);
  const moment = [
    "mistakes",
    "canSay",
    "result",
    "checkpoint",
    "streak",
    "level",
  ].includes(preview);
  const lesson =
    preview === "checkpoint" ? lessons.find((l) => l.checkpoint)! : lessons[0];
  const item =
    lessons.flatMap((l) => l.items).find((i) => i.ex === preview) ||
    lesson.items[0];
  useFocusEffect(
    useCallback(() => {
      const name: Record<string, string> = {
        mistakes: "mistakes",
        canSay: "new-phrase",
        result: "perfect",
        checkpoint: "trophy",
        streak: "streak",
        level: "level-up",
      };
      if (moment) sound(name[preview], settings.sound);
      return stopAudio;
    }, [preview, settings.sound, moment]),
  );
  if (preview === "audio") return <AudioPreview />;
  if (moment)
    return (
      <LessonMoment
        key={preview}
        phase={(preview === "checkpoint" ? "result" : preview) as MomentPhase}
        lesson={lesson}
        stats={{ accuracy: 100, perfect: true, left: 3 }}
        spokenMs={83000}
        streak={7}
        onContinue={() => router.back()}
      />
    );
  return (
    <Page style={{ padding: 0 }}>
      <LinkButton label="ORTGA" onPress={() => router.back()} />
      <ScreenTransition transitionKey={attempt}>
        <Exercise
          key={attempt}
          item={item}
          index={0}
          lesson={lesson}
          speaking={false}
          paused={false}
          checked={!!result}
          onSpoken={() => {}} onSpeechRetry={() => {}}
          onSpeakingOff={() => {}}
          onAnswer={(answer) => {
            setResult(answer);
            sound(answer.right ? "right" : "not-right", settings.sound);
          }}
        />
      </ScreenTransition>
      {result ? (
        <>
          <Txt style={{ textAlign: "center" }}>
            {result.right ? "Zo'r!" : result.answer}
          </Txt>
          <Button
            label="YANA URINISH"
            onPress={() => {
              setResult(null);
              setAttempt((n) => n + 1);
            }}
          />
        </>
      ) : null}
    </Page>
  );
}
function AudioPreview() {
  const { settings } = useApp();
  const [diagnostics, setDiagnostics] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      setDiagnostics(JSON.stringify(audioDiagnostics()));
    }, 300);
    return () => {
      clearInterval(timer);
      stopAudio();
    };
  }, []);
  return (
    <Page scroll>
      <Actor size={100} />
      {["button", "tick", "right", "perfect", "trophy", "level-up"].map(
        (name) => (
          <Button
            key={name}
            label={name}
            onPress={() => sound(name, settings.sound)}
          />
        ),
      )}
      <Button
        label="Dombi"
        onPress={() => {
          void playDombi("Salom! Men Dombiman.", settings.sound);
        }}
      />
      <Txt style={{ fontSize: 9 }} testID="audio-diagnostics">
        {diagnostics}
      </Txt>
    </Page>
  );
}
