import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/api";

const KEYS = new Set(["frame", "bear_boy", "bear_girl", "scene"]);

// Serves images uploaded from the dashboard. URLs carry ?v=<upload time>, so they can be cached forever.
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  if (!KEYS.has(key)) return new Response("not found", { status: 404 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_asset`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: key }),
    cache: "no-store",
  });
  const asset = res.ok ? ((await res.json()) as { mime: string; data: string } | null) : null;
  if (!asset?.data) return new Response("not found", { status: 404 });

  return new Response(Buffer.from(asset.data, "base64"), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
