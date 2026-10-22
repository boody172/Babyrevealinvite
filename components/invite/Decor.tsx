"use client";

import { motion } from "motion/react";
import { useId, useMemo } from "react";

// All decor colors come from the theme CSS variables, so the dashboard palette restyles them.
export const C = {
  pink: "var(--color-pink)",
  pinkDeep: "var(--color-pink-deep)",
  pinkSoft: "var(--color-pink-soft)",
  blue: "var(--color-blue)",
  blueDeep: "var(--color-blue-deep)",
  blueSoft: "var(--color-blue-soft)",
  gold: "var(--color-gold)",
};

function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

export function Balloon({
  color,
  size = 60,
  dotted = false,
  className = "",
}: {
  color: "pink" | "blue";
  size?: number;
  dotted?: boolean;
  className?: string;
}) {
  const c = color === "pink" ? { fill: C.pink, shade: C.pinkDeep, hi: C.pinkSoft } : { fill: C.blue, shade: C.blueDeep, hi: C.blueSoft };
  const id = `b${useId().replace(/[:«»]/g, "")}`;
  return (
    <svg width={size} height={size * 1.75} viewBox="0 0 60 105" className={className} aria-hidden>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" style={{ stopColor: c.hi }} />
          <stop offset="50%" style={{ stopColor: c.fill }} />
          <stop offset="100%" style={{ stopColor: c.shade }} />
        </radialGradient>
      </defs>
      <path d="M30 66 C 26 76, 34 84, 29 94 S 31 102, 30 105" style={{ stroke: C.gold }} strokeWidth="0.9" fill="none" />
      <ellipse cx="30" cy="32" rx="25" ry="30" fill={`url(#${id})`} opacity="0.95" />
      {dotted &&
        [
          [20, 20],
          [36, 16],
          [26, 34],
          [42, 32],
          [18, 44],
          [34, 48],
          [30, 24],
        ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.3" fill="#fff" opacity="0.75" />)}
      <path d="M26 61 L34 61 L30 67 Z" style={{ fill: c.shade }} />
      <ellipse cx="21" cy="19" rx="5" ry="8" fill="#fff" opacity="0.45" transform="rotate(-25 21 19)" />
    </svg>
  );
}

export function Star({ size = 14, color = C.gold, className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.3 20.1l1.5-6.5-5-4.4 6.6-.6z"
        style={{ fill: color }}
        stroke="#fff"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Heart({ size = 16, color = C.pink, className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.8 8.1 3.1 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.9 0 6.2 4.1 4.6 7.8C19.5 16.4 12 21 12 21z"
        style={{ fill: color }}
      />
    </svg>
  );
}

export function QuestionMark({ color, size = 60 }: { color: "pink" | "blue"; size?: number }) {
  const fill = color === "pink" ? C.pink : C.blue;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" aria-hidden>
      <path d="M10 20 C 10 6, 40 4, 40 20 C 40 32, 25 32, 25 44" style={{ stroke: fill }} strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="60" r="6.5" style={{ fill }} />
    </svg>
  );
}

const DENSITY = { none: 0, soft: 7, full: 14 };

/** Ambient floating balloons, stars and hearts layered behind content. */
export function FloatingField({ level = "full", boost = 0 }: { level?: keyof typeof DENSITY; boost?: number }) {
  const count = DENSITY[level] ? DENSITY[level] + boost : 0;
  const items = useMemo(() => {
    const rnd = seeded(count * 7919 + 13);
    return Array.from({ length: count }, (_, i) => {
      const kind = i % 4 === 0 ? "balloon" : i % 3 === 0 ? "heart" : "star";
      const left = i % 2 === 0 ? rnd() * 22 : 78 + rnd() * 20;
      return {
        id: i,
        kind,
        left,
        top: rnd() * 100,
        size: kind === "balloon" ? 26 + rnd() * 22 : 8 + rnd() * 10,
        pink: left < 50,
        delay: rnd() * 4,
        duration: 6 + rnd() * 6,
      };
    });
  }, [count]);
  if (!count) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((it) => (
        <motion.div
          key={it.id}
          className="absolute"
          style={{ left: `${it.left}%`, top: `${it.top}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9, y: [0, -18, 0], rotate: [0, it.kind === "star" ? 25 : 4, 0] }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {it.kind === "balloon" ? (
            <Balloon color={it.pink ? "pink" : "blue"} size={it.size} dotted={it.id % 3 === 0} />
          ) : it.kind === "heart" ? (
            <Heart size={it.size} color={it.pink ? C.pink : C.blue} />
          ) : (
            <Star size={it.size} color={it.id % 2 ? C.gold : it.pink ? C.pink : C.blue} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="gold-line w-16 sm:w-24" />
      <Heart size={14} color={C.gold} />
      <span className="gold-line w-16 sm:w-24" />
    </div>
  );
}
