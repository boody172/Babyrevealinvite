"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import type { Gender, SiteData } from "@/lib/types";
import { t } from "@/lib/i18n";
import { getSite } from "@/lib/api";
import Intro from "./Intro";
import { Countdown, Details, Footer, HeroCard, VoteMeter, Wishes, InView } from "./Sections";
import Rsvp, { burstConfetti } from "./Rsvp";
import { FloatingField, Balloon } from "./Decor";

const DEVICE_KEY = "baby-reveal-device";

function getDevice(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `nostore-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

function RevealHero({ data, gender }: { data: SiteData; gender: Gender }) {
  const d = t(data.settings.language);
  const boy = gender === "boy";
  const v = data.votes;
  const total = v ? v.boy + v.girl : 0;
  const right = v ? v[gender] : 0;
  return (
    <section className={`relative overflow-hidden px-5 pb-16 pt-20 text-center ${boy ? "bg-blue-soft" : "bg-pink-soft"}`}>
      <FloatingField density={16} />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4 font-sans text-xs uppercase tracking-[0.4em] text-ink-soft"
      >
        {data.settings.baby_name}
      </motion.p>
      <motion.h1
        initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 10, delay: 0.2 }}
        className={`relative font-script text-7xl leading-[1.15] sm:text-9xl ${boy ? "text-blue-deep" : "text-pink-deep"}`}
      >
        {d.itsA} {boy ? d.boy : d.girl}!
      </motion.h1>
      <motion.div
        className="soft-mask relative mx-auto mt-6 w-48 sm:w-60"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: [0, -12, 0], opacity: 1 }}
        transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }, opacity: { delay: 0.6 } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boy ? "/img/bear-boy.webp" : "/img/bear-girl.webp"} alt="" className="w-full" />
      </motion.div>
      {total > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="relative mt-6 font-serif text-2xl italic">
          {right} / {total} {d.guessedRight}
        </motion.p>
      )}
    </section>
  );
}

export default function Invitation({ initial }: { initial: SiteData | null }) {
  const [data, setData] = useState<SiteData | null>(initial);
  const [opened, setOpened] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [guess, setGuess] = useState<Gender | null>(null);
  const [failed, setFailed] = useState(false);
  const rsvpRef = useRef<HTMLElement>(null);

  const load = useCallback(async (dev: string | null) => {
    try {
      const fresh = await getSite(dev);
      setData(fresh);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const dev = getDevice();
    setDevice(dev);
    load(dev);
    const id = setInterval(() => load(dev), 30000);
    return () => clearInterval(id);
  }, [load]);

  const s = data?.settings;
  const lang = s?.language ?? "en";
  const d = t(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
  }, [opened]);

  function handleOpen() {
    setOpened(true);
    window.scrollTo({ top: 0 });
    if (data?.revealed && data.gender) setTimeout(() => burstConfetti(data.gender), 300);
    else setTimeout(() => burstConfetti(), 400);
  }

  function pick(g: Gender) {
    setGuess(g);
    rsvpRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function share() {
    const url = window.location.origin;
    const text = `${s?.title ?? ""} — ${d.boyOrGirl}`;
    try {
      if (navigator.share) await navigator.share({ title: text, url });
      else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  }

  if (!data || !s) {
    return (
      <main className="watercolor-bg flex min-h-[100svh] flex-col items-center justify-center gap-4 px-6 text-center">
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex gap-2">
          <Balloon color="pink" size={36} />
          <Balloon color="blue" size={36} />
        </motion.div>
        {failed && (
          <button onClick={() => load(device)} className="font-sans text-sm text-ink-soft underline">
            Retry · إعادة المحاولة
          </button>
        )}
      </main>
    );
  }

  const revealed = data.revealed && data.gender;

  return (
    <main className="watercolor-bg paper-noise relative min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"}>
      <AnimatePresence>
        {!opened && <Intro key="intro" d={d} onOpen={handleOpen} reveal={revealed ? data.gender : undefined} babyName={s.baby_name} />}
      </AnimatePresence>

      <FloatingField density={12} />

      {opened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative">
          {revealed && <RevealHero data={data} gender={data.gender!} />}
          <HeroCard s={s} d={d} />
          {s.show_countdown && !revealed && <Countdown s={s} d={d} />}
          {s.show_details && <Details s={s} d={d} />}
          {s.show_vote && <VoteMeter data={data} d={d} onPick={revealed ? () => {} : pick} />}
          {!revealed && (
            <Rsvp
              ref={rsvpRef}
              data={data}
              d={d}
              device={device}
              guess={guess}
              setGuess={setGuess}
              onDone={(m) => {
                setData((prev) => (prev ? { ...prev, mine: m } : prev));
                setTimeout(() => load(device), 800);
              }}
            />
          )}
          {s.show_wishes && data.wishes && <Wishes wishes={data.wishes} d={d} />}

          <InView className="flex justify-center pb-4 pt-6">
            <button
              onClick={share}
              className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.2em] text-ink-soft shadow-sm transition hover:bg-white active:scale-95"
            >
              <Share2 size={14} /> {d.share}
            </button>
          </InView>
          <Footer s={s} />
        </motion.div>
      )}
    </main>
  );
}
