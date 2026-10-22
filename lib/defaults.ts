import type { Lang, Settings } from "./types";

const shared = {
  event_date: "2026-11-28T16:00:00+02:00",
  rsvp_deadline: "2026-11-20",
  map_url: "",
  rsvp_open: true,
  show_results: true,
  show_wishes: true,
  show_countdown: true,
  show_details: true,
  show_vote: true,
  ask_phone: true,
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
    venue: "The Garden Villa",
    address: "Cairo, Egypt",
    dress_code: "Wear pink or blue to show your guess!",
    closing_note: "Pink or blue, we love you!",
    extras: [],
  },
  ar: {
    ...shared,
    language: "ar",
    intro_line: "ندعوكم لحضور حفل",
    title: "معرفة نوع المولود",
    baby_name: "البيبي",
    parents: "ماما وبابا",
    tagline: "شاركونا لحظة معرفة مفاجأة صغيرنا الجميلة!",
    venue: "ذا جاردن فيلا",
    address: "القاهرة، مصر",
    dress_code: "البس وردي أو أزرق حسب توقعك!",
    closing_note: "ولد أو بنت.. هنحبه بكل قلبنا",
    extras: [],
  },
};

export function withDefaults(raw: Partial<Settings> | null | undefined): Settings {
  const lang: Lang = raw?.language === "ar" ? "ar" : "en";
  const base = DEFAULT_CONTENT[lang];
  const merged = { ...base } as Settings;
  if (raw) {
    for (const [k, v] of Object.entries(raw)) {
      if (v !== null && v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
    }
  }
  if (!Array.isArray(merged.extras)) merged.extras = [];
  return merged;
}
