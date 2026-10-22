import type { Lang, Settings, TextFields, TextKey } from "./types";
import { TEXT_KEYS } from "./types";
import { DEFAULT_CONTENT } from "./defaults";

// Standard phrases fall back to the built-in translation; names and places keep the original text.
const GENERIC: TextKey[] = ["intro_line", "title", "tagline", "closing_note", "video_title"];

export const LANG_NAMES: Record<Lang, string> = { ar: "العربية", en: "English" };

/** Settings as a guest sees them in `lang` (texts swapped in from that language's translation). */
export function localize(s: Settings, lang: Lang): Settings {
  if (lang === s.language || !s.languages.includes(lang)) return s;
  const t = s.translations[lang] ?? {};
  const out: Settings = { ...s, language: lang };
  for (const k of TEXT_KEYS) {
    const v = t[k];
    out[k] = v && v.trim() ? v : GENERIC.includes(k) ? DEFAULT_CONTENT[lang][k] : s[k];
  }
  out.extras = t.extras?.length ? t.extras : s.extras;
  return out;
}

export function textsOf(s: Settings): TextFields {
  const out = { extras: s.extras } as TextFields;
  for (const k of TEXT_KEYS) out[k] = s[k];
  return out;
}

/** Make `lang` the default language: its texts move to the top level, the old default becomes a translation. */
export function setDefaultLanguage(s: Settings, lang: Lang): Settings {
  if (lang === s.language) return s;
  const current = localize({ ...s, languages: Array.from(new Set([...s.languages, lang])) }, lang);
  const translations = { ...s.translations, [s.language]: textsOf(s) };
  delete translations[lang];
  return { ...current, language: lang, languages: Array.from(new Set([lang, ...s.languages])), translations };
}
