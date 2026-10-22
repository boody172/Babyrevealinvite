import type { Lang, SectionId, Settings } from "./types";
import { DEFAULT_THEME } from "./theme";

export const SECTION_IDS: SectionId[] = ["countdown", "details", "map", "vote", "rsvp", "wishes"];

export const SECTION_LABELS: Record<SectionId, string> = {
  countdown: "العد التنازلي",
  details: "التفاصيل (التاريخ والمكان)",
  map: "الخريطة واللوكيشن",
  vote: "ولد ولا بنت + نسب التصويت",
  rsvp: "فورم تأكيد الحضور والتخمين",
  wishes: "رسائل المعازيم",
};

const shared = {
  event_date: "2026-11-28T20:00:00+03:00",
  rsvp_deadline: "",
  map_url: "https://maps.app.goo.gl/iqFH2GzGipbpYpAj8",
  map_point: null,
  map_query: "",
  rsvp_open: true,
  show_results: true,
  ask_phone: true,
  extras: [],
  sections: SECTION_IDS.map((id) => ({ id, visible: true })),
  theme: DEFAULT_THEME,
  labels: {},
  images: {},
};

export const DEFAULT_CONTENT: Record<Lang, Settings> = {
  en: {
    ...shared,
    language: "en",
    intro_line: "You're invited to a",
    title: "Gender Reveal",
    baby_name: "Baby",
    parents: "Mom & Dad",
    tagline: "Join us as we find out our little one's big surprise!",
    venue: "Villa 1",
    address: "King Fahd Hospital Housing, Al Hufairah, Al Hofuf",
    directions: "Entrance from Gate 5",
    dress_code: "Casual",
    prize: "Guess right and enjoy free drinks — forever! 🥤😂",
    closing_note: "Pink or blue, we love you!",
  },
  ar: {
    ...shared,
    language: "ar",
    intro_line: "ندعوكم لحضور حفل",
    title: "معرفة نوع المولود",
    baby_name: "البيبي",
    parents: "ماما وبابا",
    tagline: "شاركونا لحظة معرفة مفاجأة صغيرنا الجميلة!",
    venue: "فيلا ١",
    address: "الهفوف، حي الحفيرة، سكن مستشفى الملك فهد",
    directions: "الدخول من بوابة ٥",
    dress_code: "كاجوال",
    prize: "اللي يخمّن صح.. له مشروبات مجاناً باستمرار! 🥤😂",
    closing_note: "ولد أو بنت.. هنحبه بكل قلبنا",
  },
};

/** Fill any missing keys (older saved data, new features) with defaults. */
export function withDefaults(raw: Partial<Settings> | null | undefined): Settings {
  const lang: Lang = raw?.language === "ar" ? "ar" : "en";
  const merged = { ...DEFAULT_CONTENT[lang] } as Settings;
  if (raw) {
    for (const [k, v] of Object.entries(raw)) {
      if (v !== null && v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
    }
  }
  merged.theme = { ...DEFAULT_THEME, ...(raw?.theme ?? {}) };
  merged.labels = raw?.labels ?? {};
  merged.images = raw?.images ?? {};
  if (!Array.isArray(merged.extras)) merged.extras = [];
  // keep saved order, drop unknown ids, append sections added in newer versions
  const saved = Array.isArray(raw?.sections) ? raw.sections.filter((s) => SECTION_IDS.includes(s.id)) : [];
  merged.sections = [...saved, ...SECTION_IDS.filter((id) => !saved.some((s) => s.id === id)).map((id) => ({ id, visible: true }))];
  return merged;
}
