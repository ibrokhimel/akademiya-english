import type { ReactNode } from "react";
import { KeyboardAvoidingView,Platform,ScrollView,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBack } from "../../lib/navigation";
import { ScreenHeader } from "../SettingsControls";
import { Button,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";

/**
 * One editor page: back chevron + title, a scrolling body, and the SAQLASH button below it.
 * The page keeps its edits in a local draft; `onSave` writes it, then the page goes back.
 * Going back any other way drops the draft.
 */
export function EditorScreen({ title, onSave, children, saveLabel = "SAQLASH", canSave = true, scrollEnabled = true }: {
  title: string;
  onSave: () => void;
  children: ReactNode;
  saveLabel?: string;
  canSave?: boolean;
  /** off while a row is dragged, so the page holds still */
  scrollEnabled?: boolean;
}) {
  const d = useDesignScale(), c = useTheme();
  const back = useBack("/customize");
  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={title} onBack={back} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(4), paddingBottom: d(16), gap: d(12) }}
        >
          {children}
        </ScrollView>
        <View style={{ paddingHorizontal: d(20), paddingTop: d(8), paddingBottom: d(12) }}>
          <Button label={saveLabel} disabled={!canSave} onPress={() => { onSave(); back(); }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
