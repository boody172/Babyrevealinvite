import type { Lang } from "./types";

const en = {
  tapToOpen: "Tap the gift box to open your invitation",
  boyOrGirl: "Boy or Girl?",
  or: "or",
  waitIsOver: "The wait is over!",
  tapToReveal: "Tap the gift box to reveal",
  hostedBy: "with love,",
  forBaby: "for",
  countdownTitle: "Counting down to the big surprise",
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  itsToday: "It's today! See you soon",
  detailsTitle: "The Details",
  date: "Date",
  time: "Time",
  place: "Place",
  addToCalendar: "Add to calendar",
  openMap: "Open map",
  castVote: "Cast your vote",
  boy: "Boy",
  girl: "Girl",
  votes: "votes",
  vote: "vote",
  resultsSecret: "The results are a secret until the party!",
  noVotesYet: "Be the first to guess!",
  rsvpTitle: "RSVP & Guess",
  rsvpSubtitle: "Let us know if you'll join us — and make your guess!",
  rsvpBy: "Kindly reply by",
  yourName: "Your name",
  namePh: "e.g. Sara Ahmed",
  phone: "Phone (optional)",
  phonePh: "01xxxxxxxxx",
  willYouAttend: "Will you join us?",
  yes: "Joyfully accept",
  no: "Regretfully decline",
  guestsCount: "Number of guests (including you)",
  yourGuess: "What's your guess?",
  messageLabel: "A sweet note for the baby (optional)",
  messagePh: "Write your wishes...",
  send: "Send my RSVP",
  sending: "Sending...",
  thanks: "Thank you,",
  thanksGuessed: "Your guess:",
  thanksAttending: "We can't wait to celebrate with you!",
  thanksNotAttending: "We'll miss you! Thanks for letting us know.",
  alreadySent: "We've received your RSVP from this device.",
  rsvpClosed: "RSVPs are now closed. Thank you!",
  errName: "Please write your name",
  errGuess: "Please pick Boy or Girl",
  errGeneric: "Something went wrong, please try again.",
  errAlready: "You've already sent an RSVP from this device.",
  wishesTitle: "Sweet wishes",
  itsA: "It's a",
  guessedRight: "guessed right!",
  dressCode: "Dress code",
  share: "Share",
  scrollHint: "Scroll",
  moreInfo: "Good to know",
  mapTitle: "Find us",
  directions: "Directions",
  prizeTitle: "Guessing prize",
  openInMaps: "Open in Google Maps",
  menu: "Menu",
  navTop: "The invitation",
  navCountdown: "Countdown",
  navDetails: "Details",
  navMap: "Location",
  navVote: "Boy or Girl?",
  navRsvp: "RSVP & guess",
  navWishes: "Wishes",
  adminLogin: "Admin login",
  password: "Password",
  enter: "Enter",
  wrongPassword: "Wrong password",
  navVideo: "Video",
  playVideo: "Play video",
  language: "Language",
};

