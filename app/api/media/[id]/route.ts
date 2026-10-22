import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Serves images from the dashboard's media library. Media is never edited in place
// (a new upload gets a new id), so responses can be cached forever.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("not found", { status: 404 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_media`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_id: id }),
    cache: "no-store",
  });
  const media = res.ok ? ((await res.json()) as { mime: string; data: string } | null) : null;
  if (!media?.data) return new Response("not found", { status: 404 });

  return new Response(Buffer.from(media.data, "base64"), {
    headers: { "Content-Type": media.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
