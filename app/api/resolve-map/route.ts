import { NextResponse } from "next/server";
import { isGoogleMapsUrl, parsePoint } from "@/lib/maps";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Google sometimes answers with an HTML page instead of a redirect; pull the maps link out of it.
function linkInPage(html: string) {
  const clean = html.replace(/\\u0026/g, "&").replace(/\\u003d/g, "=").replace(/\\\//g, "/").replace(/&amp;/g, "&");
  return clean.match(/https:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps[^"'\s<>\\]*/)?.[0] ?? null;
}

// Follows a Google Maps share link (e.g. maps.app.goo.gl/...) to find the pin's coordinates.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  let url = params.get("url")?.trim() ?? "";
  if (params.get("debug") === "1" && isGoogleMapsUrl(url)) {
    const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA } });
    const t = await r.text();
    return NextResponse.json({ status: r.status, location: r.headers.get("location"), links: t.match(/https?:[^"'\s<>]{10,300}/g)?.slice(0, 40), len: t.length });
  }
  if (!isGoogleMapsUrl(url)) return NextResponse.json({ error: "not_google_maps" }, { status: 400 });

  const seen = new Set<string>();
  try {
    for (let hop = 0; hop < 8 && !seen.has(url); hop++) {
      seen.add(url);
      const point = parsePoint(decodeURIComponent(url));
      if (point) return NextResponse.json({ point, resolved: url });

      const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) });
      const location = res.headers.get("location");
      const next = location ? new URL(location, url).toString() : null;
      if (next && isGoogleMapsUrl(next)) {
        url = next;
        continue;
      }
      const body = await res.text();
      const inPage = parsePoint(body);
      if (inPage) return NextResponse.json({ point: inPage, resolved: url });
      const embedded = linkInPage(body);
      if (!embedded || !isGoogleMapsUrl(embedded)) break;
      url = embedded;
    }
  } catch {
    // fall through to the error below
  }
  return NextResponse.json({ error: "no_coordinates", resolved: url }, { status: 422 });
}
