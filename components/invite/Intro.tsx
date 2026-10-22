"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { Balloon, Heart, QuestionMark, Star, FloatingField } from "./Decor";
import type { Dict } from "@/lib/i18n";
import type { Gender } from "@/lib/types";

function GiftBox({ lidControls }: { lidControls: ReturnType<typeof useAnimationControls> }) {
  const left = "#f6c9d4";
  const right = "#b9d3f1";
  return (
    <div className="relative h-[170px] w-[190px] sm:h-[200px] sm:w-[224px]">
      {/* lid */}
      <motion.svg
        animate={lidControls}
        viewBox="0 0 224 70"
        className="absolute -top-2 left-0 z-20 w-full origin-bottom-left"
        aria-hidden
      >
        <rect x="4" y="22" width="216" height="40" rx="6" fill={left} />
        <rect x="112" y="22" width="108" height="40" rx="6" fill={right} />
        <rect x="104" y="22" width="16" height="40" fill="#fff" opacity="0.85" />
        <rect x="4" y="54" width="216" height="8" fill="#000" opacity="0.05" />
        {/* bow */}
        <path d="M112 24 C 80 -6, 58 14, 84 24 Z" fill="#f2a9bd" />
        <path d="M112 24 C 144 -6, 166 14, 140 24 Z" fill="#8fb6e8" />
        <circle cx="112" cy="21" r="8" fill="#f8d9e1" stroke="#fff" strokeWidth="2" />
      </motion.svg>
      {/* body */}
      <svg viewBox="0 0 224 150" className="absolute bottom-0 left-0 w-full" aria-hidden>
        <rect x="16" y="0" width="96" height="150" rx="4" fill={left} />
        <rect x="112" y="0" width="96" height="150" rx="4" fill={right} />
        <rect x="104" y="0" width="16" height="150" fill="#fff" opacity="0.85" />
        <rect x="16" y="0" width="192" height="12" fill="#000" opacity="0.06" />
        {[
          [40, 40],
          [70, 90],
          [45, 120],
        ].map(([x, y], i) => (
          <path key={`h${i}`} transform={`translate(${x} ${y}) scale(0.7)`} d="M12 21s-7.5-4.6-9.6-9.2C.8 8.1 3.1 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.9 0 6.2 4.1 4.6 7.8C19.5 16.4 12 21 12 21z" fill="#fff" opacity="0.7" />
        ))}
        {[
          [150, 35],
          [180, 85],
          [140, 115],
        ].map(([x, y], i) => (
          <path key={`s${i}`} transform={`translate(${x} ${y}) scale(0.8)`} d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.3 20.1l1.5-6.5-5-4.4 6.6-.6z" fill="#fff" opacity="0.75" />
        ))}
      </svg>
    </div>
  );
}

const burst = [
  { el: "qp", x: -110, y: -230, r: -18 },
  { el: "qb", x: 110, y: -240, r: 16 },
  { el: "bp", x: -170, y: -420, r: -10 },
  { el: "bb", x: 170, y: -440, r: 10 },
  { el: "bp2", x: -60, y: -520, r: -4 },
  { el: "bb2", x: 70, y: -500, r: 6 },
  { el: "h1", x: -40, y: -170, r: -20 },
  { el: "h2", x: 50, y: -190, r: 20 },
  { el: "s1", x: -150, y: -140, r: 40 },
  { el: "s2", x: 160, y: -160, r: -40 },
  { el: "s3", x: 0, y: -300, r: 60 },
];

function BurstItem({ el }: { el: string }) {
  switch (el) {
    case "qp":
      return <QuestionMark color="pink" size={54} />;
    case "qb":
      return <QuestionMark color="blue" size={54} />;
    case "bp":
    case "bp2":
      return <Balloon color="pink" size={46} dotted={el === "bp"} />;
    case "bb":
    case "bb2":
      return <Balloon color="blue" size={46} dotted={el === "bb2"} />;
    case "h1":
      return <Heart size={22} color="#f2a7bb" />;
    case "h2":
      return <Heart size={22} color="#9bbde9" />;
    default:
      return <Star size={18} />;
  }
}

export default function Intro({
  d,
  onOpen,
  reveal,
  babyName,
}: {
  d: Dict;
  onOpen: () => void;
  reveal?: Gender;
  babyName: string;
}) {
  const [phase, setPhase] = useState<"idle" | "opening">("idle");
  const box = useAnimationControls();
  const lid = useAnimationControls();

  useEffect(() => {
    if (phase !== "idle") return;
    const id = setInterval(() => {
      box.start({ rotate: [0, -4, 4, -3, 3, 0], transition: { duration: 0.7 } });
    }, 2800);
    return () => clearInterval(id);
  }, [phase, box]);

  async function open() {
    if (phase !== "idle") return;
    setPhase("opening");
    try {
      navigator.vibrate?.(30);
    } catch {}
    await box.start({ rotate: [0, -6, 6, -6, 6, 0], scale: [1, 1.05, 1], transition: { duration: 0.6 } });
    lid.start({ y: -140, x: 40, rotate: 28, opacity: 0, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] } });
    setTimeout(onOpen, reveal ? 1500 : 1700);
  }

  return (
    <motion.section
      className="watercolor-bg paper-noise fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6"
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
      transition={{ duration: 0.8 }}
    >
      <FloatingField density={18} />

      <motion.p
        className="font-sans text-[11px] uppercase tracking-[0.35em] text-ink-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {babyName}
      </motion.p>
      <motion.h1
        className="font-script mt-2 text-center text-6xl leading-tight sm:text-7xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.8 }}
      >
        {reveal ? (
          <span className="text-shimmer">{d.waitIsOver}</span>
        ) : (
          <>
            <span className="text-blue-deep">{d.boy} </span>
            <span className="text-gold text-4xl sm:text-5xl">{d.or} </span>
            <span className="text-pink-deep">{d.girl}?</span>
          </>
        )}
      </motion.h1>

      <motion.button
        type="button"
        onClick={open}
        aria-label={reveal ? d.tapToReveal : d.tapToOpen}
        className="relative mt-16 cursor-pointer outline-none"
        initial={{ opacity: 0, scale: 0.6, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 12 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div animate={box} className="origin-bottom">
          <GiftBox lidControls={lid} />
        </motion.div>

        <AnimatePresence>
          {phase === "opening" &&
            burst.map((b, i) => (
              <motion.div
                key={b.el}
                className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2"
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
                animate={{ x: b.x, y: b.y, scale: 1, opacity: [0, 1, 1, 0.95], rotate: b.r }}
                transition={{ delay: 0.75 + i * 0.04, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <BurstItem el={b.el} />
              </motion.div>
            ))}
        </AnimatePresence>

        {phase === "opening" && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-4 h-40 w-40 -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,240,200,0.95), rgba(255,240,200,0) 70%)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 1, 0] }}
            transition={{ delay: 0.7, duration: 1.2 }}
          />
        )}
      </motion.button>

      <motion.div
        className="mt-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "idle" ? 1 : 0 }}
        transition={{ delay: phase === "idle" ? 1.1 : 0 }}
      >
        <span className="font-sans text-xs uppercase tracking-[0.3em] text-ink-soft">
          {reveal ? d.tapToReveal : d.tapToOpen}
        </span>
        <motion.span
          className="text-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          aria-hidden
        >
          👆
        </motion.span>
      </motion.div>
    </motion.section>
  );
}
