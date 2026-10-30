import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useState } from "react";
import { View } from "react-native";
import { judge } from "../../../core/text.js";
import { Actor } from "../components/Actor";
import {
Button,
LinkButton,
Page,
Title,
Txt,
useTheme,
} from "../components/ui";
import { play } from "../lib/audio";
import { useBack } from "../lib/navigation";
import { useApp } from "../lib/store";
import { useSpeech } from "../lib/useSpeech";
export default function SpeechTest() {
  const back = useBack("/settings");
  const { settings } = useApp(),
    speech = useSpeech(),
    c = useTheme(),
    [log, setLog] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fallback: boolean) => {
    setBusy(true);
    try {
      await play("aziz", "A coffee, please.", settings.cast);
      const began = performance.now();
      const result = await speech.listen(fallback);
      setLog(
        `Available: ${ExpoSpeechRecognitionModule.isRecognitionAvailable()}\nHeard: ${result.alts.join(" / ")}\nRight: ${judge("A coffee, please.", result.alts[0] || "").right}\nDuration: ${result.ms} ms\nRound trip: ${Math.round(performance.now() - began)} ms\nError: ${result.error || "none"}`,
      );
    } catch (e) {
      setLog(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <LinkButton label="‹ ORTGA" onPress={() => back()} />
      <Title>Tinglash va gapirish</Title>
      <View
        style={{
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          gap: 15,
        }}
      >
        <Actor size={190} />
        <Txt style={{ fontSize: 27 }}>A coffee, please.</Txt>
        <Txt style={{ color: c.muted }}>
          {speech.transcript || (speech.listening ? "ESHITYAPMAN…" : "")}
        </Txt>
        <Txt style={{ fontSize: 12 }}>{log}</Txt>
      </View>
      {speech.listening ? (
        <Button
          label="TO'XTATISH"
          onPress={() => {
            void speech.stop();
          }}
        />
      ) : (
        <>
          <Button
            label="TINGLANG VA AYTING"
            disabled={busy}
            onPress={() => {
              void run(false);
            }}
          />
          <Button
            label="WHISPER"
            kind="secondary"
            disabled={busy}
            onPress={() => {
              void run(true);
            }}
          />
        </>
      )}
    </Page>
  );
}
