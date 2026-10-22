import type { Lang, MapPoint, Settings } from "./types";

const PATTERNS = [
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, // exact place pin
  /[?&](?:q|query|ll|destination|center)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // viewport centre
];

export function parsePoint(text: string): MapPoint | null {
  for (const re of PATTERNS) {
    const m = text.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export function isGoogleMapsUrl(raw: string) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === "https:" &&
      (/^(maps\.app\.goo\.gl|goo\.gl)$/.test(u.hostname) || /(^|\.)google\.[a-z.]+$/.test(u.hostname))
    );
  } catch {
    return false;
  }
}

function target(s: Settings) {
  return s.map_point ? `${s.map_point.lat},${s.map_point.lng}` : `${s.venue} ${s.address}`;
}

export function embedUrl(s: Settings, lang: Lang) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(target(s))}&z=16&hl=${lang}&output=embed`;
}

export function directionsUrl(s: Settings) {
  if (s.map_point) return `https://www.google.com/maps/dir/?api=1&destination=${s.map_point.lat},${s.map_point.lng}`;
  if (s.map_url) return s.map_url;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target(s))}`;
}
