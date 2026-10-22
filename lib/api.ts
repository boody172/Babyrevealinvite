import type { AdminData, Rsvp, Settings, SiteData, Gender } from "./types";
import { withDefaults } from "./defaults";

// The publishable key is meant to be public; every table is locked behind RLS and
// guests can only reach the get_site / submit_rsvp functions.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lrbjrqjoneccxdhuzzqj.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_madLozKUPpe0G6poZXAsXQ_Ck9PSSyk";

export class ApiError extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
    ...init,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(body?.message || `request_failed_${res.status}`);
  return body as T;
}

export async function getSite(device?: string | null, init?: RequestInit): Promise<SiteData> {
  const data = await rpc<SiteData>("get_site", { p_device: device ?? null }, init);
  return { ...data, settings: withDefaults(data.settings) };
}

export function submitRsvp(input: {
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  guess: Gender;
  message: string;
  device: string;
}) {
  return rpc<{ ok: boolean }>("submit_rsvp", {
    p_name: input.name,
    p_phone: input.phone,
    p_attending: input.attending,
    p_guests: input.guests,
    p_guess: input.guess,
    p_message: input.message,
    p_device: input.device,
  });
}

export const admin = {
  login: (password: string) => rpc<string>("admin_login", { p_password: password }),
  logout: (token: string) => rpc<void>("admin_logout", { p_token: token }),
  getAll: async (token: string) => {
    const d = await rpc<AdminData>("admin_get_all", { p_token: token });
    return { ...d, settings: withDefaults(d.settings) };
  },
  updateSettings: (token: string, data: Settings) =>
    rpc<void>("admin_update_settings", { p_token: token, p_data: data }),
  setReveal: (token: string, gender: Gender | null, revealed: boolean) =>
    rpc<void>("admin_set_reveal", { p_token: token, p_gender: gender, p_revealed: revealed }),
  saveRsvp: (token: string, r: Partial<Rsvp>) => rpc<void>("admin_save_rsvp", { p_token: token, p_rsvp: r }),
  removeRsvp: (token: string, id: string, deleted = true) =>
    rpc<void>("admin_remove_rsvp", { p_token: token, p_id: id, p_deleted: deleted }),
  changePassword: (token: string, oldPw: string, newPw: string) =>
    rpc<void>("admin_change_password", { p_token: token, p_old: oldPw, p_new: newPw }),
};
