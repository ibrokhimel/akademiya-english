import { router,useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { TextInput } from "react-native";
import { Button,LinkButton,Page,s,Title,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { pb,sync } from "../lib/backend";
import { cloudEnabled } from "../lib/config";
import { goHome,useBack } from "../lib/navigation";
import { read,write } from "../lib/storage";
import type { Event,Recording,Settings } from "../lib/store";
import { useApp } from "../lib/store";

export default function Account() {
 const d=useDesignScale(), app=useApp(), c=useTheme();
 const {mode}=useLocalSearchParams<{mode?:string}>();
 const [login,setLogin]=useState(mode === "login"), [name,setName]=useState(app.settings.name);
 const [email,setEmail]=useState(""), [password,setPassword]=useState(""), [busy,setBusy]=useState(false), [error,setError]=useState("");
 const back=useBack(app.settings.onboarded ? "/(tabs)/profile" : "/onboarding");
    const submit = async () => {
        setBusy(true);
        setError("");
        pb.baseURL = app.settings.server;
        try {
            if (!login)
                await pb.collection("users").create({
                    email: email.trim(),
                    password,
                    passwordConfirm: password,
                    name: name.trim(),
                });
            const auth = await pb
                .collection("users")
                .authWithPassword(email.trim(), password);
            const cached = read<{
                settings: Settings;
                events: Event[];
                recordings: Recording[];
                deletedRecordings?: string[];
            } | null>(`profile.${auth.record.id}`, null);
            if (cached) {
                write("deletedRecordings", [
                    ...new Set([
                        ...(cached.deletedRecordings || []),
                        ...read<string[]>("deletedRecordings", []),
                    ]),
                ]);
                const merged = new Map([...cached.events, ...app.events].map((e) => [e.client_id, e]));
                const events = [...merged.values()].sort((a, b) => a.at.localeCompare(b.at));
                app.replaceEvents(events);
                for (const record of cached.recordings)
                    if (!app.recordings.some((r) => r.phraseId === record.phraseId && r.at > record.at))
                        app.saveRecording(record);
            }
            const next = {
                ...app.settings,
                ...(cached?.settings || {}),
                server: app.settings.server,
                speechServer: app.settings.speechServer,
                onboarded: true,
                needAccount: false,
                name: auth.record.name || name || app.settings.name,
                joined: cached?.settings.joined ||
                    app.settings.joined ||
                    new Date().toISOString(),
            };
            write("settings", next);
            app.set(next);
            app.add({ type: "account" });
            try {
                const result = await sync();
                app.replaceEvents(result.events);
                for (const recording of result.recordings)
                    app.saveRecording(recording);
            }
            catch {
                /* Local progress remains usable while the PC is unavailable. */
            }
            goHome();
        }
        catch (e) {
            const status = e && typeof e === "object" && "status" in e ? e.status : 0;
            setError(status === 400
                ? login
                    ? "Bu hisob hali yo'q. Email va parolni tekshiring."
                    : "Email yoki parolni tekshiring. Parol kamida 8 ta belgidan iborat bo'lsin."
                : "Serverga ulanib bo'lmadi. Internetni tekshiring va yana urinib ko'ring.");
        }
        finally {
            setBusy(false);
        }
    };

 if (!cloudEnabled) return <Page scroll>
   <LinkButton label="ORTGA" onPress={back} />
   <Title sub="Ismingiz va natijalaringiz shu telefonda saqlanadi.">Profilingiz</Title>
   <TextInput accessibilityLabel="Ismingiz" placeholder="Ismingiz" maxLength={24} value={name} onChangeText={setName} placeholderTextColor={c.muted} style={[s.input,{color:c.text,borderColor:c.line}]} />
   <Button label="SAQLASH" disabled={!name.trim()} onPress={() => { app.set({name:name.trim(),needAccount:false}); if(app.settings.onboarded) goHome(); else back(); }} />
   <LinkButton label="MAXFIYLIK" onPress={() => router.navigate("/privacy")} />
 </Page>;
 return <Page scroll>
   <LinkButton label="ORTGA" onPress={() => {if(!busy) back();}} />
   <Title sub={login ? "Email va parolingizni kiriting." : "Hisob ixtiyoriy. Natijalaringizni qurilmalar orasida saqlang."}>{login ? "Kirish" : "Hisob yaratish"}</Title>
   {!login ? <TextInput accessibilityLabel="Ismingiz" placeholder="Ismingiz" maxLength={24} value={name} onChangeText={setName} placeholderTextColor={c.muted} style={[s.input,{color:c.text,borderColor:c.line}]} /> : null}
   <TextInput accessibilityLabel="Email" placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} placeholderTextColor={c.muted} style={[s.input,{color:c.text,borderColor:c.line}]} />
   <TextInput accessibilityLabel="Parol" placeholder="Parol" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor={c.muted} style={[s.input,{color:c.text,borderColor:c.line}]} />
   {error ? <Txt accessibilityRole="alert" style={{color:"#D9483A",fontSize:d(14)}}>{error}</Txt> : null}
   <Button label={busy ? "KUTILMOQDA..." : login ? "KIRISH" : "HISOB YARATISH"} disabled={busy || !email.includes("@") || password.length<8 || (!login && !name.trim())} onPress={() => { void submit(); }} />
   <LinkButton label={login ? "HISOB YARATISH" : "KIRISH"} onPress={() => { if(busy) return; setLogin(!login); setError(""); }} />
   <LinkButton label="MAXFIYLIK" onPress={() => router.navigate("/privacy")} />
   <LinkButton label="HOZIR EMAS" onPress={back} />
 </Page>;
}
