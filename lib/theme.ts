import type { CSSProperties } from "react";
import type { Theme } from "./types";

export const FONTS = {
  heading: {
    cinzel: { label: "Cinzel", css: '"Cinzel", serif' },
    playfair: { label: "Playfair Display", css: '"Playfair Display", serif' },
    cormorant: { label: "Cormorant Garamond", css: '"Cormorant Garamond", serif' },
  },
  script: {
    greatvibes: { label: "Great Vibes", css: '"Great Vibes", cursive' },
    parisienne: { label: "Parisienne", css: '"Parisienne", cursive' },
    allura: { label: "Allura", css: '"Allura", cursive' },
  },
  arabic: {
    ruqaa: { label: "رقعة (Aref Ruqaa)", css: '"Aref Ruqaa", serif' },
    amiri: { label: "أميري (Amiri)", css: '"Amiri", serif' },
    kufi: { label: "كوفي (Reem Kufi)", css: '"Reem Kufi", sans-serif' },
  },
} as const;

type Palette = Pick<Theme, "bg" | "ink" | "pink" | "blue" | "gold">;

export const PRESETS: Record<string, { label: string; palette: Palette }> = {
  classic: {
    label: "كلاسيك وردي وأزرق",
    palette: { bg: "#fbf6f0", ink: "#4e3d30", pink: "#e0789a", blue: "#5d90d3", gold: "#c9a46a" },
  },
  champagne: {
    label: "شامبين ذهبي",
    palette: { bg: "#f8f1e7", ink: "#3f3226", pink: "#d48b9b", blue: "#7b9cc4", gold: "#b8904f" },
  },
  candy: {
    label: "كاندي مبهج",
    palette: { bg: "#fff7fb", ink: "#4a3346", pink: "#ec5f93", blue: "#4c8fe6", gold: "#e4a94c" },
  },
  sage: {
    label: "هادي ناعم",
    palette: { bg: "#f6f5ef", ink: "#3d4038", pink: "#cf8f9c", blue: "#7fa3b8", gold: "#a8a26b" },
  },
};

export const DEFAULT_THEME: Theme = {
  preset: "classic",
  ...PRESETS.classic.palette,
  heading_font: "cinzel",
  script_font: "greatvibes",
  arabic_font: "ruqaa",
  decor: "full",
  intro: true,
  card: { top: 14.5, bottom: 42, side: 19, backdrop: false }, // fits the bundled watercolor frame
};

/** Mix a hex color with white (amount 0..1 of white). */
function tint(hex: string, amount: number) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const mix = (c: string) =>
    Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(m[1])}${mix(m[2])}${mix(m[3])}`;
}

/** CSS variables that override the Tailwind theme tokens for the whole page. */
export function themeVars(t: Theme): CSSProperties {
  const pick = <T extends Record<string, { css: string }>>(group: T, key: string, fallback: keyof T) =>
    (group[key as keyof T] ?? group[fallback]).css;
  const arabic = pick(FONTS.arabic, t.arabic_font, "ruqaa");
  return {
    "--color-cream": t.bg,
    "--color-cream-2": tint(t.gold, 0.82),
    "--color-ink": t.ink,
    "--color-ink-soft": tint(t.ink, 0.3),
    "--color-gold": t.gold,
    "--color-gold-soft": tint(t.gold, 0.6),
    "--color-pink-deep": t.pink,
    "--color-pink": tint(t.pink, 0.55),
    "--color-pink-soft": tint(t.pink, 0.84),
    "--color-blue-deep": t.blue,
    "--color-blue": tint(t.blue, 0.55),
    "--color-blue-soft": tint(t.blue, 0.86),
    "--font-display": `${pick(FONTS.heading, t.heading_font, "cinzel")}, ${arabic}`,
    "--font-script": `${pick(FONTS.script, t.script_font, "greatvibes")}, ${arabic}`,
    "--font-arabic-display": arabic,
  } as CSSProperties;
}
