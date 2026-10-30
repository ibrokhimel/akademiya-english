import { ExpoSpeechRecognitionModule as Speech } from "expo-speech-recognition";
import { useEffect,useState } from "react";
import { Linking,View } from "react-native";
import { ScreenHeader } from "../components/SettingsControls";
import { Button,LinkButton,Page,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { useBack } from "../lib/navigation";
import { useApp } from "../lib/store";

export default function SpeechSettings() {
  const d=useDesignScale(), c=useTheme(), back=useBack("/settings"), {settings}=useApp();
  const [installed,setInstalled]=useState<string[]>([]), [checking,setChecking]=useState(true), [busy,setBusy]=useState(false), [message,setMessage]=useState("");
  const lang=settings.cast === "uk" ? "en-GB" : "en-US";
  const available=Speech.isRecognitionAvailable(), onDevice=Speech.supportsOnDeviceRecognition();
  useEffect(() => {
    let active=true;
    const timeout=setTimeout(() => { if(active) setChecking(false); },3500);
    if(available) void Speech.getSupportedLocales({}).then(result => { if(active) setInstalled(result.installedLocales); }).catch(() => {}).finally(() => { if(active) setChecking(false); });
    return () => { active=false; clearTimeout(timeout); };
  },[available]);
  const downloaded=installed.some(value => value.toLowerCase() === lang.toLowerCase());
  const download=async () => {
    setBusy(true); setMessage("");
    try {
      const result=await Speech.androidTriggerOfflineModelDownload({locale:lang});
      if(result.status === "download_success") { setInstalled(current => [...current,lang]); setMessage("Inglizcha nutq modeli tayyor."); }
      else setMessage("Android yuklab olishni boshladi yoki navbatga qo'ydi. Tugagach, bu oynani qayta oching.");
    } catch { setMessage("Android bu modelni yuklay olmadi. Nutq xizmati sozlamalarini tekshiring yoki hozircha so'zlarni tanlab mashq qiling."); }
    finally { setBusy(false); }
  };
  return <Page scroll>
    <ScreenHeader title="Nutqni tanish" onBack={back} />
    <View style={{gap:d(16),paddingVertical:d(12)}}>
      <Txt style={{fontSize:d(21),fontFamily:"Nunito_900Black"}}>Telefoningizning nutq xizmati</Txt>
      <Txt style={{fontSize:d(15),lineHeight:d(22),color:c.muted}}>Gapirish mashqlari Android nutq xizmati orqali ishlaydi. Ilova kompyuterga ulanmaydi. Ayrim xizmatlar internetdan foydalanadi; inglizcha model o&apos;rnatilgan bo&apos;lsa, mos telefonlarda nutq internetsiz taniladi.</Txt>
      <Txt style={{fontSize:d(16),fontFamily:"Nunito_800ExtraBold"}}>{!available ? "Nutq xizmati topilmadi" : !onDevice ? "Nutq xizmati mavjud; internet kerak bo'lishi mumkin" : checking ? "Tekshirilmoqda..." : downloaded ? "Inglizcha model o'rnatilgan" : "Inglizcha model hali o'rnatilmagan"}</Txt>
      {available && onDevice && !downloaded ? <Button label={busy ? "KUTILMOQDA..." : "INGLIZCHA MODELNI YUKLASH"} disabled={busy || checking} onPress={() => {void download();}} /> : null}
      <Button label="TELEFON SOZLAMALARI" kind="secondary" onPress={() => {void Linking.openSettings();}} />
      <Txt style={{fontSize:d(14),color:c.muted}}>Mikrofonga ruxsat bermasangiz yoki nutq xizmati ishlamasa ham, so&apos;zlarni tanlab darslarni tugatishingiz mumkin.</Txt>
      {message ? <Txt accessibilityRole="alert" style={{fontSize:d(14),color:c.text}}>{message}</Txt> : null}
      <LinkButton label="DARSLARGA QAYTISH" onPress={() => {back();}} />
    </View>
  </Page>;
}
