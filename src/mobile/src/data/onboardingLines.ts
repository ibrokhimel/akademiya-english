// What Dombi says during onboarding. A question has a recorded voice; an answer to a pick is new and plays
// without a voice until it is recorded (design/sound/build_dombi_acted.py), its highlight walking at a talking pace.
export const lines = {
  hello: "Salom! Men Dombiman.",
  name: "Ismingiz nima? Sizni shunday chaqiraman.",
  task: "Hozir birinchi so'zingizni aytasiz. Rasmga qarang va do'stingizga salom bering.",
  promise: "Ovozingizni yozib olmoqchiman. 30 kundan keyin birinchi kungi ovozingiz bilan solishtirasiz. Yozuvlar faqat shu telefonda qoladi.",
  goal: "Ingliz tili sizga nima uchun kerak?",
  level: "Ingliz tilini qanchalik bilasiz?",
  confidence: "Ingliz tilida gapirganda o'zingizga qanchalik ishonasiz?",
  reminder: "Sizga har kuni eslatma yuborishni xohlayman. Soat nechada qulay?",
  permission: "Telefon hozir ruxsat so'raydi. «Allow» ni bossangiz, kuniga bitta eslatma yuboraman. Ko'p bezovta qilmayman.",
};
export const goalReplies: Record<string, string> = {
  school: "Maktab uchunmi? Avval kundalik gaplarni o'rganamiz, keyin darslar ham osonroq bo'ladi.",
  ielts: "IELTS'da gapirish qismi muhim. Biz aynan gapirishni mashq qilamiz.",
  travel: "Sayohat uchunmi? Unda kafe va do'konda gaplashishdan boshlaymiz.",
  work: "Ish uchunmi? Avval tanishish va oddiy suhbatdan boshlaymiz.",
  self: "O'zingiz uchunmi? Zo'r. Har kuni ozgina gapirib boramiz.",
};
export const levelReplies: Record<string, string> = {
  new: "Noldan bo'lsa ham qo'rqmang. Eng oddiy so'zlardan boshlaymiz.",
  some: "Biroz bilasizmi? Yaxshi. Tanish joylarni tez o'tib ketasiz.",
};
export const confidenceReplies = [
  "Hech qisi yo'q. Birinchi so'zdan birga boshlaymiz.",
  "Ko'pchilik shunday. Har kuni ozgina gapirsangiz, qo'rquv o'zi ketadi.",
  "Yaxshi boshlanish. Har kuni gapirib, ishonchni oshiramiz.",
  "Zo'r! Endi tezroq gapirishni mashq qilamiz.",
  "Ajoyib! Unda ko'proq gapirib, yanada erkin bo'lasiz.",
];