const ar: typeof en = {
  tapToOpen: "اضغط على الصندوق لفتح الدعوة",
  boyOrGirl: "ولد ولا بنت؟",
  or: "ولا",
  waitIsOver: "خلص الانتظار!",
  tapToReveal: "اضغط على الصندوق لكشف المفاجأة",
  hostedBy: "بكل حب،",
  forBaby: "لـ",
  countdownTitle: "العد التنازلي للمفاجأة الكبيرة",
  days: "يوم",
  hours: "ساعة",
  minutes: "دقيقة",
  seconds: "ثانية",
  itsToday: "النهارده اليوم! مستنيينكم",
  detailsTitle: "تفاصيل الحفل",
  date: "التاريخ",
  time: "الوقت",
  place: "المكان",
  addToCalendar: "أضف للتقويم",
  openMap: "افتح الخريطة",
  castVote: "شارك بتوقعك",
  boy: "ولد",
  girl: "بنت",
  votes: "صوت",
  vote: "صوت",
  resultsSecret: "النتايج سر لحد يوم الحفلة!",
  noVotesYet: "كن أول واحد يخمّن!",
  rsvpTitle: "تأكيد الحضور والتخمين",
  rsvpSubtitle: "قولنا هتيجي ولا لأ — وخمّن ولد ولا بنت!",
  rsvpBy: "برجاء التأكيد قبل",
  yourName: "اسمك",
  namePh: "مثال: سارة أحمد",
  phone: "رقم الموبايل (اختياري)",
  phonePh: "01xxxxxxxxx",
  willYouAttend: "هتشرفنا؟",
  yes: "أكيد هاجي",
  no: "للأسف مش هقدر",
  guestsCount: "عدد الحضور (معاك)",
  yourGuess: "توقعك إيه؟",
  messageLabel: "رسالة حلوة للبيبي (اختياري)",
  messagePh: "اكتب أمنياتك...",
  send: "ابعت التأكيد",
  sending: "جاري الإرسال...",
  thanks: "شكراً يا",
  thanksGuessed: "توقعك:",
  thanksAttending: "مستنيينك نحتفل سوا!",
  thanksNotAttending: "هنفتقدك! شكراً إنك عرفتنا.",
  alreadySent: "استلمنا تأكيدك من الجهاز ده.",
  rsvpClosed: "تم إغلاق تأكيد الحضور. شكراً لكم!",
  errName: "من فضلك اكتب اسمك",
  errGuess: "اختار ولد أو بنت",
  errGeneric: "حصلت مشكلة، حاول تاني.",
  errAlready: "انت بعت تأكيد قبل كده من الجهاز ده.",
  wishesTitle: "أمنيات حلوة",
  itsA: "طلع",
  guessedRight: "خمّنوا صح!",
  dressCode: "اللبس",
  share: "مشاركة",
  scrollHint: "انزل",
  moreInfo: "معلومات تهمك",
  mapTitle: "اللوكيشن",
  directions: "طريقة الوصول",
  prizeTitle: "جائزة التخمين",
  openInMaps: "افتح في جوجل ماب",
  menu: "القائمة",
  navTop: "الدعوة",
  navCountdown: "العد التنازلي",
  navDetails: "التفاصيل",
  navMap: "اللوكيشن",
  navVote: "ولد ولا بنت؟",
  navRsvp: "تأكيد الحضور والتخمين",
  navWishes: "الأمنيات",
  adminLogin: "دخول لوحة التحكم",
  password: "كلمة السر",
  enter: "دخول",
  wrongPassword: "كلمة السر غلط",
  navVideo: "الفيديو",
  playVideo: "تشغيل الفيديو",
  language: "اللغة",
};

export const dict = { en, ar };
export type Dict = typeof en;

/** UI strings for a language, with any admin overrides applied on top. */
export function t(lang: Lang, overrides?: Record<string, string>): Dict {
  const base = dict[lang] ?? en;
  if (!overrides) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (k in out && typeof v === "string" && v.trim()) (out as Record<string, string>)[k] = v;
  }
  return out;
}

export function formatDate(iso: string, lang: Lang) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { weekday: "", day: "", monthYear: "", time: "", full: "" };
  const loc = lang === "ar" ? "ar-EG" : "en-US";
  const tz = tzFromIso(iso);
  const o = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: tz, ...opts }).format(d);
  return {
    weekday: o({ weekday: "long" }),
    day: o({ day: "numeric" }),
    monthYear: o({ month: "long", year: "numeric" }),
    time: o({ hour: "numeric", minute: "2-digit" }),
    full: o({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}

// Show the event in its own timezone (from the ISO offset) so every guest sees the same local time.
function tzFromIso(iso: string): string | undefined {
  const m = iso.match(/([+-])(\d{2}):?(\d{2})$/);
  if (!m) return undefined;
  const h = parseInt(m[2], 10);
  if (m[3] !== "00") return undefined;
  if (h === 0) return "UTC";
  // Etc/GMT zones have inverted signs.
  return `Etc/GMT${m[1] === "+" ? "-" : "+"}${h}`;
}
