import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Invitation from "./Invitation";
import { getInvite, getInviteByDomain, imageUrl } from "@/lib/api";
import type { SiteData } from "@/lib/types";

/** Which invitation to show: by link path (null = home) or by its own domain. */
export type InviteKey = { slug: string | null } | { domain: string };

// Deduped between generateMetadata and the page render.
const load = cache(async (kind: "slug" | "domain", value: string | null): Promise<SiteData | null | "error"> => {
  const init = { signal: AbortSignal.timeout(4000) };
  try {
    return kind === "domain" ? await getInviteByDomain(value!, null, init) : await getInvite(value, null, init);
  } catch {
    return "error"; // network hiccup: let the client retry instead of showing a 404
  }
});
const loadInvite = (by: InviteKey) => ("domain" in by ? load("domain", by.domain) : load("slug", by.slug));

export async function inviteMetadata(by: InviteKey): Promise<Metadata> {
  const data = await loadInvite(by);
  if (!data || data === "error") return {};
  const s = data.settings;
  const title = s.language === "ar" ? `${s.title} — ${s.baby_name}` : `${s.title} · ${s.baby_name}`;
  const description = s.language === "ar" ? "افتح الدعوة، أكّد حضورك وخمّن: ولد ولا بنت؟" : "Open your invitation, RSVP and cast your guess: boy or girl?";
  const image = s.images.frame ? imageUrl(s, "frame") : "/og.jpg";
  return { title, description, openGraph: { title, description, images: [image] }, twitter: { card: "summary_large_image", images: [image] } };
}

export default async function InvitePage({ by, preview }: { by: InviteKey; preview: boolean }) {
  const data = await loadInvite(by);
  if (data === null) notFound();
  const slug = data === "error" ? ("slug" in by ? (by.slug ?? "") : "") : data.slug;
  return <Invitation slug={slug} initial={data === "error" ? null : data} preview={preview} />;
}
