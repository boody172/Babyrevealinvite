import { NextResponse } from "next/server";
import { isGoogleMapsUrl, parsePoint } from "@/lib/maps";

// Follows a Google Maps share link (e.g. maps.app.goo.gl/...) to find the pin's coordinates.
export async function GET(req: Request) {
  let url = new URL(req.url).searchParams.get("url") ?? "";
  if (!isGoogleMapsUrl(url)) return NextResponse.json({ error: "not_google_maps" }, { status: 400 });

  try {
    for (let hop = 0; hop < 6; hop++) {
      const point = parsePoint(decodeURIComponent(url));
      if (point) return NextResponse.json({ point, resolved: url });
      const res = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15" },
        signal: AbortSignal.timeout(6000),
      });
      const next = res.headers.get("location");
      if (next) {
        url = new URL(next, url).toString();
        if (!isGoogleMapsUrl(url)) break;
        continue;
      }
      const body = await res.text();
      const inPage = parsePoint(body);
      if (inPage) return NextResponse.json({ point: inPage, resolved: url });
      break;
    }
  } catch {
    // fall through
  }
  return NextResponse.json({ error: "no_coordinates", resolved: url }, { status: 422 });
}
