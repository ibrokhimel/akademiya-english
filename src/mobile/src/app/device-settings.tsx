import { router } from "expo-router";
import { useState } from "react";
import { TextInput } from "react-native";
import { ScreenHeader,SettingGroup,SettingRow } from "../components/SettingsControls";
import { LinkButton,Page,s,Txt,useTheme,violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { pb,sync } from "../lib/backend";
import { useBack } from "../lib/navigation";
import { read } from "../lib/storage";
import { useApp,type Event } from "../lib/store";
export default function DeviceSettings() {
 const d=useDesignScale(), app=useApp(), {settings,set}=app, c=useTheme(), back=useBack("/settings");
 const [server,setServer]=useState(settings.server), [speechServer,setSpeechServer]=useState(settings.speechServer), [message,setMessage]=useState("");
 return <Page scroll><ScreenHeader title="Qurilma sozlamalari" onBack={back} />
        <SettingGroup><SettingRow icon="glyph-sparkles-grey" label="Dombi" onPress={() => router.navigate("/test-a")} /><SettingRow icon="glyph-mic-grey" label="Tinglash va gapirish" onPress={() => router.navigate("/speech-test")} /><SettingRow icon="glyph-message-grey" label="Fikr bildirish" onPress={() => router.navigate("/feedback")} /></SettingGroup>
        <Txt style={{ fontSize: d(12), color: c.muted }}>PocketBase</Txt>
        <TextInput accessibilityLabel="PocketBase server" autoCapitalize="none" autoCorrect={false} value={server} onChangeText={setServer} style={[
            s.input,
            { color: c.text, borderColor: c.line, fontSize: d(13) },
        ]}/>
        <Txt style={{ fontSize: d(12), color: c.muted }}>Whisper</Txt>
        <TextInput accessibilityLabel="Whisper server" autoCapitalize="none" autoCorrect={false} value={speechServer} onChangeText={setSpeechServer} style={[
            s.input,
            { color: c.text, borderColor: c.line, fontSize: d(13) },
        ]}/>
        <LinkButton label="SAQLASH" onPress={() => {
            if (!/^https?:\/\//.test(server) ||
                !/^https?:\/\//.test(speechServer))
                return;
            set({
                server: server.replace(/\/$/, ""),
                speechServer: speechServer.replace(/\/$/, ""),
            });
            pb.baseURL = server.replace(/\/$/, "");
            setMessage("Saqlandi");
        }}/>
        <LinkButton label="NATIJALARNI SAQLASH" onPress={() => {
            setMessage("Kutilmoqda…");
            const owner = pb.authStore.record?.id;
            void sync()
                .then((result) => {
                if (pb.authStore.record?.id !== owner)
                    return;
                app.replaceEvents(read<Event[]>("events", []));
                for (const record of result.recordings)
                    app.saveRecording(record);
                setMessage(pb.authStore.isValid ? "Saqlandi" : "Hisobga kiring");
            })
                .catch(() => setMessage("Serverga ulanib bo'lmadi"));
        }}/>
        {message ? (<Txt style={{ color: violet, textAlign: "center" }}>{message}</Txt>) : null}
</Page>;
}
