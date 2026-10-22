import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Invitation from "./Invitation";
import { getInvite, imageUrl } from "@/lib/api";
import type { SiteData } from "@/lib/types";

// Deduped between generateMetadata and the page render.
export const loadInvite = cache(async (slug: string | null): Promise<SiteData | null | "error"> => {
  try {
    return await getInvite(slug, null, { signal: AbortSignal.timeout(4000) });
  } catch {
    return "error"; // network hiccup: let the client retry instead of showing a 404
  }
});

export async function inviteMetadata(slug: string | null): Promise<Metadata> {
  const data = await loadInvite(slug);
  if (!data || data === "error") return {};
  const s = data.settings;
  const title = s.language === "ar" ? `${s.title} — ${s.baby_name}` : `${s.title} · ${s.baby_name}`;
  const description = s.language === "ar" ? "افتح الدعوة، أكّد حضورك وخمّن: ولد ولا بنت؟" : "Open your invitation, RSVP and cast your guess: boy or girl?";
  const image = s.images.frame ? imageUrl(s, "frame") : "/og.jpg";
  return { title, description, openGraph: { title, description, images: [image] }, twitter: { card: "summary_large_image", images: [image] } };
}

export default async function InvitePage({ slug, preview }: { slug: string | null; preview: boolean }) {
  const data = await loadInvite(slug);
  if (data === null) notFound();
  return <Invitation slug={slug ?? ""} initial={data === "error" ? null : data} preview={preview} />;
}
