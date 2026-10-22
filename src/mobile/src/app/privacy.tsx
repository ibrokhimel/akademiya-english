import { View } from "react-native";
import { ScreenHeader } from "../components/SettingsControls";
import { Page,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { cloudEnabled } from "../lib/config";
import { useBack } from "../lib/navigation";
import { useApp } from "../lib/store";

export default function Privacy() {
  const { settings } = useApp();
  const d = useDesignScale(), c = useTheme(), back = useBack(settings.onboarded ? "/settings" : "/onboarding");
  const sections = [
    ["Telefoningizdagi ma'lumotlar", "Ismingiz, dars natijalari, sozlamalar va tugallanmagan dars shu telefonda saqlanadi. Ilovani o'chirsangiz, mahalliy ma'lumotlar ham o'chishi mumkin."],
    ["Mikrofon va nutqni tanish", "Mikrofon faqat gapirish mashqini boshlaganingizda ishlaydi. Android nutq xizmati ovozingizni o'z qoidalari bo'yicha qayta ishlaydi; ayrim telefonlarda buning uchun internet kerak. Boshqa oynaga o'tsangiz, tinglash to'xtaydi. Gapirmasdan, so'zlarni tanlab ham mashq qilishingiz mumkin."],
    ["Ovoz yozuvlari", "Ovozni saqlash dastlab o'chiq. Uni yoqsangiz, ayrim to'g'ri javoblaringizni keyin tinglash uchun saqlaymiz. Sozlamalar > Ovoz yozuvlari orqali bitta yoki barcha yozuvlarni o'chirishingiz mumkin."],
    ["Hisob va bulut", cloudEnabled ? "Hisob yaratish ixtiyoriy. Hisobga kirganingizda natijalar, sozlamalar va saqlangan ovoz yozuvlari xizmatimizga yuboriladi. Har bir hisob faqat o'z ma'lumotlariga kira oladi. Hisobni o'chirish serverdagi ma'lumotlarni ham o'chiradi." : "Bu versiyada hisob va bulutga sinxronlash yo'q. Dars natijalari va saqlangan yozuvlarimiz serverga yuborilmaydi. Telefonning zaxiralash qoidalari Android sozlamalaringizga bog'liq."],
    ["Eslatmalar", "Eslatmalar telefonning o'zida rejalashtiriladi. Ruxsat berish ixtiyoriy. Vaqtni o'zgartirish yoki eslatmalarni o'chirish Sozlamalarda mavjud. Android batareya cheklovlari yetkazilish vaqtiga ta'sir qilishi mumkin."],
    ["Fikr bildirish", "Yuborishdan oldin yozgan xabaringiz va ekran rasmini qo'shish tanlovini tekshiring. Xabar faqat muvaffaqiyatli yuborilganda yetkazildi deb ko'rsatiladi. Qoralama yuborilmaguncha telefonda saqlanadi."],
    ["Ma'lumotlarni o'chirish", "Sozlamalardagi Ma'lumotlarni o'chirish tugmasi natijalar, ovoz yozuvlari va qoralamalarni o'chiradi. Hisobga kirgan bo'lsangiz, Hisobni o'chirish serverdagi hisobingizni ham o'chiradi. Amal tasdiqlashingizdan keyin bajariladi."],
  ];
  return <Page scroll style={{ padding: d(20), gap: d(20) }}>
    <ScreenHeader title="Maxfiylik" onBack={back} />
    <Txt style={{ color: c.muted, fontSize: d(13) }}>Akademiya English · Android MVP · 1.0</Txt>
    {sections.map(([title, body]) => <View key={title} style={{ gap: d(8) }}>
      <Txt style={{ fontSize: d(18), fontFamily: "Nunito_900Black" }}>{title}</Txt>
      <Txt style={{ fontSize: d(15), lineHeight: d(22), color: c.muted }}>{body}</Txt>
    </View>)}
  </Page>;
}
