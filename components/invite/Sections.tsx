"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, MapPin, CalendarPlus, Navigation, Shirt, Sparkles, DoorOpen, Gift } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n";
import type { Gender, Settings, SiteData, Wish } from "@/lib/types";
import { imageUrl } from "@/lib/api";
import { directionsUrl, embedUrl } from "@/lib/maps";
import { Balloon, C, GoldDivider, Heart, Star } from "./Decor";

const EASE = [0.16, 1, 0.3, 1] as const;

export function InView({ children, delay = 0, className = "", y = 30 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ script, caps }: { script: string; caps?: string }) {
  return (
    <InView className="mb-8 text-center">
      {caps && <p className="mx-auto max-w-xs font-sans text-[10px] uppercase leading-relaxed tracking-[0.3em] text-ink-soft sm:max-w-none">{caps}</p>}
      <h2 className="font-script mt-3 text-5xl leading-tight text-ink rtl:mt-5 rtl:text-4xl rtl:leading-[1.5] sm:text-6xl rtl:sm:text-5xl">{script}</h2>
      <GoldDivider className="mt-3" />
    </InView>
  );
}

/* ---------------- Hero invitation card ---------------- */

export function HeroCard({ s, d }: { s: Settings; d: Dict }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const date = formatDate(s.event_date, s.language);
  const ar = s.language === "ar";

  const item = {
    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
  };

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center justify-center px-3 pb-10 pt-6">
      <motion.div style={{ y, opacity: fade }} className="card-oval relative w-full max-w-[540px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="relative overflow-hidden rounded-[28px] shadow-[0_40px_90px_-35px_rgba(78,61,48,0.45)] ring-1 ring-white/70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(s, "frame")} alt="" className="block aspect-[1055/1491] w-full select-none object-cover" draggable={false} fetchPriority="high" />

          <motion.div
            className="absolute inset-x-[19%] top-[14.5%] bottom-[42%] flex flex-col items-center justify-center text-center"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.14, delayChildren: 0.5 } } }}
          >
            <motion.p variants={item} className="font-sans uppercase text-ink-soft" style={{ fontSize: ar ? "4cqw" : "2.6cqw", letterSpacing: "0.32em" }}>
              {s.intro_line}
            </motion.p>
            <motion.h1 variants={item} className="font-display mt-[1.5cqw] leading-[1.05] text-ink" style={{ fontSize: ar ? "8.6cqw" : "8cqw", letterSpacing: "0.02em" }}>
              {s.title}
            </motion.h1>
            <motion.div variants={item} className="my-[2cqw] flex items-center gap-[2cqw]">
              <span className="gold-line" style={{ width: "12cqw" }} />
              <Heart size={14} color={C.gold} />
              <span className="gold-line" style={{ width: "12cqw" }} />
            </motion.div>
            <motion.p variants={item} className="font-script text-shimmer leading-[1.15]" style={{ fontSize: ar ? "7.4cqw" : "8.4cqw" }}>
              {s.baby_name}
            </motion.p>
            <motion.p variants={item} className="font-serif mt-[1.5cqw] italic text-ink-soft" style={{ fontSize: "3.6cqw", lineHeight: 1.35 }}>
              {s.tagline}
            </motion.p>
            <motion.div variants={item} className="mt-[2.5cqw] flex items-stretch justify-center text-ink" style={{ fontSize: ar ? "3cqw" : "2.5cqw" }}>
              <div className="px-[2.5cqw]">
                <p className="font-sans uppercase tracking-[0.2em] text-ink-soft">{date.weekday}</p>
                <p className="font-display" style={{ fontSize: "5cqw", lineHeight: 1.1 }}>
                  {date.day}
                </p>
                <p className="font-sans uppercase tracking-[0.15em]">{date.monthYear}</p>
              </div>
              <span className="w-px bg-gold/60" />
              <div className="flex flex-col justify-center px-[2.5cqw]">
                <p className="font-sans uppercase tracking-[0.2em] text-ink-soft">{d.time}</p>
                <p className="font-display" style={{ fontSize: "3.8cqw" }}>
                  {date.time}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {[
            [22, 12],
            [76, 9],
            [14, 60],
            [86, 55],
            [50, 6],
          ].map(([x, yy], i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute"
              style={{ left: `${x}%`, top: `${yy}%` }}
              animate={{ scale: [0.4, 1, 0.4], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
              transition={{ duration: 2.4, delay: i * 0.6, repeat: Infinity }}
            >
              <Sparkles size={16} className="text-gold" />
            </motion.div>
          ))}
        </motion.div>

        <motion.p className="mt-5 text-center font-sans text-[11px] uppercase tracking-[0.3em] text-ink-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          {d.hostedBy} <span className="font-script normal-case tracking-normal text-2xl text-ink">{s.parents}</span>
        </motion.p>
        <motion.div className="mx-auto mt-3 flex w-fit flex-col items-center text-ink-soft" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} aria-hidden>
          <span className="font-sans text-[10px] uppercase tracking-[0.3em]">{d.scrollHint}</span>
          <span className="mt-1 h-6 w-px bg-ink-soft/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ---------------- Countdown ---------------- */

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    done: ms === 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

const UNITS = ["days", "hours", "minutes", "seconds"] as const;

export function Countdown({ s, d }: { s: Settings; d: Dict }) {
  const target = new Date(s.event_date).getTime();
  const [left, setLeft] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setLeft(diff(target));
    const id = setInterval(() => setLeft(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (isNaN(target)) return null;

  return (
    <section className="relative px-5 py-16">
      <SectionTitle script={d.countdownTitle} />
      {left?.done ? (
        <InView className="text-center font-serif text-2xl italic">{d.itsToday}</InView>
      ) : (
        <div className="mx-auto grid max-w-md grid-cols-4 gap-3 sm:gap-4">
          {UNITS.map((u, i) => {
            const v = left ? left[u] : null;
            return (
              <InView key={u} delay={i * 0.08}>
                <div
                  className={`relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[22px] ${
                    i % 2 === 0 ? "bg-pink-soft" : "bg-blue-soft"
                  } shadow-[inset_0_-10px_20px_rgba(255,255,255,0.6),0_14px_30px_-18px_rgba(78,61,48,0.35)]`}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={v ?? "x"}
                      className="font-display text-3xl text-ink sm:text-4xl"
                      initial={{ y: -24, opacity: 0, rotateX: 80 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: 24, opacity: 0, rotateX: -80 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      {v === null ? "--" : String(v).padStart(2, "0")}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-soft">{d[u]}</span>
                </div>
              </InView>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Details ---------------- */

function icsFile(s: Settings) {
  const start = new Date(s.event_date);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (x: string) => x.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BabyReveal//EN",
    "BEGIN:VEVENT",
    `UID:${f(start)}@baby-reveal`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${esc(`${s.title} - ${s.baby_name}`)}`,
    `LOCATION:${esc([s.venue, s.address].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc([s.tagline, s.directions].filter(Boolean).join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

type Note = { icon: typeof Shirt; label: string; text: string; tone: string };

function InfoCard({ icon: Icon, label, text, tone }: Note) {
  return (
    <div className={`flex h-full items-start gap-4 rounded-[24px] p-5 ${tone}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-gold shadow-sm">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink-soft">{label}</p>
        <p className="mt-1 whitespace-pre-line font-serif text-lg leading-snug">{text}</p>
      </div>
    </div>
  );
}

export function Details({ s, d }: { s: Settings; d: Dict }) {
  const date = formatDate(s.event_date, s.language);

  function addToCalendar() {
    const blob = new Blob([icsFile(s)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gender-reveal.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const cards = [
    { icon: CalendarDays, label: d.date, main: date.day, sub: `${date.weekday} · ${date.monthYear}`, tone: "bg-pink-soft text-pink-deep" },
    { icon: Clock3, label: d.time, main: date.time, sub: "", tone: "bg-cream-2 text-gold" },
    { icon: MapPin, label: d.place, main: s.venue, sub: s.address, tone: "bg-blue-soft text-blue-deep" },
  ];
  const notes: Note[] = [];
  if (s.directions) notes.push({ icon: DoorOpen, label: d.directions, text: s.directions, tone: "bg-gradient-to-r from-blue-soft via-white to-blue-soft" });
  if (s.dress_code) notes.push({ icon: Shirt, label: d.dressCode, text: s.dress_code, tone: "bg-gradient-to-r from-pink-soft via-white to-blue-soft" });
  for (const x of s.extras) if (x.text) notes.push({ icon: Sparkles, label: x.title || d.moreInfo, text: x.text, tone: "glass" });

  return (
    <section className="relative px-5 py-16">
      <SectionTitle script={d.detailsTitle} />
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <InView key={c.label} delay={i * 0.1}>
            <motion.div whileHover={{ y: -6 }} className="glass flex h-full flex-col items-center rounded-[26px] px-5 py-7 text-center">
              <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${c.tone}`}>
                <c.icon size={22} strokeWidth={1.6} />
              </span>
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink-soft">{c.label}</p>
              <p className="font-display mt-2 text-2xl leading-tight">{c.main}</p>
              {c.sub && <p className="mt-1 font-sans text-xs text-ink-soft">{c.sub}</p>}
            </motion.div>
          </InView>
        ))}
      </div>

      <InView className="mt-6 flex flex-wrap justify-center gap-3" delay={0.2}>
        <button
          onClick={addToCalendar}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:opacity-90 active:scale-95"
        >
          <CalendarPlus size={16} /> {d.addToCalendar}
        </button>
        <a
          href={directionsUrl(s)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-ink/20 bg-white/70 px-5 py-3 font-sans text-xs font-medium uppercase tracking-[0.15em] text-ink transition hover:bg-white active:scale-95"
        >
          <Navigation size={16} /> {d.openMap}
        </a>
      </InView>

      {notes.length > 0 && (
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          {notes.map((n, i) => (
            <InView key={i} delay={0.05 * i}>
              <InfoCard {...n} />
            </InView>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Map ---------------- */

export function MapSection({ s, d }: { s: Settings; d: Dict }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <section className="relative px-5 py-16">
      <SectionTitle script={d.mapTitle} />
      <InView className="mx-auto max-w-3xl">
        <div className="glass overflow-hidden rounded-[28px] p-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-cream-2 sm:aspect-[16/9]">
            {!loaded && (
              <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <MapPin className="text-gold" size={32} />
              </motion.div>
            )}
            <iframe
              title={d.mapTitle}
              src={embedUrl(s, s.language)}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              onLoad={() => setLoaded(true)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight">{s.venue}</p>
              <p className="font-sans text-xs text-ink-soft">{[s.address, s.directions].filter(Boolean).join(" · ")}</p>
            </div>
            <a
              href={directionsUrl(s)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 font-sans text-xs font-medium text-cream active:scale-95"
            >
              <Navigation size={14} /> {d.openInMaps}
            </a>
          </div>
        </div>
      </InView>
    </section>
  );
}

/* ---------------- Prize ---------------- */

export function PrizeBadge({ text, d }: { text: string; d: Dict }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 160, damping: 14 }}
      className="relative mx-auto flex max-w-md items-center gap-3 overflow-hidden rounded-[22px] border border-gold/40 bg-gradient-to-r from-pink-soft via-white to-blue-soft px-4 py-3"
    >
      <motion.span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gold shadow"
        animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <Gift size={20} />
      </motion.span>
      <div className="min-w-0">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{d.prizeTitle}</p>
        <p className="font-serif text-lg font-semibold leading-snug">{text}</p>
      </div>
    </motion.div>
  );
}

/* ---------------- Vote meter ---------------- */

export function VoteMeter({ data, d, onPick }: { data: SiteData; d: Dict; onPick: (g: Gender) => void }) {
  const s = data.settings;
  const v = data.votes;
  const total = v ? v.boy + v.girl : 0;
  const boyPct = total ? Math.round((v!.boy / total) * 100) : 50;

  const bear = (g: Gender) => (
    <motion.button
      type="button"
      onClick={() => onPick(g)}
      className="soft-mask w-[30%] max-w-[180px] cursor-pointer"
      animate={{ y: [0, -10, 0], rotate: [0, g === "boy" ? -2 : 2, 0] }}
      transition={{ duration: 4, delay: g === "girl" ? 1 : 0, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      aria-label={g === "boy" ? d.boy : d.girl}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl(s, g === "boy" ? "bear_boy" : "bear_girl")} alt="" className="w-full" loading="lazy" />
    </motion.button>
  );

  return (
    <section className="relative overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-blue-soft),transparent_40%,transparent_60%,var(--color-pink-soft))] rtl:bg-[linear-gradient(270deg,var(--color-blue-soft),transparent_40%,transparent_60%,var(--color-pink-soft))]" />
      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-2">
          {bear("boy")}
          <InView className="flex-1 pb-6 text-center">
            <p className="font-script leading-tight">
              <span className="block text-5xl text-blue-deep sm:text-7xl">{d.boy}</span>
              <span className="block text-2xl text-gold sm:text-3xl">{d.or}</span>
              <span className="block text-5xl text-pink-deep sm:text-7xl">{d.girl}</span>
            </p>
            <p className="mt-4 font-display text-xs tracking-[0.25em] text-ink-soft sm:text-sm">{d.castVote.toUpperCase()}</p>
          </InView>
          {bear("girl")}
        </div>

        <div className="gold-line my-6" />

        {v ? (
          <InView>
            <div className="flex justify-between font-sans text-sm" dir="ltr">
              <span className="font-semibold text-blue-deep">
                {d.boy} · {boyPct}%
              </span>
              <span className="font-semibold text-pink-deep">
                {100 - boyPct}% · {d.girl}
              </span>
            </div>
            <div className="relative mt-3 flex h-5 overflow-hidden rounded-full bg-white shadow-inner" dir="ltr">
              <motion.div
                className="h-full bg-gradient-to-r from-blue to-blue-deep"
                initial={{ width: "50%" }}
                whileInView={{ width: `${boyPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: EASE }}
              />
              <div className="h-full flex-1 bg-gradient-to-r from-pink-deep to-pink" />
              <motion.span
                className="absolute top-1/2 -translate-y-1/2"
                initial={{ left: "calc(50% - 10px)" }}
                whileInView={{ left: `calc(${boyPct}% - 10px)` }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: EASE }}
              >
                <Heart size={20} color="#fff" />
              </motion.span>
            </div>
            <p className="mt-3 text-center font-sans text-xs text-ink-soft">{total === 0 ? d.noVotesYet : `${total} ${total === 1 ? d.vote : d.votes}`}</p>
          </InView>
        ) : (
          <InView className="text-center font-serif text-xl italic text-ink-soft">{d.resultsSecret}</InView>
        )}

        {!data.revealed && (
          <div className="mt-8">
            <PrizeBadge text={s.prize} d={d} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Wishes ---------------- */

export function Wishes({ wishes, d }: { wishes: Wish[]; d: Dict }) {
  if (!wishes.length) return null;
  return (
    <section className="relative px-5 py-16">
      <SectionTitle script={d.wishesTitle} />
      <div className="mx-auto max-w-4xl columns-1 gap-4 sm:columns-2 lg:columns-3">
        {wishes.map((w, i) => (
          <InView key={i} delay={Math.min(i, 8) * 0.06} className="mb-4 break-inside-avoid">
            <motion.div
              whileHover={{ rotate: i % 2 ? 1 : -1, y: -4 }}
              className={`relative rounded-[22px] p-5 shadow-[0_14px_30px_-20px_rgba(78,61,48,0.4)] ${w.guess === "boy" ? "bg-blue-soft" : "bg-pink-soft"}`}
            >
              <Heart size={18} color={w.guess === "boy" ? C.blue : C.pink} className="absolute end-4 top-4" />
              <p dir="auto" className="whitespace-pre-line pe-6 font-serif text-lg leading-snug">
                {w.message}
              </p>
              <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
                — <bdi>{w.name}</bdi> <span className={w.guess === "boy" ? "text-blue-deep" : "text-pink-deep"}>· {w.guess === "boy" ? d.boy : d.girl}</span>
              </p>
            </motion.div>
          </InView>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

export function Footer({ s }: { s: Settings }) {
  return (
    <footer className="relative mt-6 overflow-hidden">
      <InView className="relative z-10 px-6 text-center">
        <p className="font-script text-shimmer text-4xl leading-snug sm:text-5xl">{s.closing_note}</p>
        <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.3em] text-ink-soft">{s.parents}</p>
      </InView>
      <div className="relative mx-auto -mt-2 max-w-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(s, "scene")}
          alt=""
          loading="lazy"
          className="w-full"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 22%, #000 80%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, #000 22%, #000 80%, transparent 100%)",
          }}
        />
        <motion.div className="absolute left-[6%] top-[8%]" animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }}>
          <Balloon color="pink" size={34} dotted />
        </motion.div>
        <motion.div className="absolute right-[6%] top-[4%]" animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity }}>
          <Balloon color="blue" size={38} />
        </motion.div>
        <motion.div className="absolute left-1/2 top-[2%]" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
          <Star size={18} />
        </motion.div>
      </div>
    </footer>
  );
}
