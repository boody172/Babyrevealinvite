export type Gender = "boy" | "girl";
export type Lang = "en" | "ar";

export type SectionId = "countdown" | "details" | "map" | "vote" | "rsvp" | "wishes";
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

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface Settings {
  language: Lang;
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
}

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
