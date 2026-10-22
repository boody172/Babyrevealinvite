"use client";

import { motion } from "motion/react";
import { useId, useMemo } from "react";

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
  const c =
    color === "pink"
      ? { fill: "#f6c3d0", shade: "#e48ea8", hi: "#fff3f6" }
      : { fill: "#b9d3f1", shade: "#6f9dd8", hi: "#f2f8ff" };
  const id = `b${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size * 1.75} viewBox="0 0 60 105" className={className} aria-hidden>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={c.hi} />
          <stop offset="45%" stopColor={c.fill} />
          <stop offset="100%" stopColor={c.shade} />
        </radialGradient>
      </defs>
      <path d="M30 66 C 26 76, 34 84, 29 94 S 31 102, 30 105" stroke="#c9a46a" strokeWidth="0.9" fill="none" />
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
      <path d="M26 61 L34 61 L30 67 Z" fill={c.shade} />
      <ellipse cx="21" cy="19" rx="5" ry="8" fill="#fff" opacity="0.45" transform="rotate(-25 21 19)" />
    </svg>
  );
}

export function Star({ size = 14, color = "#d9b56f", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.3 20.1l1.5-6.5-5-4.4 6.6-.6z"
        fill={color}
        stroke="#fff"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Heart({ size = 16, color = "#f2a7bb", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.1 3.1 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.9 0 6.2 4.1 4.6 7.8C19.5 16.4 12 21 12 21z" fill={color} />
    </svg>
  );
}

export function QuestionMark({ color, size = 60 }: { color: "pink" | "blue"; size?: number }) {
  const fill = color === "pink" ? "#f2b4c4" : "#8db4e6";
  const stroke = color === "pink" ? "#d9839c" : "#5d90d3";
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" aria-hidden>
      <path
        d="M10 20 C 10 6, 40 4, 40 20 C 40 32, 25 32, 25 44"
        stroke={fill}
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M10 20 C 10 6, 40 4, 40 20 C 40 32, 25 32, 25 44" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="25" cy="60" r="6.5" fill={fill} />
    </svg>
  );
}

/** Ambient floating balloons, stars and hearts layered behind content. */
export function FloatingField({ density = 14 }: { density?: number }) {
  const items = useMemo(() => {
    const rnd = seeded(density * 7919 + 13);
    return Array.from({ length: density }, (_, i) => {
        const kind = i % 4 === 0 ? "balloon" : i % 3 === 0 ? "heart" : "star";
        const left = i % 2 === 0 ? rnd() * 22 : 78 + rnd() * 20;
        return {
          id: i,
          kind,
          left,
          top: rnd() * 100,
          size: kind === "balloon" ? 26 + rnd() * 22 : 8 + rnd() * 10,
          color: left < 50 ? "pink" : "blue",
          delay: rnd() * 4,
          duration: 6 + rnd() * 6,
        };
      });
  }, [density]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((it) => (
        <motion.div
          key={it.id}
          className="absolute"
          style={{ left: `${it.left}%`, top: `${it.top}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.9, 0.9], y: [0, -18, 0], rotate: [0, it.kind === "star" ? 25 : 4, 0] }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {it.kind === "balloon" ? (
            <Balloon color={it.color as "pink" | "blue"} size={it.size} dotted={it.id % 3 === 0} />
          ) : it.kind === "heart" ? (
            <Heart size={it.size} color={it.color === "pink" ? "#f3b2c3" : "#a9c6ee"} />
          ) : (
            <Star size={it.size} color={it.id % 2 ? "#dcb877" : it.color === "pink" ? "#f0a9bc" : "#9bbde9"} />
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
      <Heart size={14} color="#c9a46a" />
      <span className="gold-line w-16 sm:w-24" />
    </div>
  );
}
