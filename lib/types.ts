export type Gender = "boy" | "girl";
export type Lang = "en" | "ar";

export type SectionId = "countdown" | "details" | "video" | "map" | "vote" | "rsvp" | "wishes";
export type ImageKey = "frame" | "bear_boy" | "bear_girl" | "scene";

export interface ExtraBlock {
  title: string;
  text: string;
}

export interface Theme {
  preset: string;
  bg: string;
  ink: string;
  pink: string;
  blue: string;
  gold: string;
  heading_font: string;
  script_font: string;
  arabic_font: string;
  decor: "none" | "soft" | "full";
  intro: boolean;
  card: CardLayout;
}

/** Where the text sits on the invitation card, in % of the card (each background has its own empty area). */
export interface CardLayout {
  top: number;
  bottom: number;
  side: number;
  backdrop: boolean; // soft white panel behind the text for busy backgrounds
}

/** Parts of the page that can be styled one by one from the dashboard. */
export type StyleTarget = "hero" | SectionId | "footer";

/** Per-section design overrides; anything left empty follows the invitation's theme. */
export interface SectionStyle {
  heading_font?: string; // key of FONTS.any
  body_font?: string;
  scale?: number; // text size in %, 100 = normal
  text?: string; // text color
  accent?: string; // gold accents (dividers, small titles)
  bg?: string; // section background color
  align?: "start" | "center" | "end";
}

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface VideoSettings {
  url: string; // uploaded file (Vercel Blob) or a YouTube / Vimeo link
  poster: string; // media library id, optional
  autoplay: boolean; // muted autoplay when scrolled into view
}

export interface Settings {
  language: Lang; // default language; the top-level texts below are in this language
  languages: Lang[]; // languages guests can switch between
  translations: Partial<Record<Lang, Partial<TextFields>>>;
  intro_line: string;
  title: string;
  baby_name: string;
  parents: string;
  tagline: string;
  event_date: string; // ISO with timezone offset
  venue: string;
  address: string;
  directions: string;
  map_url: string;
  map_point: MapPoint | null;
  map_query: string; // place name from the share link when it has no coordinates
  dress_code: string;
  prize: string;
  rsvp_deadline: string; // YYYY-MM-DD
  closing_note: string;
  extras: ExtraBlock[];
  rsvp_open: boolean;
  show_results: boolean;
  show_wishes?: boolean; // mirrored from sections for the SQL side
  ask_phone: boolean;
  sections: { id: SectionId; visible: boolean }[];
  theme: Theme;
  labels: Partial<Record<Lang, Record<string, string>>>;
  images: Partial<Record<ImageKey, string>>; // media library id; empty = bundled default
  video: VideoSettings;
  video_title: string;
  section_styles: Partial<Record<StyleTarget, SectionStyle>>;
}

/** Texts that are written per language. */
export const TEXT_KEYS = [
  "intro_line",
  "title",
  "baby_name",
  "parents",
  "tagline",
  "venue",
  "address",
  "directions",
  "dress_code",
  "prize",
  "closing_note",
  "video_title",
] as const;
export type TextKey = (typeof TEXT_KEYS)[number];
export type TextFields = Pick<Settings, TextKey> & { extras: ExtraBlock[] };

export interface Wish {
  name: string;
  message: string;
  guess: Gender;
}

export interface SiteData {
  slug: string;
  settings: Settings;
  revealed: boolean;
  gender?: Gender;
  votes?: { boy: number; girl: number };
  wishes?: Wish[];
  mine?: { name: string; guess: Gender; attending: boolean } | null;
}

export interface Rsvp {
  id?: string;
  name: string;
  phone: string | null;
  attending: boolean;
  guests: number;
  guess: Gender;
  message: string | null;
  show_message: boolean;
  deleted?: boolean;
  created_at?: string;
}

export interface InvitationInfo {
  id: string;
  slug: string;
  name: string;
  archived: boolean;
  is_home: boolean;
}

export interface InvitationSummary extends InvitationInfo {
  domain: string | null; // the invitation's own link, e.g. faisal-khadija-invitation.vercel.app
  created_at: string;
  language: Lang | null;
  baby_name: string | null;
  event_date: string | null;
  frame: string | null;
  theme: Partial<Theme> | null;
  responses: number;
  attending: number;
}

export interface MediaItem {
  id: string;
  label: string;
  size: number;
  created_at: string;
}

export interface AdminData {
  invitation: InvitationInfo;
  settings: Settings;
  secret_gender: Gender | null;
  revealed: boolean;
  rsvps: Rsvp[];
}
