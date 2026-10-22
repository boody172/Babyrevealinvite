export type Gender = "boy" | "girl";
export type Lang = "en" | "ar";

export interface ExtraBlock {
  title: string;
  text: string;
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
  map_url: string;
  dress_code: string;
  rsvp_deadline: string; // YYYY-MM-DD
  closing_note: string;
  extras: ExtraBlock[];
  rsvp_open: boolean;
  show_results: boolean;
  show_wishes: boolean;
  show_countdown: boolean;
  show_details: boolean;
  show_vote: boolean;
  ask_phone: boolean;
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
