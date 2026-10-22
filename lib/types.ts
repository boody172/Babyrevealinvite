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
  images: Partial<Record<ImageKey, number>>; // upload timestamp, used as cache-buster
}

export interface Wish {
  name: string;
  message: string;
  guess: Gender;
}

export interface SiteData {
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

export interface AdminData {
  settings: Settings;
  secret_gender: Gender | null;
  revealed: boolean;
  rsvps: Rsvp[];
}
