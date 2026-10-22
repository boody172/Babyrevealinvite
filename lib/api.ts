import type { AdminData, Gender, ImageKey, InvitationSummary, MediaItem, Rsvp, Settings, SiteData } from "./types";
import { withDefaults } from "./defaults";

// The publishable key is meant to be public; every table is locked behind RLS and
// guests can only reach the invite_get / invite_rsvp / get_media functions.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lrbjrqjoneccxdhuzzqj.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_madLozKUPpe0G6poZXAsXQ_Ck9PSSyk";

export class ApiError extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    ...init,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(body?.message || `request_failed_${res.status}`);
  return body as T;
}

/** An invitation by link; empty slug = the home invitation. Null when it doesn't exist. */
export async function getInvite(slug: string | null, device?: string | null, init?: RequestInit): Promise<SiteData | null> {
  const data = await rpc<SiteData | null>("invite_get", { p_slug: slug || null, p_device: device ?? null }, init);
  return data ? { ...data, settings: withDefaults(data.settings) } : null;
}

export function submitRsvp(input: {
  slug: string;
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  guess: Gender;
  message: string;
  device: string;
}) {
  return rpc<{ ok: boolean }>("invite_rsvp", {
    p_slug: input.slug,
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

  invitations: (token: string) => rpc<InvitationSummary[]>("admin_invitations", { p_token: token }),
  invitation: async (token: string, id: string) => {
    const d = await rpc<AdminData>("admin_invitation", { p_token: token, p_id: id });
    return { ...d, settings: withDefaults(d.settings) };
  },
  create: (token: string, name: string, slug: string, data: Settings | null, copyFrom: string | null) =>
    rpc<string>("admin_invitation_create", { p_token: token, p_name: name, p_slug: slug, p_data: data, p_copy_from: copyFrom }),
  update: (token: string, id: string, name: string, slug: string, data: Settings) =>
    rpc<void>("admin_invitation_update", { p_token: token, p_id: id, p_name: name, p_slug: slug, p_data: data }),
  archive: (token: string, id: string, archived: boolean) =>
    rpc<void>("admin_invitation_archive", { p_token: token, p_id: id, p_archived: archived }),
  setHome: (token: string, id: string) => rpc<void>("admin_set_home", { p_token: token, p_id: id }),
  reveal: (token: string, id: string, gender: Gender | null, revealed: boolean) =>
    rpc<void>("admin_invitation_reveal", { p_token: token, p_id: id, p_gender: gender, p_revealed: revealed }),

  saveRsvp: (token: string, invitationId: string, r: Partial<Rsvp>) =>
    rpc<void>("admin_rsvp_save", { p_token: token, p_invitation: invitationId, p_rsvp: r }),
  removeRsvp: (token: string, id: string, deleted = true) =>
    rpc<void>("admin_remove_rsvp", { p_token: token, p_id: id, p_deleted: deleted }),

  uploadMedia: (token: string, label: string, mime: string, base64: string) =>
    rpc<string>("admin_media_upload", { p_token: token, p_label: label, p_mime: mime, p_data: base64 }),
  media: (token: string) => rpc<MediaItem[]>("admin_media_list", { p_token: token }),

  changePassword: (token: string, oldPw: string, newPw: string) =>
    rpc<void>("admin_change_password", { p_token: token, p_old: oldPw, p_new: newPw }),
};

const DEFAULT_IMAGES: Record<ImageKey, string> = {
  frame: "/img/frame.webp",
  bear_boy: "/img/bear-boy.webp",
  bear_girl: "/img/bear-girl.webp",
  scene: "/img/scene.webp",
};

export const mediaUrl = (id: string) => `/api/media/${id}`;

/** Image picked from the media library, otherwise the bundled default. */
export function imageUrl(s: Settings, key: ImageKey) {
  const id = s.images?.[key];
  return id ? mediaUrl(id) : DEFAULT_IMAGES[key];
}
